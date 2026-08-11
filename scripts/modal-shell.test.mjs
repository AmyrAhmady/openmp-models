import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const shellSource = await readFile(
    new URL('../src/components/MobileModal/index.tsx', import.meta.url),
    'utf8'
);
const focusSource = await readFile(
    new URL('../src/hooks/useModalFocus.ts', import.meta.url),
    'utf8'
);
const modalSources = await Promise.all(
    [
        '../src/components/Menu/Mobile/ModelList.tsx',
        '../src/components/Menu/Mobile/ModelInfoMobile.tsx',
        '../src/components/Menu/Mobile/BGColorPicker.tsx',
    ].map((path) => readFile(new URL(path, import.meta.url), 'utf8'))
);

test('mobile dialogs share one dismissal and focus boundary', () => {
    assert.match(shellSource, /useModalEscape\(visible, onRequestClose\)/);
    assert.match(shellSource, /useModalFocus\(visible, modalRef, initialFocusSelector\)/);
    assert.match(shellSource, /onDismiss=\{onRequestClose\}/);
    assert.match(shellSource, /onPress=\{onRequestClose\}/);
    assert.match(focusSource, /element\.tabIndex >= 0/);
    assert.match(shellSource, /role: 'dialog'/);
    assert.match(shellSource, /accessibilityViewIsModal/);

    for (const source of modalSources) {
        assert.match(source, /<MobileModal/);
        assert.doesNotMatch(source, /<Modal[\s>]/);
        assert.doesNotMatch(source, /useModalEscape\(/);
        assert.doesNotMatch(source, /useModalFocus\(/);
    }
});

const colorPickerSource = await readFile(
    new URL('../src/components/ColorPicker/index.tsx', import.meta.url),
    'utf8'
);
const modalListSource = await readFile(
    new URL('../src/components/ModalList/index.tsx', import.meta.url),
    'utf8'
);

test('color controls expose selected state and desktop menus use dialog semantics', () => {
    assert.match(colorPickerSource, /selectedColor\?: string/);
    assert.match(
        colorPickerSource,
        /accessibilityState=\{\{ selected: color === selectedColor \}\}/
    );
    assert.match(modalListSource, /<MobileModal/);
    assert.match(modalListSource, /placement=\{isMobile \? 'bottom' : 'center'\}/);
});
