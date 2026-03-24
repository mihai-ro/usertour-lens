// Lens — shared DOM/string utilities

function LN_esc(s) {
  try {
    return CSS.escape(s);
  } catch (_) {
    return s.replace(/([^\w-])/g, '\\$1');
  }
}

function LN_escHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
