import React from 'react';
import styles from './FilterButton.module.css';

const FilterButton = ({ children, onClick }) => {
  return (
    <button className={styles.filterButton} onClick={onClick}>
      {children}
    </button>
  );
};

export default FilterButton;
