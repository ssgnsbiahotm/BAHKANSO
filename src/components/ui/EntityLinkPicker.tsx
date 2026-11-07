import { useMemo } from 'react';
import { Plus, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { EntityPicker, EntityType } from './EntityPicker';

export interface EntityLink {
  id?: string;
  entity_type: EntityType;
  entity_id: string;
  amount_allocated: number;
  percent_allocated?: number;
  note?: string;
}

export interface EntityLinkPickerProps {
  links: EntityLink[];
  onChange: (links: EntityLink[]) => void;
  totalAmount: number;
  currency?: string;
  allowedTypes: EntityType[];
  disabled?: boolean;
  className?: string;
}

const ENTITY_LABELS: Record<EntityType, string> = {
  plot: 'Parcelle',
  campaign: 'Campagne',
  animal: 'Animal',
  animal_lot: 'Lot',
  project: 'Projet',
  supplier: 'Fournisseur',
  site: 'Site',
  customer: 'Client',
  funder: 'Bailleur',
};

export function EntityLinkPicker({
  links,
  onChange,
  totalAmount,
  currency = 'XOF',
  allowedTypes,
  disabled = false,
  className = '',
}: EntityLinkPickerProps) {
  const totalAllocated = useMemo(
    () => links.reduce((sum, l) => sum + (Number(l.amount_allocated) || 0), 0),
    [links],
  );

  const diff = totalAmount - totalAllocated;
  const isBalanced = totalAmount > 0 && Math.abs(diff) < 0.01;
  const isOver = totalAmount > 0 && diff < -0.01;

  const handleAdd = () => {
    if (allowedTypes.length === 0) return;
    onChange([
      ...links,
      { entity_type: allowedTypes[0], entity_id: '', amount_allocated: 0 },
    ]);
  };

  const handleUpdate = (idx: number, patch: Partial<EntityLink>) => {
    onChange(links.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const handleRemove = (idx: number) => {
    onChange(links.filter((_, i) => i !== idx));
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-secondary">Liens métier</span>
        <span className={`text-xs font-medium ${isBalanced ? 'text-success' : isOver ? 'text-danger' : 'text-warning'}`}>
          {links.length} lien{links.length > 1 ? 's' : ''} ·
          {totalAllocated.toLocaleString('fr-FR')} / {totalAmount.toLocaleString('fr-FR')} {currency}
        </span>
      </div>

      {links.length === 0 ? (
        <p className="text-xs text-muted text-center py-4">
          Aucun lien. Cliquez sur « Ajouter » pour lier cette transaction à une ou plusieurs entités.
        </p>
      ) : (
        <div className="border border-default rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-surface-hover text-muted border-b border-default">
                <th className="px-3 py-2 w-1/4">Type</th>
                <th className="px-3 py-2 w-5/12">Entité</th>
                <th className="px-3 py-2 w-1/6">Montant ({currency})</th>
                <th className="px-3 py-2 w-1/12">%</th>
                <th className="px-3 py-2 w-1/24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {links.map((link, idx) => {
                const pct =
                  totalAmount > 0
                    ? ((Number(link.amount_allocated) / totalAmount) * 100)
                    : 0;
                return (
                  <tr key={link.id ?? idx} className="hover:bg-surface-hover">
                    <td className="px-3 py-2">
                      <select
                        value={link.entity_type}
                        onChange={(e) =>
                          handleUpdate(idx, {
                            entity_type: e.target.value as EntityType,
                            entity_id: '',
                          })
                        }
                        disabled={disabled}
                        className="w-full px-2 py-1 bg-bg-input border rounded text-primary text-sm"
                      >
                        {allowedTypes.map((t) => (
                          <option key={t} value={t}>
                            {ENTITY_LABELS[t]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <EntityPicker
                        label=""
                        entityType={link.entity_type}
                        value={link.entity_id || null}
                        onChange={(id) => handleUpdate(idx, { entity_id: id || '', amount_allocated: link.amount_allocated })}
                        placeholder="Sélectionner…"
                        disabled={disabled}
                        className="w-full"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={link.amount_allocated || ''}
                        onChange={(e) =>
                          handleUpdate(idx, { amount_allocated: Number(e.target.value) || 0 })
                        }
                        disabled={disabled}
                        className="w-full px-3 py-2 bg-bg-input border border-default rounded-lg text-primary focus:ring-2 focus:ring-accent-primary/20"
                        placeholder="0"
                        aria-label={`Montant alloué ${ENTITY_LABELS[link.entity_type]}`}
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        pct > 0 ? 'bg-surface-hover text-primary' : 'bg-muted text-muted'
                      }`}>
                        {pct.toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemove(idx)}
                        disabled={disabled}
                        aria-label="Supprimer le lien"
                        className="text-muted hover:text-danger transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <button
        type="button"
        onClick={handleAdd}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-primary bg-surface-hover hover:bg-surface-hover-light border border-default rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
      >
        <Plus size={16} />
        Ajouter un lien
      </button>

      {totalAmount > 0 && links.length > 0 && (
        <div
          className={`mt-2 p-2 rounded-lg text-xs flex items-center gap-2 ${
            isBalanced
              ? 'bg-success-soft text-success border border-success/20'
              : isOver
              ? 'bg-danger-soft text-danger border border-danger/20'
              : 'bg-warning-soft text-warning border border-warning/20'
          }`}
          role="alert"
          aria-live="polite"
        >
          {isBalanced ? (
            <>
              <CheckCircle2 size={14} />
              <span>Répartition cohérente : {totalAllocated.toLocaleString('fr-FR')} {currency}</span>
            </>
          ) : isOver ? (
            <>
              <AlertCircle size={14} />
              <span>
                Total alloué dépasse le montant (dépassement : {Math.abs(diff).toLocaleString('fr-FR')} {currency})
              </span>
            </>
          ) : (
            <>
              <AlertCircle size={14} />
              <span>Reste non alloué : {diff.toLocaleString('fr-FR')} {currency}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
