/** Chap's validation messages arrive as `detail`: a string, or a list of FastAPI errors. */
export const describeImportError = (error: unknown): string => {
    const detail = (error as { body?: { detail?: unknown } })?.body?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
        return detail.map(item => (typeof item === 'object' && item && 'msg' in item ? String(item.msg) : String(item))).join('; ');
    }
    return error instanceof Error ? error.message : 'The import failed.';
};
