import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const sourcePath = new URL('../src/catalog/catalogQuery.ts', import.meta.url);
const source = await readFile(sourcePath, 'utf8');
const transpiled = ts.transpileModule(source, {
    compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2020,
    },
}).outputText;
const moduleUrl = `data:text/javascript;base64,${Buffer.from(transpiled).toString('base64')}`;
const { CatalogQueryController, isAbortError } = await import(moduleUrl);

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

test('catalog query debounces search and cancels the replaced request', async () => {
    const searches = [];
    const client = {
        list: async () => ({ list: [] }),
        search: async (type, query, signal) => {
            searches.push({ type, query, aborted: signal.aborted });
            return { results: [{ id: 1, name: query }] };
        },
    };
    const controller = new CatalogQueryController('vehicle', client);

    const firstSearch = controller.search('land');
    const secondSearch = controller.search('landstalker');

    await assert.rejects(firstSearch, (error) => isAbortError(error));
    await wait(220);

    assert.deepEqual(await secondSearch, [{ id: 1, name: 'landstalker' }]);
    assert.deepEqual(searches, [{ type: 'vehicle', query: 'landstalker', aborted: false }]);
    controller.dispose();
});

test('catalog query aborts active list and search requests on type changes', async () => {
    const listSignals = [];
    const searchSignals = [];
    const client = {
        list: (_type, signal) => {
            listSignals.push(signal);
            return new Promise(() => {});
        },
        search: (_type, _query, signal) => {
            searchSignals.push(signal);
            return new Promise((_resolve, reject) => {
                signal.addEventListener(
                    'abort',
                    () => {
                        const error = new Error('aborted');
                        error.name = 'AbortError';
                        reject(error);
                    },
                    { once: true }
                );
            });
        },
    };
    const controller = new CatalogQueryController('vehicle', client);

    controller.loadList();
    const search = controller.search('police');
    await wait(220);
    controller.setModelType('skin');

    await assert.rejects(search, (error) => isAbortError(error));
    assert.equal(listSignals.length, 1);
    assert.equal(listSignals[0].aborted, true);
    assert.equal(searchSignals.length, 1);
    assert.equal(searchSignals[0].aborted, true);
    controller.dispose();
});
