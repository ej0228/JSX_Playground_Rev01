// src/hooks/useEnvironmentFilter.js
import { useState, useMemo, useEffect } from 'react';

// 프로젝트의 모든 환경 목록을 관리하는 훅
export const useEnvironmentFilter = (allEnvironments) => {
  const [environments, setEnvironments] = useState(
    allEnvironments.map(env => ({ ...env, checked: env.name === 'default' }))
  );
  const [searchTerm, setSearchTerm] = useState('');

  // allEnvironments prop이 변경될 때 environments 상태를 리셋합니다.
  useEffect(() => {
    setEnvironments(
      allEnvironments.map(env => ({ ...env, checked: env.name === 'default' }))
    );
  }, [allEnvironments]);

  // 선택된 환경 목록
  const selectedEnvs = useMemo(() => environments.filter(e => e.checked), [environments]);
  
  // 전체 선택 여부
  const isAllSelected = useMemo(() => environments.length > 0 && selectedEnvs.length === environments.length, [environments, selectedEnvs]);

  // 버튼에 표시될 라벨
  const buttonLabel = useMemo(() => {
    if (selectedEnvs.length === 0) return 'None';
    if (selectedEnvs.length === 1) return selectedEnvs[0].name;
    if (isAllSelected) return 'All';
    return `${selectedEnvs.length} selected`;
  }, [selectedEnvs, isAllSelected]);
  
  // 검색어에 따라 필터링된 환경 목록
  const filteredEnvironments = useMemo(() =>
    environments.filter(env => env.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [environments, searchTerm]
  );

  // 개별 환경 선택/해제
  const toggleEnvironment = (id) => {
    setEnvironments(prev =>
      prev.map(env => (env.id === id ? { ...env, checked: !env.checked } : env))
    );
  };

  // 전체 환경 선택/해제
  const selectAllEnvironments = (isChecked) => {
    setEnvironments(prev => prev.map(env => ({ ...env, checked: isChecked })));
  };

  // 모든 필터 초기화
  const clearAllEnvironments = () => {
    setEnvironments(prev => prev.map(env => ({ ...env, checked: false })));
  };

  return {
    environments,
    selectedEnvs,
    buttonLabel,
    searchTerm,
    setSearchTerm,
    filteredEnvironments,
    toggleEnvironment,
    selectAllEnvironments,
    clearAllEnvironments,
    isAllSelected
  };
};