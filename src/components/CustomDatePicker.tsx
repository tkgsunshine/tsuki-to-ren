import React, { useState, useEffect } from 'react';

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  onClose: () => void;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ value, onChange, onClose }) => {
  // Parse initial value (default to 1995-01-01 if empty/invalid)
  const initialDate = (() => {
    if (!value) return new Date(1995, 0, 1);
    const parts = value.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new Date(year, month, day);
      }
    }
    return new Date(1995, 0, 1);
  })();

  const [selectedYear, setSelectedYear] = useState<number>(initialDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(initialDate.getMonth()); // 0-11
  const [selectedDay, setSelectedDay] = useState<number>(initialDate.getDate());

  // Generate Year Options: 1940 to 2015 (User birth years)
  const years: number[] = [];
  for (let y = 2015; y >= 1940; y--) {
    years.push(y);
  }

  // Days in selected month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);

  // Day of week of the 1st of the selected month (0 = Sun, 6 = Sat)
  const getFirstDayOfWeek = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const firstDayOfWeek = getFirstDayOfWeek(selectedYear, selectedMonth);

  // If selectedDay is out of bounds for the new month, adjust it
  useEffect(() => {
    if (selectedDay > daysInMonth) {
      setSelectedDay(daysInMonth);
    }
  }, [selectedYear, selectedMonth, daysInMonth, selectedDay]);

  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
    const y = selectedYear;
    const m = String(selectedMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    onClose();
  };

  // Generate grid array
  const gridCells = [];
  // Empty slots for start offset
  for (let i = 0; i < firstDayOfWeek; i++) {
    gridCells.push(null);
  }
  // Days of month
  for (let d = 1; d <= daysInMonth; d++) {
    gridCells.push(d);
  }

  const weekdayLabels = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(2, 2, 5, 0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1100,
      animation: 'fadeIn 0.25s ease'
    }}>
      <div className="glass-panel" style={{
        width: '90%',
        maxWidth: '340px',
        background: 'rgba(15, 15, 27, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
      }}>
        {/* Dropdown selectors for fast jumps */}
        <div style={{ display: 'flex', gap: '0.5rem', width: '100%', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              padding: '0.5rem',
              color: 'white',
              outline: 'none',
              fontSize: '0.85rem',
              textAlign: 'center'
            }}
          >
            {years.map(y => (
              <option key={y} value={y} style={{ background: '#0a0a14' }}>{y}年</option>
            ))}
          </select>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
            style={{
              width: '90px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              padding: '0.5rem',
              color: 'white',
              outline: 'none',
              fontSize: '0.85rem',
              textAlign: 'center'
            }}
          >
            {Array.from({ length: 12 }).map((_, idx) => (
              <option key={idx} value={idx} style={{ background: '#0a0a14' }}>{idx + 1}月</option>
            ))}
          </select>
        </div>

        {/* Weekday Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
          {weekdayLabels.map((w, idx) => (
            <span key={w} style={{
              fontSize: '0.7rem',
              fontWeight: 'bold',
              color: idx === 0 ? '#f87171' : (idx === 6 ? '#60a5fa' : '#9ca3af')
            }}>
              {w}
            </span>
          ))}
        </div>

        {/* Calendar Day Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {gridCells.map((cell, idx) => {
            if (cell === null) {
              return <div key={`empty-${idx}`} style={{ aspectRatio: '1' }} />;
            }
            const isSelected = cell === selectedDay;
            return (
              <button
                key={`day-${cell}`}
                type="button"
                onClick={() => handleSelectDay(cell)}
                style={{
                  aspectRatio: '1',
                  borderRadius: '50%',
                  border: 'none',
                  background: isSelected ? 'var(--color-gold)' : 'transparent',
                  color: isSelected ? '#0a0a14' : 'white',
                  fontSize: '0.8rem',
                  fontWeight: isSelected ? 'bold' : 'normal',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? 'var(--shadow-gold)' : 'none'
                }}
                onMouseOver={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                }}
                onMouseOut={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                {cell}
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '0.6rem',
              color: '#9ca3af',
              fontSize: '0.8rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
};
