import { useEffect, useMemo, useRef, useState, } from "react";
import {
  Info,
  Play,
  RotateCcw,
  Plus,
  Copy,
  Save,
  Wrench,
  BookText,
  Variable,
  Search,
  Minus,
  Edit,
  X,
  Settings,
  ChevronDown,
} from "lucide-react";
import styles from "./Playground.module.css";
import ChatBox from "../../components/ChatBox/ChatBox";
import NewLlmConnectionModal from "./NewLlmConnectionModal";
import PlaygroundPanel from "./PlaygroundPanel";
import NewItemModal from "./NewItemModal";
import SavePromptPopover from "./SavePromptPopover";


import { ToolsAPI } from "../../services/tools.service";
import { SchemasAPI } from "../../services/schemas.service";

import { useLocation, useNavigate, useParams, Navigate } from "react-router-dom";
import useProjectId from "../../hooks/useProjectId";



// 메시지 배열 -> 텍스트 병합
function mergeMessageText(messages) {
  return messages
    .filter((m) => m && typeof m.content === "string")
    .map((m) => m.content)
    .join("\n");
}

// {{ var }} 패턴 공통
const VAR_RE = /\{\{\s*([a-zA-Z0-9_\-]+)\s*\}\}/g;

// 텍스트 한 덩어리에서 변수 추출
function extractVarsFromText(text, set) {
  if (typeof text !== "string" || !text) return;
  let m;
  while ((m = VAR_RE.exec(text))) set.add(m[1]);
}

// 메시지 배열 전체에서(placeholder 포함) 변수 추출
function extractVariablesFromMessages(messages) {
  const set = new Set();

  for (const m of messages || []) {
    // 1) 일반 메시지: content 문자열에서 스캔
    if ((m?.kind !== "placeholder" && m?.role !== "Placeholder")) {
      extractVarsFromText(m?.content, set);
      continue;
    }

    // 2) placeholder: JSON 파싱 후 내부 message.content에서 스캔
    try {
      const parsed = JSON.parse(m?.content || "{}");
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      for (const it of arr) {
        extractVarsFromText(it?.content, set);
      }
    } catch {
      // JSON이 아니면(그냥 문자열) 통으로 스캔
      extractVarsFromText(m?.content, set);
    }
  }

  return Array.from(set);
}


// 제출 직전 치환
function fillVariables(messages, values = {}) {
  const re = /\{\{\s*([a-zA-Z0-9_\-]+)\s*\}\}/g;
  return messages.map((msg) => {
    if (typeof msg.content !== "string") return msg;
    const content = msg.content.replace(re, (_, name) => {
      // 값이 비어있으면 그대로 남김(혹은 에러 처리 전에 남겨놓기)
      return values[name] ?? `{{${name}}}`;
    });
    return { ...msg, content };
  });
}

// ▼▼▼ ADD: placeholder 파싱 유틸
function extractPlaceholders(messages) {
  const list = [];
  messages.forEach((m, idx) => {
    if (m?.kind === "placeholder" || m?.role === "Placeholder") {
      let parsed = null;
      try {
        parsed = JSON.parse(m.content || "{}"); // {} 또는 []
      } catch { }
      list.push({
        index: idx,
        name: (m.name || "").trim(), // 없으면 빈 문자열 -> UI에선 "Unnamed placeholder"
        value: parsed,
        raw: m.content || "",
      });
    }
  });
  return list;
}


// ---------- Tools Panel ----------

const ToolsPanelContent = ({
  attachedTools,
  availableTools,
  onAddTool,
  onRemoveTool,
  onCreateTool,
  onEditTool,
  onDeleteTool,
  loading,
}) => (
  <>
    {attachedTools.map((tool) => (
      <div className={styles.toolSection} key={tool.id}>
        <div className={styles.toolItem}>
          <div className={styles.toolInfo}>
            <Wrench size={14} />
            <div className={styles.toolText}>
              <span className={styles.toolName}>{tool.name}</span>
              <span className={styles.toolDesc}>{tool.description}</span>
            </div>
          </div>
          <div className={styles.iconCircle} onClick={() => onRemoveTool(tool.id)}>
            <Minus size={14} />
          </div>
        </div>
      </div>
    ))}

    <div className={styles.toolSearch}>
      <Search size={14} />
      <input type="text" placeholder="Search tools..." disabled={loading} />
    </div>

    <div className={styles.toolList}>
      {loading ? (
        <div className={styles.muted}>Loading tools…</div>
      ) : (
        availableTools.map((tool) => (
          <div
            className={styles.toolItem}
            key={tool.id}
            onDoubleClick={() => onAddTool(tool)}
          >
            <div className={styles.toolInfo}>
              <Wrench size={14} />
              <div className={styles.toolText}>
                <span className={styles.toolName}>{tool.name}</span>
                <span className={styles.toolDesc}>{tool.description}</span>
              </div>
            </div>
            <div className={styles.rowActions}>
              <button className={styles.editButton} title="Edit" onClick={(e) => { e.stopPropagation(); onEditTool(tool); }}>
                <Edit size={14} />
              </button>
              <button className={styles.editButton} title="Delete" onClick={(e) => { e.stopPropagation(); onDeleteTool(tool); }}>
                <X size={14} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>

    <button className={styles.toolButton} onClick={onCreateTool} disabled={loading}>
      <Plus size={14} /> Create new tool
    </button>
  </>
);


// ---------- Schema Panel ----------
const SchemaPanelContent = ({
  userSchema,
  onAddSchema,
  onRemoveSchema,
  availableSchemas,
  onCreateSchema,
  onEditSchema,
  onDeleteSchema,
  loading,
}) => (
  <>
    {userSchema && (
      <div className={styles.toolSection}>
        <div className={styles.toolItem}>
          <div className={styles.toolInfo}>
            <BookText size={14} />
            <div className={styles.toolText}>
              <span className={styles.toolName}>{userSchema.name}</span>
              <span className={styles.toolDesc}>{userSchema.description}</span>
            </div>
          </div>
          <div className={styles.iconCircle} onClick={() => onRemoveSchema(userSchema.id)} title="Detach schema">
            <Minus size={14} />
          </div>
        </div>
      </div>
    )}

    <div className={styles.toolSearch}>
      <Search size={14} />
      <input type="text" placeholder="Search schemas..." disabled={loading} />
    </div>

    <div className={styles.toolList}>

      {loading ? (
        <div className={styles.muted}>Loading schemas…</div>
      ) : availableSchemas.map((schema) => (
        <div
          className={styles.toolItem}
          key={schema.id}
          onDoubleClick={() => onAddSchema(schema)}
          title="Double click to attach"
        >
          <div className={styles.toolInfo}>
            <div className={styles.toolText}>
              <span className={styles.toolName}>{schema.name}</span>
              <span className={styles.toolDesc}>{schema.description}</span>
            </div>
          </div>

          <div className={styles.rowActions}>
            <button className={styles.editButton} title="Edit" onClick={(e) => { e.stopPropagation(); onEditSchema(schema); }}>
              <Edit size={14} />
            </button>
            <button className={styles.editButton} title="Delete" onClick={(e) => { e.stopPropagation(); onDeleteSchema(schema); }}>
              <X size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>

    <button className={styles.toolButton} onClick={onCreateSchema} disabled={loading}>
      <Plus size={14} /> Create new schema
    </button>
  </>
);


/** 스트리밍 설정 팝오버: 외부 클릭/ESC 닫기 지원 */
function StreamSettingsPopover({ open, streaming, onChangeStreaming, onClose }) {
  const popRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    const onClick = (e) => {
      if (!popRef.current) return;
      if (!popRef.current.contains(e.target)) onClose?.();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      ref={popRef}
      className={styles.streamPopover}
      role="dialog"
      aria-modal="true"
      aria-label="Streaming settings"
    >
      <div className={styles.streamPopoverHeader}>Stream responses</div>
      <div className={styles.streamPopoverSub}>Real-time response streaming</div>

      <label className={styles.switchRow}>
        <span>Enable</span>
        <label className={styles.switch}>
          <input
            type="checkbox"
            checked={streaming}
            onChange={(e) => onChangeStreaming(e.target.checked)}
          />
          <span className={styles.slider} />
        </label>
      </label>
    </div>
  );
}




// ---------- Variables Panel ----------
const VariablesPanelContent = ({ names, values, onChangeValue, onReset, placeholders = [] }) => {
  const hasVars = names.length > 0;
  const hasPH = placeholders.length > 0;
  return (
    <>
      {!hasVars && !hasPH ? (
        <div className={styles.emptyNote} style={{ marginTop: 8 }}>
          No variables detected. Use <code>{'{{name}}'}</code> in messages to create one.
        </div>
      ) : null}

      {hasVars && (
        <div className={styles.varsList}>
          {names.map((n) => (
            <div key={n} className={styles.varRow}>
              <div className={styles.varName}>{n}</div>
              <input
                className={styles.varInput}
                type="text"
                placeholder={n}
                value={values[n] ?? ""}
                onChange={(e) => onChangeValue(n, e.target.value)}
              />
            </div>
          ))}
        </div>
      )}

      {hasPH && (
        <>
          <div style={{ marginTop: 12, fontSize: 12, color: '#9aa4b2' }}>
            Message Placeholders
          </div>
          <div className={styles.varsList} style={{ marginTop: 6 }}>
            {placeholders.map((ph, i) => (
              <div key={i} className={styles.varRow}>
                <div className={styles.varName}>{ph.name || "Unnamed placeholder"}</div>
                <textarea className={styles.varInput} value={ph.raw} readOnly />
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
};





// ---------- 단일 패널 ----------


const PlaygroundComponent = ({ PROJECT_ID, onCopy, onRemove, showRemoveButton, panelId, onRegisterRunner }) => {
  const [messages, setMessages] = useState([]);

  //변수 상태 추가 + 감지 useEffect
  const [varNames, setVarNames] = useState([]);          // ['foo','bar']
  const [varValues, setVarValues] = useState({});         // { foo:'', bar:'' }

  const [isLlmModalOpen, setIsLlmModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // 'tool' | 'schema' | null
  const [activePanel, setActivePanel] = useState(null); // 'tools' | 'schema' | null
  const [isSavePopoverOpen, setIsSavePopoverOpen] = useState(false);
  const [isStreamSettingsOpen, setIsStreamSettingsOpen] = useState(false);



  //tool 기능 관련 선언
  const [attachedTools, setAttachedTools] = useState([]);
  const [availableTools, setAvailableTools] = useState([]);
  const [loadingTools, setLoadingTools] = useState(false);
  const [toolsError, setToolsError] = useState(null);

  // 모달 컨트롤 (tool 생성/수정 공용)
  const [editingTool, setEditingTool] = useState(null); // 수정 대상 (null이면 생성)


  //schema 기능 관련 선언
  const [attachedUserSchema, setAttachedUserSchema] = useState(null);
  const [availableSchemas, setAvailableSchemas] = useState([]);
  const [loadingSchemas, setLoadingSchemas] = useState(false);
  const [schemasError, setSchemasError] = useState(null);

  //variables 관련
  const [placeholders, setPlaceholders] = useState([]);
  useEffect(() => {
    setPlaceholders(extractPlaceholders(messages));
  }, [messages]);

  const togglePanel = (panelName) => {
    setActivePanel(activePanel === panelName ? null : panelName);
  };

  // projectId 결정 후 Tools 목록 로드
  useEffect(() => {
    if (!PROJECT_ID) {
      setAvailableTools([]);
      return;
    }
    let alive = true;
    (async () => {
      try {
        setLoadingTools(true);
        setToolsError(null);
        const list = await ToolsAPI.list(PROJECT_ID);
        if (alive) setAvailableTools(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error("load tools failed", e);
        if (alive) {
          setToolsError(e?.message || "Failed to load tools");
          setAvailableTools([]);
        }
      } finally {
        if (alive) setLoadingTools(false);
      }
    })();
    return () => { alive = false; };
  }, [PROJECT_ID]);



  // Tools 조작 함수
  const handleAddTool = (toolToAdd) => {
    if (!attachedTools.some((t) => t.id === toolToAdd.id)) {
      setAttachedTools((prev) => [...prev, toolToAdd]);
    }
  };
  const handleRemoveTool = (toolId) => {
    setAttachedTools((prev) => prev.filter((t) => t.id !== toolId));
  };

  const refreshTools = async () => {
    const list = await ToolsAPI.list(PROJECT_ID);
    setAvailableTools(Array.isArray(list) ? list : []);
  };
  const handleCreateTool = () => {
    setEditingTool(null);           // 생성 모드
    setModalType("tool");
  };
  const handleEditTool = (tool) => {
    setEditingTool(tool);           // 수정 모드
    setModalType("tool");
  };
  const handleDeleteTool = async (tool) => {
    if (!window.confirm(`Delete tool "${tool.name}"?`)) return;
    try {
      await ToolsAPI.delete(PROJECT_ID, tool.id);
      await refreshTools();
      // 만약 첨부돼 있었다면 떼기
      setAttachedTools((prev) => prev.filter((t) => t.id !== tool.id));
    } catch (e) {
      alert(e?.message || "Delete failed");
    }
  };



  //스키마 목록 로딩 useEffect
  useEffect(() => {
    if (!PROJECT_ID) {
      setAvailableSchemas([]);
      return;
    }
    let alive = true;
    (async () => {
      try {
        setLoadingSchemas(true);
        setSchemasError(null);
        const list = await SchemasAPI.list(PROJECT_ID);
        if (alive) setAvailableSchemas(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error("load schemas failed", e);
        if (alive) {
          setSchemasError(e?.message || "Failed to load schemas");
          setAvailableSchemas([]);
        }
      } finally {
        if (alive) setLoadingSchemas(false);
      }
    })();
    return () => { alive = false; };
  }, [PROJECT_ID]);


  //스키마 목록 갱신 헬퍼
  const refreshSchemas = async () => {
    const list = await SchemasAPI.list(PROJECT_ID);
    setAvailableSchemas(Array.isArray(list) ? list : []);
  };


  //스키마 조작 핸들러
  const handleAddSchema = (schemaToAdd) => setAttachedUserSchema(schemaToAdd);

  const handleRemoveSchema = (schemaId) => {
    if (attachedUserSchema && attachedUserSchema.id === schemaId) {
      setAttachedUserSchema(null);
    }
  };

  const handleCreateSchema = () => {
    setModalType("schema");
    setEditingTool(null); // 깨끗하게
  };

  const [editingSchema, setEditingSchema] = useState(null);

  const handleEditSchema = (schema) => {
    setEditingSchema(schema);
    setModalType("schema");
  };

  const handleDeleteSchema = async (schema) => {
    if (!window.confirm(`Delete schema "${schema.name}"?`)) return;
    try {
      await SchemasAPI.delete(PROJECT_ID, schema.id);
      await refreshSchemas();
      // 현재 선택돼 있던 걸 삭제했다면 해제
      if (attachedUserSchema?.id === schema.id) setAttachedUserSchema(null);
    } catch (e) {
      alert(e?.message || "Delete failed");
    }
  };

  // ===== 서버 호출/모델 선택/스트리밍 =====
  const API_URL = "/api/chatCompletion";

  // LLM Connections 로딩 (tRPC 읽기)
  const [connections, setConnections] = useState([]); // [{provider, adapter, baseURL, customModels, withDefaultModels}, ...]
  const [loadingConn, setLoadingConn] = useState(false);
  const [connError, setConnError] = useState(null);

  const [selectedProvider, setSelectedProvider] = useState("");   // provider 문자열
  const [selectedAdapter, setSelectedAdapter] = useState("");
  const [selectedModel, setSelectedModel] = useState("");         // 정확한 모델명(예: "Qwen-xxx")

  const [streaming, setStreaming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [output, setOutput] = useState(null);
  const outputTextRef = useRef(""); // 스트리밍 누적 출력


  // --- 드롭다운 상태/참조 (model pill)
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const modelBtnRef = useRef(null);
  const modelMenuRef = useRef(null);


  // tRPC payload 언랩 유틸 (안전하게 파싱)
  function unwrapTrpcJson(j) {
    // 보통 j.result.data.json 에 최종 페이로드가 들어오지만,
    // 버전/어댑터에 따라 j.result.data 인 경우도 있으니 폭넓게 처리
    return j?.result?.data?.json ?? j?.result?.data ?? j;
  }

  useEffect(() => {
    // 1) null: useProjectId가 아직 결정 중 (초기 로딩 단계)
    if (PROJECT_ID === null) return;
    // 2) 빈 문자열: 진짜 projectId를 못 찾은 상태 → UI 초기화 후 종료
    if (PROJECT_ID === "") {
      setConnections([]);
      setSelectedProvider("");
      setSelectedAdapter("");
      setSelectedModel("");
      return;
    }

    const ac = new AbortController();

    (async () => {
      try {
        setLoadingConn(true);
        setConnError(null);

        const qs = encodeURIComponent(JSON.stringify({ json: { projectId: PROJECT_ID } }));
        const url = `/api/trpc/llmApiKey.all?input=${qs}`;
        const r = await fetch(url, { credentials: "include", signal: ac.signal });

        if (ac.signal.aborted) return;

        if (r.status === 401) {
          // 401은 세션/쿠키(프록시) 또는 멤버십 문제
          throw new Error("401 Unauthorized — 로그인/쿠키 또는 프로젝트 멤버십/프록시 설정 확인");
        }
        if (!r.ok) throw new Error(`Failed to load LLM connections (${r.status})`);

        const j = await r.json().catch(() => ({}));
        const payload = unwrapTrpcJson(j); // => { data, totalCount } 형태 기대
        const rows = payload?.data || [];

        setConnections(rows);

        if (rows.length > 0) {
          const first = rows[0];
          setSelectedProvider(first.provider || "");
          setSelectedAdapter(first.adapter ?? "");
          setSelectedModel(first.customModels?.[0] ?? "");
        } else {
          setSelectedProvider("");
          setSelectedAdapter("");
          setSelectedModel("");
        }
      } catch (e) {
        if (ac.signal.aborted) return;
        console.error("[llm connections] load failed", e);
        setConnError(e?.message || "Failed to load LLM connections");
        setConnections([]);
        setSelectedProvider("");
        setSelectedAdapter("");
        setSelectedModel("");
      } finally {
        if (!ac.signal.aborted) setLoadingConn(false);
      }
    })();

    // PROJECT_ID가 바뀌거나 언마운트되면 요청 취소
    return () => ac.abort();
  }, [PROJECT_ID]);


  // ✅ 현재 선택된 연결 탐색 (provider+adapter로 정확히 매칭)
  const currentConn = useMemo(
    () =>
      connections.find(
        (c) =>
          c.provider === selectedProvider &&
          (c.adapter ?? "") === (selectedAdapter ?? "")
      ),
    [connections, selectedProvider, selectedAdapter]
  );

  // ✅ 드롭다운에 뿌릴 "저장된 모델" 리스트
  const modelMenuItems = useMemo(
    () =>
      connections.flatMap((c) =>
        (c.customModels ?? []).map((m) => ({
          id: `${c.id}::${m}`,
          conn: c,
          model: m,
        }))
      ),
    [connections]
  );
  // ✅ 외부 클릭 시 드롭다운 닫기 (JS 버전)
  useEffect(() => {
    if (!isModelMenuOpen) return;
    const onDown = (e) => {
      if (!modelMenuRef.current || !modelBtnRef.current) return;
      const target = e.target;
      if (
        !modelMenuRef.current.contains(target) &&
        !modelBtnRef.current.contains(target)
      ) {
        setIsModelMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [isModelMenuOpen]);

  //메세지 바뀔 때 마다 변수 자동 추출
  useEffect(() => {
    const names = extractVariablesFromMessages(messages);
    setVarNames(names);

    // 새로 발견된 변수는 빈 값으로 초기화
    setVarValues((prev) => {
      const next = { ...prev };
      names.forEach((n) => {
        if (!(n in next)) next[n] = "";
      });
      // 더 이상 안 쓰는 변수는 남겨도 무해하지만,
      // 깔끔하게 지우고 싶으면 아래 주석 해제
      // Object.keys(next).forEach((k) => { if (!names.includes(k)) delete next[k]; });
      return next;
    });
  }, [messages]);

  // ✅ 목록에서 (연결,모델) 클릭 시 정확히 그 값으로만 세팅
  function pickConnection(item) {
    setSelectedProvider(item.conn.provider);
    setSelectedAdapter(item.conn.adapter ?? "");
    setSelectedModel(item.model);
    setIsModelMenuOpen(false);
  }



  const modelOptions = currentConn?.customModels || [];

  const hasContent = useMemo(
    () => messages.some((m) => (m.content || "").trim().length > 0),
    [messages]
  );
  const disabledReason = useMemo(() => {
    return loadingConn
      ? "Loading LLM connections…"
      : !selectedProvider
        ? "Select a provider"
        : !selectedModel
          ? "Select or type a model"
          : !hasContent
            ? "Add at least one message"
            : "";
  }, [loadingConn, selectedProvider, selectedModel, hasContent]);

  const canSubmit = hasContent && !!selectedProvider && !!selectedModel;

  // placeholder를 실제 메시지로 펼치는 전처리
  function expandPlaceholders(msgs) {
    const out = [];
    for (const m of msgs) {
      if (m?.kind === "placeholder" || m?.role === "Placeholder") {
        try {
          const parsed = JSON.parse(m.content || "{}");
          const arr = Array.isArray(parsed) ? parsed : [parsed];
          for (const it of arr) {
            if (it && typeof it.content === "string") {
              out.push({
                kind: "message",
                role: (it.role || "user").toLowerCase(),
                content: it.content,
              });
            }
          }
        } catch {
          // 파싱 실패 시 무시(원하면 alert로 알려도 됨)
        }
      } else {
        out.push(m);
      }
    }
    return out;
  }

  function toServerBody(messages) {
    const toRole = (role) => (role || "user").toLowerCase();
    const toType = (role) => {
      const r = toRole(role);
      if (r === "assistant") return "assistant";
      if (r === "system") return "system";
      if (r === "developer") return "developer";
      return "user";
    };
    const chat = messages
      .filter((m) => m.kind !== "placeholder" && m.role !== "Placeholder")
      .map((m) => ({
        type: toType(m.role),
        role: toRole(m.role),
        content: (m.content || "").trim(),
      }));

    return {
      projectId: PROJECT_ID,
      messages: chat,
      modelParams: {
        provider: selectedProvider,
        adapter: selectedAdapter,
        model: selectedModel,
        temperature: 0.7,
      },
      streaming,
      outputSchema: attachedUserSchema
        ? { id: attachedUserSchema.id, name: attachedUserSchema.name, schema: attachedUserSchema.schema || {} }
        : null,
    };
  }

  // 논-스트리밍
  async function submitNonStreaming(body) {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.message || "Chat failed");
    }
    const ct = res.headers.get("content-type") || "";
    const data = ct.includes("application/json") ? await res.json() : { content: await res.text() };
    setOutput(data);
  }

  // 스트리밍(ReadableStream) — text/event-stream 또는 chunked json 둘 다 단순 텍스트로 붙임
  async function submitStreaming(body) {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    if (!res.ok || !res.body) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.message || "Chat failed");
    }

    outputTextRef.current = "";
    setOutput({ content: "" });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      // 서버 구현에 따라 line/chunk 형태가 다를 수 있으니 단순 텍스트로 누적
      outputTextRef.current += chunk;
      setOutput({ content: outputTextRef.current });
    }
  }

  async function handleSubmit() {
    if (!canSubmit) {
      alert("Select provider/model and add at least one message.");
      return;
    }


    // 1) 미입력 변수 검사
    const missing = varNames.filter((v) => !(varValues[v] && String(varValues[v]).trim().length));
    if (missing.length) {
      alert(`Values required for: ${missing.join(", ")}`);
      return;
    }
    // 2) 변수 치환
    const replaced = fillVariables(messages, varValues);
    // 3) placeholder 전개
    const expanded = expandPlaceholders(replaced);
    // 4) 바디 생성
    const body = toServerBody(expanded);

    try {
      setIsSubmitting(true);
      setOutput(null);
      if (streaming) {
        await submitStreaming(body);
      } else {
        await submitNonStreaming(body);
      }
    } catch (e) {
      console.error("Submit failed", e);
      alert(e.message || "실행 중 오류가 발생했습니다. 콘솔을 확인하세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ▶ Run All을 위해 부모에게 내 submit 핸들 등록/해제
  useEffect(() => {
    if (typeof onRegisterRunner === "function") {
      onRegisterRunner(panelId, handleSubmit);
      return () => onRegisterRunner(panelId, null); // 언마운트/리렌더 시 해제
    }
  }, [panelId, onRegisterRunner, handleSubmit]);

  return (
    <div className={styles.panelContainer}>
      {/* Model Card */}
      <div className={styles.card}>
        {/* ✅ 헤더에 model pill + 우측 액션 버튼 */}
        <div className={styles.cardHeader /* position:relative 추천 */}>
          <div className={styles.cardHeaderLeft}>
            <button
              ref={modelBtnRef}
              type="button"
              className={styles.modelPill}
              onClick={() => connections.length > 0 && setIsModelMenuOpen((v) => !v)}
              title={connections.length > 0 ? "Change model" : "No LLM connection"}
              disabled={connections.length === 0}
            >
              <span className={styles.modelProvider}>
                {selectedProvider || (loadingConn ? "Loading…" : "No connection")}
                {selectedProvider && (selectedAdapter ? ` (${selectedAdapter})` : "")}
              </span>
              <span className={styles.modelSep}>:</span>
              <strong className={styles.modelName}>
                {selectedModel ||
                  (connections.length === 0
                    ? "—"
                    : loadingConn
                      ? "Loading…"
                      : "select model")}
              </strong>
              {connections.length > 0 && <ChevronDown size={14} />}
            </button>

            {/* 연결이 없으면 옆에 추가 버튼 표시 */}
            {connections.length === 0 && (
              <button className={styles.addLlmBtn} onClick={() => setIsLlmModalOpen(true)}>
                <Plus size={16} /> Add LLM Connection
              </button>
            )}

            {/* ▼ 드롭다운 메뉴 (연결이 있을 때만) */}
            {isModelMenuOpen && connections.length > 0 && (
              <div ref={modelMenuRef} className={styles.modelMenu}>
                <div className={styles.menuSectionLabel}>Saved models</div>

                {loadingConn ? (
                  <div className={styles.menuEmpty}>Loading…</div>
                ) : modelMenuItems.length > 0 ? (
                  modelMenuItems.map((item) => {
                    const isActive =
                      selectedProvider === item.conn.provider &&
                      (selectedAdapter ?? "") === (item.conn.adapter ?? "") &&
                      selectedModel === item.model;

                    return (
                      <button
                        key={item.id}
                        className={`${styles.menuItem} ${isActive ? styles.active : ""}`}
                        onClick={() => pickConnection(item)}
                      >
                        <span className={styles.menuMain}>
                          {item.conn.provider}
                          {item.conn.adapter ? ` (${item.conn.adapter})` : ""}
                        </span>
                        <span className={styles.menuSep}>:</span>
                        <span className={styles.menuModel}>{item.model}</span>
                      </button>
                    );
                  })
                ) : (
                  <div className={styles.menuEmpty}>No saved models</div>
                )}

                <div className={styles.menuDivider} />
                <button
                  className={styles.menuItem}
                  onClick={() => {
                    setIsModelMenuOpen(false);
                    setIsLlmModalOpen(true);
                  }}
                >
                  <Plus size={14} /> Add new connection…
                </button>
              </div>
            )}
          </div>

          <div className={styles.cardActions}>
            <button className={styles.iconActionBtn} onClick={onCopy} title="Duplicate panel">
              <Copy size={16} />
            </button>
            <button
              className={styles.iconActionBtn}
              onClick={() => setIsSavePopoverOpen((prev) => !prev)}
              title="Save prompt"
            >
              <Save size={16} />
            </button>
            <button
              className={styles.iconActionBtn}
              onClick={() => setIsLlmModalOpen(true)}
              title="LLM Connection"
            >
              <Settings size={16} />
            </button>
            {showRemoveButton && (
              <button className={styles.iconActionBtn} onClick={onRemove} title="Remove panel">
                <X size={16} />
              </button>
            )}
          </div>
        </div>


        {/* ✅ 이제 cardBody에는 모델 관련 내용 없음 */}
        <div className={styles.cardBody}>
          {loadingConn ? (
            <p className={styles.muted}>Loading LLM connections…</p>
          ) : connError ? (
            <p className={styles.errorText}>{connError}</p>
          ) : null}
        </div>

        {isSavePopoverOpen && <SavePromptPopover onSaveAsNew={() => console.log("onSaveAsNew")} />}
      </div>

      {/* Controls */}
      <div className={styles.controlsBar}>
        <button className={styles.controlBtn} onClick={() => togglePanel("tools")}>
          <Wrench size={14} /> Tools <span className={styles.badge}>{attachedTools.length}</span>
        </button>
        <button className={styles.controlBtn} onClick={() => togglePanel("schema")}>
          <BookText size={14} /> Schema <span className={styles.badge}>{attachedUserSchema ? 1 : 0}</span>
        </button>
        <button className={styles.controlBtn} onClick={() => togglePanel("variables")}>
          <Variable size={14} /> Variables{" "}
          <span className={styles.badge}>{varNames.length + placeholders.length}</span>
        </button>
      </div>

      {activePanel === "tools" && (
        <PlaygroundPanel title="Tools" description="Configure tools for your model to use.">
          <ToolsPanelContent
            attachedTools={attachedTools}
            availableTools={availableTools}
            onAddTool={handleAddTool}
            onRemoveTool={handleRemoveTool}

            onCreateTool={handleCreateTool}
            onEditTool={handleEditTool}
            onDeleteTool={handleDeleteTool}
            loading={loadingTools}
          />
          {toolsError && <div className={styles.errorText} style={{ marginTop: 8 }}>{toolsError}</div>}
        </PlaygroundPanel>
      )}

      {activePanel === "schema" && (
        <PlaygroundPanel title="Structured Output" description="Configure JSON schema for structured output.">
          <SchemaPanelContent
            userSchema={attachedUserSchema}
            availableSchemas={availableSchemas}
            onAddSchema={handleAddSchema}
            onRemoveSchema={handleRemoveSchema}

            onCreateSchema={handleCreateSchema}
            onEditSchema={handleEditSchema}
            onDeleteSchema={handleDeleteSchema}
            loading={loadingSchemas}
          />
          {schemasError && <div className={styles.errorText} style={{ marginTop: 8 }}>{schemasError}</div>}
        </PlaygroundPanel>
      )}

      {activePanel === "variables" && (
        <PlaygroundPanel
          title="Variables & Message Placeholders"
          description={
            <>
              Configure variables and message placeholders for your prompts.
              <br />Use {"{{variable}}"} in any message to register it here.
            </>
          }

        >

          <VariablesPanelContent
            names={varNames}
            values={varValues}
            onChangeValue={(name, val) => setVarValues((p) => ({ ...p, [name]: val }))}
            onReset={() => setVarValues(Object.fromEntries(varNames.map((n) => [n, ""])))}
            placeholders={placeholders}
          />
        </PlaygroundPanel>
      )}


      {/* Messages */}
      <ChatBox
        value={messages}
        onChange={setMessages}
        schema="kind"           // 프롬프트 팀이면 "rolePlaceholder"
        autoInit={true}
      />



      {/* Output */}
      <div className={styles.outputCard}>
        <div className={styles.cardHeader}>
          <span>Output</span>
        </div>
        <div className={styles.outputBody}>
          <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
            {output ? (typeof output === "string" ? output : output.content ?? JSON.stringify(output, null, 2)) : ""}
          </pre>
        </div>
      </div>



      {/* Footer full-width Submit + Right controls */}
      <div className={styles.footerBar}>
        <button
          className={styles.submitBtnFull}
          onClick={handleSubmit}
          // ⬇️ 비활성화 + 이유 툴팁
          disabled={!!disabledReason || isSubmitting}
          title={disabledReason || ""} // ← 마우스를 올리면 이유가 뜸
        >

          {isSubmitting ? "Running..." : "Submit"}
        </button>

        <div className={styles.footerRight}>
          {/* 스트리밍 설정(팝오버 열기) */}
          <button
            className={styles.iconActionBtn}
            title="Streaming settings"
            aria-haspopup="dialog"
            aria-expanded={isStreamSettingsOpen}
            onClick={() => setIsStreamSettingsOpen((v) => !v)}
            type="button"
          >
            <Settings size={16} />
          </button>
        </div>

        {/* 팝오버 자체 (화면 우하단 고정) */}
        <StreamSettingsPopover
          open={isStreamSettingsOpen}
          streaming={streaming}
          onChangeStreaming={setStreaming}
          onClose={() => setIsStreamSettingsOpen(false)}
        />
      </div>

      {/* Modals */}
      <NewLlmConnectionModal isOpen={isLlmModalOpen} onClose={() => setIsLlmModalOpen(false)} />

      {/* 모달 띄우기 & 저장 처리 */}
      {modalType === "tool" && (
        <NewItemModal
          isOpen
          type="tool"
          initialData={editingTool ? {
            name: editingTool.name,
            description: editingTool.description,
            parameters: editingTool.parameters || {},
          } : undefined}
          onSubmit={async (form) => {
            try {
              if (editingTool) {
                await ToolsAPI.update(PROJECT_ID, {
                  id: editingTool.id,
                  name: form.name,
                  description: form.description,
                  parameters: form.parameters,
                });
              } else {
                await ToolsAPI.create(PROJECT_ID, {
                  name: form.name,
                  description: form.description,
                  parameters: form.parameters,
                });
              }
              await refreshTools();
            } catch (e) {
              alert(e?.message || "Save failed");
            }
          }}
          onClose={() => { setModalType(null); setEditingTool(null); }}
        />
      )}

      {modalType === "schema" && (
        <NewItemModal
          isOpen
          type="schema"
          initialData={editingSchema ? {
            name: editingSchema.name,
            description: editingSchema.description,
            schema: editingSchema.schema || {},   // ← 키 이름 주의
          } : undefined}
          onSubmit={async (form) => {
            try {
              if (editingSchema) {
                await SchemasAPI.update(PROJECT_ID, {
                  id: editingSchema.id,
                  name: form.name,
                  description: form.description,
                  schema: form.schema, // ← NewItemModal에서 type='schema'면 schema 키로 옴
                });
              } else {
                await SchemasAPI.create(PROJECT_ID, {
                  name: form.name,
                  description: form.description,
                  schema: form.schema,
                });
              }
              await refreshSchemas();
            } catch (e) {
              alert(e?.message || "Save failed");
            }
          }}
          onClose={() => { setModalType(null); setEditingSchema(null); }}
        />
      )}

    </div>
  );
};

// ---------- 메인 ----------
export default function Playground() {

  const [panels, setPanels] = useState([Date.now()]);
  const addPanel = () => setPanels((prev) => [...prev, Date.now()]);
  const removePanel = (idToRemove) => {
    if (panels.length > 1) setPanels((prev) => prev.filter((id) => id !== idToRemove));
  };
  const resetPlayground = () => setPanels([Date.now()]);

  // ▶ 각 패널의 submit 함수를 보관할 레지스트리
  const runnersRef = useRef(new Map()); // key: panelId, val: async () => void
  const registerRunner = (id, fn) => {
    if (typeof fn === "function") runnersRef.current.set(id, fn);
    else runnersRef.current.delete(id);
  };

  // ▶ Run All: 열린 패널 순서대로 실행(순차). 병렬 원하면 Promise.allSettled로 교체.
  const [runningAll, setRunningAll] = useState(false);
  const runAll = async () => {
    if (runningAll) return;
    setRunningAll(true);
    try {
      for (const id of panels) {
        const run = runnersRef.current.get(id);
        if (typeof run === "function") {
          await run(); // 필요하면 await run(true) 처럼 스트리밍 플래그 전달 가능
        }
      }
    } finally {
      setRunningAll(false);
    }
  };

  // ▶ 단축키: Ctrl+Enter 로 Run All
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        runAll();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panels, runningAll]); // panels 바뀌면 최신 순서 반영


  const location = useLocation();
  const navigate = useNavigate();


  // URL의 :projectId (라우트 파라미터)
  const { projectId: routeProjectId } = useParams(); // URL의 :projectId
  // 세션 멤버십으로 검증된 최종 projectId
  const { projectId: resolvedId } = useProjectId({
    location,
    validateAgainstSession: true,
  });


  // URL의 :projectId 가 내 멤버십으로 정해진 resolvedId 와 다르면 ➜ 정규 경로로 교체
  useEffect(() => {
    if (routeProjectId && resolvedId && routeProjectId !== resolvedId) {
      navigate(`/project/${resolvedId}/playground`, { replace: true });
    }
  }, [routeProjectId, resolvedId, navigate]);

  // ✅ 이후에는 resolvedId 를 신뢰하여 데이터 요청
  //   (패널들에는 prop 으로 내려주고, 내부에서 또 useProjectId() 호출하지 않기)



  // 훅이 결정되기 전
  if (resolvedId === null) return null;

  // 어떤 후보도 멤버십에 없어서 실패 → /playground(게이트)로 보내 Gate배너 띄우기 (projectId 수기입력)
  if (resolvedId === "") {
    return <Navigate to="/playground" replace />;
  }



  return (
    <div className={styles.container}>
      {/* ✅ 글로벌 헤더(레이아웃)는 그대로. 우리는 그 바로 아래에 툴바만 붙임 */}
      <div className={styles.pageToolbar}>
        <span className={styles.windowInfo}>{panels.length} windows</span>
        <button className={styles.actionBtn} onClick={addPanel}>
          <Plus size={16} /> Add Panel
        </button>
        <button className={styles.actionBtn} onClick={runAll} disabled={runningAll} title="Ctrl + Enter">
          <Play size={16} /> {runningAll ? "Running..." : "Run All (Ctrl + Enter)"}
        </button>
        <button className={styles.actionBtn} onClick={resetPlayground}>
          <RotateCcw size={16} /> Reset playground
        </button>
      </div>

      <div className={styles.mainGrid}>
        {panels.map((id) => (
          <PlaygroundComponent
            key={id}
            PROJECT_ID={resolvedId}
            onCopy={addPanel}
            onRemove={() => removePanel(id)}
            showRemoveButton={panels.length > 1}
            panelId={id}
            onRegisterRunner={registerRunner}
          />
        ))}
      </div>
    </div>
  );
}