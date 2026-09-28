---
uid: bug-1ee5f18e
id: BUG-159
type: bug
title: A delegate worker session cannot be copied, and the refusal advises a flag
  that cannot help
created_by: EPIC-16
created_at: '2026-09-27T01:10:39.233554+00:00'
updated_at: '2026-09-27T01:10:39.233554+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  epic_parent: epic-96d8aca6
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-758df7a2
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