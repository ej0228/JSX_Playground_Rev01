// src/hooks/useHeaderMeta.js
import { useEffect, useState } from "react";

export default function useHeaderMeta(activeProjectId) {
    const [state, set] = useState({
        loading: true,
        orgName: "Organization",
        projectName: "—",
        envBadge: "Hobby",   // 기본 배지
    });

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const r = await fetch("/api/auth/session", { credentials: "include" });
                const s = r.ok ? await r.json() : null;

                const orgs = s?.user?.organizations ?? [];
                let orgName = "Organization";
                let projectName = "—";

                // activeProjectId에 해당하는 조직/프로젝트 찾기 (없으면 첫 것)
                let hitOrg = null, hitProj = null;
                for (const org of orgs) {
                    const proj = (org.projects ?? []).find(p => p.id === activeProjectId);
                    if (proj) { hitOrg = org; hitProj = proj; break; }
                }
                if (!hitProj) {
                    hitOrg = orgs[0] ?? null;
                    hitProj = hitOrg?.projects?.[0] ?? null;
                }
                if (hitOrg?.name) orgName = hitOrg.name;
                if (hitProj?.name) projectName = hitProj.name;

                const envBadge = hitOrg?.plan || s?.environment?.selfHostedInstancePlan || "Hobby";

                if (alive) set({ loading: false, orgName, projectName, envBadge });
            } catch {
                if (alive) set(prev => ({ ...prev, loading: false }));
            }
        })();
        return () => { alive = false; };
    }, [activeProjectId]);

    return state;
}
