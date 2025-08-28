// src/Pages/Tracing/TraceDetailPanel.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Maximize, Minimize, HardDrive } from 'lucide-react';
import { fetchTraceDetails } from './TraceDetailApi';
import { fetchObservationDetails } from './ObservationDetailApi';
import styles from './TraceDetailPanel.module.css';
import TraceDetailView from './TraceDetailView';
import TraceTimeline from './TraceTimeline';

const TraceDetailPanel = ({ trace, onClose }) => {
  const [traceDetails, setTraceDetails] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [selectedObservationId, setSelectedObservationId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const panelRef = useRef(null);

  // Trace 기본 정보 로드 (변경 없음)
  useEffect(() => {
    if (!trace.id) return;
    const loadTrace = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const details = await fetchTraceDetails(trace.id);
        setTraceDetails(details);
        setViewData(details);
      } catch (err) {
        setError("Trace 상세 정보를 불러오는 데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };
    loadTrace();
  }, [trace.id]);

  // Observation 상세 정보 로드 (변경 없음)
  useEffect(() => {
    const loadObservation = async () => {
      if (!selectedObservationId) {
        setViewData(traceDetails);
        return;
      }
      setIsLoading(true);
      try {
        const obsDetails = await fetchObservationDetails(selectedObservationId);
        setViewData(obsDetails);
      } catch (err) {
        setError("Observation 상세 정보를 불러오는 데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };
    loadObservation();
  }, [selectedObservationId, traceDetails]);
  
  const handleObservationSelect = useCallback((observationId) => {
    setSelectedObservationId(observationId);
  }, []);

  // ✅ 외부 클릭 감지 로직 수정
  useEffect(() => {
    const handleClickOutside = (event) => {
      // 1. 패널 DOM 요소가 존재하고,
      // 2. 클릭된 지점이 패널 내부에 있지 않으며,
      // 3. 클릭된 지점이 다른 모달이나 패널의 일부가 아닌 경우에만 닫기
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target) &&
        !event.target.closest('[data-is-portal]') // data-is-portal 속성을 가진 부모가 없는 경우
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div ref={panelRef} className={`${styles.panel} ${isMaximized ? styles.maximized : ''}`}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.tracePill}>
            <HardDrive size={14} />
            <span>Trace</span>
          </div>
          <span className={styles.traceId}>{trace.id}</span>
        </div>
        <div className={styles.headerRight}>
          <button 
            className={styles.iconButton} 
            onClick={() => setIsMaximized(!isMaximized)} 
            title={isMaximized ? "Minimize" : "Maximize"}
          >
            {isMaximized ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
          <button className={styles.iconButton} onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>
      </div>
      <div className={styles.panelBody}>
        <div className={styles.timelineSection}>
          <TraceTimeline details={traceDetails} onObservationSelect={handleObservationSelect} />
        </div>
        <div className={styles.detailSection}>
          <TraceDetailView details={viewData} isLoading={isLoading} error={error} />
        </div>
      </div>
    </div>
  );
};

export default TraceDetailPanel;