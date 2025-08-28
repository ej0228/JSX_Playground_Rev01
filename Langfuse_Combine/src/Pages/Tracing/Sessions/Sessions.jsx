// src/pages/Tracing/Sessions/Sessions.jsx
import React, { useState, useMemo, useEffect } from 'react';
import styles from './Sessions.module.css';
import { RefreshCw, Columns } from 'lucide-react';
import ColumnVisibilityModal from '../ColumnVisibilityModal.jsx';
import { DataTable } from '../../../components/DataTable/DataTable.jsx'; 
import { sessionTableColumns } from './sessionColumns.jsx';
import FilterButton from '../../../components/FilterButton/FilterButton.jsx';
import FilterControls from '../../../components/FilterControls/FilterControls';
import DateRangePicker from 'components/DateRange/DateRangePicker.jsx';
import { fetchSessions } from './SessionApi.js';

const Sessions = () => {
    const [sessions, setSessions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSessionId, setSelectedSessionId] = useState(null);
    const [isColumnVisibleModalOpen, setIsColumnVisibleModalOpen] = useState(false);
    const [columns, setColumns] = useState(
        sessionTableColumns.map(c => ({ ...c, visible: c.visible }))
    );
    const [startDate, setStartDate] = useState(new Date(Date.now() - 24 * 60 * 60 * 1000));
    const [endDate, setEndDate] = useState(new Date());
    const [favoriteState, setFavoriteState] = useState({});
    const [selectedRows, setSelectedRows] = useState(new Set());

    const loadSessions = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const fetchedSessions = await fetchSessions();
            setSessions(fetchedSessions);
            const initialFavorites = {};
            fetchedSessions.forEach(s => {
              initialFavorites[s.id] = s.isFavorited || false;
            });
            setFavoriteState(initialFavorites);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { loadSessions(); }, []);

    const toggleFavorite = (sessionId) => {
        setFavoriteState(prev => ({ ...prev, [sessionId]: !prev[sessionId] }));
    };

    const toggleColumnVisibility = (key) => {
        setColumns(prev =>
            prev.map(col => (col.key === key ? { ...col, visible: !col.visible } : col))
        );
    };

    const setAllColumnsVisible = (visible) => {
        setColumns(prev => prev.map(col => ({ ...col, visible })));
    };

    const visibleColumns = useMemo(() => columns.filter(c => c.visible), [columns]);

    const renderTableContent = () => {
        if (isLoading) return <div>Loading sessions...</div>;
        if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;
        return (
            <DataTable
                columns={visibleColumns}
                data={sessions}
                keyField="id"
                renderEmptyState={() => <>No sessions found.</>}
                selectedRowKey={selectedSessionId}
                onRowClick={(row) => setSelectedSessionId(row.id)}
                showCheckbox={true}
                selectedRows={selectedRows}
                onCheckboxChange={setSelectedRows}
                showFavorite={true}
                favoriteState={favoriteState}
                onFavoriteClick={toggleFavorite}
            />
        );
    };
    
    return (
        <div className={styles.container}>
            <div className={styles.filterBar}>
                <div className={styles.filterLeft}>
                    <DateRangePicker 
                        startDate={startDate}
                        endDate={endDate}
                        setStartDate={setStartDate}
                        setEndDate={setEndDate}
                    />
                </div>
                <div className={styles.filterRight}>
                    <FilterControls onRefresh={loadSessions} />
                    <FilterButton onClick={() => setIsColumnVisibleModalOpen(true)}>
                        <Columns size={16} /> Columns ({visibleColumns.length}/{columns.length})
                    </FilterButton>
                </div>
            </div>

            <div className={styles.tableContainer}>
                {renderTableContent()}
            </div>

            <ColumnVisibilityModal
                isOpen={isColumnVisibleModalOpen}
                onClose={() => setIsColumnVisibleModalOpen(false)}
                columns={columns}
                toggleColumnVisibility={toggleColumnVisibility}
                setAllColumnsVisible={setAllColumnsVisible}
            />
        </div>
    );
};

export default Sessions;