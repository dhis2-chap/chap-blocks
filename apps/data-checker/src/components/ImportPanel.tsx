import { useMutation } from '@tanstack/react-query';
import { Button, NoticeBox } from '@dhis2/ui';
import { useChapClient } from '@chap-blocks/runtime';
import { describeImportError } from '../check/importError';
import type { LoadedFile } from './FilePicker';

type Props = {
    csv: LoadedFile;
    geojson?: LoadedFile;
    errorCount: number;
};

/** Sends the files to Chap's CSV import, the same endpoint the modeling app's dataset upload uses. */
export const ImportPanel = ({ csv, geojson, errorCount }: Props) => {
    const client = useChapClient();
    const mutation = useMutation({
        mutationFn: () => client.datasets.createDatasetCsvV1CrudDatasetsCsvFilePost({
            csv_file: new File([csv.blob], csv.name, { type: 'text/csv' }),
            geojson_file: new File([geojson!.blob], geojson!.name, { type: 'application/geo+json' }),
        }),
    });

    return (
        <section className="panel import">
            <div>
                <h2>Import into Chap</h2>
                <p className="muted">
                    {!geojson
                        ? 'Add a boundaries file to import.'
                        : errorCount
                            ? 'Chap will probably reject these files. Fix the errors above first, or import anyway to see Chap’s response.'
                            : 'Uploads both files to Chap as a new dataset.'}
                </p>
            </div>
            {mutation.isSuccess && (
                <NoticeBox valid title="Dataset imported">
                    Chap saved the dataset with id {mutation.data.id}. Open it in the Chap modeling app to run an evaluation.
                </NoticeBox>
            )}
            {mutation.isError && (
                <NoticeBox error title="Import failed">{describeImportError(mutation.error)}</NoticeBox>
            )}
            <div className="button-row">
                <Button
                    primary={!errorCount}
                    destructive={errorCount > 0}
                    disabled={!geojson || mutation.isLoading || mutation.isSuccess}
                    loading={mutation.isLoading}
                    onClick={() => mutation.mutate()}
                >
                    {errorCount ? 'Import anyway' : 'Import into Chap'}
                </Button>
            </div>
        </section>
    );
};
