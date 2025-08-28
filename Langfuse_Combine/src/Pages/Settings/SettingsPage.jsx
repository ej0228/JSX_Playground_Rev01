import React from 'react';
import { Outlet } from 'react-router-dom';
import SettingsSidebar from '../../layouts/SettingsSidebar';
import styles from './layout/SettingsPage.module.css';

const SettingsPage = () => {
    return (
        <div>
            <div className = { styles.headerWrapper }>
                <div className = { styles.contentContainer }>
                    <h1 className = { styles.headerTitle }>Project Settings</h1>
                </div>
            </div>

            <div className = { styles.centeredContent }>
                <div className = { styles.bodyLayout }>
                    <SettingsSidebar />
                    <div style = { { flex: 1, width: '100%' } }>
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;