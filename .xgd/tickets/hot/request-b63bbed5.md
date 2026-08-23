---
uid: request-b63bbed5
id: REQ-101
type: request
title: 'No font-acquisition path or licence provenance: font registry + 1c fonts check'
created_by: xgd
created_at: '2026-07-26T01:26:56.621937+00:00'
updated_at: '2026-08-06T04:55:00.936129+00:00'
completed_at: '2026-08-06T04:55:00.936129+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: ef85b42827ec1baf09864bd0ea72e006d8c851ff
    reconcile_sha: null
    main_sha: null
  - working_sha: e85aa93c702b9173c8c49804d6785abab73c79cd
    reconcile_sha: null
    main_sha: null
  version: 0.0.225
  story_points: 3
  bundled_in: bundle-ee56a66e
  chat_comment: comment-ed5f74bb
---

## The gap

There is **no font-acquisition path for an authored site**, and no record of
where any font came from or what its licence permits.

`l1FontFaceSchema` binds a family handle to a served `.woff2` under
`draft/assets/`. Every font currently in the repo arrived inside a **capture
bundle** — the reproduction path supplies fonts as a side effect. Authoring has
no library, no CLI verb to add a face, and no bundled default, so an authored
site silently falls back to a system stack.

Found while authoring xgd.dev ([[request-d41fd017]], REQ-95), where the page
read generic until Satoshi + JetBrains Mono were downloaded and wired by hand.
On a text-driven site, type is most of the impression.

## Operator direction (2026-07-25)

Development-time downloading of **free** fonts is approved. What is required is
**tracking**: what we have, where it came from, and what licence actions remain
outstanding.

## Why this is a compliance artifact, not documentation

These findings constrain the **1st Contact product**, not just this repo:

1. **1st Contact can never buy one commercial licence and serve it across
   customer sites.** Commercial webfont licences are per-licensee, typically
   per-domain or by pageview, and agencies / hosting providers are explicitly
   barred from sharing one licence across client sites. Adobe Fonts additionally
   forbids self-hosting *and* uploading to a website design platform.
2. **Three legitimate models**: free-only default (V1); customer brings their own
   licence and attests; platform/OEM licence negotiated per foundry (what
   Wix/Squarespace do — not V1).
3. **Serving a licensed font from a public CDN without access controls counts as
   redistribution beyond scope.** Self-hosted free fonts sidestep this and stay
   inside the DOC-24 / DOC-2 envelope as static assets rather than third-party
   runtime dependencies.

The distinction that matters operationally: *"may I use this on xgd.dev"* and
*"may I ship this to 10,000 customer sites"* are **different questions with
different answers**. The registry must force both to be answered at download
time, not discovered later.

## What changed

### 1. The registry — `fonts/registry.yaml`

A project-level provenance index over every font file in the repo. Project
level, not per-site, because a licence obligation attaches to the font, not to
the site that happens to reference it — and because this file is the seed of
1st Contact's eventual font menu.

Each entry records `family`, `foundry`, `source` URL, `downloaded` date,
`licence` (name, URL, `commercial_use`, `self_host`, `redistribute_in_product`),
outstanding `actions`, and the `files` list. YAML, so the licence reasoning can
live in comments beside the flags it explains.

Font **files** stay per-site under `draft/assets/` — a site must remain
self-contained and portable. The registry is the index over them, not their home.

**The load-bearing field is `licence.redistribute_in_product`**, a three-state
value rather than a boolean:

| value | meaning |
|---|---|
| `true` | settled — the licence permits product redistribution |
| `false` | settled — it does not |
| `REVIEW_REQUIRED` | asked, not yet answered |

Every gate treats `REVIEW_REQUIRED` as *no*, so an unresolved licence cannot
leak into product distribution by default. This is what forces the second
question to be answered at download time rather than discovered later.

Schema and validator live in `@1stcontact/site-schema`
(`packages/site-schema/src/fonts.ts`) — the canonical validator home.

### 2. A distribution marker on site config

`siteConfig.distribution: 'internal' | 'product'` (optional, defaults to
`internal`). `internal` is a site we build and serve ourselves, where a free
font with an unresolved product question is fine. `product` asserts the site
ships across customer domains, where a per-licensee licence cannot be shared.

### 3. Enforcement — `1c fonts check`

Without a gate the registry is documentation, and documentation drifts. The
check scans **both** site trees (`storage/sites/` and `storage/sandbox/` — the
sandbox is where capture-derived fonts land) plus the source trees on disk, and
raises four violations:

| kind | question it answers |
|---|---|
| `unregistered-family` | a page names a font we cannot account for at all |
| `unregistered-file` | family known, but not this particular file — a weight added by hand escapes the record |
| `unprovenanced-file` | bytes are in the tree that no entry records, even though nothing references them yet |
| `redistribution-not-permitted` | the site declares `distribution: product` and the licence does not permit that, or has not been resolved |

Outstanding `actions` **warn but do not fail** — that is exactly the state a
font legitimately sits in while cleared for this repo and not yet cleared for
the product. `redistribute_in_product` is the blocking gate.

A missing or malformed registry is a hard error, never a vacuous pass: silently
checking against nothing would report clean over completely un-provenanced fonts.

### 4. Backfill

All 23 font files on disk registered across 10 families, in two provenance
classes:

- **Authored** — Satoshi (400/500/700/900, ITF Free Font Licence) and JetBrains
  Mono (OFL 1.1), deliberately downloaded for xgd.dev.
- **Capture-derived** — Cinzel, Oswald, Lato, Raleway, Karla and others that
  arrived mirroring third-party sites. The bytes are a copy of someone else's
  serving infrastructure, usually a Google Fonts subset under a hashed filename.
  The underlying families are mostly OFL, but the *subsetting and delivery*
  provenance is unverified, so each carries an action to re-obtain from the
  canonical upstream release before product use. They are reproduction inputs,
  not product assets.

Seven families carry open actions today; the check reports them and passes.

## Design decisions made during iteration

**Provenance is demanded of the file, not of the reference to it.** The first
implementation joined only what a page referenced. That left the class this
ticket cares most about invisible: a capture bundle mirrors fonts into
`storage/references/`, and those bytes are in the repo whether or not any page
points at them — with exactly the redistribution status least likely to be
clear. Nothing failed when a new bundle brought unregistered faces in; their
registration was held only by a hardcoded filename list in a test, which is the
documentation-drift failure mode the registry exists to prevent. The source-tree
scan (`unprovenanced-file`) closes that, and turns "existing on-disk fonts are
backfilled" from a state asserted once into a live gate holding in both
directions.

**`storage/dist/` and `storage/node_modules/` are excluded from the scan.**
`dist/` is gitignored render output copied byte-for-byte from a draft; scanning
it would double every finding and make the check depend on whether anyone had
rendered recently. `node_modules/` is vendored.

**Registration is provenance, not approval.** A registered family with an open
action warns rather than fails, so the registry can honestly record a partially
resolved licence instead of forcing a premature `true`/`false`.

**Three-state `redistribute_in_product` rather than a boolean.** A boolean
cannot distinguish "we checked and the answer is no" from "nobody has asked
yet", and those need different follow-up.

## Test plan

`tests/req101-font-registry.test.ts` — 11 UATs, driven through the real CLI
entry point (`run(['fonts','check'])`) against real on-disk site trees in temp
workspaces, so file layout, YAML parse, site load and exit code are exercised
end-to-end:

- `registry_records_provenance_for_every_font_on_disk`
- `shipped_registry_accounts_for_every_font_file_in_the_repo` — both directions
- `check_passes_over_the_real_repo_trees`
- `unregistered_family_fails_the_check`
- `registered_family_with_unlisted_file_fails_the_check`
- `unreferenced_font_file_on_disk_fails_the_check` — including that `dist/` is
  not double-counted
- `product_distribution_gates_on_unresolved_redistribution`
- `outstanding_actions_warn_but_do_not_fail`
- `check_spans_both_site_trees_and_a_missing_registry_is_an_error`
- `site_config_accepts_the_distribution_marker`
- `asset_src_resolves_to_the_registry_file_key`

Regression scope: full suite 902 passing / 128 files; `tsc --noEmit` clean for
`tools/generate` and `packages/site-schema`; `1c fonts check` green on the real
repo (10 families, 13 references across 3 sites, 23 files on disk).

## Acceptance — status

- ✅ A registry file records family, source URL, download date, licence name +
  URL, commercial-use / self-host / redistribute-in-product flags, outstanding
  actions, and the file list.
- ✅ `1c fonts check` fails on an unregistered family referenced by any site.
- ✅ `1c fonts check` fails on a family whose `redistribute_in_product` is unmet
  when that site is marked as product-distributed.
- ✅ Existing on-disk fonts are backfilled, including capture-derived ones — and
  the backfill is now enforced, not merely done.

## Not done (deliberate)

No acquisition *verb* (`1c fonts add <url>`) was built. The ticket's gap
statement names one, but the operator direction and every acceptance criterion
are about **tracking**, not automation — and a download command is only useful
once the font menu it would draw from exists. Downloading by hand and
registering is a two-minute operation today; the gate is what was missing.