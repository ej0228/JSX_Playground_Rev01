// src/components/FilterControls/RefreshButton.jsx
import React from 'react';
import { RefreshCw } from 'lucide-react';
import FilterButton from '../FilterButton/FilterButton';

const RefreshButton = ({ onClick }) => {
  return (
    <FilterButton onClick={onClick}>
      <RefreshCw size={16} />
    </FilterButton>
  );
};

export default RefreshButton;