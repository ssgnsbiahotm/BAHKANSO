// src/lib/images.ts
// Chemins centralisés des images BAHKANSO.
// Modifier ici pour changer la source d'une image sur l'ensemble du site.

export const IMAGES = {
  // Image principale du bandeau d'accueil (hero).
  // Fichier attendu : public/images/hero-projet.jpg
  // Si le fichier est manquant, un fallback propre est affiché.
  hero: '/images/hero-projet.jpg',

  // Logo de l'exploitation (utilisé si farm.logo_url est indisponible).
  logo: '/images/logo-bahkanso.svg',

  // Images d'illustration pour les activités (optionnelles).
  // Fichiers attendus : public/images/activite-elevage.jpg, etc.
  activiteElevage: '/images/activite-elevage.jpg',
  activiteCultures: '/images/activite-cultures.jpg',
  activiteTravaux: '/images/activite-travaux.jpg',
} as const;

export type ImageKey = keyof typeof IMAGES;
