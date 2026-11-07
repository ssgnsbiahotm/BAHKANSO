import { useEffect } from 'react';
import { Lock } from 'lucide-react';
import { useSite } from '@/lib/SiteContext';

export interface SiteFieldProps {
  value: string | null | undefined;
  onChange: (id: string | null) => void;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  label?: string;
  hint?: string;
  className?: string;
}

export function SiteField({
  value,
  onChange,
  required = false,
  error,
  disabled = false,
  label = 'Site',
  hint,
  className = '',
}: SiteFieldProps) {
  const { availableSites: sites, currentSiteId } = useSite();

  useEffect(() => {
    if (!value && sites.length === 1) {
      onChange(sites[0].id);
    } else if (!value && currentSiteId && sites.length > 1) {
      onChange(currentSiteId);
    }
  }, [value, sites, currentSiteId, onChange]);

  // Cas D : aucun site
  if (sites.length === 0) {
    return (
      <div className={className}>
        <label className="block text-xs font-medium text-secondary mb-1">{label}</label>
        <input
          disabled
          value=""
          placeholder="Aucun site disponible"
          className="w-full px-3 py-2 bg-bg-input border border-default rounded-lg text-muted opacity-50 cursor-not-allowed"
        />
        <p className="text-xs text-warning mt-1">
          Créez un site dans Configuration → Sites
        </p>
      </div>
    );
  }

  // Cas A : mono-site readonly
  if (sites.length === 1) {
    return (
      <div className={className}>
        <label className="block text-xs font-medium text-secondary mb-1 flex items-center gap-1">
          {label}
          <Lock size={12} className="text-muted" />
        </label>
        <input
          readOnly
          value={sites[0].name}
          className="w-full px-3 py-2 bg-bg-input/50 border border-default rounded-lg text-primary cursor-not-allowed"
        />
        <p className="text-xs text-muted mt-1">
          {hint ?? 'Site unique : verrouillé automatiquement'}
        </p>
      </div>
    );
  }

  // Cas B + C : select multi
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-secondary mb-1">
        {label}
        {required && <span className="text-danger">*</span>}
      </label>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={disabled}
        className={`w-full px-3 py-2 bg-bg-input border rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary transition-colors ${
          error ? 'border-danger' : 'border-default'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <option value="">— Choisir un site —</option>
        {sites.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}{s.code ? ` — ${s.code}` : ''}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
      {hint && !error && <p className="text-xs text-muted mt-1">{hint}</p>}
    </div>
  );
}
