import React, { useState } from "react";
import { X } from "lucide-react";
import styles from "./NewLlmConnectionModal.module.css";
import PropTypes from "prop-types";

function NewLlmConnectionModal({ isOpen, onClose }) {
  // useState Hooks를 컴포넌트 최상단으로 이동
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [extraHeaders, setExtraHeaders] = useState([]);
  const [customModels, setCustomModels] = useState([]);

  if (!isOpen) return null;

  const handleCreateConnection = () => {
    // 실제 생성 로직은 여기에 추가합니다.
    alert("Connection created! (Placeholder)");
    onClose();
  };

  const handleAddHeader = () => {
    setExtraHeaders((prev) => [...prev, { key: "", value: "" }]);
  };

  const handleRemoveHeader = (index) => {
    const newHeaders = [...extraHeaders];
    newHeaders.splice(index, 1);
    setExtraHeaders(newHeaders);
  };

  const handleHeaderChange = (index, field, value) => {
    const newHeaders = [...extraHeaders];
    const current = newHeaders[index] || { key: "", value: "" };
    newHeaders[index] = { ...current, [field]: value };
    setExtraHeaders(newHeaders);
  };

  const handleAddCustomModel = () => {
    setCustomModels((prev) => [...prev, ""]);
  };

  const handleRemoveCustomModel = (index) => {
    const newModels = [...customModels];
    newModels.splice(index, 1);
    setCustomModels(newModels);
  };

  const handleCustomModelChange = (index, value) => {
    const newModels = [...customModels];
    newModels[index] = value;
    setCustomModels(newModels);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-llm-connection-title"
      >
        <div className={styles.modalHeader}>
          <h2 id="new-llm-connection-title" className={styles.modalTitle}>
            New LLM Connection
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.formGroup}>
            <label htmlFor="provider-name">Provider name</label>
            <p>Name to identify the key within Langfuse.</p>
            <input id="provider-name" type="text" />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="llm-adapter">LLM adapter</label>
            <p>Schema that is accepted at that provider endpoint.</p>
            <select id="llm-adapter" defaultValue="openai">
              <option value="openai">openai</option>
              {/* 다른 옵션들을 여기에 추가할 수 있습니다 */}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="api-key">API Key</label>
            <p>Your API keys are stored encrypted on our servers.</p>
            <input id="api-key" type="password" />
          </div>

          {!showAdvancedSettings ? (
            <button
              type="button"
              className={styles.advancedLink}
              onClick={() => setShowAdvancedSettings(true)}
            >
              Show advanced settings
            </button>
          ) : (
            <>
              <button
                type="button"
                className={styles.advancedLink}
                onClick={() => setShowAdvancedSettings(false)}
              >
                Hide advanced settings
              </button>

              <div className={styles.advancedSettings}>
                <div className={styles.formGroup}>
                  <label htmlFor="api-base-url">API Base URL</label>
                  <p>
                    Leave blank to use the default base URL for the given LLM
                    adapter. OpenAI default: https://api.openai.com/v1
                  </p>
                  <input id="api-base-url" type="text" defaultValue="default" />
                </div>

                <div className={styles.formGroup}>
                  <label>Extra Headers</label>
                  <p>
                    Optional additional HTTP headers to include with requests
                    towards LLM provider. All header values stored encrypted on
                    our servers.
                  </p>

                  {extraHeaders.map((header, index) => (
                    <div key={index} className={styles.headerInput}>
                      <input
                        type="text"
                        value={header.key}
                        onChange={(e) =>
                          handleHeaderChange(index, "key", e.target.value)
                        }
                        placeholder="Add Header"
                      />
                      <input
                        type="text"
                        value={header.value}
                        onChange={(e) =>
                          handleHeaderChange(index, "value", e.target.value)
                        }
                        placeholder="Add Value"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveHeader(index)}
                        aria-label="Remove header"
                        title="Remove header"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    className={styles.addMore}
                    onClick={handleAddHeader}
                  >
                    + Add Header
                  </button>
                </div>

                <div className={styles.formGroup}>
                  <label>Enable default models</label>
                  <p>
                    Default models for the selected adapter will be available in
                    Langfuse features.
                  </p>
                  <label className={styles.switch}>
                    <input type="checkbox" />
                    <span className={`${styles.slider} ${styles.round}`}></span>
                  </label>
                </div>

                <div className={styles.formGroup}>
                  <label>Custom models</label>
                  <p>Custom model names accepted by given endpoint.</p>

                  {customModels.map((model, index) => (
                    <div key={index} className={styles.customModelInput}>
                      <input
                        type="text"
                        value={model}
                        onChange={(e) =>
                          handleCustomModelChange(index, e.target.value)
                        }
                        placeholder="Add custom model name"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomModel(index)}
                        aria-label="Remove custom model"
                        title="Remove custom model"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    className={styles.addMore}
                    onClick={handleAddCustomModel}
                  >
                    + Add custom model name
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.createButton}
            onClick={handleCreateConnection}
          >
            Create connection
          </button>
        </div>
      </div>
    </div>
  );
}

NewLlmConnectionModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default NewLlmConnectionModal;
