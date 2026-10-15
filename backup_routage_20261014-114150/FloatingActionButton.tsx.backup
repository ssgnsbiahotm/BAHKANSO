import { useState } from 'react';
import { Plus, Receipt, FileText, Sprout, Package, Beef, HardHat, X } from 'lucide-react';

interface FabProps {
  onAction: (action: string) => void;
}

const ACTIONS = [
  { id: 'expense', label: 'Dépense', icon: <Receipt size={18} />, color: 'bg-green-600' },
  { id: 'document', label: 'Justificatif', icon: <FileText size={18} />, color: 'bg-blue-600' },
  { id: 'activity', label: 'Activité', icon: <Sprout size={18} />, color: 'bg-amber-600' },
  { id: 'stock', label: 'Stock', icon: <Package size={18} />, color: 'bg-purple-600' },
  { id: 'animal', label: 'Animal', icon: <Beef size={18} />, color: 'bg-rose-600' },
  { id: 'project', label: 'Projet', icon: <HardHat size={18} />, color: 'bg-cyan-600' },
];

export function FloatingActionButton({ onAction }: FabProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-30 lg:hidden">
      {open && (
        <div className="absolute bottom-16 right-0 space-y-2">
          {ACTIONS.map(a => (
            <button
              key={a.id}
              onClick={() => { onAction(a.id); setOpen(false); }}
              className="flex items-center gap-3 pl-3 pr-4 py-2.5 bg-white rounded-full shadow-lg border border-slate-200 hover:shadow-xl transition-shadow"
            >
              <span className={`w-8 h-8 ${a.color} rounded-full flex items-center justify-center text-white`}>
                {a.icon}
              </span>
              <span className="text-sm font-medium text-slate-700">{a.label}</span>
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className={`w-14 h-14 bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center transition-transform ${open ? 'rotate-45' : ''}`}
      >
        {open ? <X size={24} /> : <Plus size={24} />}
      </button>
    </div>
  );
}
