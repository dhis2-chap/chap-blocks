import styles from './Legend.module.css';

const formatBinValue = (value: number) =>
    value.toLocaleString(undefined, { maximumFractionDigits: Math.abs(value) < 10 ? 1 : 0 });

const Legend = ({ title, bins, colors }: any) => {
    return (
        <div className={styles.legend}>
            <br></br>
            <div className={styles.legendTitle}>{title}</div>
            <div className={styles.legendSymbols}>
                {bins.map((bin: any, index: number) => {
                    return (
                        <div className={styles.classItem} key={index}>
                            <span
                                className={styles.classSymbol}
                                style={{ backgroundColor: colors[index] }}
                            >
                            </span>
                            <span className={styles.classLabel}>
                                {formatBinValue(bin.startValue)}
                                {' - '}
                                {formatBinValue(bin.endValue)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Legend;
