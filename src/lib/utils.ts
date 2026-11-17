import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extrait un message lisible d'une erreur attrapée (catch).
 * Les erreurs Supabase sont des objets simples `{ message }`, non des instances d'Error :
 * on évite donc `instanceof Error` qui masquerait le vrai message (CLAUDE.md §10).
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const message = (err as { message: unknown }).message;
    return typeof message === 'string' ? message : String(message);
  }
  return String(err);
}
