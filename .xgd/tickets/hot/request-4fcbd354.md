---
uid: request-4fcbd354
id: REQ-151
type: request
title: Site locale identity, and rendered lang/dir
created_by: xgd
created_at: '2026-08-20T21:59:13.430458+00:00'
updated_at: '2026-08-31T14:22:31.114008+00:00'
completed_at: '2026-08-31T14:22:31.114008+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  priority: high
  story_points: 3
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: ced4356a6a0fb88f2fb4f71c6d47060e65881499
    reconcile_sha: null
    main_sha: null
  - working_sha: 38e4a3cf22519d0ff24de047e0a3bb7a4d75dcb6
    reconcile_sha: null
    main_sha: null
  version: 0.2.3
  chat_comment: comment-eff816c4
  bundled_in: bundle-b3b7c399
---

# Site locale identity, and rendered `lang` / `dir`

## Why

The first customer cohort is international — Ireland (EUR) and the UK (GBP) alongside US
customers. `siteConfigSchema` (`packages/site-schema/src/schema.ts`) had **no notion of
where a business is**: it carried `businessName`, `tagline`, `contact`, `integrations` and
`distribution`, and nothing else. `contact.address` exists but is a free-text string — it
cannot drive a formatting decision and is not a substitute.

In its absence the US/English assumption was hardcoded. `<html lang="en">` was a literal in
**two** renderers:

- `packages/framework/src/l1/render.ts` (`renderL1Page`)
- `tools/generate/src/render/render.ts` (`renderPage`)

**The `lang` half is the part with a closing window.** Published revisions are immutable R2
snapshots ([[DOC-12]] §7; `tools/generate/src/cli/commands.ts` — *"a revision is immutable
and there is nothing on it to edit"*). A site published before this lands carries
`lang="en"` permanently, and fixing the renderer does **not** fix published artifacts —
every live site would need republishing, which is an operational act that can sweep in
draft changes the customer has not approved. Search engines also index `lang`, so a wrong
value costs re-crawl time to recover.

At implementation time there were **zero published revisions** (`storage/sites/*/history.json`
are both `{"revisions": []}`), so the cost was hours. That is the reason to do it now rather
than when it becomes obviously needed.

A wrong `lang` is also a live accessibility defect independent of i18n: it is what a screen
reader uses to choose pronunciation.

## What changed

**1 — Four optional fields on `siteConfigSchema`:**

| field | standard | example |
|---|---|---|
| `country` | ISO 3166-1 alpha-2 | `IE` |
| `locale` | BCP 47 | `en-IE` |
| `currency` | ISO 4217 | `EUR` |
| `timezone` | IANA zone id | `Europe/Dublin` |

`locale`, `currency` and `timezone` **derive from `country`** when absent, each individually
overridable. They stay separate fields rather than being derived at each use because they
correlate without determining: locale decides placement and separators, currency decides
symbol and decimal count. `Intl.NumberFormat('en-IE', …EUR)` → `€49.99`;
`('de-DE', …EUR)` → `49,99 €`.

**2 — A country → (locale, currency, timezone) derivation table**
(`COUNTRY_DEFAULTS`, `packages/site-schema/src/locale.ts`). 66 countries covering the EU,
North America, Latin America, Africa/Middle East and Asia-Pacific, including the RTL ones
(`AE`, `EG`, `IL`, `IR`, `MA`, `QA`, `SA`, `PK`). Adding a country is **one row** — a data
edit, not a code change. A country spanning several zones carries one explicit,
commented pick (its largest-population civil zone), overridable via `timezone`.

**3 — Both renderers emit `lang` and `dir`** from `resolveSiteLocale(site.config)`.
`renderL1Page` gained a third parameter carrying the site's raw locale fields;
`renderPage` reads them off the site it already holds. `dir` is `rtl` for RTL scripts,
`ltr` otherwise, decided by the **script** subtag when one is present and the language
subtag otherwise — the only way `az-Arab` and `az-Latn` are both right.

**4 — The resolved locale reaches behavior modules** as `BehaviorProps.locale`
(`{ country, locale, currency, timezone, dir }`), handed down by `renderModuleInstances`.
The payments and calendar modules will both read it rather than each deriving its own.

**No DB migration was required.** `sites.site_json` is a verbatim TEXT blob
(`db/migrations/0001_site_store.sql`).

## Design decision made during implementation: the undeclared default

The ticket's AC-1 asked for `lang="en"` when nothing is declared, while "what to change"
said `country` defaults to `US` — which would derive `en-US`. Both are honoured, and the
tension resolves on a principle rather than a compromise:

- **`country` declared as `US`** is a fact about the business → `en-US`.
- **Nothing declared** is the *absence* of that fact → the region-free **`en`**
  (`UNDECLARED_LOCALE`). Stamping `lang="en-US"` on a page whose owner never said where
  they are asserts something we were not told, into an attribute a screen reader and a
  search index both act on. `en` says exactly what we know, and is byte-identical to the
  literal it replaced.

`currency` and `timezone` take no such care because there is no region-free EUR and no
region-free clock: `US` has to answer for them or nothing does.

## Acceptance criteria

1. A site with no locale fields validates and renders exactly as before (`lang="en"`,
   `dir="ltr"`) — no regression for the two existing sites.
2. A site declaring `country: 'IE'` and nothing else resolves to `en-IE` / `EUR` /
   `Europe/Dublin`, and renders `<html lang="en-IE" dir="ltr">`.
3. An explicit `locale`, `currency` or `timezone` overrides the derived value; the others
   still derive.
4. Both render paths emit the same `lang`/`dir` for the same site — no divergence between
   `packages/framework` and `tools/generate`.
5. An RTL locale renders `dir="rtl"`.
6. An invalid country / locale / currency / timezone is a **validation error with a
   machine-readable path** (`/config/<field>`), not a silent fallback. An unsupported
   country is invalid — it is not quietly served American defaults.
7. The resolved locale is available to a behavior module at render time.

## Tests

`tests/test_UAT_FC_REQ-151_site_locale.test.ts` — 9 UATs:

- `..._a_site_declaring_no_locale_renders_exactly_as_before` (AC-1)
- `..._every_real_site_on_disk_still_validates` (AC-1, against the actual `storage/sites/`)
- `..._country_alone_derives_locale_currency_and_timezone` (AC-2)
- `..._each_field_overrides_independently` (AC-3)
- `..._both_render_paths_emit_the_same_lang_and_dir` (AC-4 — both are rendered and compared)
- `..._a_right_to_left_locale_renders_dir_rtl` (AC-5)
- `..._a_bad_locale_field_is_a_validation_error_with_a_path` (AC-6, nine bad inputs)
- `..._a_behavior_module_is_handed_the_resolved_locale` (AC-7)
- `..._the_country_table_is_data_and_is_internally_consistent` — every row in the table is
  held to the same validation a site's own declaration is, so a mistyped zone or a
  lowercase currency in a future row fails here rather than when a customer signs up.

Regression scope run: the full node project (247 files) and the full workers project
(7 files, 58 tests, all green). Node failures are all pre-existing on `xgd-working` and
unrelated — verified by re-running the same seven files with this ticket's changes stashed
and getting an identical 23 failures. They are: the assistant/chat-host suites (missing API
key), the deploy-smoke suite, `reconciliation-site-storage-port` (imports a
`contact-form/index.astro` that no longer exists), and `reconciliation-scaffold-starter-l1`
(REQ-150's `1c.mjs` imports `vite`, which is not a declared root dependency — see below).

## Note for the operator, outside this ticket's scope

`tools/generate/bin/1c.mjs` (REQ-150, commit `258381e2d`) imports `vite` directly, but
`vite` is not in the root `package.json` dependencies. `node tools/generate/bin/1c.mjs help`
fails with `ERR_MODULE_NOT_FOUND: Cannot find package 'vite'`, which fails
`test_UAT_AC875` and `test_UAT_FC_REQ-89_cli_boots_no_missing_pages_warning`. Pre-existing
on `xgd-working` before this merge; not fixed here because it belongs to REQ-150.

## Why free-coded

Small, well-bounded, and time-sensitive — the immutability of published revisions means the
cost rises the moment the first customer site goes live.

## Origin

[[CHAT-26]] · [[DOC-34]] §5 — FR-1 and FR-2 of that session's foundational review.