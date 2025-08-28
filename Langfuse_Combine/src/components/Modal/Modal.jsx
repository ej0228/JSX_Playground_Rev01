// src/components/Modal/Modal.jsx

import React from 'react';
import { X } from 'lucide-react';
import styles from './Modal.module.css';

// TypeScript 문법(interface, 타입 지정)을 모두 제거합니다.
const Modal = ({ children, isOpen, onClose, title }) => {
    if (!isOpen) {
        return null;
    }

    // ReactDOM.createPortal을 사용하면 더 안정적이지만,
    // 현재 구조를 유지하기 위해 기존 방식을 사용합니다.
    return (
        <div className={styles.backdrop} onClick={onClose}>
            <div className={styles.content} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3 className={styles.title}>{title}</h3>
                    <button onClick={onClose} className={styles.closeButton}><X size={16} /></button>
                </div>
                <div className={styles.body}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;