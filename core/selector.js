// Lens — selector engine

// Cached lookups

const _LN_SEMANTIC_KEYS = new Set(LN_CONFIG.SEMANTIC_DATA_KEYS);
const _LN_TEST_SET = new Set(LN_CONFIG.TEST_ATTRS);
const _LN_FORM_TAGS = new Set(['input', 'select', 'textarea']);
const _LN_BUTTON_TYPES = new Set(['submit', 'reset', 'button']);
const _LN_SEMANTIC_TAGS = new Set(LN_CONFIG.SEMANTIC_TAGS);

// Precompiled regex
const _LN_HEX_HASH = /^[a-f0-9]{5,}$/i;
const _LN_CSS_IN_JS = /^(css|sc|jsx|emotion)-/i;
const _LN_CSS_MODULES = /_{2}[a-zA-Z0-9_-]{4,}$/;
const _LN_AUTO_ID = /^[a-zA-Z]+-d+$/;
const _LN_CLEAN_ID = /^d/;
const _LN_UUID = /[a-f0-9]{8,}/i;
const _LN_UUID_DASH = /^[a-f0-9-]{8,}$/;
const _LN_NUMERIC = /^d+$/;
const _LN_CLEAN_VALUE = /^[a-z][a-z0-9_-]*$/i;
const _LN_HAS_SPACE = /\s/;
const _LN_UPPER = /[A-Z]/;
const _LN_DIGIT = /\d/;
const _LN_LOWER = /[a-z]/;

// Helpers

function _ln_matches(sel, n = 1) {
  try {
    return document.querySelectorAll(sel).length === n;
  } catch {
    return false;
  }
}

function _ln_isCleanId(id) {
  if (!id || id.length > 80) return false;
  if (_LN_CLEAN_ID.test(id)) return false;
  if (_LN_UUID.test(id)) return false;
  if (_LN_AUTO_ID.test(id)) return false;
  return true;
}

function _ln_isStableClass(c) {
  if (!c || c.length < 2) return false;
  if (_LN_HEX_HASH.test(c)) return false;
  if (_LN_CSS_IN_JS.test(c)) return false;
  if (_LN_CSS_MODULES.test(c)) return false;
  const lastSeg = c.slice(c.lastIndexOf('-') + 1);
  if (
    c.includes('-') &&
    lastSeg.length >= 5 &&
    _LN_UPPER.test(lastSeg) &&
    _LN_DIGIT.test(lastSeg)
  )
    return false;
  if (
    c.length > 24 &&
    _LN_UPPER.test(c) &&
    _LN_DIGIT.test(c) &&
    _LN_LOWER.test(c)
  )
    return false;
  return true;
}

// Scans ALL data-* attributes, scores each for semantic quality, returns best.
// Test attrs are excluded — they have higher priority and are handled above.
function _ln_bestDataAttr(el) {
  if (!el || !el.attributes) return null;
  let best = null;
  let bestScore = 0;

  for (const { name, value } of el.attributes) {
    if (!name.startsWith('data-')) continue;
    if (_LN_TEST_SET.has(name)) continue;
    if (!value || value.length > 80) continue;
    if (_LN_UUID_DASH.test(value)) continue;
    if (_LN_NUMERIC.test(value)) continue;

    let score = 1;
    for (const seg of name.slice(5).split(/[-_]/)) {
      if (_LN_SEMANTIC_KEYS.has(seg)) {
        score += 3;
        break;
      }
    }
    if (value.length <= 40) score += 1;
    if (_LN_CLEAN_VALUE.test(value)) score += 1;
    if (!_LN_HAS_SPACE.test(value)) score += 1;

    if (score > bestScore) {
      bestScore = score;
      best = { name, value };
    }
  }
  return best;
}

// Describe — returns best selector for a single element

function _ln_describe(el) {
  if (!el || !el.tagName) return null;
  const tag = el.tagName.toLowerCase();

  // HIGH: test / automation attributes (developer intent, no uniqueness check)
  for (const a of _LN_TEST_SET) {
    const v = el.getAttribute(a);
    if (v)
      return {
        selector: [`[${a}="${LN_esc(v)}"]`],
        confidence: 'high',
        reason: `Test attr: ${a}`,
      };
  }

  // HIGH: clean unique ID
  if (_ln_isCleanId(el.id)) {
    const s = '#' + LN_esc(el.id);
    if (_ln_matches(s))
      return { selector: s, confidence: 'high', reason: 'Unique #id' };
  }

  // HIGH: aria-label (unique)
  const al = el.getAttribute('aria-label');
  if (al) {
    const s = `${tag}[aria-label="${LN_esc(al)}"]`;
    if (_ln_matches(s))
      return { selector: s, confidence: 'high', reason: 'aria-label (unique)' };
  }

  // HIGH: label[for]
  if (tag === 'label') {
    const f = el.getAttribute('for');
    if (f) {
      const s = `label[for="${LN_esc(f)}"]`;
      if (_ln_matches(s))
        return {
          selector: s,
          confidence: 'high',
          reason: 'label[for] (unique)',
        };
    }
  }

  // HIGH: type + name combo for form controls (most specific)
  const nm = el.getAttribute('name');
  if (nm && _LN_FORM_TAGS.has(tag)) {
    const type = el.getAttribute('type');
    if (type) {
      const s = `${tag}[type="${type}"][name="${LN_esc(nm)}"]`;
      if (_ln_matches(s))
        return {
          selector: s,
          confidence: 'high',
          reason: 'type + name (unique)',
        };
    }
  }
  if (nm) {
    const s = `${tag}[name="${LN_esc(nm)}"]`;
    if (_ln_matches(s))
      return { selector: s, confidence: 'high', reason: 'name attr (unique)' };
  }

  // HIGH: submit/reset/button input with value
  if (tag === 'input') {
    const type = el.getAttribute('type');
    if (type && _LN_BUTTON_TYPES.has(type)) {
      const val = el.getAttribute('value');
      if (val) {
        const s = `input[type="${type}"][value="${LN_esc(val)}"]`;
        if (_ln_matches(s))
          return {
            selector: s,
            confidence: 'high',
            reason: 'Input button value (unique)',
          };
      }
    }
  }

  // HIGH: best scored data-* attribute (unique)
  const bestData = _ln_bestDataAttr(el);
  if (bestData) {
    const s = `[${bestData.name}="${LN_esc(bestData.value)}"]`;
    if (_ln_matches(s))
      return {
        selector: s,
        confidence: 'high',
        reason: `Semantic attr: ${bestData.name}`,
      };
  }

  // MEDIUM: href (unique, non-trivial)
  if (tag === 'a') {
    const h = el.getAttribute('href');
    if (h && h !== '#' && h.length < 120 && !h.startsWith('javascript')) {
      const s = `a[href="${LN_esc(h)}"]`;
      if (_ln_matches(s))
        return { selector: s, confidence: 'medium', reason: 'href (unique)' };
    }
  }

  // MEDIUM: img alt (unique)
  if (tag === 'img') {
    const alt = el.getAttribute('alt');
    if (alt && alt.length < 80) {
      const s = `img[alt="${LN_esc(alt)}"]`;
      if (_ln_matches(s))
        return {
          selector: s,
          confidence: 'medium',
          reason: 'alt text (unique)',
        };
    }
  }

  // MEDIUM: placeholder (unique)
  if (_LN_FORM_TAGS.has(tag)) {
    const ph = el.getAttribute('placeholder');
    if (ph) {
      const s = `${tag}[placeholder="${LN_esc(ph)}"]`;
      if (_ln_matches(s))
        return {
          selector: s,
          confidence: 'medium',
          reason: 'placeholder (unique)',
        };
    }
  }

  // MEDIUM: title attribute (unique)
  const title = el.getAttribute('title');
  if (title && title.length < 80) {
    const s = `${tag}[title="${LN_esc(title)}"]`;
    if (_ln_matches(s))
      return {
        selector: s,
        confidence: 'medium',
        reason: 'title attr (unique)',
      };
  }

  // MEDIUM: role + aria-label (unique combo)
  const role = el.getAttribute('role');
  if (role && al) {
    const s = `[role="${role}"][aria-label="${LN_esc(al)}"]`;
    if (_ln_matches(s))
      return {
        selector: s,
        confidence: 'medium',
        reason: 'role + aria-label (unique)',
      };
  }

  // MEDIUM: role alone (unique)
  if (role) {
    const s = `${tag}[role="${role}"]`;
    if (_ln_matches(s))
      return {
        selector: s,
        confidence: 'medium',
        reason: 'ARIA role (unique)',
      };
  }

  // MEDIUM: typed input (unique)
  if (tag === 'input') {
    const type = el.getAttribute('type');
    if (type && type !== 'text' && type !== 'hidden') {
      const s = `input[type="${type}"]`;
      if (_ln_matches(s))
        return {
          selector: s,
          confidence: 'medium',
          reason: `input[type=${type}] (unique)`,
        };
    }
  }
  if (tag === 'button') {
    const type = el.getAttribute('type');
    if (type && _LN_BUTTON_TYPES.has(type)) {
      const s = `button[type="${type}"]`;
      if (_ln_matches(s))
        return {
          selector: s,
          confidence: 'medium',
          reason: `button[type=${type}] (unique)`,
        };
    }
  }

  // MEDIUM: aria-label (descriptive even if not unique)
  if (al) {
    return {
      selector: `${tag}[aria-label="${LN_esc(al)}"]`,
      confidence: 'medium',
      reason: 'aria-label (not unique)',
    };
  }

  // MEDIUM / LOW: stable class combination
  const sc = Array.from(el.classList).filter(_ln_isStableClass);
  if (sc.length) {
    for (let n = Math.min(sc.length, 4); n >= 1; n--) {
      const s =
        tag +
        sc
          .slice(0, n)
          .map((c) => '.' + LN_esc(c))
          .join('');
      if (_ln_matches(s))
        return {
          selector: s,
          confidence: 'medium',
          reason: 'Stable classes (unique)',
        };
    }
    return {
      selector:
        tag +
        sc
          .slice(0, 3)
          .map((c) => '.' + LN_esc(c))
          .join(''),
      confidence: 'low',
      reason: 'Classes (not unique)',
    };
  }

  // MEDIUM: unique semantic tag
  if (_LN_SEMANTIC_TAGS.has(tag) && _ln_matches(tag))
    return {
      selector: tag,
      confidence: 'medium',
      reason: 'Unique semantic element',
    };

  return null;
}

// Positional segment

function _ln_nthSeg(el) {
  if (!el || !el.tagName) return '';
  const tag = el.tagName.toLowerCase();
  if (!el.parentElement) return tag;
  const parent = el.parentElement;
  const sibs = parent.children
    ? Array.from(parent.children).filter((c) => c.tagName === el.tagName)
    : [];
  return sibs.length === 1
    ? tag
    : `${tag}:nth-of-type(${sibs.indexOf(el) + 1})`;
}

// Main entry
//
// Strategy:
//   1. Unique intrinsic selector for the element itself.
//   2. Walk up ancestors within SELECTOR_MAX_DEPTH, collecting path segments.
//      Stop when a unique anchor is found.
//   3. If SELECTOR_MAX_DEPTH is exceeded without finding an anchor, keep climbing
//      (up to an absolute cap) rather than immediately falling back to <body>.
//   4. Full positional path from <body> as last resort.

function LN_buildSelector(el) {
  if (!el) return null;
  const d = _ln_describe(el);
  if (d && _ln_matches(d.selector)) return d;

  const parts = [];
  let cur = el,
    depth = 0;

  // Phase 1: walk up within the preferred depth limit
  while (cur && depth < LN_CONFIG.SELECTOR_MAX_DEPTH) {
    const dd = _ln_describe(cur);
    if (dd && _ln_matches(dd.selector)) {
      parts.unshift(dd.selector);
      return {
        selector: parts.join(' > '),
        confidence: depth === 0 ? dd.confidence : 'medium',
        reason: depth === 0 ? dd.reason : 'Anchored to: ' + dd.reason,
      };
    }
    parts.unshift(dd ? dd.selector : _ln_nthSeg(cur));
    cur = cur.parentElement;
    depth++;
  }

  // Phase 2: keep climbing to find ANY unique ancestor before giving up (#14)
  const ABS_MAX = 12;
  while (cur && cur !== document.documentElement && depth < ABS_MAX) {
    const dd = _ln_describe(cur);
    if (dd && _ln_matches(dd.selector)) {
      parts.unshift(dd.selector);
      return {
        selector: parts.join(' > '),
        confidence: 'low',
        reason: 'Deep anchor: ' + dd.reason,
      };
    }
    parts.unshift(_ln_nthSeg(cur));
    cur = cur.parentElement;
    depth++;
  }

  parts.unshift('body');
  return {
    selector: parts.join(' > '),
    confidence: 'low',
    reason: 'Positional path',
  };
}
