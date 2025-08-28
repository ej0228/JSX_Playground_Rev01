// ChatBox.jsx (JS, Vite/React)
// - schema="kind"  : {id, kind:"message"|"placeholder", role?, content?, name?}
// - schema="rolePlaceholder": {id, role:"System"|"User"|"Assistant"|"Developer"|"Placeholder", content:""}
// 프론트만 수정, 백엔드는 3000의 원본 API(trpc/rest)를 그대로 사용하세요.

import React, { useEffect, useRef, useMemo } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { GripVertical, X, MessageSquarePlus, PlusSquare } from "lucide-react";
import styles from "./ChatBox.module.css";

function uuid() {
    return (crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`);
}

// ----- Canonical 타입 (내부 통합 표현) -----
/*
  CanonicalRow = {
    id: string,
    type: "message" | "placeholder",
    role?: "System"|"Developer"|"User"|"Assistant",
    content?: string,  // message text
    name?: string      // placeholder name (표시용)
  }
*/

// ----- 스키마 어댑터 (입출력 변환) -----
function toCanonical(list, schema) {
    if (!Array.isArray(list)) return [];
    if (schema === "kind") {
        return list.map((r) => {
            if (r?.kind === "placeholder") {
                return { id: r.id ?? uuid(), type: "placeholder", name: r.name ?? "" };
            }
            // message
            return {
                id: r.id ?? uuid(),
                type: "message",
                role: r.role || "User",
                content: r.content ?? ""
            };
        });
    }
    // rolePlaceholder
    return list.map((r) => {
        if (r?.role === "Placeholder") {
            // 프롬프트 팀은 content에 플레이스홀더 이름/내용을 넣어왔음
            return { id: r.id ?? uuid(), type: "placeholder", name: r.content ?? "" };
        }
        return {
            id: r.id ?? uuid(),
            type: "message",
            role: r.role || "User",
            content: r.content ?? ""
        };
    });
}

function fromCanonical(list, schema) {
    if (schema === "kind") {
        return list.map((r) => {
            if (r.type === "placeholder") {
                return { id: r.id, kind: "placeholder", name: r.name ?? "" };
            }
            return {
                id: r.id,
                kind: "message",
                role: r.role,
                content: r.content ?? ""
            };
        });
    }
    // rolePlaceholder
    return list.map((r) => {
        if (r.type === "placeholder") {
            return { id: r.id, role: "Placeholder", content: r.name ?? "" };
        }
        return { id: r.id, role: r.role, content: r.content ?? "" };
    });
}

// ----- 1줄 컴포넌트 -----
const Row = ({ row, index, moveRow, onChange, onRemove }) => {
    const ref = useRef(null);

    const [, drop] = useDrop({
        accept: "chat-row",
        hover(item, monitor) {
            if (!ref.current) return;
            const dragIndex = item.index;
            const hoverIndex = index;
            if (dragIndex === hoverIndex) return;

            const rect = ref.current.getBoundingClientRect();
            const middleY = (rect.bottom - rect.top) / 2;
            const client = monitor.getClientOffset();
            const offsetY = client.y - rect.top;

            if ((dragIndex < hoverIndex && offsetY < middleY) ||
                (dragIndex > hoverIndex && offsetY > middleY)) return;

            moveRow(dragIndex, hoverIndex);
            item.index = hoverIndex;
        }
    });

    const [{ isDragging }, drag, preview] = useDrag({
        type: "chat-row",
        item: () => ({ id: row.id, index }),
        collect: (m) => ({ isDragging: m.isDragging() })
    });

    preview(drop(ref));

    const isMsg = row.type === "message";

    return (
        <div ref={ref} className={styles.messageRow} style={{ opacity: isDragging ? 0.5 : 1 }}>
            <div ref={drag} className={styles.dragHandleWrapper} title="Drag to reorder">
                <GripVertical className={styles.dragHandle} size={18} />
            </div>

            <div className={styles.roleCol}>
                {isMsg ? (
                    <select
                        className={styles.roleSelect}
                        value={row.role}
                        onChange={(e) => onChange(row.id, { role: e.target.value })}
                    >
                        <option>System</option>
                        <option>Developer</option>
                        <option>User</option>
                        <option>Assistant</option>
                    </select>
                ) : (
                    <span className={styles.placeholderRole}>placeholder</span>
                )}
            </div>

            <div className={styles.inputCol}>
                {isMsg ? (
                    <textarea
                        className={styles.messageTextarea}
                        rows={1}
                        placeholder={
                            row.role === "System"
                                ? "Enter a system message here."
                                : row.role === "Developer"
                                    ? "Enter a developer message here."
                                    : row.role === "Assistant"
                                        ? "Enter an assistant message here."
                                        : "Enter a user message here."
                        }
                        value={row.content ?? ""}
                        onChange={(e) => onChange(row.id, { content: e.target.value })}
                    />
                ) : (
                    <input
                        className={styles.placeholderInput}
                        placeholder='Enter placeholder name (e.g., "msg_history")'
                        value={row.name ?? ""}
                        onChange={(e) => onChange(row.id, { name: e.target.value })}
                    />
                )}
            </div>

            <button className={styles.removeButton} onClick={() => onRemove(row.id)} title="Remove row">
                <X size={16} />
            </button>
        </div>
    );
};

// ----- 메인 공용 컴포넌트 -----
export default function ChatBox({
    // 외부 스키마로 된 값/세터
    value,                 // Array
    onChange,              // (same schema Array) => void
    schema = "kind",       // "kind" | "rolePlaceholder"
    autoInit = true        // 비었을 때 System/User 2줄 생성
}) {
    // 외부를 Canonical로 정규화
    const rows = useMemo(() => toCanonical(value || [], schema), [value, schema]);

    // 외부로 반영
    const emit = (canonList) => {
        onChange(fromCanonical(canonList, schema));
    };

    // 초기 2줄 자동 생성
    useEffect(() => {
        if (!autoInit) return;
        if (!rows || rows.length === 0) {
            emit([
                { id: uuid(), type: "message", role: "System", content: "" },
                { id: uuid(), type: "message", role: "User", content: "" }
            ]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rows?.length, autoInit]); // emit은 의존성에서 제외 (무한루프 방지)

    const computeNextRole = () => {
        const lastMsg = [...rows].reverse().find((m) => m.type === "message");
        if (!lastMsg) return "Assistant";
        if (lastMsg.role === "System") return "Developer";
        if (lastMsg.role === "Developer") return "User";
        if (lastMsg.role === "User") return "Assistant";
        if (lastMsg.role === "Assistant") return "User";
        return "User";
    };

    const addMessage = () => {
        const nextRole = computeNextRole();
        emit([...rows, { id: uuid(), type: "message", role: nextRole, content: "" }]);
    };

    const addPlaceholder = () => {
        emit([...rows, { id: uuid(), type: "placeholder", name: "" }]);
    };

    const removeRow = (id) => {
        emit(rows.filter((r) => r.id !== id));
    };

    const updateRow = (id, patch) => {
        emit(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    };

    const moveRow = (from, to) => {
        const arr = [...rows];
        const [dragged] = arr.splice(from, 1);
        arr.splice(to, 0, dragged);
        emit(arr);
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div className={styles.chatEditor}>
                {(!rows || rows.length === 0) && (
                    <div className={styles.hint}>System과 User가 자동으로 추가됩니다…</div>
                )}

                {rows.map((row, idx) => (
                    <Row
                        key={row.id}
                        row={row}
                        index={idx}
                        moveRow={moveRow}
                        onChange={updateRow}
                        onRemove={removeRow}
                    />
                ))}

                <div className={styles.chatActions}>
                    <button className={styles.addBtn} onClick={addMessage}>
                        <MessageSquarePlus size={16} /> Message
                    </button>
                    <button className={styles.addBtn} onClick={addPlaceholder}>
                        <PlusSquare size={16} /> Placeholder
                    </button>
                </div>
            </div>
        </DndProvider>
    );
}
