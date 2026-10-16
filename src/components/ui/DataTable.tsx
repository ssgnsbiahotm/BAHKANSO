import { useState, useMemo, useCallback } from 'react';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { EmptyState } from '@/components/ui/EmptyState';

// Export du type Column qui était manquant
export interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  sortValue?: (row: T) => unknown;
  render: (row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string | number;
}

interface DataTableState {
  sortedColumn: any;
  sortDirection: 'asc' | 'desc';
  searchTerm: string;
  currentPage: number;
  pageSize: number;
}

/**
 * Composant de tableau de données avec tri, recherche et pagination côté client
 * Contrat rétabli pour être compatible avec l'usage existant dans les pages Documents, Expenses, Fundings
 */
export function DataTable<T = any>({
  columns,
  data,
  rowKey,
  searchable = false,
  searchKeys,
  onRowClick,
  pageSize = 10,
}: {
  columns: Column<T>[];
  data: T[];
  rowKey: (item: T) => string | number;
  searchable?: boolean;
  searchKeys: (item: T) => string;
  onRowClick: (item: T) => void;
  pageSize?: number;
}) {
  const [state, setState] = useState<DataTableState>({
    sortedColumn: null,
    sortDirection: 'asc',
    searchTerm: '',
    currentPage: 1,
    pageSize,
  });

  // Données filtrées par recherche
  const filteredData = useMemo(() => {
    if (!searchable || !state.searchTerm.trim()) {
      return data;
    }

    const searchTerm = state.searchTerm.toLowerCase().trim();
    return data.filter(item => {
      const keys = searchKeys(item);
      return keys.toLowerCase().includes(searchTerm);
    });
  }, [data, searchable, state.searchTerm, searchKeys]);

  // Données triées
  const sortedData = useMemo(() => {
    if (!state.sortedColumn || !filteredData.length) {
      return filteredData;
    }

    return [...filteredData].sort((a, b) => {
      // Trouver la définition de la colonne pour ce tri
      const columnDef = columns.find(col =>
        (typeof col.key === 'string' && col.key === String(state.sortedColumn)) ||
        (typeof col.key !== 'string' && col.key === state.sortedColumn as keyof T)
      );

      if (!columnDef) return 0;

      // Utiliser sortValue si fourni, sinon accéder directement à la propriété
      const getValue = (item: T) => {
        if (columnDef.sortValue) {
          return columnDef.sortValue(item);
        }

        // Accès direct à la propriété (avec gestion de sécurité pour les accès en chaîne)
        const key = state.sortedColumn as keyof T;
        return item[key];
      };

      const valueA = getValue(a);
      const valueB = getValue(b);

      // Gestion des valeurs nulles ou undefined
      if (valueA === null || valueA === undefined) return -1;
      if (valueB === null || valueB === undefined) return 1;
      if (valueA === '' && valueB === '') return 0;

      // Tri sécurisé selon le type
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return state.sortDirection === 'asc'
          ? valueA.localeCompare(valueB)
          : -valueA.localeCompare(valueB);
      }

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return state.sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
      }

      // Fallback pour autres types (boolean, etc.)
      return state.sortDirection === 'asc'
        ? (valueA > valueB ? 1 : -1)
        : (valueA > valueB ? -1 : 1);
    });
  }, [filteredData, state.sortedColumn, state.sortDirection, columns]);

  // Données paginées (côté client)
  const paginatedData = useMemo(() => {
    const startIndex = (state.currentPage - 1) * state.pageSize;
    const endIndex = startIndex + state.pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, state.currentPage, state.pageSize]);

  // Calcul du nombre total de pages
  const totalPages = Math.max(1, Math.ceil(sortedData.length / state.pageSize));

  // Fonction utilitaire pour le tri
  const handleSort = useCallback((key: keyof T | string) => {
    setState(prev => {
      if (prev.sortedColumn === key) {
        return {
          ...prev,
          sortDirection: prev.sortDirection === 'asc' ? 'desc' : 'asc',
        };
      }
      return {
        ...prev,
        sortedColumn: key,
        sortDirection: 'asc',
        currentPage: 1, // Retour à la première page lors de nouveau tri
      };
    });
  }, []);

  // Fonction utilitaire pour la gestion de la recherche
  const handleSearchChange = useCallback((term: string) => {
    setState(prev => ({
      ...prev,
      searchTerm: term,
      currentPage: 1, // Retour à la première page lors de nouvelle recherche
    }));
  }, []);

  // Fonction utilitaire pour la gestion de la pagination
  const handlePageChange = useCallback((page: number) => {
    setState(prev => ({
      ...prev,
      currentPage: page,
    }));
  }, []);

  // Fonction utilitaire pour la gestion de la taille de page
  const handlePageSizeChange = useCallback((pageSize: number) => {
    setState(prev => ({
      ...prev,
      pageSize,
      currentPage: 1, // Retour à la première page lors de changement de taille de page
    }));
  }, []);

  // État de chargement simulé (pour cohérence avec l'UI précédente)
  const isLoading = false; // Les données sont déjà chargées côté client
  const isError = false;

  if (isLoading && !(sortedData.length > 0)) {
    // État de chargement initial avec squelettes
    return (
      <div className="space-y-4">
        <div className="grid gap-4">
          {/* Générer des squelettes pour l'en-tête */}
          <div className="grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
            {columns.map((_, index) => (
              <SkeletonLoader
                key={`header-${index}`}
                type="rectangle"
                width="100%"
                height="1.5rem"
                count={1}
              />
            ))}
          </div>

          {/* Générer des squelettes pour les lignes */}
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, rowIndex) => (
              <div key={`row-${rowIndex}`} className="grid gap-2">
                {columns.map((_, colIndex) => (
                  <SkeletonLoader
                    key={`cell-${rowIndex}-${colIndex}`}
                    type="rectangle"
                    width="100%"
                    height="1.5rem"
                    count={1}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-red-500 text-center">
        Erreur de chargement: Quelque chose s'est mal passé
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (sortedData.length === 0) {
    return (
      <EmptyState
      title="Aucune donnée disponible"
      message={
        state.searchTerm.trim()
          ? `Aucun résultat trouvé pour "${state.searchTerm}"`
          : 'Aucune donnée disponible.'
      }
     />
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête du tableau avec contrôles de recherche et de tri */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        {/* Champs de recherche */}
        {searchable && (
          <div className="flex-1 mb-2 sm:mb-0">
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Rechercher
            </label>
            <input
              type="text"
              value={state.searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Rechercher dans les colonnes..."
            />
          </div>
        )}

        {/* Informations sur le nombre de résultats */}
        <div className="text-sm text-slate-600">
          {sortedData.length} résultat{sortedData.length !== 1 ? 's' : ''} affiché{sortedData.length !== 1 ? 's' : ''} sur {data.length} total{data.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* En-tête du tableau */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50">
              {columns.map((col, index) => (
                <th
                  key={index}
                  className={`
                    px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider
                    ${!col.sortable ? '' : 'cursor-pointer'}
                    ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}
                    ${typeof col.width === 'number' ? `w-[${col.width}px]` : col.width ? `w-[${col.width}]` : ''}
                  `}
                  onClick={() => !col.sortable ? null : handleSort(col.key as keyof T | string)}
                >
                  <div className="flex items-center justify-between">
                    <span>{col.label}</span>
                    {col.sortable && (
                      <span className="ml-2 text-xs">
                        {state.sortedColumn === col.key && (
                          state.sortDirection === 'asc' ? '↑' : '↓'
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, rowIndex) => (
              <tr
                key={rowKey(row)}
                className={`${rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-slate-100`}
                onClick={() => onRowClick(row)}
              >
                {columns.map((col, colIndex) => (
                  <td
                    key={colIndex}
                    className={[
                      'px-4 py-2 text-sm text-slate-700',
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-right',
                      !col.align || col.align === 'left' ? 'text-left' : '',
                      typeof col.width === 'number' ? `w-[${col.width}px]` : col.width ? `w-[${col.width}]` : ''
                    ].filter(Boolean).join(' ')}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Contrôles de pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4">
        <div className="flex items-center space-x-3 text-sm text-slate-600">
          <button
            onClick={() => handlePageChange(Math.max(1, state.currentPage - 1))}
            disabled={state.currentPage <= 1}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded disabled:opacity-50"
          >
            Précédent
          </button>
          <span>
            Page {state.currentPage} sur {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(Math.min(totalPages, state.currentPage + 1))}
            disabled={state.currentPage >= totalPages}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded disabled:opacity-50"
          >
            Suivant
          </button>
        </div>

        <div className="mt-2 sm:mt-0 flex items-center space-x-3">
          <label className="text-sm text-slate-600">Lignes par page:</label>
          <select
            value={state.pageSize}
            onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
            className="px-3 py-1 border border-slate-300 rounded bg-white text-sm"
          >
            {[10, 20, 50, 100].map(size => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
