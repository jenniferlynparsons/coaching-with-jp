# Plan: jQuery → Vanilla JS + Site Refocus + CSS Rewrite

## Context
The site uses the HTML5 UP "Massively" theme. The current CSS is 4,966 lines — ~30% vendor prefix bloat, ~35% grid system duplicated across 5 breakpoints, no CSS custom properties.

Goals:
1. Rewrite `assets/css/main.css` from scratch using modern CSS — preserve the dark visual design, target ~1,200 lines
2. Replace all jQuery with a single vanilla JS file (`assets/js/site.js`)
3. Refocus: Engineering Coaching becomes the home page (`coaching.html` → `index.html`, `index.html` → `about.html`)

## Critical Files
- `coaching.html` → becomes `index.html`
- `index.html` → becomes `about.html`
- `six-week-program.html` — nav + script tag update only
- `resume.html` — nav + script tag update only
- `assets/css/main.css` — **full rewrite**
- `assets/css/noscript.css` — minor update
- `assets/js/site.js` — **new file** (create)
- Old JS to delete: `jquery.min.js`, `jquery.scrollex.min.js`, `jquery.scrolly.min.js`, `browser.min.js`, `breakpoints.min.js`, `util.js`, `main.js`

---

## Step 1 — Rewrite `assets/css/main.css`

### Design Tokens (preserve these values)
```
Colors:
  --color-bg:        #1e252d   (body/dark background)
  --color-surface:   #212931   (card/button bg)
  --color-border:    #eeeeee
  --color-muted:     #909498
  --color-text:      #3d4449   (body text)
  --color-heading:   #212931
  --color-accent:    #1a60b5   (links, active states)
  --color-accent-hover: #2583f7
  --color-white:     #ffffff

Fonts:
  --font-body:    'Merriweather', Georgia, serif  (300 weight)
  --font-heading: 'Source Sans Pro', Helvetica, sans-serif  (900 weight, uppercase)
  --font-mono:    'Courier New', monospace

Spacing:
  --space-xs:  0.5rem
  --space-sm:  1rem
  --space-md:  1.5rem
  --space-lg:  2rem
  --space-xl:  3rem

Transitions:
  --transition: 0.2s ease-in-out

Breakpoints:
  --bp-xlarge: 1680px
  --bp-large:  1280px
  --bp-medium: 980px
  --bp-small:  736px
  --bp-xsmall: 480px
```

### Architecture (sections in order)
```
1.  Google Fonts @import
2.  FontAwesome @import
3.  :root custom properties (design tokens)
4.  Modern reset — box-sizing: border-box, sensible defaults (~25 lines, not the 200-line HTML4 reset)
5.  Base typography — html/body, headings (h1-h4), p, a, strong, em, blockquote, pre, code, hr
6.  Layout — .row / .col-* using CSS Grid (only the column variants used in current HTML)
7.  Components — button (.btn), table, image (.clip-circle), list, actions
8.  #wrapper — full-height, contains .bg parallax layer
9.  .bg / .bg.fixed — parallax background (JS-injected; must be in CSS)
10. #header — logo bar
11. #nav — horizontal nav, dropdowns (.has-submenu, .submenu), active states
12. #navPanelToggle — mobile menu button (JS-injected; hidden above 980px via CSS)
13. #navPanel — mobile slide-out panel (JS-injected)
14. .is-navPanel-visible — body class that shows the panel
15. #main — main content area
16. .post — content section cards
17. .subnav — within-page anchor navigation
18. is-preload — disable all animations during page load
19. Media queries — consolidate all responsive rules at the end
```

### Key modernization decisions
- **No vendor prefixes** — drop all `-moz-`, `-ms-`, `-o-`. Keep `-webkit-appearance` only where Safari still requires it.
- **CSS Grid** for layout: `.row` is `display: grid; grid-template-columns: repeat(12, 1fr); gap: var(--space-md)` — replaces 1,700 lines of float/percentage columns
- **Only implement column sizes used in the HTML**:
  - `col-7` → `grid-column: span 7`
  - `col-5` → `grid-column: span 5`
  - `col-12-medium` → `grid-column: span 12` at ≤980px
- **Fluid typography** with `clamp()` where appropriate (h1, h2, body)
- **`::placeholder`** — standard only, no vendor prefixed versions
- **Modern checkbox/radio** — use `accent-color` instead of the custom appearance pattern
- **Logical properties** for padding/margin where it simplifies rules
- **`gap`** instead of `calc()` spacing hacks in flex/grid contexts
- All colors, fonts, spacing through custom properties — no hardcoded values in component rules

### Classes JS depends on (must be present in CSS)
| Class | Applied to | Used by |
|-------|-----------|---------|
| `is-preload` | `<body>` | Disables animations on load |
| `.bg` | `div` inside `#wrapper` | Parallax background layer |
| `.bg.fixed` | same | Fixed background (mobile/retina) |
| `#navPanelToggle` | `<a>` injected in `#wrapper` | Mobile menu button |
| `#navPanel` | `<div>` injected in `<body>` | Mobile slide-out panel |
| `is-navPanel-visible` | `<body>` | Shows the panel |
| `.alt` | `#navPanelToggle` | Style when scrolled past header |
| `.active` | `<li>` in nav | Current page indicator |
| `.has-submenu` | `<li>` in nav | Dropdown trigger |
| `.submenu` | `<ul>` in nav | Dropdown content |

---

## Step 2 — Create `assets/js/site.js`

Pure vanilla JS replacing all jQuery behavior. Behaviors:

**2a. `is-preload` removal**
- On `window` load, after 100ms: `document.body.classList.remove('is-preload')`

**2b. Parallax background**
- Inject `<div class="bg">` as first child of `#wrapper` (required for the background image layer)
- If `devicePixelRatio > 1` OR `matchMedia('(max-width: 1280px)')` matches: add `.fixed`, no scroll binding
- Otherwise: bind `scroll` listener → `bg.style.transform = 'matrix(1,0,0,1,0,' + scrollY * 0.925 + ')'`
- Re-evaluate on `matchMedia` change and `resize`

**2c. Mobile nav panel**
- Inject `<a id="navPanelToggle">Menu</a>` into `#wrapper`
- Use `IntersectionObserver` on `#header` to toggle `.alt` on the toggle button (when header leaves viewport)
- Inject `<div id="navPanel">` into `<body>` with a clone of `<ul class="links">` from `#nav`
  - No need to flatten submenus — CSS handles `.has-submenu` inside `#navPanel`
- Toggle `is-navPanel-visible` on `<body>` to open/close
- Dismiss on: toggle click, close button click, ESC key, click outside, right swipe
- Force-close on `matchMedia('(min-width: 981px)')` change

**2d. Smooth scroll**
- Delegated listener on `document` for `a[href^="#"]` clicks
- `target.scrollIntoView({ behavior: 'smooth', block: 'start' })`
- Skip `#navPanel` href (handled by panel logic)

**Dropped (not needed):**
- `$.fn.placeholder` — native
- `$.fn.navList` — CSS handles submenus in panel natively
- `#intro` hide-on-scroll — no current page has `#intro`
- IE/Edge/WP browser sniffing

---

## Step 3 — Rename HTML Files

```bash
git mv index.html about.html
git mv coaching.html index.html
```

---

## Step 4 — Update Nav + Scripts in All Pages

**New nav structure** (active states vary per page):
```html
<nav id="nav">
  <ul class="links">
    <li class="has-submenu [active on index + six-week]">
      <a href="index.html">Engineering Coaching</a>
      <ul class="submenu">
        <li [active on six-week]><a href="six-week-program.html">6-Week Program</a></li>
      </ul>
    </li>
    <li [active on about]><a href="about.html">About</a></li>
  </ul>
</nav>
```

**Per-page active states:**
- `index.html` (Coaching): `li.has-submenu.active`, no active on 6-Week child
- `six-week-program.html`: `li.has-submenu.active` + `li.active` on 6-Week child
- `about.html`: `li.active` on About
- `resume.html`: no active items

**Logo** on all pages: `<a href="index.html" class="logo">JP</a>`

**Script tags** — replace the 7 jQuery script tags in every page with:
```html
<script src="assets/js/site.js"></script>
```

Also remove the `<noscript>` CSS link (noscript.css was a fallback for JS-dependent layout; with vanilla JS and modern CSS it's not needed).

---

## Step 5 — Delete Old JS Files

```bash
git rm assets/js/jquery.min.js assets/js/jquery.scrollex.min.js \
  assets/js/jquery.scrolly.min.js assets/js/browser.min.js \
  assets/js/breakpoints.min.js assets/js/util.js assets/js/main.js
```

---

## Verification Checklist

- [ ] No JS console errors on any page
- [ ] Preload: animations fade in ~100ms after load (not instant)
- [ ] Parallax: background drifts subtly on wide desktop (>1280px, non-retina)
- [ ] Parallax off: `.bg.fixed` on mobile/retina — background is fixed
- [ ] Mobile panel (≤980px): Menu button appears, panel opens/closes; submenu visible inside panel
- [ ] Mobile panel dismisses on: ESC, outside tap, right swipe, link click
- [ ] Smooth scroll: subnav anchor links scroll smoothly on coaching + six-week pages
- [ ] Nav active states correct on all 4 pages
- [ ] Logo links to `index.html` on all pages
- [ ] Two-column layout (photo + text) on about.html renders correctly on desktop, stacks on mobile
- [ ] Table renders correctly on coaching.html
- [ ] Dark background, Merriweather body text, Source Sans Pro headings preserved
