import { Facebook } from 'lucide-react';

interface FacebookFeedPreviewProps {
  title?: string;
  subtitle?: string;
  facebookUrl?: string;
  images?: string[];
}

export function FacebookFeedPreview({
  title,
  subtitle,
  facebookUrl,
  images = [],
}: FacebookFeedPreviewProps) {
  // Ne rien afficher s'il n'y a ni URL Facebook ni images
  if (!facebookUrl && images.length === 0) return null;

  return (
    <section
      id="facebook-feed"
      aria-labelledby="facebook-title"
      className="py-10 md:py-14 lg:py-20 section-page"
    >
      <div className="container mx-auto px-6" style={{ maxWidth: 'var(--container-max)' }}>
        <div className="bg-surface rounded-2xl border border-subtle p-8 md:p-12">
          <div className="max-w-3xl mb-14 md:mb-18 text-center">
          <p className="font-mono text-sm uppercase tracking-wider mb-4 text-signal" style={{ letterSpacing: '0.1em' }}>
            Réseaux sociaux
          </p>
          <h2 id="facebook-title" className="font-editorial leading-tight mb-6 text-ink font-bold tracking-tight" style={{
            fontSize: 'clamp(2.125rem, 4.2vw, 3.25rem)',
            letterSpacing: '-0.015em',
          }}>
            {title || 'La vie de l’exploitation en images'}
          </h2>
          <p className="mb-0 text-ink-mut leading-relaxed font-normal max-w-[55ch] mx-auto" style={{
            fontSize: 'clamp(1.0625rem, 1.6vw, 1.1875rem)',
          }}>
            {subtitle || 'Suivez le quotidien de nos équipes et l’avancement des récoltes.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-4">
          {images.slice(0, 4).map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`Photo de l’exploitation ${i + 1}`}
              className="w-full aspect-square object-cover rounded-xl shadow-sm transition-transform duration-300 hover:scale-105 hover:shadow-md"
              loading="lazy"
              decoding="async"
            />
          ))}
        </div>

        {facebookUrl && (
          <div className="mt-8 md:mt-10 text-center">
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="module-btn module-btn-primary module-btn-lg px-9 py-3.5 text-center inline-flex items-center gap-2 font-semibold shadow-md border border-signal"
            >
              <Facebook size={18} />
              Voir plus de photos sur Facebook
            </a>
          </div>
        )}
        </div>
      </div>
    </section>
  );
}
