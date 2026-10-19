---
uid: request-175092b8
id: REQ-412
type: request
title: 'bin/deploy: deploy the platform fonts automatically when the mirror has changed'
created_by: EPIC-19
created_at: '2026-10-19T20:20:09.663139+00:00'
updated_at: '2026-10-19T20:46:58.352695+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  priority: high
  story_points: 3
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-256a33ab
  commits:
  - working_sha: e4d251b9875a3d10404771ce422e79d6236dd0ac
    reconcile_sha: null
    main_sha: null
  - working_sha: c98639bc64f08d3375c7f2f40cf3753d89b1054b
    reconcile_sha: null
    main_sha: null
  version: 0.2.543
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
   - **The decision needs no staged bytes.** The comparison is of the manifest
     against the record, so a machine that holds no staged mirror can deploy code
     to a target that is already current (`platform fonts: unchanged`).
3. **An incomplete mirror stops the deploy.** If the manifest names objects that
   aren't staged (the existing `missing` check), the deploy fails before anything
   ships and names the fix (`1c fonts mirror …`). Shipping new Workers against a
   half-staged mirror is the failure this ticket exists to prevent. This applies
   only when a destination is NOT current (nothing to ship → nothing to check).
   **Exception — a local target with nothing staged at all** (a fresh checkout or a
   branch worktree: the mirror is gitignored and 1.35 GB, and its dev stores are its
   own): the deploy proceeds and says `platform fonts: NOT deployed — no mirror is
   staged in this checkout…`. The cloud target is never excused.
4. **Fonts go before the apps**, so a new Worker never serves a page whose fonts
   haven't arrived yet.
5. **Dry run** reports whether fonts would deploy and how many objects would move,
   and writes nothing (a store that does not exist is not created). An incomplete
   mirror is REPORTED under a dry run ("a real deploy would stop here") rather than
   failing it — a rehearsal reports everything a real run would meet.
6. **`--fonts` stays** as the fonts-only target (unchanged behaviour), and a
   **`--no-fonts`** flag skips the delivery for an emergency code-only deploy, with a
   warning if the fonts were in fact stale (the check still runs; it never delivers
   and never fails on staleness). `--fonts --no-fonts` together is refused.
   `--fonts` (`1c fonts publish` / `1c fonts seed`) now also writes the deploy record,
   so a fonts-only run is remembered by the next code deploy.
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

## Implementation (as built)

- **`tools/generate/src/fonts/deployed.ts`** (new) — the deploy record: key
  `platform/fonts-deployed.json` (outside the served `platform/fonts/` prefix),
  `{ digest, objects: path → digest, deployedAt }`. `mirrorDigests(manifest)` builds
  the object set from the manifest alone: fonts take the manifest's sha256; a family's
  licence notice takes a digest of its pinned upstream `source`; `LICENSES.txt` takes a
  digest of `licenceIndex(manifest)` with the date blanked. An unreadable/corrupt record
  is treated as no record (→ full, digest-checked delivery; never a skip).
- **`fonts/publish.ts` / `fonts/seed.ts`** — after a delivery that put every object
  (no `missing`), write the record into the bucket / each local store. Cloud access
  (token, account discovery, object URL) is factored into one `cloudBucket()` helper and
  the miniflare store opening into `withLocalBucket()`, reused by `readCloudRecord()` /
  `readLocalRecord()`. A local store that does not exist yet is not opened to read it.
- **`cli/font-mirror.ts`** — `cmdFontsDeploy` decides per destination (`current` /
  `stale` / `absent` / `unreadable`) and, when anything is behind, runs the existing
  `runPublish` / `runSeed` (seed narrowed to the stale stores). Outcomes: `unchanged`,
  `deployed`, `would-deploy`, `stale` (check mode), `blocked`, `unstaged`, `unknown`,
  `no-mirror`, `no-store`. A real deploy whose record cannot be read (e.g. no
  `CLOUDFLARE_API_TOKEN`) fails, naming `--no-fonts`; a rehearsal or check reports
  `unknown`. `formatFontsDeployReport` prints the one-line decision then one line per
  destination; `fontsCapabilityRow` produces the capability-report row.
- **`1c fonts deploy --target cloud|local [--app a,b] [--dry-run] [--check] [--json]`**
  — new CLI verb; appends the row to `$DEPLOY_CAPABILITY_REPORT` when set; exits 1 on
  `blocked` in a real run.
- **`bin/deploy`** — one `==> platform fonts` step after the workerd guard and before the
  first app, passing its own target row (`cloud`/`local`) and, at local, the apps being
  deployed (only their stores are checked; apps that do not declare the bucket are
  ignored). `--no-fonts` → `--check`; `--dry-run` → `--dry-run`. Header comment and
  `--help` rewritten to describe the change-detected behaviour and supersede REQ-315's
  "naming what you want moved" rationale.
- **Test fixture adaptation** — REQ-264's temp-repo `bin/deploy` fixture gains a `bin/1c`
  stub beside its `npx` stub (the driver now calls `1c` as a collaborator).

Operational note: no destination holds a record yet, so the first `bin/deploy` per
environment after this lands performs a full (digest-checked) delivery — for dev that is
exactly the BUG-227 reseed; production's bucket was confirmed (dry run) to hold no record.

## UATs (`tests/test_UAT_FC_REQ-412_fonts_ship_with_every_deploy.test.ts`)

Decision, via the real `1c fonts deploy` CLI against a temp repo and real miniflare
stores (read back through `r2PlatformFonts`):
- `a_store_with_no_record_is_fully_seeded_and_recorded` — req 1, 2 (no record)
- `an_unchanged_mirror_is_skipped_in_one_line` — req 2 (same → `unchanged`, no delivery)
- `a_changed_object_is_reseeded_and_the_next_deploy_skips` — req 1, 2 (one object moves)
- `a_changed_mirror_that_is_not_fully_staged_stops_the_deploy` — req 3
- `a_checkout_with_no_staged_mirror_deploys_locally_with_a_warning` — req 3 exception
- `a_current_target_needs_no_staged_mirror` — req 2 (manifest-only decision)
- `a_dry_run_reports_the_decision_and_the_count_and_moves_nothing` — req 5
- `a_check_only_run_warns_of_stale_fonts_and_delivers_nothing` — req 6 (`--no-fonts`)
- `the_decision_is_a_row_in_the_capability_report` — req 2 (capability report)
- `only_the_deployed_apps_stores_are_checked_and_seeded` — local app narrowing

Wiring, via `bin/deploy` itself:
- `the_font_step_runs_before_the_first_app_and_is_reported` — req 4, 2
- `no_fonts_checks_without_delivering_and_cannot_combine_with_fonts` — req 6
- `the_help_describes_the_change_detected_fonts` — req 7