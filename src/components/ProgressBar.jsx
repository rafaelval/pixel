import styles from "./ProgressBar.module.css";

export const ProgressBar = ({ done, total }) => {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className={styles.wrap}>
      <div className={styles.bar} style={{ width: `${pct}%` }} />
      <span className={styles.label}>{done} / {total}</span>
    </div>
  );
};
