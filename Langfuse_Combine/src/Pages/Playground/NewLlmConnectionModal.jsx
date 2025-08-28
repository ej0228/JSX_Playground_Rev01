// src/pages/Playground/NewLlmConnectionModal.jsx
import React, { useState } from "react";
import { X } from "lucide-react";
import styles from "./NewLlmConnectionModal.module.css";
import PropTypes from "prop-types";
import { upsertLlmConnection } from "../../lib/llmConnections";

function NewLlmConnectionModal({ isOpen, onClose, projectId: projectIdProp }) {
  if (!isOpen) return null;

  // 배열 → 객체 변환 (headers)
  const headersArrayToRecord = (arr = []) =>
    arr.reduce((acc, h) => {
      const k = (h?.key || "").trim();
      if (k) acc[k] = (h?.value || "").trim();
      return acc;
    }, {});

  // 기본 입력 상태
  const [name, setName] = useState("");
  const [adapter, setAdapter] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState(""); // 비우면 default 사용
  const [enableDefaultModels, setEnableDefaultModels] = useState(true);

  // 고급 설정
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [extraHeaders, setExtraHeaders] = useState([]);
  const [customModels, setCustomModels] = useState([]);

  // UX 상태
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const projectId = projectIdProp || import.meta.env.VITE_DEFAULT_PROJECT_ID;

  // Handlers - Extra Headers
  const handleAddHeader = () =>
    setExtraHeaders((prev) => [...prev, { key: "", value: "" }]);
  const handleRemoveHeader = (idx) =>
    setExtraHeaders((prev) => prev.filter((_, i) => i !== idx));
  const handleHeaderChange = (idx, field, value) =>
    setExtraHeaders((prev) => {
      const next = [...prev];
      next[idx] = { ...(next[idx] || { key: "", value: "" }), [field]: value };
      return next;
    });

  // Handlers - Custom Models
  const handleAddCustomModel = () => setCustomModels((prev) => [...prev, ""]);
  const handleRemoveCustomModel = (idx) =>
    setCustomModels((prev) => prev.filter((_, i) => i !== idx));
  const handleCustomModelChange = (idx, value) =>
    setCustomModels((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });

  // 저장
  const handleCreateConnection = async () => {
    setErrorMsg("");
    setOkMsg("");

    if (!name.trim()) {
      setErrorMsg("이름(name)을 입력해 주세요.");
      return;
    }
    if (!apiKey.trim()) {
      setErrorMsg("API Key를 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const frontPayload = {
        adapter,                               // 예: "openai"
        provider: name.trim(),                 // 내부에서 식별용 이름
        baseURL: baseUrl.trim() || undefined,  // 서버 스키마가 'baseURL'이면 대문자 유지
        secretKey: apiKey.trim(),
        extraHeaders: headersArrayToRecord(extraHeaders),
        customModels: customModels.filter(Boolean),
        useDefaultModels: !!enableDefaultModels,
      };

      await upsertLlmConnection(frontPayload, { projectId });

      setOkMsg("연결이 저장되었습니다.");
      // 살짝 대기 후 닫기
      setTimeout(() => onClose(), 600);
    } catch (e) {
      setErrorMsg(String(e?.message || e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={styles.modalOverlay}
      onClick={(e) => {
        // 바깥(오버레이)을 클릭한 경우만 닫힘
        if (e.target === e.currentTarget) onClose();
      }}
    >
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
          {projectId ? (
            <div className={styles.hintRow}>
              <span className={styles.hintLabel}>Project</span>
              <span className={styles.hintValue}>{projectId}</span>
            </div>
          ) : (
            <div className={styles.hintRowWarn}>
              <span className={styles.hintLabel}>Project</span>
              <span className={styles.hintValue}>
                미설정 (VITE_DEFAULT_PROJECT_ID가 없으면 서버가 거절할 수 있어요)
              </span>
            </div>
          )}

          {errorMsg && <div className={styles.errorBox}>{errorMsg}</div>}
          {okMsg && <div className={styles.okBox}>{okMsg}</div>}

          <div className={styles.formGroup}>
            <label htmlFor="provider-name">Provider name</label>
            <p>Name to identify the key within Langfuse.</p>
            <input
              id="provider-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex) openai-main"
              autoFocus
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="llm-adapter">LLM adapter</label>
            <p>Schema that is accepted at that provider endpoint.</p>
            <select
              id="llm-adapter"
              value={adapter}
              onChange={(e) => setAdapter(e.target.value)}
            >
              <option value="openai">openai</option>
              <option value="anthropic">anthropic</option>
              <option value="azure-openai">azure-openai</option>
              <option value="vertex">vertex</option>
              <option value="ollama">ollama</option>
              <option value="kobold">kobold</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="api-key">API Key</label>
            <p>Your API keys are stored encrypted on our servers.</p>
            <input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
            />
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
                  <input
                    id="api-base-url"
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="ex) https://api.openai.com/v1"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Extra Headers</label>
                  <p>Optional additional HTTP headers to include with requests.</p>

                  {extraHeaders.map((header, index) => (
                    <div key={index} className={styles.headerInput}>
                      <input
                        type="text"
                        value={header.key}
                        onChange={(e) =>
                          handleHeaderChange(index, "key", e.target.value)
                        }
                        placeholder="Header"
                      />
                      <input
                        type="text"
                        value={header.value}
                        onChange={(e) =>
                          handleHeaderChange(index, "value", e.target.value)
                        }
                        placeholder="Value"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveHeader(index)}
                        aria-label="Remove header"
                        title="Remove header"
                        className={styles.iconBtn}
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
                  <label className={styles.switchRow}>
                    <span>Enable default models</span>
                    <span className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={enableDefaultModels}
                        onChange={(e) =>
                          setEnableDefaultModels(e.target.checked)
                        }
                      />
                      <span className={`${styles.slider} ${styles.round}`} />
                    </span>
                  </label>
                  <p>
                    Default models for the selected adapter will be available in
                    Langfuse features.
                  </p>
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
                        placeholder="ex) gpt-4o-mini, claude-3-5-sonnet"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomModel(index)}
                        aria-label="Remove custom model"
                        title="Remove custom model"
                        className={styles.iconBtn}
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
            onClick={(e) => {
              e.stopPropagation();
              handleCreateConnection();
            }}
            disabled={submitting || !name.trim() || !apiKey.trim()}
          >
            {submitting ? "Saving..." : "Create connection"}
          </button>
        </div>
      </div>
    </div>
  );
}

NewLlmConnectionModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  projectId: PropTypes.string,
};

export default NewLlmConnectionModal;
