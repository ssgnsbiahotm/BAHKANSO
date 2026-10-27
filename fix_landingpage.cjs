const fs = require('fs');
const path = '/home/ssgnsa/projects/project-bahkanso/src/pages/LandingPage.tsx';
let content = fs.readFileSync(path, 'utf8');

// Fix A: HeroImage - replace the duotone filter style
content = content.replace(
  /style=\{\{"filter: 'sepia\(1\) hue-rotate\(100deg\) saturate\(1\.2\) contrast\(1\.1\)'}\}\}/,
  "style={{ filter: 'sepia(0.35) saturate(1.1) hue-rotate(-10deg) contrast(1.05)' }}"
);

// Fix B: ValuePropsSection - change grid gap from gap-12 lg:gap-16 to gap-10 or gap-8 (use gap-y-10 lg:gap-y-16)
content = content.replace(
  /<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16" role="list" aria-label="Avantages de la plateforme">/,
  '<div className="grid grid-cols-1 lg:grid-cols-2 gap-y-10 lg:gap-y-16" role="list" aria-label="Avantages de la plateforme">'
);

// Fix C: ContactSection - change text-center to text-left, and CTA from bg-signal text-night to bg-terra text-ivory
content = content.replace(
  /<div className="max-w-3xl mx-auto text-center space-y-10 lg:space-y-12">/,
  '<div className="max-w-3xl mx-auto text-left space-y-10 lg:space-y-12">'
);

content = content.replace(
  /<Link\s+to="\/login"\s+className="inline-flex items-center justify-center gap-2 bg-signal text-night font-sans font-semibold text-base px-8 py-4 rounded-md min-h-\[56px\] transition-colors hover:bg-signal\/90 focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2"/,
  '<Link to="/login" className="inline-flex items-center justify-center gap-2 bg-terra text-ivory font-sans font-semibold text-base px-8 py-4 rounded-md min-h-[56px] transition-colors hover:bg-terra/90 focus-visible:outline-2 focus-visible:outline-ivory focus-visible:outline-offset-2"'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixes applied successfully');
