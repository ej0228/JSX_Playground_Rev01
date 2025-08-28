import React from 'react';
import styles from './FormGroup.module.css';

const FormGroup = ({ label, subLabel, htmlFor, children }) => {
  return (
    <div className={styles.formGroup}>
      <label htmlFor={htmlFor} className={styles.label}>{label}</label>
      <p className={styles.subLabel}>{subLabel}</p>
      {children}
    </div>
  );
};

export default FormGroup;
