import { useMemo, useState } from 'react';
import { PredictionMap, parseOrgUnits } from '@chap-blocks/ui/maps';
import { PredictionTable } from '@chap-blocks/ui/tables';
import { Group, Section } from '../gallery/Section';
import { boundaries, forecastSeries, lakesideSeries } from '../data/synthetic';

const mapCode = `import { PredictionMap, type FeatureCollection } from '@chap-blocks/ui/maps';

// Feature ids must match series[].orgUnitId
const orgUnits: FeatureCollection = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    id: 'lakeside',
    properties: { name: 'Lakeside' },
    geometry: { type: 'Polygon', coordinates: [[[30, -1], [30.9, -1], [30.9, -1.8], [30, -1.8], [30, -1]]] },
  }],
};

<PredictionMap
  series={allSeries}                // PredictionOrgUnitSeries[]
  orgUnits={orgUnits}
  predictionTargetName="Cases"
  // Optional tile layer; without it boundaries render on a neutral background
  // basemap={{ url: 'https://tiles.example/{z}/{x}/{y}.png', attribution: '© Provider' }}
/>`;

const viteCode = `// vite.config.ts — maps-gl loads workers relative to import.meta.url
export default defineConfig({
  optimizeDeps: {
    exclude: ['@dhis2/maps-gl'],
    include: ['maplibre-gl', 'comlink', /* … see apps/reference/vite.config.ts */]
      .map(dep => \`@chap-blocks/ui > @dhis2/maps-gl > \${dep}\`),
  },
});`;

const parseCode = `import { parseOrgUnits } from '@chap-blocks/ui/maps';

// DHIS2 geoFeatures: ty 2 = polygon (co is a JSON string), otherwise a point
const orgUnits = parseOrgUnits([
  { id: 'lakeside', na: 'Lakeside', ty: 2, co: '[[[30,-1],[30.9,-1],[30.9,-1.8],[30,-1]]]' },
  { id: 'clinic-1', na: 'Clinic 1', ty: 1, co: '[30.4,-1.4]' },
]);`;

const tableCode = `import { PredictionTable } from '@chap-blocks/ui/tables';

<PredictionTable series={series} />   // one PredictionOrgUnitSeries`;

function hasWebGL() {
    try {
        const canvas = document.createElement('canvas');
        return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
    } catch {
        return false;
    }
}

function MapExample() {
    const [supported] = useState(hasWebGL);
    // Three periods keep the number of WebGL contexts on the page low.
    const series = useMemo(
        () => forecastSeries.map(s => ({ ...s, points: s.points.slice(0, 3) })),
        [],
    );
    if (!supported) {
        return (
            <p className="example-error" role="status">
                This browser has no WebGL, which the map library needs. The block itself is fine: open the gallery in a
                WebGL-capable browser to see it.
            </p>
        );
    }
    return <PredictionMap series={series} orgUnits={boundaries} predictionTargetName="Cases" />;
}

const parsedPreview = parseOrgUnits([
    { id: 'lakeside', na: 'Lakeside', ty: 2, co: '[[[30,-1],[30.9,-1],[30.9,-1.8],[30,-1]]]' },
    { id: 'clinic-1', na: 'Clinic 1', ty: 1, co: '[30.4,-1.4]' },
]);

export function MapsTablesGroup() {
    return (
        <Group
            id="maps-tables"
            title="Maps and tables"
            intro="Feature collections and series go in as props. Maps never create their own API connection."
        >
            <Section
                id="prediction-map"
                title="PredictionMap"
                importFrom="@chap-blocks/ui/maps"
                exports={['PredictionMap']}
                description={
                    <p>
                        One choropleth per forecast period, coloured by median into five equal-interval classes, with a
                        shared legend. The maps in a group pan and zoom together. Shown here with six synthetic regions and
                        no basemap.
                    </p>
                }
                props={[
                    { name: 'series', type: 'PredictionOrgUnitSeries[]', required: true, description: 'One series per org unit; every distinct period becomes a map.' },
                    { name: 'orgUnits', type: 'FeatureCollection', required: true, description: 'Boundaries; feature id must equal the series orgUnitId.' },
                    { name: 'predictionTargetName', type: 'string', required: true, description: 'Used in the legend title.' },
                    { name: 'basemap', type: 'BasemapConfig', description: '{ url, attribution } tile template from your provider. Omit for a neutral background.' },
                ]}
                code={mapCode}
                note={<p>Vite hosts need the map dependency hints shown in the parseOrgUnits snippet below; production builds copy the worker assets automatically.</p>}
                wide
            >
                <MapExample />
            </Section>

            <Section
                id="parse-org-units"
                title="parseOrgUnits"
                importFrom="@chap-blocks/ui/maps"
                exports={['parseOrgUnits']}
                description={<p>Converts DHIS2 <code>geoFeatures</code> responses into the FeatureCollection the map takes.</p>}
                code={`${parseCode}\n\n${viteCode}`}
            >
                <pre className="data-preview">{JSON.stringify(parsedPreview.features.map(f => ({ id: f.id, type: f.geometry.type, name: f.properties.name })), null, 2)}</pre>
            </Section>

            <Section
                id="prediction-table"
                title="PredictionTable"
                importFrom="@chap-blocks/ui/tables"
                exports={['PredictionTable']}
                description={<p>The five quantiles of one org unit's forecast, one column per period, using the DHIS2 DataTable.</p>}
                props={[{ name: 'series', type: 'PredictionOrgUnitSeries', required: true, description: 'Uses points[].periodLabel as headers and the five quantiles as rows.' }]}
                code={tableCode}
                wide
            >
                <div className="scroll-x">
                    <PredictionTable series={lakesideSeries} />
                </div>
            </Section>
        </Group>
    );
}
