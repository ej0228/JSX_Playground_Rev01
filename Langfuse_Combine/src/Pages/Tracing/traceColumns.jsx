// src/pages/Tracing/traceColumns.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import styles from './Tracing.module.css';

// 비용 포맷팅 헬퍼 함수
const formatCost = (cost) => {
    if (cost === null || cost === 0) return '-';
    return `$${cost.toFixed(6)}`;
};

export const traceTableColumns = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      accessor: (row) => row.timestamp,
      visible: true,
    },
    {
      key: 'name',
      header: 'Name',
      // 'to' 경로를 '/trace/'로 수정합니다.
      accessor: (row) => row.name,
      // accessor: (row) => <Link to={`/trace/${row.id}`} className={styles.traceLink}>{row.name}</Link>,
      visible: true,
    },
    {
        key: 'userId',
        header: 'User ID',
        accessor: (row) => row.userId || 'N/A',
        visible: true,
    },
    {
      key: 'input',
      header: 'Input',
      accessor: (row) => <div className={styles.cellText}>{row.input}</div>,
      visible: true,
    },
    {
      key: 'output',
      header: 'Output',
      accessor: (row) => <div className={styles.cellText}>{row.output}</div>,
      visible: true,
    },
    {
        key: 'cost',
        header: 'Cost (USD)',
        accessor: (row) => formatCost(row.cost),
        visible: true,
    },
    {
        key: 'latency',
        header: 'Latency',
        accessor: (row) => `${row.latency} ms`,
        visible: true,
    },
    {
      key: 'observations',
      header: 'Observations',
      accessor: (row) => row.observations,
      visible: true,
    },
    {
        key: 'sessionId',
        header: 'Session ID',
        accessor: (row) => row.sessionId || 'N/A',
        visible: false, // 기본 숨김
    },
    {
        key: 'tags',
        header: 'Tags',
        accessor: (row) => row.tags?.join(', ') || 'N/A',
        visible: false, // 기본 숨김
    },
    {
        key: 'version',
        header: 'Version',
        accessor: (row) => row.version || 'N/A',
        visible: false, // 기본 숨김
    },
    {
        key: 'release',
        header: 'Release',
        accessor: (row) => row.release || 'N/A',
        visible: false, // 기본 숨김
    },
    {
        key: 'environment',
        header: 'Environment',
        accessor: (row) => row.environment || 'N/A',
        visible: false, // 기본 숨김
    },
];