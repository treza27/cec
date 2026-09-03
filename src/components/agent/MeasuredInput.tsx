import React, { useState, useEffect } from 'react';

interface MeasuredInputProps {
  value: string;
  colisId: number;
  field: string;
  step?: string;
  min?: string;
  placeholder?: string;
  className?: string;
  onCommit: (colisId: number, field: string, value: string) => void;
}

export default function MeasuredInput({
  value,
  colisId,
  field,
  step = '1',
  min = '0',
  placeholder = '0',
  className = '',
  onCommit,
}: MeasuredInputProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <input
      type="number"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={() => onCommit(colisId, field, localValue)}
      className={className}
      step={step}
      min={min}
      placeholder={placeholder}
    />
  );
}
