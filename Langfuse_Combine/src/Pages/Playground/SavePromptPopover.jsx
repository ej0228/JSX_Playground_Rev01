// src/Pages/Playground/SavePromptPopover.jsx
import React, { useState, useEffect } from "react";
import styles from "./SavePromptPopover.module.css";
import { Search, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchPrompts } from "../Prompts/promptsApi";

export default function SavePromptPopover({ onSaveAsNew }) {
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPromptId, setSelectedPromptId] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const fetched = await fetchPrompts();
        setPrompts(Array.isArray(fetched) ? fetched : []);
      } catch (err) {
        console.error(err);
        setError("Failed to load prompts.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handlePromptClick = (id) => {
    setSelectedPromptId((prev) => (prev === id ? null : id));
  };

  const selectedPrompt = prompts.find((p) => p.id === selectedPromptId) || null;

  // 새 프롬프트로 이동
  const goNewPrompt = () => {
    // 필요하면 부모 콜백도 유지
    if (typeof onSaveAsNew === "function") onSaveAsNew();

    navigate("/prompts/new", {
      state: {
        isNewVersion: false,
        promptName: "",
        promptType: "Chat",
        chatContent: [
          { id: Date.now(), role: "System", content: "You are a helpful assistant." },
        ],
        textContent: "",
        config: '{\n  "temperature": 1\n}',
        labels: { production: false },
        commitMessage: "",
      },
    });
  };

  // 선택한 프롬프트의 새 버전 만들기로 이동
  const goNewVersion = () => {
    if (!selectedPrompt) return;
    navigate("/prompts/new", {
      state: {
        isNewVersion: true,
        // 새 버전 모드에서는 이름 입력 막히므로 이름만 넘겨줘도 충분
        promptName: selectedPrompt.name,
        // 필요하면 아래 초기값도 같이 넘길 수 있음 (백엔드에서 불러오지 않는다면)
        promptType: "Chat",
        chatContent: [
          { id: Date.now(), role: "System", content: "You are a helpful assistant." },
        ],
        textContent: "",
        config: '{\n  "temperature": 1\n}',
        labels: { production: false },
        commitMessage: "",
      },
    });
  };

  const filtered = prompts.filter((p) =>
    (p.name || "").toLowerCase().includes(query.toLowerCase().trim())
  );

  return (
    <div className={styles.popover}>
      <button className={styles.primaryButton} onClick={goNewPrompt}>
        Save as new prompt
      </button>

      <div className={styles.divider}>
        <hr />
        <span>or</span>
        <hr />
      </div>

      <div className={styles.searchBox}>
        <Search size={16} />
        <input
          type="text"
          placeholder="Search chat prompts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <ul className={styles.promptList}>
        {isLoading ? (
          <li>Loading...</li>
        ) : error ? (
          <li>{error}</li>
        ) : filtered.length === 0 ? (
          <li>No prompts</li>
        ) : (
          filtered.map((prompt) => (
            <li
              key={prompt.id}
              className={styles.promptItem}
              onClick={() => handlePromptClick(prompt.id)}
            >
              {selectedPromptId === prompt.id ? (
                <Check size={16} className={styles.checkIcon} />
              ) : (
                <div className={styles.checkIconPlaceholder} />
              )}
              {prompt.name}
            </li>
          ))
        )}
      </ul>

      <button
        className={styles.secondaryButton}
        disabled={!selectedPromptId}
        onClick={goNewVersion}
        title={!selectedPromptId ? "Select a prompt to version" : "Create a new version"}
      >
        Save as new prompt version
      </button>
    </div>
  );
}
