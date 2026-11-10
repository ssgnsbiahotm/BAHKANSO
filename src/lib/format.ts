export function formatCurrency(amount: number | null | undefined, currency = 'FCFA'): string {
  if (amount === null || amount === undefined) return '—';
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return `${formatted} ${currency}`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('fr-FR').format(value);
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(date: string | null | undefined): string {
  if (!date) return '—';
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);
  if (diffMin < 1) return 'À l\'instant';
  if (diffMin < 60) return `Il y a ${diffMin} minutes`;
  if (diffH < 24) return `Il y a ${diffH} heures`;
  if (diffD < 30) return `Il y a ${diffD} jours`;
  return formatDate(date);
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

/**
 * Traduit le statut technique d'un animal (valeurs Zod/DB en anglais)
 * vers son libellé d'affichage en français.
 * Valeurs : healthy, sick, recovering, quarantined, sold, deceased, pregnant.
 */
export function getAnimalStatusLabel(status: string | null | undefined): string {
  if (!status) return '—';
  const labels: Record<string, string> = {
    healthy: 'Actif',
    sick: 'Malade',
    recovering: 'En soins',
    quarantined: 'Quarantaine',
    sold: 'Vendu',
    deceased: 'Décédé',
    pregnant: 'Gestante',
  };
  return labels[status] ?? status;
}

export function percentage(value: number, total: number): number {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Valide et parse une période 'YYYY-MM' en bornes de mois.
 * Retourne null si la période est mal formée (URL non sanitisée).
 * Règle : aucune période valide => bornes vides (no_data), jamais de date invalide propagée.
 */
export function parsePeriod(period: string): { periodStart: string; periodEnd: string } | null {
  const parts = period.split('-');
  if (parts.length !== 2 || parts[0].length !== 4 || parts[1].length !== 2) {
    return null;
  }
  if (parts.some((p) => Number.isNaN(Number(p)))) {
    return null;
  }
  const [y, m] = parts as [string, string];
  const year = Number(y);
  const month = Number(m);
  if (month < 1 || month > 12) {
    return null;
  }
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return {
    periodStart: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-01`,
    periodEnd: `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`,
  };
}
