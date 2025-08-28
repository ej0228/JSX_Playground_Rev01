import { useState, useMemo, useEffect } from 'react';
import dayjs from 'dayjs';

// 필터 옵션 정의
const timeOptions = [
  { label: '30 min', value: { amount: 30, unit: 'minute' } },
  { label: '1 hour', value: { amount: 1, unit: 'hour' } },
  { label: '6 hours', value: { amount: 6, unit: 'hour' } },
  { label: '24 hours', value: { amount: 24, unit: 'hour' } },
  { label: '3 days', value: { amount: 3, unit: 'day' } },
  { label: '7 days', value: { amount: 7, unit: 'day' } },
  { label: '14 days', value: { amount: 14, unit: 'day' } },
  { label: '1 month', value: { amount: 1, unit: 'month' } },
  { label: '3 months', value: { amount: 3, unit: 'month' } },
  { label: 'All time', value: null }, // 'All time'은 null 값으로 처리
];

export const useTimeRangeFilter = (initialOption = timeOptions[3]) => { // 기본값 '24 hours'
  const [selectedOption, setSelectedOption] = useState(initialOption);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // 선택된 옵션이 변경될 때마다 시작일과 종료일을 업데이트
  useEffect(() => {
    const now = dayjs();
    if (selectedOption.value) {
      setEndDate(now.toDate());
      setStartDate(now.subtract(selectedOption.value.amount, selectedOption.value.unit).toDate());
    } else {
      // 'All time' 선택 시 날짜를 null로 설정하여 필터링 비활성화
      setStartDate(null);
      setEndDate(null);
    }
  }, [selectedOption]);

  // 버튼에 표시될 텍스트
  const buttonLabel = useMemo(() => {
    if (selectedOption.label === 'All time') return 'All time';
    return `Past ${selectedOption.label}`;
  }, [selectedOption]);

  const handleTimeSelect = (option) => {
    setSelectedOption(option);
  };

  return {
    startDate,
    endDate,
    buttonLabel,
    selectedOption,
    timeOptions,
    handleTimeSelect,
  };
};