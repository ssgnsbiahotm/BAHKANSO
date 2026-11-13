import { useState } from 'react';

interface FacebookFeedProps {
  pageUrl?: string;
  label?: string;
}

export function FacebookFeed({ pageUrl, label = 'Suivez la vie de l\'exploitation' }: FacebookFeedProps) {
  const [loaded, setLoaded] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);

  if (!pageUrl || pageUrl.trim() === '') {
    return null;
  }

  return (
    <section
      id="facebook-feed"
      aria-labelledby="facebook-title"
      className="py-16 md:py-24 lg:py-32 section-page"
    >
      <div className="container mx-auto px-6" style={{ maxWidth: 'var(--container-max)' }}>
        <div className="max-w-3xl mb-14 md:mb-18 text-center">
          <p className="font-mono text-sm uppercase tracking-wider mb-4 text-signal" style={{ letterSpacing: '0.1em' }}>
            Réseaux sociaux
          </p>
          <h2 id="facebook-title" className="font-editorial leading-tight mb-6 text-ink font-bold tracking-tight" style={{
            fontSize: 'clamp(2.125rem, 4.2vw, 3.25rem)',
            letterSpacing: '-0.015em',
          }}>
            {label}
          </h2>
          <p className="mb-0 text-ink-mut leading-relaxed font-normal max-w-[55ch] mx-auto" style={{
            fontSize: 'clamp(1.0625rem, 1.6vw, 1.1875rem)',
          }}>
            Retrouvez l'actualité de l'exploitation, les moments de terrain et les avancées des chantiers sur notre page Facebook.
          </p>
        </div>

        {!consentGiven ? (
          <div className="max-w-2xl mx-auto">
            <div className="rounded-2xl bg-night p-8 md:p-12 border border-subtle shadow-sm text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-signal text-night mb-6 mx-auto" aria-hidden="true">
                <span aria-hidden="true" style={{ fontSize: '2rem' }}>📘</span>
              </div>
              <h3 className="font-editorial font-semibold mb-3 text-ink" style={{
                fontSize: 'clamp(1.1875rem, 2.2vw, 1.3125rem)',
              }}>
                Charger le contenu Facebook
              </h3>
              <p className="mb-8 text-ink-mut leading-relaxed max-w-xs mx-auto font-normal">
                Le contenu Facebook est hébergé par un tiers. En cliquant, vous acceptez le chargement de l'intégration Facebook (cookies et données de Meta selon leur politique).
              </p>
              <button
                onClick={() => setConsentGiven(true)}
                className="module-btn module-btn-primary module-btn-lg px-9 py-3.5 text-center inline-flex items-center gap-2 font-semibold shadow-md"
              >
                Afficher la page Facebook
                <span aria-hidden="true" style={{ fontSize: '1.125em', lineHeight: 1 }}>→</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto rounded-2xl overflow-hidden border border-subtle shadow-sm bg-night">
            <div
              className="relative w-full aspect-video bg-night"
              style={{ aspectRatio: '16 / 9' }}
            >
              {loaded ? (
                <iframe
                  title="Page Facebook BAHKANSO"
                  src={`https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(pageUrl)}&tabs=timeline&width=340&height=500&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true&appId`}
                  width="340"
                  height="500"
                  style={{ border: 'none', overflow: 'hidden', width: '100%', height: '100%', display: 'block' }}
                  scrolling="no"
                  frameBorder="0"
                  allowFullScreen
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                  loading="lazy"
                />
              ) : (
                <button
                  onClick={() => setLoaded(true)}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-night/50 hover:bg-night/70 transition-colors"
                >
                  <span aria-hidden="true" style={{ fontSize: '3rem' }}>📘</span>
                  <span className="text-ink font-semibold">Charger le contenu Facebook</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
