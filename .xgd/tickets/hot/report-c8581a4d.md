---
uid: report-c8581a4d
id: REPORT-3175
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T01:54:35.939585+00:00'
updated_at: '2026-09-01T01:54:35.939585+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `bin/access-token` — **AA** (both added). Rule 2b, superset branch. HEAD's
  version is a strict superset of the incoming one: the blob diff
  incoming→HEAD is purely additive (+2 lines documenting `CLOUDFLARE_API_BASE`;
  the bare `API = "https://api.cloudflare.com/client/v4"` rewritten as
  `CLOUDFLARE_API = "https://api.cloudflare.com/client/v4"` plus
  `API = (os.environ.get("CLOUDFLARE_API_BASE") or CLOUDFLARE_API).rstrip("/")`,
  which preserves the incoming URL as the default and keeps the `API` name every
  downstream call site uses). Resolved `--ours`, then staged.
  Losslessness proven before the write: `git diff HEAD -- bin/access-token`
  showed 7 insertions and 0 deletions, all of them conflict-marker lines plus
  the incoming variant of the two conflicting regions — i.e. no cleanly
  auto-merged incoming content existed outside the markers that `--ours` could
  have silently dropped.

- `package.json` — **UU**. Single-field conflict: HEAD `"version": "0.2.16"`
  vs incoming `"version": "0.2.10"`. Kept HEAD. The incoming commit's intent was
  a monotonic bump 0.2.9 → 0.2.10; that exact bump is already in HEAD's
  ancestry (`f84d4a46c7 fix(control-app): register the configured tenant so a
  fresh builder boots [FREE-CODED]`, confirmed with
  `git log HEAD -S'"version": "0.2.10"' -- package.json`), and HEAD has since
  advanced through further `[FREE-CODED]` bumps to 0.2.16. Taking incoming
  would have *regressed* the version rather than applying a developer change.
  This also matches the enrichment rule for this file (take the more recent
  commit by timestamp): HEAD side `1213d247dd` is 2026-08-28, incoming
  `68a949cc08` is 2026-08-23.
  Losslessness proven the same way: `git diff HEAD -- package.json` was 4
  insertions, 0 deletions — markers plus the incoming version line only.

## Incoming changes preserved

Incoming commit is `68a949cc08` ("Merge branch 'free-BUG-36' into xgd-working"),
cherry-picked mainline-parent-1, so its change set is
`git diff c1d2a2ff87 68a949cc08` — 13 files.

Verified present in HEAD, not discarded:

- 8 of the 13 files are **byte-identical** in HEAD to the incoming commit
  (`git diff 68a949cc08 HEAD` lists no change for them): `bin/publish`,
  `apps/control-app/src/store.ts`, `tools/generate/src/cli/builder.ts`,
  `tools/generate/src/cli/index.ts`, `tools/generate/src/cli/push.ts`,
  `tests/test_UAT_FC_BUG-36_publish_credential.test.ts`,
  `tests/test_UAT_FC_BUG-36_tenant_bootstrap.workers.test.ts`,
  `tests/test_UAT_FC_REQ-149_publish_in_the_cloud.workers.test.ts`.
- `apps/control-app/src/router.ts` — incoming's BUG-36 change landed: the
  `storeForImport`/`importStore` seam it removed is absent from HEAD, and the
  comment it added is present at `router.ts:295`.
- `apps/control-app/ACCESS.md` — incoming's additions present: the
  `1stcontact-publish` service-token row at `ACCESS.md:70` and the
  "The API token is the provisioner, never the credential" section at
  `ACCESS.md:99`.
- `bin/access-token` and `package.json` — as described above; both incoming
  contributions are present in HEAD (subsumed / already applied).

No UAT test function on either side of this conflict was deleted; both incoming
BUG-36 UAT files exist in HEAD unchanged. No hunk was dropped under the
BUG-1301 precedence exception — it was not needed.

## Note for the finalize step

The staged tree is byte-identical to HEAD (`git diff --cached HEAD` is empty).
This is the BUG-1109/BUG-1122 redundant-commit case, not a discard: STEP 3's
check distinguishes them, and every one of the incoming commit's key changes
was found *present* in HEAD (evidence above), not absent. Per STEP 4 I did not
call `--skip`; `CHERRY_PICK_HEAD` (`68a949cc08`) is intact for
`cherry_pick_finalize_resolution` to detect the clean staged diff and skip the
commit itself.
