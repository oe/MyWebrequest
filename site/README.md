# My Webrequest website

Astro 7 static product site and multilingual help center. Its canonical URL is `https://webrequest.forth.ink/`, with GitHub Pages providing the static hosting.

```sh
pnpm site:dev
pnpm site:check
pnpm site:build
```

English uses unprefixed URLs. Simplified Chinese, Korean, Japanese, French, and Spanish use locale-prefixed routes. Keep the extension help URLs in `src/ui/help-links.ts` aligned with these routes.

## Custom-domain cutover

Before publishing the canonical-domain change:

1. Verify `forth.ink` in GitHub Pages.
2. Add `webrequest.forth.ink CNAME oe.github.io` in DNS; do not point it at a repository path.
3. Set `webrequest.forth.ink` as this repository's Pages custom domain and enforce HTTPS.
4. Redirect `https://app.evecalm.com/MyWebrequest/*` permanently to the same path on
   `https://webrequest.forth.ink/*`.
5. Verify both hosts in Search Console, submit the new sitemap, and monitor indexing during the move.

The help center publishes eight guides per locale behind four task-first entry points. Advanced Redirect
examples stay aligned with actual match, capture, permission, and runtime behavior, while their details use
progressive disclosure. The breaking-changes guide is the public contract for legacy 0.12.11 users:
removed features need an explicit alternative or an explicit statement that no safe equivalent exists.
