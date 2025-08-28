// src/pages/Tracing/Tracing.jsx
import { useState, useMemo, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import dayjs from 'dayjs';
import styles from './Tracing.module.css';
import { DataTable } from 'components/DataTable/DataTable';
import { traceTableColumns } from './traceColumns.jsx';
import SearchInput from 'components/SearchInput/SearchInput';
import FilterControls from 'components/FilterControls/FilterControls';
import TraceDetailPanel from './TraceDetailPanel.jsx';
import { useSearch } from '../../hooks/useSearch.js';
import { useEnvironmentFilter } from '../../hooks/useEnvironmentFilter.js';
import { useTimeRangeFilter } from '../../hooks/useTimeRangeFilter';
import ColumnVisibilityModal from './ColumnVisibilityModal.jsx';
import FilterButton from 'components/FilterButton/FilterButton';
import { Columns, Plus, Edit } from 'lucide-react';
import { createTrace, updateTrace } from './CreateTrace.jsx';
import { langfuse } from '../../lib/langfuse';
import { fetchTraces, deleteTrace } from './TracingApi';
import { fetchTraceDetails } from './TraceDetailApi';
import { COLUMN_OPTIONS } from 'components/FilterControls/FilterBuilder';

const Tracing = () => {
  const [activeTab, setActiveTab] = useState('Traces');
  const [selectedTrace, setSelectedTrace] = useState(null);
  const [traces, setTraces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchType, setSearchType] = useState('IDs / Names');
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [favoriteState, setFavoriteState] = useState({});
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [pendingTraceId, setPendingTraceId] = useState(null);
  const [builderFilters, setBuilderFilters] = useState(() => {
      const initialColumn = COLUMN_OPTIONS[0];
      return [{ id: 1, column: initialColumn, operator: '=', value: '', metaKey: '' }];
  });

  const allEnvironments = useMemo(() => {
    if (!traces || traces.length === 0) return [];
    const uniqueEnvNames = [...new Set(traces.map(trace => trace.environment || 'default'))];
    return uniqueEnvNames.map((name, index) => ({ id: `env-${index}`, name }));
  }, [traces]);

  const timeRangeFilter = useTimeRangeFilter();
  const { selectedEnvs, ...envFilterProps } = useEnvironmentFilter(allEnvironments);
  const { searchQuery, setSearchQuery, filteredData } = useSearch(traces, searchType);

  const builderFilterProps = {
    filters: builderFilters,
    onFilterChange: setBuilderFilters,
  };

  const columnMapping = {
    "ID": "id",
    "Name": "name",
    "Timestamp": "timestamp",
    "User ID": "userId",
    "Session ID": "sessionId",
    "Version": "version",
    "Release": "release",
    "Tags": "tags",
    "Input Tokens": "inputTokens",
    "Output Tokens": "outputTokens",
    "Total Tokens": "totalTokens",
    "Latency (s)": "latency",
    "Input Cost ($)": "inputCost",
    "Output Cost ($)": "outputCost",
    "Total Cost ($)": "totalCost",
    "Environment": "environment"
  };

  const filteredTraces = useMemo(() => {
    let tempTraces = filteredData;
    const selectedEnvNames = new Set(selectedEnvs.map(e => e.name));
    if (selectedEnvNames.size > 0) {
      tempTraces = tempTraces.filter(trace => selectedEnvNames.has(trace.environment));
    }

    const { startDate, endDate } = timeRangeFilter;
    if (startDate && endDate) {
      tempTraces = tempTraces.filter(trace => {
        const traceTimestamp = dayjs(trace.timestamp);
        return traceTimestamp.isAfter(startDate) && traceTimestamp.isBefore(endDate);
      });
    }

    const activeFilters = builderFilters.filter(f => String(f.value).trim() !== '');
    if (activeFilters.length > 0) {
        tempTraces = tempTraces.filter(trace => {
            return activeFilters.every(filter => {
                const traceKey = columnMapping[filter.column];
                if (!traceKey) {
                    alert('해당 columns가 없습니다.');
                    return true;
                }

                const traceValue = trace[traceKey];
                const filterValue = filter.value;

                if (traceValue === null || traceValue === undefined) return false;

                const traceString = String(traceValue).toLowerCase();
                const filterString = String(filterValue).toLowerCase();

                switch (filter.operator) {
                    case '=':
                        return traceString === filterString;
                    case 'contains':
                        return traceString.includes(filterString);
                    case 'does not contain':
                        return !traceString.includes(filterString);
                    case 'starts with':
                        return traceString.startsWith(filterString);
                    case 'ends with':
                        return traceString.endsWith(filterString);
                    case '>':
                        return Number(traceValue) > Number(filterValue);
                    case '<':
                        return Number(traceValue) < Number(filterValue);
                    case '>=':
                        return Number(traceValue) >= Number(filterValue);
                    case '<=':
                        return Number(traceValue) <= Number(filterValue);
                    case 'any of':
                        return filterString.split(',').some(val => traceString.includes(val.trim()));
                    case 'none of':
                        return !filterString.split(',').some(val => traceString.includes(val.trim()));
                    default:
                        return true;
                }
            });
        });
    }

    return tempTraces;
  }, [filteredData, selectedEnvs, timeRangeFilter, builderFilters]);

  const toggleFavorite = useCallback((traceId) => {
    setFavoriteState(prev => ({ ...prev, [traceId]: !prev[traceId] }));
  }, []);

  const toggleAllFavorites = () => {
    const allFavorited = traces.length > 0 && traces.every(trace => favoriteState[trace.id]);
    const newFavoriteState = {};
    traces.forEach(trace => {
      newFavoriteState[trace.id] = !allFavorited;
    });
    setFavoriteState(newFavoriteState);
  };

  const [columns, setColumns] = useState(
    traceTableColumns.map(c => ({ ...c, visible: true }))
  );

  const loadTraces = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedTraces = await fetchTraces();
      setTraces(fetchedTraces);
      const initialFavorites = {};
      fetchedTraces.forEach(trace => {
        initialFavorites[trace.id] = trace.isFavorited || false;
      });
      setFavoriteState(initialFavorites);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => { loadTraces(); }, []);

  const handleCreateClick = async () => {
    const newTraceId = await createTrace();
    if (newTraceId) {
      setPendingTraceId(newTraceId);
    }
  };

  const handleUpdateClick = async () => {
    const traceIdToUpdate = window.prompt("업데이트할 Trace의 ID를 입력하세요:");
    if (!traceIdToUpdate) return;
    const traceToUpdate = traces.find(t => t.id === traceIdToUpdate.trim());
    if (!traceToUpdate) {
      alert(`ID '${traceIdToUpdate}'에 해당하는 Trace를 찾을 수 없습니다.`);
      return;
    }
    const langfuseTraceObject = langfuse.trace({ id: traceToUpdate.id, _dangerouslyIgnoreCorruptData: true });
    await updateTrace(langfuseTraceObject, loadTraces);
  };

  const handleDeleteTrace = useCallback(async (traceId) => {
    if (window.confirm(`정말로 이 트레이스를 삭제하시겠습니까? ID: ${traceId}`)) {
      try {
        await deleteTrace(traceId);
        setTraces(prevTraces => prevTraces.filter(trace => trace.id !== traceId));
        alert('Trace가 성공적으로 삭제되었습니다.');
      } catch (err) {
        alert('Trace 삭제에 실패했습니다.');
        console.error(err);
      }
    }
  }, []);

  const handleRowClick = (trace) => setSelectedTrace(prev => (prev?.id === trace.id ? null : trace));
  const setAllColumnsVisible = (visible) => setColumns(prev => prev.map(col => ({ ...col, visible })));
  const toggleColumnVisibility = (key) => setColumns(prev => prev.map(col => col.key === key ? { ...col, visible: !col.visible } : col));
  const visibleColumns = useMemo(() => columns.filter(c => c.visible), [columns]);

  useEffect(() => {
    if (!pendingTraceId) return;

    setTraces(prevTraces => [
      { 
        id: pendingTraceId, 
        name: `Creating trace ${pendingTraceId.substring(0, 7)}...`, 
        timestamp: new Date().toLocaleString(), 
        input: 'Pending...', 
        output: 'Pending...',
        userId: '...',
        cost: null,
        latency: 0,
        observations: '...'
      },
      ...prevTraces,
    ]);

    const interval = setInterval(async () => {
      try {
        await fetchTraceDetails(pendingTraceId);
        
        clearInterval(interval);
        setPendingTraceId(null);
        await loadTraces();
        console.log(`Trace ${pendingTraceId} has been confirmed and list updated.`);

      } catch (error) {
        console.log(`Polling for trace ${pendingTraceId}... not found yet.`);
      }
    }, 2000);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setPendingTraceId(null);
      alert(`Trace ${pendingTraceId} 생성 확인에 실패했습니다. 목록을 수동으로 새로고침 해주세요.`);
      loadTraces();
    }, 30000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [pendingTraceId]);


  return (
    <div className={styles.container}>
      <div className={styles.listSection}>
        
        <div className={styles.tabs}>
          <button className={`${styles.tabButton} ${activeTab === 'Traces' ? styles.active : ''}`} onClick={() => setActiveTab('Traces')}>Traces</button>
          <button className={`${styles.tabButton} ${activeTab === 'Observations' ? styles.active : ''}`} onClick={() => setActiveTab('Observations')}>Observations</button>
        </div>
        
        <div className={styles.filterBar}>
          <div className={styles.filterLeftGroup}>
            <SearchInput
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              searchType={searchType}
              setSearchType={setSearchType}
              searchTypes={['IDs / Names', 'Full Text']}
            />
            <FilterControls
              onRefresh={loadTraces}
              envFilterProps={envFilterProps}
              timeRangeFilterProps={timeRangeFilter}
              builderFilterProps={builderFilterProps}
            />
          </div>
          <div className={styles.filterRightGroup}>
            <FilterButton onClick={handleCreateClick}>
              <Plus size={16} /> New Trace
            </FilterButton>

            <FilterButton onClick={handleUpdateClick} style={{marginLeft: '8px'}}>
              <Edit size={16} /> Update Trace
            </FilterButton>

            <FilterButton onClick={() => setIsColumnModalOpen(true)} style={{marginLeft: '8px'}}>
              <Columns size={16} /> Columns ({visibleColumns.length}/{columns.length})
            </FilterButton>
          </div>
        </div>
        
        <div className={styles.contentArea}>
          {activeTab === 'Traces' && (
            isLoading ? <div>Loading traces...</div> : 
            error ? <div style={{ color: 'red' }}>Error: {error}</div> : 
            (
                <DataTable
                  columns={visibleColumns}
                  data={filteredTraces}
                  keyField="id"
                  renderEmptyState={() => <div>No traces found.</div>}
                  onRowClick={handleRowClick}
                  selectedRowKey={selectedTrace?.id || null}
                  showCheckbox={true}
                  selectedRows={selectedRows}
                  onCheckboxChange={setSelectedRows}
                  onFavoriteClick={toggleFavorite}
                  favoriteState={favoriteState}
                  onToggleAllFavorites={toggleAllFavorites}
                  showDelete={true}
                  onDeleteClick={handleDeleteTrace}
                />
            )
          )}
        </div>
      </div>

      {selectedTrace && ReactDOM.createPortal(
        <TraceDetailPanel
          trace={selectedTrace}
          onClose={() => setSelectedTrace(null)}
        />,
        document.body
      )}

      <ColumnVisibilityModal
        isOpen={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
        columns={columns}
        toggleColumnVisibility={toggleColumnVisibility}
        setAllColumnsVisible={setAllColumnsVisible}
      />
    </div>
  );
};

export default Tracing;