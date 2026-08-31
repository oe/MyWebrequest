# My Webrequest 2 Product Specification

Status: Approved baseline; implementation in progress  
Last updated: 2026-08-31  
Owners: Product and engineering  
Related documents: [ARCHITECTURE.md](ARCHITECTURE.md), [MIGRATION.md](MIGRATION.md), [DESIGN_BRIEF.md](DESIGN_BRIEF.md)

## 1. Product definition

My Webrequest 2 is a local-first Chrome extension for developers and advanced users who need to create, test, enable, and manage request-handling rules without editing raw extension manifests or DNR JSON.

The extension has one purpose:

> Make browser request rules understandable, safe, and easy to control.

It is not a general browser utility, an ad blocker, a request recorder, or a replacement for Chrome DevTools.

`My Webrequest 2` is a working product name. Renaming is outside the V1 implementation decision unless explicitly approved.

## 2. Users and jobs

### Primary users

- Front-end and full-stack developers testing redirects or request behavior.
- QA and support engineers reproducing site-specific networking conditions.
- Advanced users maintaining a small number of persistent URL rules.

### Primary jobs

1. Create a rule for the current site with the minimum necessary permission.
2. Understand exactly which requests a rule can affect.
3. Test a URL before enabling a rule.
4. See why a rule cannot run, including missing permission or unsupported syntax.
5. Disable, edit, duplicate, export, or delete a rule without losing context.
6. Migrate legacy rules without silent data loss.

## 3. Product principles

- **Local first:** rules and settings remain on the device. V1 has no account, cloud sync, analytics, or third-party request.
- **Permission in context:** request host access only when a user enables a rule that needs it.
- **Explain before applying:** preview matches, effects, permission scope, and migration changes.
- **No silent failure:** invalid, shadowed, unsupported, or unauthorized rules have a visible state and reason.
- **Progressive complexity:** common rules are simple; regex and advanced conditions are opt-in.
- **Single purpose:** every feature must contribute directly to request-rule management.
- **Reversible actions:** destructive actions support undo or an explicit preview.

## 4. V1 scope

### Included

#### Rule actions

- Block a request.
- Redirect to a fixed URL.
- Redirect using DNR-compatible regex capture substitution.
- Remove a request header.
- Set a request header.
- Upgrade an HTTP request to HTTPS only as a migrated or advanced rule action; there is no dedicated HTTPS feature page.

#### Rule conditions

- URL filter or regex filter.
- Resource type selection.
- Request method selection where supported by DNR.
- Optional initiator-domain restriction.
- Rule priority.
- Enabled or disabled state.

#### Rule management

- Search, filter, create, edit, duplicate, enable, disable, and delete.
- Test a candidate URL before saving.
- Detect invalid regex, unsupported regex, redirect loops, and local priority conflicts.
- Display permission requirements and current grant state.
- Import, export, merge, and replace with a preview.
- Show DNR quota usage and an internal safety limit.

#### Legacy migration

- Read the legacy `localStorage` format on update.
- Classify every legacy item as automatic, changed, unsupported, or removed.
- Require confirmation before enabling migrated rules.
- Preserve original unsupported data in an exportable migration snapshot.

#### Product surfaces

- Chrome action popup for current-site status and quick entry.
- Full-page options UI as the primary rule manager.
- First-run or upgrade migration flow inside the options UI.
- English and Simplified Chinese from the first release.

### Deferred beyond V1

- Response-header modification and CORS presets.
- Side panel and live match inspection.
- Rule groups, reusable variables, and shared presets.
- Cross-device sync.
- Firefox, Edge, and Safari releases.
- Team sharing and managed enterprise policies.

### Removed

- QR-code generation.
- Whole-browser request logging.
- Standalone HSTS/HTTPS feature.
- Standalone Hotlink feature; it becomes a request-header preset.
- Google search redirect utility.
- Google CDN to 360/useso redirect.
- Icon-style customization.
- Remote services, telemetry, donation UI, and unrelated context-menu actions.

## 5. Primary workflows

### 5.1 Quick rule from the current site

1. The user opens the popup.
2. The popup identifies the current origin through the user gesture.
3. The user selects `Create rule for this site`.
4. The full editor opens with a scoped match prefilled.
5. The user chooses an action and tests a URL.
6. When enabling, the extension explains and requests only the required origin.
7. The rule is compiled, saved, and applied.

### 5.2 Create or edit from the manager

1. The user opens the full rule manager.
2. The user searches or filters rules.
3. Selecting a rule opens a persistent editor alongside the list.
4. The editor continuously validates but does not interrupt typing.
5. The test area explains whether the URL matches and the resulting action.
6. Saving updates storage and DNR as one application transaction.

### 5.3 Import or migrate

1. The extension parses source data without applying it.
2. A report groups changes by outcome and explains semantic differences.
3. The user can inspect unsupported originals.
4. The user chooses merge or replace.
5. Permission requests happen only for rules the user chooses to enable.
6. A migration snapshot remains available for rollback/export.

## 6. Functional requirements

### Popup

- Show global enabled state.
- Show current-site access state.
- Show the number of enabled rules scoped to the current site.
- Offer `Create rule for this site` and `Open rule manager`.
- Allow temporary global pause with a clearly visible restoration action.
- Never contain the full rule editor.

### Rule manager

- Keep rule selection when filters change unless the selected rule is no longer visible.
- Support keyboard navigation through the rule list.
- Preserve unsaved changes and warn before discarding them.
- Show action, scope, enabled state, and permission state in each row.
- Make unsupported or blocked states actionable rather than decorative.
- Support undo after deleting one rule; require a preview for bulk deletion.

### Rule editor

- Use a Basic mode for URL filter, resource type, and common actions.
- Use an Advanced section for regex, initiator domains, methods, and priority.
- Display required permissions before save/enable.
- Keep test input and result visible while editing.
- Use DNR support checks before a regex rule can be enabled.
- Prevent obvious self-redirect and redirect-cycle cases.

### Data management

- Export a versioned, human-readable JSON document.
- Validate imports against a strict schema.
- Never execute, render as HTML, or trust imported strings.
- Preview add, update, skip, conflict, and delete counts before applying.
- Retain an automatic local snapshot before replace or migration.

## 7. Privacy and permission requirements

- No required host permissions at installation.
- Use optional host permissions and request them from a direct user gesture.
- No request-body, browsing-history, cookie, or authentication data collection.
- No network endpoint owned by the product.
- No remote code, remote fonts, remote analytics, or dynamically downloaded configuration.
- Show a plain-language explanation before every new permission request.
- Reflect revoked permission immediately in affected rule states.
- Do not persist incognito activity or derived browsing data.

## 8. Accessibility and localization

- Meet WCAG 2.2 AA for the popup and options UI.
- Full keyboard operation with visible focus.
- Do not use color as the only status indicator.
- Respect zoom, text scaling, high contrast, and `prefers-reduced-motion`.
- Use semantic controls and announcements for validation, save, and permission results.
- Externalize all user-visible strings and design for Chinese text expansion.

## 9. V1 acceptance criteria

V1 is complete only when:

- A clean install requests no host access.
- Each supported action is proven by a real browser E2E test.
- A rule still works after the extension service worker terminates and restarts.
- Permission grant, refusal, revocation, and re-grant have tested UI states.
- All captured legacy fixtures produce a deterministic migration report.
- Unsupported legacy rules remain exportable and are never silently discarded.
- Import replace can be rolled back using the automatic snapshot.
- Popup and manager pass keyboard and automated accessibility checks.
- Production artifacts contain no remote code, source maps, undeclared endpoints, or unused permissions.
- Chrome Web Store listing, privacy disclosure, and single-purpose statement match actual behavior.

## 10. Non-goals and decision gates

- Do not promise full compatibility with the legacy Custom URL language.
- Do not add response-header modification until the V1 request-header model is shipped and reviewed.
- Do not add a side panel until a validated workflow requires persistent in-page UI.
- Do not add sync or telemetry without a new product/privacy review.
- Visual direction selected: the split-pane rule-manager structure with shadcn's default
  `radix-nova` visual language, neutral palette, Geist typography, and restrained semantic color.
