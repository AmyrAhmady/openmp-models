import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const sourcePath = new URL('../src/rendering/renderScheduler.ts', import.meta.url);
const source = await readFile(sourcePath, 'utf8');
const transpiled = ts.transpileModule(source, {
    compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2020,
    },
}).outputText;
const moduleUrl = `data:text/javascript;base64,${Buffer.from(transpiled).toString('base64')}`;
const { default: RenderScheduler } = await import(moduleUrl);

function createHarness() {
    let nextFrameId = 0;
    let hidden = false;
    const frames = new Map();
    const cancelled = [];
    const rendered = [];
    const scheduler = new RenderScheduler((spinning) => rendered.push(spinning), {
        requestFrame: (callback) => {
            const frameId = ++nextFrameId;
            frames.set(frameId, callback);
            return frameId;
        },
        cancelFrame: (frameId) => {
            cancelled.push(frameId);
            frames.delete(frameId);
        },
        isHidden: () => hidden,
    });

    return {
        scheduler,
        frames,
        cancelled,
        rendered,
        setHidden(value) {
            hidden = value;
        },
        flushNextFrame() {
            const next = frames.entries().next().value;
            assert.ok(next, 'expected a scheduled frame');
            const [frameId, callback] = next;
            frames.delete(frameId);
            callback();
        },
    };
}

test('render scheduler coalesces demand renders', () => {
    const harness = createHarness();

    harness.scheduler.request();
    harness.scheduler.request();
    assert.equal(harness.frames.size, 1);

    harness.flushNextFrame();
    assert.deepEqual(harness.rendered, [false]);
    assert.equal(harness.frames.size, 0);
});

test('render scheduler continues spin and returns to one demand frame', () => {
    const harness = createHarness();

    harness.scheduler.setSpinning(true);
    harness.flushNextFrame();
    assert.deepEqual(harness.rendered, [true]);
    assert.equal(harness.frames.size, 1);

    harness.scheduler.setSpinning(false);
    assert.equal(harness.frames.size, 1);
    harness.flushNextFrame();
    assert.deepEqual(harness.rendered, [true, false]);
    assert.equal(harness.frames.size, 0);
});

test('render scheduler skips hidden frames and cancels on dispose', () => {
    const harness = createHarness();

    harness.setHidden(true);
    harness.scheduler.request();
    assert.equal(harness.frames.size, 0);

    harness.setHidden(false);
    harness.scheduler.request();
    assert.equal(harness.frames.size, 1);
    harness.scheduler.dispose();
    assert.equal(harness.frames.size, 0);
    assert.equal(harness.cancelled.length, 1);

    harness.scheduler.request();
    assert.equal(harness.frames.size, 0);
});
