const fs = require('fs');
const path = require('path');

const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(
      `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}${
        message ? ' - ' + message : ''
      }`
    );
  }
}

global.CSS = {
  escape: (s) => s.replace(/([^\w-])/g, '\\$1').replace(/^(\d)/, '\\$1'),
};

const domUtilsCode = fs.readFileSync(
  path.join(__dirname, '../core/dom-utils.js'),
  'utf8'
);
eval(domUtilsCode);

test('LN_esc escapes special chars', () => {
  assertEqual(LN_esc('foo.bar'), 'foo\\.bar');
});

test('LN_esc escapes leading digit', () => {
  assertEqual(LN_esc('123foo'), '\\123foo');
});

test('LN_esc escapes space', () => {
  assertEqual(LN_esc('foo bar'), 'foo\\ bar');
});

test('LN_esc handles already-safe strings', () => {
  assertEqual(LN_esc('foo'), 'foo');
  assertEqual(LN_esc('foo-bar'), 'foo-bar');
});

test('LN_escHtml escapes &', () => {
  assertEqual(LN_escHtml('foo&bar'), 'foo&amp;bar');
});

test('LN_escHtml escapes <', () => {
  assertEqual(LN_escHtml('foo<bar'), 'foo&lt;bar');
});

test('LN_escHtml escapes >', () => {
  assertEqual(LN_escHtml('foo>bar'), 'foo&gt;bar');
});

test('LN_escHtml escapes quote', () => {
  assertEqual(LN_escHtml('foo"bar'), 'foo&quot;bar');
});

test('LN_escHtml handles plain text', () => {
  assertEqual(LN_escHtml('hello world'), 'hello world');
});

console.log('Running tests...\n');

for (const { name, fn } of tests) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`    ${err.message}`);
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
