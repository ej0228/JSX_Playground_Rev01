import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Filter, X, Plus, Calendar } from 'lucide-react';
import FilterButton from '../FilterButton/FilterButton';
import styles from './FilterBuilder.module.css';
import DateRangePopup from '../DateRange/DateRangePopup';
import dayjs from 'dayjs';

// 옵션 정의 (변경 없음)
export const COLUMN_OPTIONS = ["ID", "Name", "Timestamp", "User ID", "Session ID", "Metadata", "Version", "Release", "Level", "Tags", "Input Tokens", "Output Tokens", "Total Tokens", "Tokens", "Error Level Count", "Warning Level Count", "Default Level Count", "Debug Level Count", "Scores (numeric)", "Scores (categorical)", "Latency (s)", "Input Cost ($)", "Output Cost ($)", "Total Cost ($)"];
const STRING_OPERATORS = ["=", "contains", "does not contain", "starts with", "ends with"];
const NUMERIC_OPERATORS = [">", "<", ">=", "<="];
const CATEGORICAL_OPERATORS = ["any of", "none of"];
const COLUMN_TYPE_MAP = {
  numeric: ["Timestamp", "Input Tokens", "Output Tokens", "Total Tokens", "Tokens", "Error Level Count", "Warning Level Count", "Default Level Count", "Debug Level Count", "Scores (numeric)", "Latency (s)", "Input Cost ($)", "Output Cost ($)", "Total Cost ($)"],
  categorical: ["Tags", "Scores (categorical)", "ID", "Level"],
  string: ["Name", "User ID", "Session ID", "Metadata", "Version", "Release"],
};

const FilterBuilder = ({ filters, onFilterChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    const menuRef = useRef(null);
    const [datePickerState, setDatePickerState] = useState({ isOpen: false, filterId: null, triggerRef: null });

    const getOperatorsForColumn = (column) => {
        if (COLUMN_TYPE_MAP.numeric.includes(column)) return NUMERIC_OPERATORS;
        if (COLUMN_TYPE_MAP.categorical.includes(column)) return CATEGORICAL_OPERATORS;
        return STRING_OPERATORS;
    };

    const addFilter = () => {
        const defaultColumn = COLUMN_OPTIONS[0];
        const newFilter = { id: Date.now(), column: defaultColumn, operator: getOperatorsForColumn(defaultColumn)[0], value: '', metaKey: '' };
        onFilterChange([...filters, newFilter]);
    };

    const removeFilter = (id) => {
        if (filters.length === 1) {
            const initialColumn = COLUMN_OPTIONS[0];
            onFilterChange([{ id: filters[0].id, column: initialColumn, operator: getOperatorsForColumn(initialColumn)[0], value: '', metaKey: '' }]);
        } else {
            onFilterChange(filters.filter(f => f.id !== id));
        }
    };

    const updateFilter = (id, field, value) => {
        onFilterChange(prev => prev.map(f => {
            if (f.id !== id) return f;
            if (field === 'column') {
                return { ...f, column: value, operator: getOperatorsForColumn(value)[0], value: '' };
            }
            return { ...f, [field]: value };
        }));
    };

    const handleOpenDatePicker = (event, filterId) => {
        setDatePickerState({ isOpen: true, filterId, triggerRef: { current: event.currentTarget } });
    };

    const handleDateSelect = (date) => {
        if (datePickerState.filterId) {
            updateFilter(datePickerState.filterId, 'value', dayjs(date).format('YYYY-MM-DD HH:mm:ss'));
        }
    };

    const closeDatePicker = () => {
        setDatePickerState({ isOpen: false, filterId: null, triggerRef: null });
    };

    const currentFilterDate = useMemo(() => {
        const filter = filters.find(f => f.id === datePickerState.filterId);
        return filter?.value ? new Date(filter.value) : new Date();
    }, [filters, datePickerState.filterId]);

    useEffect(() => {
        if (!isOpen || !containerRef.current || !menuRef.current) return;
        const menuElement = menuRef.current;
        const recalculatePosition = () => {
            const containerRect = containerRef.current.getBoundingClientRect();
            const menuWidth = menuElement.offsetWidth;
            const viewportWidth = window.innerWidth;
            const margin = 16;
            let newLeft = 0;
            if (containerRect.left + newLeft + menuWidth > viewportWidth - margin) {
                newLeft = viewportWidth - margin - containerRect.left - menuWidth;
            }
            if (containerRect.left + newLeft < margin) {
                newLeft = margin - containerRect.left;
            }
            menuElement.style.left = `${newLeft}px`;
        };
        const resizeObserver = new ResizeObserver(recalculatePosition);
        resizeObserver.observe(menuElement);
        recalculatePosition();
        return () => resizeObserver.disconnect();
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const activeFilterCount = useMemo(() => filters.filter(f => String(f.value).trim() !== '').length, [filters]);

    return (
        <div className={styles.container} ref={containerRef}>
            <FilterButton onClick={() => setIsOpen(!isOpen)}>
                <Filter size={14} /> Filters
                {activeFilterCount > 0 && <span className={styles.badge}>{activeFilterCount}</span>}
            </FilterButton>

            {isOpen && (
                <div className={styles.dropdownMenu} ref={menuRef}>
                    {filters.map((filter, index) => (
                        <div key={filter.id} className={styles.filterRow}>
                            <span className={styles.conjunction}>{index === 0 ? 'Where' : 'And'}</span>
                            <select className={styles.select} value={filter.column} onChange={e => updateFilter(filter.id, 'column', e.target.value)}>
                                {COLUMN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                            {filter.column === 'Metadata' && (
                                <input type="text" className={styles.input} placeholder="key" value={filter.metaKey} onChange={e => updateFilter(filter.id, 'metaKey', e.target.value)} />
                            )}
                            <select className={styles.select} value={filter.operator} onChange={e => updateFilter(filter.id, 'operator', e.target.value)}>
                                {getOperatorsForColumn(filter.column).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                            {filter.column === 'Timestamp' ? (
                                <button className={styles.dateButton} onClick={(e) => handleOpenDatePicker(e, filter.id)}>
                                    <Calendar size={14} />
                                    <span>{filter.value ? dayjs(filter.value).format('YYYY-MM-DD') : 'Pick a date'}</span>
                                </button>
                            ) : (
                                <input type="text" className={styles.input} value={filter.value} placeholder="string" onChange={e => updateFilter(filter.id, 'value', e.target.value)} />
                            )}
                            <button className={styles.removeButton} onClick={() => removeFilter(filter.id)}><X size={16} /></button>
                        </div>
                    ))}
                    <button className={styles.addButton} onClick={addFilter}><Plus size={14} /> Add filter</button>
                </div>
            )}

            {datePickerState.isOpen && (
                <DateRangePopup
                    startDate={currentFilterDate}
                    endDate={currentFilterDate}
                    setStartDate={handleDateSelect}
                    setEndDate={handleDateSelect}
                    onClose={closeDatePicker}
                    triggerRef={datePickerState.triggerRef}
                />
            )}
        </div>
    );
};

export default FilterBuilder;