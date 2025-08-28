import { useState, useMemo } from "react";
import { Outlet, NavLink, matchPath, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  LayoutDashboard,
  Activity,
  MessageCircleCode,
  FlaskConical,
  SquareStack,
  Lightbulb,
  Database,
  Settings,
  Search,
} from "lucide-react";

import styles from "./Layout.module.css";
import PageHeader from "../components/PageHeader/PageHeader.jsx";
import useProjectId from "../hooks/useProjectId";
import useHeaderMeta from "../hooks/useHeaderMeta";



export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // 현재 활성 프로젝트 ID (세션 검증 포함)
  const { projectId: activeProjectId } = useProjectId({
    location,
    validateAgainstSession: true,
  });
  // 헤더에 뿌릴 조직/프로젝트/배지
  const { orgName, projectName, envBadge } = useHeaderMeta(activeProjectId);


  const [headerConfig, setHeaderConfig] = useState({});

  const mainMenuSections = [
    {
      title: null,
      items: [
        { label: "Home", icon: <Home size={18} />, path: "/" },
      ],
    },
    {
      title: "Tracing",
      items: [
        { label: "Trace", icon: <Activity size={18} />, path: "/trace" },
        { label: "Span", icon: <Activity size={18} />, path: "/span" },
        { label: "Sessions", icon: <MessageCircleCode size={18} />, path: "/sessions" },
      ],
    },
    {
      title: "Evaluation",
      items: [
        { label: "LLM-as-a-Judge", icon: <Lightbulb size={18} />, path: "/llm-as-a-judge" },
        { label: "Datasets", icon: <Database size={18} />, path: "/datasets" },
      ],
    },
    {
      title: "Dashboards",
      items: [
        { label: "Dashboards", icon: <LayoutDashboard size={18} />, path: "/dashboards" },
      ],
    },
    {
      title: "Prompt Management",
      items: [
        { label: "Prompts", icon: <FlaskConical size={18} />, path: "/prompts" },
        { label: "Playground", icon: <SquareStack size={18} />, path: "/playground" },
      ],
    },
  ];

  const bottomMenu = [
    { label: "Settings", icon: <Settings size={18} />, path: "/settings" },
  ];

  const navClass = ({ isActive }) =>
    `${styles.menuItem} ${isActive ? styles.active : ""} ${collapsed ? styles.iconOnly : ""}`.trim();

  const sectionActive = (section) =>
    section.items.some(({ path }) =>
      !!matchPath({ path, end: path === "/" }, location.pathname) ||
      (path !== "/" && location.pathname.startsWith(path))
    );

  // const pageTitle = useMemo(() => {
  //   const p = location.pathname;   <<------ 아래와 같이 대체수정함(20250828_playground팀)

  // /project/:id/... 인 경우 공통 prefix 제거해서 라우트 매칭 통일
  const stripProjectPrefix = (p) => {
    const m = p.match(/^\/project\/[^/]+(\/.*)?$/);
    return m ? (m[1] || "/") : p;
  };

  const pageTitle = useMemo(() => {
    const p = stripProjectPrefix(location.pathname);


    if (p === "/") return "Home";
    if (p.startsWith("/llm-as-a-judge")) return "LLM-as-a-Judge Evaluators";
    if (p.startsWith("/datasets")) return "Datasets";
    if (p.startsWith("/scores")) return "Evaluators";
    if (p.startsWith("/dashboards/llm")) return "LLM Dashboard";
    if (p.startsWith("/prompts")) return "Prompts";
    if (p.startsWith("/playground")) return "Playground";
    if (p.startsWith("/trace")) return "Trace";
    if (p.startsWith("/span")) return "Span";
    if (p.startsWith("/sessions")) return "Sessions";
    if (p.startsWith("/settings")) return "Settings";
    return "Langfuse";
  }, [location.pathname]);

  const headerRightActionsDefault = useMemo(() => {
    const p = location.pathname;
    if (p.startsWith("/datasets")) {
      return (
        <button
          type="button"
          className={`${styles.headerActionPrimary ?? ""}`.trim()}
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/datasets?new=1")}
        >
          + New dataset
        </button>
      );
    }
    return null;
  }, [location.pathname, navigate]);

  return (
    <div className={styles.layout}>
      <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""}`}>
        <div className={styles.header}>
          <div className={styles.logoArea}>
            <div className={styles.logoText}>
              {!collapsed && <span>Langfuse</span>}
            </div>
          </div>
          {!collapsed && <div className={styles.divider} />}
          {!collapsed && (
            <div className={styles.searchBox} role="search">
              <div className={styles.searchText}>
                <Search size={12} aria-hidden />
                <span>Go to...</span>
              </div>
              <span className={styles.hotkey}>Ctrl K</span>
            </div>
          )}
        </div>

        <div className={styles.menuWrapper}>
          <ul className={styles.menu} role="menu" aria-label="Main navigation">
            {mainMenuSections.map((section, i) => (
              <li key={i}>
                {section.title && !collapsed && (
                  <div className={`${styles.sectionTitle} ${sectionActive(section) ? styles.sectionTitleActive : ""
                    }`}>{section.title}</div>
                )}
                {section.items.map((item) => (
                  <NavLink
                    key={item.label}
                    to={item.path}
                    className={navClass}
                    end={item.path === "/"}
                    title={collapsed ? item.label : undefined}
                    aria-label={collapsed ? item.label : undefined}
                    role="menuitem"
                  >
                    {item.icon}
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                ))}
                {i < mainMenuSections.length - 1 && (
                  <div className={styles.sectionDivider}></div>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <ul className={`${styles.menu} ${styles.bottomMenu}`} role="menu" aria-label="Secondary navigation">
            {bottomMenu.map((item) => (
              <NavLink
                key={item.label}
                to={item.path}
                className={navClass}
                end={false}
                title={collapsed ? item.label : undefined}
                aria-label={collapsed ? item.label : undefined}
                role="menuitem"
              >
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </ul>

          <div className={styles.userInfo}>
            <img src="/user-profile.png" className={styles.userAvatar} alt="" />
            {!collapsed && (
              <div className={styles.userText}>
                <div className={styles.userName}>test</div>
                <div className={styles.userEmail}>test@test.com</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className={styles.mainContainer}>
        <PageHeader
          orgName={orgName}
          projectName={projectName}
          envBadge={envBadge}
          title={headerConfig.title ?? pageTitle}
          onToggleSidebar={() => setCollapsed((prev) => !prev)}
          flushLeft
          rightActions={headerConfig.rightActions ?? headerRightActionsDefault}
        />
        <div className={styles.pageBody}>
          <Outlet context={{ setHeader: setHeaderConfig }} />
        </div>
      </main>
    </div>
  );
}
