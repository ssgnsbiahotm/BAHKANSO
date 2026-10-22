import { useState, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';

interface AccordionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function Accordion({ title, defaultOpen = false, children }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  const toggle = useCallback(() => setOpen((prev) => !prev), []);

  return (
    <div className="border border-ivory-deep bg-ivory-alt rounded-sm overflow-hidden">
      <button
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-ink text-lg font-editorial transition-colors hover:bg-ivory-deep/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-1"
      >
        <span>{title}</span>
        <ChevronDown
          size={16}
          className={`text-ink-mut transition-transform duration-200 ease-out ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ease-out ${open ? 'max-h-64 opacity-100 mt-0' : 'max-h-0 opacity-0 mt-1'}`}
      >
        <div className="px-4 pb-4">{children}</div>
      </div>
    </div>
  );
}
