import { useMemo, useState } from 'react';
import {
    ComparionPlotWrapper,
    ComparisonPlot,
    ComparisonPlotList,
    ResultPlot,
    SplitPeriodSelector,
    evaluationResultToViewData,
    getPeriodNameFromId,
    getStableMaxYByOrgUnitId,
    type ZoomRange,
} from '@chap-blocks/ui';
import { Group, Section } from '../gallery/Section';
import { EVALUATION_MODELS, SPLIT_PERIODS, evaluationActuals, evaluationEntries } from '../data/synthetic';

// evaluationResultToViewData groups entries by split period → org unit → model.
const viewData = evaluationResultToViewData(evaluationEntries, evaluationActuals);
const firstSplit = viewData[0];
const firstOrgUnit = firstSplit.evaluation[0];
const maxYByOrgUnitId = getStableMaxYByOrgUnitId(viewData);
const singleModelViewData = evaluationResultToViewData(
    evaluationEntries.filter(entry => entry.modelName === EVALUATION_MODELS[1]),
    evaluationActuals,
);

const dataCode = `import { evaluationResultToViewData } from '@chap-blocks/ui/charts';
import type { EvaluationEntry, DataElement } from '@chap-blocks/api';

// Backtest output: one row per org unit × period × quantile × split period.
const entries: (EvaluationEntry & { modelName?: string })[] = [
  { orgUnit: 'Lakeside', period: '202407', quantile: 0.5, value: 61,
    splitPeriod: '202406', modelName: 'Climate ARIMA' },
  // …quantiles 0.1, 0.25, 0.75, 0.9 and more periods
];
const actuals: DataElement[] = [{ pe: '202407', ou: 'Lakeside', value: 58 }];

// → [{ splitPoint, evaluation: [{ orgUnitId, orgUnitName, models: [{ modelName, data }] }] }]
const viewData = evaluationResultToViewData(entries, actuals);`;

const resultPlotCode = `import { ResultPlot } from '@chap-blocks/ui/charts';

const { data, modelName } = viewData[0].evaluation[0].models[0];

<ResultPlot data={data} modelName={modelName} nameLabel="Model" />`;

const comparisonCode = `import { ComparisonPlot } from '@chap-blocks/ui/charts';
import { getStableMaxYByOrgUnitId } from '@chap-blocks/ui';

const maxYByOrgUnitId = getStableMaxYByOrgUnitId(viewData);
const orgUnit = viewData[0].evaluation[0];

// Optional: share zoom between the side-by-side plots
const [zoom, setZoom] = useState<ZoomRange | null>(null);

<ComparisonPlot
  orgUnitsData={orgUnit}
  maxY={maxYByOrgUnitId[orgUnit.orgUnitId]}
  zoomRange={zoom}
  onZoomChange={setZoom}
/>`;

const listCode = `import { ComparisonPlotList } from '@chap-blocks/ui';

<ComparisonPlotList
  evaluationPerOrgUnits={viewData[0].evaluation}
  maxYByOrgUnitId={maxYByOrgUnitId}
  useVirtuoso={false}        // true: virtualised; give it a sized parent
/>`;

const wrapperCode = `import { ComparionPlotWrapper } from '@chap-blocks/ui';

<ComparionPlotWrapper
  evaluationName="Monthly backtest"
  modelName="Climate ARIMA"
  evaluations={viewData}
  splitPeriods={['202406', '202409']}
/>`;

const splitCode = `import { SplitPeriodSelector } from '@chap-blocks/ui';

const [split, setSplit] = useState('202406');

<SplitPeriodSelector
  label="Split period"
  splitPeriods={['202406', '202409']}
  selectedSplitPeriod={split}
  setSelectedSplitPeriod={setSplit}
/>`;

function ComparisonExample() {
    const [zoom, setZoom] = useState<ZoomRange | null>(null);
    return (
        <>
            <div className="toolbar">
                <span>Drag across a plot to zoom both.</span>
                {zoom && (
                    <button type="button" className="chip" onClick={() => setZoom(null)}>Reset zoom</button>
                )}
            </div>
            <ComparisonPlot
                orgUnitsData={firstOrgUnit}
                maxY={maxYByOrgUnitId[firstOrgUnit.orgUnitId]}
                zoomRange={zoom}
                onZoomChange={setZoom}
            />
        </>
    );
}

function SplitExample() {
    const [split, setSplit] = useState(SPLIT_PERIODS[0]);
    const evaluation = useMemo(() => viewData.find(entry => entry.splitPoint === split) ?? firstSplit, [split]);
    const model = evaluation.evaluation[0].models[1];
    return (
        <div className="split-example">
            <div className="narrow-field">
                <SplitPeriodSelector
                    label="Split period"
                    splitPeriods={SPLIT_PERIODS}
                    selectedSplitPeriod={split}
                    setSelectedSplitPeriod={setSplit}
                />
            </div>
            <p className="muted">
                Showing {model.modelName} for {evaluation.evaluation[0].orgUnitName}, trained up to{' '}
                {getPeriodNameFromId(split)}.
            </p>
            <ResultPlot data={model.data} modelName={model.modelName} maxY={maxYByOrgUnitId[firstOrgUnit.orgUnitId]} />
        </div>
    );
}

const resultPlotProps = [
    { name: 'data', type: 'HighChartsData', required: true, description: '{ periods, ranges, midranges?, averages, realValues? } as produced by evaluationResultToViewData.' },
    { name: 'modelName', type: 'string', required: true, description: 'Shown as the subtitle ("Model: …").' },
    { name: 'nameLabel', type: 'string', description: 'Replaces the "Model" prefix in the subtitle.' },
    { name: 'maxY', type: 'number', description: 'Fixed y-axis max for comparable plots.' },
    { name: 'zoomRange / onZoomChange', type: 'ZoomRange | null / (range) => void', description: 'Controlled x-axis zoom.' },
];

export function EvaluationGroup() {
    return (
        <Group
            id="evaluation"
            title="Evaluation plots"
            intro="Backtest results: predicted intervals against what actually happened, per model, org unit and split period."
        >
            <Section
                id="evaluation-data"
                title="evaluationResultToViewData"
                importFrom="@chap-blocks/ui/charts"
                exports={['evaluationResultToViewData']}
                description={
                    <p>
                        Turns flat backtest rows into the nested view data the plots below take. The gallery feeds it{' '}
                        {evaluationEntries.length} synthetic rows: {EVALUATION_MODELS.length} models ×{' '}
                        {firstSplit.evaluation.length} regions × {SPLIT_PERIODS.length} split periods.
                    </p>
                }
                code={dataCode}
            >
                <pre className="data-preview">{JSON.stringify(
                    viewData.map(split => ({
                        splitPoint: split.splitPoint,
                        evaluation: split.evaluation.map(orgUnit => `${orgUnit.orgUnitName}: ${orgUnit.models.map(m => m.modelName).join(', ')}`),
                    })),
                    null,
                    2,
                )}</pre>
            </Section>

            <Section
                id="result-plot"
                title="ResultPlot"
                importFrom="@chap-blocks/ui/charts"
                exports={['ResultPlot']}
                description={<p>One model for one org unit: actual values (orange) over median and interval bands.</p>}
                props={resultPlotProps}
                code={resultPlotCode}
            >
                <ResultPlot
                    data={firstOrgUnit.models[0].data}
                    modelName={firstOrgUnit.models[0].modelName}
                    maxY={maxYByOrgUnitId[firstOrgUnit.orgUnitId]}
                />
            </Section>

            <Section
                id="comparison-plot"
                title="ComparisonPlot"
                importFrom="@chap-blocks/ui/charts"
                exports={['ComparisonPlot']}
                description={<p>Every model for one org unit, side by side on a shared scale.</p>}
                props={[
                    { name: 'orgUnitsData', type: 'EvaluationPerOrgUnit', required: true, description: '{ orgUnitId, orgUnitName, models: ModelData[] }.' },
                    { name: 'nameLabel', type: 'string', description: 'Subtitle prefix for every plot.' },
                    { name: 'maxY', type: 'number', description: 'Shared y-axis max; see getStableMaxYByOrgUnitId.' },
                    { name: 'zoomRange / onZoomChange', type: 'ZoomRange | null / (range) => void', description: 'Synchronised zoom across the row.' },
                ]}
                code={comparisonCode}
                wide
            >
                <ComparisonExample />
            </Section>

            <Section
                id="comparison-plot-list"
                title="ComparisonPlotList"
                importFrom="@chap-blocks/ui"
                exports={['ComparisonPlotList']}
                description={<p>One ComparisonPlot per org unit. Virtualised by default for large evaluations.</p>}
                props={[
                    { name: 'evaluationPerOrgUnits', type: 'EvaluationPerOrgUnit[]', required: true, description: 'Rows to render.' },
                    { name: 'useVirtuoso', type: 'boolean', description: 'Default true. Virtualise rows with react-virtuoso; needs a parent with a height.' },
                    { name: 'useVirtuosoWindowScroll', type: 'boolean', description: 'Virtualise against the window scroll instead.' },
                    { name: 'virtuosoProps', type: 'VirtuosoProps', description: 'Passed through to Virtuoso.' },
                    { name: 'maxYByOrgUnitId', type: 'Record<string, number>', description: 'Per-row y-axis max.' },
                    { name: 'nameLabel, zoomRange, onZoomChange', type: '—', description: 'Forwarded to every ComparisonPlot.' },
                ]}
                code={listCode}
                wide
            >
                <ComparisonPlotList
                    evaluationPerOrgUnits={firstSplit.evaluation.slice(1)}
                    maxYByOrgUnitId={maxYByOrgUnitId}
                    useVirtuoso={false}
                />
            </Section>

            <Section
                id="split-period-selector"
                title="SplitPeriodSelector"
                importFrom="@chap-blocks/ui"
                exports={['SplitPeriodSelector']}
                description={<p>A DHIS2 single select listing split periods by readable name. Extra SingleSelectField props pass through.</p>}
                props={[
                    { name: 'splitPeriods', type: 'string[]', required: true, description: 'Period ids to offer.' },
                    { name: 'selectedSplitPeriod', type: 'string', required: true, description: 'Current value.' },
                    { name: 'setSelectedSplitPeriod', type: '(period: string) => void', required: true, description: 'Called with the selected id.' },
                    { name: '…SingleSelectFieldProps', type: '@dhis2/ui', description: 'label, helpText, dense, etc.' },
                ]}
                code={splitCode}
            >
                <SplitExample />
            </Section>

            <Section
                id="comparison-wrapper"
                title="ComparionPlotWrapper"
                importFrom="@chap-blocks/ui"
                exports={['ComparionPlotWrapper']}
                description={
                    <p>
                        A complete single-model evaluation view: split-period selector, org-unit checkboxes, search and a
                        virtualised plot list. (The export name keeps the upstream spelling.)
                    </p>
                }
                props={[
                    { name: 'evaluationName', type: 'string', required: true, description: 'Heading text.' },
                    { name: 'modelName', type: 'string', required: true, description: 'Model heading text.' },
                    { name: 'evaluations', type: 'EvaluationForSplitPoint[]', required: true, description: 'Output of evaluationResultToViewData.' },
                    { name: 'splitPeriods', type: 'string[]', required: true, description: 'Options for the selector.' },
                ]}
                code={wrapperCode}
                note={
                    <p>
                        The inner list is virtualised with <code>height: 100%</code>, so the host must give the plots
                        column a height. The gallery wraps it in a fixed-height, horizontally scrollable box; the filter
                        column has a 300px minimum width.
                    </p>
                }
                wide
            >
                <div className="wrapper-host">
                    <ComparionPlotWrapper
                        evaluationName="Monthly backtest"
                        modelName={EVALUATION_MODELS[1]}
                        evaluations={singleModelViewData}
                        splitPeriods={SPLIT_PERIODS}
                    />
                </div>
            </Section>
        </Group>
    );
}
