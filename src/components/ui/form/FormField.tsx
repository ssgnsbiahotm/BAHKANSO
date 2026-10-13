import React from 'react';

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
}

export function FormField({
  label,
  children,
  className = '',
  required = false,
  error,
  helperText
}: FormFieldProps) {
  return (
    <div className={`mb-4 ${className}`}>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <div className="space-y-1">
        {children}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {helperText && <p className="text-xs text-slate-500">{helperText}</p>}
      </div>
    </div>
  );
}