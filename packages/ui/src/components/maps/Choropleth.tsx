import { useContext, useEffect } from 'react';
import { MapContext } from './MapItem';

const Choropleth = ({
    period,
    prediction,
    geojson,
    dataElement = 'median',
    bins,
    colors,
}: any) => {
    const map: any = useContext(MapContext);

    useEffect(() => {
        if (Object.prototype.hasOwnProperty.call(geojson, 'features')) {
            const features = geojson.features.map((feature: any) => {
                const value = prediction.dataValues.find(
                    (d: any) =>
                        d.period === period &&
                        d.orgUnit === feature.id &&
                        d.dataElement === dataElement,
                )?.value;

                const binIndex = bins.findIndex(
                    (bin: any) =>
                        value >= bin.startValue && value <= bin.endValue,
                );

                const color = colors[binIndex] ?? '#cbd5e1';

                return {
                    ...feature,
                    properties: {
                        ...feature.properties,
                        value: value ?? 'No value',
                        color,
                    },
                };
            });

            const config = {
                type: 'choropleth',
                data: features,
                opacity: 0.8,
                hoverLabel: '{name} ({value})',
            };

            const layer = map.createLayer(config);
            map.addLayer(layer);
            map.fitBounds(map.getLayersBounds());
            return () => map.removeLayer(layer);
        }
    }, [map, period, prediction, dataElement, geojson, bins, colors]);

    return null;
};

export default Choropleth;
