
CREATE TABLE IF NOT EXISTS site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site content"
  ON site_content FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated can insert site content"
  ON site_content FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update site content"
  ON site_content FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete site content"
  ON site_content FOR DELETE
  TO authenticated
  USING (true);

INSERT INTO site_content (key, value) VALUES
('branding', '{"logoIcon":"Sprout","logoColor":"#16A34A","logoBgColor":"#16A34A","appName":"Bahkanso","appTagline":"Pilotage agro-pastoral","footerText":"Bahkanso v1.0","footerSubtext":"Ferme AgroVision"}'::jsonb),
('hero', '{"badge":"Plateforme de gouvernance agro-pastorale","title":"Pilotez vos investissements agro-pastoraux en toute transparence","highlight":"transparence","subtitle":"Bahkanso connecte l argent, les opérations, les preuves et les résultats. Suivez chaque franc investi, depuis le financement jusqu au résultat sur le terrain, avec une traçabilité complète et des justificatifs vérifiables.","ctaPrimary":"Découvrir la plateforme","ctaSecondary":"Se connecter","trustBadges":["Données sécurisées","Accès multi-rôles","Piste d audit"]}'::jsonb),
('heroCard', '{"label":"Trésorerie disponible","value":"12 450 000 FCFA","trend":"+12%","items":[{"label":"Financé","value":"25M"},{"label":"Dépensé","value":"14.8M"},{"label":"Restant","value":"10.1M"}],"lines":[{"text":"DEP-2026-00428 — Alimentation bovins","value":"125 000"},{"text":"DEP-2026-00427 — Engrais NPK","value":"280 000"},{"text":"Forage d eau — Progression","value":"100%"}]}'::jsonb),
('stats', '[{"value":"100%","label":"Traçabilité financière"},{"value":"7","label":"Modules métier intégrés"},{"value":"24/7","label":"Accès depuis partout"},{"value":"0","label":"Dépense non justifiée"}]'::jsonb),
('features', '[{"icon":"Wallet","title":"Traçabilité des financements","desc":"Suivez chaque transfert de l envoi à la réception, avec frais, taux de change et justificatifs bancaires."},{"icon":"FileText","title":"Justificatifs vérifiables","desc":"Chaque dépense peut être documentée : factures, reçus, bons de livraison, photos terrain."},{"icon":"HardHat","title":"Pilotage des chantiers","desc":"Budget vs réel, progression par étape, photos et documents pour chaque projet d investissement."},{"icon":"Beef","title":"Suivi du cheptel","desc":"Gestion individuelle ou par lot : santé, vaccinations, naissances, ventes et valeur du cheptel."},{"icon":"Sprout","title":"Gestion agricole","desc":"Parcelles, campagnes, opérations culturales et récoltes avec calcul des rendements."},{"icon":"Package","title":"Contrôle des stocks","desc":"Inventaire en temps réel, mouvements tracés, alertes de stock faible et écarts d inventaire."}]'::jsonb),
('featuresSection', '{"title":"Une plateforme, tous vos besoins","subtitle":"Sept modules intégrés qui partagent les mêmes données pour une vision complète de votre exploitation."}'::jsonb),
('workflow', '{"title":"La chaîne de traçabilité complète","subtitle":"De l argent envoyé au résultat obtenu, chaque maillon est relié et vérifiable.","steps":[{"icon":"Wallet","label":"Financement"},{"icon":"Check","label":"Réception"},{"icon":"BarChart3","label":"Affectation"},{"icon":"FileText","label":"Dépense"},{"icon":"ScrollText","label":"Justificatif"},{"icon":"Sprout","label":"Activité"},{"icon":"TrendingUp","label":"Résultat"}]}'::jsonb),
('roles', '{"title":"Conçu pour tous les acteurs","subtitle":"Chaque rôle voit exactement ce dont il a besoin, ni plus, ni moins.","list":["Propriétaires d exploitation","Investisseurs & financeurs","Gestionnaires de ferme","Comptables","Responsables agricoles","Responsables élevage","Responsables chantier","Auditeurs"]}'::jsonb),
('cta', '{"title":"Prêt à reprendre le contrôle de votre exploitation ?","subtitle":"Accédez à la plateforme dès maintenant avec les données de démonstration.","primary":"Accéder à la plateforme","secondary":"Se connecter"}'::jsonb),
('footer', '{"description":"Plateforme de gestion, de traçabilité et de pilotage des investissements agro-pastoraux. Conçue pour les exploitations financées à distance.","modulesTitle":"Modules","modules":["Financements & Trésorerie","Dépenses & Justificatifs","Agriculture & Élevage","Projets & Stocks"],"securityTitle":"Sécurité","security":[{"icon":"Shield","text":"Row Level Security"},{"icon":"ScrollText","text":"Piste d audit"},{"icon":"Users","text":"Contrôle d accès RBAC"},{"icon":"Bell","text":"Alertes intelligentes"}],"copyright":"© 2026 Bahkanso — Tous droits réservés"}'::jsonb),
('login', '{"title":"Reprenez le contrôle de votre exploitation","subtitle":"Suivez chaque franc investi, depuis le financement jusqu au résultat sur le terrain. Traçabilité complète, justificatifs vérifiables, pilotage en temps réel.","benefits":["Traçabilité financière de bout en bout","Justificatifs photographiques et documents","Alertes intelligentes sur anomalies","Piste d audit immuable"],"quote":"Bahkanso m a permis de suivre mes investissements à distance avec une confiance que je n avais jamais eue.","quoteAuthor":"Propriétaire d exploitation, Côte d Ivoire"}'::jsonb)
ON CONFLICT (key) DO NOTHING;
