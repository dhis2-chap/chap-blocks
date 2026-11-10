import { ModelSpecRead, PredictionInfo } from '@chap-blocks/api';
import { QuantileMappingFormContainer } from './QuantileMappingForm/QuantileMappingFormContainer';
import styles from './PredictionImport.module.css';

type Props = {
    prediction: PredictionInfo;
    model: ModelSpecRead;
};

export const PredictionImport = ({ prediction, model }: Props) => {
    return (
        <div className={styles.container}>
            <QuantileMappingFormContainer
                prediction={prediction}
                model={model}
            />
        </div>
    );
};
