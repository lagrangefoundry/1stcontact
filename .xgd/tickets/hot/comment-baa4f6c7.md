---
uid: comment-baa4f6c7
id: COMMENT-3785
type: comment
title: Comment on bug BUG-140
created_by: xgd
created_at: '2026-09-25T01:40:24.661335+00:00'
updated_at: '2026-09-25T02:32:19.168153+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-e269a50b
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "a36abb89-cd79-4c6c-99f5-fcfe9b66c70e",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="faecdd40-37eb-410c-a2ab-a76d607b6f3c-user" -->

<!-- xgd-chat role="user" ts="2026-09-25T01:38:49.947662+00:00" -->
#### You
Please investigate the root cause or the implementation of this ticket. Report your findings here so that we can discuss them. Do not make any code changes until we are aligned.

<!-- xgd-turn id="faecdd40-37eb-410c-a2ab-a76d607b6f3c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-25T01:46:55.456704+00:00" -->
#### Claude
Investigated. No code changes made. Findings below.

## Both halves of the ticket reproduce today, unchanged

All five class tickets are still at `ready_to_reconcile` (verified just now, ~2 days after filing), so `xgd ticket append` still refuses all five. And `add-comment` still has no `--created-by`: `xgd_source/cli/ticket_commands.py:4634-4676` defines `--kind/--payload/--fields/--body/--body-file/--json/--project` and nothing else, while `create` got one at `:4184` (BUG-1332). `comment_create` (`xgd_source/core/ticketing/__init__.py:4746`) takes only `(subject_uid, kind, payload)` and funnels anything unrecognised into `fields.payload` — which is exactly why the round's `--fields '{"created_by":…}'` landed at `fields.payload.created_by` and the frontmatter said `xgd`.

## The root cause is a permanence mismatch, not a race

`gap-tickets.json` is a **permanent** registry: `readGaps` (`tools/repro-console/src/gaps.ts`) returns every entry ever recorded, and `ai.ts:560-564` renders all of them unconditionally as "append to that ticket … do not file a second one." Nothing retires an entry, and nothing consults the ticket's current status.

The body it points at is **not** permanently writable. The freeze covers `ready_to_reconcile, bundled, reconciling, free_and_reconciled` — i.e. a class ticket is appendable only during the `draft`/`free_coding`/`free_coded` window and, once it enters the pipeline, is unappendable **forever**, including after it's successfully reconciled. So "all five are frozen" isn't bad luck; it's the steady state every class ticket converges to. The registry currently holds 6 entries and will keep growing this way.

There's a second consequence the ticket doesn't name: a class whose ticket is already `free_and_reconciled` (fixed) still instructs the round not to file. A recurrence of a supposedly-fixed class — the most interesting signal the loop can produce — has nowhere to go.

## New finding: even a *successful* append is reported as a violation

This is the part I think changes the fix. `confirm()` (`console.ts:1286`) runs the identical read-back for `filed` and `appended`, against a ticket that in the append case was filed by an *earlier* round and has since moved on:

- **`:1309`** — `gap.status !== 'draft'` → `wrongStatus`. Fires on **all five**, with the misleading rider "a ready_\* status is a dispatcher trigger and will spawn an automated pipeline against it." The round didn't put it there and cannot move it back.
- **`wrongProvenance` (`:1874`)** — fires on **REQ-265**, whose `created_by` is `martin-github@westhead.me` (operator-filed, predating the marker).
- **`wrongDefectClass` (`:1909`)** — fires on **REQ-265, REQ-269, REQ-270, REQ-271**; only REQ-302 carries `defect_class`.

So appending to REQ-265 would produce three false violations; to 269/270/271, two each; to 302, one. Note `filedByRound` was *deliberately* loosened for the append case — its docstring says so explicitly ("An APPENDED ticket was filed by some EARLIER round, so its run qualifier is legitimately a different one") — but the status and class checks never got the same treatment. That asymmetry is the same shape as BUG-114, and `tests/test_UAT_FC_BUG-114_two_checks_that_cry_wolf.test.ts` is the precedent.

Consequence: option 1 in the ticket ("say so in the brief") is **not sufficient on its own**. It makes `"status": "appended"` mechanically achievable, and the console then immediately reports it as a misbehaving round.

## What lives where

- **Fixable here (1stcontact)** — the brief/prompt wording, and the `confirm()` check asymmetry. Both are `tools/repro-console/`.
- **Not fixable here (xgd repo)** — `add-comment --created-by` (ticket's option 2) and an unfrozen append section (option 3). Per the cross-repo rule those are a ticket filed in `/Users/martin/lagrangefoundry/xgd`, not code I write.

## What I'd propose (for discussion, not yet implemented)

1. **Name the comment as the append route** in brief §6/§7 and in the `ai.ts` "Classes that already have a ticket" block: `xgd ticket add-comment <id> --kind note --body-file <f>`, and state that a ticket at `ready_to_reconcile` or beyond cannot take a body append. Also say the round must put its `repro-console:<slug>#<n>` marker in the comment's first line, because the flag doesn't exist.
2. **Make `confirm()` status-, provenance- and class-check only the tickets the round actually created** — the gap ticket when `filed`, and `bugTickets` always — and for `appended`, verify the thing the round *is* responsible for instead: that the named ticket exists and that a comment carrying this round's marker now hangs off it.
3. **Show each class ticket's live status in the prompt**, and route on it: appendable → append to the body; frozen → comment; already `free_and_reconciled` → this class was fixed, a recurrence is a **new** ticket citing the old one, not an append.
4. **File an xgd-repo ticket** for `add-comment --created-by` writing to the comment's own frontmatter.

Which of these do you want in scope for BUG-140? My inclination is 1+2+3 here and 4 as a separate xgd ticket — 2 is what makes 1 actually work, and 3 is a few lines once the prompt is being rebuilt anyway.

<!-- xgd-turn id="b16e4f6e-fcc9-4c9e-9be9-9ce39bc40d52-user" -->

<!-- xgd-chat role="user" ts="2026-09-25T02:03:16.806901+00:00" -->
#### You
PLease proceed

<!-- xgd-turn id="b16e4f6e-fcc9-4c9e-9be9-9ce39bc40d52-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-25T02:32:17.840110+00:00" -->
#### Claude
I'll start by checking the status vocabulary I need to route on, then scope the ticket.

Status vocabulary confirmed. Now scoping the ticket body.

Scoped. Now cutting the branch.

Now the implementation. First, the new routing module:

Now the gaps registry succession:

Now the prompt side in `ai.ts`:

Now the prompt's "Classes that already have a ticket" heading text:

Now the brief — §6 and §7:

Now `console.ts` — the routing, the read-back split, and the evidence check:

Now the `confirm()` split:

Now the UATs. Let me check the console's slug derivation and page render first:

Now the UAT file:

The comments list is a bare JSON array and `parseJsonOutput` only slices objects. Adding an array-aware sibling:

19/19 pass. Let me fix one test whose name no longer matches what it asserts — the unreadable-comments path isn't actually being exercised:

21/21. Now checking I haven't broken the neighbouring console suites:

All green. But REQ-256's `appended` test now silently exercises the unverified path — its fake doesn't answer `ticket comments`. Let me check and fix that:

Confirmed violation-free. Removing the probe:

Now the wider suite, to catch anything else touching these modules:

All 17 suites green now — the three failures were a missing gitignored `apps/control-app/src/generated/` in the fresh worktree, not my change. Full suite sweep:

Identical baseline except two. Checking those:

All 15 remaining failures are identical in the main checkout — pre-existing and unrelated. Committing explicitly (no `-A`):

Now filing the sibling-repo ticket for the `xgd` CLI half, then closing out BUG-140:

BUG-1448 filed in the `xgd` repo. Now closing out BUG-140:

Done. BUG-140 is `free_coded` at version 0.2.353, merged into `xgd-working`, worktree cleaned.

## What I built

**Root cause, as reported:** a permanence mismatch. `gap-tickets.json` is permanent; the body it points at is writable only at `draft`/`free_coding`/`free_coded`/`failed`. Every class ticket converges on refusing the append the prompt unconditionally demanded.

Four behaviours, all four in:

1. **The brief names the comment as the append route** — §6 gains "Appending to a class that already has a ticket", §7's `appended` example matches. It states the freeze, gives the `add-comment` command, and requires the `repro-console:<slug>#<n>` marker in the comment's first line (with the reason: `add-comment` has no `--created-by`).

2. **The prompt routes per class on the live status.** `routeGaps()` reads every registry ticket back before the prompt is built; each class line carries `now at \`<status>\`` and one of three instructions — body append / comment / new ticket for a settled class. Unreadable routes to the comment, the one route nothing refuses.

3. **`confirm()` charges the round for what it owns.** A `filed` round is checked exactly as before. An `appended` round's named ticket is read for existence only — its status, `created_by` and `defect_class` belong to the earlier round. In their place, `appendEvidence()` looks for a comment on that ticket carrying *this* round's marker, so `"appended"` stops being an unverified claim. `bugTickets` stay fully checked on both paths.

4. **A re-file against a settled class is not a duplicate**, and the registry succeeds to the new id keeping the old one in `priorTicketIds`.

One thing I found while wiring it: `parseJsonOutput` can't read `xgd ticket comments --json`, which prints a bare array — it would have sliced braces off the first and last element and parsed neither. Added `parseJsonArrayOutput` alongside rather than widening the object parser.

**Tests:** 24 UATs in `tests/test_UAT_FC_BUG-140_the_append_route.test.ts`, driving the real console; each makes both directions of its claim (the three checks are asserted as *still firing* on a `filed` round's own ticket and on `bugTickets`, and two live tickets for one class is still reported). I also added a `ticket comments` branch to REQ-256's stand-in `xgd` — without it, its appended round silently exercised the unverified path.

**Full suite:** 15 failures, identical set in the main checkout — sockets, Cloudflare tokens, vocabulary scans, reconciliation ACs. Pre-existing and unrelated. Three further failures were fresh-worktree artifacts (missing gitignored `apps/control-app/src/generated/` and `.xgd/tmp/`); I confirmed each by supplying the artifact and watching them pass.

**Sibling repo:** filed **BUG-1448** in `xgd` for `add-comment --created-by` written to the comment's own frontmatter. Nothing here depends on it landing.

<!-- xgd-chat-end -->