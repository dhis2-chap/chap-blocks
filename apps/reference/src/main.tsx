import React from 'react';
import { createRoot } from 'react-dom/client';
import { ChapProvider, type Connection } from '@chap-blocks/runtime';
import ModelingApp from '@chap-blocks/modeling/app';
import modelingIcon from './assets/modeling-icon.svg';
import './style.css';

let saved: Partial<Connection> = {};
try {
    saved = JSON.parse(localStorage.getItem('chap-blocks:connection') ?? '{}');
} catch {
    /* Use defaults for invalid saved settings. */
}
const connection: Connection = {
    baseUrl: saved.baseUrl || import.meta.env.VITE_CHAP_API_URL || '/chap-api',
    dhis2Url: saved.dhis2Url,
    token: sessionStorage.getItem('chap-blocks:token') || undefined,
};
createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ChapProvider connection={connection}>
            <header className="app-header">
                <a href="#/dashboard">
                    <img className="chap-mark" src={modelingIcon} alt="" />
                    <strong>Chap</strong>
                    <span className="app-title">Modeling workspace</span>
                </a>
                <a href="#/settings" className="connection-link">
                    Chap connection
                </a>
            </header>
            <main className="app-body">
                <ModelingApp />
            </main>
        </ChapProvider>
    </React.StrictMode>,
);
