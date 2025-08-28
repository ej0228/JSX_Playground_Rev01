import React, {useState, useEffect, useCallback} from 'react';
import Modal from '../../components/Modal/Modal.jsx'
import NewLLMConnectionForm from "./form/NewLLMConnectionsForm";
import UpdateLLMConnectionForm from "./form/UpdateLLMConnectionForm";
import commonStyles from "./layout/SettingsCommon.module.css";
import llmStyles from './layout/LLMConnections.module.css';
import {Plus, Pencil, Trash2} from "lucide-react";
// ---▼ 인증 정보 가져오기 ▼---
import {publicKey, secretKey} from '../../lib/langfuse';
// ---▼ 새로 만든 API 모듈 import ▼---
import {getLlmConnections, saveLlmConnection, deleteLlmConnection} from '../../api/Settings/LLMApi.js';
import DeleteForm from './form/DeleteForm'

// ---▼ Basic Auth를 위한 Base64 인코딩 ▼---
const base64Credentials =
    publicKey && secretKey
        ? btoa(`${publicKey}:${secretKey}`)
        : '';

const LLMConnections = () => {
    // 목업 데이터 대신 빈 배열로 초기화
    const [connections, setConnections] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    // 로딩 및 에러 상태 추가
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10); // 한 페이지에 10개씩

    // ---▼ 수정할 Connection을 저장할 상태 추가 ▼---
    const [editingConnection, setEditingConnection] = useState(null);

    // ---▼ 삭제 확인 모달 상태 추가 ▼---
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [connectionToDelete, setConnectionToDelete] = useState(null);

    const fetchConnections = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // ---▼ API 모듈 함수 호출로 변경 ▼---
            const result = await getLlmConnections(currentPage, limit, base64Credentials);
            setConnections(result.data);
        } catch (e) {
            console.error("LLM 연결 목록을 가져오는 데 실패했습니다:", e);
            setError('데이터를 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, limit]);

    useEffect(() => {
        fetchConnections();
    }, [fetchConnections]);

    // ---▼ 수정 버튼 클릭 시 호출될 함수 ▼---
    const handleEditConnection = (connection) => {
        setEditingConnection(connection);
        setIsModalOpen(true);
    };

    // ---▼ 저장/수정 핸들러 통합 ▼---
    const handleSaveConnection = async (connectionData) => {
        try {
            // ---▼ API 모듈 함수 호출로 변경 ▼---
            await saveLlmConnection(connectionData, base64Credentials);
            setIsModalOpen(false);
            setEditingConnection(null);
            fetchConnections();
        } catch (e) {
            console.error(`LLM 연결 저장/업데이트에 실패했습니다:`, e);
            alert(`요청 중 오류가 발생했습니다: ${e instanceof Error ? e.message : String(e)}`);
        }
    };

    // ---▼ 모달을 닫을 때 editingConnection 상태를 초기화하는 함수 추가 ▼---
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingConnection(null); // 수정 상태 초기화
    };

    const handleDeleteClick = (connection) => {
        setConnectionToDelete(connection);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!connectionToDelete) return;
        try {
            await deleteLlmConnection(connectionToDelete.provider, base64Credentials);
            fetchConnections();
        } catch (e) {
            alert(`삭제 중 오류가 발생했습니다: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
            setIsDeleteModalOpen(false);
            setConnectionToDelete(null);
        }
    };

    if (isLoading) {
        return <div className={commonStyles.container}>Loading connections...</div>;
    }

    if (error) {
        return <div className={commonStyles.container} style={{color: 'red'}}>{error}</div>;
    }

    return (
        <div className={commonStyles.container}>
            { /* Host Name Section */}
            <h3 className={commonStyles.title}>LLM Connections </h3>
            <p className={commonStyles.p}>Connect your LLM services to enable evaluations and playground features. Your
                provider will charge based on usage.</p>

            <div className={commonStyles.keyList}>
                <div className={`${commonStyles.keyRow} ${commonStyles.keyHeader}`}>
                    <span>Provider</span>
                    <span>Adapter</span>
                    <span>Base URL</span>
                    <span>API Key</span>
                    <span style={{textAlign: 'center'}}>Actions</span>
                </div>
                {connections.map((conn) => (
                    <div key={conn.id} className={commonStyles.keyRow}>
                        <span>{conn.provider}</span>
                        <span>{conn.adapter}</span>
                        <span>{conn.baseURL || 'default '}</span>
                        <span>{conn.displaySecretKey}</span>
                        <div className={llmStyles.actions}>
                            {/* ---▼ 수정 버튼 활성화 및 핸들러 연결 ▼--- */}
                            <button title="Edit" onClick={() => handleEditConnection(conn)}>
                                <Pencil size={16}/>
                            </button>
                            <button title="Delete" onClick={() => handleDeleteClick(conn)}>
                                <Trash2 size={16}/>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <button onClick={() => setIsModalOpen(true)} className={commonStyles.createButton}>
                <Plus size={16}/> Add LLM Connection
            </button>

            <Modal
                // editingConnection 상태에 따라 동적으로 제목 변경
                title={editingConnection ? "Update LLM Connection" : "New LLM Connection"}
                isOpen={isModalOpen}
                onClose={handleCloseModal} // 새로 만든 닫기 핸들러 연결
            >
                {/* editingConnection 상태에 따라 다른 폼을 렌더링 */}
                {editingConnection ? (
                    <UpdateLLMConnectionForm
                        existingConnection={editingConnection} // 기존 데이터 전달
                        onSave={handleSaveConnection}
                        onClose={handleCloseModal}
                    />
                ) : (
                    <NewLLMConnectionForm
                        onSave={handleSaveConnection}
                        onClose={handleCloseModal}
                    />
                )}
            </Modal>

            {/* ---▼ 삭제 확인 모달 추가 ▼--- */}
            <DeleteForm
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete LLM Connection"
                message={
                    <>
                        Are you sure you want to delete this connection? This action cannot be undone.
                    </>
                }
                deleteButtonText="Permanently delete"
                deleteButtonVariant="danger"
            />
        </div>
    );
};

export default LLMConnections;