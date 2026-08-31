---
uid: request-94e93caa
id: REQ-153
type: request
title: Reserve locale-shaped page slugs
created_by: xgd
created_at: '2026-08-20T21:59:29.784434+00:00'
updated_at: '2026-08-31T14:22:27.187850+00:00'
completed_at: '2026-08-31T14:22:27.187850+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  priority: low
  story_points: 1
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: 31a4ca7da51ff8ff4dc9116434bd14e6acf8f60f
    reconcile_sha: null
    main_sha: null
  - working_sha: b404103fbde5313babac633855c81df57546bbeb
    reconcile_sha: null
    main_sha: null
  version: 0.2.5
  chat_comment: comment-18e5a285
  bundled_in: bundle-b3b7c399
---

# Reserve locale-shaped page slugs

## Why

`pageSchema.slug` was an unconstrained `z.string()`
(`packages/site-schema/src/schema.ts`). Nothing stopped a page being slugged `de` or `fr`.

If a locale path prefix (`/de/about`) is ever adopted — the conventional and most likely
shape, and the one [[DOC-34]] §9 leaves open — a page already published at `/de` becomes
structurally ambiguous with the locale segment. Because published URLs are what inbound
links, search rankings and anything a customer has printed or shared all point at, that
ambiguity is awkward to resolve after the fact rather than merely untidy. A published
revision is an immutable snapshot (DOC-12 §7), so such a page can be broken but not moved.

This is **cheap insurance, not a must**. Multilingual sites are explicitly deferred
([[DOC-34]] §9), and if a subdomain or query-parameter shape is chosen instead the concern
disappears entirely. It is proposed only because the guard costs about half an hour now and
removes a class of collision permanently.

## What changed

**`packages/site-schema/src/locale.ts`** — the reservation, alongside the rest of the
platform's locale knowledge (REQ-151's country/locale/currency/timezone derivation):

- `ISO_639_1_LANGUAGES` — the whole ISO 639-1 registry as data, not a curated subset. The
  rule is about what a URL segment *could* mean later, not what we render today; a code
  left out is a collision discoverable only once a site is published under it.
- `isLocaleShapedSlug(slug)` — true when the slug is *exactly* a locale segment:
  `language` or `language-region`, anchored whole, matched **case-insensitively** (`/DE`
  collides with a `de` prefix exactly as `/de` does). The language must be a real ISO 639-1
  code, so `zz` and `qq` are admitted — reserving shapes that could never become a locale
  is a tax with no collision behind it.
- `localeShapedSlugMessage(slug)` — the refusal text.

**`packages/site-schema/src/schema.ts`** — `pageSchema.slug` gains a `superRefine` calling
the above. Because it sits on the field, the issue path is `/pages/N/slug` automatically,
and because every writer funnels through `validateSite`, the guard reaches the CLI
(`1c edit page add`), the AI toolbox's `add_page`, and the store loader without any of them
being changed.

## Design decisions made during implementation

**The BCP 47 script subtag (`zh-Hans`) is deliberately NOT reserved.** An earlier draft
accepted `language[-script][-region]`, which matches any four-letter tail — and four-letter
tails are ordinary English. `de-luxe`, `no-cost` and `it-team` are all plausible page slugs
and none is a locale. Reserving them to defend `/zh-Hans/…` — a prefix that only arises for
a language with two living scripts, on a site that also happened to slug a page `zh-hans` —
trades a real cost for a negligible one. The numeric region form (`es-419`) *is* reserved:
a three-digit tail is never an English word, so it is free.

**The message carries its own justification and two concrete alternatives.** A validation
failure that reads as arbitrary is worse than none — the author cannot tell a rule from a
bug, so they work around it rather than renaming the page. The text names *why* the slug is
refused and gives `<slug>-services` / `about-<slug>`, because "pick something else" is not
an instruction anyone can act on quickly.

## Acceptance criteria

1. A page slugged `de`, `fr` or `pt-BR` is a validation error with a machine-readable path
   (`/pages/N/slug`) and an actionable message. ✅
2. A page slugged `design`, `deals` or `delivery` validates — the rule matches *only* the
   exact locale forms, never a prefix. ✅
3. Both existing sites still validate. ✅

## Test plan

`tests/test_UAT_FC_REQ-153_locale_slug_reservation.test.ts` — 30 UATs:

- **AC-1** parameterized over `de`, `fr`, `pt-BR`, `pt-br`, `DE`, `es-419`, `en`, `ga`;
  each asserts an error at `/pages/0/slug` whose message names the slug, mentions the
  locale reason, and offers both suggested forms.
- **AC-1 at the authoring entry point** — `editPageAdd(..., { path: 'de' })` rejects with
  a `CommandError` carrying `code: SCHEMA_INVALID` and `path: /pages/1/slug`, leaves no
  half-written page behind, and the same page is created successfully at `de-services`.
  This is what proves the guard is *reachable*, not merely present in the schema.
- **AC-2** parameterized over `design`, `deals`, `delivery`, `french-lessons`, `portfolio`,
  `english`, `zz`, `qq`, `no-fee`, `de-luxe`, `no-cost`, `it-team`, `zh-Hans`, `pt-brazil`,
  plus the three slugs both real sites use.
- **AC-3** enumerates `storage/sites/*` at runtime (rather than naming two sites) and
  validates each site's draft *and every published revision*, since a frozen revision could
  not be rescued by an edit. It also asserts the enumeration is non-empty, so the AC cannot
  pass vacuously.

Regression scope run green: `site-schema`, `req11-structured-edit`, `req22-storage`,
`generate`, `req107-authored-l1-envelope`, `reconciliation-site-storage-port`,
`test_UAT_FC_REQ-151_site_locale`, `test_UAT_FC_REQ-142_site_store_port`,
`reconciliation-scaffold-starter-l1`, `req102-scaffold-l1`,
`reconciliation-draft-change-journal` — 156 passed, 2 skipped.

A full `vitest.node` sweep shows 8 pre-existing failing files (builder/webui/AI-host/deploy
suites). Baselined by stashing this change and re-running the same set: identical
4 files / 14 tests failing with and without it. Not caused by REQ-153.

## Why free-coded

A single validation refinement with no dependencies.

## Origin

[[CHAT-26]] · [[DOC-34]] §9 — FR-5 of that session's foundational review, explicitly
flagged there as discretionary.