import React from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  inputClassName?: string;
}

export function FormInput({
  label,
  required = false,
  error,
  helperText,
  inputClassName = '',
  ...props
}: FormInputProps) {
  return (
    <FormField
      label={label}
      required={required}
      error={error}
      helperText={helperText}
    >
      <input
        className={`w-full px-3 py-2 border border-slate-300 rounded-md
                   focus:outline-none focus:ring-2 focus:ring-green-500/20
                   focus:border-green-500 ${inputClassName}`}
        {...props}
      />
    </FormField>
  );
}