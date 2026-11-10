import { useContext, useEffect } from 'react';
import { MapContext } from './MapItem';

export type BasemapConfig = {
    /** A tile URL template supplied by the host, including its provider credentials if required. */
    url: string;
    attribution: string;
};

const Basemap = ({ url, attribution }: BasemapConfig) => {
    const map: any = useContext(MapContext);
    useEffect(() => {
        const layer = map.createLayer({ type: 'tileLayer', url, attribution });
        map.addLayer(layer);
        return () => map.removeLayer(layer);
    }, [map, url, attribution]);
    return null;
};

export default Basemap;
