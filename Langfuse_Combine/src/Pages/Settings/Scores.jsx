import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {AgGridReact} from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import {Plus, Archive, ArchiveRestore, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight} from 'lucide-react';
import commonStyles from './layout/SettingsCommon.module.css'
import gridStyles from './layout/SettingsGrid.module.css'
import CustomPagination from './CustomPagination';
import ColumnMenu from "../../layouts/ColumnMenu";
import Modal from '../../components/Modal/Modal.jsx'
import NewScoreForm from './form/NewScoreForm'
import {publicKey, secretKey, baseUrl} from '../../lib/langfuse'
import {fetchScoreConfigsAPI, createScoreConfigAPI, updateScoreConfigStatusAPI} from '../../api/Settings/ScoreApi'

// Basic Auth를 위한 Base64 인코딩
const base64Credentials =
    publicKey && secretKey
        ? btoa(`${publicKey}:${secretKey}`)
        : '';

const transformApiToGridData = (apiData) => {
    return apiData.map(item => {
        let range = '';

        if (item.dataType === 'NUMERIC') {
            // <<< START: 올바른 문자열을 생성하도록 수정 >>>
            range = `{Minimum: ${item.minValue ?? '-∞'}, Maximum: ${item.maxValue ?? '∞'}}`;
            // <<< END: 올바른 문자열을 생성하도록 수정 >>>
        } else if (item.dataType === 'CATEGORICAL' && item.categories) {
            range = item.categories.reduce((acc, cat) => {
                acc[cat.value.toString()] = cat.label;
                return acc;
            }, {});
        } else if (item.dataType === 'BOOLEAN' && item.categories) {
            range = item.categories.reduce((acc, cat) => {
                acc[cat.value.toString()] = cat.label;
                return acc;
            }, {});
        }

        return {
            id: item.id,
            configID: item.id,
            name: item.name,
            dataType: item.dataType,
            range: range,
            description: item.description ?? '',
            projectId: item.projectId,
            createdAt: new Date(item.createdAt).toLocaleDateString(),
            status: item.isArchived ? 'Archived' : 'Active',
        };
    });
};

// Range Renderer
const RangeRenderer = (props) => {
    const rangeData = props.value;
    let displayValue = '';
    if (typeof rangeData === 'object' && rangeData !== null) {
        displayValue = JSON.stringify(rangeData, null, 2);
    } else if (typeof rangeData === 'string') {
        displayValue = rangeData;
    }
    return <div className={commonStyles.simpleTokenizerCell}
                style={{whiteSpace: 'pre-wrap', overflow: 'auto'}}>{displayValue}</div>;
};

// Actions Renderer
const ActionsRenderer = (props) => {
    const {data, onToggleStatus} = props;

    // 상태 변경 버튼 클릭 핸들러
    const handleToggleClick = () => {
        if (data) {
            onToggleStatus(data.id, data.status);
        }
    };

    // status 값에 따라 다른 아이콘을 보여줍니다.
    const Icon = data?.status === 'Active' ? Archive : ArchiveRestore;
    const tooltip = data?.status === 'Active' ? 'Archive this score' : 'Restore this score';

    return (
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%'}}>
            <button
                onClick={handleToggleClick}
                style={{background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8'}}
                title={tooltip}
            >
                <Icon size={16}/>
            </button>
        </div>
    );
};

const COLUMN_DEFINITIONS = [
    {field: 'name', headerName: 'Name', flex: 2, resizable: true, sortable: true},
    {field: 'dataType', headerName: 'Data Type', flex: 3, resizable: true, sortable: true},
    {field: 'range', headerName: 'Range', cellRenderer: RangeRenderer, flex: 10, resizable: true, autoHeight: true},
    {field: 'description', headerName: 'Description', flex: 5, resizable: true},
    {field: 'configID', headerName: 'Config ID', flex: 3, resizable: true, initialHide: true},
    {field: 'createdAt', headerName: 'Created At', flex: 3, resizable: true, initialHide: true},
    {field: 'status', headerName: 'Status', flex: 2, resizable: true, sortable: true},
    {
        field: 'actions',
        headerName: 'Action',
        cellRenderer: ActionsRenderer,
        flex: 2,
        resizable: false,
        sortable: false,
    },
]

const Scores = () => {
    const gridRef = useRef(null);
    const [gridApi, setGridApi] = useState(null);
    const pageSizes = useMemo(() => [10, 20, 30, 40, 50], []);

    const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
    const columnButtonRef = useRef(null);

    const [rowData, setRowData] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [isToggleModalOpen, setIsToggleModalOpen] = useState(false);
    const [scoreToToggle, setScoreToToggle] = useState(null);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 페이지네이션 상태 추가
    const [paginationMeta, setPaginationMeta] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const fetchScoreConfigs = useCallback(async (page, limit) => {
        if (!base64Credentials) {
            setError("Langfuse API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchScoreConfigsAPI(page, limit, base64Credentials);
            const gridData = transformApiToGridData(data.data);
            setRowData(gridData);
            setPaginationMeta(data.meta);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
            setRowData([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchScoreConfigs(currentPage, limit);
    }, [currentPage, limit, fetchScoreConfigs]);

    // 상태 변경 요청 핸들러
    const handleToggleRequest = useCallback((id, currentStatus) => {
        setScoreToToggle({id, status: currentStatus});
        setIsToggleModalOpen(true);
    }, []);

    // 상태 변경 확정 핸들러
    const handleConfirmToggle = async () => {
        if (scoreToToggle !== null) {
            const isArchived = scoreToToggle.status === 'Active';
            try {
                await updateScoreConfigStatusAPI(scoreToToggle.id, isArchived, base64Credentials);
                fetchScoreConfigs(currentPage, limit);
            } catch (err) {
                console.error("Failed to toggle status:", err);
                alert(err instanceof Error ? err.message : 'An unknown error occurred');
            } finally {
                setScoreToToggle(null);
                setIsToggleModalOpen(false);
            }
        }
    };

    const handleCreateScore = async (formData) => {
        if (!base64Credentials) {
            alert("API 키가 설정되지 않았습니다.");
            return;
        }
        try {
            await createScoreConfigAPI(formData, base64Credentials);
            setIsModalOpen(false);
            fetchScoreConfigs(currentPage, limit);
        } catch (err) {
            console.error("Failed to create score config:", err);
            alert(`Error: ${err instanceof Error ? err.message : 'An unknown error occurred'}`);
        }
    };

    const [columnVisibility, setColumnVisibility] = useState(() => {
        const initialVisibility = {};
        COLUMN_DEFINITIONS.forEach(col => {
            if (col.field) {
                initialVisibility[col.field] = !col.initialHide;
            }
        });
        return initialVisibility;
    });

    const toggleColumnVisibility = (field) => {
        const columnDef = COLUMN_DEFINITIONS.find(c => c.field === field);
        if (columnDef?.lockVisible) {
            return;
        }
        setColumnVisibility(prev => ({...prev, [field]: !prev[field]}));
    };

    const toggleAllColumns = (select) => {
        const newVisibility = {...columnVisibility};
        COLUMN_DEFINITIONS.forEach(col => {
            if (!col.lockVisible) {
                newVisibility[col.field] = select;
            }
        });
        setColumnVisibility(newVisibility);
    };

    const visibleColumnCount = useMemo(() => {
        return Object.values(columnVisibility).filter(isVisible => isVisible).length;
    }, [columnVisibility]);

    const mandatoryFields = useMemo(() =>
            COLUMN_DEFINITIONS.filter(c => c.lockVisible).map(c => c.field),
        []);

    const columnDisplayNames = useMemo(() =>
            COLUMN_DEFINITIONS.reduce((acc, col) => {
                if (col.field) {
                    acc[col.field] = col.headerName;
                }
                return acc;
            }, {}),
        []);

    const columnDefs = useMemo(() =>
            COLUMN_DEFINITIONS.map(col => ({
                ...col,
                hide: !columnVisibility[col.field],
                cellRendererParams: col.field === 'actions' ? {onToggleStatus: handleToggleRequest} : undefined,
            })),
        [columnVisibility]);

    const icons = {
        paginationFirst: () => <ChevronsLeft size={18}/>,
        paginationPrev: () => <ChevronLeft size={18}/>,
        paginationNext: () => <ChevronRight size={18}/>,
        paginationLast: () => <ChevronsRight size={18}/>,
    };

    const onGridReady = useCallback((event) => {
        setGridApi(event.api);
    }, []);

    // 모달의 동적 컨텐츠
    const modalInfo = useMemo(() => {
        if (!scoreToToggle) return {title: '', message: '', buttonText: ''};
        const isArchiving = scoreToToggle.status === 'Active';
        return {
            title: isArchiving ? 'Archive Score Config' : 'Restore Score Config',
            message: `Are you sure you want to ${isArchiving ? 'archive' : 'restore'} this score config?`,
            buttonText: isArchiving ? 'Archive' : 'Restore',
        };
    }, [scoreToToggle]);

    if (isLoading) return <div className={commonStyles.container}>Loading...</div>;
    if (error) return <div className={commonStyles.container}>Error: {error}
        <button onClick={() => fetchScoreConfigs(currentPage, limit)}>Retry</button>
    </div>;

    return (
        <div className={commonStyles.container}>
            <h3 className={commonStyles.title}>Score Configs</h3>
            <p className={commonStyles.p}>Score configs define which scores are available for annotation in your project. Please note that all
                score configs are immutable.</p>
            <div className={gridStyles.header}>
                {/* Columns 버튼을 div로 감싸서 position 기준점으로 만듦 */}
                <div ref={columnButtonRef} className={gridStyles.columnsButtonWrapper}
                     onClick={() => setIsColumnMenuOpen(prev => !prev)}>
                    <button
                        className={`${gridStyles.headerButton} ${gridStyles.columnsButton}`}
                    >
                        <span>Columns</span>
                        <span className={gridStyles.count}>{visibleColumnCount}/{COLUMN_DEFINITIONS.length}</span>
                    </button>
                    <ColumnMenu
                        isOpen={isColumnMenuOpen}
                        onClose={() => setIsColumnMenuOpen(false)}
                        anchorE1={columnButtonRef}
                        columnVisibility={columnVisibility}
                        toggleColumnVisibility={toggleColumnVisibility}
                        displayNames={columnDisplayNames}
                        mandatoryFields={mandatoryFields}
                        onToggleAll={toggleAllColumns}
                    />
                </div>
                <button onClick={() => setIsModalOpen(true)}
                        className={`${gridStyles.headerButton} ${gridStyles.addButton}`}>
                    <Plus size={16}/> Add new score config
                </button>
            </div>

            <div className={`ag-theme-alpine ${gridStyles.gridContainer}`}>
                <AgGridReact
                    ref={gridRef}
                    rowData={rowData}
                    columnDefs={columnDefs}
                    suppressRowClickSelection={true}
                    icons={icons}
                    rowHeight={96}
                    onGridReady={onGridReady}
                    domLayout='autoHeight'
                />
            </div>

            <Modal
                title="Add new score config"
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            >
                <NewScoreForm
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleCreateScore}
                />
            </Modal>

            {/* 상태 변경 확인 모달 */}
            <Modal
                title={modalInfo.title}
                isOpen={isToggleModalOpen}
                onClose={() => setIsToggleModalOpen(false)}
            >
                <div>
                    <p>{modalInfo.message}</p>
                    <div style={{display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px'}}>
                        <button onClick={() => setIsToggleModalOpen(false)} className={gridStyles.headerButton}>
                            Cancel
                        </button>
                        <button onClick={handleConfirmToggle}
                                className={`${gridStyles.headerButton} ${scoreToToggle?.status === 'Active' ? gridStyles.deleteButton : gridStyles.addButton}`}>
                            {modalInfo.buttonText}
                        </button>
                    </div>
                </div>
            </Modal>

            {gridApi && paginationMeta && (
                <CustomPagination
                    pageSizes={pageSizes}
                    currentPage={paginationMeta.page}
                    totalPages={paginationMeta.totalPages}
                    totalItems={paginationMeta.totalItems}
                    onPageChange={(page) => setCurrentPage(page)}
                    onLimitChange={(newLimit) => {
                        setLimit(newLimit);
                        setCurrentPage(1); // 페이지 크기 변경 시 1페이지로
                    }}
                />
            )}
        </div>
    );
};

export default Scores;