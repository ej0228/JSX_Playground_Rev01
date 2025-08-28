import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Eye } from 'lucide-react';
import formStyles from '../layout/Form.module.css';
import styles from '../layout/NewLLMConnectionForm.module.css'; // 스타일은 기존 폼과 공유

const UpdateLLMConnectionForm = ({ existingConnection, onClose, onSave }) => {
    // 폼 상태 초기화
    const [provider, setProvider] = useState('');
    const [adapter, setAdapter] = useState('');
    const [apiKey, setApiKey] = useState(''); // 새 API 키를 입력받는 상태
    const [apiKeyPlaceholder, setApiKeyPlaceholder] = useState('');
    const [showApiKey, setShowApiKey] = useState(false);

    // 고급 설정 상태
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [baseUrl, setBaseUrl] = useState('');
    const [extraHeaders, setExtraHeaders] = useState([]);
    const [enableDefaultModels, setEnableDefaultModels] = useState(true);
    const [customModels, setCustomModels] = useState([]);

    // --- 데이터 불러오기 ---
    // 컴포넌트가 처음 렌더링될 때 기존 연결 정보로 상태를 설정
    useEffect(() => {
        if (existingConnection) {
            setProvider(existingConnection.provider);
            setAdapter(existingConnection.adapter);
            setBaseUrl(existingConnection.baseUrl || '');
            setEnableDefaultModels(existingConnection.enableDefaultModels ?? true);

            // Placeholder 설정 (예: "•••••••••ttt")
            setApiKeyPlaceholder(`•••••••••${existingConnection.apiKeyLastChars || ''}`);

            // 객체를 UI에서 사용하는 배열 형태로 변환
            const headersArray = Object.entries(existingConnection.extraHeaders || {}).map(([key, value]) => ({ id: crypto.randomUUID(), key, value }));
            setExtraHeaders(headersArray);

            const modelsArray = (existingConnection.customModels || []).map(name => ({ id: crypto.randomUUID(), name }));
            setCustomModels(modelsArray);

            // 고급 설정 값이 하나라도 있으면 섹션을 열어줌
            if (existingConnection.baseUrl || headersArray.length > 0 || modelsArray.length > 0) {
                setShowAdvanced(true);
            }
        }
    }, [existingConnection]);


    // --- 핸들러 함수들 --- (기존과 거의 동일)

    const handleSubmit = (event) => {
        event.preventDefault();

        // '새 연결' 폼처럼 모든 데이터를 포함해서 서버로 전송
        const connectionData = {
            adapter,
            provider,
            baseUrl: baseUrl || undefined,
            enableDefaultModels,
            extraHeaders: extraHeaders
                .filter(h => h.key && h.value)
                .reduce((acc, curr) => ({...acc, [curr.key]: curr.value}), {}),
            customModels: customModels
                .filter(m => m.name)
                .map(m => m.name),
        };

        // 단, 새 API 키를 입력했을 때만 apiKey 필드를 추가
        if (apiKey) {
            connectionData.apiKey = apiKey;
        }

        onSave(connectionData);
    };

    // Extra Headers, Custom Models 핸들러는 NewLLMConnectionForm과 동일하게 사용
    // ... (addHeader, removeHeader, addCustomModel 등)
    const handleHeaderChange = (id, field, value) => {
        setExtraHeaders(extraHeaders.map(item => item.id === id ? { ...item, [field]: value } : item));
    };
    const addHeader = () => {
        setExtraHeaders(prev => [...prev, { id: crypto.randomUUID(), key: '', value: '' }]);
    };
    const removeHeader = (id) => {
        setExtraHeaders(extraHeaders.filter(item => item.id !== id));
    };
    const handleCustomModelChange = (id, value) => {
        setCustomModels(customModels.map(item => item.id === id ? { ...item, name: value } : item));
    };
    const addCustomModel = () => {
        setCustomModels(prev => [...prev, { id: crypto.randomUUID(), name: '' }]);
    };
    const removeCustomModel = (id) => {
        setCustomModels(customModels.filter(item => item.id !== id));
    };


    return (
        <div className={formStyles.formContainer}>
            <form onSubmit={handleSubmit}>
                <div className={formStyles.formBody}>
                    {/* LLM adapter (disabled) */}
                    <div className={formStyles.formGroup}>
                        <label htmlFor="llmAdapter" className={formStyles.formLabel}>LLM adapter</label>
                        <select
                            id="llmAdapter"
                            value={adapter}
                            className={formStyles.formSelect}
                            disabled // 수정 불가
                        >
                            <option value={adapter}>{adapter}</option>
                        </select>
                    </div>

                    {/* Provider name (disabled) */}
                    <div className={formStyles.formGroup}>
                        <label htmlFor="providerName" className={formStyles.formLabel}>Provider name</label>
                        <input
                            type="text"
                            id="providerName"
                            value={provider}
                            className={formStyles.formInput}
                            disabled // 수정 불가
                        />
                    </div>

                    {/* API Key (placeholder) */}
                    <div className={formStyles.formGroup}>
                        <label htmlFor="apiKey" className={formStyles.formLabel}>API Key</label>
                        <p className={formStyles.description}>Your API keys are stored encrypted in your database.</p>
                        <div className={styles.inputWithIcon}>
                            <input
                                type={showApiKey ? "text" : "password"}
                                id="apiKey"
                                value={apiKey} // 항상 비어있고, 새 키 입력용
                                onChange={(e) => setApiKey(e.target.value)}
                                className={formStyles.formInput}
                                placeholder={apiKeyPlaceholder} // 기존 키 정보 표시
                            />
                            <button type="button" onClick={() => setShowApiKey(!showApiKey)} className={styles.iconButton}>
                                <Eye size={16} />
                            </button>
                        </div>
                    </div>

                    {/* 고급 설정 및 나머지 부분은 NewLLMConnectionForm과 동일 */}
                    <div className={styles.advancedToggle} onClick={() => setShowAdvanced(!showAdvanced)}>
                        {showAdvanced ? 'Hide advanced settings ▲' : 'Show advanced settings ▼'}
                    </div>
                    {/* --- 고급 설정 섹션 --- */}
                    {showAdvanced && (
                        <div className={styles.advancedSection}>
                            {/* API Base URL */}
                            <div className={formStyles.formGroup}>
                                <label htmlFor="baseUrl" className={formStyles.formLabel}>API Base URL</label>
                                <p className={formStyles.description}>Leave blank to use the default base URL for the given LLM adapter. OpenAI default: https://api.openai.com/v1</p>
                                <input
                                    type="text"
                                    id="baseUrl"
                                    value={baseUrl}
                                    onChange={(e) => setBaseUrl(e.target.value)}
                                    className={formStyles.formInput}
                                    placeholder="default" /* GIF에 맞춰 placeholder 수정 */
                                />
                            </div>

                            {/* Extra Headers */}
                            <div className={formStyles.formGroup}>
                                <label className={formStyles.formLabel}>Extra Headers</label>
                                <p className={formStyles.description}>Optional additional HTTP headers to include with requests towards LLM provider. All header values stored encrypted in your database.</p>
                                {extraHeaders.map(header => (
                                    <div key={header.id} className={styles.listItem}>
                                        <input type="text" placeholder="Header" value={header.key} onChange={e => handleHeaderChange(header.id, 'key', e.target.value)} className={`${formStyles.formInput} ${styles.listInput}`} />
                                        <input type="text" placeholder="Value" value={header.value} onChange={e => handleHeaderChange(header.id, 'value', e.target.value)} className={`${formStyles.formInput} ${styles.listInput}`} />
                                        <button type="button" onClick={() => removeHeader(header.id)} className={styles.deleteButton}><Trash2 size={16} /></button>
                                    </div>
                                ))}
                                <button type="button" onClick={addHeader} className={styles.addButton}><Plus size={16} /> Add Header</button>
                            </div>

                            {/* Enable default models */}
                            <div className={`${formStyles.formGroup} ${styles.toggleGroup}`}>
                                <div>
                                    <label className={formStyles.formLabel}>Enable default models</label>
                                    <p className={formStyles.description}>Default models for the selected adapter will be available in Langfuse features.</p>
                                </div>
                                <label className={styles.switch}>
                                    <input
                                        type="checkbox"
                                        checked={enableDefaultModels}
                                        onChange={(e) => setEnableDefaultModels(e.target.checked)}
                                    />
                                    <span className={styles.slider}></span>
                                </label>
                            </div>

                            {/* Custom models */}
                            <div className={formStyles.formGroup}>
                                <label className={formStyles.formLabel}>Custom models</label>
                                <p className={formStyles.description}>Custom model names accepted by given endpoint.</p>
                                {customModels.map(model => (
                                    <div key={model.id} className={styles.listItem}>
                                        <input type="text" placeholder="Model name" value={model.name} onChange={e => handleCustomModelChange(model.id, e.target.value)} className={`${formStyles.formInput} ${styles.listInputFull}`} />
                                        <button type="button" onClick={() => removeCustomModel(model.id)} className={styles.deleteButton}><Trash2 size={16} /></button>
                                    </div>
                                ))}
                                <button type="button" onClick={addCustomModel} className={styles.addButton}><Plus size={16} /> Add custom model name</button>
                            </div>
                        </div>
                    )}
                </div>

                <footer className={formStyles.formFooter}>
                    <button type="submit" className={styles.createButton}>
                        Update connection
                    </button>
                </footer>
            </form>
        </div>
    );
};

export default UpdateLLMConnectionForm;