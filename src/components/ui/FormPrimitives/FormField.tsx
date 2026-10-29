import {
  cloneElement,
  forwardRef,
  isValidElement,
  InputHTMLAttributes,
  ReactElement,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  useId,
} from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, error, required, hint, children, className }, ref) => {
    const generatedId = useId();
    const child = isValidElement(children)
      ? (children as ReactElement<{ id?: string; error?: string; 'aria-describedby'?: string }>)
      : null;
    const inputId = child?.props.id || generatedId;
    const describedBy = error ? `${inputId}-error` : child?.props['aria-describedby'];

    return (
      <div ref={ref} className={`flex flex-col gap-1.5 ${className || ''}`}>
        <label htmlFor={inputId} className="text-xs font-medium text-slate-700 flex items-center gap-1">
          {label}
          {required && <span className="text-red-500" aria-hidden="true">*</span>}
          {hint && <span className="text-slate-400 ml-auto">{hint}</span>}
        </label>
        {child
          ? cloneElement(child, {
              id: inputId,
              error,
              'aria-describedby': describedBy,
            })
          : children}
        {error && <p id={`${inputId}-error`} className="text-xs text-red-500" role="alert">{error}</p>}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

export interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ error, className = '', ...props }, ref) => (
    <input
      ref={ref}
      className={`w-full px-3 py-2 bg-white border rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors ${
        error ? 'border-red-500' : 'border-slate-300'
      } ${className}`}
      aria-invalid={error ? 'true' : 'false'}
      aria-describedby={error ? `${props.id}-error` : undefined}
      {...props}
    />
  )
);

FormInput.displayName = 'FormInput';

export interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ error, className = '', ...props }, ref) => (
    <select
      ref={ref}
      className={`w-full px-3 py-2 bg-white border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors ${
        error ? 'border-red-500' : 'border-slate-300'
      } ${className}`}
      aria-invalid={error ? 'true' : 'false'}
      {...props}
    />
  )
);

FormSelect.displayName = 'FormSelect';

export interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ error, className = '', ...props }, ref) => (
    <textarea
      ref={ref}
      className={`w-full px-3 py-2 bg-white border rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors resize-y ${
        error ? 'border-red-500' : 'border-slate-300'
      } ${className}`}
      aria-invalid={error ? 'true' : 'false'}
      {...props}
    />
  )
);

FormTextarea.displayName = 'FormTextarea';