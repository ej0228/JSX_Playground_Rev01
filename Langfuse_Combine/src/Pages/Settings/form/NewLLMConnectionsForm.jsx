import React, { useState } from 'react';
import { Plus, Trash2, Eye } from 'lucide-react';
import formStyles from '../layout/Form.module.css'; // 공통 스타일
import styles from '../layout/NewLLMConnectionForm.module.css'; // 전용 스타일

const NewLLMConnectionForm = ({ onClose, onSave }) => {
    // 기본 설정 상태
    const [provider, setProvider] = useState('');
    const [adapter, setAdapter] = useState('openai');
    const [apiKey, setApiKey] = useState('');
    const [showApiKey, setShowApiKey] = useState(false);

    // 고급 설정 상태
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [baseUrl, setBaseUrl] = useState('');
    const [extraHeaders, setExtraHeaders] = useState([]);
    const [enableDefaultModels, setEnableDefaultModels] = useState(true);
    const [customModels, setCustomModels] = useState([]);

    // --- 핸들러 함수들 ---

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!provider || !apiKey) {
            alert('Provider name과 API Key는 필수 항목입니다.');
            return;
        }

        const connectionData = {
            adapter,
            provider,
            apiKey,
        };

        if (showAdvanced) {
            connectionData.baseUrl = baseUrl || undefined;
            connectionData.enableDefaultModels = enableDefaultModels;

            connectionData.extraHeaders = extraHeaders
                .filter(h => h.key && h.value)
                .reduce((acc, curr) => {
                    acc[curr.key] = curr.value;
                    return acc;
                }, {});

            connectionData.customModels = customModels
                .filter(m => m.name)
                .map(m => m.name);
        }

        onSave(connectionData);
    };

    // Extra Headers 리스트 핸들러
    const handleHeaderChange = (id, field, value) => {
        setExtraHeaders(extraHeaders.map(item => item.id === id ? { ...item, [field]: value } : item));
    };
    const addHeader = () => {
        setExtraHeaders(prev => [...prev, { id: crypto.randomUUID(), key: '', value: '' }]);
    };
    const removeHeader = (id) => {
        setExtraHeaders(extraHeaders.filter(item => item.id !== id));
    };

    // Custom Models 리스트 핸들러
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
                    {/* Provider name */}
                    <div className={formStyles.formGroup}>
                        <label htmlFor="providerName" className={formStyles.formLabel}>Provider name</label>
                        <p className={formStyles.description}>Name to identify the key within Langfuse.</p>
                        <input
                            type="text"
                            id="providerName"
                            value={provider}
                            onChange={(e) => setProvider(e.target.value)}
                            className={formStyles.formInput}
                            placeholder="e.g. openai-production"
                            required
                        />
                    </div>

                    {/* LLM adapter */}
                    <div className={formStyles.formGroup}>
                        <label htmlFor="llmAdapter" className={formStyles.formLabel}>LLM adapter</label>
                        <p className={formStyles.description}>Schema that is accepted at that provider endpoint.</p>
                        <select
                            id="llmAdapter"
                            value={adapter}
                            onChange={(e) => setAdapter(e.g.et.value)}
                            className={formStyles.formSelect}
                        >
                            <option value="openai">openai</option>
                            <option value="anthropic">anthropic</option>
                            <option value="azure">azure</option>
                            <option value="bedrock">bedrock</option>
                            <option value="google-vertex-ai">google-vertex-ai</option>
                            <option value="google-ai-studio">google-ai-studio</option>
                            <option value="custom">custom</option>
                        </select>
                    </div>

                    {/* API Key */}
                    <div className={formStyles.formGroup}>
                        <label htmlFor="apiKey" className={formStyles.formLabel}>API Key</label>
                        <p className={formStyles.description}>Your API keys are stored encrypted in your database.</p>
                        <div className={styles.inputWithIcon}>
                            <input
                                type={showApiKey ? "text" : "password"}
                                id="apiKey"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className={formStyles.formInput}
                                required
                            />
                            <button type="button" onClick={() => setShowApiKey(!showApiKey)} className={styles.iconButton}>
                                <Eye size={16} />
                            </button>
                        </div>
                    </div>

                    {/* --- 고급 설정 토글 --- */}
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
                        Create connection
                    </button>
                </footer>
            </form>
        </div>
    );
};

export default NewLLMConnectionForm;