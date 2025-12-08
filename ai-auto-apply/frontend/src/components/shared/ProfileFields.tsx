import React from 'react';
import { TextInput } from './index';

export interface ProfileFormData {
  firstName: string;
  lastName: string;
  phone: string;
  location: string;
  headline: string;
  summary: string;
}

interface ProfileFieldsProps {
  data: Partial<ProfileFormData>;
  onChange: (field: keyof ProfileFormData, value: string) => void;
  errors?: Partial<Record<keyof ProfileFormData, string>>;
  disabled?: boolean;
  required?: Partial<Record<keyof ProfileFormData, boolean>>;
  className?: string;
}

const ProfileFields: React.FC<ProfileFieldsProps> = ({
  data,
  onChange,
  errors,
  disabled = false,
  required = {
    firstName: true,
    lastName: true,
    email: true,
  },
  className = '',
}) => {
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <TextInput
          id="first-name"
          name="first-name"
          label="First Name"
          type="text"
          value={data.firstName || ''}
          required={required.firstName}
          disabled={disabled}
          error={errors?.firstName}
          onChange={(value) => onChange('firstName', value as string)}
          autoComplete="given-name"
        />
        
        <TextInput
          id="last-name"
          name="last-name"
          label="Last Name"
          type="text"
          value={data.lastName || ''}
          required={required.lastName}
          disabled={disabled}
          error={errors?.lastName}
          onChange={(value) => onChange('lastName', value as string)}
          autoComplete="family-name"
        />
        
        <TextInput
          id="phone"
          name="phone"
          label="Phone"
          type="tel"
          value={data.phone || ''}
          disabled={disabled}
          error={errors?.phone}
          onChange={(value) => onChange('phone', value as string)}
          autoComplete="tel"
          placeholder="+1 (555) 123-4567"
        />
        
        <TextInput
          id="location"
          name="location"
          label="Location"
          type="text"
          value={data.location || ''}
          disabled={disabled}
          error={errors?.location}
          onChange={(value) => onChange('location', value as string)}
          autoComplete="address-level2"
          placeholder="e.g., San Francisco, CA"
        />
      </div>
      
      <div>
        <TextInput
          id="headline"
          name="headline"
          label="Professional Headline"
          type="text"
          value={data.headline || ''}
          disabled={disabled}
          error={errors?.headline}
          onChange={(value) => onChange('headline', value as string)}
          placeholder="e.g., Senior Software Engineer"
          helperText="Brief title that describes your professional role"
        />
      </div>
      
      <div>
        <TextInput
          id="summary"
          name="summary"
          label="Professional Summary"
          type="text"
          value={data.summary || ''}
          rows={4}
          disabled={disabled}
          error={errors?.summary}
          onChange={(value) => onChange('summary', value as string)}
          placeholder="e.g., Experienced software engineer with 5+ years in full-stack development..."
          helperText="A brief overview of your professional background and key achievements"
        />
      </div>
    </div>
  );
};

export default ProfileFields;
