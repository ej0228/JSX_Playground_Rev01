// src/pages/Tracing/Sessions/sessionColumns.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Sessions.module.css';

// API 스키마를 기반으로 테이블 컬럼 목록을 정의합니다.
export const sessionTableColumns = [
    { 
      key: 'id', 
      header: 'ID', 
      visible: true, 
      accessor: (row) => (
        <Link to={`/sessions/${row.id}`} className={styles.idLink}>
          {row.id}
        </Link>
      ) 
    },
    { 
      key: 'createdAt', 
      header: 'Created At', 
      accessor: (row) => row.createdAt, 
      visible: true 
    },
    { 
      key: 'projectId', 
      header: 'Project ID', 
      accessor: (row) => row.projectId, 
      visible: true 
    },
    { 
      key: 'environment', 
      header: 'Environment', 
      accessor: (row) => row.environment, 
      visible: true 
    },
];