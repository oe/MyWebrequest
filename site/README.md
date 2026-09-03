# My Webrequest website

Astro 7 static product site and multilingual help center. It is published as a GitHub Pages project site at `https://app.evecalm.com/MyWebrequest/`.

```sh
pnpm site:dev
pnpm site:check
pnpm site:build
```

English uses unprefixed URLs. Simplified Chinese, Korean, Japanese, French, and Spanish use locale-prefixed routes. Keep the extension help URLs in `src/ui/help-links.ts` aligned with these routes.

The help center publishes eight guides per locale. Advanced Redirect examples must stay aligned with the
actual match, capture, permission, and runtime behavior. The breaking-changes guide is the public contract
for legacy 0.12.11 users: removed features need an explicit alternative or an explicit statement that no
safe equivalent exists.
