import { ChangeEvent } from 'react';
import { tokens } from '../tokens';

export interface FieldOption {
  value: string;
  label: string;
}

interface FieldProps {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'textarea';
  value: string | number | boolean;
  onChange: (value: any) => void;
  options?: FieldOption[] | string[];
  placeholder?: string;
  helper?: string;
  disabledReason?: string | null;
}

export function Field({
  id,
  label,
  type,
  value,
  onChange,
  options = [],
  placeholder = '',
  helper,
  disabledReason = null,
}: FieldProps) {
  const disabled = Boolean(disabledReason);

  const inputBaseStyle =
    'w-full min-h-11 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600';
  const disabledInputStyle = 'bg-slate-100 opacity-60 cursor-not-allowed';

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    onChange(e.target.value);
  };

  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  };

  if (type === 'checkbox') {
    return (
      <div className="flex flex-col gap-1">
        <label
          htmlFor={id}
          className="flex items-center gap-3 cursor-pointer select-none min-h-11"
        >
          <input
            id={id}
            type="checkbox"
            checked={Boolean(value)}
            disabled={disabled}
            onChange={handleCheckboxChange}
            className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
          />
          <span className={tokens.text.label}>{label}</span>
        </label>
        {disabledReason ? (
          <span className={tokens.text.helper}>{disabledReason}</span>
        ) : helper ? (
          <span className={tokens.text.helper}>{helper}</span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={tokens.text.label}>
        {label}
      </label>

      {type === 'select' ? (
        <select
          id={id}
          value={typeof value === 'string' ? value : ''}
          disabled={disabled}
          onChange={handleInputChange}
          className={`${inputBaseStyle} ${disabled ? disabledInputStyle : ''}`}
        >
          {options.map((opt) => {
            const optVal = typeof opt === 'string' ? opt : opt.value;
            const optLabel = typeof opt === 'string' ? opt : opt.label;
            return (
              <option key={optVal} value={optVal}>
                {optLabel}
              </option>
            );
          })}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          id={id}
          rows={3}
          value={typeof value === 'string' ? value : ''}
          placeholder={placeholder}
          disabled={disabled}
          onChange={handleInputChange}
          className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600 ${
            disabled ? disabledInputStyle : ''
          }`}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={
            typeof value === 'string' || typeof value === 'number' ? value : ''
          }
          placeholder={placeholder}
          disabled={disabled}
          onChange={handleInputChange}
          className={`${inputBaseStyle} ${disabled ? disabledInputStyle : ''}`}
        />
      )}

      {disabledReason ? (
        <span className={tokens.text.helper}>{disabledReason}</span>
      ) : helper ? (
        <span className={tokens.text.helper}>{helper}</span>
      ) : null}
    </div>
  );
}
