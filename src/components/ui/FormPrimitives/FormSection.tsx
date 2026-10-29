import { ReactNode } from 'react';

interface FormSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
}

export function FormSection({
  title,
  description,
  children,
  className = '',
  defaultOpen = true,
}: FormSectionProps) {
  if (!title) {
    return <div className={`space-y-4 ${className}`}>{children}</div>;
  }

  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <details className={`group ${className}`} open={defaultOpen}>
      <summary
        className="flex items-center justify-between cursor-pointer list-none px-1 py-2"
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">{title}</h3>
          {description && <span className="text-xs text-slate-400">({description})</span>}
        </div>
        <svg
          className="w-4 h-4 text-slate-400 transition-transform duration-200 group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div className="space-y-4 pt-2 border-t border-slate-100 animate-in fade-in-0 slide-in-from-top-2 duration-200">
        {children}
      </div>
    </details>
  );
}

import { useState } from 'react';