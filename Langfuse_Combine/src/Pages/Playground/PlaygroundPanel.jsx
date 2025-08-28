import React from "react";
import styles from "./PlaygroundPanel.module.css";

export default function PlaygroundPanel({
  title,
  description,
  children,
  compact = false,   // 패딩/폰트 줄임
  floating = false,  // 버튼 밑 팝오버
}) {
  return (
    <div
      className={[
        styles.panel,
        compact ? styles.panelCompact : "",
        floating ? styles.panelFloating : "",
      ].join(" ")}
      role="dialog"
      aria-label={title}
    >
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}>{title}</div>
        {description ? (
          <div className={styles.panelDesc}>{description}</div>
        ) : null}
      </div>
      <div className={styles.panelBody}>{children}</div>
    </div>
  );
}
