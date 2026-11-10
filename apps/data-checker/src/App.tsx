import { useMemo, useState } from 'react';
import { NoticeBox } from '@dhis2/ui';
import { checkDataset } from './check/checkDataset';
import { BoundaryMap } from './components/BoundaryMap';
import { Completeness } from './components/Completeness';
import { FilePicker, type LoadedFile } from './components/FilePicker';
import { ImportPanel } from './components/ImportPanel';
import { IssueList } from './components/IssueList';
import { ModelCompatibility } from './components/ModelCompatibility';
import { Summary } from './components/Summary';

const EXAMPLES = { csv: 'observations.csv', geojson: 'boundaries.geojson' };

const fetchExample = async (name: string): Promise<LoadedFile> => {
    const response = await fetch(`${import.meta.env.BASE_URL}examples/${name}`);
    if (!response.ok) throw new Error(`Could not load ${name} (${response.status}).`);
    const blob = await response.blob();
    return { name, size: blob.size, text: await blob.text(), blob };
};

export const App = () => {
    const [files, setFiles] = useState<{ csv?: LoadedFile; geojson?: LoadedFile }>({});
    const [loadingExample, setLoadingExample] = useState(false);
    const [exampleError, setExampleError] = useState<string>();
    // Bumped on every file change, so an import result never outlives the files it was for.
    const [revision, setRevision] = useState(0);
    const updateFiles = (update: (current: typeof files) => typeof files) => {
        setFiles(update);
        setRevision(value => value + 1);
    };

    const report = useMemo(
        () => (files.csv ? checkDataset(files.csv.text, files.geojson?.text ?? null) : null),
        [files.csv, files.geojson],
    );
    const errorCount = report?.issues.filter(issue => issue.severity === 'error').length ?? 0;

    const loadExample = async () => {
        setLoadingExample(true);
        setExampleError(undefined);
        try {
            const [csv, geojson] = await Promise.all([fetchExample(EXAMPLES.csv), fetchExample(EXAMPLES.geojson)]);
            updateFiles(() => ({ csv, geojson }));
        } catch (error) {
            setExampleError((error as Error).message);
        } finally {
            setLoadingExample(false);
        }
    };

    return (
        <div className="page">
            <div className="intro">
                <h1>Check your data before importing it into Chap</h1>
                <p className="muted">
                    Drop a Chap-format CSV and its GeoJSON boundaries to check columns, periods, duplicates,
                    boundary matches and completeness, and see which models could use the data.
                </p>
            </div>
            <FilePicker
                csv={files.csv}
                geojson={files.geojson}
                onFiles={next => updateFiles(current => ({ ...current, ...next }))}
                onClear={() => updateFiles(() => ({}))}
                onExample={loadExample}
                loadingExample={loadingExample}
            />
            {exampleError && <NoticeBox error title="Could not load the example files">{exampleError}</NoticeBox>}
            {!files.csv && files.geojson && (
                <NoticeBox title="Add the CSV file">The boundaries are loaded. Add the observations CSV to run the checks.</NoticeBox>
            )}
            {report && files.csv && (
                <>
                    <Summary report={report} />
                    <IssueList issues={report.issues} />
                    <div className="columns">
                        <Completeness report={report} />
                        <BoundaryMap report={report} />
                    </div>
                    <ModelCompatibility report={report} />
                    <ImportPanel
                        key={revision}
                        csv={files.csv}
                        geojson={files.geojson}
                        errorCount={errorCount}
                    />
                </>
            )}
        </div>
    );
};
