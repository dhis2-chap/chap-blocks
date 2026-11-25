import i18n from '@dhis2/d2-i18n';
import type { SelectionBias } from '@chap-blocks/api';

/** One sentence on which forecasts the selection bias was scored on, and the gap that keeps test splits apart. */
export const selectionBiasHorizons = (selectionBias: Pick<SelectionBias, 'horizonDistances' | 'gapSplits'>): string => {
    const horizons = selectionBias.horizonDistances;
    if (horizons.length === 1) {
        return horizons[0] === 1
            ? i18n.t('Scored on forecasts one period ahead only.')
            : i18n.t('Scored on forecasts {{horizon}} periods ahead only.', { horizon: horizons[0] });
    }
    return i18n.t('Scored on forecasts {{first}} to {{last}} periods ahead, as in the table. The test splits start {{gap}} splits after each window, so they forecast no period the window did.', {
        first: horizons[0],
        last: horizons[horizons.length - 1],
        gap: selectionBias.gapSplits,
    });
};
