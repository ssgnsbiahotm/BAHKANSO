import { X } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';

interface SaleDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: {
    id: string;
    reference: string | null;
    date: string;
    status: string | null;
    payment_method: string | null;
    total_amount: number;
    customer: { name: string | null; type: string | null } | null;
    site: { name: string | null; code: string | null } | null;
    items: Array<{
      id: string;
      description: string | null;
      quantity: number;
      unit: string | null;
      unit_price: number;
      total: number;
    }>;
  } | null;
}

export function SaleDetailsModal({
  isOpen,
  onClose,
  sale,
}: SaleDetailsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-slate-900">Détails de la vente</h2>
            {sale?.reference && (
              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                #{sale.reference}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Date</p>
              <p className="text-slate-900">{sale ? formatDate(sale.date) : '—'}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Client</p>
              <p className="text-slate-900">{sale?.customer?.name || '—'}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Site</p>
              <p className="text-slate-900">{sale?.site?.name || '—'}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Mode de paiement</p>
              <p className="text-slate-900 capitalize">{sale?.payment_method || 'espèces'}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Statut</p>
              <p className="text-slate-900 capitalize">{sale?.status || 'en attente'}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total</p>
              <p className="text-lg font-bold text-slate-900">{sale ? formatCurrency(sale.total_amount) : '—'}</p>
            </div>
          </div>

          {/* Articles */}
          <div className="border-t border-slate-200 pt-4">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">Articles</p>
            {sale && sale.items && sale.items.length > 0 ? (
              <div className="space-y-2">
                {sale.items.map((item, i) => (
                  <div key={item.id || i} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{item.description || 'Article'}</p>
                      <p className="text-xs text-slate-500">
                        {item.quantity} {item.unit || ''} × {formatCurrency(item.unit_price)}
                      </p>
                    </div>
                    <p className="font-semibold text-slate-900 ml-4 whitespace-nowrap">
                      {formatCurrency(item.total)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">Aucun article</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
