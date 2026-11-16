import { useState } from 'react';
import { useData } from '@/lib/DataContext';
import { type Media } from '@/lib/types';
import { Plus, X, Image as ImageIcon, EyeOff, Check } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

interface MediaPickerProps {
  value: string[];
  onChange: (val: string[]) => void;
  isAuthorized: boolean;
}

export function MediaPicker({ value, onChange, isAuthorized }: MediaPickerProps) {
  const { media } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUrls, setSelectedUrls] = useState(new Set(value.filter(Boolean)));

  const imageMedia = media.filter((m): m is Media & { url: string } =>
    m.type === 'image' && m.url != null
  );

  const toggleSelection = (url: string) => {
    const next = new Set(selectedUrls);
    if (next.has(url)) next.delete(url);
    else next.add(url);
    setSelectedUrls(next);
  };

  const isSelected = (url: string) => selectedUrls.has(url);

  const removeUrl = (url: string) => {
    const next = new Set(selectedUrls);
    next.delete(url);
    setSelectedUrls(next);
  };

  const confirmSelection = () => {
    onChange(Array.from(selectedUrls));
    setModalOpen(false);
  };

  const selectedMedia = imageMedia.filter(m => isSelected(m.url));

  return (
    <div className="space-y-3">
      {/* Images sélectionnées en ligne */}
      <div className="flex flex-wrap gap-2">
        {selectedMedia.length === 0 && (
          <div className="p-4 bg-ivory rounded-sm text-center text-ink-mut text-sm">
            Aucune image sélectionnée.
          </div>
        )}
        {selectedMedia.map(m => (
          <div key={m.id} className="relative flex-shrink-0 group">
            <img
              src={m.url}
              alt={m.name}
              className="w-16 h-16 object-cover rounded-sm border border-default"
            />
            <button
              onClick={() => removeUrl(m.url)}
              disabled={!isAuthorized}
              className="absolute -top-1 -right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 disabled:opacity-50 disabled:pointer-events-none transition-colors"
              aria-label={`Retirer ${m.name}`}
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={() => setModalOpen(true)}
        disabled={!isAuthorized}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-accent-primary text-white rounded-sm hover:bg-accent-primary-hover disabled:opacity-50 transition-colors"
      >
        <Plus size={16} />
        {selectedMedia.length > 0 ? 'Modifier la sélection' : 'Choisir dans la médiathèque'}
      </button>

      {/* Modal de sélection */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Sélectionner des photos pour le flux social"
        size="lg"
        footer={
          <>
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm text-ink-mut hover:bg-surface-hover rounded-lg"
            >
              Annuler
            </button>
            <button
              onClick={confirmSelection}
              disabled={!isAuthorized || selectedUrls.size === 0}
              className="px-4 py-2 text-sm bg-success text-white rounded-lg hover:bg-success-disabled disabled:opacity-50"
            >
              Confirmer ({selectedUrls.size})
            </button>
          </>
        }
      >
        {imageMedia.length === 0 ? (
          <div className="p-6 bg-ivory rounded-sm text-center text-ink-mut">
            <ImageIcon size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucune photo disponible dans la médiathèque.</p>
            <p className="text-xs text-ink-dim mt-1">
              Ajoutez d'abord des images via le module Médias.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-medium text-ink-mut uppercase tracking-wider mb-3">
              Photos disponibles ({imageMedia.length})
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {imageMedia.map(m => {
                const sel = isSelected(m.url);
                return (
                  <div key={m.id} className="relative group cursor-pointer" onClick={() => toggleSelection(m.url)}>
                    <img
                      src={m.url}
                      alt={m.name}
                      className="w-full h-24 object-cover rounded-sm border-2 transition-all"
                      style={{
                        borderColor: sel ? 'var(--color-accent-primary)' : 'var(--color-border-default)',
                        opacity: sel ? 1 : 0.7,
                      }}
                    />
                    {sel && (
                      <div className="absolute -top-2 -right-2 bg-success text-white rounded-full p-1">
                        <Check size={14} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-sm">
                      <EyeOff size={16} className="text-white" />
                    </div>
                    <p className="text-xs text-ink-mut mt-1 line-clamp-1 text-center">{m.name}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
