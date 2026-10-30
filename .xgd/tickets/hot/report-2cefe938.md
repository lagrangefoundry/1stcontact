---
uid: report-2cefe938
id: REPORT-5312
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T07:07:24.728023+00:00'
updated_at: '2026-09-28T07:07:24.728023+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bundle-78f4e2fe.md` (BUNDLE-21) — **UU**, intent/bookkeeping
  ticket (**STEP 2e**, `bundle-*`). Resolved to **ours (HEAD)** wholesale;
  staged blob is exactly stage 2 (`d51c00436b`).

Cherry-pick context for this attempt:

- `CHERRY_PICK_HEAD` = `2ff73d0d1f` — "xgd(ticket): update bundle
  bundle-78f4e2fe", authored Mon Aug 31 12:19:32 2026 -0700 (= 19:19:32 UTC)
- index stages: base `523698b552`, ours `d51c00436b`, incoming `d1bc40cc1f`
- HEAD is unchanged at `c88aed46b0`, and this attempt's merge base
  (`523698b552`) is the *previous* attempt's incoming blob — i.e. the prior
  pick was correctly finalized as empty and the queue advanced to the next
  commit. This is a genuinely distinct conflict, not a re-presentation.

### Rule applied — per fact, not per file

`git show 2ff73d0d1f` shows the incoming commit's entire content change is
advancing `status: reconciling` → `free_and_reconciled` and stamping
`completed_at`. Resolving fact by fact:

| fact | ours | incoming | verdict |
|---|---|---|---|
| `status` | `free_and_reconciled` | `free_and_reconciled` | **identical** |
| `completed_at` | `19:19:32.487153` | `19:19:32.730241` | same event, each timeline's own stamp |
| `updated_at` | `19:19:50.607800` | `19:19:32.730241` | ours later-positioned |
| `last_field_updated` | `result` | `status` | ours later-positioned (consistent with `result` having been set after) |
| `fields.commits` | remapped (`working_sha: null`, `main_sha: 96a76934e0`) | five un-remapped `working_sha`, `main_sha: null` | ours downstream |
| `orphan_commits` (21 entries), `merged_at_commit`, `result: pass` | present | absent | ours strict superset |

Every fact selects ours — either the two sides agree exactly, or ours is the
later-positioned intent, or ours is a strict superset. No fact required the
2e tie-break to choose *against* a still-live incoming value.

Timeline note: `xgd working-timeline` is not usable as the tie-break input here
because bundle tickets carry no `intent_uid`, so per-fact ordering was
established from commit/field timestamps instead (ours `updated_at` 19:19:50 >
incoming 19:19:32).

The auto-enrichment rule supplied for this file ("intent unknown on one or both
sides — take the more recent commit by timestamp") selects the same side: both
subjects are the generic `xgd(ticket): update bundle bundle-78f4e2fe` and
neither states an operation, and ours is the more recent.

Sparse-checkout note (DOC-986 §2/§4.1): the path is outside the cone on this
resync branch, so staging used `git add --sparse`.

## Incoming changes preserved

No code/implementation files were in conflict — the single conflicted path is a
bookkeeping ticket — so STEP 3's "incoming code changes must appear in the
result" check has no code-file subjects. The **BUG-1301 precedence exception was
not invoked**; no hunk was dropped under it.

The incoming commit's intent is preserved **by prior attainment**, not
discarded: the state it exists to establish — `status: free_and_reconciled` —
is already the value ours carries, byte-identical. Ours then goes further
(`result: pass`, the 21-entry `orphan_commits` remap table, `merged_at_commit`,
and the commit remapped onto main), which is strictly downstream on the bundle
lifecycle.

Taking incoming would have regressed the ticket: nulled `main_sha` back to five
un-remapped `working_sha` entries, dropped `result: pass` and
`merged_at_commit`, and rewound `last_field_updated`/`updated_at`. Lifecycle
scalars and remap tables must not regress.

Bodies are byte-identical between the two sides — the ours-vs-incoming blob
diff shows no hunk below `# Bundle` — so nothing outside the frontmatter was in
question and no incoming body content is lost.

## Net effect

Because ours already subsumed the picked commit's intent, the staged tree equals
HEAD's tree for this path and this cherry-pick is **empty**. Per STEP 4 it is
staged and left as-is rather than `--skip`ped; the finalize step is expected to
detect the clean staged diff and skip the commit.

Verification: `git status --porcelain` empty, `git ls-files -u` empty, staged
blob `d51c00436b` (= stage 2), no conflict markers on disk.
`CHERRY_PICK_HEAD` deliberately left live at `2ff73d0d1f` — no `--continue`,
`--skip`, `--quit`, or `--abort` was run.
