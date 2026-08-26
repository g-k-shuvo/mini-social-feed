---
name: Mini Social Feed
description: A night plate where every post is a charted object and its like count is the size of its mark.
colors:
  sky: "#0A1021"
  plate: "#0E1729"
  plate-2: "#16233D"
  ink: "#F2F2E9"
  ink-2: "#9CAAC2"
  rule: "rgba(242,242,233,0.11)"
  rule-2: "rgba(242,242,233,0.20)"
  axis: "rgba(242,242,233,0.30)"
  sel: "#24374F"
  sel-2: "#16233D"
  amber: "#FF4D2E"
  amber-2: "#FFB36B"
  amber-bg: "rgba(255,77,46,0.14)"
  on-amber: "#1A0803"
  scrim: "rgba(4,7,15,0.72)"
  skeleton: "rgba(242,242,233,0.07)"
  star: "#F2F2E9"
  light-sky: "#E2E7EC"
  light-plate: "#EEF2F6"
  light-plate-2: "#D2DAE2"
  light-ink: "#101A2B"
  light-star: "#101A2B"
  light-ink-2: "#4E5C74"
  light-rule: "rgba(16,26,43,0.16)"
  light-rule-2: "rgba(16,26,43,0.30)"
  light-axis: "rgba(16,26,43,0.34)"
  light-sel: "#C6D2DE"
  light-sel-2: "#D3DCE5"
  light-amber: "#BE3617"
  light-amber-2: "#9A4A16"
  light-amber-bg: "rgba(190,54,23,0.10)"
  light-on-amber: "#FFF6F2"
  light-scrim: "rgba(16,26,43,0.42)"
  light-skeleton: "rgba(16,26,43,0.08)"
typography:
  display:
    fontFamily: "Bodoni Moda, ui-serif, Georgia, serif"
    fontSize: "34px"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "0.005em"
  headline:
    fontFamily: "Bodoni Moda, ui-serif, Georgia, serif"
    fontSize: "25px"
    fontWeight: 500
    lineHeight: 1.2
  title:
    fontFamily: "Bodoni Moda, ui-serif, Georgia, serif"
    fontSize: "20px"
    fontWeight: 500
    lineHeight: 1.2
  who:
    fontFamily: "Bodoni Moda, ui-serif, Georgia, serif"
    fontSize: "16.5px"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.005em"
  body:
    fontFamily: "Jost, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15.5px"
    fontWeight: 400
    lineHeight: 1.55
  body-small:
    fontFamily: "Jost, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13.5px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Jost, ui-sans-serif, system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.17em"
  label-large:
    fontFamily: "Jost, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.07em"
  figure:
    fontFamily: "Roboto Mono, ui-monospace, Consolas, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontFeature: "tabular-nums"
  figure-small:
    fontFamily: "Roboto Mono, ui-monospace, Consolas, monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1
    fontFeature: "tabular-nums"
rounded:
  cell: "2px"
  sheet: "4px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
  xxxl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.on-amber}"
    typography: "{typography.label}"
    rounded: "{rounded.cell}"
    height: "50px"
    padding: "0 26px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.amber}"
    typography: "{typography.label}"
    rounded: "{rounded.cell}"
    height: "50px"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.cell}"
    height: "46px"
  icon-button:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    size: "48px"
  icon-button-hover:
    backgroundColor: "{colors.amber-bg}"
    textColor: "{colors.ink}"
  fab:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.on-amber}"
    rounded: "{rounded.pill}"
    size: "56px"
  fab-rail:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.on-amber}"
    rounded: "16px"
    size: "56px"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    typography: "{typography.label-large}"
    rounded: "{rounded.cell}"
    height: "34px"
    padding: "0 14px"
  chip-selected:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.on-amber}"
    rounded: "{rounded.cell}"
    height: "34px"
  count-cell:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    typography: "{typography.figure}"
    rounded: "{rounded.cell}"
    width: "78px"
    height: "34px"
  count-cell-on:
    backgroundColor: "transparent"
    textColor: "{colors.amber}"
    rounded: "{rounded.cell}"
    width: "78px"
    height: "34px"
  count-cell-wide:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.cell}"
    width: "96px"
    height: "40px"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.cell}"
    padding: "13px 12px"
  sheet:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
  dialog:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
    padding: "22px 20px 14px"
  snackbar:
    backgroundColor: "{colors.plate-2}"
    textColor: "{colors.ink}"
    rounded: "3px"
    padding: "13px 14px"
  app-bar:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.ink}"
    height: "60px"
    padding: "0 6px 0 14px"
  nav-bar:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.ink-2}"
    height: "74px"
  nav-item-selected:
    backgroundColor: "{colors.sel-2}"
    textColor: "{colors.amber}"
    rounded: "{rounded.pill}"
    width: "60px"
    height: "30px"
  nav-rail:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.ink-2}"
    width: "88px"
---

# Design System: Mini Social Feed

## Overview

**Creative North Star: "The Star Atlas"**

The feed is a night plate at the eyepiece. Every post is a charted object, not a card: a filled magnitude mark sitting on one unbroken dotted axis, with an italic name beside it and the message text running out to the right. Hierarchy is carried entirely by mark diameter, which is a direct function of a post's like count. Nothing is boxed, nothing is elevated to signal importance, and there are no avatar circles in the feed row at all. The plate is ruled, rectilinear and dense — hairline rules, tracked amber caps, corner registration ticks, tabular figures in fixed cells.

Two themes, and neither is the inversion of the other. Dark is the sky at the eyepiece: night-navy ground, chalk-white marks that carry a faint glow. Light is the same atlas printed as a *cool photographic plate* — blue-grey stock, deep-indigo ink, marks filled dark. The light theme is deliberately cool; a warm-paper reading was tried and rejected, because a warm ground competes with the one warm thing on screen.

That one warm thing is star amber, and it is a signal, never a field. Material 3 governs the structure — navigation bar, navigation rail, bottom sheet, chips, switch, FAB, snackbar — and the world expresses itself through Material's colour roles, type scale, shape scale and motion. Components are themed into the atlas; they are never replaced by hand-built lookalikes.

**Key Characteristics:**
- Marks, not cards: like count *is* mark diameter on a fixed five-step ramp `[5, 7, 9, 12, 15]` px.
- One unbroken dotted filing axis joining every mark down the whole feed.
- Three voices: Bodoni Moda italic for names and titles, Jost for UI and body, Roboto Mono for figures only.
- Amber is a signal, never a field; selection surfaces are chart blue.
- Sharp shape scale (2px cells, 4px sheets); circles reserved for marks and Material affordances.
- Exactly one ambient motion in the whole product, and it parks under reduced motion.

## Colors

A single warm signal on a cold ground, in two printings of the same plate: night navy at the eyepiece, cool blue-grey stock in print.

### Primary
- **Star Amber** (`{colors.amber}` dark, `{colors.light-amber}` light): the only warm colour in the product. Carries the FAB, the primary button, the selected chip, the liked mark, tracked caps, registration ticks, the focus ring, the caret, error text, the unread dot and the notification badge. It never becomes a background field for content.
- **Ember** (`{colors.amber-2}`): the secondary warm step, for amber-on-amber differentiation where a second warm value is unavoidable.
- **On-Amber** (`{colors.on-amber}`): the near-black printed *on* amber, so an amber fill stays AA.

### Secondary
- **Chart Blue** (`{colors.sel}`) and **Deep Indigo** (`{colors.sel-2}`): the plate's own selection surfaces. Chart Blue fills the selected row in the tablet two-pane; Deep Indigo fills the navigation active indicator and the unread notification row. These are the only selection fields in the system.

### Neutral
- **Night Sky** (`{colors.sky}` / `{colors.light-sky}`): the app ground and the scrolling plate behind the feed.
- **Plate** (`{colors.plate}` / `{colors.light-plate}`): raised chrome — app bar, coordinate band, navigation bar, navigation rail, bottom sheet, dialog, status bar.
- **Plate Deep** (`{colors.plate-2}` / `{colors.light-plate-2}`): the snackbar body and the switch track at rest.
- **Chalk Ink** (`{colors.ink}` / `{colors.light-ink}`): all primary text, and the fill of every magnitude mark.
- **Dim Ink** (`{colors.ink-2}` / `{colors.light-ink-2}`): secondary text, timestamps, handles, unset count cells, unselected navigation destinations.
- **Hairline** (`{colors.rule}`) and **Rule** (`{colors.rule-2}`): the two ruling weights. Hairline separates rows; Rule bounds inputs, chips and containers.
- **Axis** (`{colors.axis}` / `{colors.light-axis}`): reserved for the dotted filing axis and nothing else.

### Named Rules

**The Signal-Not-Field Rule.** Amber marks a thing; it never becomes the surface a thing sits on. Selection is Chart Blue (`{colors.sel}`) and Deep Indigo (`{colors.sel-2}`). The amber tint (`{colors.amber-bg}`) is a *transient* wash only — row hover, the offline bar, the failed count cell — and is never the resting background of a selected or active item.

**The One Warm Thing Rule.** Star amber is the only warm hue in either theme. If a second warm colour appears on screen, one of them is wrong. This is why the light theme is cool blue-grey stock and not cream paper.

**The Derived Ink Rule.** Identity colour is never hand-picked. `inkFor(id)` hashes the user id, steps it to one of nine positions in a bounded arc around amber's hue (12° ± 60°, in 15° steps), and returns `hsl(h, 78%, 58%)` in dark or `hsl(h, 62%, 34%)` in light. Adding a user requires no colour decision.

**The Form-Too Rule.** Colour never carries meaning alone. Liked, unread, over-limit and failed each read through form — a filled mark, a dot, a different border style, a glyph — as well as through hue.

**The Re-Derive Rule.** Every value tinted from the ink — the mark fill (`{colors.light-star}`), the scrim, the skeleton — is derived from it and must be re-derived whenever the ink moves. Resolved history: when the light theme was recooled from warm stardust paper to a cool photographic plate, `--ink` moved to `#101A2B` but the mark fill, scrim and skeleton were left trailing the earlier `#131C2E`. Both surfaces are now aligned on `#101A2B`. A derived token must be re-derived when its source changes, and a port must not round the ramp it is porting.

## Typography

**Display Font:** Bodoni Moda, italic, weight 500 (with ui-serif / Georgia fallback)
**Body Font:** Jost (with ui-sans-serif / system-ui fallback)
**Label/Mono Font:** Roboto Mono (with ui-monospace / Consolas fallback)

**Character:** A high-contrast Bodoni italic gives the atlas its engraved, hand-annotated voice — it names people and titles screens and does nothing else. Jost's geometric neutrality carries every word of interface and message text without competing. Roboto Mono is instrumentation: it appears only where a number is being *measured*.

All three faces are self-hosted, latin-subset, inlined as woff2 data URIs. The prototype makes zero external font requests; the app bundles the same three families. No system display face appears anywhere in the build.

### Hierarchy
- **Display** (Bodoni italic 500, 34px, 1.1): the auth headline only. Centred, balanced wrap.
- **Headline** (Bodoni italic 500, 25px): the profile name, and the open post's author in the tablet two-pane.
- **Title** (Bodoni italic 500, 20px): app bar title and dialog title; the sheet title runs 19px.
- **Who** (Bodoni italic 500, 16.5px): the author name on a feed row — the recognition anchor of the whole feed. 14.5px in a comment, 21px in a detail view.
- **Body** (Jost 400, 15.5px, 1.55): post message text; 18px in detail and 21px in the wide detail pane. Measure is capped by the column, with pretty wrapping.
- **Body Small** (Jost 400, 13.5px, 1.55): supporting prose — empty-state copy, dialog body, setting descriptions. Capped at 32ch.
- **Label** (Jost 600, 9.5–10px, 0.17em tracking, uppercase): field labels, readout keys, count-cell keys, epoch caps. Amber when it annotates the chart, dim ink when it labels a form control.
- **Label Large** (Jost 500, 12px, 0.07em tracking, uppercase): chip text and navigation destination text.
- **Figure** (Roboto Mono 400/500, 11–12.5px, tabular): counts, timestamps, handles, coordinate readouts, the status-bar clock, badge numerals.

### Named Rules

**The Three Voices Rule.** Bodoni names, Jost speaks, Roboto Mono measures. A number that can change goes in mono with tabular figures. A person's name goes in Bodoni italic. Everything else is Jost. No face crosses into another's job.

**The Italic-Only Display Rule.** Bodoni Moda ships in exactly one style — italic, weight 500. There is no upright display cut anywhere in the build; a roman Bodoni would read as a different world.

## Layout

The plate is a vertical scroll under fixed chrome: status bar, app bar (60px), coordinate band, chip rail, then the feed. Chrome stays put; only the plate scrolls.

**Spacing rhythm** is an 8-point scale with a 4 and a 12 step (`{spacing.xs}` through `{spacing.xxxl}`). Nothing in the app sets a spacing value off that list. Horizontal screen padding is 16px on compact and 26–30px in the wide detail pane.

**The feed row grid** is a fixed 44px mark gutter plus a fluid content column. The filing axis sits 27px from the left edge, dead centre of that gutter, so every mark lands on the line. Comments use a narrower 34px gutter with a hairline tick instead of a mark.

**Count cells hold their column.** A count cell is 78 × 34px on compact and 96 × 40px in the wide pane, always, regardless of the digits inside. The eye stops hunting for the number down the column.

**Responsive behaviour** is the Material width-class split at 900dp (`EXPANDED_WIDTH`). Below it: a 74px navigation bar at the bottom, the FAB floating bottom-right at 16px/96px, a single-column feed, and 84px of bottom padding so the list scrolls clear of the FAB. At and above it: an 88px navigation rail down the left with the compose action *inside* the rail, a fixed 420px list pane and a fluid detail pane, with the wide detail column capped at 660px. The tablet is a different layout, not a stretched phone.

**Density and reach:** every interactive target is at least 48dp (`HIT`). Primary actions live in the lower half on compact. Safe-area insets are honoured on all four edges. Layouts hold at 1.3× OS font scale.

### Named Rules

**The Unbroken Axis Rule.** One dotted 1px line runs the full height of the feed at x=27px, behind every row, joining every mark. It is constellation linework, not a divider — it must never break at a row boundary, a time block, or a page boundary.

**The Fixed Cell Rule.** A number lives in a cell of fixed width. Cells never shrink-wrap their content.

## Elevation & Depth

The plate is flat. Depth comes from tonal layering — sky behind, plate for chrome, plate-deep for the topmost transient surface — and from hairline ruling, never from shadows on content. No feed row, chip, cell or container carries a shadow. Shadows exist only on the Material objects that genuinely float above the plate, and they are soft and diffuse.

### Shadow Vocabulary
- **FAB rest** (`box-shadow: 0 3px 6px rgba(0,0,0,.32), 0 10px 24px -10px rgba(255,77,46,.6)`): the compact FAB, with a warm second layer reading as amber glowing onto the plate. The rail FAB drops the warm layer (`0 3px 6px rgba(0,0,0,.3)`).
- **Transient surface** (`box-shadow: 0 4px 8px rgba(0,0,0,.3), 0 16px 32px -18px rgba(0,0,0,.9)`): the snackbar, the only content-bearing surface that lifts.
- **Mark halo, dark theme only** (`box-shadow: 0 0 0 3px var(--sky), 0 0 7px rgba(242,242,233,.45)`): not elevation — a 3px knockout ring so the mark reads clean where it crosses the axis, plus a faint bloom that makes a chalk mark look like a star. The knockout ring recolours to Chart Blue when the row is selected, so the mark stays cut out of whatever it sits on.

### Named Rules

**The Flat-Plate Rule.** Content is never elevated. If a surface has a shadow it is a Material overlay — sheet, dialog, snackbar, FAB — temporarily above the plate, and its shadow is soft and diffuse. Hard offset shadows do not exist in this world.

## Shapes

The plate is ruled and rectilinear: Material's shape scale, themed sharp. Cells, chips, inputs, buttons and segmented controls take a 2px corner (`{rounded.cell}`) — enough to avoid a knife edge, not enough to read as rounded. Sheets and dialogs take 4px (`{rounded.sheet}`). Everything else is a right angle.

Circles are reserved and meaningful: the magnitude mark, the generated initials disc, the icon button's target, the compact FAB, the acquisition pulse, the unread dot. A circle in this world means *an object* or *a Material affordance*, never decorative rounding.

Borders do the work radius does not. Two ruling weights — hairline for row separation, rule for containment — plus the amber corner tick as the plate's registration mark. The compose sheet is topped by a 1px amber rule rather than a shadow. Icons are authored SVG at a single 1.5 stroke weight in a 24 box; no icon font and no glyph characters appear in the build.

**The Registration Tick Rule.** Corner ticks are two 7px amber L-brackets at the top-left and top-right of a surface, at 0.55 opacity. They mark the plate's *readout* surfaces — the coordinate band and the readout tables — and nothing else. They are registration marks, not decoration; putting them on an arbitrary container empties them of meaning.

## Components

### Buttons
- **Shape:** near-square (2px radius); full width in forms, auto width with 26px side padding in footers.
- **Primary:** amber fill, on-amber text, 50px tall, Jost 600 at 12.5px with 0.16em tracking, uppercase. Hover brightens 8%; disabled drops to 38% opacity with no brightening.
- **Outline:** transparent with a 1px amber border and amber text; the secondary and destructive path.
- **Text:** transparent, dim-ink, 46px tall, 0.1em tracking; goes amber on hover.
- **Icon button:** 48 × 48px circular target, ink glyph, amber-tint wash on hover and press.
- **FAB:** 56px, circular and floating bottom-right on compact. At expanded width it becomes a 16px-radius rail FAB docked in the navigation rail — never floating over an open post's reply bar.

### Chips
- **Style:** 34px tall, 2px corners, transparent with a rule-weight border, dim-ink Jost 500 at 12px, 0.07em tracking, uppercase. An optional 6px `currentColor` dot leads the label.
- **State:** hover brightens the text and turns the border amber; selected fills amber with on-amber text. The rail scrolls horizontally with the scrollbar hidden.

### Cards / Containers
There are no cards. The feed is rows on a ruled plate: a 1px hairline bottom border, a 44px mark gutter, no background at rest, an amber-tint wash on hover, and Chart Blue when selected in the two-pane. Anything that looks like a boxed, shadowed, rounded card is outside this system.

### Inputs / Fields
- **Style:** transparent field, 1px rule-weight border, 2px corners, 13px/12px padding, 15.5px Jost. Label above in tracked uppercase dim ink. The caret is amber.
- **Focus:** the border goes amber plus a 1px amber inset ring — a doubled stroke rather than a glow.
- **Error:** amber border plus an amber message line led by a warning glyph. Never colour alone.

### Navigation
- **Compact:** Material navigation bar, 74px, plate ground, hairline top rule. A destination is a 24px icon in a 60 × 30px pill with an 11px Jost label beneath. Selected turns amber and fills the pill with Deep Indigo; the indicator animates on background only (180ms). Badges are amber pills with mono numerals.
- **Expanded (≥900dp):** an 88px navigation rail down the left — compass rose at the top, rail FAB beneath it, then the same destinations stacked. The rail replaces the bar entirely; they never both appear.

### The Charted Object (signature)
The feed row: a magnitude mark, then the author in Bodoni italic, the handle and timestamp in mono, then the message.

**The Magnitude Rule.** A post's like count *is* its mark diameter, on a fixed five-step ramp — `[5, 7, 9, 12, 15]` px at thresholds 0 / 2 / 6 / 11 / 18 likes. The ramp is absolute and never rescaled to the visible page, because two identical posts must draw identically on every screen. This is the only hierarchy mechanism in the feed, and it is why there are no cards and no avatars.

The row is not one big control: opening the post is a button, each count is a button, and none nests inside another.

### The Count Cell (signature)
A fixed 78 × 34px cell with a tracked uppercase key and a tabular mono numeral. Resting state is a hairline outline in dim ink; the border goes amber and the text goes ink on hover; the liked state turns border and text amber.

**The Four Forms Rule.** In the composer, the character counter has four states and they are four different *forms*, not four tints: **under** is a hairline outline in dim ink, **near** is an amber outline, **over** is a solid amber fill with on-amber text, and **failed** is a dashed amber outline with an amber-tint wash and a warning glyph. A reader who cannot separate the hues still reads all four.

### The Coordinate Band (signature)
A ruled readout strip directly under the app bar, wearing corner ticks. Flexible cells divided by hairline verticals, each with a tracked amber cap over a value; the value mixes mono figures with an inline Bodoni italic run. It reads as instrumentation — `ALL SKY · 128 POSTS · 02:17` — and states what the feed is currently showing.

### States
- **Skeleton:** matches the geometry it replaces exactly — the 44px gutter, a varying dot, two text lines, two 78 × 34 cells — so nothing shifts on arrival. Fills use the skeleton tint and shimmer between 50% and 100% opacity over 1.5s.
- **Empty:** centred, generously padded — an amber glyph at 85% opacity, a Bodoni italic headline, one line of body-small copy capped at 32ch, and an auto-width action button.
- **Offline:** a full-width bar in the amber tint with amber rules top and bottom, an amber cloud-off glyph, and tracked uppercase text.
- **Two-pane dimming:** unselected rows drop to 74% opacity, never lower, so the unselected list stays genuinely readable.

### Motion
- **Ambient:** exactly one — a sidereal drift on the starfield canvas, which also paints celestial-map contour curves and chalk-grain speckle under the whole plate at theme-dependent opacity (0.55 dark, 0.34 light).
- **Discrete:** the acquisition pulse, a 20px amber ring scaling 0.55→2.4 and fading over 520ms on `cubic-bezier(.16,1,.3,1)`, fired once per like. Sheets, dialogs and snackbars rise 22px on the same curve (240–300ms). Material state changes use `cubic-bezier(.2,0,0,1)` at 180–200ms.
- **Reduced motion** collapses every animation and transition to 0.01ms and parks the starfield drift entirely.

**The One Ambient Moment Rule.** The starfield drift is the only thing that moves on its own. Everything else is discrete, damped, and a direct response to a tap.

### Focus
`:focus-visible` draws a 2px solid amber outline at 2px offset on every interactive element, in both themes. Text selection is amber at 30% alpha.

## Do's and Don'ts

### Do:
- **Do** size a post's mark from the fixed ramp `[5, 7, 9, 12, 15]` and let mark size carry all feed hierarchy.
- **Do** run the dotted filing axis unbroken behind the entire list at x=27px.
- **Do** put every number in a fixed-width cell, in Roboto Mono with tabular figures.
- **Do** use Chart Blue (`{colors.sel}`) and Deep Indigo (`{colors.sel-2}`) for every selected, active, or unread surface.
- **Do** theme Material 3 components — nav bar, nav rail, bottom sheet, chips, switch, FAB, snackbar — rather than rebuilding lookalikes.
- **Do** give every state a distinct form as well as a distinct colour.
- **Do** keep the light theme cool: blue-grey stock and indigo ink, so amber stays the only warm thing.
- **Do** author icons as SVG at 1.5 stroke weight in a 24 box, matching the existing set.
- **Do** hold a 48dp minimum on every target and verify layouts at 1.3× font scale.

### Don't:
- **Don't** put a post in a card. No boxed, shadowed, or rounded container around a feed row.
- **Don't** put an avatar circle in a feed row. The generated initials disc belongs on profiles and notifications only.
- **Don't** use the amber tint (`{colors.amber-bg}`) as a resting surface for a selected or active item. It is hover, the offline bar and the failed cell — nothing else.
- **Don't** rescale the magnitude ramp to the data on screen. It is absolute.
- **Don't** set Bodoni Moda upright, or use it for body copy, UI labels, or numbers.
- **Don't** use Roboto Mono for anything that is not a measured figure.
- **Don't** add a second ambient animation. There is one, and it is the starfield.
- **Don't** add a shadow to content, or a hard offset shadow anywhere.
- **Don't** scatter corner ticks onto containers that are not readout surfaces.
- **Don't** hand-pick a user's identity colour; derive it with `inkFor()`.
- **Don't** rename the product's nouns to fit the world. They are fixed: post, comment, like, feed, user, username — never "observation", "log", "sighting" or "sky".
