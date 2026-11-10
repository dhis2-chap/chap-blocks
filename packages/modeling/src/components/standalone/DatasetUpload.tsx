import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useChapClient } from '@chap-blocks/runtime';
import { Card } from '@chap-blocks/ui/layout';
import { Button, NoticeBox } from '@dhis2/ui';
import { useNavigate } from 'react-router-dom';

/** Standalone dataset import. Files go directly to Chap's documented multipart endpoint. */
export function DatasetUpload() {
    const client = useChapClient();
    const cache = useQueryClient();
    const navigate = useNavigate();
    const [csv, setCsv] = useState<File>();
    const [geojson, setGeojson] = useState<File>();
    const mutation = useMutation({
        mutationFn: async () => {
            if (!csv || !geojson)
                throw new Error('Select a CSV file and a GeoJSON file.');
            const geometry = JSON.parse(await geojson.text());
            if (
                geometry.type !== 'FeatureCollection' ||
                !Array.isArray(geometry.features) ||
                !geometry.features.length ||
                geometry.features.some(
                    (f: { properties?: { NAME_1?: string } }) =>
                        !f.properties?.NAME_1,
                )
            )
                throw new Error(
                    'GeoJSON must be a FeatureCollection with a NAME_1 property for each location, matching the CSV location column.',
                );
            return client.datasets.createDatasetCsvV1CrudDatasetsCsvFilePost({
                csv_file: csv,
                geojson_file: geojson,
            });
        },
        onSuccess: async (result) => {
            await cache.invalidateQueries({ queryKey: ['datasets'] });
            navigate(`/evaluate/from-dataset?datasetId=${result.id}`);
        },
    });
    return (
        <Card>
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    mutation.mutate();
                }}
                style={{ padding: 24, display: 'grid', gap: 20, maxWidth: 800 }}
            >
                <h2>Import dataset files</h2>
                <p>
                    Upload observations and boundaries directly to Chap. The CSV
                    uses Chap columns: time_period, location, disease_cases,
                    population, rainfall and mean_temperature. GeoJSON features
                    must have a NAME_1 property matching location.
                </p>
                <label>
                    Observations (.csv)
                    <input
                        required
                        type="file"
                        accept=".csv,text/csv"
                        onChange={(event) => setCsv(event.target.files?.[0])}
                    />
                </label>
                <label>
                    Boundaries (.geojson)
                    <input
                        required
                        type="file"
                        accept=".geojson,.json,application/geo+json,application/json"
                        onChange={(event) =>
                            setGeojson(event.target.files?.[0])
                        }
                    />
                </label>
                <p>
                    Chap currently names uploads “csv_file”. After import you
                    can evaluate the saved dataset with any compatible model.
                </p>
                {mutation.error instanceof Error && (
                    <NoticeBox error title="Import failed">
                        {mutation.error.message}
                    </NoticeBox>
                )}
                <Button
                    primary
                    type="submit"
                    loading={mutation.isLoading}
                    disabled={!csv || !geojson || mutation.isLoading}
                >
                    Import dataset
                </Button>
            </form>
        </Card>
    );
}
