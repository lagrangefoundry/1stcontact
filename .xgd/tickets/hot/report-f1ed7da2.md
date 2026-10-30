---
uid: report-f1ed7da2
id: REPORT-5294
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T04:41:57.017756+00:00'
updated_at: '2026-09-28T04:41:57.017756+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/doc-4866a486.md` — class **AA** (add/add), ticket file (DOC-13 "Reference Capture Model"). Rule applied: enrichment's *"intent unknown on one or both sides → take the more recent commit by timestamp"*. **Ours (HEAD) taken** via `git checkout --ours` + `git add --sparse`. Independent history analysis confirms the timestamp rule lands on the substantively correct side (below).

## Incoming changes preserved

Not a code file; no UAT functions on either side. The two sides' **bodies are byte-identical** — `diff` of stage 2 (`9c9d57e0ce`) against stage 3 (`a24f8536a7`) yields exactly three frontmatter lines and nothing else:

```
-updated_at: '2026-08-31T19:42:54.966729+00:00'   (ours)
+updated_at: '2026-08-26T23:40:17.574148+00:00'   (theirs)
-last_field_updated: system_kb                    (ours)
+last_field_updated: body                         (theirs)
+  system_kb: true                                (theirs only)
```

So no incoming *content* was dropped. The incoming commit's own contribution is already on HEAD:

- The picked commit `b629bf6ab8` ("xgd(ticket): update doc doc-4866a486", author date `Wed Aug 26 16:40:17 2026 -0700`) is the **same logical commit** as `963c1f1b9d` on HEAD — identical author, identical author date, identical subject, and `963c1f1b9d`'s resulting blob **is** `a24f8536a7`, i.e. the incoming stage-3 blob exactly. Its payload (the §6.1 "cloud has the same eyes / REQ-154" section, +90 lines) is present verbatim in the resolved file.
- `b629bf6ab8`'s only parent on the incoming side is `0d11a0146e` — `xgd(resync): strip .xgd/tickets, … from main snapshot (BUG-904)`. That strip is why the incoming side presents this as a 201-line pure insertion: it is a **strip-restore artifact**, not a fresh authoring of the file.
- HEAD then carries a strictly later refinement, `b10602cef9` (author date `Mon Aug 31 12:42:55 2026 -0700`), whose message states the intent explicitly: *"field: retire system_kb boolean; membership moves to doc_kind (DOC-39 3.3)"*. Its diff is precisely the removal of `system_kb: true` plus the `updated_at`/`last_field_updated` bookkeeping.

Taking theirs would therefore have **regressed a documented, deliberate later field retirement** (re-adding `system_kb: true` after DOC-39 §3.3 retired it) while adding no content. Taking ours preserves both the incoming §6.1 body and the post-incoming field retirement.

No hunk was dropped under the BUG-1301 precedence exception — nothing on the incoming side is absent from the resolved file.

### Note on net change

The resolution equals HEAD's blob, so `git status --porcelain` is empty and this cherry-pick will have no net effect. Per STEP 4 this resolver did **not** call `--skip`/`--continue`/`--quit`/`--abort`; `CHERRY_PICK_HEAD` (`b629bf6ab8`) is left live for the sequencer.
