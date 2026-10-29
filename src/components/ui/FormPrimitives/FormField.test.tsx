import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FormField, FormInput } from './index';

describe('FormField', () => {
  it('associe le libellé, le champ et le message d’erreur', () => {
    render(
      <FormField label="Nom" error="Le nom est obligatoire" required>
        <FormInput id="plot-name" value="" onChange={() => undefined} />
      </FormField>,
    );

    expect(screen.getByLabelText(/Nom/)).toHaveAttribute('id', 'plot-name');
    expect(screen.getByLabelText(/Nom/)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText(/Nom/)).toHaveAttribute(
      'aria-describedby',
      'plot-name-error',
    );
    expect(screen.getByRole('alert')).toHaveAttribute('id', 'plot-name-error');
  });
});
