// src/components/ProjectGate.jsx
import { Navigate, useLocation } from "react-router-dom";
import useProjectId from "../../hooks/useProjectId";
import ProjectIdBanner from "./ProjectIdBanner";

/**
 * /playground 같은 "짧은 경로"로 들어온 경우 사용.
 * - projectId가 있으면 → /project/:projectId/playground 로 즉시 리다이렉트
 * - projectId가 없으면 → 배너로 projectId 입력받아 저장
 *
 * 이 컴포넌트는 어떤 페이지에도 재사용 가능 (예: Datasets, Sessions 등).
 */
export default function ProjectGate() {

    const location = useLocation();
    const { projectId } = useProjectId({ location, validateAgainstSession: true });

    // 훅이 아직 URL/쿼리/localStorage를 탐색 중인 상태
    if (projectId === null) return null;

    // 못 찾았으면 배너 노출 → onSave가 setProjectId를 호출하면 저장됨(localStorage 포함)
    if (projectId === "") return <ProjectIdBanner onSave={setProjectId} />;

    // 찾았으면 표준 경로로 이동
    return <Navigate to={`/project/${projectId}/playground`} replace />;
}
