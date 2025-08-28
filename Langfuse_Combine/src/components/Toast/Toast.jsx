// src/components/Toast/Toast.jsx
import React, { useEffect } from 'react';
import styles from './Toast.module.css';

const Toast = ({ message, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000); // 2초 후 자동으로 사라짐

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={styles.toast}>
      {message}
    </div>
  );
};

export default Toast;