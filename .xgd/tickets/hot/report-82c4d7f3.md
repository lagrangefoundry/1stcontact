---
uid: report-82c4d7f3
id: REPORT-1735
type: report
title: 'Capability-Intent Alignment: Site Delivery: Deploy & Public Serving (level=uat)'
created_by: xgd
created_at: '2026-08-09T11:30:43.019394+00:00'
updated_at: '2026-08-09T11:30:43.019394+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-a12e557f
  level: uat
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Delivery: Deploy & Public Serving
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

Level is `uat`, so AC bodies are the working reference and the story/AC layers are
assumed aligned (their cycles ran first). Intent history was consulted only to
confirm the ledger below; no AC proved suspicious enough to escalate.

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability. Both stories'
`intent_uid` / `updated_by` chains resolve to two reconciled bundles.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-13 (`bundle-e0143ffa`) — REQ-108 + REQ-109 + REQ-110 + REQ-111 + REQ-113 + 1 more | free_and_reconciled | 2026-08-06 (merged `1ee6aaf2`) | The delivery-relevant members: **REQ-110** the R2 artifact store and `1c deploy`; **REQ-111** `public-site` serves deployed sites out of R2; **REQ-113** extensionless clean page URLs. Originating intent for STORY-94, STORY-95, STORY-96. | YES |
| BUNDLE-14 (`bundle-0385746c`) — BUG-31 + REQ-114 + REQ-116 | free_and_reconciled | 2026-08-06 (merged `cd8f98c8`) | **BUG-31**: `1c deploy --sandbox` wrote into a real site's R2 keyspace. Added store-tree scoping to both halves of delivery. `updated_by` on STORY-94 and STORY-95; added AC-924 … AC-927. | YES |

No retired, abandoned or draft intent touches this capability, so nothing in the
tree should be describing withdrawn behaviour — and nothing does.

## Matrix at this level

`capability-a12e557f` holds exactly three stories, and 36 acceptance criteria,
all with `status: active`:

| Story | Kind | ACs | Test file |
|---|---|---|---|
| STORY-94 `story-5349d01f` — ship a site off the laptop (`1c deploy`) | upgrade | AC-892 … AC-901, AC-924, AC-925, AC-926 (13) | `tests/reconciliation-deploy-snapshot.test.ts` |
| STORY-95 `story-d34eccd8` — serve a deployed snapshot | upgrade | AC-902 … AC-914 (13), AC-927 (1) | `tests/reconciliation-serve-deployed-snapshot.test.ts`, `tests/reconciliation-servable-root-confinement.test.ts` |
| STORY-96 `story-66115f6b` — clean page URLs | feature | AC-915 … AC-923 (9) | `tests/reconciliation-clean-page-urls.test.ts` |

**Executed, not assumed**: `npx vitest run` over the four files above —
**4 files passed, 36 tests passed**, 1.06s.

## Alignment Ledger

Every active AC has exactly one UAT (`test_UAT_AC<n>_*`); no AC has zero, and no
AC has two. Each test was read against its AC's `## Criterion` and
`## Verification` text.

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-892 → `test_UAT_AC892_draft_deploy_ships_complete_artifact_to_content_addressed_preview` | REQ-110, BUG-31 | aligned — both artifact halves, real rendered bytes, preview index entry, URL; plus the non-servable tree returning no URL |
| AC-893 → `test_UAT_AC893_identical_bytes_are_a_noop_and_changed_bytes_land_beside` | REQ-110 | aligned — no-op redeploy, unchanged object count, changed id lands beside, index oldest-first |
| AC-894 → `test_UAT_AC894_deploy_always_renders_so_stale_local_output_cannot_ship` | REQ-110 | aligned — stale `dist/` planted, uploaded render and source both current, local output refreshed |
| AC-895 → `test_UAT_AC895_draft_deploy_never_mints_a_revision_or_enters_publish_history` | REQ-110 | aligned — publish history empty, no revisions, live unset, no revision number |
| AC-896 → `test_UAT_AC896_published_deploy_ships_latest_revision_and_moves_live_pointer` | REQ-110, BUG-31 | aligned — `rev/0001` both halves, index entry with publish time/message/sha, live pointer, plain URL; scratch tree covered |
| AC-897 → `test_UAT_AC897_published_deploy_without_revisions_is_refused_by_name_and_writes_nothing` | REQ-110 | aligned — refusal names `1c publish acme`, storage completely empty |
| AC-898 → `test_UAT_AC898_dry_run_prints_the_plan_writes_nothing_and_leaves_the_real_deploy_intact` | REQ-110 | aligned — nothing written, full plan printed, following real deploy unaffected |
| AC-899 → `test_UAT_AC899_prune_deletes_only_snapshot_objects_the_index_does_not_reference` | REQ-110, BUG-31 | aligned — orphan swept, bystander non-snapshot object spared, second prune says so, per-tree scoping proven |
| AC-900 → `test_UAT_AC900_report_labels_every_stage_and_terminates_in_the_shareable_url` | REQ-110 | aligned — every stage label, file-count/size detail, both upload halves named, terminal URL, already-deployed note |
| AC-901 → `test_UAT_AC901_index_changed_underneath_the_deploy_fails_loudly_and_leaves_it_unclobbered` | REQ-110 | aligned — real out-of-band mutation mid-upload via a racing client; error text and unclobbered index both asserted |
| AC-902 → `test_UAT_AC902_preview_url_renders_its_own_snapshot_complete` | REQ-111 | aligned — page + every markup and CSS `url()` reference resolved with correct types; second snapshot proves isolation |
| AC-903 → `test_UAT_AC903_published_url_serves_and_follows_the_live_revision` | REQ-111 | aligned — live pointer moved forward and back, same URL follows it |
| AC-904 → `test_UAT_AC904_bare_directory_url_permanently_redirects_and_preserves_the_query` | REQ-111 | aligned — 301, exact location, query preserved, both forms; and the misresolution the redirect prevents is demonstrated |
| AC-905 → `test_UAT_AC905_only_indexed_snapshots_are_servable` | REQ-111 | aligned — orphan unreachable with `snapshotReads == []`; unlinking an indexed preview stops it serving while bytes remain |
| AC-906 → `test_UAT_AC906_not_found_is_plain_and_never_an_existence_oracle` | REQ-111 | aligned — four cases byte-identical, leak list asserted, within-channel header equality, directory is not a listing |
| AC-907 → `test_UAT_AC907_malformed_and_traversal_shaped_components_404_without_reading_bytes` | REQ-111 | aligned — instrumented bucket proves `readKeys == []`; a well-formed control request does read |
| AC-908 → `test_UAT_AC908_response_is_typed_from_the_object_that_answered` | REQ-111 | aligned — 21 extensions incl. unknown and extensionless; lying stored metadata ignored; server and deploy tables pinned together |
| AC-909 → `test_UAT_AC909_snapshot_addresses_are_immutable_and_published_carry_a_short_ttl` | REQ-111 | aligned — exact `cache-control` on both channels, `immutable` present/absent |
| AC-910 → `test_UAT_AC910_every_preview_channel_response_is_marked_noindex` | REQ-111 | aligned — page/asset/redirect/not-found all carry `x-robots-tag`; published counterparts carry none |
| AC-911 → `test_UAT_AC911_repeat_requests_skip_the_store_and_not_found_is_never_retained` | REQ-111 | aligned — fake edge cache; warm request adds zero reads; a 404 begins serving as soon as a deploy makes it real |
| AC-912 → `test_UAT_AC912_server_is_read_only_head_is_bodiless_and_writes_are_refused` | REQ-111 | aligned — HEAD parity + content-length + empty body; five write methods 405 with `Allow` and no store read |
| AC-913 → `test_UAT_AC913_apex_returns_a_holding_response_and_never_serves_a_site` | REQ-111 | aligned — asserted while a real deployed+published site exists, and again with an empty store |
| AC-914 → `test_UAT_AC914_deploy_colliding_with_the_reserved_preview_segment_is_refused` | REQ-111 | aligned — gate driven on a real snapshot file list; near-miss shapes deploy and serve; the comment states why the gate is proved at its own entry point |
| AC-915 → `test_UAT_AC915_local_preview_serves_a_slug_only_page_url_as_html` | REQ-113 | aligned — real `startServe` over loopback; absence of a bare-slug file asserted first, body byte-compared to the rendered file |
| AC-916 → `test_UAT_AC916_deployed_site_serves_the_slug_only_url_on_both_forms_and_for_head` | REQ-113 | aligned — preview form, published form, and HEAD with length and empty body |
| AC-917 → `test_UAT_AC917_an_exact_match_always_wins_in_both_environments` | REQ-113 | aligned — real page/directory collision on disk; deployed half asserts the exact key was the only lookup |
| AC-918 → `test_UAT_AC918_only_the_last_segment_decides_eligibility` | REQ-113 | aligned — missing assets 404 with no `.html` sibling tried; dotted intermediate segment stays eligible; `parseRoute` fallback asserted both ways |
| AC-919 → `test_UAT_AC919_a_slug_only_url_with_no_page_behind_it_still_returns_not_found` | REQ-113 | aligned — both environments; read trace shows the mapping was consulted and still found nothing |
| AC-920 → `test_UAT_AC920_a_mapped_response_is_typed_from_the_page_that_answered` | REQ-113 | aligned — HTML on all forms and methods; discriminated against a non-HTML exact-match asset |
| AC-921 → `test_UAT_AC921_a_page_has_one_clean_url_and_it_is_the_slash_free_one` | REQ-113 | aligned — slashed form 404s; references resolve at the snapshot root and 404 one level too low against the slash form |
| AC-922 → `test_UAT_AC922_local_preview_confinement_is_unchanged_by_the_mapping` | REQ-113 | aligned — raw socket puts the literal traversal on the wire; outside files exist and carry the marker (non-vacuous control) |
| AC-923 → `test_UAT_AC923_a_url_the_address_grammar_rejects_never_reaches_the_mapping` | REQ-113 | aligned — every case shaped to be eligible-if-well-formed; `htmlFallback` asserted undefined; zero reads |
| AC-924 → `test_UAT_AC924_every_key_a_deploy_writes_is_scoped_to_its_store_tree` | BUG-31 | aligned — same slug in both trees; nothing under the servable tree; every reported key scoped; real markup proves it is namespacing not a no-op |
| AC-925 → `test_UAT_AC925_non_servable_tree_deploy_reports_no_url_and_says_why` | BUG-31 | aligned — explicit `null` (not `''`), report terminal line and reason, and `1c help` text |
| AC-926 → `test_UAT_AC926_each_store_tree_keeps_its_own_deploy_index` | BUG-31 | aligned — same slug, same revision number, same channel; real index bytes compared identical |
| AC-927 → `test_UAT_AC927_servable_store_tree_is_fixed_in_the_server_and_never_derived_from_a_request` | BUG-31 | aligned — 12 address forms incl. tree-first keys; reads never name the non-servable tree; 404 shape equals never-deployed |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | exclusivity | 5 free-coded test files vs. the 4 AC-named files | uat-edit | ~32 `test_UAT_FC_*` tests re-verify AC-covered scenarios **in the same test shape**, using the same entry points and the same fakes. `tests/req110-r2-deploy.test.ts` (7 tests) is wholly subsumed by `reconciliation-deploy-snapshot.test.ts` — e.g. `test_UAT_FC_REQ-110_deploy_is_content_addressed` and `test_UAT_AC893_…` are the same deploy/redeploy/change-and-redeploy sequence over `MemoryR2Client`, and `test_UAT_FC_REQ-110_deploy_draft_uploads_snapshot` is a strict subset of `test_UAT_AC892_…`. Likewise `tests/req111-public-site-serving.test.ts` (10) vs AC-902…914 — `test_UAT_FC_REQ-111_serves_preview_snapshot` is the same scenario, same helpers, as `test_UAT_AC902_…`; `tests/req113-worker-extensionless-urls.test.ts` (6) and `tests/req113-serve-extensionless.test.ts` (4) vs AC-915…921; `tests/bug31-sandbox-r2-namespace.test.ts` (5) vs AC-924…927. | Decide once, at project level, whether free-coded `test_UAT_FC_*` evidence is retired when a reconciliation story lands its AC-named UATs. **Do not repair this capability alone** — see Notes. |

No violations and nothing requiring review:

- **Coverage** — all 36 active ACs have at least one substantive UAT. Every one
  drives a real entry point (`cmdDeploy`, `worker.fetch`, `startServe` over
  loopback, a raw socket); none is a structural or AST-shaped check. Zero ACs
  are uncovered.
- **Consistency** — every test was read against its AC. Each exercises the
  behaviour its AC claims, and in several cases the AC's own `## Verification`
  paragraph is followed step for step. Cross-AC delegations are honoured rather
  than double-counted: AC-905 explicitly defers the store-tree gate to AC-927
  and tests only within-tree index gating; AC-906 explicitly accounts for the
  one header AC-910 requires. No `uat-edit` for wrong-target testing was found.
- **Exclusivity within the AC set** — no two AC-named tests verify the same
  scenario. The single 1:1 AC↔test mapping was verified mechanically across
  AC-892…AC-927.

## Notes for the Editor

**On finding 1 — why it is a warning and not a violation.** The duplication is
real and I verified it by reading both sides, but it is **not drift local to this
capability**. The same pattern holds across the repository: `req82-l1-substrate`
alongside `reconciliation-l1-substrate`, `req92-fold-full-language` alongside
`reconciliation-l1-fold-full-language`, and so on. That consistency reads as an
established convention — free-coded UATs are kept as the evidence the original
intent shipped with, and the reconciliation story adds the matrix-addressable
AC-named UATs beside them — rather than as an oversight in these three stories.
Repairing it here alone would make this capability inconsistent with every other
one. It belongs to the operator as a project-wide test-suite policy decision. It
does not weaken the matrix: the AC-named UATs are in every case equal to or
stronger than their free-coded counterparts, so deleting the duplicates would
cost no coverage.

**Scope note.** AC-1018 … AC-1023 (`test_UAT_AC1018…1023_*`, site asset listing,
`tests/reconciliation-site-asset-listing.test.ts`) surface near this capability
in a naming search but belong to STORY-102 under `capability-b4ac88fc`. They were
excluded after checking `fields.capability_uid`, not by title.

**Environment note for whoever runs this next.** `xgd ticket list --filter …`
could not complete in this worktree: it forces a cold-index rebuild whose
exclusive flock is chronically held by the running dashboard servers and
dispatcher runners, and it failed with `index_fcntl_lock: timed out after
30000ms` on every attempt over ~40 minutes. The story and AC sets here were
therefore assembled through the fast UID path (`xgd ticket get <uid> --json`,
which needs no index), with `id → uid` resolution taken from the generated
`.xgd/tickets/search/metadata.json`. All ticket **content** in this report came
from the ticketing API; no ticket `.md` file was read. The story set was
confirmed complete by checking `fields.capability_uid` on all 25 indexed
stories — exactly three name this capability — and the AC set by confirming
AC-892 … AC-927 is contiguous with no gaps.
