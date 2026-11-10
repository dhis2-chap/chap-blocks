import { useChapClient } from '@chap-blocks/runtime';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type AlertPolicyCodesUpdate, type AlertPolicyCreate, type AlertPolicyRead, type ApiError, type DataBaseResponse } from '@chap-blocks/api';
import { PREDICTION_SETUPS_QUERY_KEY } from './usePredictionSetups';

export const ALERT_POLICIES_QUERY_KEY = ['alert-policies'];

export const useAlertPolicies = () => {
    const chapClient = useChapClient();
    return useQuery<AlertPolicyRead[], ApiError>({
    queryKey: ALERT_POLICIES_QUERY_KEY,
    queryFn: () => chapClient.alertPolicies.listAlertPoliciesV1CrudAlertPoliciesGet(),
    retry: false,
});
};

export const useCreateAlertPolicy = () => {
    const chapClient = useChapClient();
    const queryClient = useQueryClient();
    return useMutation<DataBaseResponse, ApiError, AlertPolicyCreate>({
        mutationFn: (policy: AlertPolicyCreate) => chapClient.alertPolicies.createAlertPolicyV1CrudAlertPoliciesPost(policy),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ALERT_POLICIES_QUERY_KEY }),
    });
};

export const useDeleteAlertPolicy = () => {
    const chapClient = useChapClient();
    const queryClient = useQueryClient();
    return useMutation<unknown, ApiError, number>({
        mutationFn: (id: number) => chapClient.alertPolicies.deleteAlertPolicyV1CrudAlertPoliciesAlertPolicyIdDelete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ALERT_POLICIES_QUERY_KEY }),
    });
};

export const useUpdateAlertPolicyCodes = () => {
    const chapClient = useChapClient();
    const queryClient = useQueryClient();
    return useMutation<AlertPolicyRead, ApiError, { policyId: number; codes: AlertPolicyCodesUpdate }>({
        mutationFn: ({ policyId, codes }) => chapClient.alertPolicies.updateAlertPolicyCodesV1CrudAlertPoliciesAlertPolicyIdPatch(policyId, codes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ALERT_POLICIES_QUERY_KEY });
            // Prediction setups embed their policy, so imports must see the new codes.
            queryClient.invalidateQueries({ queryKey: [PREDICTION_SETUPS_QUERY_KEY] });
        },
    });
};
