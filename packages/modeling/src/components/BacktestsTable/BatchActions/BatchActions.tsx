import { useState } from 'react';
import {
    Button,
    ButtonStrip,
    IconDelete16,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { Table } from '@tanstack/react-table';
import { BacktestRead } from '@chap-blocks/api';
import styles from './BatchActions.module.css';
import { useBatchDeleteBacktests } from '../hooks/useBatchDeleteBacktests';

type Props = {
    table: Table<BacktestRead>;
};

export const BatchActions = ({ table }: Props) => {
    const {
        deleteBacktests,
        isSubmitting: isBatchDeleting,
    } = useBatchDeleteBacktests({
        onSuccess: () => {
            setConfirming(false);
            table.resetRowSelection();
        },
    });
    const [confirming, setConfirming] = useState(false);
    const selectedCount = table.getSelectedRowModel().rows.length;

    const handleDelete = () => {
        const selectedIds = table.getSelectedRowModel().rows.map(row => row.original.id);
        deleteBacktests(selectedIds);
    };

    return (
        <div className={styles.batchActionsContainer}>
            <div className={styles.leftSection}>
                {i18n.t('{{count}} evaluations selected', {
                    count: table.getSelectedRowModel().rows.length,
                    defaultValue: '{{count}} evaluation selected',
                    defaultValue_plural: '{{count}} evaluations selected',
                })}
            </div>

            <div className={styles.rightSection}>
                <Button
                    icon={<IconDelete16 />}
                    small
                    onClick={() => setConfirming(true)}
                    loading={isBatchDeleting}
                >
                    {i18n.t('Delete')}
                </Button>

                <Button
                    small
                    onClick={() => table.resetRowSelection()}
                    disabled={isBatchDeleting}
                >
                    {i18n.t('Cancel')}
                </Button>
            </div>
            {confirming && (
                <Modal small onClose={() => setConfirming(false)} dataTest="batch-delete-backtests-modal">
                    <ModalTitle>{i18n.t('Delete evaluations')}</ModalTitle>
                    <ModalContent>
                        <p>
                            {i18n.t('Are you sure you want to delete {{count}} evaluations? This action cannot be undone.', {
                                count: selectedCount,
                                defaultValue: 'Are you sure you want to delete {{count}} evaluation? This action cannot be undone.',
                                defaultValue_plural: 'Are you sure you want to delete {{count}} evaluations? This action cannot be undone.',
                            })}
                        </p>
                    </ModalContent>
                    <ModalActions>
                        <ButtonStrip>
                            <Button secondary onClick={() => setConfirming(false)} disabled={isBatchDeleting}>
                                {i18n.t('Cancel')}
                            </Button>
                            <Button
                                primary
                                destructive
                                onClick={handleDelete}
                                loading={isBatchDeleting}
                                disabled={isBatchDeleting}
                                dataTest="submit-batch-delete-backtests-button"
                            >
                                {i18n.t('Delete')}
                            </Button>
                        </ButtonStrip>
                    </ModalActions>
                </Modal>
            )}
        </div>
    );
};
