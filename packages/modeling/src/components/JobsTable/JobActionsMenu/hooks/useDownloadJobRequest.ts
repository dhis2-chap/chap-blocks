import { useChapClient } from '@chap-blocks/runtime';
import type { ChapClient } from '@chap-blocks/api';
import { useMutation } from '@tanstack/react-query';
import { useAlert } from '@chap-blocks/runtime';
import i18n from '@dhis2/d2-i18n';
import { ApiError } from '@chap-blocks/api';

export const downloadJobRequest = async (jobId: string, chapClient: ChapClient) => {
    const request = await chapClient.jobs.getJobRequestV1JobsJobIdRequestGet(jobId);
    const blob = new Blob([JSON.stringify(request, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `job-${jobId}-request.json`;
    document.body.appendChild(link);
    try {
        link.click();
    } finally {
        link.remove();
        URL.revokeObjectURL(url);
    }
};

export const useDownloadJobRequest = () => {
    const chapClient = useChapClient();
    const { show: showUnavailableAlert } = useAlert(
        i18n.t('The original request is not available for this job.'),
        { critical: true },
    );
    const { show: showErrorAlert } = useAlert(
        i18n.t('Failed to download the job request. Please try again.'),
        { critical: true },
    );

    const { mutate, isLoading } = useMutation({
        mutationFn: (jobId: string) => downloadJobRequest(jobId, chapClient),
        onError: (error) => {
            if (error instanceof ApiError && error.status === 404) {
                showUnavailableAlert();
            } else {
                showErrorAlert();
            }
        },
    });

    return { downloadRequest: mutate, isLoading };
};
