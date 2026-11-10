import { useDataEngine } from '@chap-blocks/runtime';
import { useQuery } from '@tanstack/react-query';
export type VisualizationColumn = { dimension: string; items: { id: string }[] };
export type Visualization = { type: string; columns: VisualizationColumn[]; rows: VisualizationColumn[]; filters: VisualizationColumn[] };
export interface VisualizationPluginProps { pluginSource: string; height: string; displayProperty: string; forDashboard: boolean; visualization: Visualization }
export function VisualizationPlugin({ visualization, height }: VisualizationPluginProps) {
    const engine = useDataEngine();
    const dimension = [...visualization.columns, ...visualization.rows, ...visualization.filters].map(d => `${d.dimension}:${d.items.map(i => i.id).join(';')}`).join(',');
    const query = useQuery({ queryKey: ['analytics-preview', dimension], queryFn: async () => {
        const result = await engine.query({ analytics: { resource: 'analytics', params: { dimension, displayProperty: 'NAME' } } });
        return result.analytics as { headers: { name: string }[]; rows: (string | number)[][] };
    } });
    if (query.isLoading) return <p>Loading preview…</p>;
    if (query.error instanceof Error) return <p role="alert">{query.error.message}</p>;
    return <div style={{ maxHeight: height, overflow: 'auto' }}><table><thead><tr>{query.data?.headers.map(h => <th key={h.name}>{h.name}</th>)}</tr></thead><tbody>{query.data?.rows.map((row, i) => <tr key={i}>{row.map((v, j) => <td key={j}>{v}</td>)}</tr>)}</tbody></table></div>;
}
