import { lazy, Suspense } from 'react';
import { Dhis2Required } from './components/standalone/Dhis2Required';
import {
    createHashRouter,
    RouterProvider,
    Navigate,
    Outlet,
    type UIMatch,
} from 'react-router-dom';
import type { ReactNode } from 'react';
import ErrorPage from './components/ErrorPage';
import i18n from '@dhis2/d2-i18n';
import './App.module.css';
import PageWrapper from './components/PageWrapper';
import { ModelingDefaults } from './components/ModelingDefaults/ModelingDefaults';
import { SettingsLayout } from './features/settings/SettingsLayout';
import { GeneralSettings } from './features/settings/GeneralSettings';
import { DataPruningCard } from './features/settings/DataPruning';
import { ExperimentalSettings } from './features/settings/Experimental';
import { CssReset, CssVariables } from '@dhis2/ui';
import { Layout } from './components/layout/Layout';
import InfoAboutReportingBugs from './features/common-features/InfoAboutReportingBugs/InfoAboutReportingBugs';
import WarnAboutIncompatibleVersion from './features/common-features/WarnAboutIncompatibleVersion/WarnAboutIncompatibleVersion';

import { BenchmarkBreadcrumb } from './pages/BenchmarksPage/BenchmarkBreadcrumb';
import { ChapValidator } from './components/ChapValidator';
import { DatasetBreadcrumb, DatasetDetailsPage } from './pages/DatasetDetailsPage/DatasetDetailsPage';

export type RouteHandle = {
    breadcrumb?: (match: UIMatch) => ReactNode;
    fullWidth?: boolean;
    /* whether to automatically collapse the sidebar when route is active */
    collapseSidebar?: boolean;
};

const DashboardPage = lazy(() =>
    import('./pages/DashboardPage').then((module) => ({
        default: module.DashboardPage,
    })),
);
const BenchmarksPage = lazy(() =>
    import('./pages/BenchmarksPage/BenchmarksPage').then((module) => ({
        default: module.BenchmarksPage,
    })),
);
const NewBenchmarkPage = lazy(() =>
    import('./pages/BenchmarksPage/NewBenchmarkPage').then((module) => ({
        default: module.NewBenchmarkPage,
    })),
);
const BenchmarkDetailsPage = lazy(() =>
    import('./pages/BenchmarksPage/BenchmarkDetailsPage').then((module) => ({
        default: module.BenchmarkDetailsPage,
    })),
);
const EvaluationPage = lazy(() =>
    import('./pages/EvaluationPage').then((module) => ({
        default: module.EvaluationPage,
    })),
);
const EvaluationDetailsPage = lazy(() =>
    import('./pages/EvaluationDetailsPage').then((module) => ({
        default: module.EvaluationDetailsPage,
    })),
);
const NewEvaluationPage = lazy(() =>
    import('./pages/NewEvaluationPage').then((module) => ({
        default: module.NewEvaluationPage,
    })),
);
const JobsPage = lazy(() =>
    import('./pages/JobsPage').then((module) => ({ default: module.JobsPage })),
);
const EvaluationComparePage = lazy(() =>
    import('./pages/EvaluationCompare').then((module) => ({
        default: module.EvaluationComparePage,
    })),
);
const GetStartedPage = lazy(() =>
    import('./pages/GetStartedPage').then((module) => ({
        default: module.GetStartedPage,
    })),
);
const ReadyToPredictPage = lazy(() =>
    import('./pages/ReadyToPredictPage').then((module) => ({
        default: module.ReadyToPredictPage,
    })),
);
const ConfiguredModelDashboardPage = lazy(() =>
    import('./pages/ConfiguredModelDashboardPage').then((module) => ({
        default: module.ConfiguredModelDashboardPage,
    })),
);
const ModelsPage = lazy(() =>
    import('./pages/ModelsPage').then((module) => ({
        default: module.ModelsPage,
    })),
);
const DatasetsPage = lazy(() =>
    import('./pages/DatasetsPage').then((module) => ({
        default: module.DatasetsPage,
    })),
);
const NewDatasetPage = lazy(() =>
    import('./pages/NewDatasetPage').then((module) => ({
        default: module.NewDatasetPage,
    })),
);
const NewConfiguredModelPage = lazy(() =>
    import('./pages/NewConfiguredModelPage').then((module) => ({
        default: module.NewConfiguredModelPage,
    })),
);
const NewPredictionPage = lazy(() =>
    import('./pages/NewPredictionPage').then((module) => ({
        default: module.NewPredictionPage,
    })),
);
const PredictionImportPage = lazy(() =>
    import('./pages/PredictionImportPage').then((module) => ({
        default: module.PredictionImportPage,
    })),
);
const PredictionRunDetailsPage = lazy(() =>
    import('./pages/PredictionRunDetailsPage').then((module) => ({
        default: module.PredictionRunDetailsPage,
    })),
);
const SignalsPage = lazy(() =>
    import('./pages/SignalsPage/SignalsPage').then((module) => ({
        default: module.SignalsPage,
    })),
);
const PredictionActivityPage = lazy(() =>
    import('./pages/PredictionActivityPage').then((module) => ({
        default: module.PredictionActivityPage,
    })),
);
const GuidesPage = lazy(() =>
    import('./pages/GuidesPage').then((module) => ({
        default: module.GuidesPage,
    })),
);

const router = createHashRouter([
    {
        element: (
            <>
                <Layout />
            </>
        ),
        errorElement: <ErrorPage />,
        children: [
            {
                path: '/',
                element: <Navigate to="/dashboard" replace />,
            },
            {
                element: (
                    <ChapValidator>
                        <InfoAboutReportingBugs />

                        <WarnAboutIncompatibleVersion />
                        <PageWrapper>
                            <Outlet />
                        </PageWrapper>
                    </ChapValidator>
                ),
                errorElement: <ErrorPage />,
                children: [
                    {
                        path: '/dashboard',
                        element: <DashboardPage />,
                    },
                    {
                        path: '/evaluate',
                        handle: {
                            breadcrumb: () => i18n.t('Evaluations'),
                        } satisfies RouteHandle,
                        children: [
                            {
                                index: true,
                                element: <EvaluationPage />,
                            },
                            {
                                path: 'compare',
                                handle: {
                                    breadcrumb: () =>
                                        i18n.t('Compare evaluations'),
                                    fullWidth: true,
                                } satisfies RouteHandle,
                                element: <EvaluationComparePage />,
                            },
                            {
                                path: 'benchmarks',
                                handle: {
                                    breadcrumb: () => i18n.t('Benchmarks'),
                                    fullWidth: true,
                                } satisfies RouteHandle,
                                children: [
                                    {
                                        index: true,
                                        element: <BenchmarksPage />,
                                    },
                                    {
                                        path: 'new',
                                        element: <NewBenchmarkPage />,
                                        handle: {
                                            breadcrumb: () =>
                                                i18n.t('New benchmark'),
                                        } satisfies RouteHandle,
                                    },
                                    {
                                        path: ':specificationId',
                                        element: <BenchmarkDetailsPage />,
                                        handle: {
                                            breadcrumb: (match) => (
                                                <BenchmarkBreadcrumb
                                                    specificationId={Number(
                                                        match.params
                                                            .specificationId,
                                                    )}
                                                />
                                            ),
                                        } satisfies RouteHandle,
                                    },
                                ],
                            },
                            {
                                path: 'new',
                                element: <NewEvaluationPage useSavedDataset />,
                                handle: {
                                    breadcrumb: () => i18n.t('New evaluation'),
                                } satisfies RouteHandle,
                            },
                            {
                                path: 'from-dhis2',
                                element: (
                                    <Dhis2Required>
                                        <NewEvaluationPage />
                                    </Dhis2Required>
                                ),
                            },
                            {
                                path: 'from-dataset',
                                element: <NewEvaluationPage useSavedDataset />,
                                handle: {
                                    breadcrumb: () => i18n.t('New evaluation'),
                                } satisfies RouteHandle,
                            },
                            {
                                path: ':evaluationId',
                                handle: {
                                    breadcrumb: () =>
                                        i18n.t('Evaluation details'),
                                    collapseSidebar: true,
                                } satisfies RouteHandle,
                                element: <EvaluationDetailsPage />,
                            },
                        ],
                    },
                    {
                        path: '/datasets',
                        handle: {
                            breadcrumb: () => i18n.t('Datasets'),
                        } satisfies RouteHandle,
                        children: [
                            { index: true, element: <DatasetsPage /> },
                            {
                                path: 'new',
                                element: <NewDatasetPage />,
                                handle: {
                                    breadcrumb: () => i18n.t('New dataset'),
                                } satisfies RouteHandle,
                            },
                            {
                                path: ':datasetId',
                                element: <DatasetDetailsPage />,
                                handle: {
                                    breadcrumb: match => <DatasetBreadcrumb datasetId={Number(match.params.datasetId)} />,
                                } satisfies RouteHandle,
                            },
                        ],
                    },
                    {
                        path: '/jobs',
                        element: <JobsPage />,
                    },
                    {
                        path: '/signals',
                        handle: { breadcrumb: () => i18n.t('Signal policies') } satisfies RouteHandle,
                        element: <SignalsPage />,
                    },
                    {
                        path: '/alerts',
                        element: <Navigate to="/signals" replace />,
                    },
                    {
                        path: '/predictions',
                        handle: {
                            breadcrumb: () => i18n.t('Prediction setups'),
                        } satisfies RouteHandle,
                        children: [
                            {
                                index: true,
                                element: <ReadyToPredictPage />,
                            },
                            {
                                path: ':predictionSetupId',
                                handle: {
                                    breadcrumb: () =>
                                        i18n.t('Prediction setup'),
                                } satisfies RouteHandle,
                                children: [
                                    {
                                        index: true,
                                        handle: {
                                            collapseSidebar: true,
                                        } satisfies RouteHandle,
                                        element: (
                                            <ConfiguredModelDashboardPage />
                                        ),
                                    },
                                    {
                                        path: 'new',
                                        handle: {
                                            breadcrumb: () =>
                                                i18n.t('Run prediction'),
                                            collapseSidebar: true,
                                        } satisfies RouteHandle,
                                        element: <NewPredictionPage />,
                                    },
                                    {
                                        path: 'runs/:predictionId',
                                        handle: {
                                            breadcrumb: () =>
                                                i18n.t('Prediction details'),
                                            collapseSidebar: true,
                                        } satisfies RouteHandle,
                                        children: [
                                            {
                                                index: true,
                                                handle: {
                                                    fullWidth: true,
                                                } satisfies RouteHandle,
                                                element: (
                                                    <PredictionRunDetailsPage />
                                                ),
                                            },
                                            {
                                                path: 'import',
                                                handle: {
                                                    breadcrumb: () =>
                                                        i18n.t(
                                                            'Import prediction',
                                                        ),
                                                } satisfies RouteHandle,
                                                element: (
                                                    <Dhis2Required>
                                                        <PredictionImportPage />
                                                    </Dhis2Required>
                                                ),
                                            },
                                        ],
                                    },
                                    {
                                        path: 'activity',
                                        handle: {
                                            breadcrumb: () =>
                                                i18n.t('Activity'),
                                            collapseSidebar: true,
                                        } satisfies RouteHandle,
                                        element: <PredictionActivityPage />,
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        path: '/models',
                        handle: {
                            breadcrumb: () => i18n.t('Models'),
                        } satisfies RouteHandle,
                        children: [
                            {
                                index: true,
                                element: <ModelsPage />,
                            },
                            {
                                path: 'new',
                                element: <NewConfiguredModelPage />,
                                handle: {
                                    breadcrumb: () => i18n.t('New model'),
                                    collapseSidebar: true,
                                } satisfies RouteHandle,
                            },
                        ],
                    },
                ],
            },
            {
                path: '/settings',
                handle: {
                    collapseSidebar: true,
                    fullWidth: true,
                } satisfies RouteHandle,
                element: <SettingsLayout />,
                children: [
                    {
                        index: true,
                        element: <GeneralSettings />,
                    },
                    {
                        path: 'modeling-defaults',
                        element: <ModelingDefaults />,
                    },
                    {
                        path: 'data-pruning',
                        element: (
                            <Dhis2Required>
                                <DataPruningCard />
                            </Dhis2Required>
                        ),
                    },
                    {
                        path: 'experimental',
                        element: <ExperimentalSettings />,
                    },
                ],
            },
            {
                path: '/get-started',
                handle: {
                    collapseSidebar: true,
                } satisfies RouteHandle,
                element: <GetStartedPage />,
            },
            {
                path: '/guides',
                element: <GuidesPage />,
                handle: {
                    collapseSidebar: true,
                } satisfies RouteHandle,
                children: [{ index: true }, { path: ':guideSlug' }],
            },
        ],
    },
]);

const App = () => {
    return (
        <>
            <CssReset />
            <CssVariables theme spacers colors elevations />

            <Suspense
                fallback={
                    <div style={{ padding: 32 }} role="status">
                        Loading workspace…
                    </div>
                }
            >
                <RouterProvider router={router} />
            </Suspense>
        </>
    );
};

export default App;
