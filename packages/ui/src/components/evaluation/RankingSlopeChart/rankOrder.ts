export type RankedItem = {
    id: string;
    label: string;
    /** The forecast value, e.g. cases per 1000 people next month. */
    forecast: number;
    /** The value that was observed for the same period. */
    observed: number;
};

export type RankPlacement = RankedItem & {
    /** 0 is the highest value. Ties keep their input order. */
    forecastRank: number;
    observedRank: number;
};

/** Places each item in forecast order and in observed order, highest first. */
export const rankOrder = (items: RankedItem[]): RankPlacement[] => {
    const byForecast = [...items].sort((a, b) => b.forecast - a.forecast);
    const byObserved = [...items].sort((a, b) => b.observed - a.observed);
    const observedRank = new Map(byObserved.map((item, index) => [item.id, index]));
    return byForecast.map((item, index) => ({ ...item, forecastRank: index, observedRank: observedRank.get(item.id)! }));
};

/** How many of the top `count` by forecast are also in the top `count` by observed value. */
export const topOverlap = (placements: RankPlacement[], count: number) =>
    placements.filter(item => item.forecastRank < count && item.observedRank < count).length;
