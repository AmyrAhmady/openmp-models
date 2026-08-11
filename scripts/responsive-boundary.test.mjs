import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pageSource = await readFile(new URL('../src/pages/index.tsx', import.meta.url), 'utf8');
const hookSource = await readFile(
    new URL('../src/hooks/useResponsiveView.ts', import.meta.url),
    'utf8'
);

test('responsive layout is owned by the client viewport hook', () => {
    assert.match(pageSource, /useResponsiveView/);
    assert.doesNotMatch(pageSource, /getInitialProps|NextPageContext|user-agent/);
    assert.match(hookSource, /addEventListener\('resize'/);
    assert.match(hookSource, /removeEventListener\('resize'/);
    assert.match(hookSource, /MOBILE_VIEW_BREAKPOINT\s*=\s*1200/);
});
