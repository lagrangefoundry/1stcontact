---
uid: comment-7c069f46
id: COMMENT-1063
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-16T04:27:51.098611+00:00'
updated_at: '2026-08-16T04:27:51.098611+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-10937fa3
  kind: note
---

**PASS** — REPORT-2064 (`report-10937fa3`), 0 violations · 1 warning · 0 needs_review.

**Ledger.** CAP-91 and its sole story both point at `bundle-e59210c5` with no `updated_by` chain, so I walked the bundle's eight member requests plus everything created after it (REQ-131 → REQ-148). Two intents carry a pane-observable ask: **REQ-122** (replaced REQ-115's `builder-chat-placeholder` with the live pane and set its whole behavioural surface) and **REQ-127** (withdrew the pane's site identity — it now receives an already-open session, and the async guard moved to `app.js`). Both `free_and_reconciled` at `0198704b`. REQ-131 is imminent but puts "surfacing the journal in the builder UI" under its own out-of-scope heading; REQ-123/126/129/130 are host- and control-surface-side.

**The one open item (warning, `ac-add`).** REQ-122 says the panel "streams assistant turns, **renders markdown**, and shows tool activity". Streaming is AC-1065 and tool activity is AC-1066; markdown rendering is expressed nowhere as behaviour — only as a Technical Context note saying no criterion asserts it. No intent retired the clause, and the behaviour is wired (`loadMarked()`/`loadSanitizer()` at `apps/control-app/src/builder/chat.js:57`, `webui-markdown` in `WEBUI_PACKAGES` at `tools/generate/src/cli/webui.ts:120`). I held it at warning rather than violation because the omission is declared in the matrix with an accurate rationale, and REQ-122's own panel evidence list doesn't name markdown either — but the rationale is evidence difficulty, not withdrawal, so it belongs on the record.

**Verified rather than assumed:** the story's claim that CAP-85's AC-973 was re-pointed off the placeholder is true (its body now reads "it held when the secondary pane was a placeholder and it holds now that the pane hosts a live assistant"); AC-1064 does cover switch-replay; REQ-127's draft-key migration is correctly excluded as a one-time consequence; and REQ-122's third failure mode (mid-turn model failure) sits on CAP-90/STORY-103 exactly as REQ-122's own evidence partition puts it. Sole story in the capability, so exclusivity is trivial — I checked the neighbours sharing these intents and the reciprocal out-of-scope clauses hold both ways.

One item flagged forward: the story's own evidence note — tool activity is currently proven at the host's stream rather than in the pane — is live work against AC-1066 at the **uat** level, not story level. It's in the report's editor notes so that cycle doesn't rediscover it.
