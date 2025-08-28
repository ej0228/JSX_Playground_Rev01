// PromptsNew.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styles from './PromptsNew.module.css';
import { Book } from 'lucide-react';
import PromptsReference from './PromptsReference.jsx';
import ChatBox from '../../components/ChatBox/ChatBox.jsx';
import LineNumberedTextarea from '../../components/LineNumberedTextarea/LineNumberedTextarea.jsx';
import FormPageLayout from '../../components/Layouts/FormPageLayout.jsx';
import FormGroup from '../../components/Form/FormGroup.jsx';
import { createPromptOrVersion } from './PromptsNewApi.js';

// LineNumberedTextarea needs to be wrapped with forwardRef to accept a ref.
// Make sure this change is applied in the actual component file.
const ForwardedLineNumberedTextarea = React.forwardRef((props, ref) => (
    <LineNumberedTextarea {...props} forwardedRef={ref} />
));


const PromptsNew = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const initialState = location.state || {};
    const [promptName, setPromptName] = useState(initialState.promptName || '');
    const [promptType, setPromptType] = useState(initialState.promptType || 'Chat');
    const [chatContent, setChatContent] = useState(initialState.chatContent || [
        { id: Date.now(), role: 'System', content: '' },
    ]);
    const [textContent, setTextContent] = useState(initialState.textContent || '');
    const [config, setConfig] = useState(initialState.config || '{\n  "temperature": 1\n}');
    const [labels, setLabels] = useState(initialState.labels || { production: true }); // Default to true for better UX
    const [commitMessage, setCommitMessage] = useState('');
    const [isReferenceModalOpen, setIsReferenceModalOpen] = useState(false);
    const [variables, setVariables] = useState([]);
    const isNewVersionMode = initialState.isNewVersion || false;
    const textPromptRef = useRef(null);


    useEffect(() => {
        const extractVariables = (text) => {
            const regex = /{{\s*(\w+)\s*}}/g;
            const matches = text.match(regex) || [];
            return matches.map(match => match.replace(/[{}]/g, '').trim());
        };

        let allVars = [];
        if (promptType === 'Text') {
            allVars = extractVariables(textContent);
        } else {
            const chatVars = chatContent.flatMap(msg => extractVariables(msg.content));
            allVars = [...chatVars];
        }

        setVariables([...new Set(allVars)]);
    }, [textContent, chatContent, promptType]);


    const handleLabelChange = (e) => {
        const { name, checked } = e.target;
        setLabels((prev) => ({ ...prev, [name]: checked }));
    };

    const handleInsertReference = (referenceTag) => {
        if (promptType === 'Text') {
            setTextContent((prev) => prev + referenceTag);
        } else {
            // Chat 모드일 경우, 태그를 클립보드에 복사하고 안내 메시지를 표시합니다.
            navigator.clipboard.writeText(referenceTag).then(() => {
                alert(`Reference tag copied to clipboard. Please paste it into the desired message.\n\nCopied: ${referenceTag}`);
            }).catch(err => {
                console.error("클립보드 복사 실패:", err);
                alert("클립보드 복사에 실패했습니다. 수동으로 복사해주세요.");
            });
        }
    };


    const handleSave = async () => {
        try {
            await createPromptOrVersion({
                promptName,
                promptType,
                chatContent,
                textContent,
                config,
                labels,
                commitMessage,
            });

            alert(`'${promptName}' prompt's new version has been saved successfully.`);
            navigate(`/prompts/${promptName}`);
        } catch (err) {
            console.error("Failed to save prompt:", err);
            if (err.response) {
                alert(`Failed to save prompt: ${err.response?.data?.message || err.message}`);
            } else {
                alert(`Failed to save prompt: ${String(err)}`);
            }
        }
    };

    const breadcrumbs = (
        <>
            <Book size={16} />
            <Link to="/prompts">Prompts</Link>
            <span>/</span>
            {isNewVersionMode ? (
                <>
                    <Link to={`/prompts/${promptName}`}>{promptName}</Link>
                    <span>/</span>
                    <span className="active">New Version</span>
                </>
            ) : (
                <span className="active">New prompt</span>
            )}
        </>
    );

    return (
        <FormPageLayout
            breadcrumbs={breadcrumbs}
            onSave={handleSave}
            onCancel={() => navigate(isNewVersionMode ? `/prompts/${promptName}` : '/prompts')}
            isSaveDisabled={!promptName.trim()}
        >
            <FormGroup
                htmlFor="prompt-name"
                label="Name"
                subLabel="Unique identifier for this prompt."
            >
                <input
                    id="prompt-name"
                    type="text"
                    className="form-input"
                    placeholder="e.g. summarize-short-text"
                    value={promptName}
                    onChange={(e) => setPromptName(e.target.value)}
                    disabled={isNewVersionMode}
                />
            </FormGroup>

            <FormGroup
                htmlFor="prompt-content"
                label="Prompt"
                subLabel="Define your prompt template."
            >
                <div className={styles.promptHeader}>
                    <div className={styles.typeSelector}>
                        <button className={`${styles.typeButton} ${promptType === 'Chat' ? styles.active : ''}`} onClick={() => setPromptType('Chat')}>Chat</button>
                        <button className={`${styles.typeButton} ${promptType === 'Text' ? styles.active : ''}`} onClick={() => setPromptType('Text')}>Text</button>
                    </div>
                    {/* This button was misplaced in the original code. It should be outside the textarea. */}
                    <button className={styles.addReferenceButton} onClick={() => setIsReferenceModalOpen(true)}>
                        + Add prompt reference
                    </button>
                </div>
                {promptType === 'Text' ? (
                    <ForwardedLineNumberedTextarea
                        id="prompt-content"
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        placeholder='Enter your text prompt here, e.g. "Summarize this: {{text}}"'
                        minHeight={200}
                        ref={textPromptRef} // Pass ref here
                    />
                ) : (
                    <ChatBox //프롬프트팀
                        value={chatContent}
                        onChange={setChatContent}
                        schema="rolePlaceholder"
                        autoInit={true}
                    />
                )}
                {variables.length > 0 && (
                    <div className={styles.variablesContainer}>
                        <span className={styles.variablesLabel}>VARIABLES:</span>
                        {variables.map((variable, index) => (
                            <span key={index} className={styles.variableTag}>
                                {variable}
                            </span>
                        ))}
                    </div>
                )}
            </FormGroup>

            <FormGroup
                htmlFor="prompt-config"
                label="Config"
                subLabel="Arbitrary JSON configuration that is available on the prompt."
            >
                <LineNumberedTextarea id="prompt-config" value={config} onChange={(e) => setConfig(e.target.value)} />
            </FormGroup>

            <FormGroup
                htmlFor="labels"
                label="Labels"
                subLabel="Apply labels to the new version to organize your prompts."
            >
                <div className={styles.labelsContainer}>
                    <label className={styles.checkboxWrapper}>
                        <input type="checkbox" name="production" checked={labels.production} onChange={handleLabelChange} />
                        <span>Set the "Production" label</span>
                    </label>
                </div>
            </FormGroup>

            <FormGroup
                htmlFor="prompt-commit-message"
                label="Commit Message"
                subLabel="Optional message to describe the changes in this version."
            >
                <input id="prompt-commit-message" type="text" className="form-input" placeholder="e.g. fix typo in system prompt" value={commitMessage} onChange={(e) => setCommitMessage(e.target.value)} />
            </FormGroup>

            {isReferenceModalOpen && (
                <PromptsReference
                    onClose={() => setIsReferenceModalOpen(false)}
                    onInsert={handleInsertReference}
                />
            )}
        </FormPageLayout>
    );
};

export default PromptsNew;