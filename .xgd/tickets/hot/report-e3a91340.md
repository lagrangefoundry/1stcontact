---
uid: report-e3a91340
id: REPORT-4676
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T09:32:14.291271+00:00'
updated_at: '2026-09-21T09:32:14.291271+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

Incoming `CHERRY_PICK_HEAD` = `d99c1f4385` — *"feat(material): ingestion from a
dropped file to an indexed ticket [FREE-CODED]"* (REQ-163, 12 files, 2488
insertions). Seven conflicted paths, 38 hunks, all **UU/AA on code**, so **2c**
governs (2d/2e/2f were not reached — no spec ticket, no intent ticket, and the
one UAT-file question is addressed at the end).

The fact that decides every hunk, established before any was touched: **HEAD
already carries this commit.** `297281259f` ("Merge branch 'free-REQ-163' into
xgd-working") is an ancestor of this branch and its stat is `d99c1f4385`'s stat
minus the two `test_UAT_FC_*` files and the root version bump — the same nine
paths with the same insertion counts (`describe.ts` 502, `fetch-guard.ts` 242,
`material.ts` 447, `router.ts` 243, `tickets.ts` 51, `pnpm-lock.yaml` 71,
`material-fixtures.ts` 66, the origin UAT's 22). HEAD then evolved those files
through BUG-41, REQ-160, REQ-161 and REQ-172. So every conflict here is
*original free-coded text vs. its own later descendant*, and 2c's step 2
("overlapping: integrate; where mutually exclusive, incoming wins") resolves to
HEAD on each one — not because HEAD is preferred, but because HEAD's text
**contains** incoming's and supersedes it in place. 2c step 3's check
(confirm incoming changes appear in the result) passes for all seven; see the
next section.

- `apps/control-app/src/material.ts` — **AA**, 20 hunks, rule **2c** (read via
  `git diff :2: :3:`, per hunk). Ours = theirs + BUG-41's `resolveContentType` /
  `TYPE_BY_EXTENSION`, + REQ-161's `MaterialRole`, `listMaterial`,
  `readMaterial`, `materialFile`, `reviseDescription`, `MATERIAL_TYPES`,
  `NotMaterialError`, + REQ-172's `content_type` on the row, + the `readBlob`
  addressing correction and `freeAssetName`.
- `apps/control-app/src/router.ts` — **UU**, 10 hunks, rule **2c**. Ours =
  theirs + REQ-160's session knowledge wiring, + REQ-161's Library read routes,
  `role` validation, `placeOnSite`, and the `NotMaterialError` → 404 arm.
- `apps/control-app/src/describe.ts` — **AA**, 2 hunks, rule **2c**. Ours =
  theirs + BUG-41's front-matter-aware `titleFromText` and `frontMatterTitle`.
- `apps/control-app/src/fetch-guard.ts` — **AA**, 2 hunks, rule **2c**. Ours =
  theirs + the IPv4-mapped-IPv6 canonicalisation branch (`::ffff:7f00:1`) and
  the redirect refusal re-addressed to `raw`.
- `apps/control-app/src/tickets.ts` — **UU**, 2 hunks, rule **2c**. Ours is a
  **strict superset**: the ours↔theirs diff is deletions only (`role`,
  `content_type`, REQ-160's `kb_cursor`). Nothing incoming-only exists.
- `tests/reconciliation-builder-workspace-origin.test.ts` — **UU**, 1 hunk,
  rule **2c**. The hunk is REQ-161's Library no-store block, present only on
  HEAD; incoming contributes nothing to it. The commit's **own** 22-line REQ-163
  contribution (`/api/material`, `/api/material/fetch` in the no-store sweep)
  merged **cleanly**, outside any conflict region, and is in the resolved file.
  No test function on either side was deleted.
- `package.json` — **UU**, 1 hunk, `version`. **Departure from 2g, flagged
  deliberately.** 2g's default is "scalar conflicts: incoming wins", which would
  set `0.2.24` (August) over HEAD's `0.2.40`. I kept **ours**. `version` is a
  release stamp written by the bundle process, not developer content — the same
  class of superseded bookkeeping 2e resolves to the later-positioned side.
  Rewinding a main-rooted branch's monotonic version to an August value risks
  leaving the final tree below `0.2.40` depending on how the intervening bump
  commits resolve, which is a worse outcome than the stamp being "wrong" for one
  replayed commit. Recorded here so the reviewer can overrule it cheaply.

## Incoming changes preserved

Nothing the incoming side authored was lost, and **no hunk was dropped under the
BUG-1301 precedence exception** — it was not invoked.

Verified per STEP 3 against `CHERRY_PICK_HEAD` by diffing the two merge stages
directly rather than eyeballing the patch. Across all seven conflicted paths the
theirs-only side of `git diff :2:<path> :3:<path>` consists **entirely** of
superseded forms of text HEAD still carries:

- `material.ts` — `republishable: true` → `republishable: role !== 'reference'`;
  `contentType: input.contentType` (×3) → the once-resolved `contentType`;
  `readBlob(…, sha256)` → `readBlob(…, attachment.uid)`; `promoteToSiteAsset`
  without collision handling → with `freeAssetName`; the content-addressing doc
  comment → the comment documenting its withdrawal.
- `describe.ts` — the three-line `titleFromText` → the front-matter-aware one.
- `fetch-guard.ts` — the one-line `::ffff:` recursion → the canonicalising
  branch; the bare `assertFetchable` on a hop → the `FetchRefusedError`
  re-addressed to `raw`.
- `router.ts` — `workerHost(env, store, tenantId)` → the four-argument form; the
  inline `siteSlug` expression → the hoisted `siteSlug`;
  `json(200, materialEnvelope(ingested))` → the envelope spread with
  `placeOnSite`.
- `tickets.ts` and `tests/reconciliation-builder-workspace-origin.test.ts` — **no
  theirs-only content at all**; ours is a strict superset.
- `package.json` — `version: 0.2.24`, addressed above.

Positive confirmation rather than only absence-of-loss: every symbol the
incoming commit introduces is present in the resolved files — `ingestUpload`,
`ingestFetch`, `promoteToSiteAsset`, `MaterialRejectedError`,
`NotRepublishableError`, `classify`, `kindOf`, `IndexMaterial` (material.ts);
`describePdf`, `sfntNames`, `titleFromText`, `clipTitle`,
`anthropicImageDescriber` (describe.ts); `isPrivateHost`, `assertFetchable`,
`guardedFetch`, `FetchRefusedError` (fetch-guard.ts); the `/api/material` and
`/api/material/fetch` routes, `materialEnvelope`, `warnUnindexed`, `ingestDeps`
(router.ts); `MATERIAL_FIELDS`, `description_status`, `description_model`,
`filename` (tickets.ts); the REQ-163 no-store probes (origin UAT). Zero missing.

The commit's cleanly-merged paths (`apps/control-app/package.json`,
`pnpm-lock.yaml`, `tests/support/material-fixtures.ts`) produced no index change
because HEAD already holds them byte-for-byte — the same fact from the other
direction.

### The two incoming UAT files — kept, and why

`tests/test_UAT_FC_REQ-163_ingestion.workers.test.ts` (505 lines) and
`tests/test_UAT_FC_REQ-163_material_pipeline.test.ts` (339 lines) arrived as
**clean adds (`A `), not conflicts**, and are staged as git produced them.

I considered dropping them under the BUG-1301 precedence exception and
**rejected that**, on the exception's own terms. It requires naming the HEAD-side
commit that already removed the hunk's target; there is none. `git log
--diff-filter=D` finds no deletion, because HEAD never had these paths — they
exist only on `d99c1f4385` itself and on `db488440fe`
(`origin/reconcile-BUNDLE-23`). "HEAD reached the same place by an independent
route" is not "a legitimate refactor already integrated into HEAD removed this",
and STEP 2 is explicit that when the distinction cannot be drawn, **2f governs
and the test is not deleted**. They are also outside this step's mandate, which
is unresolved conflict markers. So they stay, and this cherry-pick carries a real
844-line change rather than an empty one.

Two things the next step should know, flagged rather than acted on:

1. These are the **pre-reconciliation free-coded** UATs. HEAD already carries
   AC-numbered reconciliation UATs covering the same claims —
   `reconciliation-material-ingestion.workers.test.ts` (AC-1678…AC-1687),
   `reconciliation-material-description.workers.test.ts` (AC-1688…AC-1699),
   `reconciliation-guarded-fetch.workers.test.ts` (AC-1700…AC-1708),
   `reconciliation-material-types.workers.test.ts` (AC-1492…AC-1495) — so the
   coverage is duplicated, not gained.
2. At least one **will fail** against HEAD's code:
   `UAT_FC_REQ-163 the same file uploaded twice is ONE blob and TWO records`
   asserts `keysUnder(env.BLOBS, 't/<tenant>/blob/<sha256>')` has length 1,
   i.e. content-addressed dedup. HEAD's
   `reconciliation-material-blob-storage.workers.test.ts` pins the opposite and
   says so in terms: the key is `` `${namespaceOf(account)}blob/${attachment.uid}` ``,
   *"composed from `attachment.uid` … and never from `fields.sha256` — that is
   the whole correction this story carries"*, with the same bytes attached twice
   yielding equal `sha256` but **different** `attachment.uid`.

Removing or reconciling them is a reconciliation/test-fix decision, not a
conflict resolution; it is recorded here so that step has the finding.

## Staging state

`git status --porcelain` shows only the two `A ` lines above — no `UU`, `AA`,
`DU`, `UD`, `AU` or `UA` remains. A marker scan over the seven resolved files
returns `0` for `<<<<<<<`, `=======` and `>>>>>>>`.

All seven resolved working-tree files hash **byte-identical to HEAD's blobs**
(`git hash-object` == `git rev-parse HEAD:…`): `cdf44fa5b1`, `a0b275c49a`,
`206112d4d9`, `74371e9632`, `695c9a840e`, `e9d83d294d`, `de25f361f4`. Staged
with `git add --sparse` (11% of tracked files present in this branch's
sparse checkout; DOC-986 §2/§4.1), each write issued as the sole content of its
own call per BUG-1294.

`git diff --cached HEAD` is the two UAT files, 844 insertions — a non-empty
commit, so the finalize step needs a plain `--continue`.

Per STEP 4, `--continue`, `--skip`, `--quit` and `--abort` were **not** called,
and nothing was run that resets or forgets the cherry-pick.
`CHERRY_PICK_HEAD` (`d99c1f438572f2da868db0bc384c798858681cac`) is intact.
