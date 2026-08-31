---
uid: report-82c2f476
id: REPORT-2812
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T07:41:20.114170+00:00'
updated_at: '2026-08-31T07:41:20.114170+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-d6bc0d26.md` — class **AA** (both added), intent/bookkeeping ticket → rule **2e** (strict-superset case). Path is outside the sparse-checkout cone, so resolved via `git checkout --theirs` + `git add --sparse` (DOC-986 §2/§4.1).

  Both sides carry the same subject (`xgd(ticket): update request request-d6bc0d26`), so the auto-enrichment classed the intent as unknown and prescribed "take the more recent commit by timestamp." The blob-vs-blob diff shows the two sides are not actually competing: the incoming version is a **strict superset** of HEAD's, differing by exactly one added frontmatter field:

  ```
  @@ -44,6 +44,7 @@ fields:
       main_sha: null
     version: 0.0.135
     bundled_in: bundle-ab9e0cb6
  +  chat_comment: comment-885fa90e
   ---
  ```

  Both rules select the same side. Incoming (`84331f4082b860d60dd073b5e1b0cba7410a5403`, 2026-08-23 13:14:24 -0700) is the later commit versus HEAD (`51ecc226d61f7aa9998c968c9e57fcbc46664b39`, 2026-08-23 13:13:45 -0700), and 2e's superset rule independently picks it. No field was invented, and no content present on the HEAD side was dropped — the resolution is HEAD's content plus the one new `chat_comment` field.

## Incoming changes preserved

- `.xgd/tickets/hot/request-d6bc0d26.md` — **preserved in full.** The incoming commit `84331f40` touches only this file, adding it whole (195 insertions). The staged index entry is blob `a8c35edc99e50603c10796a03ea686f7438e8773`, byte-identical to the incoming side's stage-3 blob, so every line the developer authored is present verbatim. The staged diff against HEAD is the single `+  chat_comment: comment-885fa90e` line shown above — i.e. the delta the incoming commit contributes over HEAD, and nothing is missing.

No code/implementation files were involved in this conflict, so no spot-check test run was warranted. No hunks were dropped; the BUG-1301 precedence exception was not invoked. `CHERRY_PICK_HEAD` was left intact for `cherry_pick_finalize_resolution`; the only git writes issued were `checkout --theirs` and `add --sparse` on this single path.
