---
uid: report-ee851647
id: REPORT-5700
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-30T07:47:46.916930+00:00'
updated_at: '2026-09-30T07:47:46.916930+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

Incoming commit `5d86989316` — `fix(assets): one content-type table, and a filename
made safe once [FREE-CODED]` (REQ-246, author 2026-09-14 14:10:35 -0700). Three
conflicted paths of the commit's 20; the other 17 auto-merged, including the new
`tools/generate/src/store/asset-name.ts`, the `content-type.ts` → `content-type.js`
+ `.d.ts` move, and the three new REQ-246 UAT test files.

- **`apps/public-site/src/content-type.ts` — `UD`, rule 2a (UD: accept deletion).**
  `git rm`. Deleting this file *is* the incoming commit's stated purpose: it folds
  public-site's private copy of the content-type table into the single table at
  `tools/generate/src/store/content-type.js`. Ours' only delta from base
  (`829b047f05` → `b7ceb3b5bc`) was a rewritten header comment explaining *why* the
  duplicate table was legitimate — prose whose entire subject is the duplication
  incoming removes, so nothing survives it to preserve. No live importer of the
  module remains anywhere in the tree after the resolution (verified by grep over
  `apps/public-site/src`, `tests`, `tools/generate/src`; the only remaining mentions
  are prose in `content-type.js`'s header and
  `tests/test_UAT_FC_REQ-246_one_content_type_table.test.ts`, both describing the
  fold-in as history).

- **`tests/reconciliation-platform-build-deploy-smoke.test.ts` — `UU`, one region,
  rule 2c step 1 (non-overlapping: keep BOTH).** The region is the import block.
  Theirs removes `import { contentTypeFor } from '../apps/public-site/src/content-type'`
  (the module it deletes); ours adds `DEV_ONLY_VAR` to the adjacent
  `./support/wrangler-toml` import. Different lines, no semantic overlap — resolved
  by applying both: the content-type import is gone, ours' `DEV_ONLY_VAR` stays.
  Theirs' other two hunks in this file (dropping `EXPECTED_CONTENT_TYPES` from the
  `./support/smoke` import, and replacing the table-pinning assertion loop in
  `story-d5167ced` with the comment recording that the script now imports the
  Worker's own module) auto-merged and are present.

- **`tools/generate/src/store/d1r2-store.ts` — `UU`, three regions, rule 2c step 2
  (truly incompatible → INCOMING WINS).** See the next section; this is the one
  genuine design conflict in the pick.

## Incoming changes preserved

**`tools/generate/src/store/d1r2-store.ts` — resolved file is byte-identical to
`:3:` (`git diff 23a3a93e70 -- <path>` is empty).** Every incoming hunk is present.

The three regions are one decision, not three: what `write` does with an asset whose
name would leave the site's namespace.

- Ours (`0334fc19fb`, main side, `feat(store): the D1 store addresses a site by its
  key [FREE-CODED]`) **drops** the offending asset, lands the rest of the change set,
  and `console.warn`s the refusal — partitioning `change.assets` into
  `accepted`/`refused` and iterating `accepted` in both write loops.
- Theirs **throws before the first byte**, via `assertWritableAssetNames(change.assets)`,
  and removes the `if (isUnsafeName(name)) continue` skip from both loops.

These cannot be integrated: one guarantees the rest of the change lands, the other
guarantees the change set cannot half-land. Incoming's commit message names ours'
shape as the defect it is fixing — "`isUnsafeName` stops being a silent skip … it
throws over the whole change set before the first byte rather than dropping bytes
from a write that reports success" — and its in-code comment rejects the
skip-and-continue shape explicitly. Under the HARD RULES ("Where truly incompatible,
INCOMING WINS") and 2c step 2, incoming takes all three regions.

Two independent confirmations that this is the coherent resolution rather than a
policy default applied blindly:

1. **The rest of this same file already carries incoming's design, auto-merged.** The
   `asset-name` import (`assertWritableAssetNames`, `isUnsafeAssetName as isUnsafeName`)
   is at lines 5–7; the file-local `isUnsafeName` helper is gone; and the publish path's
   own `assertWritableAssetNames(content.source.assets)` merged cleanly at line 841.
   Keeping ours in `write` would have left a single adapter that drops-and-warns on one
   path and throws on the other.
2. **Every sibling adapter is staged with incoming's design.** `fs-store.ts`,
   `memory-store.ts`, `index.ts` and the new `asset-name.ts` all auto-merged, and the
   three new UAT files (`test_UAT_FC_REQ-246_safe_names.test.ts`,
   `_a_usable_name.workers.test.ts`, `_one_content_type_table.test.ts`) assert the
   throwing contract. That is the commit's "one statement, obeyed by every adapter".

**`tests/reconciliation-platform-build-deploy-smoke.test.ts` — theirs' whole delta from
base is present, plus ours.** Diffing the resolution against `:3:` (`85b871c75b`) yields
only ours' own non-overlapping work: the two expanded AC-1341/AC-1342 header bullets,
the `DEV_ONLY_VAR` import, the 60-line `runSecretHook` helper and its tests, and one
reworded comment. All 8 `-` lines in that diff are ours' own supersedes of ours'
earlier text — none is incoming content. No test function present on either side was
deleted: incoming's removal inside `story-d5167ced` drops five assertion lines from an
existing `it(...)`, which is incoming's own edit, and the enclosing test remains.

**`apps/public-site/src/content-type.ts`** — the deletion *is* the incoming change;
preserving it means letting it go.

## Arbitration of last resort (BUG-1460)

Not applicable — STEP 3h never fired. No mechanical failure, no hunk dropped under the
BUG-1301 precedence exception, and no UAT function needed deleting. All three paths
resolved under STEP 2's ordinary rules (2a for the `UD`, 2c for the two `UU`s).

## Staging state

`git status --porcelain` shows no conflict-class lines: `D apps/public-site/src/content-type.ts`
plus `M` on the two `UU` paths, alongside the 17 auto-merged staged entries.
`CHERRY_PICK_HEAD` intact at `5d86989316ca69788cdebc117bffa209edbf0c36`, HEAD unmoved at
`2e21a47501d3ae82e1478b171e1a2fdaf9fb3b0f`. Unlike this branch's recent ticket-file
picks this resolution carries a real net change, as a code pick should. `git cherry-pick
--continue/--skip/--abort` not called.

## Forecast for later picks in this series

- This is the **first code-file conflict on `resync-377b581e`** after a long run of
  `.xgd/tickets/**` picks. Do not carry the ticket-picks' `--ours`/zero-net-change
  reflex onto a code path: resync's HARD RULES make incoming authoritative for code,
  and here it won outright.
- The decisive cheap test on a resync code conflict: read the incoming commit's own
  message (`git show --format=%B <CPHEAD>`) for whether it names ours' shape as the
  defect it fixes, then check whether the file's *other* hunks and its sibling modules
  auto-merged with incoming's design. When they did, keeping ours in the conflicted
  region produces an incoherent hybrid, and that settles it without a timestamp
  argument.
- The enrichment's rule for all three paths was "Intent unknown on one or both sides.
  Take the more recent commit by timestamp and flag for post-merge review." Ours is
  newer on every path, so that rule would have chosen **main** on all three — directly
  against the HARD RULES' "a resolution that keeps ONLY main's version is data loss."
  The naive timestamp rule is no guide on resync code conflicts; it happened to agree
  with `--ours` on the ticket picks and is actively wrong here.
