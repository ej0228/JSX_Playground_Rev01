// src/pages/Playground/NewLlmConnectionModal.jsx
import React, { useState } from "react";
import { X } from "lucide-react";
import styles from "./NewLlmConnectionModal.module.css";
import PropTypes from "prop-types";
import { upsertLlmConnection } from "../../lib/llmConnections";

function NewLlmConnectionModal({ isOpen, onClose, projectId: projectIdProp }) {
  if (!isOpen) return null;

  // ---- local state ----
  const [name, setName] = useState("");
  const [adapter, setAdapter] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState(""); // empty → server default
  const [enableDefaultModels, setEnableDefaultModels] = useState(true);

  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [extraHeaders, setExtraHeaders] = useState([]); // [{key,value}]
  const [customModels, setCustomModels] = useState([]); // ["gpt-4o-mini", ...]

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [okMsg, setOkMsg] = useState("");

  // --- utils ---
  const headersArrayToRecord = (arr = []) =>
    arr.reduce((acc, h) => {
      const k = (h?.key || "").trim();
      if (k) acc[k] = (h?.value || "").trim();
      return acc;
    }, {});

  // --- Extra headers handlers ---
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

  // --- Custom models handlers ---
  const handleAddCustomModel = () =>
    setCustomModels((prev) => [...prev, ""]);
  const handleRemoveCustomModel = (idx) =>
    setCustomModels((prev) => prev.filter((_, i) => i !== idx));
  const handleCustomModelChange = (idx, value) =>
    setCustomModels((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });

  // ---- submit ----
  const handleCreateConnection = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    setErrorMsg("");
    setOkMsg("");

    // projectId는 반드시 Playground에서 props로 넘겨받아야 함
    const projectId = projectIdProp;
    if (!projectId) {
      setErrorMsg("projectId가 비어 있습니다. Playground에서 모달로 projectId를 전달하세요.");
      return;
    }

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
        adapter,                               // e.g., "openai"
        provider: name.trim(),                 // key name within Langfuse
        baseURL: baseUrl.trim() || undefined,  // 서버 스키마 키는 baseURL(대문자 U)
        secretKey: apiKey.trim(),
        extraHeaders: headersArrayToRecord(extraHeaders),
        customModels: customModels.map((m) => String(m || "").trim()).filter(Boolean),
        useDefaultModels: !!enableDefaultModels,
      };

      await upsertLlmConnection(frontPayload, { projectId }); // ★ 여기서 반드시 projectId 전달

      //LLM모델 생성 후 새고로침하여 모델 바로 적용
      window.location.reload();

    } catch (e2) {
      setErrorMsg(String(e2?.message || e2));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={styles.modalOverlay}
      onClick={(e) => {
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
          {/* 상태 메시지 */}
          {errorMsg && <div className={styles.errorBox}>{errorMsg}</div>}
          {okMsg && <div className={styles.okBox}>{okMsg}</div>}

          {/* Provider name */}
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

          {/* Adapter */}
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

          {/* API Key */}
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

          {/* Advanced settings toggle */}
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
                {/* Base URL */}
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

                {/* Extra Headers */}
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

                {/* Default models toggle */}
                <div className={styles.formGroup}>
                  <label className={styles.switchRow}>
                    <span>Enable default models</span>
                    <span className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={enableDefaultModels}
                        onChange={(e) => setEnableDefaultModels(e.target.checked)}
                      />
                      <span className={`${styles.slider} ${styles.round}`} />
                    </span>
                  </label>
                  <p>
                    Default models for the selected adapter will be available in
                    Langfuse features.
                  </p>
                </div>

                {/* Custom models */}
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
            type="button" // form submit 방지
            className={styles.createButton}
            onClick={handleCreateConnection}
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
  projectId: PropTypes.string, // ★ Playground에서 반드시 전달
};

export default NewLlmConnectionModal;
