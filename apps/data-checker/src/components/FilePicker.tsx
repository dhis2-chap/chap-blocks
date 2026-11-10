import { useRef, useState, type DragEvent } from 'react';
import { Button } from '@dhis2/ui';

export type LoadedFile = { name: string; size: number; text: string; blob: Blob };

type Props = {
    csv?: LoadedFile;
    geojson?: LoadedFile;
    onFiles: (files: { csv?: LoadedFile; geojson?: LoadedFile }) => void;
    onClear: () => void;
    onExample: () => void;
    loadingExample: boolean;
};

const isGeojson = (name: string) => /\.(geo)?json$/i.test(name);
const isCsv = (name: string) => /\.(csv|txt|tsv)$/i.test(name);

const formatSize = (bytes: number) => (
    bytes < 1024 ? `${bytes} B` : bytes < 1024 ** 2 ? `${(bytes / 1024).toFixed(1)} kB` : `${(bytes / 1024 ** 2).toFixed(1)} MB`
);

const load = async (file: File): Promise<LoadedFile> => ({ name: file.name, size: file.size, text: await file.text(), blob: file });

/** One drop zone for both files: each file is sorted by its extension. */
export const FilePicker = ({ csv, geojson, onFiles, onClear, onExample, loadingExample }: Props) => {
    const input = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const [rejected, setRejected] = useState<string[]>([]);

    const accept = async (fileList: FileList | null) => {
        const files = [...(fileList ?? [])];
        const next: { csv?: LoadedFile; geojson?: LoadedFile } = {};
        const csvFile = files.find(file => isCsv(file.name));
        const geoFile = files.find(file => isGeojson(file.name));
        if (csvFile) next.csv = await load(csvFile);
        if (geoFile) next.geojson = await load(geoFile);
        setRejected(files.filter(file => file !== csvFile && file !== geoFile).map(file => file.name));
        if (next.csv || next.geojson) onFiles(next);
    };

    const onDrop = (event: DragEvent) => {
        event.preventDefault();
        setDragging(false);
        void accept(event.dataTransfer.files);
    };

    return (
        <section className="panel picker">
            <div
                className={`dropzone${dragging ? ' dropzone-active' : ''}`}
                onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
            >
                <p className="dropzone-title">Drop a CSV file and a GeoJSON file here</p>
                <p className="muted">Columns: time_period, location, disease_cases and covariates. Boundaries: one feature per location, with a NAME_1 property.</p>
                <div className="button-row">
                    <Button primary onClick={() => input.current?.click()}>Choose files</Button>
                    <Button secondary onClick={onExample} loading={loadingExample}>Try with example files</Button>
                    {(csv || geojson) && <Button secondary onClick={onClear}>Clear</Button>}
                </div>
                <input
                    ref={input}
                    type="file"
                    multiple
                    hidden
                    accept=".csv,.txt,.tsv,text/csv,.geojson,.json,application/geo+json,application/json"
                    onChange={(event) => {
                        void accept(event.target.files);
                        event.target.value = '';
                    }}
                />
            </div>
            <ul className="file-list">
                <li>
                    <span className="file-kind">Observations</span>
                    {csv ? <span>{csv.name} <span className="muted">· {formatSize(csv.size)}</span></span> : <span className="muted">No CSV file yet</span>}
                </li>
                <li>
                    <span className="file-kind">Boundaries</span>
                    {geojson ? <span>{geojson.name} <span className="muted">· {formatSize(geojson.size)}</span></span> : <span className="muted">No GeoJSON file yet</span>}
                </li>
            </ul>
            {rejected.length > 0 && (
                <p className="error-text">Skipped {rejected.join(', ')}: use a .csv file and a .geojson or .json file.</p>
            )}
            <p className="muted small">Files are checked in this browser. Nothing is sent to Chap unless you choose “Import into Chap”.</p>
        </section>
    );
};
