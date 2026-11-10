import type { AlertPolicyRead, ModelSpecRead, PredictionInfo, PredictionSetupReadWithPredictions } from '@chap-blocks/api';
import type { PredictionOrgUnitSeries } from '@chap-blocks/ui';

export type QuantileMappingFormProps = {
    prediction: PredictionInfo;
    model: ModelSpecRead;
    predictionSetupId: number;
};

export type LoadedQuantileMappingFormProps = QuantileMappingFormProps & {
    predictionSetup: PredictionSetupReadWithPredictions;
    policy: AlertPolicyRead | null | undefined;
    series: PredictionOrgUnitSeries[];
    canDeleteDataValues?: boolean;
    isDeleteAuthorityLoading: boolean;
};
