// src/Pages/Tracing/TraceDetailView.jsx
import React, { useState } from 'react';
import ReactDOM from 'react-dom'; // ReactDOM을 import 합니다.
import styles from './TraceDetailView.module.css';
import { Copy, List, Clipboard, Plus, SquarePen, ChevronDown, MessageSquare, Info } from 'lucide-react';
import Toast from '../../components/Toast/Toast';
import SidePanel from '../../components/SidePanel/SidePanel';
import Comments from '../../components/Comments/Comments';
import AddToDatasetModal from '../../components/AddToDatasetModal/AddToDatasetModal';
import { useComments } from '../../hooks/useComments';
import UsageBreakdown from './UsageBreakdown';

// FormattedTable 컴포넌트 (변경 없음)
const FormattedTable = ({ data }) => {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return <pre>{data}</pre>;
  }
  const entries = Object.entries(data);
  if (entries.length === 0) {
    return <p className={styles.noDataText}>Empty object</p>;
  }
  return (
    <table className={styles.formattedTable}>
      <thead>
        <tr>
          <th>Path</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        {entries.map(([key, value]) => (
          <tr key={key}>
            <td className={styles.pathCell}>{key}</td>
            <td className={styles.valueCell}>
              {typeof value === 'string' ? `"${value}"` : String(value)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// 메인 TraceDetailView 컴포넌트
const TraceDetailView = ({ details, isLoading, error }) => {
  const [viewFormat, setViewFormat] = useState('Formatted');
  const [toastInfo, setToastInfo] = useState({ isVisible: false, message: '' });
  const [isDatasetModalOpen, setIsDatasetModalOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  
  // 툴팁 관련 상태는 그대로 유지
  const [usageTooltip, setUsageTooltip] = useState({ visible: false, style: {}, data: null });
  // usagePillRef는 더 이상 필요 없으므로 삭제합니다.

  const isObservation = details && 'type' in details && 'traceId' in details;
  const objectType = isObservation ? 'OBSERVATION' : 'TRACE';
  const projectId = details?.projectId;
  
  const {
    comments,
    isLoading: isCommentsLoading,
    error: commentsError,
    addComment,
    removeComment,
  } = useComments(projectId, objectType, details?.id);

  const handleAddComment = async (content) => {
    const result = await addComment(content);
    if (result.success) {
      setToastInfo({ isVisible: true, message: '댓글이 추가되었습니다.' });
    } else {
      alert(`오류: ${result.error}`);
    }
    return result;
  };

  const handleDeleteComment = async (commentId) => {
    const result = await removeComment(commentId);
    if (result.success) {
      setToastInfo({ isVisible: true, message: '댓글이 삭제되었습니다.' });
    } else {
      alert(`오류: ${result.error}`);
    }
    return result;
  };

  const handleCopy = (text, type) => {
    const textToCopy = typeof text === 'object' ? JSON.stringify(text, null, 2) : String(text);
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setToastInfo({ isVisible: true, message: `${type}이(가) 클립보드에 복사되었습니다.` });
      })
      .catch(err => {
        console.error("복사에 실패했습니다.", err);
        setToastInfo({ isVisible: true, message: '복사에 실패했습니다.' });
      });
  };

  // --- 툴팁 표시 핸들러 수정 ---
  const handleUsageMouseEnter = (event, usageData) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setUsageTooltip({
      visible: true,
      style: {
        // 버튼의 아래쪽(bottom)을 기준으로 top 위치 설정 + 약간의 여백(8px)
        top: `${rect.bottom + 8}px`, 
        // 버튼의 가로 중앙에 위치하도록 left와 transform 설정
        left: `${rect.left + rect.width / 2}px`,
        transform: 'translateX(-50%)',
        opacity: 1,
      },
      data: usageData,
    });
  };


  // --- 툴팁 숨김 핸들러 수정 ---
  const handleUsageMouseLeave = () => {
    setUsageTooltip(prev => ({ ...prev, visible: false, style: { ...prev.style, opacity: 0 } }));
  };

  const renderFormattedContent = (data) => {
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      return <FormattedTable data={data} />;
    }
    return <pre>{String(data ?? 'null')}</pre>;
  };

  const renderContent = (title, data, type = 'default') => {
    const cardStyle = type === 'output' ? styles.outputCard : '';
    return (
      <div className={`${styles.contentCard} ${cardStyle}`}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>{title}</h3>
          <button className={styles.copyButton} onClick={() => handleCopy(data, title)} title="Copy content">
            <Copy size={14} />
          </button>
        </div>
        <div className={styles.cardBody}>
          {viewFormat === 'JSON'
            ? <pre>{JSON.stringify(data, null, 2)}</pre>
            : renderFormattedContent(data)
          }
        </div>
      </div>
    );
  };

  if (isLoading) return <div className={styles.body}>Loading details...</div>;
  if (error) return <div className={styles.body} style={{ color: 'red' }}>{error}</div>;
  if (!details) return <div className={styles.body}>No details available.</div>;

  const metadata = details.metadata ?? {};
  const name = details.name ?? 'N/A';
  const id = details.id;

  const formatTimestamp = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toISOString().replace('T', ' ').substring(0, 23);
  };

  const formatUsage = (usage) => {
    if (!usage || (usage.input == null && usage.output == null)) return null;
    const input = usage.input ?? 0;
    const output = usage.output ?? 0;
    const total = usage.total ?? (input + output);
    return `${input} → ${output} (∑ ${total})`;
  };

  return (
    <div className={styles.body}>
      <Toast
        message={toastInfo.message}
        isVisible={toastInfo.isVisible}
        onClose={() => setToastInfo({ isVisible: false, message: '' })}
      />

      {/* ▼▼▼ 툴팁을 Portal을 사용해 렌더링하도록 수정 ▼▼▼ */}
      {usageTooltip.visible && ReactDOM.createPortal(
        <UsageBreakdown usage={usageTooltip.data} style={usageTooltip.style} />,
        document.body
      )}
      
      <div className={styles.infoBar}>
        <div className={styles.infoBarTop}>
          <div className={styles.infoBarTitle}>
            <List size={20} />
            <h2 className={styles.traceName}>{name}</h2>
            <button
              className={styles.idButton}
              title="Copy ID"
              onClick={() => handleCopy(id, 'ID')}
            >
              <Clipboard size={12} /> ID
            </button>
          </div>
          <div className={styles.infoBarActions}>
            {isObservation ? (
                <div className={styles.annotateButton}>
                    <button>Playground</button>
                    <div className={styles.annotateButtonChevron}>
                        <ChevronDown size={16} />
                    </div>
                </div>
            ) : (
                <button
                  className={styles.actionButton}
                  onClick={() => setIsDatasetModalOpen(true)}
                >
                    <Plus size={14} /> Add to datasets
                </button>
            )}
            <button
              className={`${styles.iconButton} ${styles.actionButtonSecondary}`}
              onClick={() => setIsCommentsOpen(true)}
            >
              <MessageSquare size={16} />
            </button>
          </div>
        </div>
        <div className={styles.infoBarBottom}>
          <span className={styles.timestamp}>
            {formatTimestamp(isObservation ? details.startTime : details.timestamp)}
          </span>
          {isObservation ? (
            <>
              <div className={styles.pills}>
                {details.latency != null && (
                  <div className={`${styles.pill} ${styles.pillDark}`}>
                    Latency: {details.latency.toFixed(2)}s
                  </div>
                )}
                <div className={`${styles.pill} ${styles.pillDark}`}>
                  Env: {details.environment ?? 'default'}
                </div>
              </div>
              
              <div className={styles.costBar}>
                {details.totalPrice != null && (
                  <div className={styles.costPill}>
                    ${details.totalPrice.toFixed(6)}
                    <Info size={14} className={styles.infoIcon} />
                  </div>
                )}
                {/* ▼▼▼ onMouseEnter 핸들러에 event 객체(e) 전달 ▼▼▼ */}
                {details.usage && formatUsage(details.usage) && (
                  <div 
                    className={styles.costPill}
                    onMouseEnter={(e) => handleUsageMouseEnter(e, details.usage)}
                    onMouseLeave={handleUsageMouseLeave}
                  >
                    {formatUsage(details.usage)}
                    <Info size={14} className={styles.infoIcon} />
                  </div>
                )}
              </div>
              
              <div className={styles.pills}>
                {details.model && (
                  <div className={`${styles.pill} ${styles.pillDark}`}>{details.model}</div>
                )}
                {details.modelParameters && Object.entries(details.modelParameters).map(([key, value]) => (
                  <div key={key} className={`${styles.pill} ${styles.pillDark}`}>
                    {key}: {String(value)}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className={styles.pills}>
                {details.sessionId && (
                  <div className={`${styles.pill} ${styles.pillDark}`}>
                    Session: {details.sessionId}
                  </div>
                )}
                {details.userId && (
                  <div className={`${styles.pill} ${styles.pillUser}`}>
                    User ID: {details.userId}
                  </div>
                )}
                <div className={`${styles.pill} ${styles.pillDark}`}>
                  Env: {details.environment ?? 'default'}
                </div>
                {details.latency != null && (
                  <div className={`${styles.pill} ${styles.pillDark}`}>
                    Latency: {details.latency.toFixed(2)}s
                  </div>
                )}
              </div>
              <div className={styles.costBar}>
                {details.cost != null && (
                  <div className={styles.costPill}>
                    Total Cost: ${details.cost.toFixed(6)}
                    <Info size={14} className={styles.infoIcon} />
                  </div>
                )}
                {/* ▼▼▼ onMouseEnter 핸들러에 event 객체(e) 전달 ▼▼▼ */}
                {details.usage && formatUsage(details.usage) && (
                  <div
                    className={styles.costPill}
                    onMouseEnter={(e) => handleUsageMouseEnter(e, details.usage)}
                    onMouseLeave={handleUsageMouseLeave}
                  >
                    {formatUsage(details.usage)}
                    <Info size={14} className={styles.infoIcon} />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className={styles.formatToggle}>
        <button
          className={`${styles.toggleButton} ${viewFormat === 'Formatted' ? styles.active : ''}`}
          onClick={() => setViewFormat('Formatted')}
        >
          Formatted
        </button>
        <button
          className={`${styles.toggleButton} ${viewFormat === 'JSON' ? styles.active : ''}`}
          onClick={() => setViewFormat('JSON')}
        >
          JSON
        </button>
      </div>

      {renderContent("Input", details.input, 'input')}
      {renderContent("Output", details.output, 'output')}
      {isObservation && details.modelParameters && renderContent("Model Parameters", details.modelParameters)}
      <div className={styles.contentCard}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Metadata</h3>
        </div>
        <div className={styles.cardBody}>
          {Object.keys(metadata).length > 0
            ? (viewFormat === 'JSON'
              ? <pre>{JSON.stringify(metadata, null, 2)}</pre>
              : <FormattedTable data={metadata} />)
            : <p className={styles.noDataText}>No metadata available.</p>
          }
        </div>
      </div>

      <SidePanel
        title="Comments"
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
      >
        <Comments
          comments={comments}
          isLoading={isCommentsLoading}
          error={commentsError}
          onAddComment={handleAddComment}
          onDeleteComment={handleDeleteComment}
        />
      </SidePanel>

      <AddToDatasetModal
        isOpen={isDatasetModalOpen}
        onClose={() => setIsDatasetModalOpen(false)}
        input={details?.input}
        output={details?.output}
        metadata={details?.metadata}
      />
    </div>
  );
};

export default TraceDetailView;