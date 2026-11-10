import { useChapClient } from '@chap-blocks/runtime';
import { ApiError, WeatherProviderInfo } from '@chap-blocks/api';
import { useRoute } from '@chap-blocks/runtime';
import { useQuery } from '@tanstack/react-query';
import { Features, useIsFeatureAvailable } from './useIsFeatureAvailable';

export const useWeatherProviders = () => {
    const chapClient = useChapClient();
    const { route } = useRoute();
    const { isAvailable } = useIsFeatureAvailable(Features.BACKTEST_PARAMETERS);
    return useQuery<WeatherProviderInfo[], ApiError>({
        queryKey: ['weather-providers', route?.url],
        queryFn: () => chapClient.backtests.listFutureWeatherProvidersV1AnalyticsWeatherProvidersGet(),
        staleTime: Infinity,
        retry: false,
        enabled: isAvailable,
    });
};
