import React, {useState, useRef, useCallback, useMemo, useEffect} from 'react'
import { AgGridReact } from 'ag-grid-react';
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import {Plus, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import commonStyles from './layout/SettingsCommon.module.css'
import gridStyles from './layout/SettingsGrid.module.css'
import styles from './layout/Members.module.css'
import CustomPagination from "./CustomPagination";
import ColumnMenu from "../../layouts/ColumnMenu";
import Modal from '../../components/Modal/Modal.jsx'
import NewMemberForm from './form/NewMemberForm'

const DUMMY_MEMBERS_DATA = [
  { id: '1', name: 'Na Youngseok', email: 'youngseok@naver.com', organizationRole: 'Owner', projectRole: 'N/A on plan', memberSince: '2025-08-01' },
  // 페이지네이션 테스트를 위해 데이터 추가
  ...Array.from({ length: 30 }, (_, i) => ({
      id: `${i + 2}`,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      organizationRole: (['Admin', 'Member'])[i % 2],
      projectRole: 'N/A on plan',
      memberSince: '2025-08-01',
  })),
];

// Name
const NameRenderer = (props) => (
    <div className = { styles.nameCell }>
        <span>{ props.value }</span>
    </div>
)

// Organization Role
const OrganizationRoleRenderer = (props) => (
    <div className = { styles.roleCell }>
        <select defaultValue ={ props.value } className = { styles.roleSelect }>
            <option>Owner</option>
            <option>Admin</option>
            <option>Member</option>
            <option>Viewer</option>
            <option>None</option>
        </select>
    </div>
)

const ActionsRenderer = () => {
    return (
        <div className = { styles.actionRenderer }>
            <button className = { styles.actionButton }>
                <Trash2 size = { 16 } />
            </button>
        </div>
    )
}

const COLUMN_DEFINITIONS = [
    { field: 'name', headerName: 'Name', cellRenderer: NameRenderer, flex: 2, resizable: true, sortable: true, lockVisible: true },
    { field: 'email', headerName: 'Email', flex: 3, resizable: true, sortable: true, lockVisible: true },
    { field: 'organizationRole', headerName: 'Organization Role', cellRenderer: OrganizationRoleRenderer, flex: 2, resizable: true, sortable: true, lockVisible: true },
    { field: 'projectRole', headerName: 'Project Role', flex: 2, resizable: true, sortable: true, lockVisible: true },
    { field: 'memberSince', headerName: 'Member Since', flex: 1, resizable: true, sortable: true, initialHide: true },
    { field: 'actions', headerName: 'Actions', cellRenderer: ActionsRenderer, flex: 1, resizable: false, sortable: false, lockVisible: true },
]

const Members = () => {
    const gridRef = useRef(null);
    const [gridApi, setGridApi] = useState(null);
    const pageSizes = useMemo(() => [10, 20, 30, 40, 50], []);

    const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
    const columnButtonRef = useRef(null);

    const [rowData, setRowData] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // 페이지네이션 상태 추가
    const [paginationMeta, setPaginationMeta] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(pageSizes[0]);

    // 더미 데이터를 페이지에 맞게 잘라서 보여주는 로직으로 수정
    useEffect(() => {
        const totalItems = DUMMY_MEMBERS_DATA.length;
        const totalPages = Math.ceil(totalItems / limit);
        const start = (currentPage - 1) * limit;
        const end = start + limit;
        const paginatedData = DUMMY_MEMBERS_DATA.slice(start, end);

        setRowData(paginatedData);
        setPaginationMeta({
            page: currentPage,
            limit: limit,
            totalItems: totalItems,
            totalPages: totalPages,
        });
    }, [currentPage, limit]);

    const [columnVisibility, setColumnVisibility] = useState(() =>{
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
         setColumnVisibility(prev => ({ ...prev, [field]: !prev[field] }));
     };

    const toggleAllColumns = (select) => {
        const newVisibility = { ...columnVisibility };
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
        })),
    [columnVisibility]);

     const icons = {
        paginationFirst: () => <ChevronsLeft size={18} />,
        paginationPrev: () => <ChevronLeft size={18} />,
        paginationNext: () => <ChevronRight size={18} />,
        paginationLast: () => <ChevronsRight size={18} />,
    };

    const onGridReady = useCallback((event) => {
         setGridApi(event.api);
     }, []);

    return (
        <div className = { commonStyles.container }>
            <h3 className={commonStyles.title}>Project Members</h3>
            <div className = { gridStyles.header }>
                <div ref = { columnButtonRef } className = { gridStyles.columnsButtonWrapper } onClick={() => setIsColumnMenuOpen(prev => !prev)}>
                    <button
                        className = { `${ gridStyles.headerButton } ${ gridStyles.columnsButton }` }
                    >
                        <span>Columns</span>
                        <span className = { gridStyles.count }>{ visibleColumnCount }/{ COLUMN_DEFINITIONS.length }</span>
                    </button>
                    <ColumnMenu
                        isOpen = { isColumnMenuOpen }
                        onClose = { () => setIsColumnMenuOpen(false) }
                        anchorE1 = { columnButtonRef }
                        columnVisibility = { columnVisibility }
                        toggleColumnVisibility = { toggleColumnVisibility }
                        displayNames = { columnDisplayNames }
                        mandatoryFields = { mandatoryFields }
                        onToggleAll = { toggleAllColumns }
                    />
                </div>
                <button onClick = { () => setIsModalOpen(true) } className = { `${ gridStyles.headerButton} ${ gridStyles.addButton }` } >
                    <Plus size = { 16 } /> Add new member
                </button>
            </div>

            <div className = { `ag-theme-alpine ${ gridStyles.gridContainer }` }>
                <AgGridReact
                    ref={gridRef}
                    rowData={rowData}
                    columnDefs={columnDefs}
                    onGridReady={onGridReady}
                    domLayout='autoHeight'
                />
            </div>

            <Modal
                title = "Add new member to the organization"
                isOpen = { isModalOpen }
                onClose = { () => setIsModalOpen(false) }
            >
                <NewMemberForm onClose = { () => setIsModalOpen(false) } />
            </Modal>

            {paginationMeta && (
                <CustomPagination
                    pageSizes={pageSizes}
                    currentPage={paginationMeta.page}
                    totalPages={paginationMeta.totalPages}
                    totalItems={paginationMeta.totalItems}
                    onPageChange={(page) => setCurrentPage(page)}
                    onLimitChange={(newLimit) => {
                        setLimit(newLimit);
                        setCurrentPage(1);
                    }}
                />
            )}
        </div>
    );
};

export default Members;