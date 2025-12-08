import React from 'react';
import TextInput from './TextInput';

interface SalaryRangeInputProps {
  minId: string;
  maxId: string;
  minName: string;
  maxName: string;
  minLabel?: string;
  maxLabel?: string;
  minValue?: string | number;
  maxValue?: string | number;
  minPlaceholder?: string;
  maxPlaceholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  onMinChange?: (value: string | number) => void;
  onMaxChange?: (value: string | number) => void;
  onMinBlur?: () => void;
  onMaxBlur?: () => void;
  onMinFocus?: () => void;
  onMaxFocus?: () => void;
}

const SalaryRangeInput: React.FC<SalaryRangeInputProps> = ({
  minId,
  maxId,
  minName,
  maxName,
  minLabel = 'Min Salary',
  maxLabel = 'Max Salary',
  minValue = '',
  maxValue = '',
  minPlaceholder = 'Min salary',
  maxPlaceholder = 'Max salary',
  required = false,
  disabled = false,
  error,
  helperText,
  className = '',
  onMinChange,
  onMaxChange,
  onMinBlur,
  onMaxBlur,
  onMinFocus,
  onMaxFocus,
}) => {
  const minError = error && error.includes('minimum') ? error : undefined;
  const maxError = error && error.includes('maximum') ? error : undefined;

  return (
    <div className={className}>
      <span className="block text-sm font-medium text-gray-700">
        Salary Range
        {required && <span className="text-red-500 ml-1">*</span>}
      </span>
      <div className="flex space-x-2 mt-1">
        <div className="flex-1">
          <TextInput
            id={minId}
            name={minName}
            type="number"
            placeholder={minPlaceholder}
            value={minValue}
            required={required}
            disabled={disabled}
            error={minError}
            onChange={onMinChange}
            onBlur={onMinBlur}
            onFocus={onMinFocus}
            min={0}
            step="1000"
            className="sr-only"
          />
          <label htmlFor={minId} className="sr-only">
            {minLabel}
          </label>
          <input
            id={minId}
            name={minName}
            type="number"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder={minPlaceholder}
            value={minValue}
            required={required}
            disabled={disabled}
            onChange={(e) => onMinChange?.(e.target.value === '' ? '' : Number(e.target.value))}
            onBlur={onMinBlur}
            onFocus={onMinFocus}
            min={0}
            step="1000"
          />
        </div>
        <div className="flex-1">
          <TextInput
            id={maxId}
            name={maxName}
            type="number"
            placeholder={maxPlaceholder}
            value={maxValue}
            required={required}
            disabled={disabled}
            error={maxError}
            onChange={onMaxChange}
            onBlur={onMaxBlur}
            onFocus={onMaxFocus}
            min={0}
            step="1000"
            className="sr-only"
          />
          <label htmlFor={maxId} className="sr-only">
            {maxLabel}
          </label>
          <input
            id={maxId}
            name={maxName}
            type="number"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder={maxPlaceholder}
            value={maxValue}
            required={required}
            disabled={disabled}
            onChange={(e) => onMaxChange?.(e.target.value === '' ? '' : Number(e.target.value))}
            onBlur={onMaxBlur}
            onFocus={onMaxFocus}
            min={0}
            step="1000"
          />
        </div>
      </div>
      {error && !minError && !maxError && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-2 text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default SalaryRangeInput;
