# Atlas Cloud Services Dashboard — Design Direction

## Design Choisi : Corporate Tech / Datacenter

### Design Movement
**Minimalisme corporatif avec accent technique** — inspiré par les interfaces de gestion d'infrastructure cloud (AWS, Azure, Cisco). Esthétique sobre, fonctionnelle, orientée données.

### Core Principles
1. **Clarté hiérarchique** : Distinction nette entre titres, données et actions via typographie et espacement
2. **Fonctionnalité avant décoration** : Chaque élément visuel sert un objectif (pas d'ornements gratuits)
3. **Angles nets et contrastes** : Bordures fines (1px), coins minimes (2-4px), séparation par bordure plutôt que par ombre
4. **Densité d'information optimisée** : Grilles et tableaux lisibles, sans surcharge visuelle

### Color Philosophy
**Palette professionnelle et rassurante** — couleurs qui inspirent confiance et sérieux dans un contexte d'infrastructure critique.

- **Fond principal** : `#F7F8FA` (gris très clair) — neutre, reposant pour les yeux
- **Cartes/Panneaux** : `#FFFFFF` (blanc pur) — séparation claire par bordure fine
- **Texte principal** : `#1A1D23` (anthracite) — lisible sans être agressif
- **Accent principal** : `#1B3A5C` (bleu marine) — autorité, tech, confiance
- **Accent secondaire** : `#6B7280` (gris acier) — éléments neutres, métadonnées
- **États** :
  - Succès : `#2D6A4F` (vert forêt discret)
  - Alerte : `#B45309` (ambre terne)
  - Erreur : `#B91C1C` (rouge brique)

### Layout Paradigm
**Sidebar + Main Content** — navigation persistante à gauche, contenu principal à droite. Structure asymétrique :
- Sidebar compacte (250px) avec logo, menu principal, statut système
- Main area responsive avec cartes, tableaux, graphiques
- Sections organisées par fonctionnalité (Dashboard, Monitoring, Automatisation, Architecture)

### Signature Elements
1. **Cartes d'équipement** : Petits panneaux avec icône, nom, pastille d'état (vert/rouge/gris)
2. **Indicateurs d'état** : Pastilles circulaires (8-12px) avec couleurs sobres, pas de glow
3. **Tableaux de données** : Lignes fines, alternance subtile (3-5% gris), typographie monospace pour IPs/commandes

### Interaction Philosophy
**Feedback immédiat et discret** — les interactions doivent être ressenties, pas criées. Boutons qui changent de teinte au survol, pas de scale exagéré. Transitions rapides (150-200ms) pour les changements d'état.

### Animation
- **Transitions de page** : Fade-in léger (150ms) sur les nouveaux contenus
- **Hover sur cartes** : Changement de bordure (gris clair → bleu marine), pas de scale
- **Spinners de chargement** : Icône de rotation discrète (gris acier), pas de couleur vive
- **Toasts/Notifications** : Apparition en haut à droite avec slide-in (200ms), fond blanc avec bordure gauche colorée

### Typography System
- **Titres (h1-h3)** : IBM Plex Sans, poids 600-700, espacement généreux
- **Corps (p, label)** : IBM Plex Sans, poids 400-500, line-height 1.5
- **Données/Code (IP, commandes)** : IBM Plex Mono, poids 400, `font-size: 0.875rem`
- **Hiérarchie** : h1 (28px), h2 (20px), h3 (16px), body (14px), small (12px)

### Brand Essence
**"Gestion d'infrastructure cloud souveraine marocaine — fiable, transparente, performante."**

Trois adjectifs : **Professionnel**, **Transparent**, **Fiable**

### Brand Voice
Langage direct, sans jargon inutile. Microcopy claire et actionnable.

Exemples :
- ✅ "CSR-BGR-1 : Master actif" (au lieu de "Statut : Opérationnel")
- ✅ "Lancer le test complet" (au lieu de "Tester la connectivité globale")

### Wordmark & Logo
**Logo** : Initiales "ACS" dans un carré avec angle net (2px radius), couleur bleu marine (#1B3A5C). Accompagné du texte "ATLAS CLOUD SERVICES" en IBM Plex Sans 600.

### Signature Brand Color
**Bleu Marine #1B3A5C** — couleur exclusive d'Atlas Cloud Services dans ce dashboard. Utilisée pour :
- En-tête de sidebar
- Boutons primaires
- Liens actifs
- Accents visuels clés

---

## Style Decisions
- **Pas de dégradés** : Contrastes nets uniquement
- **Pas de coins arrondis excessifs** : Maximum 4px, généralement 2px
- **Pas d'ombres portées** : Séparation par bordure fine (1px, gris clair)
- **Pas d'emojis** : Icônes Font Awesome ou Material Icons uniquement
- **Pas de couleurs vives** : Palette discrète et professionnelle
