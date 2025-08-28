// src/hooks/useProjectId.js
import { useEffect, useMemo, useState } from "react";

const LS_KEY = "activeProjectId";

// -------- helpers --------
function isLikelyProjectId(s) {
    if (typeof s !== "string") return false;
    const t = s.trim();
    if (!t) return false;
    if (t.length < 8 || t.length > 64) return false;
    if (/[<>\s%]/.test(t)) return false;
    if (/^(undefined|null|projectId)$/i.test(t)) return false;
    return /^[a-z0-9_-]+$/i.test(t);
}

// 세션 한 번만 가져오도록 모듈 레벨 캐시
let _sessionCachePromise = null;
async function getSession() {
    if (!_sessionCachePromise) {
        _sessionCachePromise = fetch("/api/auth/session", { credentials: "include" })
            .then(r => (r.ok ? r.json() : null))
            .catch(() => null);
    }
    return _sessionCachePromise;
}

// 세션에서 “내가 속한 프로젝트 ID들” 집합 만들기
async function getMyProjectSetFromSession() {
    const s = await getSession();
    const ids = new Set();
    if (!s) return ids;

    // ✅ 네 환경 스키마
    const orgs = s?.user?.organizations;
    if (Array.isArray(orgs)) {
        for (const org of orgs) {
            const ps = org?.projects;
            if (Array.isArray(ps)) for (const p of ps) if (p?.id) ids.add(p.id);
        }
    }

    // ✅ 레거시/다른 배포 스키마도 겸사겸사
    if (Array.isArray(s?.memberships)) s.memberships.forEach(m => m?.projectId && ids.add(m.projectId));
    if (s?.activeProjectId) ids.add(s.activeProjectId);
    if (s?.defaultProjectId) ids.add(s.defaultProjectId);
    if (s?.project?.id) ids.add(s.project.id);

    return ids;
}

export default function useProjectId(opts = {}) {
    const {
        location,
        sourcePriority = ["path", "query", "localStorage", "session"],
        validateAgainstSession = true,
    } = opts;

    const [projectId, setProjectIdState] = useState(null); // null=로딩, ""=없음
    const [source, setSource] = useState("");

    useEffect(() => {
        let cancelled = false;

        (async () => {
            const pathname = location?.pathname ?? window.location.pathname;
            const search = location?.search ?? window.location.search;

            // 후보를 우선순위대로 모으기
            const candidates = [];
            if (sourcePriority.includes("path")) {
                const m = pathname.match(/\/project\/([^/]+)/);
                if (m?.[1] && isLikelyProjectId(m[1])) candidates.push({ id: m[1], src: "path" });
            }
            if (sourcePriority.includes("query")) {
                const qs = new URLSearchParams(search).get("projectId");
                if (qs && isLikelyProjectId(qs)) candidates.push({ id: qs, src: "query" });
            }
            if (sourcePriority.includes("localStorage")) {
                const ls = localStorage.getItem(LS_KEY);
                if (ls && isLikelyProjectId(ls)) candidates.push({ id: ls, src: "localStorage" });
            }

            let chosen = null;

            if (validateAgainstSession) {
                const my = await getMyProjectSetFromSession().catch(() => new Set());
                // 1) 후보들 중 멤버십에 있는 첫 번째
                chosen = candidates.find(c => my.has(c.id)) || null;
                // 2) 없으면 세션의 첫 프로젝트로
                if (!chosen) {
                    const first = Array.from(my)[0];
                    if (first) chosen = { id: first, src: "session" };
                }
            } else {
                chosen = candidates[0] || null;
                if (!chosen && sourcePriority.includes("session")) {
                    const my = await getMyProjectSetFromSession().catch(() => new Set());
                    const first = Array.from(my)[0];
                    if (first) chosen = { id: first, src: "session" };
                }
            }

            if (cancelled) return;

            if (chosen) {
                try { localStorage.setItem(LS_KEY, chosen.id); } catch { }
                setProjectIdState(chosen.id);
                setSource(chosen.src);
            } else {
                setProjectIdState("");
                setSource("not-found");
            }
        })();

        return () => { cancelled = true; };
    }, [location?.pathname, location?.search, sourcePriority.join("|"), validateAgainstSession]);

    const setProjectId = (pid) => {
        if (isLikelyProjectId(pid)) {
            try { localStorage.setItem(LS_KEY, pid); } catch { }
            setProjectIdState(pid);
            setSource("manual");
        } else {
            setProjectIdState("");
            setSource("manual:invalid");
        }
    };

    return useMemo(() => ({ projectId, source, setProjectId }), [projectId, source]);
}
