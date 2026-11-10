import { CircularLoader } from '@dhis2/ui';
import { PredictionOrgUnitSeries, PredictionMap } from '@chap-blocks/ui';
import { useOrgUnitGeometry } from '../../../../../hooks/useOrgUnitGeometry';

type Props = {
    series: PredictionOrgUnitSeries[];
    datasetId?: number;
    predictionTargetName: string;
};

export const PredictionMapWrapper = ({ series, predictionTargetName, datasetId }: Props) => {
    const orgUnitIds = Array.from(new Set(series.map(s => s.orgUnitId)));
    const { orgUnits, loading, error } = useOrgUnitGeometry(orgUnitIds, datasetId);

    if (loading) {
        return <CircularLoader />;
    }

    if (error || !orgUnits) {
        return <p role="alert">{error?.message ?? 'Map boundaries are unavailable.'}</p>;
    }

    return (
        <PredictionMap
            series={series}
            predictionTargetName={predictionTargetName}
            orgUnits={orgUnits}
        />
    );
};
