import { ReactNode } from 'react';
import { Modal } from '@/components/ui/Modal';

interface ConfirmDeleteModalProps<T> {
  entity: T | null;
  onConfirm: () => void;
  onClose: () => void;
  getEntityName: (entity: T) => string;
  title?: string;
  description?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function ConfirmDeleteModal<T>({
  entity,
  onConfirm,
  onClose,
  getEntityName,
  title = 'Confirmer la suppression',
  description,
  size = 'sm',
}: ConfirmDeleteModalProps<T>) {
  if (!entity) return null;

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={title}
      size={size}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm text-secondary hover:bg-surface-hover rounded-lg">
            Annuler
          </button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm bg-danger text-white rounded-lg hover:bg-danger">
            Supprimer
          </button>
        </>
      }
    >
      {description || (
        <p className="text-sm text-secondary">
          Voulez-vous vraiment supprimer « {getEntityName(entity)} » ? Cette action est irréversible.
        </p>
      )}
    </Modal>
  );
}