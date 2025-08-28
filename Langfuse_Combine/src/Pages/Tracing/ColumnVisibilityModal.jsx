import React from 'react';
import styles from './ColumnVisibilityModal.module.css';
import { X } from 'lucide-react';

const ColumnVisibilityModal = ({
  isOpen,
  onClose,
  columns,
  toggleColumnVisibility,
  setAllColumnsVisible,
}) => {
  if (!isOpen) {
    return null;
  }

  const visibleColumnCount = columns.filter(c => c.visible).length;
  const allColumnsVisible = visibleColumnCount === columns.length;

  const handleSelectAllChange = (e) => {
    setAllColumnsVisible(e.target.checked);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Column Visibility</h3>
          <div className={styles.headerActions}>
            <button className={styles.actionButton}>Restore Defaults</button>
            <button onClick={onClose} className={styles.closeButton}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className={styles.selectAllRow}>
          <label className={styles.columnItem}>
            <input
              type="checkbox"
              checked={allColumnsVisible}
              onChange={handleSelectAllChange}
            />
            <span className={styles.selectAllLabel}>
              Select All Columns
              <span className={styles.columnCount}>{visibleColumnCount}/{columns.length}</span>
            </span>
          </label>
        </div>

        <div className={styles.columnList}>
          {columns.map(col => (
            <label key={col.key} className={styles.columnItem}>
              <input
                type="checkbox"
                checked={col.visible}
                onChange={() => toggleColumnVisibility(col.key)}
              />
              <span>{typeof col.header === 'string' ? col.header : col.key}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ColumnVisibilityModal;