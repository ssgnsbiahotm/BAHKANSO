import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Wallet, List, Plus } from 'lucide-react';
import { KpiCard } from '@/components/ui/KpiCard';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { ValidatedForm } from '@/components/ui/ValidatedForm';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import type { Funding } from '@/lib/types';
import { useFundings } from '@/modules/Finance/hooks/useFinanceData';

interface FundingsTabProps {
  fundingsData: ReturnType<typeof useFundings>;
}

const fundingSchema = z.object({
  reference: z.string().min(1, 'Référence obligatoire'),
  funder_id: z.string().min(1, 'Financeur obligatoire'),
  amount_sent: z.number().nonnegative('Montant envoyé invalide'),
  currency_sent: z.string().min(1, 'Devise obligatoire'),
  amount_received: z.number().nonnegative().nullable(),
  date_sent: z.string().min(1, 'Date d\'envoi obligatoire'),
  status: z.string().min(1, 'Statut obligatoire'),
  comment: z.string().nullable(),
});

interface FundingFormValues {
  reference: string;
  funder_id: string;
  amount_sent: number;
  currency_sent: string;
  amount_received: number | null;
  date_sent: string;
  status: string;
  comment: string | null;
}

export const FundingsTab = ({ fundingsData }: FundingsTabProps) => {
  const { data, loading, error, refetch } = fundingsData;
  const { executeAction, loading: actionLoading } = useAsyncAction();
  const [modalOpen, setModalOpen] = useState(false);

  const form = ValidatedForm<FundingFormValues>({
    schema: fundingSchema,
    defaultValues: {
      reference: '',
      funder_id: '',
      amount_sent: 0,
      currency_sent: 'FCFA',
      amount_received: null,
      date_sent: new Date().toISOString().slice(0, 16),
      status: 'prévu',
      comment: null,
    },
    onSubmit: async (values) => {
      await executeAction(async () => {
        const { error: insertError } = await supabase
          .from('fundings')
          .insert([{
            reference: values.reference,
            funder_id: values.funder_id,
            amount_sent: values.amount_sent,
            currency_sent: values.currency_sent,
            amount_received: values.amount_received,
            date_sent: values.date_sent,
            status: values.status,
            comment: values.comment,
          }]);
        if (insertError) throw insertError;
      }, {
        successMessage: 'Financement créé avec succès',
        errorMessage: 'Échec de la création du financement',
        onSuccess: () => {
          setModalOpen(false);
          refetch();
        },
      });
    },
  });

  const handleNewFunding = () => {
    form.resetForm();
    setModalOpen(true);
  };

  if (loading) return <div className="text-center py-10">Chargement...</div>;
  if (error) return <div className="text-center py-10 text-red-500">Erreur lors du chargement des données</div>;

  const rows = data ?? [];

  const totalRecu = rows.reduce((sum, f) => sum + (f.amount_received ?? 0), 0);
  const totalEnvoye = rows.reduce((sum, f) => sum + f.amount_sent, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Financements" value={String(totalRecu)} icon={<Wallet size={20} />} trend={5} />
        <KpiCard label="Envoyé" value={String(totalEnvoye)} icon={<TrendingUp size={20} />} trend={3} />
        <KpiCard label="Reçu" value={String(totalRecu)} icon={<TrendingDown size={20} />} trend={3} />
        <KpiCard label="Financements" value={String(rows.length)} icon={<List size={20} />} trend={0} />
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleNewFunding}
          disabled={actionLoading || form.isSubmitting}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {actionLoading || form.isSubmitting ? 'Chargement...' : 'Nouveau financement'}
        </button>
      </div>

      <DataTable
        columns={[
          { key: 'date_sent', label: 'Date', render: (row: Funding) => row.date_sent },
          { key: 'reference', label: 'Référence', render: (row: Funding) => row.reference ?? '-' },
          { key: 'funder.name', label: 'Financeur', render: (row: Funding) => row.funder?.name ?? '-' },
          { key: 'amount_sent', label: 'Montant Envoyé', render: (row: Funding) => `${row.amount_sent} ${row.currency_sent}`, align: 'right' },
          { key: 'amount_received', label: 'Montant Reçu', render: (row: Funding) => row.amount_received != null ? `${row.amount_received}` : '-', align: 'right' },
          { key: 'currency_sent', label: 'Devise', render: (row: Funding) => row.currency_sent },
          { key: 'status', label: 'Statut', render: (row: Funding) => row.status },
          { key: 'comment', label: 'Commentaire', render: (row: Funding) => row.comment ?? '-' },
        ]}
        data={rows}
        rowKey={(row: Funding) => row.id}
        searchKeys={(row: Funding) => `${row.reference ?? ''} ${row.funder?.name ?? ''} ${row.comment ?? ''}`}
        onRowClick={() => {}}
        pageSize={10}
      />

      {/* Modal FundingCreate — création d'un financement */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nouveau financement"
        size="md"
      >
        <form onSubmit={form.handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Référence *</label>
            <input
              type="text"
              value={form.values.reference}
              onChange={(e) => form.setFieldValue('reference', e.target.value)}
              className="form-input w-full"
              placeholder="FIN-2024-0001"
            />
            {form.errors.reference && <p className="text-xs text-red-500 mt-1">{form.errors.reference}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Financeur *</label>
            <input
              type="text"
              value={form.values.funder_id}
              onChange={(e) => form.setFieldValue('funder_id', e.target.value)}
              className="form-input w-full"
              placeholder="ID du financeur"
            />
            {form.errors.funder_id && <p className="text-xs text-red-500 mt-1">{form.errors.funder_id}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Montant Envoyé *</label>
              <input
                type="number"
                value={form.values.amount_sent}
                onChange={(e) => form.setFieldValue('amount_sent', parseFloat(e.target.value) || 0)}
                className="form-input w-full"
              />
              {form.errors.amount_sent && <p className="text-xs text-red-500 mt-1">{form.errors.amount_sent}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Devise *</label>
              <input
                type="text"
                value={form.values.currency_sent}
                onChange={(e) => form.setFieldValue('currency_sent', e.target.value)}
                className="form-input w-full"
                placeholder="FCFA"
              />
              {form.errors.currency_sent && <p className="text-xs text-red-500 mt-1">{form.errors.currency_sent}</p>}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Montant Reçu</label>
            <input
              type="number"
              value={form.values.amount_received ?? ''}
              onChange={(e) => form.setFieldValue('amount_received', e.target.value ? parseFloat(e.target.value) : null)}
              className="form-input w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Date d'envoi *</label>
              <input
                type="datetime-local"
                value={form.values.date_sent}
                onChange={(e) => form.setFieldValue('date_sent', e.target.value)}
                className="form-input w-full"
              />
              {form.errors.date_sent && <p className="text-xs text-red-500 mt-1">{form.errors.date_sent}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Statut *</label>
              <select
                value={form.values.status}
                onChange={(e) => form.setFieldValue('status', e.target.value)}
                className="form-input w-full"
              >
                <option value="prévu">Prévu</option>
                <option value="envoyé">Envoyé</option>
                <option value="en transit">En transit</option>
                <option value="reçu">Reçu</option>
                <option value="partiellement reçu">Partiellement reçu</option>
                <option value="annulé">Annulé</option>
              </select>
              {form.errors.status && <p className="text-xs text-red-500 mt-1">{form.errors.status}</p>}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Commentaire</label>
            <input
              type="text"
              value={form.values.comment ?? ''}
              onChange={(e) => form.setFieldValue('comment', e.target.value || null)}
              className="form-input w-full"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!form.isValid || form.isSubmitting}
              className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
            >
              {form.isSubmitting ? 'Enregistrement...' : 'Créer le financement'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
