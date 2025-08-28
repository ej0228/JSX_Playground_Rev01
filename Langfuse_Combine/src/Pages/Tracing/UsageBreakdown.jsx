import React from 'react';
import styles from './UsageBreakdown.module.css';

const UsageBreakdown = ({ usage, style }) => {
  if (!usage) return null;

  const { input = 0, output = 0, total = 0 } = usage;

  return (
    <div className={styles.tooltipContainer} style={style}>
      <h4 className={styles.title}>Usage breakdown</h4>
      <p className={styles.subtitle}>Aggregate across 1 generation</p>
      <div className={styles.row}>
        <span>Input usage</span>
        <span>{input}</span>
      </div>
      <div className={styles.subRow}>
        <span>input</span>
        <span>{input}</span>
      </div>
      <div className={styles.row}>
        <span>Output usage</span>
        <span>{output}</span>
      </div>
      <div className={styles.subRow}>
        <span>output</span>
        <span>{output}</span>
      </div>
      <div className={styles.totalRow}>
        <span>Total usage</span>
        <span>{total}</span>
      </div>
    </div>
  );
};

export default UsageBreakdown;