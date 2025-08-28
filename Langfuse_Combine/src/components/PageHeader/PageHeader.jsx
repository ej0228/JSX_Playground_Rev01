import React from "react";
import { PanelLeft, ChevronDown, Info } from "lucide-react";
import styles from "./PageHeader.module.css";

export default function PageHeader({
    orgName = "Organization",
    projectName = "Project",
    envBadge = "Hobby",
    title,
    onToggleSidebar,
    rightActions,
    flushLeft = false,
}) {
    // HTMLHeadingElement의 title 속성은 string만 허용하므로 가드
    const titleAttr = typeof title === "string" ? title : undefined;

    return (
        <header className={`${styles.header} ${flushLeft ? styles.flush : ""}`}>
            {/* Top strip: toggle + breadcrumb */}
            <div className={styles.topRow}>
                <div className={styles.rowInner}>
                    <button
                        type="button"
                        className={styles.toggleButton}
                        onClick={onToggleSidebar}
                        aria-label="Toggle sidebar"
                    >
                        <PanelLeft size={18} />
                    </button>

                    <nav aria-label="Breadcrumb" className={styles.breadcrumbs}>
                        <button type="button" className={styles.crumbBtn}>
                            <span>{orgName}</span>
                            <span className={styles.tag}>{envBadge}</span>
                            <ChevronDown size={14} className={styles.chev} />
                        </button>

                        <span className={styles.separator} aria-hidden>
                            /
                        </span>

                        <button type="button" className={styles.crumbBtn}>
                            <span>{projectName}</span>
                            <ChevronDown size={14} className={styles.chev} />
                        </button>
                    </nav>

                    <div className={styles.topRight} />
                </div>
            </div>

            {/* Bottom strip: page title */}
            <div className={styles.bottomRow}>
                <div className={styles.rowInner}>
                    <h2 className={styles.pageTitle} title={titleAttr}>
                        <span className={styles.titleText}>{title}</span>
                        <span className={styles.infoDot} aria-hidden>
                            <Info size={14} />
                        </span>
                    </h2>
                    <div className={styles.rightActions}>{rightActions}</div>
                </div>
            </div>
        </header>
    );
}