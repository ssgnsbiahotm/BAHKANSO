import { useEffect, useState, useMemo } from 'react';
import { useData } from '@/lib/DataContext';
import { Logo } from '@/components/ui/Logo';

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const { farm } = useData();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const heroImage = "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2000&auto=format&fit=crop";

  return (
    <div className="bg-ivory min-h-screen font-sans">
      {/* HEADER */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-ivory/95 backdrop-blur-md border-b border-ink/10 shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <a href="/" className="flex items-center gap-3">
            {farm?.logo_url ? (
              <img
                src={farm.logo_url}
                alt="Bahkanso"
                className={`h-10 w-auto ${!scrolled ? 'brightness-0 invert' : ''}`}
              />
            ) : (
              <span className={`font-editorial text-2xl font-bold ${scrolled ? 'text-night' : 'text-ivory'}`}>
                BAHKANSO
              </span>
            )}
          </a>
          <nav className="hidden md:flex gap-8">
            {['Le projet', 'Nos activités', 'Notre suivi'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(' ', '-')}`}
                className={`text-sm font-medium transition-colors ${scrolled ? 'text-ink hover:text-terra' : 'text-ivory/90 hover:text-ivory'}`}
              >
                {item}
              </a>
            ))}
          </nav>
        </div>
      </header>

      {/* HERO IMMERSIF */}
      <section
        style={{
          position: 'relative',
          minHeight: '90vh',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#111A18',
          backgroundImage: `url("${heroImage}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(17,26,24,0.95), rgba(17,26,24,0.5))', zIndex: 1 }}></div>
        <div className="container mx-auto px-6 relative" style={{ zIndex: 2 }}>
          <div className="max-w-3xl">
            <p className="text-ivory/70 font-mono text-sm tracking-widest uppercase mb-6">Plateforme de gouvernance agro-pastorale</p>
            <h1 className="text-ivory font-editorial text-5xl md:text-7xl leading-[1.1] mb-6">
              Pilotez vos investissements agro-pastoraux en toute transparence
            </h1>
            <p className="text-ivory/80 text-lg md:text-xl max-w-[60ch] mb-10">
              Bahkanso connecte les opérations, les preuves et les résultats. Suivez chaque franc investi, depuis le financement jusqu'au résultat sur le terrain.
            </p>
            <a href="/login" className="inline-flex items-center justify-center px-8 py-4 bg-terra text-ivory font-medium rounded hover:bg-terra/90 transition-colors">
              Découvrir la plateforme
            </a>
          </div>
        </div>
      </section>

      {/* NOS ACTIVITÉS (Asymétrique) */}
      <section id="nos-activites" className="py-24 md:py-32 bg-ivory">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-5">
              <p className="text-ink/50 font-mono text-sm uppercase tracking-wider mb-4">Nos activités</p>
              <h2 className="font-editorial text-4xl md:text-5xl text-ink leading-tight mb-6">Ce qui fait vivre l'exploitation</h2>
              <p className="text-ink-mut text-lg mb-8 max-w-[45ch]">
                Trois métiers, une même exigence de traçabilité : les cultures, l'élevage et les aménagements sont pilotés depuis la même plateforme, par la même équipe, avec les mêmes données.
              </p>
            </div>
            <div className="lg:col-span-7">
              {[
                { id: '01', title: 'Cultures', desc: 'Suivi des semis à la récolte, parcelle par parcelle, avec saisie terrain en temps réel.', link: 'Voir Cultures', href: '/app/agriculture' },
                { id: '02', title: 'Élevage', desc: 'Alimentation, état de santé et événements de chaque animal, tracés dans le temps.', link: 'Voir Élevage', href: '/app/livestock' },
                { id: '03', title: 'Travaux', desc: "Suivi des chantiers d'aménagements et d'infrastructures, de la planification à la réception.", link: 'Voir Travaux', href: '/app/projects' },
              ].map((item, i) => (
                <div key={item.id} className={`py-8 ${i !== 0 ? 'border-t border-ink/10' : ''} flex flex-col md:flex-row gap-6 md:gap-12 group`}>
                  <span className="font-mono text-sm text-ink/40 mt-1">{item.id}</span>
                  <div className="flex-1">
                    <h3 className="font-sans font-medium text-xl text-ink mb-2">{item.title}</h3>
                    <p className="text-ink-mut mb-4">{item.desc}</p>
                    <a href={item.href} className="text-sm font-medium text-signal group-hover:text-terra transition-colors inline-flex items-center gap-2">
                      {item.link} <span className="text-lg">→</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* POURQUOI BAHKANSO (Bande sombre) */}
      <section id="pourquoi" className="py-24 md:py-32 bg-night text-ivory">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mb-16">
            <p className="text-ivory/50 font-mono text-sm uppercase tracking-wider mb-4">Pourquoi Bahkanso</p>
            <h2 className="font-editorial text-4xl md:text-5xl leading-tight">Quatre piliers pour un pilotage serein</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
            {[
              { id: '01', title: 'Traçabilité complète', desc: 'Chaque dépense, saisie et décision est horodatée et attribuée.' },
              { id: '02', title: 'Équipe synchronisée', desc: 'Terrain et responsable à distance travaillent sur les mêmes données.' },
              { id: '03', title: 'Sécurité des données', desc: 'Authentification, permissions et audit intègres, hébergement maîtrisé.' },
              { id: '04', title: 'Pilotage par indicateurs', desc: 'Tableaux de bord automatiques, alertes seuls, exports pour le décideur.' },
            ].map((item, i) => (
              <div key={item.id} className={`pt-6 ${i % 2 !== 0 ? 'md:border-l md:border-ivory/15 md:pl-12' : ''}`}>
                <span className="font-mono text-sm text-terra mb-3 block">{item.id}</span>
                <h3 className="font-sans font-medium text-xl mb-2">{item.title}</h3>
                <p className="text-ivory/70">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NOTRE SUIVI (Timeline) */}
      <section id="notre-suivi" className="py-24 md:py-32 bg-night text-ivory border-t border-ivory/10">
        <div className="container mx-auto px-6">
          <div className="mb-16">
            <p className="text-ivory/50 font-mono text-sm uppercase tracking-wider mb-4">Notre suivi</p>
            <h2 className="font-editorial text-4xl md:text-5xl leading-tight">Transparence et traçabilité<br/>à chaque étape</h2>
          </div>
          <div className="max-w-2xl ml-4 md:ml-12 border-l border-ivory/20 relative">
            {[
              { id: '01', title: 'Planification', desc: "Définition des objectifs, budgétisation et calendrier prévisionnel avec l'équipe terrain." },
              { id: '02', title: 'Financement', desc: 'Envoi des fonds par le responsable à distance, traçabilité bancaire et notification instantanée.' },
              { id: '03', title: 'Exécution', desc: 'Réalisation des opérations sur le terrain, saisie en temps réel, photos et justificatifs.' },
              { id: '04', title: 'Reporting', desc: 'Tableaux de bord automatiques, alertes seuls, exports PDF pour le responsable à distance.' },
            ].map((step) => (
              <div key={step.id} className="relative pl-10 pb-12 last:pb-0">
                <div className="absolute -left-[21px] top-1 w-10 h-10 rounded-full bg-night border border-ivory/20 flex items-center justify-center">
                  <span className="font-mono text-sm text-terra">{step.id}</span>
                </div>
                <h3 className="font-sans font-medium text-xl mb-2">{step.title}</h3>
                <p className="text-ivory/70 max-w-[55ch]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NOTRE PROJET (Éditorial sans image répétée) */}
      <section id="le-projet" className="py-24 md:py-32 bg-ivory">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-ink/50 font-mono text-sm uppercase tracking-wider mb-4">Notre projet</p>
              <h2 className="font-editorial text-4xl md:text-5xl text-ink leading-tight mb-8">Une plateforme pour piloter l'exploitation</h2>
              <p className="text-ink-mut text-lg mb-6">
                BAHKANSO centralise le suivi des financements, des dépenses, des activités d'élevage et de culture, ainsi que des chantiers, afin que chaque acteur dispose d'une information commune et à jour.
              </p>
              <div className="space-y-6 mt-12">
                <div>
                  <h4 className="font-sans font-medium text-ink mb-2">Objectif</h4>
                  <p className="text-ink-mut text-sm">Centraliser le suivi des financements, des dépenses, des activités d'élevage et de culture, ainsi que des chantiers, afin que chaque acteur dispose d'une information commune et à jour.</p>
                </div>
                <div>
                  <h4 className="font-sans font-medium text-ink mb-2">Organisation</h4>
                  <p className="text-ink-mut text-sm">L'équipe de terrain gère les activités sur place. Le responsable à distance envoie les fonds et suit l'avancement depuis l'espace privé de l'application.</p>
                </div>
              </div>
            </div>
            <div className="bg-ivory-deep/30 p-8 rounded-lg">
              <p className="text-ink/50 font-mono text-sm uppercase tracking-wider mb-6">Fonctionnalités opérationnelles</p>
              <ul className="space-y-4">
                {[
                  { title: 'Suivi des parcelles', desc: 'Gestion parcelle par parcelle : semis, intrants, récoltes, rendements.' },
                  { title: 'Campagnes culturales', desc: 'Planification, budgets, exécution et clôture de chaque campagne.' },
                  { title: 'Cheptel & santé animale', desc: 'Inventaire animaux, alimentation, traitements, événements de vie.' },
                  { title: 'Dépenses & financements', desc: 'Traçabilité complète des flux : envois fonds, achats, justificatifs.' },
                  { title: 'Ventes & commercialisation', desc: 'Enregistrement des ventes, prix, acheteurs, facturation.' },
                  { title: 'Chantiers & infrastructures', desc: "Suivi des travaux d'aménagement, de la planification à la réception." },
                ].map((feat, i) => (
                  <li key={i} className="border-t border-ink/10 pt-4 first:border-0 first:pt-0">
                    <h4 className="font-sans font-medium text-ink text-sm mb-1">{feat.title}</h4>
                    <p className="text-ink-mut text-xs">{feat.desc}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT / CONCLUSION */}
      <section id="contact" className="py-24 md:py-32 bg-ivory border-t border-ink/10">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl flex flex-col items-start text-left">
            <h2 className="font-editorial text-4xl md:text-5xl text-ink leading-tight mb-6">
              Suivez l'exploitation en temps réel
            </h2>
            <p className="text-ink-mut text-lg mb-10 max-w-2xl">
              BAHKANSO centralise le suivi des financements, des dépenses, de l'élevage, des cultures et des chantiers — une information commune, à jour, partagée entre le terrain et le responsable à distance.
            </p>
            <a href="/login" className="inline-flex items-center justify-center px-8 py-4 bg-terra text-ivory font-medium rounded hover:bg-terra/90 transition-colors mb-16">
              Découvrir la plateforme
            </a>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full border-t border-ink/10 pt-8">
              <div>
                <h4 className="font-mono text-sm text-ink/50 uppercase mb-2">Espace gestion</h4>
                <a href="/login" className="text-ink hover:text-terra underline">Connexion à l'espace privé</a>
              </div>
              <div>
                <h4 className="font-mono text-sm text-ink/50 uppercase mb-2">Localisation</h4>
                <p className="text-ink text-sm">Cocody, Palais de Justice<br/>Abidjan, Côte d'Ivoire</p>
              </div>
              <div>
                <h4 className="font-mono text-sm text-ink/50 uppercase mb-2">Horaires</h4>
                <p className="text-ink text-sm">Lundi au Vendredi, 8h - 18h (GMT)<br/>Responsable disponible 24/7</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-night text-ivory/70 py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              {farm?.logo_url ? (
                <img src={farm.logo_url} alt="Bahkanso" className="h-10 w-auto mb-4 brightness-0 invert" />
              ) : (
                <span className="font-editorial text-2xl font-bold text-ivory mb-4 block">BAHKANSO</span>
              )}
              <p className="text-sm max-w-xs">Projet agro-pastoral. Suivi partagé entre équipe de terrain et le responsable à distance.</p>
            </div>
            <div>
              <h4 className="text-ivory font-medium mb-4">Navigation</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#le-projet" className="hover:text-ivory transition-colors">Le projet</a></li>
                <li><a href="#nos-activites" className="hover:text-ivory transition-colors">Nos activités</a></li>
                <li><a href="#notre-suivi" className="hover:text-ivory transition-colors">Notre suivi</a></li>
                <li><a href="/login" className="hover:text-ivory transition-colors">Espace de gestion</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-ivory font-medium mb-4">Liens utiles</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/login" className="hover:text-ivory transition-colors">Connexion</a></li>
                <li><a href="#contact" className="hover:text-ivory transition-colors">Contact</a></li>
                <li><a href="/mentions-legales" className="hover:text-ivory transition-colors">Mentions légales</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-ivory/10 pt-8 text-center text-xs">
            © 2026 BAHKANSO — Projet agro-pastoral
          </div>
        </div>
      </footer>
    </div>
  );
}

export { LandingPage };