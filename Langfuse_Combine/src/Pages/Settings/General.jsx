import React, {useState, useEffect} from 'react';
import { getProjects } from '../../api/Settings/ProjectApi'
import TransferProjectForm from './form/TransferProjectForm';
import DeleteProjectForm from './form/DeleteProjectForm';
import commonStyles from "./layout/SettingsCommon.module.css";
import styles from './layout/General.module.css'

// 임시 조직 데이터 (실제로는 API로 가져와야 함)
const DUMMY_ORGANIZATIONS = [
    { id: 'org-1', name: 'wow' },
    { id: 'org-2', name: 'another-org' },
];

const General = () => {
    // 프로젝트 정보를 담을 상태 (객체 또는 null)
    const [project, setProject] = useState(null);
    // 입력 필드 전용 상태
    const [projectNameInput, setProjectNameInput] = useState('');
    // 로딩 및 에러 상태
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    // 사용자가 아직 입력 필드를 건드리지 않았는지 추적하는 상태
    const [isPristine, setIsPristine] = useState(true);
    // Transfer 모달의 열림 상태를 관리합니다.
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    // ✅ Delete 모달의 열림 상태를 관리합니다.
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // 컴포넌트가 처음 마운트될 때 API를 호출합니다.
    useEffect(() => {
        const fetchProjectData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const projects = await getProjects();

                // 프로젝트 목록이 있으면 첫 번째 프로젝트를 사용합니다.
                if (projects && projects.length > 0) {
                    const firstProject = projects[0];
                    setProject(firstProject);
                    setProjectNameInput(firstProject.name);
                } else {
                    setError("프로젝트를 찾을 수 없습니다.");
                }
            } catch (err) {
                // API 호출 실패 시 에러 메시지를 설정합니다.
                setError(err.message);
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProjectData();
    }, []); // 의존성 배열이 비어있으므로 한 번만 실행됩니다.

    // 'Save' 버튼 클릭 시 동작할 함수 (현재는 주석 처리)
    const handleSave = async () => {
        if (!project) return;
        alert(`(구현 필요) '${projectNameInput}'으로 이름 변경 시도`);
        // TODO: await updateProject(project.id, { name: projectNameInput });
    };

    // 'Delete' 버튼 클릭 시 동작할 함수
    const handleConfirmDelete = async () => {
        if (!project) return;

        console.log(`Deleting project ${project.id}`);
        alert(`(구현 필요) '${project.name}' 프로젝트 삭제 시도`);
        setIsDeleteModalOpen(false);
        // TODO: await deleteProject(project.id);
        // TODO: 삭제 후 프로젝트 목록 페이지로 이동
    };

    // Transfer 확정 핸들러
    const handleConfirmTransfer = (selectedOrgId) => {
        console.log(`Project ${project.id} will be transferred to organization ${selectedOrgId}`);
        alert(`Project transfer to ${selectedOrgId} initiated!`);
        setIsTransferModalOpen(false);
        // TODO: 실제 프로젝트 이전 API 호출
    };

    // ✅ 입력 필드에 포커스가 갔을 때의 핸들러
    const handleFocus = () => {
        // 처음 클릭하는 경우에만 내용을 비웁니다.
        if (isPristine) {
            setProjectNameInput('');
        }
    };

    // ✅ 입력 필드에서 포커스가 벗어났을 때의 핸들러
    const handleBlur = () => {
        // 입력값이 비어있으면 원래 프로젝트 이름으로 복원합니다.
        if (projectNameInput.trim() === '') {
            setProjectNameInput(project.name);
            setIsPristine(true); // 다시 초기 상태로 변경
        }
    };

    // ✅ 입력 필드 값이 변경될 때의 핸들러
    const handleChange = (e) => {
        // 사용자가 입력을 시작하면 isPristine 상태를 false로 변경합니다.
        if (isPristine) {
            setIsPristine(false);
        }
        setProjectNameInput(e.target.value);
    };

    // 'Save' 버튼의 활성화/비활성화 로직
    const isSaveDisabled = !project || projectNameInput.trim() === '' || projectNameInput === project.name;

    // UI 렌더링 부분
    if (isLoading) {
        return <div className={commonStyles.container}>Loading project data...</div>;
    }

    if (error) {
        return <div className={commonStyles.container} style={{ color: '#ef4444' }}>Error: {error}</div>;
    }

    if (!project) {
        return <div className={commonStyles.container}>No project found.</div>;
    }

    return (
        <div className={commonStyles.container}>
            { /* Host Name Section */}
            <h3 className={commonStyles.title}>Host Name</h3>
            <section className={commonStyles.section}>
                <p className={commonStyles.p}>When connecting to Langfuse, use this hostname / baseurl.</p>
                <input type="text" value={import.meta.env.VITE_LANGFUSE_BASE_URL || 'Not Set'} readOnly className={commonStyles.input} />
            </section>

            { /* Project Name Section */}
            <h3 className={commonStyles.title}>Project Name</h3>
            <section className={commonStyles.section}>
                {projectNameInput && projectNameInput !== project.name ? (
                    <p className={commonStyles.p}>
                        Your Project will be renamed from "{project.name}" to "{projectNameInput}".
                    </p>
                ) : (
                    <p className={commonStyles.p}>
                        Your Project is currently '{project.name}'.
                    </p>
                )}
                <input
                    type="text"
                    value={projectNameInput}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    // ✅ isPristine 상태에 따라 placeholder처럼 보이게 스타일 추가
                    className={`${commonStyles.input} ${isPristine ? styles.inputPristine : ''}`}
                />
                <button className={commonStyles.button} onClick={handleSave} disabled={isSaveDisabled}>Save</button>
            </section>

            { /* Debug Information Section */}
            <h3 className={commonStyles.title}>Debug Information</h3>
            <section className={commonStyles.section}>
                <div className={styles.codeBlock}>
                    {JSON.stringify({
                        project: {
                            name: project.name,
                            id: project.id,
                        },
                        org: {
                            // API 응답에 org 정보가 없으므로 임시값을 넣었습니다.
                            name: 'wow',
                            id: 'org-sd8sng8sgsg87sdg8sdg',
                        }
                    }, null, 2)}
                </div>
            </section>

            { /* Danger Zone Section */}
            <h3 className={commonStyles.title}>Danger Zone</h3>
            <section className={`${commonStyles.section} ${styles.dangerZone}`}>
                <div className={styles.flexBetween}>
                    <div>
                        <h4>Transfer ownership</h4>
                        <p className={commonStyles.p}>Transfer this project to another organization where you have the
                            ability to create projects.</p>
                    </div>
                    <button onClick={() => setIsTransferModalOpen(true)} className={`${commonStyles.button} ${styles.dangerButton}`}>Transfer Project</button>
                </div>
                <div className={styles.flexBetween}>
                    <div>
                        <h4>Delete this project</h4>
                        <p className={commonStyles.p}>Once you delete a project, there is no going back. Please be
                            certain.</p>
                    </div>
                    <button onClick={() => setIsDeleteModalOpen(true)} className={`${commonStyles.button} ${styles.dangerButton}`}>Delete Project</button>
                </div>
            </section>

            {/* Transfer Project 모달을 렌더링합니다. */}
            <TransferProjectForm
                isOpen={isTransferModalOpen}
                onClose={() => setIsTransferModalOpen(false)}
                onConfirm={handleConfirmTransfer}
                currentProjectName={project.name}
                organizations={DUMMY_ORGANIZATIONS}
            />

            {/* ✅ Delete Project 모달을 렌더링합니다. */}
            <DeleteProjectForm
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                projectName={project.name}
            />

        </div>
    );
};

export default General;