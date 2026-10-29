import { FormEvent } from 'react';

interface FormActionsProps {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  className?: string;
}

export function FormActions({
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Enregistrer',
  cancelLabel = 'Annuler',
  className = '',
}: FormActionsProps) {
  return (
    <div className={`flex items-center justify-end gap-3 pt-4 border-t border-slate-200 ${className}`}>
      <button
        type="button"
        onClick={onCancel}
        disabled={isSubmitting}
        className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
      >
        {cancelLabel}
      </button>
      <button
        type="submit"
        form={undefined}
        onClick={(e) => {
          e.preventDefault();
          const form = e.currentTarget.closest('form');
          if (form) {
            const event = new Event('submit', { bubbles: true, cancelable: true });
            Object.defineProperty(event, 'target', { value: form });
            Object.defineProperty(event, 'currentTarget', { value: form });
            onSubmit(event as unknown as FormEvent<HTMLFormElement>);
          }
        }}
        disabled={isSubmitting}
        className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Enregistrement...
          </>
        ) : (
          submitLabel
        )}
      </button>
    </div>
  );
}