// src/components/SidePanel/SidePanel.jsx

import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import styles from './SidePanel.module.css';

const SidePanel = ({ title, isOpen, onClose, children }) => {
  const panelRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleOverlayClick = (e) => {
    if (panelRef.current && !panelRef.current.contains(e.target)) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  // isOpen 상태에 따라 '--open' 클래스를 동적으로 추가/제거
  const overlayClassName = `${styles.overlay} ${isOpen ? styles['overlay--open'] : ''}`;
  const panelClassName = `${styles.panel} ${isOpen ? styles['panel--open'] : ''}`;

  return ReactDOM.createPortal(
    <div className={overlayClassName} onClick={handleOverlayClick} data-is-portal="true">
      <div ref={panelRef} className={panelClassName} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          {title && <h3 className={styles.title}>{title}</h3>}
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>
        <div className={styles.body}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SidePanel;