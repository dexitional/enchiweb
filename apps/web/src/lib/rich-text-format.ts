// Helpers for fields that moved from plain text to rich text (HTML), such as
// a directory profile's About and Teaching philosophy. Older values are plain
// text with paragraphs separated by blank lines; these turn them into HTML so
// the editor and the site treat both alike. Client-safe, no dependencies —
// sanitising stays on the server (server/api/lib/rich-text.ts).

const HTML_TAG = /<\/?(p|br|ul|ol|li|strong|em|b|i|u|s|a|h[2-4]|blockquote)\b[^>]*>/i;

export const isHtml = (value: string) => HTML_TAG.test(value);

const escape = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** "Para one\n\nPara two" → "<p>Para one</p><p>Para two</p>" */
export function textToHtml(text: string): string {
  return text
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escape(p).replace(/\r?\n/g, "<br>")}</p>`)
    .join("");
}

/** Stored value (HTML or legacy plain text) → HTML for the editor or the page. */
export function toHtml(value: string | null | undefined): string {
  if (!value?.trim()) return "";
  return isHtml(value) ? value : textToHtml(value);
}

/** Visible text of some HTML, e.g. to count characters or build a snippet. */
export function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|li|h[2-4]|blockquote)>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}
