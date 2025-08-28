// src/components/ProjectIdBanner.jsx
import { useState } from "react";

/** 최초 진입 시 projectId를 한 번만 입력받아 저장하는 배너 */
export default function ProjectIdBanner({ onSave }) {
    const [val, setVal] = useState("");
    return (
        <div style={{ padding: 16, background: "#221", color: "#ffdede", borderRadius: 8, border: "1px solid #553" }}>
            <div style={{ fontWeight: 700, marginBottom: 8, color: "#ff9a9a" }}>Project ID not found</div>
            <p style={{ margin: "8px 0 12px", opacity: 0.9 }}>
                백엔드 UI(포트 3000)에서 <code>/project/&lt;ID&gt;</code> 형태의 프로젝트 ID를 복사해 붙여 주세요.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
                <input
                    value={val}
                    onChange={(e) => setVal(e.target.value)}
                    placeholder="paste your projectId"
                    style={{ flex: 1, padding: "8px 12px", borderRadius: 6, border: "1px solid #666", background: "#111", color: "#fff" }}
                />
                <button
                    onClick={() => val && onSave(val)}
                    style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #888", background: "#333", color: "#fff", fontWeight: 600 }}
                >
                    Save
                </button>
            </div>
            <p style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
                저장하면 다음부터는 자동으로 /project/&lt;ID&gt;/playground 로 이동합니다.
            </p>
        </div>
    );
}
