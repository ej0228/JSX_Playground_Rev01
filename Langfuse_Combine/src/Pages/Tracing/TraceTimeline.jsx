// src/Pages/Tracing/TraceTimeline.jsx
import React, { useState, useEffect, useMemo } from 'react'; // useRef 제거
import styles from './TraceTimeline.module.css';
import {
  MessageSquare,
  Loader,
  AlertTriangle,
  ArrowRightLeft,
  ChevronDown,
  ChevronRight,
  MessageCircle,
  Search,
  SlidersHorizontal,
  Download,
  GitBranch,
  ListTree
} from 'lucide-react';
import { fetchObservationsForTrace } from './TraceTimelineApi';

// ObservationNode 컴포넌트는 변경 없이 그대로 유지합니다.
const ObservationNode = ({ node, allNodes, level, onSelect, selectedId }) => {
  const [isOpen, setIsOpen] = useState(true);
  const children = useMemo(() => allNodes.filter(n => n.parentObservationId === node.id), [allNodes, node.id]);

  const getIcon = (type) => {
    switch (type) {
      case 'SPAN':
        return <ArrowRightLeft size={16} className={styles.spanIcon} />;
      case 'GENERATION':
        return <GitBranch size={16} className={styles.generationIcon} />;
      default:
        return <MessageSquare size={16} />;
    }
  };

  const hasChildren = children.length > 0;

  return (
    <li className={styles.nodeContainer}>
      <div
        className={`${styles.timelineItem} ${selectedId === node.id ? styles.selected : ''}`}
        style={{ paddingLeft: `${level * 24}px` }}
        onClick={() => onSelect(node.id)}
      >
        <div className={styles.itemIcon}>
          {hasChildren ? (
            <div onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} className={styles.chevron}>
              {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
          ) : <div className={styles.chevronPlaceholder}></div>}
          {getIcon(node.type)}
        </div>

        <div className={styles.itemContent}>
          <div className={styles.itemHeader}>
            <span className={styles.itemName}>{node.name}</span>
            {node.latency && <span className={styles.latency}>{node.latency.toFixed(2)}s</span>}
          </div>
          {node.scores && node.scores.length > 0 && (
            <div className={styles.scoreTags}>
              {node.scores.map(score => (
                <span key={score.name} className={styles.scoreTag}>
                  {score.name}: {score.value.toFixed(2)} <MessageCircle size={12} />
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      {isOpen && hasChildren && (
        <ul className={styles.nodeChildren}>
          {children.map(child => (
            <ObservationNode
              key={child.id}
              node={child}
              allNodes={allNodes}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
};


// 메인 컴포넌트
const TraceTimeline = ({ details, onObservationSelect }) => {
  const [observations, setObservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedObservationId, setSelectedObservationId] = useState(null);
  const [isTimelineVisible, setIsTimelineVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState(''); // 검색어 상태만 유지

  // 검색 로직: 모든 텍스트 필드를 대상으로 검색
  const filteredObservations = useMemo(() => {
      const query = searchQuery.trim().toLowerCase();
      if (!query) {
          return observations;
      }
      return observations.filter(obs =>
          JSON.stringify(obs).toLowerCase().includes(query)
      );
  }, [searchQuery, observations]);


  const processObservations = (fetchedObservations) => {
    return fetchedObservations.map(obs => ({
      ...obs,
      scores: obs.scores || [],
      latency: obs.endTime && obs.startTime ? (new Date(obs.endTime).getTime() - new Date(obs.startTime).getTime()) / 1000 : null
    }));
  };

  const rootObservations = useMemo(() =>
    filteredObservations.filter(obs => !obs.parentObservationId), // 필터링된 데이터 사용
    [filteredObservations]
  );

  useEffect(() => {
    if (!details?.id) {
      setIsLoading(false);
      return;
    }

    const loadObservations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const fetchedObservations = await fetchObservationsForTrace(details.id);
        const processedData = processObservations(fetchedObservations);

        processedData.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

        setObservations(processedData);
        setSelectedObservationId(null);
        onObservationSelect(null);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    };

    loadObservations();
  }, [details, onObservationSelect]);

  const handleSelect = (id) => {
    setSelectedObservationId(id);
    onObservationSelect(id);
  };

  const renderContent = () => {
    // isLoading 상태이거나 details 데이터가 아직 없을 때 로딩 화면을 표시합니다.
    if (isLoading || !details) {
      return (
        <div className={styles.status}>
          <Loader size={16} className={styles.loaderIcon} />
          <span>Loading timeline...</span>
        </div>
      );
    }
    if (error) {
      return (
        <div className={`${styles.status} ${styles.error}`}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      );
    }
    return (
      <ul className={styles.timelineList}>
        {/* Trace 자체를 루트 노드로 렌더링 */}
        <li className={styles.nodeContainer}>
           <div
              className={`${styles.timelineItem} ${selectedObservationId === null ? styles.selected : ''}`}
              onClick={() => handleSelect(null)}
            >
              <div className={styles.itemIcon}>
                <div className={styles.chevronPlaceholder}></div>
                <ListTree size={16} />
              </div>
              <div className={styles.itemContent}>
                <div className={styles.itemHeader}>
                  <span className={styles.itemName}>{details?.name ?? 'Trace'}</span>
                  {/* ▼▼▼ 이 부분 수정 ▼▼▼ */}
                  {details?.latency && <span className={styles.latency}>{details.latency.toFixed(2)}s</span>}
                </div>
                {/* ▼▼▼ 이 부분 수정 ▼▼▼ */}
                {details?.scores && details.scores.length > 0 && (
                  <div className={styles.scoreTags}>
                    {details.scores.map(score => (
                      <span key={score.name} className={styles.scoreTag}>
                        {score.name}: {score.value.toFixed(2)} <MessageCircle size={12} />
                      </span>
                    ))}
                  </div>
                )}
              </div>
          </div>
          <ul className={styles.nodeChildren}>
            {rootObservations.map((obs) => (
              <ObservationNode
                key={obs.id}
                node={obs}
                allNodes={filteredObservations} // 필터링된 데이터 사용
                level={1}
                selectedId={selectedObservationId}
                onSelect={handleSelect}
              />
            ))}
          </ul>
        </li>
      </ul>
    );
  };

  return (
    <div className={styles.timelineContainer}>
      <div className={styles.header}>
        <div className={styles.searchBar}>
          <Search size={14} />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className={styles.headerControls}>
          <button className={styles.controlButton}><SlidersHorizontal size={14} /></button>
          <button className={styles.controlButton}><Download size={14} /></button>
        </div>
        <div className={styles.headerToggle}>
          <input
            type="checkbox"
            id="timelineToggle"
            className={styles.toggleSwitch}
            checked={isTimelineVisible}
            onChange={() => setIsTimelineVisible(!isTimelineVisible)}
          />
          <label htmlFor="timelineToggle" className={styles.toggleLabel}></label>
          <span>Timeline</span>
        </div>
      </div>
      {renderContent()}
    </div>
  );
};

export default TraceTimeline;