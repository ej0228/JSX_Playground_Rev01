import React, { useLayoutEffect, useEffect, useRef, useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import styles from './DateRangePopup.module.css';
import { ChevronLeft, ChevronRight, Clock, ChevronDown } from 'lucide-react';
import dayjs from 'dayjs';

// CalendarMonth 컴포넌트 (변경 없음)
const CalendarMonth = ({ monthDate, startDate, endDate, onDayClick }) => {
  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const startOfMonth = monthDate.startOf('month');
  const daysInMonth = monthDate.daysInMonth();
  const startDayOfWeek = startOfMonth.day();

  const days = [];
  for (let i = 0; i < startDayOfWeek; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(startOfMonth.date(i));

  const isDayInRange = (day) => day && startDate && endDate && day.isAfter(startDate.subtract(1, 'day')) && day.isBefore(endDate);
  const isRangeStart = (day) => day && startDate && day.isSame(startDate, 'day');
  const isRangeEnd = (day) => day && endDate && day.isSame(endDate, 'day');

  return (
    <div className={styles.monthContainer}>
      <h3 className={styles.monthTitle}>{monthDate.format('MMMM YYYY')}</h3>
      <div className={styles.calendarGrid}>
        {daysOfWeek.map((day) => <div key={day} className={styles.dayHeader}>{day}</div>)}
        {days.map((day, index) => (
          <button
            key={index}
            className={`
              ${styles.dayCell}
              ${isDayInRange(day) ? styles.selectedRange : ''}
              ${isRangeStart(day) ? styles.rangeStart : ''}
              ${isRangeEnd(day) ? styles.rangeEnd : ''}
            `}
            disabled={!day}
            onClick={() => day && onDayClick(day)}
          >
            {day ? day.date() : ''}
          </button>
        ))}
      </div>
    </div>
  );
};

// 메인 팝업 컴포넌트
const DateRangePopup = ({ startDate, endDate, setStartDate, setEndDate, onClose, triggerRef }) => {
  const popupRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [opacity, setOpacity] = useState(0);
  const [currentDisplayMonth, setCurrentDisplayMonth] = useState(dayjs(endDate || new Date()));

  // ▼▼▼ 내부 상태로 시작과 끝 날짜/시간을 관리하여 무한 루프 방지 ▼▼▼
  const [internalStartDate, setInternalStartDate] = useState(startDate);
  const [internalEndDate, setInternalEndDate] = useState(endDate);

  // 부모 컴포넌트의 날짜가 변경될 때만 내부 상태를 동기화
  useEffect(() => {
    setInternalStartDate(startDate);
  }, [startDate]);

  useEffect(() => {
    setInternalEndDate(endDate);
  }, [endDate]);

  // 위치 계산 로직 수정
  useLayoutEffect(() => {
    if (triggerRef.current && popupRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const popupRect = popupRef.current.getBoundingClientRect();
      const margin = 8;
      
      let top = triggerRect.bottom + margin;
      if (top + popupRect.height > window.innerHeight && triggerRect.top > popupRect.height) {
        top = triggerRect.top - popupRect.height - margin;
      }
      
      let left = triggerRect.left;
      if (left + popupRect.width > window.innerWidth) {
        left = window.innerWidth - popupRect.width - margin;
      }
      if (left < margin) {
        left = margin;
      }

      setPosition({ top, left });
      setOpacity(1);
    }
  }, [triggerRef]);

  // onClose가 호출될 때 부모 상태 업데이트
  const handleClose = () => {
    setStartDate(internalStartDate);
    setEndDate(internalEndDate);
    onClose();
  };

  const handleDayClick = (day) => {
    setInternalStartDate(day.toDate());
    setInternalEndDate(day.toDate());
  };

  const handleTimeChange = (type, part, value) => {
    const dateToUpdate = type === 'start' ? internalStartDate : internalEndDate;
    const dateSetter = type === 'start' ? setInternalStartDate : setInternalEndDate;
    
    const day = dayjs(dateToUpdate);
    let hour = part === 'ampm' ? day.hour() : (part === 'hh' ? parseInt(value, 10) || 0 : day.hour());
    const ampm = part === 'ampm' ? value : day.format('A');

    if (ampm === 'PM' && hour < 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;

    const newDate = day
      .hour(hour)
      .minute(part === 'mm' ? parseInt(value, 10) || 0 : day.minute())
      .second(part === 'ss' ? parseInt(value, 10) || 0 : day.second())
      .toDate();
      
    dateSetter(newDate);
  };

  const getTimeParts = (date) => {
    const day = dayjs(date);
    return { hh: day.format('hh'), mm: day.format('mm'), ss: day.format('ss'), ampm: day.format('A') };
  };

  const startTimeParts = getTimeParts(internalStartDate);
  const endTimeParts = getTimeParts(internalEndDate);
  const timezone = useMemo(() => `GMT${dayjs().format('Z')}`, []);
  const firstMonth = currentDisplayMonth.subtract(1, 'month');
  const secondMonth = currentDisplayMonth;

  return ReactDOM.createPortal(
    <div className={styles.overlay} onClick={handleClose}>
      <div
        ref={popupRef}
        className={styles.popupContainer}
        style={{ top: `${position.top}px`, left: `${position.left}px`, opacity }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.calendarsWrapper}>
          <button onClick={() => setCurrentDisplayMonth(m => m.subtract(1, 'month'))} className={`${styles.navButton} ${styles.navLeft}`}><ChevronLeft size={18} /></button>
          <CalendarMonth monthDate={firstMonth} startDate={dayjs(internalStartDate)} endDate={dayjs(internalEndDate)} onDayClick={handleDayClick} />
          <CalendarMonth monthDate={secondMonth} startDate={dayjs(internalStartDate)} endDate={dayjs(internalEndDate)} onDayClick={handleDayClick} />
          <button onClick={() => setCurrentDisplayMonth(m => m.add(1, 'month'))} className={`${styles.navButton} ${styles.navRight}`}><ChevronRight size={18} /></button>
        </div>
        <div className={styles.timeControls}>
          <div className={styles.timeGroup}>
            <label>Start time</label>
            <div className={styles.timeInput}>
              <Clock size={16} className={styles.timeIcon} />
              <input type="text" value={startTimeParts.hh} onChange={(e) => handleTimeChange('start', 'hh', e.target.value)} maxLength={2} />
              <span>:</span>
              <input type="text" value={startTimeParts.mm} onChange={(e) => handleTimeChange('start', 'mm', e.target.value)} maxLength={2} />
              <span>:</span>
              <input type="text" value={startTimeParts.ss} onChange={(e) => handleTimeChange('start', 'ss', e.target.value)} maxLength={2} />
              <div className={styles.selectWrapper}>
                <select value={startTimeParts.ampm} onChange={(e) => handleTimeChange('start', 'ampm', e.target.value)}>
                  <option>AM</option><option>PM</option>
                </select>
                <ChevronDown size={14} className={styles.selectArrow} />
              </div>
              <span className={styles.timezone}>{timezone}</span>
            </div>
          </div>
          <div className={styles.timeGroup}>
            <label>End time</label>
            <div className={styles.timeInput}>
              <Clock size={16} className={styles.timeIcon} />
              <input type="text" value={endTimeParts.hh} onChange={(e) => handleTimeChange('end', 'hh', e.target.value)} maxLength={2} />
              <span>:</span>
              <input type="text" value={endTimeParts.mm} onChange={(e) => handleTimeChange('end', 'mm', e.target.value)} maxLength={2} />
              <span>:</span>
              <input type="text" value={endTimeParts.ss} onChange={(e) => handleTimeChange('end', 'ss', e.target.value)} maxLength={2} />
              <div className={styles.selectWrapper}>
                <select value={endTimeParts.ampm} onChange={(e) => handleTimeChange('end', 'ampm', e.target.value)}>
                  <option>AM</option><option>PM</option>
                </select>
                <ChevronDown size={14} className={styles.selectArrow} />
              </div>
              <span className={styles.timezone}>{timezone}</span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DateRangePopup;