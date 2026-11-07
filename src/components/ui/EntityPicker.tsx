import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  FocusEvent,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
} from 'react';
import { useData } from '@/lib/DataContext';
type EntityId = string;

export type EntityType =
  | 'funder'
  | 'supplier'
  | 'site'
  | 'plot'
  | 'campaign'
  | 'animal'
  | 'animal_lot'
  | 'project'
  | 'customer';

export interface EntityOption {
  id: string;
  label: string;
  entityType: EntityType;
}

export interface EntityPickerProps {
  label: string;
  entityType: EntityType;
  value: EntityId | null;
  onChange: (id: EntityId | null) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

const ENTITY_SOURCE_BY_TYPE: Record<EntityType, string> = {
  funder: 'funders',
  supplier: 'suppliers',
  site: 'sites',
  plot: 'plots',
  campaign: 'campaigns',
  animal: 'animals',
  animal_lot: 'animalLots',
  project: 'projects',
  customer: 'customers',
};

const DEBOUNCE_MS = 150;
const MAX_RESULTS = 50;

function normalizeOption(item: unknown, entityType: EntityType): EntityOption | null {
  const row = item as { id?: string; name?: string; identifier?: string; reference?: string; year?: number; crop_name?: string };
  if (!row || typeof row !== 'object' || !row.id) return null;

  let label: string;
  switch (entityType) {
    case 'campaign':
      label = `${row.year || ''} ${row.crop_name || ''}`.trim() || String(row.id);
      break;
    case 'animal':
    case 'animal_lot':
      label = (row.identifier || row.name || String(row.id)).toString();
      break;
    case 'plot':
      label = (row.reference || row.name || String(row.id)).toString();
      break;
    default:
      label = (row.name || String(row.id)).toString();
  }

  return { id: row.id, label, entityType };
}

export function EntityPicker({
  label,
  entityType,
  value,
  onChange,
  placeholder = 'Rechercher…',
  error,
  disabled = false,
  required,
  className = '',
}: EntityPickerProps) {
  const data = useData();
  const sourceKey = ENTITY_SOURCE_BY_TYPE[entityType];
  const source = (data as unknown as Record<string, unknown[]>)[sourceKey];
  const items: readonly unknown[] = Array.isArray(source) ? source : [];

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selected = useMemo<EntityOption | null>(() => {
    if (!value) return null;
    const match = items.find((item) => normalizeOption(item, entityType)?.id === value);
    return match ? normalizeOption(match, entityType) : null;
  }, [value, items, entityType]);

  const filtered = useMemo<EntityOption[]>(() => {
    const q = query.toLowerCase().trim();
    return items
      .map((item) => normalizeOption(item, entityType))
      .filter((opt): opt is EntityOption => opt !== null)
      .filter((opt) => !q || opt.label.toLowerCase().includes(q))
      .slice(0, MAX_RESULTS);
  }, [items, query, entityType]);

  const close = useCallback(() => {
    setIsOpen(false);
    setHighlighted(-1);
  }, []);

  const select = useCallback(
    (opt: EntityOption) => {
      setQuery(opt.label);
      onChange(opt.id);
      close();
    },
    [onChange, close],
  );

  const clear = useCallback((e: ReactMouseEvent) => {
    e.stopPropagation();
    setQuery('');
    onChange(null);
    close();
    inputRef.current?.focus();
  }, [onChange, close]);

  // Debounced open on input change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!disabled && query.trim().length > 0) {
      debounceRef.current = setTimeout(() => setIsOpen(true), DEBOUNCE_MS);
    } else if (query.trim().length === 0) {
      setIsOpen(false);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, disabled]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
      if (!disabled && e.target.value.trim().length > 0) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    },
    [disabled],
  );

  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
        setHighlighted((prev) => (prev >= filtered.length - 1 ? 0 : prev + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlighted((prev) => (prev <= 0 ? filtered.length - 1 : prev - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (isOpen && highlighted >= 0 && filtered[highlighted]) {
          select(filtered[highlighted]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        close();
      } else if (e.key === 'Tab') {
        close();
      }
    },
    [isOpen, highlighted, filtered, select, close],
  );

  const handleBlur = useCallback(
    (e: FocusEvent<HTMLInputElement>) => {
      // Delay close to allow click on an option to register
      setTimeout(() => {
        if (listboxRef.current && !listboxRef.current.contains(e.relatedTarget as Node | null)) {
          close();
        }
      }, 150);
    },
    [close],
  );

  const handleMouseDown = useCallback(
    (e: ReactMouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setIsOpen(!isOpen);
        if (!isOpen) inputRef.current.focus();
      }
    },
    [isOpen],
  );

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target as Node) &&
        listboxRef.current &&
        !listboxRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [close]);

  const inputId = `entity-picker-${entityType}`;
  const listboxId = `${inputId}-listbox`;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={inputId} className="text-xs font-medium text-secondary flex items-center gap-1">
        {label}
        {required && <span className="text-danger" aria-hidden="true">*</span>}
      </label>
      <div className="relative w-full">
        <input
          ref={inputRef}
          id={inputId}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={isOpen ? listboxId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={isOpen && highlighted >= 0 ? `${listboxId}-${highlighted}` : undefined}
          aria-invalid={error ? 'true' : 'false'}
          value={selected?.label || query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={() => {
            if (!disabled && query.trim().length > 0) setIsOpen(true);
          }}
          disabled={disabled}
          className={`w-full px-3 py-2 bg-bg-input border rounded-lg text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary transition-colors ${
            error ? 'border-danger' : 'border-default'
          }`}
          placeholder={placeholder}
        />
        {selected && !disabled && !error && (
          <button
            type="button"
            onClick={clear}
            aria-label="Effacer la sélection"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-danger transition-colors"
          >
            ×
          </button>
        )}
        {isOpen && !disabled && (
          <ul
            ref={listboxRef}
            id={listboxId}
            role="listbox"
            className="absolute z-20 w-full mt-1 bg-bg-input border border-default rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {filtered.length === 0 ? (
              <li role="option" className="px-3 py-2 text-xs text-muted">
                Aucun résultat
              </li>
            ) : (
              filtered.map((opt, idx) => {
                const active = highlighted === idx;
                return (
                  <li
                    key={opt.id}
                    role="option"
                    id={`${listboxId}-${idx}`}
                    aria-selected={active}
                    onClick={() => select(opt)}
                    className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                      active
                        ? 'bg-surface-hover text-primary'
                        : 'text-primary/70 hover:bg-surface-hover hover:text-primary'
                    }`}
                  >
                    {opt.label}
                  </li>
                );
              })
            )}
          </ul>
        )}
        {error && <p id={`${inputId}-error`} className="text-xs text-danger" role="alert">{error}</p>}
      </div>
    </div>
  );
}
