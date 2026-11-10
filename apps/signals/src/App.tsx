import { useEffect } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Button, CircularLoader, NoticeBox, SingleSelect, SingleSelectOption } from '@dhis2/ui';
import { describeError, usePredictionSetup, usePredictionSetups } from './queries';
import { useHashState } from './useHashState';
import { Dashboard } from './components/Dashboard';

export const App = () => {
    const [view, update] = useHashState();
    const setups = usePredictionSetups();
    const list = setups.data ?? [];
    const setupId = list.some(setup => setup.id === view.setup) ? view.setup : list[0]?.id;
    const setup = usePredictionSetup(setupId);

    // Make the default choice part of the link without adding a history entry.
    useEffect(() => {
        if (setupId !== undefined && setupId !== view.setup) {
            update({ setup: setupId, region: undefined, period: undefined }, { replace: true });
        }
    }, [setupId, view.setup, update]);

    if (setups.isLoading) {
        return <div className="center page-status" role="status"><CircularLoader /><span>{i18n.t('Connecting to Chap…')}</span></div>;
    }
    if (setups.error) {
        return (
            <NoticeBox error title={i18n.t('Could not load prediction setups')}>
                <p>{describeError(setups.error)}</p>
                <Button small onClick={() => setups.refetch()}>{i18n.t('Try again')}</Button>
            </NoticeBox>
        );
    }
    if (!list.length) {
        return (
            <NoticeBox title={i18n.t('No prediction setups')}>
                {i18n.t('This Chap server has no prediction setups. Signals appear once a setup has been created and run in the modeling app.')}
            </NoticeBox>
        );
    }

    return (
        <>
            <div className="page-head">
                <div>
                    <h1>{i18n.t('Outbreak signals')}</h1>
                    <p className="muted">{i18n.t('Latest forecast and signal level for every region of a prediction setup.')}</p>
                </div>
                <div className="setup-select">
                    <SingleSelect
                        dense
                        prefix={i18n.t('Prediction setup')}
                        selected={setupId !== undefined ? String(setupId) : undefined}
                        onChange={({ selected }) => update({ setup: Number(selected), region: undefined, period: undefined })}
                    >
                        {list.map(item => <SingleSelectOption key={item.id} value={String(item.id)} label={item.name} />)}
                    </SingleSelect>
                </div>
            </div>
            {setup.isLoading && <div className="center" role="status"><CircularLoader small /></div>}
            {setup.error != null && (
                <NoticeBox error title={i18n.t('Could not load the prediction setup')}>{describeError(setup.error)}</NoticeBox>
            )}
            {setup.data && <Dashboard key={setup.data.id} setup={setup.data} view={view} onChange={update} />}
        </>
    );
};
