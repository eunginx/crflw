import React from 'react';

interface TextInputProps {
  id: string;
  name: string;
  label?: string;
  type?: 'text' | 'email' | 'tel' | 'number' | 'password';
  value?: string | number;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  onChange?: (value: string | number) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  autoComplete?: string;
  min?: number;
  max?: number;
  step?: string;
  rows?: number; // For textarea
}

const TextInput: React.FC<TextInputProps> = ({
  id,
  name,
  label,
  type = 'text',
  value = '',
  placeholder,
  required = false,
  disabled = false,
  error,
  helperText,
  className = '',
  onChange,
  onBlur,
  onFocus,
  autoComplete,
  min,
  max,
  step,
  rows,
}) => {
  const baseClasses = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500";
  const errorClasses = error ? "border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500" : "";
  const disabledClasses = disabled ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "";
  const combinedClasses = `${baseClasses} ${errorClasses} ${disabledClasses} ${className}`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value;
    onChange?.(newValue);
  };

  const inputElement = rows ? (
    <textarea
      id={id}
      name={name}
      rows={rows}
      className={combinedClasses}
      value={value}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      onChange={handleChange}
      onBlur={onBlur}
      onFocus={onFocus}
    />
  ) : (
    <input
      id={id}
      name={name}
      type={type}
      className={combinedClasses}
      value={value}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      onChange={handleChange}
      onBlur={onBlur}
      onFocus={onFocus}
      autoComplete={autoComplete}
      min={min}
      max={max}
      step={step}
    />
  );

  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {inputElement}
      {error && (
        <p className="mt-2 text-sm text-red-600" id={`${id}-error`}>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-2 text-sm text-gray-500" id={`${id}-helper`}>
          {helperText}
        </p>
      )}
    </div>
  );
};

export default TextInput;
