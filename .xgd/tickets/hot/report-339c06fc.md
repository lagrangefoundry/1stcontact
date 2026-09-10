---
uid: report-339c06fc
id: REPORT-3715
type: report
title: 'Fix Builder Workspace: Chrome, Origin & Display Panel (uat) — attempt 4'
created_by: xgd
created_at: '2026-09-10T10:33:45.366301+00:00'
updated_at: '2026-09-10T10:33:45.366301+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-a994b8f3
  level: uat
  fixes_applied: 5
  progress_made: true
  needs_more_work: true
  violations_remaining: 2
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — Builder Workspace: Chrome, Origin & Display Panel (uat)

**Attempt**: 4
**Fixes applied this call**: 5
**Violations remaining**: 2
**Needs more work**: true

Findings 1, 3, 4 and warning 6 are closed. Findings 2 and 5 — the AC-964 /
AC-1401 cross-wiring pair — are deliberately deferred to the next iteration for
two reasons given in full under *Blocked* below: the report's own prescribed
ordering puts them after the AC-966 repoint (done this call), and the entry
point they both need (`unstable_dev`) does not start in this sandbox, so
authoring them here would mean shipping unrun assertions.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | uat-edit | AC-978 / `tests/reconciliation-builder-workspace-origin.test.ts` | Added the fourth `trees` entry for `/framework/` — `/framework/../../../package.json` plus the percent-encoded and encoded-separator forms, secret `"packageManager"` — so the prefix the criterion singles out by name joins the shared `statuses` set. The identical-status assertion now spans all four trees |
| 2 | uat-edit | AC-978 / same file | Added a per-tree **liveness probe** (`alive`), asserted 200 and non-empty before each tree's escape probes. "No prefix lacks the confinement" is trivially true of a prefix serving nothing; without this, a `/framework/` route that quietly stopped being served would have reported as *confined* rather than as *broken*, which would have made finding 1's fix self-defeating |
| 3 | uat-edit | AC-1036 / `tests/reconciliation-builder-request-time-render.test.ts` | Dropped the three `etc/passwd` traversal probes from `probes`, leaving the two in-channel probes the criterion owns, with a comment recording that traversal is AC-978's single assertion. Closes warning 6 |
| 4 | uat-add | AC-1033 / same file | Authored `test_UAT_AC1033_two_workspaces_open_at_once_each_serve_their_own_site` — the BUG-37 half that had no test anywhere in the repository |
| 5 | uat-edit | AC-966 / origin suite → mounted suite | Deleted `test_UAT_AC966_view_mode_serves_the_real_rendered_artifact_byte_identical` (the disk byte-comparison the AC now forbids) and authored `test_UAT_AC966_the_ordinary_mode_displays_the_selected_sites_own_rendering` in `reconciliation-builder-workspace-mounted.test.ts` |

### Finding 4 — how the new AC-1033 UAT is built, and that it is not vacuous

The AC asks for two workspaces over two different stores, at the same time,
holding distinguishable renderings, **driven under the same account identifier**.

- Two `openWorkspace()` calls, both live (the fixture's `OPEN` array and its
  `afterEach` already supported this); **the same slug** in both, on purpose — a
  reuse keyed on the account, or on the account and the slug, collides there and
  one keyed on the store does not.
- The "same account identifier" premise is **established rather than assumed**:
  the local transport hands the router `TENANT_ID: 'local'` unconditionally, and
  the test asserts that off the shipped source with a message saying the UAT
  would otherwise pass on two accounts rather than on one.
- The first workspace is **primed first**, so any reuse is populated before the
  second is ever asked — the ordering the account-keyed bug needed to show.
- Then interleaved: the second must carry its own marker and not the first's,
  and the first must be unchanged by having been asked second. Finally a change
  on one side must not reach the other, so the store stays the key *after* the
  reuse has been invalidated once.

**Non-vacuity proven, not asserted.** I temporarily replaced both reuse keys in
`tools/generate/src/cli/builder.ts` (`const key = \`${ctx.cwd} ${ctx.root}\``,
two sites) with a constant account-shaped key and ran the new UAT alone:

```
× test_UAT_AC1033_two_workspaces_open_at_once_each_serve_their_own_site
  → draft: the second workspace served its own site: expected '<!DOCTYPE html>…'
    to contain 'The second workspace, and only the se…'
```

That is exactly the failure the AC describes — the second workspace answered out
of the first's reuse. The probe patch was reverted immediately;
`git diff tools/generate/src/cli/builder.ts` is empty and the working tree holds
only the three test files.

### Finding 3 — how AC-966 was repointed

The AC (rewritten today) owns only the binding: *whatever site is selected, the
ordinary mode's pane is showing that site*, and it explicitly forbids the
byte-equality-against-disk claim (AC-1032's) because that needs a pre-rendered
artifact whose absence AC-1031 exists to guarantee.

The new test runs in the mounted suite, which already has both a real
`startBuilder` origin and a jsdom mount over the actually-installed components:

- Creates site `delta` and writes a distinctive marker **into its stored
  definition**, then **never renders it** — no `cmdRender`, so no artifact
  exists to compare against and none is compared against.
- Asserts, unconditionally, that `previewUrl('delta','draft')` answers 200 with
  that marker present.
- Mounts with `delta` selected and the ordinary mode active over a listing taken
  off the origin, asserts `app.panel.getSrc()` and `frame.src` are that site's
  ordinary channel address, and fetches **the address the pane is displaying**
  (not one composed in the test) to assert the marker is in the body.
- Then drives the binding **both ways**: `setSite('alpha')` must move the pane to
  alpha's ordinary channel with delta's marker gone.

**A stand-in detector, with its own non-vacuity check.** The scaffold's single
text node carries the slug, so a pane showing the starter renders that slug as
body copy. The detector is derived from the shipped `starterHomePage` rather than
written out, and matches the *rendered* element text (`>slug<`) rather than the
raw string — the raw slug also appears in every `<title>`, which is what made a
first attempt at this assertion fail. It is then checked both ways: untouched
`alpha` **must** trip the detector (or the negative proves nothing) and **must
not** carry delta's marker (or the positive proves nothing).

The deleted origin-suite test was replaced in place by a block comment recording
where AC-966 went and why, in the same style the file already uses for AC-972.

## Verification — what was actually run

| Suite | Result |
|---|---|
| `reconciliation-builder-request-time-render.test.ts` | **7 passed** (was 6; AC-1033's second UAT is the new one) |
| `reconciliation-builder-workspace-mounted.test.ts` | **4 passed** (was 3; AC-966's new UAT is the new one) |
| `reconciliation-builder-workspace-chrome.test.ts` | 9 passed (untouched; run as a neighbour check) |
| `reconciliation-builder-workspace-origin.test.ts` | AC-978 ✓ with all four trees live and confined; AC-979, AC-977, AC-961, AC-963, AC-962, AC-975 ✓ |
| `naming.test.ts`, `bug32-webui-scope-rebrand.test.ts` | 4 passed — the repo-wide tracked-tree guards are unaffected by the new files |

`WEBUI_INSTALLED` is **true** on this machine: no `NOT VERIFIED` warning was
emitted, so the mounted half of the new AC-966 UAT genuinely ran against the real
`webui-*` components rather than returning early.

### Two pre-existing failures, not introduced here

`test_UAT_AC964_…` (60s) and `test_UAT_AC965_…` (180s) **time out** in this
sandbox. I confirmed this is pre-existing rather than mine by restoring the
file to `HEAD` with `git checkout --` and re-running AC-964 alone — it times out
identically on the unmodified file. Both use `unstable_dev`, which spawns a
`wrangler dev` process; wrangler also reports `EPERM` writing its own log under
`~/Library/Preferences/.wrangler/logs`. The workerd pool
(`*.workers.test.ts`, in-process miniflare) **does** run here — I verified
`reconciliation-workspace-edge-origin.workers.test.ts` passes 2/2.

## Code Edits (if any)

None this call. The only production-source change was the deliberately temporary
non-vacuity probe described above, reverted in the same call and verified clean.

## Blocked / Deferred — findings 2 and 5

Both remain open. Neither is `needs_review`: the resolution is understood, and
both are planned for the next iteration.

| # | Element | Why deferred |
|---|---|---|
| 2 | AC-964 — unadmitted sweep over one route per class, with refusal bodies compared against admitted bodies | The report's *Notes for the Editor* prescribes the ordering **AC-966 → AC-1401 → AC-964**, warning that fixing these independently risks a second round of overlap. Step one is done this call. Step three also lands in `test_UAT_AC964_…`, which **cannot be run in this sandbox** (`unstable_dev` times out, pre-existing) |
| 5 | AC-1401 — the same read/write/render requests through the deployed runtime, compared with the local door | Same blocker, plus a design question worth settling before writing: see below |

**Design note for the next iteration, so it is not re-derived.** `vitest.config.mts`
routes `*.workers.test.ts` to the workerd pool and everything else to the node
pool, and the two cannot share a file — a workerd test has no `node:http`, so it
cannot stand up `startBuilder`, and the node test's only route to the deployed
runtime is `unstable_dev`, which does not start here. So AC-1401's "same request,
both doors, compared" has two candidate shapes:

- **(a)** `unstable_dev` inside the existing node-project transport test. Matches
  the AC's wording most directly, but is **unverifiable on this machine** — it
  would ship as unrun assertions, which is what this cycle is meant to remove.
- **(b)** A **shared declared contract**: one module stating, per route, the
  expected status, content type and answer shape; the existing node test asserts
  the local door against it, and a new `reconciliation-workspace-transport.workers.test.ts`
  asserts the deployed runtime against the same declaration. Both doors are then
  observed, both legs actually run here, and "they agree" is proven through a
  single shared statement rather than by comparing one door with itself.

I recommend **(b)** and intend to take it next iteration unless the operator
prefers (a). It is the shape AC-1400's evidence already uses successfully in the
workers pool, and it keeps AC-1401's second half — the source-level absence check
for "no route table of its own" — untouched.

## needs_review Items Forwarded

None. The provenance caveat the validation report records for the sixth time
(no `intent_uid` on CAP-85 or any of its 36 ACs; `updated_by` on STORY-99 is a
scalar holding only `bundle-78f4e2fe`) remains an operator decision and is not a
uat-level fix.

## Field-ownership note

`uat_coverage` was **not** written on any AC this call, including the two ACs
whose tests changed shape (AC-966, AC-1033). That field belongs to
check/fix_uat_coverage, and the validation report says explicitly that nothing in
this cycle should set it. The six ACs carrying no value at all (AC-1399 through
AC-1449) are among the report's *aligned* rows, not gaps.
