// src/components/FilterControls/FilterControls.jsx
import React from 'react';
import styles from './FilterControls.module.css';
import TimeRangeFilter from './TimeRangeFilter';
import EnvironmentFilter from './EnvironmentFilter';
import FilterBuilder from './FilterBuilder';
import RefreshButton from './RefreshButton';

const FilterControls = ({ onRefresh, envFilterProps, timeRangeFilterProps, builderFilterProps }) => {
  return (
    <div className={styles.filterControls}>
      <TimeRangeFilter {...timeRangeFilterProps} />
      <EnvironmentFilter {...envFilterProps} />
      <FilterBuilder {...builderFilterProps} />
      {onRefresh && <RefreshButton onClick={onRefresh} />}
    </div>
  );
};

export default FilterControls;