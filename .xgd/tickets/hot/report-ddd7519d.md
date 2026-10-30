---
uid: report-ddd7519d
id: REPORT-5432
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T03:09:06.905187+00:00'
updated_at: '2026-09-29T03:09:06.905187+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-119dd4af.md` — **UU**, intent/bookkeeping ticket
  (class 2e: `request-*`). Conflict confined to the frontmatter; resolved
  per-fact, not by picking a winning file.
  - `status` and `updated_at`: same fact changed differently on both sides →
    genuine intent conflict → later-positioned intent wins, per fact. HEAD is
    both later by timestamp (`2026-09-09T21:32:49` vs `2026-09-01T03:36:06`)
    and downstream in the lifecycle (`bundled` follows `ready_to_reconcile`).
    Corroborated by the *unconflicted* `fields.bundled_in: bundle-87be4669`
    sitting in the same `fields` block: taking the incoming `status:
    ready_to_reconcile` would have left a populated `bundled_in` beside a
    pre-bundle status — an internally inconsistent record.
  - Body and all other frontmatter/fields: byte-identical on both sides, so
    there were no disjoint additions to compose.
  - Staged with `git add --sparse` (path is outside the sparse-checkout cone
    per DOC-986 §2/§4.1; conflict existed in the index only).

Staging verified clean: `git ls-files -u` empty, no conflict markers in the
file, no `UU/AA/DU/UD` lines in `git status --porcelain`.

## Incoming changes preserved

`diff` of the incoming blob (`f3c81c5df5:.xgd/tickets/hot/request-119dd4af.md`)
against the resolved file shows exactly three differences, all of them the
intended per-fact resolutions above:

```
9c9   updated_at: '2026-09-01T03:36:06' -> '2026-09-09T21:32:49'
12c12 status: ready_to_reconcile        -> bundled
23a24 + fields.bundled_in: bundle-87be4669   (HEAD-only addition, kept)
```

Every other line of the incoming version — the whole `# What landed` body, the
test plan, and all remaining frontmatter (`commits`, `version`, `priority`,
`story_points`, `chat_comment`, …) — is preserved verbatim. No developer
content was discarded; the only incoming values not taken are the two
lifecycle scalars that HEAD has legitimately advanced past.

No hunks were dropped under the BUG-1301 precedence exception, and no test
functions were touched (this conflict involves no code or UAT files).

## Note for the next step

The resolution is a complete supersession of the picked commit, so the staged
diff against HEAD is empty (`git diff --cached HEAD` produces no output) and
this cherry-pick is a no-op. Per instruction I did **not** call
`--skip`/`--continue`; `CHERRY_PICK_HEAD` (`f3c81c5df5…`) is left in place for
the finalize step, which will detect the clean staged diff and skip the commit.
