---
uid: comment-66e3595b
id: COMMENT-5465
type: comment
title: Comment on bug BUG-212
created_by: xgd
created_at: '2026-10-17T22:50:44.485709+00:00'
updated_at: '2026-10-17T22:56:07.297527+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-f1eea393
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "5a5dc275-2607-4104-85fd-e5dc9b921bb8",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="a36c5bea-39f2-4d8f-bdd9-c28571be0e06-user" -->

<!-- xgd-chat role="user" ts="2026-10-17T22:49:07.176930+00:00" -->
#### You
Please investigate the root cause or the implementation of this ticket. Report your findings here so that we can discuss them. Do not make any code changes until we are aligned.

<!-- xgd-turn id="a36c5bea-39f2-4d8f-bdd9-c28571be0e06-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-17T22:56:02.615040+00:00" -->
#### Claude
I'm tracing where `ReportResult` is validated and where an aborted worker's report gets put together. So far that's the upstream `delegation_toolbox.js` and `account-core.ts` in this repo.

The upstream picture is clear. One more check: what JSON schema the model actually receives for `failed`.

I've traced the incident end to end; nothing has been changed. There are two separate failures, and the first is the one that actually lost the report.

## 1. The report was refused because the worker was never told the shape of `failed` (upstream, lagrange-framework)

- **What the model sees.** `failed` is declared as a `failure_list`, which is an array of objects (`delegation_surface.json:35`). The tool schema built for it (`toolbox/params.js:298`) is just `items: {type: "object"}`. It lists no `check` or `reason` properties, because the declaration has no way to give array entries their own keys. The upstream code admits this in a comment at `delegation_toolbox.js:1196`. The only hint is a description saying "each naming the check and the reason", so the worker guessed and sent plain strings.
- **What the refusal says.** The error, `ReportResult parameter 'failed' entry 0 must be an object, got str` (`params.js:151`), says the entry must be an object but never names the keys it needs. A retry would have been another guess.
- **What gets lost.** The parameter check refuses the whole call. So one bad `failed` entry threw away the summary, the `changed` list and every `passed` verdict along with it.
- **Why the budget then cut it off.** The ReportResult call itself took the worker over its context ceiling. The guard stops a turn right after a tool call once it crosses the ceiling (`budget-core.ts` `guardTurn`), so no retry request was ever built.
- **A correct call would have survived.** `report()` stores the result before the guard fires, and an aborted run that already reported keeps `outcome: reported` (`delegation_toolbox.js:650`). So with a schema the worker could get right first time, this run would have come back with a full report and `ended: context_budget`.

**Fix:** let array parameters declare keys for their entries and send them to the model as `items.properties`, the way BUG-20 already does for object parameters. Declare `check` and `reason` on `failure_list`, and have the refusal name those keys. A plain string in `failed` could also be accepted as `{check: <string>, reason: ""}`; it still matches against the requested checks by their normalised text. This needs both the JS and Python implementations plus the conformance fixtures, so it's a lagrange-framework ticket, not code from here.

## 2. An aborted worker comes back with an empty `summary` (this repo, partly already covered)

After BUG-191 and BUG-208, the result already includes `account` (what was written), `wrote`, `activity` (79 operations and the last call, i.e. the refused report) and `ended: {status: aborted, reason: context_budget, occupancy_tokens, ceiling}`. So the ticket's "partial report from the account" is mostly there. What's missing is that `summary` is still `""`. The upstream code marks the run silent and skips the second ask (`_nudgeSkip`, because the turn status isn't `complete`), and nothing fills the summary in.

**Fix (in this repo):** in `reportingDelegationToolbox` (`account-core.ts:1228`), when the outcome isn't `reported` and the summary is empty, write a short host-authored summary from `ended`, `activity` and `account`. For example: "Stopped by the host at 152,499 of 151,200 tokens after 79 operations; wrote N changes (see account); its report call was refused: <error>." It should be clearly marked as the host's account. This is small and fits the BUG-208 pattern.

## 3. Not recommended for this ticket: a reserved report budget

The ticket also asks for the worker to keep budget in reserve for its report. That would need the host to warn the worker shortly before the ceiling. Today the guard is a hard stop, and the proxy only sees streamed events, so it can't add a warning to the worker's context. That would be a new mechanism. Given point 1 above, I'd defer it. The oversized brief (about 10 sections, a component, 6 crops and 7 checks) is still the underlying cause, and EPIC-24's per-section scopes already push toward smaller briefs.

## Proposed split
- **This ticket (BUG-212):** fix 2, the host-written summary, with a UAT for an aborted worker over the context ceiling.
- **New lagrange-framework ticket:** fix 1, the item keys, the clearer refusal and possibly the string fallback. Per our cross-repo rule I'd only file the ticket there. Until it lands, I could also spell out the exact `failed` shape in the declaration text this repo already rewrites, as a stopgap.

Do you want this split, and should I file the lagrange-framework ticket?

<!-- xgd-chat-end -->