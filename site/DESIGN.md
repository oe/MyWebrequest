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
- Technical recipes use readable code blocks and open bullet lists rather than adding a new card system.
- Breaking changes always pair the old behavior with a supported alternative or a clear no-equivalent note.

## Responsive behavior

- Desktop: split hero, three-step horizontal workflow, three-column capability grid.
- Tablet: stacked hero, two-column content where space permits.
- Mobile: single-column content, vertical workflow, minimal navigation.
- Respect reduced-motion preferences and provide a non-blur fallback.
