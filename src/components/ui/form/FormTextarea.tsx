import React from 'react';

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  textareaClassName?: string;
}

export function FormTextarea({
  label,
  required = false,
  error,
  helperText,
  textareaClassName = '',
  ...props
}: FormTextareaProps) {
  return (
    <FormField
      label={label}
      required={required}
      error={error}
      helperText={helperText}
    >
      <textarea
        className={`w-full px-3 py-2 border border-slate-300 rounded-md
                   focus:outline-none focus:ring-2 focus:ring-green-500/20
                   focus:border-green-500 ${textareaClassName}`}
        {...props}
      />
    </FormField>
  );
}