/** Escapes text that Highcharts renders as (a subset of) HTML. */
export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;',
})[character] ?? character);
