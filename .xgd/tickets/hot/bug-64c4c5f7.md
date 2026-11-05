---
uid: bug-64c4c5f7
id: BUG-299
type: bug
title: '1stcontact.io account links: both broken; show an avatar and My businesses
  side by side'
created_by: EPIC-19
created_at: '2026-10-26T15:47:16.734181+00:00'
updated_at: '2026-10-26T20:21:32.902252+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  priority: high
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-668fb2ee
  commits:
  - working_sha: 0d9681e85c647dc2e721d778fb12b0e4b75cd526
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: f5026050e25cc676071b56c78b1715ea62a96bbf
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  version: 0.2.672
  story_points: 5
---

## Symptom

On the public 1stcontact.io page, a signed-in visitor sees two links stacked vertically, "Go to your
account" and "Your businesses". Both are broken.

## Cause

- **The links point at app routes that don't exist.** The 1st Contact site's `account-chrome`
  module (production: business `biz_51a6746495c8057e886ff98d4208e6b9`, site
  `site_c4bed79aeb647305a5e3098f70d6dca3`, `home.json`, module `signin`) is configured with
  `portal: https://app.1stcontact.io/portal` and `businesses: https://app.1stcontact.io/businesses`.
  The app serves the account portal at `/account` (`PORTAL_PATH`, `apps/control-app/src/portal.ts`).
  Its businesses list is the builder's entry at `/` (the business switcher), and only `/api/businesses`
  exists under that name. Nothing answers `/portal` or `/businesses`. (The repo's copy of the same
  site, `tests/fixtures/l1-corpus/.../1stcontact/draft/pages/home.json`, pointed at `/builder`, which
  is also dead — every hand-typed copy was wrong in its own way.)
- **The labels and layout aren't what the operator wants.** The config overrides the labels to
  "Go to your account" / "Your businesses". The module (`packages/framework/src/modules/account-chrome/`)
  renders `signedIn` (portal) and `businesses` as separate text slots that stack.

## Fix

1. **The links work.** "My businesses" opens the builder's list of the visitor's businesses, and
   the account control opens their account (the portal at `/account`), on `app.1stcontact.io`. The
   targets are the module's defaults, or are derived from the app's own path constants rather than
   typed by hand, so a site can't point at a route that doesn't exist. The 1st Contact site's
   stored config is corrected to match.
2. **The account control is an avatar,** the same as the builder's own (`accountAvatar`,
   `apps/control-app/src/builder/business.js`; `.builder-avatar`): a round badge with the signed-in
   person's initial (name, else email), falling back to the same glyph the builder uses. Its
   accessible name is "Your account". The account-chrome module gains a typed avatar control for
   this (structured-only; no raw markup in site data).
3. **"My businesses" is a text link.**
4. **Side by side.** The two sit in one horizontal row, "My businesses" first and the avatar on the
   right, vertically centred. They don't stack.

## What changed (as implemented)

`account-chrome` contract **v2 → v3**:

- **Targets are derived, not configured.** The `portal` and `businesses` config keys are gone. The
  module derives both from the origin of `signIn` (the accounts host): account = `<origin>/account`,
  businesses = `<origin>/` (relative `signIn` → relative paths). The paths live in one place,
  `packages/framework/src/modules/account-chrome/routes.ts` (`ACCOUNTS_SIGN_IN_PATH`,
  `ACCOUNTS_PORTAL_PATH`, `ACCOUNTS_BUSINESSES_PATH`); the control app's `SIGN_IN_PATH` and
  `PORTAL_PATH` are now defined from them, so the module and the app cannot disagree. A config that
  still names `portal`/`businesses` is refused by validation as undeclared keys, and a render handed
  one anyway ignores it and emits the derived targets.
- **The `businesses` slot folds into `signedIn`.** The signed-in subtree is one L1 row (the builder
  link, then the avatar, `align: center`), so L1 lays them out side by side. The "operates a
  business" state is still the module's: its CSS now hides the `businesses` control
  (`[data-account-chrome-builder]`) when the Worker hasn't marked the person as operating one,
  which leaves the avatar alone in the row.
- **The `portal` control is the avatar.** It renders as `<a href=… aria-label=portalLabel
  title=portalLabel data-account-chrome-initial>?</a>`. Its look is L1: the preset
  (`accountAvatarNode` in `packages/framework/src/l2/account-chrome.ts`) draws a 28px round badge
  (fill = the preset's dark ink, white 13px/700 letter, centred). `portalLabel` (default "Your
  account") is now its accessible name and tooltip, not visible text.
- **Link controls lose the UA underline.** The L1 emitter's control "zero-look baseline" (which
  already strips UA chrome from form controls) now also emits `text-decoration: none` for an `<a>`
  control, as the REQ-333 linked-run path already does; a `textDecoration` axis still wins. Only
  account-chrome declares link controls, so this affects the avatar and "My businesses" (neither is
  underlined; the link keeps its hover fade).
- **The initial is per-request.** Published pages are immutable snapshots, so the snapshot holds the
  builder's fallback glyph `?`, and the public-site Worker writes in the signed-in person's initial
  when it applies the session (`applyAccountChromeSession`, beside the existing state rewrite). The
  session reader (`apps/public-site/src/session.ts`) reads the current `user_names.display_name` and
  primary `user_emails.email` — the same sources the builder uses — and passes on only the first
  character (`accountInitial`: name, else email, upper-cased, else `?`). The letter is HTML-escaped.
  A failed name read yields `?` rather than signing the person out.
- **Migration v2 → v3** (`accountChromeV2ToV3`, `migrate.ts`): deletes `portal`/`businesses`
  config, wraps the stored `businesses` subtree and the old `signedIn` subtree into the row, and
  re-draws any `portal` control node as the avatar badge, filled with the colour the link was painted
  in (hex or palette ref) and keeping its interaction. Labels are carried as authored. Stored pages
  are upgraded on load (`assemble.ts`), so production picks this up on its next render/publish.
- The repo copy of 1st Contact's home page (L1 corpus fixture) is now the v3 preset instance with
  only `signIn` configured.

## Design decisions

- **Derive rather than validate URLs.** The framework can't know a customer deployment's route
  table, and three hand-typed copies were all wrong; deriving from the accounts host the site
  already names (`signIn`) removes the field instead of policing it. The earlier meta comment
  argued `businesses` must not default because it would name 1st Contact's builder — deriving from
  the site's own accounts host names no particular platform.
- **One row in L1, not a module-imposed flex row.** The module paints nothing about arrangement;
  merging the slot keeps "L1 decides where it goes and what it looks like" true and still lets the
  module own the business-operator state.
- **Avatar look is L1, not module CSS.** Structured-only (typed axes: fill, radius, fixed size,
  line height, text align, text decoration); no raw markup in site data.

## Not done here (operator action)

- The production instance's **label overrides** ("Go to your account" / "Your businesses") are
  author content and the migration deliberately keeps them. After deploy, remove `portalLabel` and
  `businessesLabel` from the production `signin` instance (or set them to "Your account" / "My
  businesses") and republish, so the visible link reads "My businesses".
- Deploy of public-site and control-app (and a republish of the 1st Contact site) is needed for the
  fix to reach 1stcontact.io.

## Test plan

UATs named `test_UAT_FC_BUG-299_*`:
- `tests/test_UAT_FC_BUG-299_targets_are_served.workers.test.ts` — renders 1st Contact's own chrome,
  takes the hrefs it emits (origin `https://app.1stcontact.io`), and requests each path from the real
  control-app Worker as a signed-in operator with a real Access token: the account target returns the
  portal page, the businesses target returns the builder; the old `/portal` and `/businesses` return
  neither.
- `tests/test_UAT_FC_BUG-299_account_chrome_row.test.ts` — through the public-site Worker serving 1st
  Contact's site: hrefs are `/account` and `/` on the app origin; the avatar shows the person's
  initial (name → email → `?`, escaped) with accessible name "Your account", and the signed-out bytes
  carry only `?`; a config still naming `/portal`/`/businesses` is refused by validation and never
  emitted; the stored v2 production shape upgrades to one row (businesses link, then badge). In
  Chromium at 1280px: "My businesses" then the avatar on one row, vertically centred, avatar to the
  right, round, filled, not underlined; a person operating no business sees the avatar alone.
- Existing account-chrome UATs (REQ-200, BUG-76, BUG-85) updated for v3: retired config keys
  dropped from fixtures, v1→v2 assertions pinned to the v1→v2 step itself, the upgraded version is
  the catalog's latest.

Note: `app.1stcontact.io` is behind Cloudflare Access, so a visitor following either link meets the
Access login first if they have no Access session (see the operator's open question on one login).

Related: [[BUG-85]], [[REQ-202]], [[EPIC-19]].