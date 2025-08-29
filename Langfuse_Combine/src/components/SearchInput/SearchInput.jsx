// src/components/SearchInput/SearchInput.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Search, Info, ChevronDown } from 'lucide-react';
import styles from './SearchInput.module.css';

const SearchInput = ({
  placeholder,
  value,
  onChange,
  searchType,
  setSearchType,
  searchTypes,
  className,
  style,
  fullWidth = false,  // ⬅️ 한 줄 꽉 채우기
  dense = false       // ⬅️ 입력창 세로여백 정돈
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTypeSelect = (type) => {
    setSearchType(type);
    setIsDropdownOpen(false);
  };

  return (
    <div
      ref={dropdownRef}
      className={[
        styles.searchBox,
        fullWidth ? styles.fullWidth : "",
        dense ? styles.dense : "",
        className || ""
      ].join(" ")}
      style={style}
    >
      <Search size={18} className={styles.searchIcon} />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      <div className={styles.searchTypeSelector} onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
        <span>{searchType}</span>
        <Info size={14} className={styles.infoIcon} />
        <ChevronDown size={16} />
      </div>

      {isDropdownOpen && (
        <div className={styles.dropdownMenu}>
          {/* searchTypes prop을 기반으로 동적으로 메뉴 아이템 생성 */}
          {searchTypes.map((type) => (
            <div
              key={type}
              className={`${styles.dropdownItem} ${searchType === type ? styles.active : ''}`}
              onClick={() => handleTypeSelect(type)}
            >
              <span className={styles.dot}>●</span> {type}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchInput;