import React, { useState } from 'react';
import styles from './PromptsReference.module.css';
import { dummyPrompts } from '../../data/dummyPrompts';
import { X } from 'lucide-react';

const PromptsReference = ({ onClose, onInsert }) => {
  // dummyPrompts 데이터의 첫 번째 항목을 기본 선택 값으로 설정합니다.
  const [selectedPrompt, setSelectedPrompt] = useState(dummyPrompts[0]?.id || '');

  const handleInsert = () => {
    if (selectedPrompt) {
      // 실제 삽입 로직은 부모 컴포넌트에 위임합니다.
      onInsert(selectedPrompt);
    }
    onClose(); // 모달 닫기
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Add inline prompt reference</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>
        <p className={styles.description}>
          Referenced prompts are dynamically resolved and inserted when fetched via API/SDK. This enables modular design—create complex prompts from reusable, independently maintained components.
        </p>
        <div className={styles.formGroup}>
          <label htmlFor="prompt-name" className={styles.label}>Prompt name</label>
          <select
            id="prompt-name"
            className={styles.select}
            value={selectedPrompt}
            onChange={(e) => setSelectedPrompt(e.target.value)}
          >
            {dummyPrompts.map((prompt) => (
              <option key={prompt.id} value={prompt.id}>
                {prompt.name}
              </option>
            ))}
          </select>
          <p className={styles.subLabel}>Only text prompts can be referenced inline.</p>
        </div>
        <div className={styles.actions}>
          <button onClick={onClose} className={styles.cancelButton}>Cancel</button>
          <button onClick={handleInsert} className={styles.insertButton}>Insert</button>
        </div>
      </div>
    </div>
  );
};

export default PromptsReference;
