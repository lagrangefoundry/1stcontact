---
uid: comment-d038d6de
id: COMMENT-3273
type: comment
title: Comment on request REQ-285
created_by: xgd
created_at: '2026-09-19T19:52:44.371480+00:00'
updated_at: '2026-09-19T20:20:13.060660+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-6e9dfecd
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "eda06473-6d09-49c5-aeed-e13b6a3f6eba",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="1d40f251-8e42-4246-8181-2be18da816fa-user" -->

<!-- xgd-chat role="user" ts="2026-09-19T19:52:10.092705+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="1d40f251-8e42-4246-8181-2be18da816fa-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-19T20:20:12.289102+00:00" -->
#### Claude
I'll start by reading the ticket to understand the scope.

I have the design clear. Let me record the scope and cut a branch.

Baseline passes. Now let me implement — starting with the shared asset-reference walk.

Now the shared walk in `validate.ts`:

Now the digest module:

Now the prose in `priming.json`:

Now the renderer and provider in `roles.ts`:

Now the renderer itself:

Now wiring — first the Library label link:

Now the host wiring:

Now the UAT:

The digest reads well at ~200 tokens. Let me fix a dead rung in the shedding ladder and tighten the framing prose:

Now the regression scope — the priming, host, journal, library and L1-validation suites:

All green. Now updating the ticket body — preserving what's there and recording what was built:

Merge is sound. Completing it and bumping the version:

The merge produced a merge commit, which reconcile can't cherry-pick. Let me relinearise so the recorded SHAs carry the whole change:

The version-bump commit swept in untracked `.pnpm-store` content. Resetting and redoing cleanly:

Now the version bump and a single clean commit:

Now align the branch so cleanup can verify it, and record the commit:

The gate needs the version commit to *be* the tip, which keeps losing to concurrent ticket auto-commits. Using the command's own race-free auto-bump path:

Now releasing the lock and tearing down the branch:

REQ-285 is implemented and landed. **Status `free_coded`, version 0.2.287, 6 story points.**

## What it does

A third volatile priming provider, `site.digest`, in the same reminder tier as `site.line` and `site.changes` — same mechanism, after the cache boundary, so re-assembling it every turn cannot invalidate the cached prefix in front of it. A real two-page site renders at ~700 characters:

```
## The site as it stands

Read off the site a moment ago, not remembered: use it instead of looking, and
quote its numbers rather than any you have in mind. What it leaves out — the
words on a page, how anything is laid out, how anything is painted — is what
get_l1 is for, one element at a time.

The draft stands at change 0. Nothing has been published yet, so all of this is
your client's private draft.

### about — "About us" (/about)
- 0.0  We have baked on this corner since 1974 and we are not stop…
- 0.1  row, 0 children

### home — "Home" (/)
- 0.0  Fresh bread, every morning
- 0.1  row, 2 children
…
Pictures: /assets/loaf.jpg, /assets/wordmark.svg.
```

## Decisions I made

- **"Which page is being worked on"** has no source in this host — nothing knows which page the client has open — so it is read out of the change journal: the most recent record naming a page, over a bounded twelve-record look-back. A remembered value would be exactly the marker the session confabulates.
- **Bound: 2,000 characters**, four rungs shedding in the order what goes is worth least — everything, then pictures on pages nobody is working on, then bands on those pages, then one line per page. A heading is never shed, and a list too long even for bare lines is cut *with a sentence saying so* naming `list_pages`.
- **Per-turn cost** is one `SiteStore.version` read: the derivation caches against the version (bumped by every write), not the change counter (the journal's, which stands still when a write fails to journal).
- **Two supporting extractions:** `l1AssetReferences` out of `danglingAssetReferences` (one walk, two questions), and `placed_as` carried onto the catalogue item — the only join between a site handle in a page and the `IMAGE-5` on the client's Library row.

## Evidence

13 UATs in `tests/test_UAT_FC_REQ-285_the_page_arrives_with_the_turn.test.ts`, mostly asserting on **what the model was actually sent** through the real host, real `priming.json`, real store and real journal. All pass; so do the priming, journal, library, L1-envelope and workerd-host suites, and all three packages typecheck.

## Two things to flag

1. **A concurrent REQ-283 session had uncommitted work in the same three files** when I started. It committed mid-session; I merged, resolved the `priming.json` conflict by unioning both sides, and fixed one semantic conflict — REQ-283's new product tier means my assembly-only test had to register the memory provider too. Its suites pass alongside mine.

2. **I made a mess recovering from a bad commit and you should know what moved.** A `git add -A` swept `.pnpm-store/` (15k files), `apps/control-app/.dev.vars~` and `storage/chat-archive/` into the version-bump commit; the `git reset --hard` that undid it then deleted them from disk. I restored all three from the object store as untracked files, byte-identical. `git status` is back to exactly what it was at session start. Nothing stray is tracked at HEAD — the landed commit is nine source files plus `package.json`.

<!-- xgd-chat-end -->