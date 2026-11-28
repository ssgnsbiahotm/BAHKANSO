export const LANDING_ACTIVITIES = [
  {
    id: '01',
    title: 'Cultures',
    desc: 'Suivi des semis à la récolte, parcelle par parcelle, avec saisie terrain en temps réel.',
    link: 'Voir le suivi des cultures',
    href: '/app/exploitation',
    icon: '🌱',
    color: 'var(--color-grass)',
  },
  {
    id: '02',
    title: 'Élevage',
    desc: 'Alimentation, état de santé et événements de chaque animal, tracés dans le temps.',
    link: 'Voir le suivi d\'élevage',
    href: '/app/livestock',
    icon: '🐄',
    color: 'var(--color-terra)',
  },
  {
    id: '03',
    title: 'Travaux',
    desc: "Suivi des chantiers d'aménagements et d'infrastructures, de la planification à la réception.",
    link: 'Voir les chantiers',
    href: '/app/projects',
    icon: '🏗️',
    color: 'var(--color-sky)',
  },
];

export const LANDING_PILLARS = [
  { id: '01', title: 'Traçabilité complète', desc: 'Chaque dépense, saisie et décision est horodatée et attribuée.' },
  { id: '02', title: 'Équipe synchronisée', desc: 'Terrain et responsable à distance travaillent sur les mêmes données.' },
  { id: '03', title: 'Sécurité des données', desc: 'Authentification, permissions et audit intègres, hébergement maîtrisé.' },
  { id: '04', title: 'Pilotage par indicateurs', desc: 'Tableaux de bord automatiques, alertes seuls, exports pour le décideur.' },
];

export const LANDING_SUIVI_STEPS = [
  { id: '01', title: 'Planification', desc: "Définition des objectifs, budgétisation et calendrier prévisionnel avec l'équipe terrain." },
  { id: '02', title: 'Financement', desc: 'Envoi des fonds par le responsable à distance, traçabilité bancaire et notification instantanée.' },
  { id: '03', title: 'Exécution', desc: 'Réalisation des opérations sur le terrain, saisie en temps réel, photos et justificatifs.' },
  { id: '04', title: 'Reporting', desc: 'Tableaux de bord automatiques, alertes seuls, exports PDF pour le responsable à distance.' },
];
