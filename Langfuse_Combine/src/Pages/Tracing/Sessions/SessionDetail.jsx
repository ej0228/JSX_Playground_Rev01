// src/pages/Tracing/Sessions/SessionDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styles from './SessionDetail.module.css';
import { Star } from 'lucide-react';
import { fetchSessionDetails } from './SessionDetailApi';

// 메타데이터의 특정 키-값 쌍을 렌더링하는 헬퍼 컴포넌트
const MetaDataItem = ({ label, value }) => {
    if (!value) return null;
    return (
        <div className={styles.metaItem}>
            <span className={styles.metaLabel}>{label}:</span>
            <span className={styles.metaValue}>{Array.isArray(value) ? value.join(', ') : value}</span>
        </div>
    );
};


const TraceCard = ({ trace, viewMode, setViewMode }) => {
    const statusClass = trace.status === 'positive' ? styles.positiveBar : styles.neutralBar;

    const renderContent = () => {
        const hasInput = trace.input && typeof trace.input === 'object' && !Array.isArray(trace.input) && Object.keys(trace.input).length > 0;
        
        const inputJson = JSON.stringify(trace.input, null, 2);
        const outputJson = JSON.stringify({ output: trace.output }, null, 2);

        if (viewMode === 'JSON') {
            return (
                <>
                    <div className={styles.contentBox}>
                        <h4>Input</h4>
                        <pre>{inputJson}</pre>
                    </div>
                    <div className={styles.contentBox}>
                        <h4>Output</h4>
                        <pre>{outputJson}</pre>
                    </div>
                </>
            );
        }

        return (
            <>
                <div className={styles.contentBox}>
                    <h4>Input</h4>
                    <pre>{hasInput ? inputJson : 'No Input'}</pre>
                </div>
                <div className={styles.contentBox}>
                    <h4>Output</h4>
                    <p className={styles.outputText}>
                       {trace.output}
                    </p>
                </div>
            </>
        );
    };

    return (
        <div className={styles.traceCard}>
            <div className={`${styles.summaryBar} ${statusClass}`}>
                <p className={styles.summaryText}>{trace.summary}</p>
                {/* Scores가 없으므로 해당 부분은 렌더링하지 않음 */}
            </div>

            <div className={styles.traceBody}>
                <div className={styles.ioSection}>
                    <div className={styles.ioTabs}>
                        <button 
                          className={`${styles.ioTab} ${viewMode === 'Formatted' ? styles.active : ''}`}
                          onClick={() => setViewMode('Formatted')}
                        >
                          Formatted
                        </button>
                        <button 
                          className={`${styles.ioTab} ${viewMode === 'JSON' ? styles.active : ''}`}
                          onClick={() => setViewMode('JSON')}
                        >
                          JSON
                        </button>
                    </div>
                    {renderContent()}
                </div>
                {/* ▼▼▼ metadataSection을 스키마에 맞춰 수정합니다. ▼▼▼ */}
                <div className={styles.metadataSection}>
                    <div className={styles.metaHeader}>
                        <span>Trace: {trace.id}</span>
                        <span>{trace.timestamp.toLocaleString()}</span>
                    </div>
                     <div className={styles.metaGrid}>
                        <h4 className={styles.metaTitle}>Details</h4>
                        <MetaDataItem label="User ID" value={trace.userId} />
                        <MetaDataItem label="Tags" value={trace.tags} />
                        <MetaDataItem label="Version" value={trace.version} />
                        <MetaDataItem label="Release" value={trace.release} />
                        <MetaDataItem label="Environment" value={trace.environment} />
                        <MetaDataItem label="Public" value={trace.public?.toString()} />

                        {trace.metadata && Object.keys(trace.metadata).length > 0 && (
                            <>
                                <h4 className={styles.metaTitle} style={{marginTop: '16px'}}>Metadata</h4>
                                {Object.entries(trace.metadata).map(([key, value]) => (
                                    <MetaDataItem key={key} label={key} value={JSON.stringify(value)} />
                                ))}
                            </>
                        )}
                    </div>
                </div>
                {/* ▲▲▲ metadataSection 수정 완료 ▲▲▲ */}
            </div>
        </div>
    );
};

const SessionDetail = () => {
    const { sessionId } = useParams();
    const [session, setSession] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('Formatted');

    useEffect(() => {
        if (!sessionId) return;
        
        const loadSessionDetails = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await fetchSessionDetails(sessionId);
                setSession(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "An unknown error occurred.");
            } finally {
                setIsLoading(false);
            }
        };

        loadSessionDetails();
    }, [sessionId]);

    if (isLoading) {
        return <div className={styles.container}>Loading session details...</div>;
    }
    if (error) {
        return <div className={styles.container} style={{ color: 'red' }}>Error: {error}</div>;
    }
    if (!session) {
        return <div className={styles.container}>Session not found.</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.sessionId}>Session {session.id}</h1>
                <div className={styles.headerActions}>
                    <Star size={18} className={styles.starIcon} />
                    <button className={styles.actionButton}>Annotate</button>
                </div>
            </div>
            
            <div className={styles.timeline}>
                {session.traces.map(trace => (
                    <TraceCard 
                      key={trace.id} 
                      trace={trace} 
                      viewMode={viewMode}
                      setViewMode={setViewMode}
                    />
                ))}
            </div>
        </div>
    );
};

export default SessionDetail;