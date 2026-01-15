import { describe, it, expect } from 'vitest';
import { toRichTextHtml, normalizeRichText } from '../src/lib/rich-text.js';

describe('toRichTextHtml', () => {
  it('wraps text in paragraphs and escapes HTML', () => {
    const input = 'Use <tags> & "quotes" and \'apostrophes\'';
    const output = toRichTextHtml(input);

    expect(output).toBe('<p>Use &lt;tags&gt; &amp; &quot;quotes&quot; and &#39;apostrophes&#39;</p>');
  });

  it('converts single newlines to line breaks', () => {
    const input = 'Line 1\nLine 2';
    const output = toRichTextHtml(input);

    expect(output).toBe('<p>Line 1<br>Line 2</p>');
  });

  it('splits paragraphs on blank lines', () => {
    const input = 'First paragraph\n\nSecond line\nThird line';
    const output = toRichTextHtml(input);

    expect(output).toBe('<p>First paragraph</p><p>Second line<br>Third line</p>');
  });

  it('normalizes Windows newlines', () => {
    const input = 'Windows\r\nLine\r\n\r\nNext';
    const output = toRichTextHtml(input);

    expect(output).toBe('<p>Windows<br>Line</p><p>Next</p>');
  });
});

describe('normalizeRichText', () => {
  it('passes through raw HTML', () => {
    const input = '<p>Already rich</p>';
    const output = normalizeRichText(input, { format: 'html' });

    expect(output).toBe(input);
  });

  it('defaults to text conversion', () => {
    const output = normalizeRichText('Plain text');

    expect(output).toBe('<p>Plain text</p>');
  });
});
