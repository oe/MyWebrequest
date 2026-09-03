# Website design contract

## Visual source

The accepted layout concepts live in `design/concepts/`:

- `home-hero-desktop.png`
- `home-workflow-desktop.png`
- `help-center-desktop.png`
- `home-mobile.png`
- `logo-modernization.png`

The page follows the concepts' cool-white canvas, editorial spacing, sparse blue accents, open grid, and restrained translucent chrome. The production logo intentionally departs from the branching-node mark shown in the early layout concepts: it is a conservative remaster of the historical glossy blue globe so returning users keep the same visual identity.

## Product rules

- One primary hero action: quick start. GitHub is secondary.
- Do not show store-install buttons until an official listing or release artifact exists.
- Avoid card walls. Use dividers and open layout for workflows, capabilities, and guide navigation.
- Keep shadows below 10% opacity. Glass is limited to navigation and the product frame.
- Every page has canonical and alternate-language links.
- JavaScript is not required for reading any page.
- The home page keeps one clear product story: outcome, three-step workflow, supported actions, four help
  entry points, and privacy. Search terminology belongs in concise semantic copy and metadata, not filler.
- Help navigation exposes four task groups and expands only the current group; never repeat the full guide
  list on both sides of an article.
- Technical recipes keep readable code blocks behind native disclosure controls so scenario titles stay
  scannable without hiding content from no-JavaScript readers.
- Breaking changes always pair the old behavior with a supported alternative or a clear no-equivalent note.

## Responsive behavior

- Desktop: split hero, three-step horizontal workflow, three-column capability grid.
- Tablet: stacked hero, two-column content where space permits.
- Mobile: single-column content, vertical workflow, minimal navigation.
- Respect reduced-motion preferences and provide a non-blur fallback.
