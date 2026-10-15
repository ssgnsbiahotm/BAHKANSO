interface SkeletonLoaderProps {
  /** Type de squelette à afficher */
  type: 'text' | 'rectangle' | 'circle' | 'line';
  /** Largeur du squelette */
  width?: string | number;
  /** Hauteur du squelette */
  height?: string | number;
  /** Rayon de bordure (pour les rectangles) */
  borderRadius?: string | number;
  /** Nombre d'éléments à afficher (pour les listes) */
  count?: number;
  /** Espace entre les éléments (pour les listes) */
  spacing?: number;
  /** Activer l'animation de pulsation */
  animate?: boolean;
}

/**
 * Composant de chargement squelette pour améliorer l'expérience utilisateur
 * pendant le chargement des données
 */
export function SkeletonLoader({
  type = 'rectangle',
  width = '100%',
  height = '1rem',
  borderRadius = '0.25rem',
  count = 1,
  spacing = 0.5,
  animate = true,
}: SkeletonLoaderProps) {
  // Styles de base pour le squelette
  const skeletonStyle = {
    background:
      'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    backgroundRepeat: 'no-repeat',
  };

  // Générer les éléments pour les listes
  const elements = Array.from({ length: count }, (_, index) => (
    <div
      key={index}
      className="relative overflow-hidden"
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius:
          typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
        marginBottom: index < count - 1 ? `${spacing}rem` : 0,
        display: type === 'line' ? 'block' : undefined,
        ...skeletonStyle,
      }}
    >
      {type === 'circle' && (
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            backgroundColor: 'inherit',
          }}
        />
      )}
      {/* Effet de shimmer */}
      <span
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
          transform: 'skewX(-20deg)',
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: animate ? '-100%' : '0',
          animation: animate ? 'shimmer 1.5s infinite' : 'none',
        }}
      />
    </div>
  ));

  // Les keyframes pour l'animation seront définies dans le CSS global
  // ou peuvent être ajoutées via une approche alternative si nécessaire

  return (
    <div>
      {type === 'text' ? (
        // Ligne de texte squelette
        <div
          className="relative overflow-hidden"
          style={{
            width: typeof width === 'number' ? `${width}px` : width,
            height: typeof height === 'number' ? `${height}px` : height,
            borderRadius:
              typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
            marginBottom: count > 1 ? `${spacing}rem` : 0,
            display: 'block',
            ...skeletonStyle,
          }}
        >
          {count > 1 && elements.slice(0, -1)}
          {/* Effet de shimmer pour le texte */}
          <span
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
              transform: 'skewX(-20deg)',
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: animate ? '-100%' : '0',
              animation: animate ? 'shimmer 1.5s infinite' : 'none',
            }}
          />
        </div>
      ) : (
        // Autres types (rectangle, circle, line)
        elements
      )}
    </div>
  );
}