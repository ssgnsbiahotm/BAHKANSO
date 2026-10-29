import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Modal } from './Modal';

describe('Modal', () => {
  it('expose une boîte de dialogue nommée et un bouton de fermeture accessible', () => {
    render(
      <Modal open onClose={() => undefined} title="Nouvelle parcelle">
        <p>Contenu</p>
      </Modal>,
    );

    expect(screen.getByRole('dialog', { name: 'Nouvelle parcelle' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fermer' })).toBeInTheDocument();
  });
});
