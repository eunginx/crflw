import React from 'react';
import { TextInput, SalaryRangeInput } from './index';

export interface JobPreferenceFormData {
  keywords: string;
  locations: string;
  salaryMin: string | number;
  salaryMax: string | number;
}

interface JobPreferenceFieldsProps {
  data: Partial<JobPreferenceFormData>;
  onChange: (field: keyof JobPreferenceFormData, value: string | number) => void;
  errors?: Partial<Record<keyof JobPreferenceFormData, string>>;
  disabled?: boolean;
  required?: Partial<Record<keyof JobPreferenceFormData, boolean>>;
  className?: string;
}

const JobPreferenceFields: React.FC<JobPreferenceFieldsProps> = ({
  data,
  onChange,
  errors,
  disabled = false,
  required = {},
  className = '',
}) => {
  const validateSalaryRange = (min: string | number, max: string | number): string | undefined => {
    const minNum = typeof min === 'string' ? parseFloat(min) : min;
    const maxNum = typeof max === 'string' ? parseFloat(max) : max;
    
    if (!isNaN(minNum) && !isNaN(maxNum) && minNum > 0 && maxNum > 0 && minNum > maxNum) {
      return 'Minimum salary cannot be greater than maximum salary';
    }
    
    return undefined;
  };

  const salaryError = validateSalaryRange(data.salaryMin || '', data.salaryMax || '');

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <TextInput
          id="keywords"
          name="keywords"
          label="Keywords"
          type="text"
          value={data.keywords || ''}
          required={required.keywords}
          disabled={disabled}
          error={errors?.keywords}
          onChange={(value) => onChange('keywords', value as string)}
          placeholder="e.g., Software Engineer, React, TypeScript"
          helperText="Comma-separated list of skills, technologies, and job titles you're interested in"
        />
      </div>
      
      <div>
        <TextInput
          id="locations"
          name="locations"
          label="Locations"
          type="text"
          value={data.locations || ''}
          required={required.locations}
          disabled={disabled}
          error={errors?.locations}
          onChange={(value) => onChange('locations', value as string)}
          placeholder="e.g., San Francisco, Remote, New York"
          helperText="Comma-separated list of preferred locations. Include 'Remote' for remote positions"
        />
      </div>
      
      <SalaryRangeInput
        minId="salary-min"
        maxId="salary-max"
        minName="salary-min"
        maxName="salary-max"
        minValue={data.salaryMin || ''}
        maxValue={data.salaryMax || ''}
        required={required.salaryMin || required.salaryMax}
        disabled={disabled}
        error={salaryError || errors?.salaryMin || errors?.salaryMax}
        helperText="Set your salary expectations. Leave blank if you're open to offers"
        onMinChange={(value) => onChange('salaryMin', value)}
        onMaxChange={(value) => onChange('salaryMax', value)}
      />
    </div>
  );
};

export default JobPreferenceFields;
