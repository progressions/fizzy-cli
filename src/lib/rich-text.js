const ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ESCAPE_MAP[char]);
}

export function toRichTextHtml(value) {
  if (value === null || value === undefined) {
    return value;
  }

  const text = String(value);
  if (!text) {
    return '';
  }

  const normalized = text.replace(/\r\n?/g, '\n');
  const blocks = normalized
    .split(/\n\s*\n/)
    .filter(block => block.trim().length > 0);

  if (blocks.length === 0) {
    return '';
  }

  return blocks
    .map(block => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function normalizeRichText(value, { format = 'text' } = {}) {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value !== 'string') {
    return value;
  }

  if (format === 'html') {
    return value;
  }

  return toRichTextHtml(value);
}
