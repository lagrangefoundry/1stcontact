---
uid: request-175092b8
id: REQ-412
type: request
title: 'bin/deploy: deploy the platform fonts automatically when the mirror has changed'
created_by: EPIC-19
created_at: '2026-10-19T20:20:09.663139+00:00'
updated_at: '2026-10-19T20:20:09.663139+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 3
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-256a33ab
---

## What the operator sees

`bin/deploy` (any environment, with or without app names) deploys the platform
font mirror **when, and only when, it has changed since the last font deploy to
that environment**. Nothing to remember, no separate `--fonts` run after a font
fix, and no extra cost on an ordinary code deploy where the fonts haven't moved.

Motivating incident (EPIC-19, 2026-10-19): BUG-227 fixed the font encoder and was
built, deployed and restarted, yet Bob's salon 2 kept rendering with the broken
24 Sep woff2 files, because `bin/deploy --env dev` never touches fonts. Only
892 of 3,572 dev-store fonts were well-formed. The fix needed
`1c fonts mirror` + `bin/deploy --fonts --env dev` by hand — which nobody would
know to do, and which production also needs before the next publish.

## Why the original separation no longer has to cost anything

REQ-315 made `--fonts` its own invocation because re-reading and re-hashing the
1.35 GB corpus would add up to an hour to every code deploy. That reason is about
*detecting* change by hashing the bytes. It doesn't apply if change is detected
from the manifest: `fonts/platform.json` already records a sha256 for every
staged object (7,132 of them), so "has the mirror changed?" is a comparison of
one small file, not a scan of the corpus.

## Requirements

1. **A deployed-mirror record per environment.** After a successful font deploy,
   record a digest of the manifest's object set (key → sha256) for that
   destination: production's cloud bucket, and each dev app store. Where it lives
   is the implementer's choice (e.g. a marker object in the bucket/store itself,
   so it can't disagree with what's actually there; a local file is weaker for
   production because another machine may have published).
2. **Every app deploy checks it first.** Before the apps upload, compare the
   current manifest digest with the recorded one for the target environment.
   - Same → skip, and say so in one line (`platform fonts: unchanged`).
   - Different, or no record → run the existing font delivery (`1c fonts publish`
     / `1c fonts seed`), which already uploads only objects whose digest differs.
   - The decision and its reason appear in the deploy output and the capability
     report, so "fonts were not deployed" is never silent.
3. **An incomplete mirror stops the deploy.** If the manifest names objects that
   aren't staged (the existing `missing` check), the deploy fails before anything
   ships and names the fix (`1c fonts mirror …`). Shipping new Workers against a
   half-staged mirror is the failure this ticket exists to prevent.
4. **Fonts go before the apps**, so a new Worker never serves a page whose fonts
   haven't arrived yet.
5. **Dry run** reports whether fonts would deploy and how many objects would move.
6. **`--fonts` stays** as the fonts-only target (unchanged behaviour), and a
   **`--no-fonts`** flag skips the check for an emergency code-only deploy, with a
   warning if the fonts were in fact stale.
7. **Docs**: `bin/deploy`'s header and `--help` stop describing fonts as
   never-part-of-a-code-deploy and describe the change-detected behaviour; REQ-315's
   "naming what you want moved" rationale is updated rather than contradicted.

Out of scope: re-encoding (`1c fonts mirror`) as part of deploy — mirroring needs
the google-fonts checkout and is the operator's step. Deploy only ships what is
staged; if the encoder changes, staging the mirror is still a deliberate act, and
requirement 3 catches a mirror left half-done.

## Test plan

UATs `test_UAT_FC_<id>_*`, driving `bin/deploy --env dev` against a temp repo and
a temp miniflare-shaped store (no network):
- unchanged manifest → apps deploy, fonts skipped, output says `unchanged`;
- one object's sha256 changed → that object is reseeded before the app step, the
  record is updated, a second deploy then skips;
- no record (fresh store) → full seed;
- manifest names an unstaged object → deploy exits non-zero before any app step;
- `--dry-run` reports the decision and moves nothing;
- `--no-fonts` with a stale mirror → apps deploy, warning printed.