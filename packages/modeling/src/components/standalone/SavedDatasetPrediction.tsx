import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useChapClient } from '@chap-blocks/runtime';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, NoticeBox } from '@dhis2/ui';
import { Card } from '@chap-blocks/ui/layout';
import { useDatasets } from '../../hooks/useDatasets';
import { usePredictionSetup } from '../../hooks/usePredictionSetup';
import { predictionRequest } from './predictionRequest';

export function SavedDatasetPrediction() {
    const { predictionSetupId } = useParams();
    const {
        predictionSetup: setup,
        error: setupError,
        isLoading: loadingSetup,
    } = usePredictionSetup(predictionSetupId);
    const {
        data: datasets,
        error: datasetsError,
        isLoading: loadingDatasets,
    } = useDatasets();
    const client = useChapClient();
    const cache = useQueryClient();
    const navigate = useNavigate();
    const [datasetId, setDatasetId] = useState('');
    const [name, setName] = useState('');
    const [nPeriods, setNPeriods] = useState(3);
    const mutation = useMutation({
        mutationFn: async () => {
            if (!setup || !datasetId) throw new Error('Choose a dataset.');
            const dataset =
                await client.datasets.getDatasetV1CrudDatasetsDatasetIdGet(
                    Number(datasetId),
                );
            return client.predictionSetups.runPredictionSetupV1CrudPredictionSetupsPredictionSetupIdRunPost(
                setup.id,
                predictionRequest(dataset, setup, name, nPeriods),
            );
        },
        onSuccess: async () => {
            await cache.invalidateQueries({ queryKey: ['jobs'] });
            await cache.invalidateQueries({ queryKey: ['predictionSetups'] });
            navigate('/jobs');
        },
    });
    const error = setupError || datasetsError || mutation.error;
    return (
        <Card>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    mutation.mutate();
                }}
                style={{ padding: 24, display: 'grid', gap: 20, maxWidth: 800 }}
            >
                <h2>Predict from a saved dataset</h2>
                <p>
                    Use observations already stored in Chap to run{' '}
                    {setup?.name ?? 'this prediction setup'}.
                </p>
                {error instanceof Error && (
                    <NoticeBox error title="Could not run prediction">
                        {error.message}
                    </NoticeBox>
                )}
                <label>
                    Run name
                    <input
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </label>
                <label>
                    Dataset
                    <select
                        required
                        value={datasetId}
                        onChange={(e) => setDatasetId(e.target.value)}
                    >
                        <option value="">Select dataset</option>
                        {datasets?.map((dataset) => (
                            <option key={dataset.id} value={dataset.id ?? ''}>
                                {dataset.name} · {dataset.firstPeriod} –{' '}
                                {dataset.lastPeriod}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    Forecast periods
                    <input
                        type="number"
                        min={1}
                        step={1}
                        required
                        value={nPeriods}
                        onChange={(e) => setNPeriods(Number(e.target.value))}
                    />
                </label>
                <Button
                    primary
                    type="submit"
                    loading={mutation.isLoading}
                    disabled={
                        !setup ||
                        !datasetId ||
                        !name.trim() ||
                        loadingSetup ||
                        loadingDatasets ||
                        mutation.isLoading
                    }
                >
                    Run prediction
                </Button>
            </form>
        </Card>
    );
}
