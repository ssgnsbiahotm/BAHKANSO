import { ReactNode } from 'react';
import { Modal } from '@/components/ui/Modal';

interface DetailModalProps<T> {
  entity: T | null;
  onClose: () => void;
  onEdit?: (entity: T) => void;
  onDelete?: (entity: T) => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  renderFields: (entity: T) => ReactNode;
  footer?: ReactNode;
  editLabel?: string;
  deleteLabel?: string;
}

export function DetailModal<T>({
  entity,
  onClose,
  onEdit,
  onDelete,
  title = 'Détails',
  size = 'lg',
  renderFields,
  footer,
  editLabel = 'Modifier',
  deleteLabel = 'Supprimer',
}: DetailModalProps<T>) {
  if (!entity) return null;

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={title}
      size={size}
      footer={
        footer || (
          <>
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">
              Fermer
            </button>
            {onDelete && (
              <button
                onClick={() => onDelete(entity)}
                className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
              >
                {deleteLabel}
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(entity)}
                className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                {editLabel}
              </button>
            )}
          </>
        )
      }
    >
      <div className="space-y-4">{renderFields(entity)}</div>
    </Modal>
  );
}