// src/components/AddToDatasetModal/AddToDatasetModal.jsx
import React, { useState } from 'react'; // useState를 import 합니다.
import ReactDOM from 'react-dom';
import { X, ChevronDown } from 'lucide-react';
import styles from './AddToDatasetModal.module.css';
import CodeBlock from '../CodeBlock/CodeBlock';

const AddToDatasetModal = ({ isOpen, onClose, input: initialInput, output: initialOutput, metadata }) => {
  // 1. CodeBlock의 내용을 관리할 내부 상태(state)를 추가합니다.
  const [input, setInput] = useState(initialInput);
  const [output, setOutput] = useState(initialOutput);

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    // 2. 저장 시 props 대신 내부 상태를 사용합니다.
    console.log('Adding to dataset:', { input, output });
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return ReactDOM.createPortal(
    <div className={styles.overlay} onClick={handleOverlayClick} data-is-portal="true">
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Add to datasets</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.formGroup}>
            <label htmlFor="datasets-select">Datasets</label>
            <div className={styles.selectWrapper}>
              <select id="datasets-select" className={styles.select}>
                <option>Select datasets</option>
              </select>
              <ChevronDown size={16} className={styles.selectArrow} />
            </div>
          </div>
          <div className={styles.ioGrid}>
            <div className={styles.ioColumn}>
              <label>Input</label>
              {/* 3. CodeBlock에 value와 onChange 핸들러를 전달합니다. */}
              <CodeBlock code={input} onChange={setInput} />
            </div>
            <div className={styles.ioColumn}>
              <label>Expected output</label>
              {/* 3. CodeBlock에 value와 onChange 핸들러를 전달합니다. */}
              <CodeBlock code={output} onChange={setOutput} />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Metadata</label>
            {/* Metadata는 보기만 가능하도록 onChange를 전달하지 않습니다. */}
            <CodeBlock code={metadata} />
          </div>
        </div>

        <div className={styles.footer}>
          <button onClick={handleSave} className={styles.saveButton}>
            Add to dataset
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AddToDatasetModal;