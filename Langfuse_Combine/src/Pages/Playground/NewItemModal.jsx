/**
 * NewItemModal
 * - LLM Tool / JSON Schema 생성 & 수정 모달
 * - "tool"일 때: { name, description, parameters(JSON) }를 onSubmit으로 전달
 * - "schema"일 때: { name, description, schema(JSON) }를 onSubmit으로 전달
 */

import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { X } from "lucide-react";
import styles from "./NewItemModal.module.css";
import LineNumberedTextarea from "../../components/LineNumberedTextarea/LineNumberedTextarea";

/**
 * @param {Object} props
 * @param {boolean} props.isOpen - 모달 열림 상태
 * @param {'tool'|'schema'} props.type - 생성/수정 타입
 * @param {() => void} props.onClose - 모달 닫기
 * @param {Object=} props.initialData - 수정 모드 초기값 (없으면 생성 모드)
 *   - tool:    { name, description, parameters: {...} }
 *   - schema:  { name, description, schema: {...} }
 * @param {(payload: Object) => void} props.onSubmit - 저장 버튼 눌렀을 때 호출
 */
export default function NewItemModal({ isOpen, type, onClose, initialData, onSubmit }) {
  // -----------------------------
  // 1) 폼 상태
  // -----------------------------
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // 내부 텍스트영역은 문자열로 들고 있다가 저장 시 JSON.parse
  // schema/tool 모두 공용으로 쓰되, 최종 저장 시 키만 다르게 맵핑
  const [jsonText, setJsonText] = useState(
    // 기본 템플릿
    '{\n  "type": "object",\n  "properties": {},\n  "required": [],\n  "additionalProperties": false\n}'
  );

  // -----------------------------
  // 2) 모드별 텍스트 (타이틀/라벨 등)
  // -----------------------------
  const content = useMemo(() => {
    if (type === "tool") {
      return {
        title: initialData ? "Edit LLM Tool" : "Create LLM Tool",
        subtitle: "Define a tool for LLM function calling",
        descriptionHelpText:
          "This description will be sent to the LLM to help it understand the tool's purpose and functionality.",
        descriptionPlaceholder: "Describe the tool's purpose and usage",
        jsonLabel: "Parameters (JSON Schema)",
        jsonHelp: "Define the structure of your tool parameters using JSON Schema format.",
        footerNote:
          "Note: Changes to tools are reflected to all new traces of this project.",
      };
    }
    return {
      title: initialData ? "Edit JSON Schema" : "Create JSON Schema",
      subtitle: "Define a JSON Schema for structured outputs",
      descriptionHelpText: "Describe the schema",
      descriptionPlaceholder: "Describe the schema",
      jsonLabel: "JSON Schema",
      jsonHelp: "Define the structure of your model's structured outputs.",
      footerNote:
        "Note: Changes to Schemas are reflected to all new traces of this project.",
    };
  }, [type, initialData]);

  // -----------------------------
  // 3) 초기값/타입 변경 시 폼 상태 동기화
  // -----------------------------
  useEffect(() => {
    if (!isOpen) return; // 닫혀있으면 굳이 동기화 X

    // initialData가 있으면 (수정 모드)
    const initName = initialData?.name ?? "";
    const initDesc = initialData?.description ?? "";
    // tool은 parameters, schema는 schema 키 사용
    const initJsonObj =
      type === "tool" ? initialData?.parameters : initialData?.schema;

    setName(initName);
    setDescription(initDesc);
    if (initJsonObj && typeof initJsonObj === "object") {
      setJsonText(JSON.stringify(initJsonObj, null, 2));
    } else {
      // 없으면 기본 템플릿 유지
      setJsonText(
        '{\n  "type": "object",\n  "properties": {},\n  "required": [],\n  "additionalProperties": false\n}'
      );
    }
  }, [isOpen, type, initialData]);

  // 열려있지 않다면 렌더하지 않음
  if (!isOpen) return null;

  // -----------------------------
  // 4) 저장 버튼: JSON 검증 → type별 payload로 onSubmit
  // -----------------------------
  const handleSave = () => {
    // 필수값 간단 검증
    if (!name.trim()) {
      alert("Name is required.");
      return;
    }
    try {
      const parsed = JSON.parse(jsonText || "{}");

      // 호출 측에 type에 맞는 키로 전달
      const payload =
        type === "tool"
          ? { name, description, parameters: parsed }
          : { name, description, schema: parsed };

      onSubmit?.(payload);
      onClose?.();
    } catch (err) {
      alert("Invalid JSON.\n\n" + err.message);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalContent}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-item-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더: 타이틀/서브타이틀 + 닫기 */}
        <div className={styles.modalHeader}>
          <div>
            <h2 id="new-item-modal-title" className={styles.modalTitle}>
              {content.title}
            </h2>
            <p className={styles.modalSubtitle}>{content.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* 바디: 이름/설명/JSON 입력 */}
        <div className={styles.modalBody}>
          {/* Name */}
          <div className={styles.formGroup}>
            <label htmlFor="item-name">Name</label>
            <input
              id="item-name"
              type="text"
              placeholder={type === "tool" ? "e.g., get_weather" : "e.g., chat_output_v1"}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className={styles.formGroup}>
            <label htmlFor="item-description">Description</label>
            <p className={styles.descriptionText}>{content.descriptionHelpText}</p>
            <textarea
              id="item-description"
              rows={3}
              placeholder={content.descriptionPlaceholder}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* JSON 입력 (LineNumberedTextarea) */}
          <div className={styles.formGroup}>
            <label htmlFor="item-json">{content.jsonLabel}</label>
            <p className={styles.descriptionText}>{content.jsonHelp}</p>

            <LineNumberedTextarea
              id="item-json"
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              minHeight={140}
            >
              {/* prettify 버튼: JSON 구조 정렬 */}
              <button
                type="button"
                className={styles.prettifyButton}
                onClick={() => {
                  try {
                    const pretty = JSON.stringify(JSON.parse(jsonText), null, 2);
                    setJsonText(pretty);
                  } catch {
                    alert("Invalid JSON. Cannot prettify.");
                  }
                }}
              >
                Prettify
              </button>
            </LineNumberedTextarea>
          </div>
        </div>

        {/* 푸터: 안내 + 취소/저장 */}
        <div className={styles.modalFooter}>
          <span className={styles.footerNote}>{content.footerNote}</span>
          <div className={styles.footerActions}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Cancel
            </button>
            <button type="button" className={styles.saveButton} onClick={handleSave}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

NewItemModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  type: PropTypes.oneOf(["tool", "schema"]).isRequired,
  onClose: PropTypes.func.isRequired,
  initialData: PropTypes.shape({
    name: PropTypes.string,
    description: PropTypes.string,
    // tool이면 parameters, schema면 schema 키 사용 (둘 다 optional)
    parameters: PropTypes.object,
    schema: PropTypes.object,
  }),
  onSubmit: PropTypes.func, // 저장 시 상위에서 API 호출 처리
};
