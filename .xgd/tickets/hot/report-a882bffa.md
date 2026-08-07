---
uid: report-a882bffa
id: REPORT-1560
type: report
title: 'Reconciliation Review: commits (REQ-118 image selection)'
created_by: xgd
created_at: '2026-08-07T04:57:10.491370+00:00'
updated_at: '2026-08-07T04:57:10.491370+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: reconciliation_review
  subject_uid: request-66e4c630
  anchor_uid: request-66e4c630
---

# Reconciliation Review: Story Coverage

**Result**: PASS
**Mode**: commits
**Surface**: (n/a — commits mode)
**Anchor**: request-66e4c630 (REQ-118)
**Stories Reviewed**: 2 (story-c46abfa6, story-37a3921b)

## Step 1 — Intent read

Intent ticket body (9195 chars) and its single comment (COMMENT-747, the free-coding
session transcript) were both read before any code. The operator's declared position:

- REQ-118 is **the second half of phase 1, not a second mechanism**. Structurally
  enforced: **no `image set` command, no `/api/image` route**. An image edit travels
  `1c copy get|set` / `/api/copy`, the same whole-definition validator, the same
  write-then-re-render order.
- The whole change is the **derivation** (what a region exposes) plus the **asset
  listing** that feeds it.
- `L1FieldDescriptor.type` widens `'string'` -> `'string' | 'enum'`, framed as a
  *narrowing* of what a control can return, and as the axis later phases grow along.
- The node's **current handle is always an option** — the one non-obvious correctness
  detail (a select omitting its own value renders with the first option selected).
- **Enum membership is checked server-side**, before the shared validator, because a
  safe-but-absent handle is structurally invisible to the envelope.
- `1c asset list` becomes the **union** of registry and `draft/assets/`, replacing a
  partial truth rather than adding a second listing.
- `/api/assets` + `fetchAssets` exist for reachability; **the modal deliberately does
  not use them**.
- **Out**: framing (crop/scale/scrim/rotation, blocked on DOC-28 §13 Q5), asset upload,
  any image processing.
- `editor.js` needed no change — recorded as evidence the T3 loop is kind-agnostic.
- Known upstream limitation (`webui-fields` renders an option's text as its value
  verbatim) is deliberately **not** worked around, per DOC-8 §9.4.
- One REQ-117 test example was deliberately superseded (image -> painted container as
  the "nothing to edit" specimen).

## Step 2 — Code read (independent)

Read the full cherry-picked diff `58cd03439` across all 8 files, not the ticket's
summary of it. Verified by direct inspection rather than on the ticket's word:

- `tools/generate/src/cli/builder.ts` routes are exactly `/api/sites`, `/api/publish`,
  `/api/assets`, `/api/copy` — **there is no `/api/image`**.
- No image command exists in the CLI dispatch.

14 behaviors identified.

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | `L1FieldDescriptor.type` widens to `'string' \| 'enum'`, with a closed option list and a `required` flag | Covered | story-37a3921b | AC-991 restated as the two-shape rule; AC-1024 pins `required` |
| 2 | `copyFieldsOf` derives `src` (enum, required) + `alt` (string, textarea rule) for an image node | Covered | story-37a3921b | AC-1024 |
| 3 | Option list is narrowed to images — a font and a stylesheet in the same store are not offered | Covered | story-37a3921b | AC-1024; fixture holds `.woff2` and `.css` |
| 4 | The node's current handle is always among its own options, even off-disk | Covered | story-37a3921b | AC-1025 — earns its own criterion, correctly |
| 5 | Options are de-duplicated and in a stable order | Covered | story-37a3921b | AC-1024; registry names `beta` bare, directory qualified |
| 6 | `applyCopyFields` refuses a value outside its descriptor's enum, at the field, before the shared validator | Covered | story-37a3921b | AC-988 extended to a third refusal kind |
| 7 | `src` / `alt` report into `changed` only when they differ; both in one diff | Covered | story-37a3921b | AC-1026 |
| 8 | An image edit runs the identical whole-definition validator (same code/message/path as `config set`) | Covered | story-37a3921b | AC-986 generalised from "a copy edit" to "any edit" |
| 9 | Origin equivalence for images: options ride the read call, refusal is a field-scoped client fault, save re-renders both channels | Covered | story-37a3921b | AC-992 extended |
| 10 | Choosing an image bakes nothing; every other node parameter survives | Covered | story-37a3921b | AC-1027 |
| 11 | `listSiteAssets` — union of registry and `draft/assets/`, with provenance (`onDisk`, `registered`) | Covered | story-c46abfa6 | AC-1018, AC-1019 |
| 12 | Handles normalise to `/assets/<name>`; bare and qualified forms merge to one entry; handle order | Covered | story-c46abfa6 | AC-1020 |
| 13 | `kind` derived from extension (image / font / other); the listing itself narrows nothing | Covered | story-c46abfa6 | AC-1021 |
| 14 | `1c asset list` and `GET /api/assets?slug=` return the same listing; a missing slug is a 400 caller fault | Covered | story-c46abfa6 | AC-1022, AC-1023 |
| — | `fetchAssets` client wrapper (`api.js`) | Uncovered | — | Judgment call below — accepted |
| — | `segmentOptions` skips the directory read for non-image nodes | Uncovered | — | Internal efficiency detail, no user-visible surface |
| — | Refusal message wording generalised ("copy field" -> "field") | Uncovered | — | Trivial |

## Intent Fidelity

Every behaviour the intent declares maps to a story, **faithful** in each case:

| Intent claim | Disposition |
|---|---|
| "Second half of phase 1, not a second mechanism" — no image command, no image route | Faithful. story-37a3921b states it in scope prose *and* AC-992 asserts it. Independently verified against `builder.ts` and the CLI dispatch. |
| The enum widening is a *narrowing* | Faithful. Preserved verbatim in story-37a3921b's Technical Context and in AC-991's restatement. |
| Current handle always offered | Faithful. AC-1025, with the operator's own reasoning (first-option-selected silent swap) carried into the criterion. |
| Membership server-side, not a widget property | Faithful. AC-988's third bullet states exactly the operator's rationale. |
| Union listing replaces a partial truth | Faithful. story-c46abfa6 records the rejected alternative (a second "pickable" listing) explicitly. |
| The modal deliberately does *not* call `/api/assets` | Faithful. Both stories state it and explain why no AC asserts the contrary. |
| Framing deferred, blocked on DOC-28 §13 Q5 | Faithful. Out-of-scope in story-37a3921b; AC-1027 pins the node's `axes` so the eventual home is protected. |
| Upload / image processing out | Faithful. Out-of-scope in both stories. |
| `editor.js` unchanged — the loop is kind-agnostic | Faithful, and correctly **not** promoted to an AC: no test in this change drives the editor with an image, so an AC would document behaviour the evidence does not exercise. Recorded as Technical Context instead. |
| Upstream `webui-fields` limitation, not worked around | Faithful. Both stories forbid asserting a label or thumbnail; confirmed no test asserts one. |
| REQ-117's "nothing to edit" specimen superseded | Faithful. AC-981 now states explicitly that an image region is *not* one of them. |

**Divergences: flagged, not absorbed.** story-37a3921b carries an explicit "Where the
intent and the implementation differ" section noting that the intent's "opens nothing"
is shipped as a dismissible "nothing to edit here" message, and correctly assigns that
divergence to the gesture capability rather than silently restating it as correct here.

**One stale intent claim, correctly not absorbed.** The ticket body asserts a
pre-existing failure at `tests/reconciliation-edit-render-channel.test.ts:316`
(`data-fc-edit` regex vs the `data-fc-page` stamp). I re-ran that suite: **13 passed**.
The claim was resolved upstream before the cherry-pick. Neither story repeats it — the
right outcome; a story asserting a live defect that no longer exists would itself have
been an absorbed divergence.

## Ungrounded Stories

None. Every claim in both stories was traced either to the intent ticket or to the
diff. Two claims worth singling out because they would have been easy to invent:

- story-c46abfa6's "a request that omits the site is refused as a caller fault" —
  grounded: `builder.ts:206-209` returns `400 {error: 'slug is required'}`.
- story-37a3921b's "there is no separate image route" — grounded by the absence
  verified directly in the route table, not by the ticket's assertion of it.

## Step 5b — Evidence Sufficiency

Two reconciliation UAT suites were generated and both were executed during this review:

```
tests/reconciliation-site-asset-listing.test.ts          6 passed
tests/reconciliation-copy-edit-image-selection.test.ts   9 passed
tests/req118-image-selection.test.ts                     7 passed | 4 skipped
tests/req117-copy-editing.test.ts                       10 passed
```

Every active AC introduced or modified by this reconciliation has a passing,
AC-named UAT:

| AC | UAT | Verdict |
|---|---|---|
| AC-1018 | `test_UAT_AC1018_a_file_present_in_the_site_assets_is_listed_even_when_undeclared` | Sufficient |
| AC-1019 | `test_UAT_AC1019_a_declared_asset_contributes_its_identity_and_is_listed_with_no_file` | Sufficient |
| AC-1020 | `test_UAT_AC1020_every_listed_asset_is_named_in_the_site_local_handle_a_page_holds` | Sufficient |
| AC-1021 | `test_UAT_AC1021_each_asset_reports_what_it_can_be_used_for` | Sufficient |
| AC-1022 | `test_UAT_AC1022_the_store_answers_from_the_command_line_with_no_editing_gesture` | Sufficient |
| AC-1023 | `test_UAT_AC1023_the_store_answers_from_the_builder_origin_and_refuses_a_missing_site` | Sufficient |
| AC-1024 | `test_UAT_AC1024_an_image_region_exposes_a_closed_list_of_the_sites_images_and_its_alt_text` | Sufficient |
| AC-1025 | `test_UAT_AC1025_a_regions_current_image_is_always_among_the_choices_it_offers` | Sufficient |
| AC-1026 | `test_UAT_AC1026_choosing_an_image_updates_the_draft_and_the_rerendered_page_shows_it` | Sufficient |
| AC-1027 | `test_UAT_AC1027_choosing_an_image_bakes_nothing_and_leaves_every_other_parameter_intact` | Sufficient |
| AC-981 (modified) | `test_UAT_AC981_a_region_that_exposes_nothing_answers_with_an_empty_field_list` | Sufficient |
| AC-986 (modified) | `test_UAT_AC986_any_edit_is_validated_over_the_whole_resulting_definition` | Sufficient |
| AC-988 (modified) | `test_UAT_AC988_an_unknown_field_a_non_text_value_or_a_choice_never_offered_is_refused` | Sufficient |
| AC-991 (modified) | `test_UAT_AC991_every_control_is_plain_text_or_a_pick_from_a_list_the_surface_supplied` | Sufficient |
| AC-992 (modified) | `test_UAT_AC992_the_origin_is_the_same_surface_for_words_and_for_images_alike` | Sufficient |

**Entry points are real.** Every UAT drives either `run(argv)` — the actual `1c` entry
point, argv in, `{ok,data}` envelope and process exit code out — or a live
`startBuilder` origin over real `fetch`. Nothing internal is stubbed; the only fixtures
are throwaway stores under `mkdtempSync`. Assertions land on bytes on disk (the draft
page document, both rendered channels, the asset files themselves) rather than on
return values of the function under test.

**No source-inspection tests.** No UAT reads a `.ts` file and asserts a string appears
in it. Every claim is observed at runtime.

**Could a broken implementation pass?** Checked the substitution question per AC. The
discriminating cases:

- **AC-986** is the strongest evidence in the set, and it is asserted *by consequence*:
  a `fontSizePx: 9999` violation is planted at `[0.0.1]`, which no edit under test
  touches, and then a copy edit, an image edit and `config set` are all run. All three
  fail, and the copy and image faults are asserted equal to `config set`'s **code,
  message and path**. An implementation that validated only the edited subtree, or ran
  its own validator, cannot produce that. The two candidate implementations are
  genuinely distinguished.
- **AC-1025** does not stop at "the current handle is in the list" — it drives the
  actual consequence: an alt-only save on an off-disk handle, asserting `changed`
  equals `['alt']` and the region still points at `REMOTE`. Removing the
  current-handle rule fails this.
- **AC-988** asserts the *absence* first (`enum` does not contain `/assets/nowhere.png`)
  and then that the refusal names `path === '0.1/src'` with the draft byte-identical.
  It also covers a real-but-wrong-kind asset (`.woff2`) and a hostile scheme, both
  refused at the field before the envelope's allowlist — so a test that merely
  delegated to the envelope would not produce this path.
- **AC-1027** fingerprints every asset file's contents, size *and* mtime, and
  deep-compares the node to `{...before, src}` including its `axes` and `id`. A "bake
  the image" implementation, or one that dropped presentation axes, fails.
- **AC-991** does not rely on one payload: after the injection assertions it sweeps
  *every* page-rooted stamped region plus the module slot, asserts every offered field
  is `'string'` or `'enum'`, that every enum carries a non-empty option list, and
  guards the sweep itself with `plain > 0 && closed > 0` so an all-empty page cannot
  vacuously pass.
- **AC-992** asserts origin/CLI agreement field-by-field for both a copy region and an
  image region, and asserts the rejection body's `code`/`path`/`hint`/`message` each
  equal the CLI refusal's — not merely that a 4xx came back.
- **AC-1026** includes the no-op case (`changed === []`, human output "No change") and
  a `status` assertion that exactly one file is modified with nothing added or removed,
  so "one save is one change" is measured rather than asserted.

**Coverage note that improves on the free-coded suite:** REQ-118's own origin half is
`describe.skipIf(!WEBUI_INSTALLED)` and its 4 tests skip in this worktree. The
reconciliation suites are not gated — their origin assertions (AC-1023, AC-992, and the
inline origin checks inside AC-1024 and AC-1026) **executed and passed here**. The
origin claims therefore have live evidence in this environment, not deferred evidence.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Site Asset Store Listing (`1c asset list`, `GET /api/assets`, `listSiteAssets`) — feature, 2pt | story-c46abfa6 (STORY-102, CAP-88, `story_kind: feature`, 2pt) | ✓ |
| 2. Structured Copy Editing — image selection through the same write path — upgrade, 3pt, targets story-37a3921b | story-37a3921b (`story_kind: upgrade`, `updated_by: request-66e4c630`) | ✓ |

Item 2's declared AC delta was fully executed: **4 added** (AC-1024, AC-1025, AC-1026,
AC-1027), **3 modified** (AC-986, AC-988, AC-992 — each verified to now carry the
image case in its criterion text), **0 removed**, matching the plan exactly. AC-991 and
AC-981 were additionally restated to absorb the enum shape and the image specimen; both
restatements are consistent with the plan's stated rationale rather than beyond it.

No plan items dropped.

## Judgment Calls

- **`fetchAssets` (`api.js`) has no AC and no caller — accepted.** It is a 14-line
  client wrapper over `/api/assets`, whose behaviour AC-1023 already proves at the
  route. The intent declares it as reachability plumbing for DOC-28 §9.2's asset
  browser mode, and story-c46abfa6 documents the origin as a way in. A developer
  reading the stories would not be surprised to find it. Materiality: low. Worth noting
  for a future code review that it currently has zero callers, but that is a code
  concern, not a story-coverage one.
- **`segmentOptions` skipping the directory read for non-image nodes — accepted.**
  Pure internal efficiency; no user-visible surface, no failure mode.
- **Refusal message wording generalised from "copy field" to "field" — accepted.**
  AC-988 asserts the *field is named* and the fault path, which is the load-bearing
  property; the exact prose is not.
- **A declared-but-absent image would be offered as a picker option — accepted as a
  derivable consequence, not a gap.** `listSiteAssets` includes registry entries with
  `onDisk: false` (AC-1019), and the picker is that listing narrowed to images
  (AC-1024), so the composition is documented even though no criterion names the
  intersection directly. Both source behaviours are stated; the case is an edge of
  their combination rather than an undocumented behaviour. Noted here so it is on the
  record for the phase that adds framing.
- **The kind-agnostic `editor.js` claim deliberately left out of the matrix — endorsed.**
  Promoting it to an AC would have documented behaviour that no test in this change
  exercises. Recording it as Technical Context is the correct disposition, and the
  reconciliation plan reasoned about this explicitly rather than by omission.

## Verdict

**PASS.** Stories accurately and completely document both the operator's stated intent
and the behaviour surface. The intent's load-bearing claim — that this is the second
half of one surface rather than a second mechanism — is carried into the matrix as
story prose *and* as criterion text, and I verified it against the route table and CLI
dispatch rather than accepting it on the ticket's word. Divergences are flagged rather
than absorbed: the shipped "nothing to edit here" message is explicitly recorded as
differing from the intent's "opens nothing", and the intent's stale pre-existing-failure
claim was correctly excluded (re-verified: that suite passes, 13/13). Both plan items
produced output with their full declared AC deltas. Every active AC has a passing UAT
that enters through a real entry point, mocks nothing internal, inspects no source text,
and asserts outcomes a broken implementation could not produce — most notably AC-986,
which distinguishes a shared validator from a private one by consequence rather than by
inspection. A developer reading these two stories would have a correct mental model of
what this code does and of what the operator meant to build.
