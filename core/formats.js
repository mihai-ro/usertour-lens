// Lens — alternate selector formats

// Cached lookups (guard against redeclaration in iframes)
if (typeof _LN_INPUT_ROLE === 'undefined') {
  const _LN_INPUT_ROLE = new Map([
    ['checkbox', 'checkbox'],
    ['radio', 'radio'],
    ['submit', 'button'],
    ['button', 'button'],
    ['reset', 'button'],
    ['range', 'slider'],
    ['search', 'searchbox'],
  ]);

  const _LN_TAG_ROLE = new Map([
    ['button', 'button'],
    ['a', 'link'],
    ['h1', 'heading'],
    ['h2', 'heading'],
    ['h3', 'heading'],
    ['h4', 'heading'],
    ['h5', 'heading'],
    ['h6', 'heading'],
    ['nav', 'navigation'],
    ['main', 'main'],
    ['header', 'banner'],
    ['footer', 'contentinfo'],
    ['aside', 'complementary'],
    ['form', 'form'],
    ['dialog', 'dialog'],
    ['table', 'grid'],
    ['ul', 'list'],
    ['ol', 'list'],
    ['li', 'listitem'],
    ['select', 'combobox'],
    ['textarea', 'textbox'],
    ['details', 'group'],
    ['summary', 'button'],
    ['img', 'img'],
    ['meter', 'meter'],
    ['progress', 'progressbar'],
  ]);

  const _LN_HEADING = /^h[1-6]$/;
  const _LN_FORM_TAGS = new Set(['input', 'select', 'textarea']);
  const _LN_BUTTON_TYPES = new Set(['submit', 'reset', 'button']);
}

// XPath

function LN_buildXPath(el) {
  const tag = el.tagName.toLowerCase();

  // Test attributes
  for (const a of LN_CONFIG.TEST_ATTRS) {
    const v = el.getAttribute(a);
    if (v) return `//*[@${a}="${v}"]`;
  }

  // Clean unique ID
  if (_ln_isCleanId(el.id)) return `//*[@id="${el.id}"]`;

  // aria-label (unique)
  const al = el.getAttribute('aria-label');
  if (al) {
    const xpath = `//${tag}[@aria-label="${al}"]`;
    if (_ln_xpathCount(xpath) === 1) return xpath;
  }

  // name (unique)
  const nm = el.getAttribute('name');
  if (nm) {
    const xpath = `//${tag}[@name="${nm}"]`;
    if (_ln_xpathCount(xpath) === 1) return xpath;
  }

  // Best data-* attribute (unique)
  const bestData = _ln_bestDataAttr(el);
  if (bestData) {
    const xpath = `//*[@${bestData.name}="${bestData.value}"]`;
    if (_ln_xpathCount(xpath) === 1) return xpath;
  }

  // Positional fallback
  return _ln_xpathPath(el);
}

function _ln_xpathCount(xpath) {
  try {
    return document.evaluate(
      xpath,
      document,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    ).snapshotLength;
  } catch {
    return null;
  }
}

function _ln_xpathPath(el) {
  const parts = [];
  let cur = el;
  while (cur && cur !== document.documentElement) {
    if (cur.nodeType !== Node.ELEMENT_NODE) {
      cur = cur.parentElement;
      continue;
    }
    const tag = cur.tagName.toLowerCase();
    if (!cur.parentElement) {
      parts.unshift(tag);
      break;
    }
    const sibs = Array.from(cur.parentElement.children).filter(
      (c) => c.tagName === cur.tagName
    );
    parts.unshift(sibs.length > 1 ? `${tag}[${sibs.indexOf(cur) + 1}]` : tag);
    cur = cur.parentElement;
  }
  return '/' + parts.join('/');
}

// Playwright locator

function LN_buildPlaywrightLocator(el) {
  const tag = el.tagName.toLowerCase();

  // 1. data-testid (Playwright's default getByTestId attribute)
  const testId = el.getAttribute('data-testid');
  if (testId) return `getByTestId('${_pw(testId)}')`;

  // Other test attrs → use locator() with attribute selector
  for (const a of LN_CONFIG.TEST_ATTRS) {
    if (a === 'data-testid') continue;
    const v = el.getAttribute(a);
    if (v) return `locator('[${a}="${_pw(v)}"]')`;
  }

  // 2. Role + accessible name
  const role = el.getAttribute('role') || _ln_implicitRole(el);
  const al = el.getAttribute('aria-label');
  const labelledBy = el.getAttribute('aria-labelledby');
  const labelledText = labelledBy
    ? document.getElementById(labelledBy)?.textContent?.trim()
    : null;
  const name = al || labelledText;

  if (role && name) return `getByRole('${role}', { name: '${_pw(name)}' })`;

  // 3. Label text for form controls
  if (_LN_FORM_TAGS.has(tag)) {
    const label = _ln_associatedLabel(el);
    if (label) return `getByLabel('${_pw(label)}')`;
    const ph = el.getAttribute('placeholder');
    if (ph) return `getByPlaceholder('${_pw(ph)}')`;
  }

  // 4. Visible text for buttons and links
  if (tag === 'button' || tag === 'a' || tag === 'summary') {
    const text = _ln_visibleText(el);
    if (text && text.length < 80) {
      const r = tag === 'a' ? 'link' : 'button';
      return `getByRole('${r}', { name: '${_pw(text)}' })`;
    }
  }

  // 5. Headings
  if (_LN_HEADING.test(tag)) {
    const text = _ln_visibleText(el);
    if (text && text.length < 80)
      return `getByRole('heading', { name: '${_pw(text)}' })`;
  }

  // 6. Images by alt text
  if (tag === 'img') {
    const alt = el.getAttribute('alt');
    if (alt) return `getByAltText('${_pw(alt)}')`;
  }

  // 7. title attribute
  const title = el.getAttribute('title');
  if (title) return `getByTitle('${_pw(title)}')`;

  // 8. Fallback to CSS locator
  return `locator('${LN_buildSelector(el).selector}')`;
}

function _ln_implicitRole(el) {
  const tag = el.tagName.toLowerCase();
  if (tag === 'input') {
    const type = el.getAttribute('type');
    return _LN_INPUT_ROLE.get(type) ?? 'textbox';
  }
  return _LN_TAG_ROLE.get(tag) ?? null;
}

function _ln_associatedLabel(el) {
  if (el.id) {
    try {
      const lbl = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (lbl) return lbl.textContent.trim();
    } catch {}
  }
  const parent = el.closest('label');
  if (parent) {
    // Get label text without the input's own value
    return Array.from(parent.childNodes)
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent.trim())
      .join(' ')
      .trim();
  }
  return null;
}

function _ln_visibleText(el) {
  return el.textContent.trim().replace(/\s+/g, ' ');
}

// Escape single quotes for Playwright string literals
function _pw(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

// Match counting

function LN_countCSS(sel) {
  try {
    return document.querySelectorAll(sel).length;
  } catch {
    return null;
  }
}

const LN_countXPath = _ln_xpathCount;
