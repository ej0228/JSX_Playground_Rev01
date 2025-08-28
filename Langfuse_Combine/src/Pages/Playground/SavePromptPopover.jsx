import React, { useState, useEffect } from "react";
import styles from "./SavePromptPopover.module.css";
import { Search, Check } from "lucide-react";
import { fetchPrompts } from "../Prompts/promptsApi"; // API 함수 import

export default function SavePromptPopover({ onSaveAsNew }) {
  const [prompts, setPrompts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPromptId, setSelectedPromptId] = useState(null);

  useEffect(() => {
    const loadPrompts = async () => {
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
    };
    loadPrompts();
  }, []);

  const handlePromptClick = (id) => {
    setSelectedPromptId((prev) => (prev === id ? null : id));
  };

  return (
    <div className={styles.popover}>
      <button className={styles.primaryButton} onClick={onSaveAsNew}>
        Save as new prompt
      </button>

      <div className={styles.divider}>
        <hr />
        <span>or</span>
        <hr />
      </div>

      <div className={styles.searchBox}>
        <Search size={16} />
        <input type="text" placeholder="Search chat prompts..." />
      </div>

      <ul className={styles.promptList}>
        {isLoading ? (
          <li>Loading...</li>
        ) : error ? (
          <li>{error}</li>
        ) : (
          prompts.map((prompt) => (
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

      <button className={styles.secondaryButton} disabled={!selectedPromptId}>
        Save as new prompt version
      </button>
    </div>
  );
}
