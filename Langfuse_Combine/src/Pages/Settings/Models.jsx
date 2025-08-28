import React, {useState, useCallback, useRef, useMemo, useEffect} from 'react';
import {AgGridReact} from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import {Plus, GitCommitHorizontal, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight} from 'lucide-react';
import {useNavigate} from 'react-router-dom';

import commonStyles from './layout/SettingsCommon.module.css';
import gridStyles from './layout/SettingsGrid.module.css';
import styles from './layout/Models.module.css';

import CustomPagination from './CustomPagination';
import ColumnMenu from '../../layouts/ColumnMenu';
import SidePanel from '../../components/SidePanel/SidePanel.jsx'
import NewModelForm from './form/NewModelForm';

import {
    listAllModels,
    getModel,
    createModel,
    deleteModel,
} from '../../api/Settings/ModelsApi';

// ──────────────────────────────────────
// Cell Renderers
// ──────────────────────────────────────
const MaintainerRenderer = () => (
    <div className={styles.maintainerCell}>
        <GitCommitHorizontal size={16} color="#ef4444"/>
    </div>
);

const PricesRenderer = ({data}) => {
    const fmt = (n) => (typeof n === 'number' ? `$${n.toFixed(6)}` : '—');
    return (
        <div className={styles.pricesCell}>
            <div><span>input</span> {fmt(data?.inputPrice)}</div>
            <div><span>output</span> {fmt(data?.outputPrice)}</div>
        </div>
    );
};

const TokenizerConfRenderer = ({data}) => {
    const config = data?.tokenizerConfig ?? {};
    const entries = Object.entries(config);
    if (entries.length === 0) return <span className={styles.dim}>—</span>;
    return (
        <div className={styles.tokenizerConfigCell}>
            {entries.map(([k, v]) => (
                <div key={k}><b>{k}</b>: {typeof v === 'object' ? JSON.stringify(v) : String(v)}</div>
            ))}
        </div>
    );
};

const ActionsRenderer = (props) => {
    const onClone = props.context?.onClone;
    const onDelete = props.context?.onDelete;
    const id = props.data?.id;

    return (
        <div className={styles.actionsCell}>
            <button
                className={styles.cloneButton}
                onClick={() => id && onClone?.(id)}
                disabled={!id || !onClone}
                title={!id ? 'Invalid row' : undefined}
            >
                Clone
            </button>
            <button
                className={styles.deleteButton}
                onClick={() => id && onDelete?.(id)}
                disabled={!id || !onDelete}
                title={!id ? 'Invalid row' : undefined}
            >
                Delete
            </button>
        </div>
    );
};

// ──────────────────────────────────────
// Columns
// ──────────────────────────────────────
const COLUMN_DEFINITIONS = [
    {field: 'modelName', headerName: 'Model Name', width: 180, cellStyle: {fontWeight: 'bold'}, lockVisible: true},
    {field: 'maintainer', headerName: 'Maintainer', width: 120, cellRenderer: MaintainerRenderer, lockVisible: true},
    {field: 'matchPattern', headerName: 'Match Pattern', width: 240, lockVisible: true},
    {field: 'prices', headerName: 'Prices per unit', width: 200, cellRenderer: PricesRenderer},
    {field: 'tokenizer', headerName: 'Tokenizer', width: 140},
    {
        field: 'tokenizerConfig',
        headerName: 'Tokenizer Config',
        width: 300,
        cellRenderer: TokenizerConfRenderer,
        autoHeight: true
    },
    {field: 'lastUsed', headerName: 'Last used', width: 120},
    {
        field: 'actions',
        headerName: 'Actions',
        width: 160,
        cellRenderer: ActionsRenderer,
        sortable: false,
        resizable: false,
        lockVisible: true
    },
];

const Models = () => {
    const navigate = useNavigate();

    const gridRef = useRef(null);
    // ✅ gridApi: 한 번만 선언
    const [gridApi, setGridApi] = useState(null);

    const pageSizes = useMemo(() => [10, 20, 30, 40, 50], []);

    const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
    const columnButtonRef = useRef(null);

    const [rowData, setRowData] = useState([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const [columnVisibility, setColumnVisibility] = useState({
        modelName: true,
        maintainer: true,
        matchPattern: true,
        prices: true,
        tokenizer: true,
        tokenizerConfig: true,
        lastUsed: true,
        actions: true,
    });

    // 목록 로드
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const models = await listAllModels(200);
                const rows = models.map((m) => ({
                    id: m.id,
                    modelName: m.modelName,
                    maintainer: m.isLangfuseManaged ? 'Langfuse' : 'Custom',
                    matchPattern: m.matchPattern,
                    inputPrice: (m.inputPrice ?? m.prices?.input?.price) ?? null,
                    outputPrice: (m.outputPrice ?? m.prices?.output?.price) ?? null,
                    tokenizer: m.tokenizerId ?? '',
                    tokenizerConfig: m.tokenizerConfig ?? {},
                    lastUsed: '',
                    isLangfuseManaged: m.isLangfuseManaged,
                }));
                if (mounted) setRowData(rows);
            } catch (e) {
                console.error('[Models] fetch error', e);
                if (mounted) setRowData([]);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    // 새로 만들기 버튼 핸들러 (실제 사용)
    const openCreate = useCallback(() => setIsCreateOpen(true), []);

    const handleClone = useCallback(async (id) => {
        try {
            const src = await getModel(id);
            const payload = {
                modelName: `${src.modelName} (copy)`,
                matchPattern: src.matchPattern,
                unit: (src.unit ?? 'TOKENS'),
                tokenizerId: src.tokenizerId ?? null,
                tokenizerConfig: src.tokenizerConfig ?? {},
                isLangfuseManaged: false,
                inputPrice: typeof src.inputPrice === 'number' ? src.inputPrice : null,
                outputPrice: typeof src.outputPrice === 'number' ? src.outputPrice : null,
                prices: src.prices
                    ? Object.fromEntries(Object.entries(src.prices).map(([k, v]) => [k, {price: v.price}]))
                    : undefined,
            };
            const created = await createModel(payload);
            setRowData(prev => [{
                id: created.id,
                modelName: created.modelName,
                maintainer: created.isLangfuseManaged ? 'Langfuse' : 'Custom',
                matchPattern: created.matchPattern,
                inputPrice: (created.inputPrice ?? created.prices?.input?.price) ?? null,
                outputPrice: (created.outputPrice ?? created.prices?.output?.price) ?? null,
                tokenizer: created.tokenizerId ?? '',
                tokenizerConfig: created.tokenizerConfig ?? {},
                lastUsed: '',
                isLangfuseManaged: created.isLangfuseManaged,
            }, ...prev]);
            alert('Model cloned.');
        } catch (e) {
            console.error('[Models] clone error', e);
            alert('Failed to clone model.');
        }
    }, []);

    const handleDelete = useCallback(async (id) => {
        if (!confirm('Delete this model?')) return;
        try {
            await deleteModel(id);
            setRowData(prev => prev.filter(r => r.id !== id));
        } catch (e) {
            console.error('[Models] delete error', e);
            alert('Failed to delete model. See console for more info.');
        }
    }, []);

    const handleSaveModel = useCallback(async (payload) => {
        try {
            const created = await createModel(payload);
            setRowData(prev => [{
                id: created.id,
                modelName: created.modelName,
                maintainer: created.isLangfuseManaged ? 'Langfuse' : 'Custom',
                matchPattern: created.matchPattern,
                inputPrice: (created.inputPrice ?? created.prices?.input?.price) ?? null,
                outputPrice: (created.outputPrice ?? created.prices?.output?.price) ?? null,
                tokenizer: created.tokenizerId ?? '',
                tokenizerConfig: created.tokenizerConfig ?? {},
                lastUsed: '',
                isLangfuseManaged: created.isLangfuseManaged,
            }, ...prev]);
            setIsCreateOpen(false);
        } catch (e) {
            console.error('[Models] create error', e);
            alert('Failed to create model. See console for more info.');
        }
    }, []);

    const handleSaveModelFromForm = useCallback((modelData) => {
        const unit = 'TOKENS';
        const payload = {
            modelName: String(modelData.modelName || '').trim(),
            matchPattern: String(modelData.matchPattern || '').trim(),
            unit,
            tokenizerId: modelData.tokenizer === 'none' ? null : modelData.tokenizer,
            tokenizerConfig: {},
            isLangfuseManaged: false,
            prices: modelData.prices
                ? Object.fromEntries(
                    Object.entries(modelData.prices).map(([k, v]) => [k, {price: Number(v) || 0}])
                )
                : undefined,
        };
        void handleSaveModel(payload);
    }, [handleSaveModel]);

    // ✅ 행 클릭 → 상세 페이지로 상대 이동
    const onRowClicked = useCallback((ev) => {
        const id = ev.data?.id;
        if (!id) return;
        navigate(`/${encodeURIComponent(id)}`); // 상대 경로 이동 (/settings/models/:id)
    }, [navigate]);

    // Column menu 파생
    const visibleColumnCount = useMemo(
        () => Object.values(columnVisibility).filter(Boolean).length,
        [columnVisibility]
    );
    const mandatoryFields = useMemo(
        () => COLUMN_DEFINITIONS.filter(c => c.lockVisible).map(c => c.field),
        []
    );
    const columnDisplayNames = useMemo(
        () =>
            COLUMN_DEFINITIONS.reduce((acc, col) => {
                acc[col.field] = col.headerName;
                return acc;
            }, {}),
        []
    );
    const toggleColumnVisibility = (field) => {
        const col = COLUMN_DEFINITIONS.find(c => c.field === field);
        if (col?.lockVisible) return;
        setColumnVisibility(prev => ({...prev, [field]: !prev[field]}));
    };
    const toggleAllColumns = (select) => {
        const next = {...columnVisibility};
        COLUMN_DEFINITIONS.forEach(col => {
            if (!col.lockVisible) next[col.field] = select;
        });
        setColumnVisibility(next);
    };
    const columnDefs = useMemo(
        () => COLUMN_DEFINITIONS.map(col => ({...col, hide: !columnVisibility[col.field]})),
        [columnVisibility]
    );
    const defaultColDef = useMemo(() => ({minWidth: 50, resizable: true, sortable: true}), []);
    const icons = {
        paginationFirst: () => <ChevronsLeft size={18}/>,
        paginationPrev: () => <ChevronLeft size={18}/>,
        paginationNext: () => <ChevronRight size={18}/>,
        paginationLast: () => <ChevronsRight size={18}/>,
    };

    return (
        <div className={commonStyles.container}>
            <h3 className={commonStyles.title}>Models</h3>
            <p className={commonStyles.p}>A model represents a LLM model. It is used to calculate tokens and cost.</p>

            <div className={gridStyles.header}>
                <div
                    ref={columnButtonRef}
                    className={gridStyles.columnsButtonWrapper}
                    onClick={() => setIsColumnMenuOpen(prev => !prev)}
                >
                    <button className={`${gridStyles.headerButton} ${gridStyles.columnsButton}`}>
                        <span>Columns</span>
                        <span className={gridStyles.count}>
                            {visibleColumnCount}/{COLUMN_DEFINITIONS.length}
                        </span>
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

                {/* ✅ 미사용 경고 방지: 핸들러 사용 */}
                <button onClick={openCreate} className={`${gridStyles.headerButton} ${gridStyles.addButton}`}>
                    <Plus size={16}/> Add model definition
                </button>
            </div>

            <div className={`ag-theme-alpine ${gridStyles.gridContainer}`}>
                <AgGridReact
                    ref={gridRef}
                    rowData={rowData}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    pagination
                    paginationPageSize={pageSizes[0]}
                    suppressPaginationPanel
                    // ✅ onGridReady 인라인 사용 → 미사용 경고/중복 선언 제거
                    onGridReady={(e) => setGridApi(e.api)}
                    onRowClicked={onRowClicked}
                    rowHeight={96}
                    domLayout="autoHeight"
                    context={{onClone: handleClone, onDelete: handleDelete}}
                    icons={icons}
                />
            </div>

            {/* 생성 사이드패널 */}
            <SidePanel isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)}>
                <NewModelForm onSave={handleSaveModelFromForm} onCancel={() => setIsCreateOpen(false)}/>
            </SidePanel>

            {gridApi && <CustomPagination gridApi={gridApi} pageSizes={pageSizes}/>}
        </div>
    );
};

export default Models;