import React from 'react';

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  selectClassName?: string;
  options: Array<{ value: string | number | boolean; label: string }>;
}

export function FormSelect({
  label,
  required = false,
  error,
  helperText,
  selectClassName = '',
  options,
  ...props
}: FormSelectProps) {
  return (
    <FormField
      label={label}
      required={required}
      error={error}
      helperText={helperText}
    >
      <select
        className={`w-full px-3 py-2 border border-slate-300 rounded-md
                   focus:outline-none focus:ring-2 focus:ring-green-500/20
                   focus:border-green-500 ${selectClassName}`}
        {...props}
      >
        <option value="">Sélectionner une option</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}