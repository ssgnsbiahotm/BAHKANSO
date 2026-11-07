import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DatePicker } from './DatePicker';

describe('DatePicker', () => {
  it('mode single : affiche label + input et appelle onChange', () => {
    const onChange = vi.fn();
    render(
      <DatePicker mode="single" label="Date" value={null} onChange={onChange} />,
    );
    expect(screen.getByLabelText('Date')).toBeInTheDocument();
    const input = document.querySelector('input[type="date"]');
    expect(input).not.toBeNull();

    fireEvent.change(input!, { target: { value: '2026-11-07' } });
    expect(onChange).toHaveBeenCalledWith('2026-11-07');
  });

  it('mode engagement-payment : affiche 2 inputs', () => {
    render(
      <DatePicker
        mode="engagement-payment"
        engagementDate={null}
        paymentDate={null}
        status="brouillon"
      />,
    );
    expect(screen.getByLabelText(/Date d'engagement/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Date de paiement/i)).toBeInTheDocument();
    const dateInputs = document.querySelectorAll('input[type="date"]');
    expect(dateInputs).toHaveLength(2);
  });

  it('statut payée + paymentDate vide : classe border-danger', () => {
    render(
      <DatePicker
        mode="engagement-payment"
        engagementDate="2026-11-01"
        paymentDate={null}
        status="payée"
      />,
    );
    const paymentInput = screen.getByLabelText(/Date de paiement/i);
    expect(paymentInput).toHaveClass('border-danger');
  });

  it('statut en_attente : pas de border-danger sur paymentDate', () => {
    render(
      <DatePicker
        mode="engagement-payment"
        engagementDate="2026-11-01"
        paymentDate={null}
        status="en_attente"
      />,
    );
    const paymentInput = screen.getByLabelText(/Date de paiement/i);
    expect(paymentInput).not.toHaveClass('border-danger');
  });
});
