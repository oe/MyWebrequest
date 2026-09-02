# My Webrequest website

Astro 7 static product site and multilingual help center. It is published as a GitHub Pages project site at `https://app.evecalm.com/MyWebrequest/`.

```sh
pnpm site:dev
pnpm site:check
pnpm site:build
```

English uses unprefixed URLs. Simplified Chinese, Korean, Japanese, French, and Spanish use locale-prefixed routes. Keep the extension help URLs in `src/ui/help-links.ts` aligned with these routes.
