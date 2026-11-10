import { createRoot } from 'react-dom/client';
import { CssVariables } from '@dhis2/ui';
import { App } from './App';
import './style.css';

// A small consumer of the blocks: no modeling package, router or source aliases.
createRoot(document.getElementById('root')!).render(
    <>
        <CssVariables theme spacers colors elevations />
        <App />
    </>,
);
