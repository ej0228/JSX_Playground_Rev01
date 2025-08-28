// src/components/DataTable/DataTable.jsx
import React from 'react';
import styles from './DataTable.module.css';
import {
  MoreVertical,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Star,
  Trash2,
} from 'lucide-react';

export function DataTable({
  columns,
  data,
  renderEmptyState,
  keyField,
  selectedRowKey,
  onRowClick,
  showCheckbox = false,
  onCheckboxChange,
  selectedRows = new Set(),
  showFavorite = true, // 기본값을 true로 변경
  onFavoriteClick,
  favoriteState = {},
  onToggleAllFavorites, // 전체 토글 함수 prop 추가
  showDelete = false,
  onDeleteClick,
}) {
  const allChecked = data.length > 0 && data.every(row => selectedRows.has(row[keyField]));
  const allFavorited = data.length > 0 && data.every(row => favoriteState[row[keyField]]);

  const handleAllCheckboxChange = (e) => {
    const newSelectedRows = new Set();
    if (e.target.checked) {
      data.forEach(row => newSelectedRows.add(row[keyField]));
    }
    onCheckboxChange(newSelectedRows);
  };

  const handleRowCheckboxChange = (rowId) => {
    const newSelectedRows = new Set(selectedRows);
    if (newSelectedRows.has(rowId)) {
      newSelectedRows.delete(rowId);
    } else {
      newSelectedRows.add(rowId);
    }
    onCheckboxChange(newSelectedRows);
  };

  return (
    <>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              {showCheckbox && (
                <th>
                  <input type="checkbox" checked={allChecked} onChange={handleAllCheckboxChange} />
                </th>
              )}
              {showFavorite && (
                <th>
                  <Star
                    size={16}
                    className={`${styles.starIcon} ${allFavorited ? styles.favorited : ''}`}
                    onClick={onToggleAllFavorites}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
              )}
              {columns.map((col, index) => (
                <th key={index}>{col.header}</th>
              ))}
              {showDelete && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((row) => {
                const rowKey = String(row[keyField]);
                const isSelected = selectedRowKey === rowKey;

                return (
                  <tr
                    key={rowKey}
                    onClick={() => onRowClick?.(row)}
                    className={`${onRowClick ? styles.clickableRow : ''} ${isSelected ? styles.selectedRow : ''}`}
                  >
                    {showCheckbox && (
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedRows.has(rowKey)}
                          onChange={() => handleRowCheckboxChange(rowKey)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                    )}
                    {showFavorite && (
                      <td>
                        <Star
                          size={16}
                          className={`${styles.starIcon} ${favoriteState[rowKey] ? styles.favorited : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onFavoriteClick(rowKey);
                          }}
                        />
                      </td>
                    )}
                    {columns.map((col, index) => (
                      <td key={index}>
                        {col.accessor ? col.accessor(row) : null}
                      </td>
                    ))}
                    {showDelete && (
                      <td>
                        <div className={styles.actionsCell}>
                          <button
                            className={styles.iconButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteClick(rowKey);
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={columns.length + (showCheckbox ? 1 : 0) + (showFavorite ? 1 : 0) + (showDelete ? 1 : 0)} className={styles.emptyCell}>
                  {renderEmptyState()}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <div className={styles.rowsPerPage}>
          <span>Rows per page</span>
          <select>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
        <div className={styles.pageInfo}>Page 1 of 1</div>
        <div className={styles.pageControls}>
          <button className={styles.iconButton} disabled><ChevronsLeft size={18} /></button>
          <button className={styles.iconButton} disabled><ChevronLeft size={18} /></button>
          <button className={styles.iconButton} disabled><ChevronRight size={18} /></button>
          <button className={styles.iconButton} disabled><ChevronsRight size={18} /></button>
        </div>
      </div>
    </>
  );
}