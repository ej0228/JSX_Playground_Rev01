import React, {useState, useEffect} from 'react';
import {ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight} from 'lucide-react';
import styles from './layout/CustomPagination.module.css';

const CustomPagination = ({
                              pageSizes,
                              currentPage,
                              totalPages,
                              totalItems,
                              onPageChange,
                              onLimitChange,
                          }) => {

    const [inputValue, setInputValue] = useState(String(currentPage ?? 1));
    const [pageSize, setPageSize] = useState(pageSizes[0] || 10);

    useEffect(() => {
    setInputValue(String(currentPage ?? 1));
}, [currentPage]);

    const onPageInputChange = (e) => {
        setInputValue(e.target.value);
    };

    const onPageInputKeyDown = (e) => {
        if (e.key === 'Enter') {
            const page = parseInt(inputValue, 10);
            if (!isNaN(page) && page > 0 && page <= totalPages) {
                onPageChange(page); // 부모에게 페이지 변경 알림
            } else {
                setInputValue(currentPage.toString());
            }
        }
    };

    // 페이지 크기 변경 핸들러 추가
    const onPageSizeChange = (e) => {
        const newSize = Number(e.target.value);
        setPageSize(newSize);
        onLimitChange(newSize); // 부모에게 페이지 크기 변경 알림
    };

    const onBtFirst = () => onPageChange(1);
    const onBtPrev = () => onPageChange(currentPage - 1);
    const onBtNext = () => onPageChange(currentPage + 1);
    const onBtLast = () => onPageChange(totalPages);

    if (totalPages === 0) {
        return null;
    }

    return (
        <div className={styles.paginationContainer}>
            <div className={styles.pageSizeSelector}>
                <span>Rows per page</span>
                <select value={pageSize} onChange={onPageSizeChange} className={styles.pageSizeSelect}>
                    {pageSizes.map(size => (
                        <option key={size} value={size}>
                            {size}
                        </option>
                    ))}
                </select>
            </div>

            <div className={styles.controlsWrapper}>
                <div className={styles.pageInfo}>
                    <span>Page</span>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={onPageInputChange}
                        onKeyDown={onPageInputKeyDown}
                        onBlur={() => setInputValue(currentPage.toString())}
                        className={styles.pageInput}
                    />
                    <span>of {totalPages}</span>
                </div>
                <div className={styles.buttonGroup}>
                    <button onClick={onBtFirst} disabled={currentPage === 1} className={styles.button}>
                        <ChevronsLeft size={18}/>
                    </button>
                    <button onClick={onBtPrev} disabled={currentPage === 1} className={styles.button}>
                        <ChevronLeft size={18}/>
                    </button>
                    <button onClick={onBtNext} disabled={currentPage === totalPages} className={styles.button}>
                        <ChevronRight size={18}/>
                    </button>
                    <button onClick={onBtLast} disabled={currentPage === totalPages} className={styles.button}>
                        <ChevronsRight size={18}/>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomPagination;