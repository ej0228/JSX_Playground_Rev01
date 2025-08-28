import React from 'react';
import Modal from '../../../components/Modal/Modal.jsx';
import styles from '../layout/DeleteForm.module.css'; // 전용 스타일 파일

const DeleteForm = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    deleteButtonText = 'Confirm',
    deleteButtonVariant = 'primary',
}) => {
    if (!isOpen) {
        return null;
    }

    const deleteButtonClassName = `${styles.button} ${
        deleteButtonVariant === 'danger' ? styles.dangerButton : styles.primaryButton
    }`;

    return (
        <Modal title={title} isOpen={isOpen} onClose={onClose}>
            <div className={styles.container}>
                <p className={styles.message}>{message}</p>
                <div className={styles.actions}>
                    <button onClick={onConfirm} className={deleteButtonClassName}>
                        {deleteButtonText}
                    </button>
                    <button onClick={onClose} className={`${styles.button} ${styles.cancelButton}`}>
                        Cancel
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default DeleteForm;