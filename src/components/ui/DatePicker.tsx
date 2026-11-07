import { useMemo } from 'react';

export type DatePickerMode = 'single' | 'engagement-payment';

const REQUIRED_PAYMENT_STATUSES = new Set(['payée', 'justifiée', 'payee', 'justifiee']);
const DISABLED_PAYMENT_STATUSES = new Set(['annulée', 'annulee']);

export interface DatePickerProps {
  mode?: DatePickerMode;
  value?: string | null;
  onChange?: (value: string | null) => void;
  label?: string;
  engagementDate?: string | null;
  paymentDate?: string | null;
  onEngagementChange?: (value: string | null) => void;
  onPaymentChange?: (value: string | null) => void;
  status?: string;
  engagementLabel?: string;
  paymentLabel?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

const baseClasses =
  'w-full px-3 py-2 bg-bg-input border rounded-lg text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary transition-colors';

export function DatePicker({
  mode = 'single',
  value,
  onChange,
  label,
  engagementDate,
  paymentDate,
  onEngagementChange,
  onPaymentChange,
  status,
  engagementLabel = 'Date d\'engagement',
  paymentLabel = 'Date de paiement',
  error,
  disabled = false,
  className = '',
}: DatePickerProps) {
  const paymentRequired = useMemo(
    () => REQUIRED_PAYMENT_STATUSES.has(status || ''),
    [status],
  );
  const paymentDisabled = useMemo(
    () => DISABLED_PAYMENT_STATUSES.has(status || ''),
    [status],
  );

  if (mode === 'engagement-payment') {
    return (
      <div className={`flex flex-col gap-3 ${className}`}>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-secondary flex items-center gap-1">
            {engagementLabel}
            <span className="text-danger" aria-hidden="true">*</span>
          </label>
          <input
            type="date"
            value={engagementDate || ''}
            onChange={(e) => onEngagementChange?.(e.target.value || null)}
            disabled={disabled}
            className={`${baseClasses} ${error || !engagementDate ? 'border-danger' : 'border-default'}`}
            aria-label={engagementLabel}
            aria-required="true"
          />
          <p className="text-xs text-muted">
            Date de la facture ou du justificatif
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-secondary flex items-center gap-1">
            {paymentLabel}
            <span className={`text-${paymentRequired ? 'danger' : 'muted'}`} aria-hidden="true">
              *
            </span>
            {paymentRequired === false && <span className="text-muted">(optionnel)</span>}
          </label>
          <input
            type="date"
            value={paymentDate || ''}
            onChange={(e) => onPaymentChange?.(e.target.value || null)}
            disabled={disabled || paymentDisabled}
            className={`${baseClasses} ${
              (paymentRequired && !paymentDate) || error ? 'border-danger' : 'border-default'
            } ${disabled || paymentDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={paymentLabel}
            aria-required={paymentRequired ? 'true' : 'false'}
            aria-disabled={paymentDisabled ? 'true' : 'false'}
          />
          <p className="text-xs">
            {paymentDisabled
              ? 'Désactivée (annulée)'
              : paymentRequired
              ? 'Requis (payée)'
              : 'Optionnel'}
          </p>
        </div>
      </div>
    );
  }

  // mode 'single'
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-medium text-secondary">
          {label}
        </label>
      )}
      <input
        type="date"
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value || null)}
        disabled={disabled}
        className={`${baseClasses} ${error || !value ? 'border-danger' : 'border-default'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label={label}
        aria-required="true"
      />
    </div>
  );
}
