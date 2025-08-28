import React, {useState, useEffect} from 'react';
import Modal from '../../../components/Modal/Modal.jsx';
import styles from '../layout/DeleteProjectForm.module.css'; // 새 CSS 파일 import

const DeleteProjectForm = ({
                               isOpen,
                               onClose,
                               onConfirm,
                               projectName,
                               orgName = "wow", // 조직 이름은 일단 하드코딩
                           }) => {
    const [confirmText, setConfirmText] = useState('');

    // 모달이 열릴 때마다 확인 텍스트 초기화
    useEffect(() => {
        if (isOpen) {
            setConfirmText('');
        }
    }, [isOpen]);

    // 사용자가 입력해야 할 정확한 텍스트
    const expectedConfirmText = `${orgName}/${projectName}`;

    // 확인 텍스트가 일치하지 않으면 삭제 버튼 비활성화
    const isDeleteDisabled = confirmText !== expectedConfirmText;

    const handleConfirm = () => {
        if (!isDeleteDisabled) {
            onConfirm();
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <Modal title="Delete Project" isOpen={isOpen} onClose={onClose}>
            <div className={styles.container}>
                <div className={styles.formGroup}>
                    <p className={styles.description}>
                        To confirm, type "{expectedConfirmText}" in the input box
                    </p>
                    <input
                        id="delete-confirm-input"
                        type="text"
                        className={styles.input}
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder={expectedConfirmText}
                        autoFocus
                    />
                </div>

                <div className={styles.actions}>
                    <button
                        onClick={handleConfirm}
                        className={styles.deleteButton}
                        disabled={isDeleteDisabled}
                    >
                        Delete project
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default DeleteProjectForm;
