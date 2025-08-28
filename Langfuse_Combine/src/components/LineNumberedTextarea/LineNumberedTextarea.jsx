import React, { useMemo } from 'react';
import styles from './LineNumberedTextarea.module.css';

const LineNumberedTextarea = ({
  id,
  value,
  onChange,
  placeholder,
  minHeight = 150,
  children,
}) => {
  const lineNumbers = useMemo(() => {
    const lines = value.split('\n').length;
    // 항상 최소 1줄의 번호는 보이도록 보장
    return Array.from({ length: Math.max(1, lines) }, (_, i) => i + 1);
  }, [value]);

  return (
    <div className={styles.editorWrapper} style={{ minHeight: `${minHeight}px` }}>
      <div className={styles.lineNumbers}>
        {lineNumbers.map((num) => (
          <div key={num}>{num}</div>
        ))}
      </div>
      <textarea
        id={id}
        className={styles.textarea}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        spellCheck="false"
      />
      {/* Prettify 버튼과 같은 자식 요소를 렌더링 */}
      <div className={styles.childrenWrapper}>{children}</div>
    </div>
  );
};

export default LineNumberedTextarea;
