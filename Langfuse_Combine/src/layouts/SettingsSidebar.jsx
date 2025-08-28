import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './SettingsSidebar.module.css';

const SettingsSidebar = () => {
    return (
        <nav className = { styles.nav }>
            <ul>
                <li><NavLink to = "/settings" end>General</NavLink></li>
                <li><NavLink to = '/settings/api-keys'>API Keys</NavLink></li>
                <li><NavLink to = '/settings/llm-connections'>LLM Connections</NavLink></li>
                <li><NavLink to = '/settings/models'>Models</NavLink></li>
                <li><NavLink to = '/settings/scores'>Scores / Evaluation</NavLink></li>
                <li><NavLink to = '/settings/members'>Members</NavLink></li>
            </ul>
        </nav>
    );
};

export default SettingsSidebar;