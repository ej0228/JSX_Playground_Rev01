import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import styles from './ColumnMenu.module.css';

const ColumnMenu = ({
    isOpen,
    onClose,
    columnVisibility,
    toggleColumnVisibility,
    onToggleAll,
    anchorE1,
    displayNames,
    mandatoryFields = [],
}) => {
    const menuRef = useRef(null);
    const [position, setPosition] = useState(null);

    // anchorE1(버튼)의 위치를 기준으로 메뉴 위치 계산
    useEffect(() => {
        if (isOpen && anchorE1.current) {
            const rect = anchorE1.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
            });
        }
    }, [isOpen, anchorE1]);

    // 메뉴 바깥 클릭시 닫히게 하는 로직
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target) &&
                anchorE1.current &&
                !anchorE1.current.contains(event.target)
            ) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose, anchorE1]);

    const { isAnyColumnSelected, visibleCount, totalCount } = useMemo(() => {
        const keys = Object.keys(columnVisibility).filter(key => !mandatoryFields?.includes(key));
        const visible = keys.filter(key => columnVisibility[key]).length;
        return {
            isAnyColumnSelected: visible > 0,
            visibleCount: visible + mandatoryFields.length,
            totalCount: Object.keys(columnVisibility).length
        };
    }, [columnVisibility, mandatoryFields]);

    if (!isOpen || !position) {
        return null;
    }

    const columnKeys = Object.keys(columnVisibility);

    return (
        <div ref = { menuRef } className = { styles.columnMenu } style = { position ? { top: `${ position.top }px`, left: `${ position.left }px` } : {} }>
            <div className = { styles.toggleAllButton } onClick = { () => onToggleAll(!isAnyColumnSelected) }>
                { isAnyColumnSelected ? 'Deselect All Columns' : 'Select All Columns' }
                <span className = { styles.toggleAllCount }>{ visibleCount }/{ totalCount }</span>
            </div>

            { columnKeys.map(key => {
                const isMandatory = mandatoryFields.includes(key);

                return (
                    <div
                        key = { String(key) }
                        className = { `${ styles.menuItem } ${ isMandatory ? styles.disabled : '' }` }
                        onClick = { () => {
                            if (!isMandatory) {
                                toggleColumnVisibility(key);
                            }
                    }}
                    >
                        <div className = { styles.checkbox }>
                            { (columnVisibility[key] || isMandatory) && <Check size = { 14 } />}
                        </div>
                        <span>{ displayNames[key] || String(key) }</span>
                    </div>
                );
            })}
        </div>
    );
};

export default ColumnMenu;
