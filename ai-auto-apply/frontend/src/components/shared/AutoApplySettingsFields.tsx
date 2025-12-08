import React from 'react';
import { TextInput, CheckboxInput } from './index';

export interface AutoApplySettingsFormData {
  enableAutoApply: boolean;
  generateCoverLetters: boolean;
  applyRemoteOnly: boolean;
  maxApplicationsPerDay: number;
}

interface AutoApplySettingsFieldsProps {
  data: Partial<AutoApplySettingsFormData>;
  onChange: (field: keyof AutoApplySettingsFormData, value: boolean | number) => void;
  errors?: Partial<Record<keyof AutoApplySettingsFormData, string>>;
  disabled?: boolean;
  required?: Partial<Record<keyof AutoApplySettingsFormData, boolean>>;
  className?: string;
}

const AutoApplySettingsFields: React.FC<AutoApplySettingsFieldsProps> = ({
  data,
  onChange,
  errors,
  disabled = false,
  required = {},
  className = '',
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-4">
        <CheckboxInput
          id="enable-auto-apply"
          name="enable-auto-apply"
          label="Enable auto-apply"
          checked={data.enableAutoApply || false}
          disabled={disabled}
          error={errors?.enableAutoApply}
          onChange={(checked) => onChange('enableAutoApply', checked)}
          helperText="Automatically apply to jobs that match your preferences"
        />
        
        <CheckboxInput
          id="generate-cover-letters"
          name="generate-cover-letters"
          label="Generate custom cover letters"
          checked={data.generateCoverLetters || false}
          disabled={disabled || !data.enableAutoApply}
          error={errors?.generateCoverLetters}
          onChange={(checked) => onChange('generateCoverLetters', checked)}
          helperText="AI will generate personalized cover letters for each application"
        />
        
        <CheckboxInput
          id="apply-remote-only"
          name="apply-remote-only"
          label="Apply to remote-only jobs"
          checked={data.applyRemoteOnly || false}
          disabled={disabled || !data.enableAutoApply}
          error={errors?.applyRemoteOnly}
          onChange={(checked) => onChange('applyRemoteOnly', checked)}
          helperText="Only apply to positions that offer remote work options"
        />
      </div>
      
      <div>
        <TextInput
          id="max-applications-per-day"
          name="max-applications-per-day"
          label="Max applications per day"
          type="number"
          value={data.maxApplicationsPerDay || 50}
          required={required.maxApplicationsPerDay}
          disabled={disabled || !data.enableAutoApply}
          error={errors?.maxApplicationsPerDay}
          onChange={(value) => onChange('maxApplicationsPerDay', value as number)}
          min={1}
          max={100}
          helperText="Limit the number of applications sent per day to avoid overwhelming employers"
        />
      </div>
      
      {!data.enableAutoApply && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Auto-apply is currently disabled. Enable it above to configure automatic job applications.
          </p>
        </div>
      )}
    </div>
  );
};

export default AutoApplySettingsFields;
