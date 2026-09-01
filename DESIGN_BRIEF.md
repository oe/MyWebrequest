# My Webrequest Design Brief

Status: Direction selected and implemented as the V1 UI baseline  
Last updated: 2026-08-31  
Related documents: [PRODUCT_SPEC.md](PRODUCT_SPEC.md), [ARCHITECTURE.md](ARCHITECTURE.md), [MIGRATION.md](MIGRATION.md)

## 1. Design target

Redesign the Chrome extension as a focused desktop request-rule workbench for developers and advanced users.

The visual ideation target is the **full-page rule manager**, not a landing page and not a feature inventory. The frame should show the hero workflow: understanding and editing one selected redirect rule while keeping the surrounding rule list visible.

The popup is designed after a full-page direction is selected so both surfaces share one visual system.

## 2. Intended outcome

A user should be able to answer these questions within seconds:

- Which rules are active?
- What request does the selected rule match?
- What will it do?
- Does it have permission to run?
- How can I test or safely change it?

The UI should feel trustworthy, precise, calm, and fast. It should not resemble an ad-blocker dashboard, marketing site, generic admin template, or terminal emulator.

## 3. Product label and mock data

Use `My Webrequest` as the product label. `Request Rules` may be used only as descriptive copy, never as
the extension name.

Use realistic mock rules:

- `Mirror API to local` — Redirect — enabled.
- `Block analytics beacon` — Block — enabled.
- `Remove image referer` — Header — enabled.
- `Legacy search redirect` — Redirect — needs review.
- `Old CDN mirror` — Removed — disabled.

Selected rule details:

- Name: `Mirror API to local`
- Match: `https://api.example.com/v1/*`
- Action: Redirect
- Destination: `http://localhost:3000/v1/$1`
- Permission: `api.example.com` — Granted
- Test URL: `https://api.example.com/v1/users`
- Result: `http://localhost:3000/v1/users`

Use short, accurate English UI labels in generated images to improve visual text fidelity. Production UI is bilingual.

## 4. Required hierarchy

The desktop frame must prioritize:

1. Page title and one primary `New rule` action.
2. Search/filter access without turning the top area into a dashboard.
3. A scannable grouped list of rules.
4. One selected rule's editor.
5. A clearly visible test input and result.
6. Permission and validation state close to the fields they affect.

Supporting destinations such as Settings and Migration may appear in restrained navigation but should not compete with Rules.

## 5. Required interaction model

- Selecting a row changes the editor without leaving the page.
- Editing preserves list context.
- Basic fields are immediately visible.
- Advanced conditions are collapsed or visually secondary.
- Save is the only emphasized editor action.
- Delete is available but visually quiet.
- Disabled, permission-blocked, invalid, and review-required are distinct states using icon, text, and color.
- Test result explains match/no-match and resulting action, not merely `success`.

## 6. Visual principles

- Use the full application surface; do not place the entire app inside a centered card.
- Separate areas first with alignment, spacing, typography, and subtle dividers.
- Avoid cards inside cards and one-card-per-rule layouts.
- Prefer a grouped list or table with lightweight row separation.
- Body typography should be 14–16px equivalent.
- Use a system-oriented sans-serif; no remote font dependency.
- Use a restrained neutral foundation with one primary accent and semantic status colors.
- Prefer solid surfaces to gradients, glass effects, or decorative illustration.
- Use shadows only for temporary overlays or clear elevation.
- Keep icons functional and locally bundled.
- Support light and dark themes; visual concepts may show light mode first.

## 7. Accessibility requirements

- WCAG 2.2 AA target.
- Visible keyboard focus with at least a 2px-equivalent treatment.
- Minimum 24px pointer target; aim for 32–36px controls in the dense desktop UI.
- Color is never the only status signal.
- Text contrast and muted text remain readable.
- Error placement does not cause disruptive layout shifts.
- Reduced-motion mode removes nonessential transitions.

## 8. Responsive behavior

Primary target: desktop options page at `1440 x 1024`.

- At 1200px and above: list and editor are visible side by side.
- Between 800px and 1199px: list narrows; editor remains primary.
- Below 800px: list and editor become navigable views rather than compressed columns.
- The popup is a separate compact surface and should not be represented by shrinking the desktop layout.

## 9. Concept directions

Generate exactly three independent images with meaningfully different hierarchy and visual system.

### Chrome-native utility

- Quiet, familiar, lightweight, and highly trustworthy.
- Subtle Chrome/Material-adjacent control language without copying Chrome settings.
- Comfortable density and restrained blue accent.
- Best for broad usability and low learning cost.

### Developer workbench

- Strong split-pane editing model.
- Monospace only for URLs, filters, and result values.
- Slightly darker neutral contrast and more explicit structure.
- Best for explaining complex rule behavior without becoming terminal-like.

### Compact operations console

- Higher-density grouped table and a narrower inspector.
- Strong keyboard-first cues, compact filters, and precise status presentation.
- Best for users managing dozens of rules, while remaining visually calm.

## 10. Explicitly avoid

- Marketing hero copy, charts, metrics, or usage graphs.
- Large decorative cards or illustrations.
- Browser/device mockup frames.
- Fake Chrome browser chrome.
- Neon cyberpunk, glassmorphism, gradients, or excessive shadows.
- Dense raw JSON as the default editing experience.
- An always-visible log console.
- QR, donation, account, cloud-sync, or collaboration UI.
- More than one primary action.
- Tiny labels, clipped content, unreadable regex, or placeholder gibberish.

## 11. Selection criteria

The selected direction should score best on:

1. Rule scanning speed.
2. Match/action comprehension.
3. Permission clarity.
4. Editor focus without losing list context.
5. Accessibility and keyboard plausibility.
6. Ability to scale from five to fifty rules.
7. Visual longevity rather than novelty.

Selected direction: the developer-workbench split-pane hierarchy, refined to use shadcn's default
`radix-nova` style. The implementation keeps a neutral palette, compact controls, Geist typography,
subtle separators, Lucide icons, and semantic color only for permission, warning, and error states.

The selected refinement adds a restrained Apple-like material system without changing the information
architecture: translucent structural chrome, stronger edge highlights, system-font preference, immediate
press feedback, and solid fallbacks for reduced transparency or increased contrast. Glass is reserved for
the header, sidebar, popup, overlays, and persistent editor toolbar; form content remains calm and legible.
