import { useState } from 'react';
import { CircularLoader, NoticeBox } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { PredictionResultWidgetComponent } from './PredictionResultWidget.component';
import styles from './PredictionResultWidget.module.css';
import { Widget } from '@chap-blocks/ui';
import { PredictionInfo, ModelSpecRead } from '@chap-blocks/api';
import { usePredictionSeries } from '../hooks/usePredictionSeries';

type Props = {
    initialTab?: 'chart' | 'table' | 'map';
    prediction: PredictionInfo;
    model: ModelSpecRead;
};

const WidgetWrapper = ({ children }: { children: React.ReactNode }) => {
    return (
        <Widget
            header={i18n.t('Prediction result')}
            open
            onOpen={() => { }}
            onClose={() => { }}
        >
            {children}
        </Widget>
    );
};

export const PredictionResultWidget = ({ prediction, model, initialTab = 'chart' }: Props) => {
    const [selectedTab, setSelectedTab] = useState<'chart' | 'table' | 'map'>(initialTab);
    const [selectedOrgUnitId, setSelectedOrgUnitId] = useState<string | undefined>(undefined);
    const {
        series,
        predictionTargetName,
        isLoading,
        error,
    } = usePredictionSeries({ prediction, model });

    if (isLoading) {
        return (
            <WidgetWrapper>
                <div className={styles.loadingContainer}>
                    <CircularLoader />
                </div>
            </WidgetWrapper>
        );
    }

    if (error) {
        return (
            <WidgetWrapper>
                <div className={styles.errorContainer}>
                    <NoticeBox title={i18n.t('Unable to load data')} error>
                        <p>{i18n.t('There was a problem loading required data. See the browser console for details.')}</p>
                    </NoticeBox>
                </div>
            </WidgetWrapper>
        );
    }

    if (!series || series.length === 0) {
        return (
            <WidgetWrapper>
                <div className={styles.errorContainer}>
                    <NoticeBox title={i18n.t('No data available')} warning>
                        <p>{i18n.t('No prediction data found.')}</p>
                    </NoticeBox>
                </div>
            </WidgetWrapper>
        );
    }

    return (
        <PredictionResultWidgetComponent
            datasetId={prediction.datasetId}
            series={series}
            predictionTargetName={predictionTargetName}
            selectedOrgUnitId={selectedOrgUnitId}
            selectedTab={selectedTab}
            onSelectOrgUnit={setSelectedOrgUnitId}
            onSelectTab={setSelectedTab}
        />
    );
};
