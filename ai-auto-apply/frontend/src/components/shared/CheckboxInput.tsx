import React from 'react';

interface CheckboxInputProps {
  id: string;
  name: string;
  label: string;
  checked?: boolean;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  onChange?: (checked: boolean) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

const CheckboxInput: React.FC<CheckboxInputProps> = ({
  id,
  name,
  label,
  checked = false,
  required = false,
  disabled = false,
  error,
  helperText,
  className = '',
  onChange,
  onBlur,
  onFocus,
}) => {
  const baseClasses = "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded";
  const errorClasses = error ? "border-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500" : "";
  const disabledClasses = disabled ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "";
  const combinedClasses = `${baseClasses} ${errorClasses} ${disabledClasses} ${className}`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.checked);
  };

  return (
    <div className="flex items-start">
      <div className="flex items-center h-5">
        <input
          id={id}
          name={name}
          type="checkbox"
          className={combinedClasses}
          checked={checked}
          required={required}
          disabled={disabled}
          onChange={handleChange}
          onBlur={onBlur}
          onFocus={onFocus}
        />
      </div>
      <div className="ml-3 text-sm">
        <label htmlFor={id} className="font-medium text-gray-900">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {helperText && !error && (
          <p className="text-gray-500">{helperText}</p>
        )}
        {error && (
          <p className="mt-1 text-red-600" id={`${id}-error`}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default CheckboxInput;
