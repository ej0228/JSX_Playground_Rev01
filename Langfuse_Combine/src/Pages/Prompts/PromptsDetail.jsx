import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import styles from './PromptsDetail.module.css';
import {
  Book,
  Clipboard,
  Play,
  MoreVertical,
  Search,
  Plus,
  GitCommitHorizontal,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Tag,
} from 'lucide-react';
import DuplicatePromptModal from './DuplicatePromptModal.jsx';
import { fetchPromptVersions, createNewPromptVersion } from './promptsApi.js';

// --- 메인 컴포넌트 ---
export default function PromptsDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState('Prompt');
  const [allPromptNames, setAllPromptNames] = useState([]);
  const [isDuplicateModalOpen, setDuplicateModalOpen] = useState(false);

  const loadPromptData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const fetchedVersions = await fetchPromptVersions(id);
      setVersions(fetchedVersions);
      if (fetchedVersions.length > 0) {
        setSelectedVersion(fetchedVersions[0]); // 최신 버전을 기본으로 선택
      }
    } catch (err) {
      console.error("Failed to fetch prompt details:", err);
      setError(`"${id}" 프롬프트를 불러오는 데 실패했습니다.`);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPromptData();
  }, [loadPromptData]);

  const handleNewVersion = () => {
    if (!id || !selectedVersion) return;

    navigate(`/prompts/new`, {
      state: {
        promptName: id,
        promptType: selectedVersion.prompt.system ? 'Chat' : 'Text',
        chatContent: selectedVersion.prompt.system
          ? [
              { id: 1, role: 'System', content: selectedVersion.prompt.system },
              { id: 2, role: 'User', content: selectedVersion.prompt.user },
            ]
          : [{ id: 1, role: 'System', content: 'You are a helpful assistant.' }],
        textContent: selectedVersion.prompt.system ? '' : selectedVersion.prompt.user,
        config: JSON.stringify(selectedVersion.config, null, 2),
        isNewVersion: true,
        version: selectedVersion.id
      },
    });
  };

  const { currentPromptIndex, handlePrev, handleNext } = useMemo(() => {
    const currentIndex = id ? allPromptNames.findIndex(name => name === id) : -1;

    const prev = () => {
      if (currentIndex > 0) {
        navigate(`/prompts/${allPromptNames[currentIndex - 1]}`);
      }
    };

    const next = () => {
      if (currentIndex !== -1 && currentIndex < allPromptNames.length - 1) {
        navigate(`/prompts/${allPromptNames[currentIndex + 1]}`);
      }
    };

    return { currentPromptIndex: currentIndex, handlePrev: prev, handleNext: next };
  }, [id, allPromptNames, navigate]);

  const variables = useMemo(() => {
    if (!selectedVersion) return [];
    const content = selectedVersion.prompt;
    const textToScan = `${content.system || ''} ${content.user || ''}`;
    const regex = /{{\s*([\w\d_]+)\s*}}/g;
    const matches = textToScan.match(regex) || [];
    const uniqueVars = new Set(matches.map(v => v.replace(/[{}]/g, '').trim()));
    return Array.from(uniqueVars);
  }, [selectedVersion]);

  const handleDuplicateSubmit = (newName, copyAll) => {
    console.log({
      action: 'Duplicate Prompt',
      newName,
      copyAll,
      sourcePrompt: id,
    });
    alert(`Prompt duplicated as "${newName}" (자세한 내용은 콘솔 확인)`);
    setDuplicateModalOpen(false);
  };

  if (isLoading) {
    return <div className={styles.container}><div className={styles.placeholder}>프롬프트를 불러오는 중...</div></div>;
  }

  if (error || !selectedVersion) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
            <div className={styles.breadcrumbs}>
                <Book size={16} />
                <Link to="/prompts" style={{ color: '#94a3b8', textDecoration: 'none' }}>Prompts</Link>
                <span>/</span>
                <span className={styles.promptName}>{id}</span>
            </div>
        </div>
        <div className={styles.placeholder}>⚠️ {error || "프롬프트 데이터를 찾을 수 없습니다."}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.breadcrumbs}>
          <h1 className={styles.promptNameH1}>
            {id}
          </h1>
          <div className={styles.versionDropdown}>
            {selectedVersion.tags.map(tag => (
              <span key={tag} className={styles.tagItem}><Tag size={12}/> {tag}</span>
            ))}
          </div>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.actionButton} onClick={() => setDuplicateModalOpen(true)}>
            <Clipboard size={14} /> Duplicate</button>
          <div className={styles.navButtons}>
             <button className={styles.navButton} onClick={handlePrev} disabled={currentPromptIndex <= 0}>
                <ChevronLeft size={16}/>
             </button>
             <button className={styles.navButton} onClick={handleNext} disabled={currentPromptIndex === -1 || currentPromptIndex >= allPromptNames.length - 1}>
                <ChevronRight size={16}/>
             </button>
          </div>
        </div>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tabButton} ${styles.active}`}>Versions</button>
        <button className={styles.tabButton}>Metrics</button>
      </div>

      <div className={styles.mainGrid}>
        <div className={styles.leftPanel}>
          <div className={styles.versionToolbar}>
            <div className={styles.searchBox}>
              <Search size={14} className={styles.searchIcon} />
              <input type="text" placeholder="Search versions" />
            </div>
            <button className={styles.newButton} onClick={handleNewVersion}>
              <Plus size={16} /> New Version
            </button>
          </div>
          <ul className={styles.versionList}>
            {versions.map(version => (
              <li
                key={version.id}
                className={`${styles.versionItem} ${selectedVersion?.id === version.id ? styles.selected : ''}`}
                onClick={() => setSelectedVersion(version)}
              >
                <div className={styles.versionTitle}>
                  <span className={styles.versionLabel}>#{version.id}</span>
                </div>
                <div className={styles.tagsContainer}>
                  {version.labels.map(label => (
                      <span key={label} className={label.toLowerCase() === 'production' ? styles.statusTagProd : styles.statusTagLatest}>
                          <GitCommitHorizontal size={12}/>{label}
                      </span>
                  ))}
                </div>
                <div className={styles.versionMeta}>
                    <p>{version.details}</p>
                    <p>by {version.author}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.rightPanel}>
          <div className={styles.detailTabs}>
            <div className={styles.detailTabButtons}>
              <button className={`${styles.detailTabButton} ${activeDetailTab === 'Prompt' ? styles.active : ''}`} onClick={() => setActiveDetailTab('Prompt')}>Prompt</button>
              <button className={`${styles.detailTabButton} ${activeDetailTab === 'Config' ? styles.active : ''}`} onClick={() => setActiveDetailTab('Config')}>Config</button>
              <button className={`${styles.detailTabButton} ${activeDetailTab === 'Generations' ? styles.active : ''}`} onClick={() => setActiveDetailTab('Generations')}>Linked Generations</button>
              <button className={`${styles.detailTabButton} ${activeDetailTab === 'Use' ? styles.active : ''}`} onClick={() => setActiveDetailTab('Use')}>Use Prompt</button>
            </div>
            <div className={styles.detailActions}>
              <button className={styles.playgroundButton}><Play size={14} /> Playground</button>
              <button className={styles.playgroundButton}>Experiment</button>
              <button className={styles.iconButton}><MessageCircle size={16} /></button>
              <button className={styles.iconButton}><MoreVertical size={18} /></button>
            </div>
          </div>

          <div className={styles.promptArea}>
            {activeDetailTab === 'Prompt' && (
                <>
                    {selectedVersion.prompt.system && (
                        <div className={styles.promptCard}>
                            <div className={styles.promptHeader}>System Prompt</div>
                            <div className={styles.promptBody}><pre>{selectedVersion.prompt.system}</pre></div>
                        </div>
                    )}
                    <div className={styles.promptCard}>
                        <div className={styles.promptHeader}>Text Prompt</div>
                        <div className={styles.promptBody}><pre>{selectedVersion.prompt.user}</pre></div>
                    </div>
                     {variables.length > 0 && (
                        <div className={styles.variablesInfo}>
                            The following variables are available:
                            <div className={styles.variablesContainer}>
                                {variables.map(v => <span key={v} className={styles.variableTag}>{v}</span>)}
                            </div>
                        </div>
                    )}
                </>
            )}

            {activeDetailTab === 'Config' && (
              <div className={styles.promptCard}>
                <div className={styles.promptHeader}>Config</div>
                <div className={styles.promptBody}><pre>{JSON.stringify(selectedVersion.config ?? {}, null, 2)}</pre></div>
              </div>
            )}
             
            {activeDetailTab === 'Use' && (
              <>
                <div className={styles.promptCard}>
                    <div className={styles.promptHeader}>Python</div>
                    <div className={styles.promptBody}><pre>{selectedVersion.useprompts.python}</pre></div>
                </div>
                <div className={styles.promptCard}>
                    <div className={styles.promptHeader}>JS/TS</div>
                    <div className={styles.promptBody}><pre>{selectedVersion.useprompts.jsTs}</pre></div>
                </div>
              </>
            )}

            {activeDetailTab === 'Generations' && <div className={styles.placeholder}>No generations linked yet.</div>}
          </div>
        </div>
      </div>
      {isDuplicateModalOpen && (
        <DuplicatePromptModal
          isOpen={isDuplicateModalOpen}
          onClose={() => setDuplicateModalOpen(false)}
          onSubmit={handleDuplicateSubmit}
          currentName={id || ''}
          currentVersion={selectedVersion?.id || 0}
        />
      )}
    </div>
  );
}
