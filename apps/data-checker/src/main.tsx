import React from 'react';
import { createRoot } from 'react-dom/client';
import { ChapProvider } from '@chap-blocks/runtime';
import chapIcon from './assets/chap-icon.svg';
import { App } from './App';
import './style.css';

const connection = { baseUrl: import.meta.env.VITE_CHAP_API_URL || '/chap-api' };

createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ChapProvider connection={connection}>
            <header className="app-header">
                <a href="/">
                    <img className="chap-mark" src={chapIcon} alt="" />
                    <strong>Chap</strong>
                    <span className="app-title">Data checker</span>
                </a>
            </header>
            <main className="app-body">
                <App />
            </main>
        </ChapProvider>
    </React.StrictMode>,
);
