import React from 'react';

interface FormSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({
  title,
  children,
  className = ''
}: FormSectionProps) {
  return (
    <section className={`mb-6 ${className}`}>
      {title && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </section>
  );
}