// src/Pages/Playground/ModelAdvancedSettingsPopover.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ModelAdvancedSettingsPopover.module.css";
import { fetchProviderMaskedKey } from "../../lib/getMaskedKey";

export default function ModelAdvancedSettingsPopover({
  open,
  anchorRef,
  values,
  onChange,
  onClose,
  projectId,
  provider,
  settingsPath = "/settings/llm-connections",
}) {
  const popoverRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  // ✅ 훅은 컴포넌트 내부에서만! (상단 중복 선언 제거)
  const [apiKey, setApiKey] = useState("");
  const navigate = useNavigate();

  // 팝오버 열릴 때 프로젝트/프로바이더의 API Key 불러오기
useEffect(() => {
  if (!open || !projectId || !provider) return;
  (async () => {
    try {
      const masked = await fetchProviderMaskedKey({ projectId, provider });
      setApiKey(masked || "");
    } catch (e) {
      console.error("masked key fetch failed:", e);
      setApiKey("");
    }
  })();
}, [open, projectId, provider]);

  // 위치 계산
  useEffect(() => {
    if (open && anchorRef?.current && popoverRef.current) {
      const buttonRect = anchorRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let left = buttonRect.right + 8;
      let top = buttonRect.bottom + 8;

      if (left + 320 > viewportWidth) left = buttonRect.left - 320 - 8;
      if (top + 400 > viewportHeight) top = buttonRect.top - 400 - 8;

      setPosition({
        top: Math.max(8, top),
        left: Math.max(8, left),
      });
    }
  }, [open, anchorRef]);

  // 외부 클릭/ESC 닫기
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target)
      ) {
        onClose();
      }
    };
    const handleEscapeKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [open, onClose, anchorRef]);

  // 숫자 입력 안전 파서 & 유틸
  const toFloat = (v, fallback) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : fallback;
  };
  const toInt = (v, fallback) => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : fallback;
  };
  const update = (newParams) => onChange({ ...values, ...newParams });

  const handleManageKeys = () => navigate(settingsPath);

  if (!open) return null;

  return (
    <div
      ref={popoverRef}
      className={styles.advWrap}
      style={{
        position: "fixed",
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 1000,
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Model Advanced Settings"
    >
      <div className={styles.advHeader}>
        <h3 className={styles.advTitle}>Model Advanced Settings</h3>
        <button onClick={onClose} className={styles.advCloseBtn} aria-label="close">
          ×
        </button>
      </div>

      <div className={styles.advBody}>
        <p className={styles.advDescription}>Configure advanced parameters for your model.</p>

        {/* Temperature */}
        <div className={styles.advParameterRow}>
          <div className={styles.advParameterInfo}>
            <label className={styles.advLabel}>Temperature</label>
          </div>
          <div className={styles.advParameterControls}>
            <input
              type="number"
              value={values.temperature ?? 0}
              onChange={(e) => update({ temperature: toFloat(e.target.value, 0) })}
              className={styles.advValueInput}
              step="0.1"
              min="0"
              max="2"
              inputMode="decimal"
            />
            <div
              className={`${styles.advToggleSwitch} ${
                values.useTemperature ? styles.advToggleOn : ""
              }`}
              onClick={() => update({ useTemperature: !values.useTemperature })}
              role="switch"
              aria-checked={!!values.useTemperature}
            >
              <span className={styles.advToggleThumb} />
            </div>
          </div>
        </div>
        {values.useTemperature && (
          <div className={styles.advSliderRow}>
            <input
              type="range"
              value={values.temperature ?? 0}
              onChange={(e) => update({ temperature: toFloat(e.target.value, 0) })}
              className={styles.advSlider}
              min="0"
              max="2"
              step="0.1"
            />
          </div>
        )}

        {/* Output token limit */}
        <div className={styles.advParameterRow}>
          <div className={styles.advParameterInfo}>
            <label className={styles.advLabel}>Output token limit</label>
          </div>
          <div className={styles.advParameterControls}>
            <input
              type="number"
              value={values.maxTokens ?? 4096}
              onChange={(e) => update({ maxTokens: toInt(e.target.value, 4096) })}
              className={styles.advValueInput}
              min="1"
              max="32000"
              inputMode="numeric"
            />
            <div
              className={`${styles.advToggleSwitch} ${
                values.useMaxTokens ? styles.advToggleOn : ""
              }`}
              onClick={() => update({ useMaxTokens: !values.useMaxTokens })}
              role="switch"
              aria-checked={!!values.useMaxTokens}
            >
              <span className={styles.advToggleThumb} />
            </div>
          </div>
        </div>
        {values.useMaxTokens && (
          <div className={styles.advSliderRow}>
            <input
              type="range"
              value={values.maxTokens ?? 4096}
              onChange={(e) => update({ maxTokens: toInt(e.target.value, 4096) })}
              className={styles.advSlider}
              min="100"
              max="8192"
              step="100"
            />
          </div>
        )}

        {/* Top P */}
        <div className={styles.advParameterRow}>
          <div className={styles.advParameterInfo}>
            <label className={styles.advLabel}>Top P</label>
          </div>
          <div className={styles.advParameterControls}>
            <input
              type="number"
              value={values.topP ?? 1}
              onChange={(e) => update({ topP: toFloat(e.target.value, 1) })}
              className={styles.advValueInput}
              step="0.05"
              min="0"
              max="1"
              inputMode="decimal"
            />
            <div
              className={`${styles.advToggleSwitch} ${values.useTopP ? styles.advToggleOn : ""}`}
              onClick={() => update({ useTopP: !values.useTopP })}
              role="switch"
              aria-checked={!!values.useTopP}
            >
              <span className={styles.advToggleThumb} />
            </div>
          </div>
        </div>
        {values.useTopP && (
          <div className={styles.advSliderRow}>
            <input
              type="range"
              value={values.topP ?? 1}
              onChange={(e) => update({ topP: toFloat(e.target.value, 1) })}
              className={styles.advSlider}
              min="0"
              max="1"
              step="0.05"
            />
          </div>
        )}

        {/* Additional options */}
        <div className={styles.advParameterRow}>
          <div className={styles.advParameterInfo}>
            <label className={styles.advLabel}>Additional options</label>
            <div className={styles.advHelpIcon} title="Additional configuration options">
              ?
            </div>
          </div>
          <div className={styles.advParameterControls}>
            <div
              className={`${styles.advToggleSwitch} ${
                values.additionalOptions ? styles.advToggleOn : ""
              }`}
              onClick={() => update({ additionalOptions: !values.additionalOptions })}
              role="switch"
              aria-checked={!!values.additionalOptions}
            >
              <span className={styles.advToggleThumb} />
            </div>
          </div>
        </div>

        {/* API key (표시용) */}
        <div className={styles.advParameterRow}>
          <div className={styles.advParameterInfo}>
            <label className={styles.advLabel}>API key</label>
          </div>
          <div className={styles.advParameterControls}>
            <button
              type="button"
              onClick={handleManageKeys}
              className={styles.advApiKeyBtn}
              title="LLM 키 관리 페이지로 이동"
            >
              {apiKey || "API Key 없음"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
