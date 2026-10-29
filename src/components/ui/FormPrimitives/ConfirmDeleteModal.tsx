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
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">
            Annuler
          </button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">
            Supprimer
          </button>
        </>
      }
    >
      {description || (
        <p className="text-sm text-slate-600">
          Voulez-vous vraiment supprimer « {getEntityName(entity)} » ? Cette action est irréversible.
        </p>
      )}
    </Modal>
  );
}