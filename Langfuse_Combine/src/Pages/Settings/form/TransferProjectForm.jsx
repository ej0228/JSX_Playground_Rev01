import React, {useState, useEffect} from 'react';
import Modal from '../../../components/Modal/Modal.jsx';
import {AlertTriangle} from 'lucide-react';
import styles from '../layout/TransferProjectForm.module.css'; // 새 CSS 파일 import

const TransferProjectForm = ({
                                 isOpen,
                                 onClose,
                                 onConfirm,
                                 currentProjectName,
                                 organizations = [], // 조직 목록을 props로 받음
                             }) => {
    const [selectedOrg, setSelectedOrg] = useState('');
    const [confirmText, setConfirmText] = useState('');

    // 모달이 열릴 때 상태 초기화
    useEffect(() => {
        if (isOpen) {
            setSelectedOrg('');
            setConfirmText('');
        }
    }, [isOpen]);

    const expectedConfirmText = `wow/${currentProjectName}`;
    const isTransferDisabled = confirmText !== expectedConfirmText || !selectedOrg;

    const handleConfirm = () => {
        if (!isTransferDisabled) {
            onConfirm(selectedOrg);
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <Modal title="Transfer Project" isOpen={isOpen} onClose={onClose}>
            <div className={styles.container}>
                {/* Warning Section */}
                <div className={styles.warningBox}>
                    <AlertTriangle size={20} className={styles.warningIcon}/>
                    <div>
                        <h4 className={styles.warningTitle}>Warning</h4>
                        <p className={styles.warningText}>
                            Transferring the project will move it to a different organization:
                        </p>
                        <ul className={styles.warningList}>
                            <li>Members who are not part of the new organization will lose access.</li>
                            <li>The project remains fully operational as API keys, settings, and data will remain
                                unchanged. All features (e.g. tracing, prompt management) will continue to work without
                                interruption.
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Select Organization Section */}
                <div className={styles.formGroup}>
                    <label htmlFor="org-select">Select New Organization</label>
                    <p className={styles.description}>
                        Transfer this project to another organization where you have the ability to create projects.
                    </p>
                    <select
                        id="org-select"
                        className={styles.select}
                        value={selectedOrg}
                        onChange={(e) => setSelectedOrg(e.target.value)}
                    >
                        <option value="" disabled>Select organization</option>
                        {organizations.map(org => (
                            <option key={org.id} value={org.id}>{org.name}</option>
                        ))}
                    </select>
                </div>

                {/* Confirm Section */}
                <div className={styles.formGroup}>
                    <label htmlFor="confirm-input">Confirm</label>
                    <p className={styles.description}>
                        To confirm, type "{expectedConfirmText}" in the input box
                    </p>
                    <input
                        id="confirm-input"
                        type="text"
                        className={styles.input}
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder={expectedConfirmText}
                    />
                </div>

                {/* Actions */}
                <div className={styles.actions}>
                    <button
                        onClick={handleConfirm}
                        className={styles.transferButton}
                        disabled={isTransferDisabled}
                    >
                        Transfer project
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default TransferProjectForm;
