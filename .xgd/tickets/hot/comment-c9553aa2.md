---
uid: comment-c9553aa2
id: COMMENT-3139
type: comment
title: Comment on bug BUG-116
created_by: xgd
created_at: '2026-09-18T21:10:08.297488+00:00'
updated_at: '2026-09-18T21:12:15.446677+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-e8899581
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "b75c6dec-b6e2-481e-80e4-3c29302ae4e1",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="f62fee69-1ce0-4492-871c-63b35c8c3849-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T21:09:56.911483+00:00" -->
#### You
I think EPIC-19 did a data fix to solve this (see transcript). If that is the case and there is no code to fix, please can you add that information to the ticket and close a won't fix.

<!-- xgd-turn id="f62fee69-1ce0-4492-871c-63b35c8c3849-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-18T21:12:14.593082+00:00" -->
#### Claude
I'll read the ticket and its transcript first.

Status landed but the body append was rejected — terminal status freezes the body, and the same call applied status first. Reverting status, appending, then re-closing.

Confirmed and closed. **BUG-116 is now `wont_fix`.**

You were right — the fix was data, not code. The ticket already carried the full record of the repair applied under EPIC-19 (the "Local dev repair — DONE" section: what moved, what was deleted, what was archived to `storage/chat-archive/`, and how it was verified). I appended a **Resolution — won't fix** section that states the closing rationale explicitly:

- The key model is correct — `ids.ts` is the single opaque-key minter (REQ-190); sessions are keyed `site-site_<32hex>`, an immutable address.
- The code is correct — all four `sessionIdFor` call sites receive a site id.
- The symptom was migration residue: chat tickets keyed on the old name-slug addresses were never re-keyed. Nothing in the running code reproduces it, because the address it keys on no longer changes.

I also recorded what is being **dropped rather than solved**, so it doesn't read as oversight later:

- **§3 production** — never surveyed, and can't be from the sandbox. If prod holds pre-migration sites, it holds the same orphans and will show the same empty chat pane. Closing this says "no code fix", not "prod is clean."
- **§1** — the key-model assertion UAT wasn't written; `biz_uatwestheadme` remains the one non-opaque id, unexempted.
- **§4** — an orphaned session is still invisible rather than an error.

One mechanical note: setting the status and appending the body in a single call failed — terminal statuses freeze the body and the status applied first. I reverted to `draft`, appended, then re-closed; final state verified on disk.

EPIC-19's Children entry still describes BUG-116 as open work — that's the epic session's ticket to update, so I left it alone.

<!-- xgd-chat-end -->