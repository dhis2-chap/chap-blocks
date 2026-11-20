/** A round step (1, 2 or 5 times a power of ten) that splits 0..max into about `count` ticks. */
export const niceTickStep = (max: number, count: number) => {
    const raw = max / count;
    const power = 10 ** Math.floor(Math.log10(raw || 1));
    return [1, 2, 5, 10].map(factor => factor * power).find(step => step >= raw) ?? power * 10;
};

/** Ticks from 0 to a rounded maximum that covers `max`. */
export const niceTicks = (max: number, count = 5) => {
    const step = niceTickStep(max, count);
    const top = Math.max(step, Math.ceil(max / step) * step);
    return Array.from({ length: Math.round(top / step) + 1 }, (_, index) => index * step);
};
