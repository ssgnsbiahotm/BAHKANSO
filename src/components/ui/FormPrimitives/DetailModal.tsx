import { ReactNode } from 'react';
import { Modal } from '@/components/ui/Modal';
import { STATUS_CLASS_DANGER } from '@/lib/constants';

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
            <button onClick={onClose} className="px-4 py-2 text-sm text-secondary hover:bg-surface-hover rounded-lg">
              Fermer
            </button>
            {onDelete && (
              <button
                onClick={() => onDelete(entity)}
                className={`px-4 py-2 text-sm ${STATUS_CLASS_DANGER.split(' ')[1]} border border-default rounded-lg hover:bg-danger-soft`}
              >
                {deleteLabel}
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(entity)}
                className="px-4 py-2 text-sm text-secondary border border-default rounded-lg hover:bg-surface-hover"
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