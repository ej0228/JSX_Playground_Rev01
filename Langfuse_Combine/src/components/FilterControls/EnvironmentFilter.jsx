// src/components/FilterControls/EnvironmentFilter.jsx
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './EnvironmentFilter.module.css';

const EnvironmentFilter = ({
  buttonLabel,
  searchTerm,
  setSearchTerm,
  filteredEnvironments,
  isAllSelected,
  // prop 이름을 훅의 반환값과 일치시킵니다.
  selectAllEnvironments,
  toggleEnvironment,
  clearAllEnvironments
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles.container} ref={dropdownRef}>
      <button className={styles.filterButton} onClick={() => setIsOpen(!isOpen)}>
        <span>Env</span>
        <span className={styles.value}>{buttonLabel}</span>
        <ChevronDown size={16} />
      </button>

      {isOpen && (
        <div className={styles.dropdownMenu}>
          <input
            type="text"
            placeholder="Environment"
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className={styles.optionsList}>
            <label className={styles.optionItem}>
              <input
                type="checkbox"
                checked={isAllSelected}
                // 'Select All' 체크박스 기능 연결
                onChange={(e) => selectAllEnvironments(e.target.checked)}
              />
              <span>Select All</span>
            </label>
            {filteredEnvironments.map(env => (
              <label key={env.id} className={styles.optionItem}>
                <input
                  type="checkbox"
                  checked={env.checked}
                  // 개별 체크박스 기능 연결
                  onChange={() => toggleEnvironment(env.id)}
                />
                <span>{env.name}</span>
              </label>
            ))}
          </div>
          {/* 'Clear filters' 버튼 기능 연결 */}
          <button className={styles.clearButton} onClick={clearAllEnvironments}>
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
};

export default EnvironmentFilter;