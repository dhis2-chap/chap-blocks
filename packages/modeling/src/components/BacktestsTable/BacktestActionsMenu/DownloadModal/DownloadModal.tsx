import {
    Modal,
    ModalTitle,
    ModalContent,
    ModalActions,
    ButtonStrip,
    Button,
    IconDownload16,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { useChapClient, useAlert } from '@chap-blocks/runtime';
import { useState } from 'react';
import { saveAs } from 'file-saver';
import styles from './DownloadModal.module.css';

interface DownloadModalProps {
    backtestId: number;
    backtestName?: string | null;
    datasetId: number;
    isDatasetDownloadAvailable: boolean;
    isMetricsDownloadAvailable: boolean;
    onClose: () => void;
}

export const DownloadModal = ({
    backtestId,
    backtestName,
    datasetId,
    isDatasetDownloadAvailable,
    isMetricsDownloadAvailable,
    onClose,
}: DownloadModalProps) => {
    const client = useChapClient();
    const [downloading, setDownloading] = useState(false);
    const { show: showError } = useAlert('The download failed. Please try again.', { critical: true });
    async function download(kind: 'dataset' | 'metrics') {
        setDownloading(true);
        try {
            const csv = kind === 'dataset'
                ? await client.datasets.getDatasetCsvV1CrudDatasetsDatasetIdCsvGet(datasetId)
                : await client.metrics.getMetricsCsvV1CrudMetricCsvGet(backtestId);
            saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8' }), kind === 'dataset' ? `dataset-${datasetId}.csv` : `${safeName}-metrics.csv`);
        } catch { showError(); } finally { setDownloading(false); }
    }

    const safeName = (backtestName ?? `backtest-${backtestId}`)
        .replace(/[^a-z0-9-_]+/gi, '-')
        .replace(/^-+|-+$/g, '') || `backtest-${backtestId}`;

    return (
        <Modal
            onClose={onClose}
            small
            dataTest="download-modal"
        >
            <ModalTitle>
                {i18n.t('Download')}
            </ModalTitle>
            <ModalContent>
                <p className={styles.description}>
                    {i18n.t(
                        'Export dataset and metrics associated with this evaluation.',
                    )}
                </p>
                <div className={styles.buttons}>
                    {isDatasetDownloadAvailable && (

                            <Button
                                secondary
                                icon={<IconDownload16 />}
                                dataTest="download-dataset-button"
                                disabled={downloading}
                                onClick={() => download('dataset')}
                            >
                                {i18n.t('Dataset (CSV)')}
                            </Button>

                    )}
                    {isMetricsDownloadAvailable && (

                            <Button
                                secondary
                                icon={<IconDownload16 />}
                                dataTest="download-metrics-button"
                                disabled={downloading}
                                onClick={() => download('metrics')}
                            >
                                {i18n.t('Metrics (CSV)')}
                            </Button>

                    )}
                </div>
            </ModalContent>
            <ModalActions>
                <ButtonStrip>
                    <Button
                        onClick={onClose}
                        dataTest="close-download-modal-button"
                    >
                        {i18n.t('Close')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    );
};
