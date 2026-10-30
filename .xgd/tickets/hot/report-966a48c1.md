---
uid: report-966a48c1
id: REPORT-5638
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-30T04:09:50.546048+00:00'
updated_at: '2026-09-30T04:09:50.546048+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

Picked commit `9db539fbb584055240161600381765e15b47c51e` — "feat(publish): typed
sources, and a publish that says what it is doing [FREE-CODED]" (author 2026-09-12
16:38:10), 19 files. HEAD `360a395c7a`. Anchor `report-377b581e`. Retry count 1,
`prior_stage_failure` empty.

Four `UU` code files, all materialized with markers:

- `apps/control-app/src/image-ladder.ts` — code UU (1 region). §2c: **incoming**.
- `tests/test_UAT_FC_REQ-222_publish_ladder.workers.test.ts` — UAT test UU (1 region).
  §2c/§2f: **incoming**. No test function on either side is lost — incoming's file is
  a strict descendant of ours (see below).
- `tests/test_UAT_FC_REQ-222_width_ladder.test.ts` — UAT test UU (3 regions).
  §2c/§2f: **incoming**, same reason.
- `tools/generate/src/publish/ladder.ts` — code UU (7 regions). §2c: **incoming**.

### Why "incoming" here is an integration, not a choice of one side

The decisive fact is that **ours has no unique content at all on these four paths**.
Each ours blob (`:2:`) is byte-identical to xgd-working's own `b58546d4dc`
("REQ-222: the background ladder, intrinsic dimensions, immutable renditions"),
which is the **first parent** of the picked commit's parent:

    git diff :2:<path> b58546d4dc:<path>     # empty for all four paths

The picked commit's parent is the merge `12fabc0ed0` ("REQ-222: merge xgd-working;
the ladder rides REQ-219's one renderer"), and base (`:1:`) is exactly that merge's
blob:

    git diff :1:tools/generate/src/publish/ladder.ts 12fabc0ed0:...   # empty

**That merge commit has never been replayed onto this resync branch** — no commit on
HEAD carries its subject, and each of these four files has a single-commit ours-side
ledger, every one of them an earlier resync replay of an xgd-working commit
(`f436bce055` ← `c2d79f8ca1`, `a53241e509` ← `9110d75b51`, `c1dd7fc91c` ←
`b58546d4dc`). Main never authored these files.

So base→ours is not a HEAD-side change at all: it is the **exact reverse of the
developer's own merge resolution**, which git necessarily reads as "ours deleted
that". Honouring ours would have discarded `12fabc0ed0` — the commit where the
developer adapted REQ-222's ladder to ride REQ-219's single renderer — and then
discarded the picked commit's typed-sources work on top of it. Incoming is a strict
descendant of ours in xgd-working's own history, so taking it preserves every
decision ours represents plus the two the branch is missing.

The one conflict region in `image-ladder.ts` shows the shape plainly: ours' side is
the pre-merge `imagesRenderer.resize` reaching `images.input(...).transform(...)`
directly; incoming's is the post-merge `resize` that goes through REQ-219's `render`
and takes the extra `type?` argument for typed sources. The merge deliberately
replaced the first with the second.

Resolution mechanics: `git checkout --theirs -- <4 paths>` then `git add -- <4 paths>`.
Blanket `--theirs` is normally wrong on a code UU because it discards auto-merged
ours hunks; it is safe **here specifically** because ours has no unique hunks to lose
by construction.

## Incoming changes preserved

Index versus incoming, restricted to the picked commit's own 19 paths:

    git diff --cached --numstat 9db539fbb5 -- <19 paths>
    14  14  apps/control-app/src/builder/builder.css
    2   2   apps/control-app/src/router.ts

17 of 19 paths are **byte-identical to incoming**, including all four resolved
files. The two remaining deltas are accounted for:

- `apps/control-app/src/builder/builder.css` — no content difference. Both sides
  carry two `.builder-people__bounced` rules (a pre-existing upstream duplication);
  ours places the second at line 1721, incoming at 1661. Position only, nothing lost.
- `apps/control-app/src/router.ts` — HEAD's own `personName` → `accountName` rename
  in `businessesPayload`, from the earlier resync replay `88d7a80adb` ("wip(names):
  user_names table, resolver, tab [FREE-CODED]"). Non-overlapping with anything
  incoming touches, so §2c.1 keeps both.

### One auto-merged file needed repair: `apps/control-app/src/router.ts`

`router.ts` was **not** flagged `UU` — git auto-merged it — but the automatic merge
left a result that both broke the file and dropped incoming content, for the same
unreplayed-merge reason as the four conflicts:

- ours contributed a separate `IMAGES?: ImagesBinding` member (REQ-222's own
  pre-merge declaration) while incoming carries the merge's single consolidated
  `IMAGES?: ImagesLike`. The auto-merge kept **both**, producing a duplicate member
  in one interface — `IMAGES?` at lines 704 and 751 of the staged blob, which is a
  hard TypeScript error, not a stylistic issue.
- it also reverted incoming's doc comment on that declaration from "THREE CONSUMERS
  NOW, AND ONE DECLARATION ([[REQ-219]], [[REQ-222]])" back to the pre-merge "TWO
  CONSUMERS" text, and dropped incoming's "ITS ABSENCE IS A LOUD FAILURE FOR THE
  FIRST TWO AND A QUIET ONE FOR THE THIRD" paragraph.

Two `Edit`s: removed ours' now-duplicate `IMAGES?: ImagesBinding` block, and restored
incoming's two paragraphs verbatim. No new prose was authored — both edits move text
that is already on incoming's side of this pick. After them `router.ts` differs from
incoming only by the `accountName` rename above. `ImagesBinding` survives in this file
only inside a doc comment, so nothing is left dangling.

## State on exit

- `git status --porcelain`: no `UU`/`AA`/`DU`/`UD` lines; **19 staged paths**, exactly
  the 19 in `git show --numstat 9db539fbb5`. Nothing outside the commit's own diff was
  staged.
- `grep -rn '^<<<<<<<' apps packages tools tests`: empty.
- `CHERRY_PICK_HEAD` intact at `9db539fbb584055240161600381765e15b47c51e`.
- Net staged change: 19 files, +2663/−350. A code pick commits, so zero-net-change is
  not the success signal here.
- No cherry-pick state command was run. No `--continue`/`--skip`/`--abort`/`reset`.

Verification stops at read level: the caretaker rule forbids `test_fix`, and the
`*.workers.test.ts` suites touched here are unrunnable in a headless role
(`listen EPERM` from workerd). **The suites were not executed.** The strongest
available check was run instead — the index-versus-incoming comparison restricted to
the commit's own paths, above.

## Forecast for the remaining picks on these paths

`git log xgd-working -- tools/generate/src/publish/ladder.ts` and the two test files:

| commit | date | note |
|---|---|---|
| `7ad2b18161` | 09-12 17:06 | feat(render): a band's backdrop gets WebP, through `image-set()` |
| `d9b6443c6e` | 09-13 17:04 | feat(store): the D1 store addresses a site by its key |
| `7889c0753e` | 09-22 16:44 | feat(publish): stream ladder renditions, and refuse on bytes |
| `6b494d1302` | 09-22 17:18 | feat(store): address assets by content, not by their bytes |
| `9df761ad65` | 09-22 19:26 | Merge xgd-working (REQ-305 ladder streaming) into free-REQ-304 |

All five carry **genuine new intent** — these are code paths, so the ticket-file
`--ours` reflex does not apply and the forecast is to **accept incoming's lines**.
After this pick the four paths equal `9db539fbb5`, so the next pick's base will line
up again and the "ours looks like it reverted the merge" anomaly is healed for them.

**The anomaly is not healed branch-wide, and this is the reusable lesson.** Merge
commit `12fabc0ed0` is absent from this branch, and it touched 35 code paths. Where a
path's content came in via the merge's *second parent* (REQ-219/REQ-221 work), the
resync branch already has it from replaying those commits directly — `app.js`,
`image-edit.ts`, `image-recipe.ts`, `package.json` and `req115-builder-composition`
are all byte-identical to incoming for that reason. Where the merge's delta is the
developer's own *resolution*, it exists nowhere else and the branch is missing it.
So on any future pick descended from `12fabc0ed0`, run

    git diff :2:<path> b58546d4dc:<path>

first: if it is empty, ours is a pure ancestor state, there is nothing of main's to
preserve, and incoming wins the whole file. Paths still exposed to this include
`apps/control-app/src/material.ts`, `apps/control-app/src/builder/panel.js`,
`apps/control-app/src/heic.ts`, `apps/control-app/src/ai.ts`,
`apps/control-app/wrangler.toml` and `tools/generate/src/store/revision-model.ts`.
And check the commit's **auto-merged** files as well as its conflicts — `router.ts`
here shows the auto-merge can silently produce a duplicate declaration rather than a
conflict.
