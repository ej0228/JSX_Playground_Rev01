import React, { useMemo } from 'react';
import styles from './CodeBlock.module.css';

const CodeBlock = ({ code, onChange }) => {
  const formattedCode = useMemo(() => {
    if (typeof code === 'string') return code;
    if (typeof code === 'object' && code !== null) return JSON.stringify(code, null, 2);
    return String(code ?? '');
  }, [code]);

  const lineCount = useMemo(() => formattedCode.split('\n').length, [formattedCode]);

  const handleChange = (event) => {
    // onChange prop이 있으면, 변경된 값을 부모 컴포넌트로 전달합니다.
    if (onChange) {
      onChange(event.target.value);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.lineNumbers}>
        {Array.from({ length: lineCount }, (_, i) => (
          <span key={i}>{i + 1}</span>
        ))}
      </div>
      {/* 기존 pre 태그를 textarea로 변경하여 입력을 가능하게 합니다. */}
      <textarea
        className={styles.code}
        value={formattedCode}
        onChange={handleChange}
        spellCheck="false"
        rows={lineCount}
      />
    </div>
  );
};

export default CodeBlock;