---
uid: report-78435e9e
id: REPORT-1538
type: report
title: 'Reconciliation Review: commits (BUNDLE-16)'
created_by: xgd
created_at: '2026-08-07T03:32:44.688884+00:00'
updated_at: '2026-08-07T03:32:44.688884+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-15c1f647
  anchor_uid: bundle-15c1f647
---

# Reconciliation Review: Story Coverage

**Result**: FAIL
**Mode**: commits
**Surface**: (n/a — commits mode)
**Anchor**: bundle-15c1f647 (BUNDLE-16)
**Stories Reviewed**: 6 (STORY-99, STORY-100, STORY-101, STORY-98, STORY-83, STORY-79)

## Method

Intent read first (REQ-117 body + its three follow-up sections, REQ-115 body
incl. Deliverable 0, REQ-44 body + its two split-out sections), then the code
across the 11 free-coded commits, then the six stories and their 21+13+14+16+4+5
acceptance criteria. All eight reconciliation UAT suites were executed, because
every scoped-quality report attached to these stories reports `0 tests, 0 failed`
— the workflow's scoped quality gate proved nothing, so evidence had to be run
directly.

Suite results (this worktree):

| Suite | Result |
|---|---|
| reconciliation-1c-install-preflight | 5 passed |
| reconciliation-nowrap-width-floor | 4 passed |
| reconciliation-edit-render-channel | 13 passed |
| reconciliation-copy-edit-write-path | 13 passed |
| reconciliation-copy-edit-gesture | 9 passed |
| reconciliation-copy-edit-gesture-modal | 4 passed, 1 skipped |
| reconciliation-builder-workspace-chrome | 1 passed, 9 skipped |
| reconciliation-builder-workspace-origin | **10 passed, 1 FAILED** |

## Behavior Inventory

37 behaviours identified across the four entry-point groups: the webui
consumption point (`webui.ts`), the builder origin (`builder.ts` — chrome doc,
`/api/sites`, `/api/publish`, `/api/copy`, `/preview/*`, `/framework/*`,
`/webui/*`, `/builder/*`, `serveTree`), the Worker front (`control-app/index.ts`),
the browser composition (`builder/{main,app,panel,toolbar,editor,api,config}.js`),
the edit-address contract (`site-schema/src/l1/edit.ts`), the CLI copy verbs
(`cli/edit.ts`, `cli/index.ts`), the edit bridge (`framework/src/l1/edit-client.ts`),
the renderer additions (`render.ts` page stamp, hover rule, nowrap floor;
`contact-form/index.astro` seam), and the install preflight (`cli/preflight.ts`).

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | webui consumed from shared artifact store via each package's `exports`; nothing vendored | Covered | story-e674c60a | AC-961, AC-963 |
| 2 | Absent component names the component + `bin/install` command at one resolution point | Covered | story-e674c60a | AC-962 |
| 3 | `1c builder` origin serves chrome, components, browser source, three channels | Covered | story-e674c60a | AC-964, AC-966, AC-979 |
| 4 | `GET /api/sites`, `POST /api/publish` through the existing publish path | Covered | story-e674c60a | AC-967, AC-972 |
| 5 | Worker front forwards verbatim; unconfigured 503 / unreachable 502 | Covered | story-e674c60a | AC-964, AC-965 |
| 6 | Every response carries `no-store`, hand-written chrome doc included | Covered | story-e674c60a | AC-977 |
| 7 | Traversal confinement, one shared resolver across three trees | **Partial / mis-stated** | story-e674c60a | AC-978 asserts a *forbidden* status the code never returns — see Gap 1 |
| 8 | Single tab id `site`, label with one definition site, `fill` opt-in reaching the shell unnarrowed | Covered | story-e674c60a | AC-959, AC-960, AC-976 |
| 9 | Mode registry — an entry not a branch; switch preserves pane nodes | Covered | story-e674c60a | AC-968, AC-969 |
| 10 | Toolbar renders only the active mode's declared controls; open-in-new-tab === frame src | Covered | story-e674c60a | AC-970, AC-971 |
| 11 | Split: drag, collapse-to-rail, reopen-to-prior-width; namespaced persistence | Covered | story-e674c60a | AC-973, AC-974 |
| 12 | Preview frame tracks window height; page never scrolls | Covered | story-e674c60a | AC-975 |
| 13 | Strict address parse/format; malformed refused, never coerced | Covered | story-37a3921b | AC-987 |
| 14 | One resolution rule (root node LIST then `children`), page and module slot alike | Covered | story-37a3921b | AC-987, AC-989 |
| 15 | Field derivation: copy → one plain string; container/module → empty list, success | Covered | story-37a3921b | AC-980, AC-981 |
| 16 | Change map applied whole-or-nothing; one save one diff | Covered | story-37a3921b | AC-983 |
| 17 | Unknown field / non-string value refused, not ignored | Covered | story-37a3921b | AC-988 |
| 18 | Whole resulting definition validated by the same validator as `page`/`config`/`asset` | Covered | story-37a3921b | AC-986 — asserted by consequence, correctly |
| 19 | Rejected edit leaves draft + rendered bytes identical | Covered | story-37a3921b | AC-984 |
| 20 | Structured refusal: code/path/hint, `--json` envelope, non-zero exit | Covered | story-37a3921b | AC-985 |
| 21 | Save re-renders; `--module`/`--slot` scoping; long copy reads back whole | Covered | story-37a3921b | AC-982, AC-989, AC-990 |
| 22 | `/api/copy` is a thin transport: 400 with the validator's own fault; re-renders BOTH channels | Covered | story-37a3921b | AC-992 |
| 23 | No path can express raw HTML/CSS; markup stays literal text | Covered | story-37a3921b | AC-991 |
| 24 | Hover marks one region, never moves the page | Covered | story-3bf94bd4 | AC-993 |
| 25 | Click resolves innermost; module seam scopes to instance + slot | Covered | story-3bf94bd4 | AC-995, AC-996 |
| 26 | `mountFields` in buffered commit — one Save, one change | Covered | story-3bf94bd4 | AC-994, AC-997 |
| 27 | Save → frame reload → rebind, still editable | Covered | story-3bf94bd4 | AC-998 |
| 28 | Refusal keeps the form open with the operator's text and the validator's message | Covered | story-3bf94bd4 | AC-999 |
| 29 | Nothing staged → close without posting | Covered | story-3bf94bd4 | AC-1000 |
| 30 | Fieldless segment: plain message naming the kind; dismissible by button, Escape, backdrop | Covered | story-3bf94bd4 | AC-1001, AC-1002 |
| 31 | Stale render (no page stamp) refused client-side, naming the re-render; nothing sent | Covered | story-3bf94bd4 | AC-1003 |
| 32 | View mode not marked, not intercepted, not editable | Covered | story-3bf94bd4 | AC-1005 |
| 33 | One implementation of address resolution, served type-stripped from the renderer's own source | Covered | story-3bf94bd4 | AC-1006 |
| 34 | Page-id body stamp (`id`, never slug) | Covered | story-af36c2cb | AC-1007 |
| 35 | Stamp vocabulary is one published contract shared by emitter and client | Covered | story-af36c2cb | AC-1008 |
| 36 | Every catalog module marks its own seam — contact-form as well as carousel | Covered | story-af36c2cb | AC-954 (modified) |
| 37 | Nowrap run's captured width becomes a floor; threshold gate; per-rung `width:auto` reset; pixel-neutral unedited | Covered | story-d0a8cfad | AC-1009 – AC-1012 |
| 38 | Install preflight: resolution + lockfile drift, reported together, ENVIRONMENT/exit 6, per-command gating | Covered | story-e15a19ef | AC-1013 – AC-1017 |

## Intent Fidelity

Every divergence between intent and code that I could find is **flagged in the
stories rather than absorbed**. This part of the work is unusually good:

- REQ-117 AC 1 says clicking a fieldless segment "opens nothing"; the shipped
  behaviour is a dismissible *nothing to edit here* message. Flagged in
  story-37a3921b ("Where the intent and the implementation differ") **and** in
  story-3bf94bd4 ("Intent/code divergence, deliberate and recorded"), with the
  later ticket sections correctly cited as adopting the message.
- `1c serve` gaining `no-store` via the shared `sendFile` — outside REQ-117's
  declared scope, owned by STORY-95/96. Flagged verbatim in story-e674c60a
  ("Divergence flagged, not absorbed"), with no criterion claiming it.
- The nowrap floor being renderer-wide though reached through the copy-editing
  ticket. Flagged in story-d0a8cfad, and the pixel-neutrality boundary is made
  an AC (AC-1012) precisely because it is the line the change must not cross.
- The unicode-escaping diff defect, deliberately unfixed. Flagged in both
  story-37a3921b and story-3bf94bd4 as a known cosmetic defect wanting its own
  ticket.
- REQ-1's placeholder route superseded, carrying no matrix debt. Flagged.
- REQ-44's deliberate split (REQ-745 / REQ-22) and the install-scripts blind spot.
  Both flagged in story-e15a19ef.

No story was found claiming behaviour that neither intent nor code supports,
with the single exception in Gap 1 below.

## Ungrounded Stories

| Story | Claim | Issue |
|-------|-------|-------|
| story-e674c60a (AC-978, and the "Confinement" bullet in the story body) | "a request that tries to escape any of them is refused rather than answered" / "returning a **forbidden** status instead of the file's contents … The refusal is identical across all three trees" | The origin never returns 403 for any URL-derived path. See Gap 1. |

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Builder shell, display panel and dev origin (feature) | story-e674c60a / STORY-99 | ✓ (21 ACs) |
| 2. Structured copy-edit write path (feature) | story-37a3921b / STORY-100 | ✓ (13 ACs) |
| 3. Click-to-edit loop in the builder (feature) | story-3bf94bd4 / STORY-101 | ✓ (14 ACs) |
| 4. Edit render channel — page stamp, hover vocabulary, module seams (upgrade) | story-af36c2cb / STORY-98 | ✓ (AC-1007, AC-1008 added; AC-954 modified to bind the whole catalog) |
| 5. L1 geometry — nowrap width is a floor (upgrade) | story-d0a8cfad / STORY-83 | ✓ (AC-1009–AC-1012, matching the plan's four promised criteria) |
| 6. 1c CLI install preflight (upgrade) | story-e15a19ef / STORY-79 | ✓ (AC-1013–AC-1017, matching the plan's five promised criteria) |

No plan item was dropped. Every promised AC add/modify in items 4–6 is present.
The plan's non-items (the two version bumps; the unicode-escaping defect) are
correctly absent from the matrix and recorded as observations in the stories.

## Gaps to Fix

### Gap 1 (FAIL trigger) — AC-978 asserts a status the implementation never produces, and its UAT fails

`test_UAT_AC978_every_served_tree_refuses_a_request_that_escapes_it` **fails**:

```
AssertionError: rendered channels: /preview/alpha/draft/../../../../../../etc/passwd:
  expected 404 to be 403
  tests/reconciliation-builder-workspace-origin.test.ts:231
```

This is not flakiness and not environmental — it is a real mismatch between the
matrix and the code.

**Root cause.** `resolveStaticFile` (`tools/generate/src/cli/serve.ts:68-76`)
confines with:

```ts
const abs = path.join(rootDir, path.normalize(rel))
if (!abs.startsWith(rootDir)) return 'forbidden'
```

`rel` always arrives with a **leading slash** on all three trees — the preview
regex's group 3 (`builder.ts:263`, `preview[3] ?? '/'`), `p.slice('/builder'.length)`
(`builder.ts:327`), and `webui[2] ?? '/'` (`builder.ts:322`). POSIX
`path.normalize` clamps leading `..` segments on an absolute path, so
`/../../../../../../etc/passwd` normalises to `/etc/passwd`, joins to
`<rootDir>/etc/passwd`, and **passes** the `startsWith` check. Verified for the
raw, `%2e%2e` and `..%2f` forms alike. The `'forbidden'` branch — and therefore
the 403 in `serveTree` (`builder.ts:355`) and in `serve.ts:135` — is
**unreachable through the HTTP surface**. Every escaping probe resolves to a
non-existent path *inside* the tree and returns **404**.

**Security is intact**: the target file is never served, and confinement holds
by clamping. What is wrong is the matrix's description of it. Note that the
free-coded test this AC replaced deliberately accepted either status —
`expect([403, 404], p).toContain(res.status)`,
`tests/req115-builder-shell.test.ts:148` — so the reconciliation tightened the
criterion **past** the implementation it was meant to document.

**Required fix** (reconciliation is code-authoritative — do **not** change
`serve.ts` or `builder.ts`):

1. Restate **AC-978** to what the code actually guarantees: a request that
   resolves outside a served tree is never satisfied — it returns a non-success
   status and none of the targeted file's contents — and this holds identically
   for all three trees. Drop the pin to a *forbidden* status specifically.
2. Amend the same over-claim in **story-e674c60a**'s body, "Confinement" bullet
   ("refused rather than answered"), so the story and the AC agree.
3. Update `test_UAT_AC978_*` to assert the restated criterion (a non-2xx status,
   uniformly across trees, plus the existing secret-absence assertion), so it
   passes against the shipped behaviour.
4. Optional but worth recording in the story's Technical Context: the
   `'forbidden'` branch is presently dead for URL-derived paths. If the operator
   would rather the code detected the escape explicitly, that is a **new ticket**
   against STORY-99, not a reconciliation change.

### Gap 2 (recorded, not a FAIL trigger) — 12 ACs have no runtime evidence in this environment

With the `@gendevlabs/webui-*` components absent, these ACs' UATs skip or
short-circuit via `unverified()`:

- **story-e674c60a**: AC-959, AC-967, AC-968, AC-969, AC-970, AC-971, AC-973,
  AC-974, AC-976 (skipped outright); AC-975 returns early before its browser
  measurement; AC-960, AC-961, AC-963, AC-964, AC-977, AC-978 verify only their
  non-mounting half.
- **story-3bf94bd4**: AC-1002 (skipped) — notable because that criterion exists
  *because* the first shipped message could not be dismissed at all.

I am **not** failing on this, deliberately. The stories declare it prominently
and accurately (story-e674c60a "The component dependency is implicit — a known,
accepted coverage gap"; story-3bf94bd4 "Known coverage caveat"), the skip is
loud and reported rather than silent, no component is mocked, and the fix
requires an out-of-band install of another repository that no fix cycle can
perform. It is a correctly-documented environmental gap, not a defective matrix.
It should nonetheless be visible to whoever reads this bundle's evidence: on a
machine without that install, most of STORY-99 is unproven.

### Gap 3 (minor) — story-d0a8cfad understates its own evidence

The story's Technical Context states that "the relaxation never reaches a
**container** … is not exercised by those fixtures, because no fold fixture
cheap enough to build there produces a container carrying captured geometry —
closing it needs an authored or reproduction-pipeline document". That note is
**stale**: `test_UAT_AC1010_*`
(`tests/reconciliation-nowrap-width-floor.test.ts:305-369`) now does exactly
that — a hand-authored document with a geometry-carrying container wrapping a
floored run, asserting the container keeps a fixed width at every rung while the
run inside it floors, plus a validator-level check that `nowrapFromPx` on a
container is refused as an unknown key by the `.strict()` surface group. The
sentence should be corrected to describe the authored fixture rather than
disclaim the coverage. No behaviour or AC changes.

## Judgment Calls

- **Duplicate FC and AC test files coexist** (`tests/req115-*`, `tests/req117-*`,
  `tests/req44-*` alongside the eight `tests/reconciliation-*` suites). The plan
  anticipated the FC→AC rename and warned it would need care; the reconciliation
  authored new files instead of renaming, leaving both. This is test-suite
  hygiene, owned by structural validation rather than by this review, and it does
  not affect story fidelity or coverage — recorded, not failed on.
- **AC-960, AC-961 and AC-1006 contain source-inspection assertions.** In each
  case the source-reading half asserts a property that is only expressible over
  source (a literal appears exactly once; no component source exists in this
  repo; no second implementation of address resolution exists in the browser
  source), and each is paired with a runtime half — a mounted label and
  accessible name, byte-comparison of served vs installed bytes, and a real
  module import executed in a browser. Acceptable: none of them substitutes
  source-reading for a behavioural claim.
- **AC-986's "same validator" is proved by consequence**, not by asserting which
  function is called: an unrelated pre-existing violation refuses `copy set` and
  `config set` with the identical code, message and path. A swapped-in
  equivalent-surface validator would not reproduce that. Sufficient.
- **`0 tests, 0 failed` scoped-quality reports** on every story were treated as
  no evidence rather than as passing evidence, and all suites were run directly.
  That the workflow's own gate proved nothing is worth the operator's attention
  independently of this verdict.
- **Duplicate AC rows** (AC-952, AC-954, AC-956 each listed twice under
  story-af36c2cb with the same UID) are a ticket-index listing artifact, not
  duplicate criteria. Not a matrix defect.

## Verdict

**FAIL.** The stories are otherwise an unusually faithful reconciliation: all six
plan items produced output, every promised AC add/modify landed, all three
intents' declared scope is covered, and every intent/code divergence I could find
— the fieldless-segment message, the `1c serve` freshness spillover, the
renderer-wide nowrap floor, the unicode-escaping defect, the REQ-1 supersession,
the REQ-44 split — is explicitly flagged rather than silently absorbed. A
developer reading these stories would come away with an accurate picture of what
the operator intended to build.

One criterion breaks it. **AC-978** documents an aspiration rather than the code:
it asserts a *forbidden* status for a traversal-escaping request, the origin
returns *not found* for every such request on every tree (the `'forbidden'`
branch is structurally unreachable for URL-derived paths), and its UAT fails.
Reconciliation is code-authoritative, so the criterion, the story's "Confinement"
bullet and the UAT must be restated to the behaviour that actually ships.
Gap 3 is a stale sentence in story-d0a8cfad worth correcting in the same pass.
