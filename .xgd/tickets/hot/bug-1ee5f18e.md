---
uid: bug-1ee5f18e
id: BUG-159
type: bug
title: A delegate worker session cannot be copied, and the refusal advises a flag
  that cannot help
created_by: EPIC-16
created_at: '2026-09-27T01:10:39.233554+00:00'
updated_at: '2026-09-28T23:31:55.798356+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  epic_parent: epic-96d8aca6
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-758df7a2
  commits:
  - working_sha: 40f35f8d7c88178f84fc355d31d51e3e29b9382c
    reconcile_sha: null
    main_sha: null
  version: 0.2.401
---

`bin/copy-to-cloud --chats` cannot carry the Lagrange Foundry history. Nine
delegate worker sessions are refused as unaddressable, the refusal takes the
whole payload with it including the one real consultant conversation, and the
advice printed with it names a flag that cannot possibly help.

Observed 2026-09-26, against `http://127.0.0.1:8799` → `https://app.1stcontact.io`:

    INTERNAL: Copy of 'Lagrange Foundry's conversations was refused with 409:
    {"error":"9 conversation(s) carry a session id in no form this product mints,
    so there is nothing to re-address them onto. Nothing was written.",
    "sessions":["worker-builder-1-3bje6q", … ,"worker-builder-2-tql0pf"]}
    Pass --force to replace it anyway. Nothing was written.

The site copy in the same runbook succeeded. This is the second half of that
runbook and there is no way to complete it.

## 1. `addressOf` collapses two different situations into one refusal

`addressOf` (`apps/control-app/src/chat-copy.ts:218`) recognises exactly two
forms — `sessionIdFor(siteKey)` and `businessSessionIdFor(businessId)` — and
returns `null` for anything else. `reAddress` turns every `null` into a
`ChatAddressError` that refuses the payload whole.

But `null` is answering two questions at once, and they have opposite answers:

**It carries a source store's id that cannot be translated.** This is [[BUG-137]]
exactly — an id embedded in a derived key, drifting from the thing that derives
it, arriving addressed to nothing and reading as data loss months later. Refusing
is right, and must stay right.

**It carries no store id at all.** `worker-builder-2-qen037` embeds no site key,
no business id and nothing else that is true only in the store it came from. It
is `worker-<role>-<n>-<random>`, minted per delegation by the delegation
machinery rather than by either deriver. There is nothing in it to re-address,
and equally nothing in it that becomes false on arrival. Carried verbatim it
means in the destination precisely what it meant in the source.

The first case needs a refusal. The second needs to be carried unchanged. They
are currently the same code path.

## 2. What these sessions are, and why they are worth carrying

They are delegate sub-agent sessions, and the local store says so directly. The
consultant's own tool transcript records the `Delegate` call and names the worker
it spawned:

    session: site-site_936dd7c92e5e14df694dd9a80433aa4f   role: consultant
    tool: Delegate
      summary.items[0]: { backend: "claude_builder", role: "builder",
                          session: "worker-builder-2-qen037" }

So the consultant conversation re-addresses cleanly — it is the recognised
`site-` form — and the nine workers hanging off it do not. Dropping them at
export would make the copy succeed, and that is the wrong fix: [[REQ-294]] exists
because the site travelled to production and the reasoning that produced it did
not, and for a delegated build the builder's actual work is in the worker
sessions. Losing them silently is a smaller version of the same defect the ticket
was filed against.

## 3. One unaddressable conversation refuses all of them

`readChats` (`chat-copy.ts:439`) carries every `type=chat` ticket holding a
non-empty session id, and `reAddress` refuses the payload whole. So nine
sub-agent logs prevent one consultant conversation from moving. That granularity
is deliberate for [[BUG-137]]'s case — a partial import addressed to nothing is
the thing being prevented — and it should survive once (1) is fixed, because the
class of thing it refuses will then genuinely be unsafe.

## 4. `--force` is advised on a 409 it cannot answer

`writeChats` calls `reAddress` at `chat-copy.ts:549`, before anything else.
`payload.force` is not consulted until `:573`, inside the per-conversation loop
that the throw never reaches. No value of `--force` changes this outcome.

The advice comes from `push.ts:434`, which attaches it to any 409:

    const conflicted = res.status === 409
    … conflicted ? 'Pass --force to replace it anyway. Nothing was written.' : …

That is correct for the site route, and its comment says why: *"409 IS NOT AN
ERROR TO DIAGNOSE, it is a question to answer (BUG-51). The far side has already
said what it is protecting and how much of it there is; all this side owes is the
flag that says yes."* The chats route reuses 409 for `ChatAddressError`, which is
not that question. The operator is told to answer yes to a question nobody asked,
and the one they did ask goes unanswered.

Note the shape of the fix rather than the symptom: the far side already
distinguishes the two — `ChatAddressError` is a named class carrying a `sessions`
list precisely *"so a caller need not parse prose"* — and this side flattens them
back into a status code. The refusals should be told apart by what the far side
said they are, not by re-deciding from the status.

## Expected

- A session id carrying no source-store address is carried verbatim: same id,
  same conversation, matched on the far side by that id like any other.
- A session id carrying a source-store address that cannot be re-derived onto
  this destination is still refused, still before anything is written, still
  naming the ids.
- The nine worker sessions and the one consultant conversation all land, and a
  re-run duplicates no turn.
- A refusal that `--force` cannot answer does not advise `--force`.

## Boundary

The whole-payload granularity of the refusal stays. Per-conversation partial
imports are a different decision with a different failure mode and are not in
scope here; fixing (1) removes the case that made the granularity hurt.

---

## What was changed

### 1. `addressOf` answers three ways instead of two

`ChatAddress` gains a `subject: 'none'` member and `addressOf` returns it for a
session id neither deriver minted. `null` survives, narrowed to the one form that
is genuinely unaddressable: an id that CLAIMS one of the two addresses and then
names neither — `sessionIdFor('')` / `businessSessionIdFor('')`, a prefix with
nothing after it. Absence of an address is not the same statement as an address
pointing nowhere.

`reAddress` puts a `'none'` session in the landing map **under its own id**. It
takes no part in the two ambiguity checks, because it names no source site and no
source business to be ambiguous about. It is still in the map rather than skipped,
because the map is also what says which conversations `writeChats` may write.

The refusal's sentence changes with its meaning, from *"in no form this product
mints"* to *"says it is about a site or a business and then names neither"*.

### 2. What travels verbatim with it, and what does not

A `'none'` landing carries `backend: null`, and `null` means *leave it alone* —
not *clear it*. A delegate worker's backend is registered as `<configured
backend>#<worker session id>`, which embeds the one id that travels unchanged and
nothing local to a store, so re-deriving it from the destination's site key would
replace a true name with a name for a different conversation. Both places that
re-derived it — `fields.backend` in `writeChats` and `backend` in the session
file's header — are now conditional on the landing having a name to give.

Everything else about the header is unchanged and stays the destination's:
`chat_ticket_uid` is re-homed on the row minted here, and `backend_ref` is
cleared, because those are statements about where the record lives rather than
about what produced it. The turns beneath the header, the engagement ledger and
`tool_transcript` cross byte for byte, as they already did.

### 3. The advice is the far side's statement, not this side's guess

`postPayload` advises `--force` on a 409 **only where the far side declared that
the flag is the answer**. `/api/import` already names `force` in the body of
exactly that 409 — *"so a caller that is not a person can tell 'refused, and here
is the way to mean it' from 'refused' without parsing a sentence"* — and this is
that caller. Read off that key rather than re-decided from the status. A body this
side cannot parse is a no: a refusal nobody said the flag answers gets the far
side's own sentence and nothing added to it.

This also stops the advice appearing on `/api/import`'s *"holds N sites"* 409,
which `--force` could never answer either.

### 4. Granularity unchanged

The whole-payload refusal stays exactly as it was, per the Boundary above. What
changed is which conversations are in the refused class.

## Technical consequences, recorded here rather than left to be discovered

**[[BUG-137]]'s "any id in no recognised form is refused" is superseded.** Its UAT
proved the claim with a hand-written `sess-…`, which this ticket deliberately now
carries. The test is re-pointed at the form that must still be refused (a prefix
naming nothing) and renamed to say so:
`test_UAT_FC_BUG-137_a_session_id_addressed_to_a_site_it_does_not_name_is_refused`.
The rest of BUG-137 stands untouched and is asserted alongside the new behaviour.

**`[[REQ-289]]`'s 409 fixture was not faithful to the route** and is corrected:
its fake body now carries the `force` member `/api/import` really sends, because
that is what the advice is now read off.

**The runbooks' `--help` is derived from their header rather than a line range.**
Describing this change in `bin/copy-to-cloud`'s header silently truncated its own
`--help`: the text was emitted by `sed -n '2,132p'`, a count that was exact until
it was not, and what fell off the end was the `--print-token` trap that stops an
operator setting the CLOUD credential for the LOCAL end ([[BUG-134]]) — exit code
0 throughout. Both scripts now print every leading comment line and stop at the
first that is not one, which is a fact about the file instead of a number to keep
in step with it. `bin/copy-from-cloud` is changed with it because it is a matched
pair everywhere else and carried the same number in the same place.

**The two chat-copy suites now share their fixtures.** Seeding a conversation the
way the library seeds one, the empty row the deployed builder auto-creates, and
the two route calls moved to `tests/support/chat-history.ts`. They are setup
rather than claim, and there are now two suites making claims about this pair of
routes.

## Test plan

New:

- `tests/test_UAT_FC_BUG-159_delegate_worker_sessions_cross.workers.test.ts` — in
  workerd over real D1, through `route()`:
  - a delegated build's consultant conversation and its two worker sessions all
    land; the workers under the ids they already had, with their backend name,
    ledger, transcript turns and tool record intact, `chat_ticket_uid` re-homed
    and `backend_ref` cleared; the consultant conversation still re-addressed onto
    the destination's own site key;
  - a second copy of the same payload creates nothing, replaces nothing, keeps all
    three and adds no comment — which is what makes carrying an id verbatim safe;
  - one unaddressable conversation still refuses the whole payload, names only
    itself, and leaves the destination holding nothing.
- `tests/test_UAT_FC_BUG-159_force_advice_follows_the_far_side.test.ts` — through
  `copyChats` / `copySite` with only the transport injected: the observed 409 does
  not mention `--force` while still carrying the far side's sentence and ids;
  BUG-51's 409 still does; `/api/import`'s *"holds 2 sites"* 409 no longer does.
- `tests/test_UAT_FC_BUG-159_runbook_help_is_derived_from_its_header.test.ts` —
  each runbook's `--help` against a copy of itself with one extra header line,
  which is the edit that broke it; asserted pre-fix to fail.

Regression scope run green: the BUG-137, REQ-294 (both halves), REQ-309, REQ-289,
BUG-134, BUG-36, BUG-84, REQ-247 and REQ-290 suites, plus `tsc` on both projects.
(`test_UAT_FC_BUG-134_the_command_reads_the_local_pair_from_its_own_variables` and
three REQ-115 cases fail identically at the branch point in a fresh worktree and
are unrelated to this change.)