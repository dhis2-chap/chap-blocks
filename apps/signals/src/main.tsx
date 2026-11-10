import React from 'react';
import { createRoot } from 'react-dom/client';
import { ChapProvider, type Connection } from '@chap-blocks/runtime';
import chapIcon from './assets/chap-icon.svg';
import { App } from './App';
import './style.css';

// Read-only and served statically: the host proxies /chap-api and holds any server token.
const connection: Connection = { baseUrl: '/chap-api' };

createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ChapProvider connection={connection}>
            <header className="app-header">
                <a href="#/">
                    <img className="chap-mark" src={chapIcon} alt="" />
                    <strong>Chap</strong>
                    <span className="app-title">Signals</span>
                </a>
            </header>
            <main className="app-body">
                <App />
            </main>
        </ChapProvider>
    </React.StrictMode>,
);
