# EGS Audit Report — GATE 0: Landing Page Architecture

## Mission
Premium redesign of BAHKANSO landing page (site vitrine) per detailed mission spec. GATE 0 = comprehensive audit of current state before any design decisions.

## Objective
Identify all moving parts: Git state, page architecture, prototype, CSS/tokens, Configuration module, Media module, routes, services — to confirm the Media → Configuration → Site vitrine circuit and configurable slots with fallbacks.

## Environment
- Host: Local (WSL/Ubuntu)
- User: Souleymane Gnabsia
- Repository: /home/souleymane/BAHKANSO
- Branch: design/pilot-plots
- Stack: Vite + React 18 + TypeScript + Tailwind CSS v3 + Supabase

---

## Commands Executed

```bash
# File reads for audit
read src/pages/LandingPage.tsx
read src/pages/LandingPagePrototype.tsx
read src/pages/Configuration.tsx
read src/pages/Media.tsx
read src/pages/Dashboard.tsx
read src/index.css
read src/styles/module-theme.css
read src/lib/constants.ts
read src/routes/AppRoutes.tsx
read src/lib/DataContext.tsx
read src/lib/types.ts (SiteContent, Media interfaces)
read src/components/ui/PageHeader.tsx
read src/components/ui/RotatingCard.tsx
read src/components/ui/RotatingCard.css
ls public/images/
```

---

## Complete Results

### 1. Git State
```
Branch: design/pilot-plots
Status: Clean (only SalesModule.tsx modified from prior work)
```

### 2. Page Architecture — Two Versions Exist

| Aspect | LandingPage.tsx (Current /) | LandingPagePrototype.tsx (/prototype) |
|--------|----------------------------|--------------------------------------|
| **Hero** | Dark bg, SVG pattern, no image | Light bg, `/images/hero-projet.jpg` (opacity 0.06), left accent bar |
| **Activities** | Asymmetric grid (5/12 + 7/12), hover border-left | 3-col card grid, colored top bars, hover lift |
| **Why Bahkanso** | Dark bg, KPI cards | Light bg (`--bg-surface`), KPI cards |
| **Notre suivi** | Dark bg, vertical timeline | **Missing** |
| **Notre projet** | Light bg, editorial 2-col | **Missing** |
| **Contact** | Light bg, CTA + location/hours | **Missing** (only footer CTA) |
| **Footer** | Dark, 4-col nav + location/hours | Dark, 4-col nav + location/hours |
| **Header** | Dark transparent → scrolled slate | Light surface → scrolled with blur |
| **Images** | None (SVG pattern only) | `hero-projet.jpg` (216K) in public/images/ |
| **Module styles** | Inline styles + `module-*` classes | Uses `module-page`, `module-kpi-grid`, `module-btn`, `module-view-all-link`, `module-section`, `module-kpi-card` from `module-theme.css` |

**Key finding**: Prototype is more advanced, uses design system tokens, has real image, better activity cards. Current page has unique sections (Notre suivi, Notre projet, Contact) that prototype lacks.

### 3. Configuration Module (src/pages/Configuration.tsx)

**Content sections (CONTENU_SECTIONS)** — all map to `site_content` table via key:
- `branding` → appName, appTagline, logoIcon, logoColor, logoBgColor, primaryColor, secondaryColor, accentColor, footerText, footerSubtext
- `hero` → badge, title, highlight, subtitle, ctaPrimary, ctaSecondary, trustBadges[], heroImage, heroAlt
- `heroCard` → label, value, trend, items[] (label+value), lines[] (text+value)
- `stats` (isList) → value, label (repeatable)
- `features` (isList) → icon, title, desc (repeatable)
- `featuresSection` → title, subtitle
- `workflow` → title, subtitle, steps[] (icon+label)
- `roles` → title, subtitle, list[] (value)
- `cta` → title, subtitle, primary, secondary
- `footer` → description, modulesTitle, modules[], securityTitle, security[] (icon+text), copyright
- `login` → title, subtitle, benefits[], quote, quoteAuthor

**Exploitation sections** map to `farms` table: informations, devise, securite, notifications, appearance (logo_url)

**Mechanism**: Unified draft system → batch upsert to `farms` + `site_content` tables → audit log.

### 4. Media Module (src/pages/Media.tsx)

**Media table schema**: id, title, description, url, type ('image'|'icon'|'logo'), category, uploaded_by, created_at, updated_at

**Categories** (MEDIA_CATEGORIES): 'site vitrine', 'icône application', 'logo', 'illustration', 'bannière', 'autre'

**Upload flow**: File → Supabase Storage `app-assets` bucket → public URL → media row insert.

**Dashboard hero image resolution** (Dashboard.tsx:230-244):
```typescript
// Priority chain:
1. siteContent['hero-cover']?.value.mediaId → media lookup
2. media.find(type='image' && category='cover'|'hero')
3. media.find(type='image') [first]
```

**No slot system**: Media has no concept of "slots" — just tags. Configuration has `heroImage` field but Dashboard doesn't read it.

### 5. CSS / Design Tokens (src/index.css)

**Color primitives**: --color-night, --color-ivory, --color-signal, --color-terra, --color-grass, etc.
**Semantic tokens**: --bg-page, --bg-surface, --text-primary, --accent-primary, --border-default, etc.
**Dark theme**: .theme-dark / [data-theme="dark"] overrides
**Typography**: --font-editorial (Fraunces), --font-sans (system), --font-mono (Geist Mono)
**Spacing scale**: --space-1 through --space-16
**Container**: --container-max: 1280px, --container-padding: 1.5rem
**Z-index scale**: --z-sticky: 200, --z-modal: 500, etc.
**Reduced motion**: Respected globally

### 6. Module Theme (src/styles/module-theme.css)

Dark-theme component library:
- `.module-page`, `.module-header`, `.module-btn-*`, `.module-kpi-grid`, `.module-kpi-card`
- `.module-section`, `.module-tabs`, `.module-badge-*`
- `.module-cards-grid` (grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)))
- `.module-empty-state`, `.module-search-input`
- `.rc` overrides for dark theme (rc--dark equivalent)
- Responsive breakpoints: 768px, 480px

### 7. Routes (src/routes/AppRoutes.tsx)

- `/` → LandingPage (lazy, Suspense)
- `/prototype` → LandingPagePrototype (lazy, Suspense)
- `/app/*` → Auth-gated app with RequireModule per module
- Public: `/mentions-legales`, `/confidentialite`, `/login`
- `*` → redirect to `/`

### 8. DataContext & Types

**DataContext provides**: `siteContent: Record<string, SiteContent>`, `media: Media[]`, `farm: Farm|null`, and `refresh()`

**SiteContent**: { id, key, value: Record<string,unknown>|unknown[], updated_at }
**Media**: { id, title, description, url, type, category, uploaded_by, created_at, updated_at }

---

## Analysis

### Media → Configuration → Site Vitrine Circuit

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Media.tsx     │     │ Configuration.tsx │     │  LandingPage    │
│                 │     │                  │     │                 │
│ Upload image    │────▶│ hero.heroImage   │────▶│ ? NOT CONNECTED │
│ (category=      │     │ (draft → site_   │     │                 │
│  'bannière')    │     │  content['hero'])│     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │                        │
         │                       │                        │
         ▼                       ▼                        ▼
   Supabase Storage        site_content table         Uses NONE of these
   app-assets bucket       key='hero'                  fields directly
```

**Critical gap**: 
- Configuration has `hero.heroImage` field (line 214, 659-668)
- Media uploads to storage, creates media row with category
- Dashboard reads `siteContent['hero-cover']` + media lookup (NOT `hero.heroImage`)
- LandingPage reads **neither** — uses hardcoded SVG pattern / nothing

### Configurable Slots Identified

| Slot | Configuration Field | Media Category | LandingPage Usage | Status |
|------|---------------------|----------------|-------------------|--------|
| Hero background | `hero.heroImage` + `hero.heroAlt` | 'bannière' / 'hero' | ❌ Not used | **Missing** |
| Hero cover (Dashboard) | `siteContent['hero-cover'].value.mediaId` | 'cover' / 'hero' | Dashboard only | Partial |
| Logo | `exploitation.appearance.logo_url` | 'logo' | Header + Footer | ✅ Connected |
| Activity images | None | 'illustration' | ❌ Hardcoded emoji | **Missing** |
| Stats values | `stats` (list) | N/A | Prototype: hardcoded "En cours" | **Missing** |
| Features | `features` (list) | 'icône application' | Hardcoded | **Missing** |
| Trust badges | `hero.trustBadges` | N/A | ❌ Not used | **Missing** |
| CTA section | `cta` fields | N/A | Hardcoded | **Missing** |
| Footer content | `footer` fields | N/A | Hardcoded | **Missing** |

### Fallback Chain (Current)

1. **Hero image**: SVG pattern (LandingPage) / `hero-projet.jpg` (Prototype) / Dashboard's 3-tier lookup
2. **Logo**: `farm.logo_url` → "BAHKANSO" text
3. **Activity icons**: Emoji (Prototype) / Text only (LandingPage)
4. **Stats**: "En cours" (Prototype) / Not shown (LandingPage)
5. **Colors**: CSS variables (both)

---

## Findings

| # | Finding | Severity | Evidence |
|---|---------|----------|----------|
| 1 | **Two landing pages exist** — `/` and `/prototype` with different designs | High | AppRoutes.tsx:113-119 |
| 2 | **No Media→LandingPage connection** — Configuration fields exist but LandingPage doesn't read them | Critical | LandingPage.tsx reads only `farm.logo_url` |
| 3 | **Dashboard has separate hero logic** — uses `hero-cover` key + media lookup, not `hero.heroImage` | Medium | Dashboard.tsx:230-244 |
| 4 | **Prototype uses design system** — module-theme.css classes; Current uses inline styles | Medium | Class names comparison |
| 5 | **Prototype has real image asset** — `/images/hero-projet.jpg` (216KB) | Low | public/images/ |
| 6 | **Content sections comprehensive** — 11 content sections cover all vitrine needs | Positive | Configuration.tsx:182-327 |
| 7 | **No slot/placeholder system** — Media has categories but no slot mapping | Medium | MEDIA_CATEGORIES vs Configuration fields |
| 8 | **Reduced motion respected** — CSS media query in index.css + module-theme.css | Positive | index.css:202-213 |

---

## Actions Performed
- **None** — GATE 0 is read-only audit

---

## Validation
- All source files read and cross-referenced
- Circuit traced from Media upload → Configuration draft → site_content table → Dashboard/LandingPage consumption
- No code modifications made

---

## Final Status
**BLOCKED** — Cannot proceed to design (GATE 2) until:
1. Decision: Merge prototype strengths into current page OR adopt prototype as base
2. Circuit completion: Connect Configuration `hero.heroImage` → LandingPage hero background
3. Slot system: Define Media categories → Configuration fields → LandingPage consumption mapping

---

## Next Step
**GATE 1**: Present circuit analysis to user, confirm:
- Which page version to evolve (current `/` or `/prototype` or merge)
- Whether to create `hero-cover` site_content key convention or use `hero.heroImage` directly
- Whether Media categories need slot mapping (e.g., `hero-background`, `activity-illustration`, `stats-icon`)
- Fallback strategy for missing media (SVG pattern? placeholder? hide section?)