/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseHttpRequest } from './core/BaseHttpRequest';
import type { OpenAPIConfig } from './core/OpenAPI';
import { FetchHttpRequest } from './core/FetchHttpRequest';
import { AlertPoliciesService } from './services/AlertPoliciesService';
import { AlertsService } from './services/AlertsService';
import { BacktestsService } from './services/BacktestsService';
import { DatasetsService } from './services/DatasetsService';
import { JobsService } from './services/JobsService';
import { MetricsService } from './services/MetricsService';
import { ModelsService } from './services/ModelsService';
import { PredictionsService } from './services/PredictionsService';
import { PredictionSetupsService } from './services/PredictionSetupsService';
import { ServicesService } from './services/ServicesService';
import { SystemService } from './services/SystemService';
import { VisualizationsService } from './services/VisualizationsService';
type HttpRequestConstructor = new (config: OpenAPIConfig) => BaseHttpRequest;
export class GeneratedChapClient {
    public readonly alertPolicies: AlertPoliciesService;
    public readonly alerts: AlertsService;
    public readonly backtests: BacktestsService;
    public readonly datasets: DatasetsService;
    public readonly jobs: JobsService;
    public readonly metrics: MetricsService;
    public readonly models: ModelsService;
    public readonly predictions: PredictionsService;
    public readonly predictionSetups: PredictionSetupsService;
    public readonly services: ServicesService;
    public readonly system: SystemService;
    public readonly visualizations: VisualizationsService;
    public readonly request: BaseHttpRequest;
    constructor(config?: Partial<OpenAPIConfig>, HttpRequest: HttpRequestConstructor = FetchHttpRequest) {
        this.request = new HttpRequest({
            BASE: config?.BASE ?? '',
            VERSION: config?.VERSION ?? '2.7.0.dev0',
            WITH_CREDENTIALS: config?.WITH_CREDENTIALS ?? false,
            CREDENTIALS: config?.CREDENTIALS ?? 'include',
            TOKEN: config?.TOKEN,
            USERNAME: config?.USERNAME,
            PASSWORD: config?.PASSWORD,
            HEADERS: config?.HEADERS,
            ENCODE_PATH: config?.ENCODE_PATH,
        });
        this.alertPolicies = new AlertPoliciesService(this.request);
        this.alerts = new AlertsService(this.request);
        this.backtests = new BacktestsService(this.request);
        this.datasets = new DatasetsService(this.request);
        this.jobs = new JobsService(this.request);
        this.metrics = new MetricsService(this.request);
        this.models = new ModelsService(this.request);
        this.predictions = new PredictionsService(this.request);
        this.predictionSetups = new PredictionSetupsService(this.request);
        this.services = new ServicesService(this.request);
        this.system = new SystemService(this.request);
        this.visualizations = new VisualizationsService(this.request);
    }
}

