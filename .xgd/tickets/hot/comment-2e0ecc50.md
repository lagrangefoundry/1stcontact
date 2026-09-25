---
uid: comment-2e0ecc50
id: COMMENT-3763
type: comment
title: Comment on request REQ-310
created_by: xgd
created_at: '2026-09-25T00:36:08.891458+00:00'
updated_at: '2026-09-25T01:06:16.271143+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-da196c6d
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "6eb7c246-3ca1-484d-9e13-e4a3f517aaa5",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="a4b56664-884a-4def-ad30-705eea81a50b-user" -->

<!-- xgd-chat role="user" ts="2026-09-25T00:35:22.149175+00:00" -->
#### You
Please investigate the root cause or the implementation of this ticket. Report your findings here so that we can discuss them. Do not make any code changes until we are aligned.

<!-- xgd-turn id="a4b56664-884a-4def-ad30-705eea81a50b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-25T00:42:08.539742+00:00" -->
#### Claude
I've read the whole path. Findings below — no changes made.

## What's actually there

Two producers write into `kb/system/`:

- **`exportCorpus()`** (`tools/generate/src/cli/kb.ts:353`) — doc tickets → `kb/system/<ID>.md`. Single-source, correct model.
- **`writeProjections()`** (`kb.ts:432`) — `projections()` from `kb-projection.ts:986` → three ticketless files `REF-behaviors`, `REF-l1`, `REF-surface`, each rendered by `projectedDocument()` (`kb.ts:522`) and swept over its own `REF-` namespace (`isProjected`, `kb-projection.ts:89`).

Both run on `1c kb export` and `1c kb build` (`index.ts:1493`, `:1521`), projections first.

**The precedent for the fix already exists and already landed.** REQ-311's `1c fonts doc` (`font-doc.ts`) is exactly this move, done once: DOC-56's body is projected from `fonts/catalogue.json` and written **into the ticket** via `xgd ticket update <uid> --body-file -`, then carried to the corpus by the ordinary export. It contributes three reusable pieces:

- `resolveFontDocTicket()` — find the target by **what it declares** (`fields.source === 'fonts/catalogue.json'`), refuse on zero or >1 match, never a hard-coded uid.
- `writeTicketBody()` — the ticketing CLI, never the `.md` file.
- `sameBody()` — compare with trailing whitespace normalised, because *the ticket store strips it on write*; a byte comparison would rewrite the body on every run.

So the code change is small and mostly deletion. What needs deciding is not the mechanism.

## What the move deletes

`writeProjections()`, `projectedDocument()`, `corpusMembership()` (it exists *only* so a ticketless projection can assert KB membership from the declaration — a ticket carries `doc_kind` itself), `isProjected`/`PROJECTED_PREFIX`, the sweep exception at `kb.ts:388-393`, `KbStatus.projected` and the `exported = s.corpus - s.projected` arithmetic in `1c kb status` (`index.ts:1540-1560`), the `projected: …` report line at `index.ts:1497`, and the `REF-*` mention in the help text at `index.ts:435`. `corpusDocument()` already carries `fields` through, so `projected: true` and `source` reach the corpus frontmatter for free.

## Five things to settle before coding

**1. The tickets have to exist first, and the documents change identity.** Per the REQ-311 precedent the ticket is hand-authored and the generator only writes its body — so three new `doc` tickets (`doc_kind: system_kb`, `projected: true`, `source: …`). Consequence: the filename *is* the identity, so `REF-l1.md` becomes `DOC-5x.md` — a one-time re-embed of those three documents and new chunk ids. Nothing depends on the `REF-` names outside two code comments (I grepped; all other hits are historical ticket prose), so this is a cost, not a hazard.

**2. `ProjectedDoc.source` currently conflates two things and can't be the resolver key as-is.** `REF-surface` declares `source: "the declared control surface (version 7)"` — prose for the reader, **carrying the version number**. If the resolver matches on `fields.source` like font-doc does, a surface-version bump silently orphans the ticket. Needs splitting: a stable key (`ai/l1-surface.json`) for resolution, the prose for the body.

**3. Title ownership.** `REF-surface`'s title is *derived* from `l1-surface.json`'s own title. Once a ticket owns the title, that derivation stops propagating unless the generator also writes `--title`. `REF-l1`/`REF-behaviors` have fixed titles and don't care.

**4. The trigger — this is the real decision.** Today the sink is a build artifact, so regenerating on every build is free. Once the sink is a ticket, regenerating on every `1c kb export` means **`bin/kb-release` commits to the ticket store**, and a new clock appears: code → ticket body (the existing `1c assets` skew check only covers corpus → index). Two options:

- *Regenerate on export.* One clock, as now; but a build mutates tracked ticket state.
- *Explicit verb* (`1c kb project`, matching `1c fonts doc`) **plus** a drift check — cheap and credential-free, just render `projections()` and compare against the ticket bodies — surfaced in `1c kb status` and refused by `1c assets`.

I'd take the second. It is the rule `bin/kb-release` already argues for itself: *producing a stale tree is legitimate, shipping one never is.* It also gives DOC-56 the drift protection it currently lacks — nothing today notices if `fonts/catalogue.json` moves and `1c fonts doc` isn't run.

**5. Whether DOC-56 joins the same mechanism.** Minimum: share `resolveProjectedDoc`/`writeTicketBody`/`sameBody` rather than a second copy. Fuller option: one registry of `source key → body generator` with four members, one verb regenerating all, one drift gate — `1c fonts doc` becoming a named shortcut. That's more churn than the ticket asks for, so your call.

## Two smaller notes

- **Nothing mechanically prevents a hand edit of a projected body.** `fields.projected` is read by no code at all (I checked) — it's frontmatter documentation. The only real protections are the regeneration overwriting the edit and a drift check announcing it, which is another argument for #4's second option.
- **DOC-56 carries `fields.projected: false` today** while being projected by `1c fonts doc`. Looks like an authoring slip; ticket-store-only fix, no code.

**Test impact:** `tests/test_UAT_FC_REQ-165_projected_reference.test.ts` splits cleanly — the first `describe` (~190 lines, the corpus-file sink and the two-namespace sweep) gets rewritten against a stubbed ticket store; the second (~120 lines, whether each projection actually says what its source says) is sink-agnostic and survives untouched. `test_UAT_FC_BUG-48_*` only exercises `l1VocabularyGaps` and is unaffected.

<!-- xgd-turn id="1b68e1d7-9cbb-4f56-b41a-aeb6e11e4c67-user" -->

<!-- xgd-chat role="user" ts="2026-09-25T00:46:35.753848+00:00" -->
#### You
1 - just create the doc tickets please
Once the sink is a ticket, regenerating on every `1c kb export` means `bin/kb-release`** commits to the ticket store**, and a new clock appears: code → ticket body (the existing `1c assets` skew check only covers corpus → index). <-- confused we are talking about the sources being tickets not the sinks. What do you mean?

<!-- xgd-turn id="1b68e1d7-9cbb-4f56-b41a-aeb6e11e4c67-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-25T00:48:40.525986+00:00" -->
#### Claude
Two things: answering the "sink" question, then creating the tickets.

## On "sink"

I was using the ticket's own word, and it's the confusing one. Both statements are true because it's a two-stage pipeline:

```
code  ──generator──▶  ???  ──export──▶  kb/system/*.md  ──build──▶  index
```

The **source** of a projection is always code (`CATALOG`, the Zod schemas, `l1-surface.json`) — that doesn't change. What changes is where the generator *puts its output*: today straight into `kb/system/REF-l1.md`, in future into the ticket body. So the generator's destination becomes the export's source — the ticket sits in the middle, and it's a sink for one stage and a source for the next. "Regenerating on every export" means `1c kb export` would run the generator, i.e. write ticket bodies.

The consequence I was flagging: `xgd ticket update` **auto-commits** (the last five commits on this branch are `xgd(ticket): update …`). So if the generator runs inside `1c kb export`, then `bin/kb-release` — a build command — produces git commits in `.xgd/tickets/`. Today it produces only gitignored artifacts under `kb/system/`. That's the argument for a separate `1c kb project` verb plus a drift check, rather than folding the generator into export.

Let me get the source paths right before filing.

Sources confirmed. Seeding each ticket with the current projection output, so the tickets are truthful the moment they exist (and the first generator run has a real body to diff against).

Three tickets created:

| id | uid | `fields.source` (resolver key) |
|---|---|---|
| **DOC-57** The components a site can use | `doc-0ee16fbf` | `packages/framework/src/modules/catalog.ts` |
| **DOC-58** The vocabulary a page is written in | `doc-6db9a7ba` | `packages/site-schema/src/l1/schema.ts` |
| **DOC-59** The site you look after — what can be changed, and how | `doc-4692b21d` | `tools/generate/src/cli/ai/l1-surface.json` |

Each carries `doc_kind: system_kb`, `projected: true`, and the current projection body verbatim (6.3 KB / 27.7 KB / 60.4 KB).

Three notes on what I chose:

- **The source keys are repo-relative paths**, mirroring DOC-56's `fonts/catalogue.json`, and deliberately *not* the prose each projection currently declares — `REF-surface` says "the declared control surface (version 14)", which would orphan the ticket on the next surface bump. The key is an identity, not a dependency list: DOC-58's projection actually reads `l1/schema.ts`, `l1/validate.ts` and the `@1stcontact/site-schema` exports, and the one path names it rather than enumerating them.
- **DOC-59's title is the derived one** (`l1-surface.json`'s `title` + " — what can be changed, and how"). That's decision 3 still open — the ticket now owns a title the code currently computes.
- **Don't run `1c kb build` or `bin/kb-release` until the code lands.** With these tickets existing and `writeProjections()` still writing files, an export produces six documents where three belong — DOC-57/58/59 beside their `REF-*` twins, near-identical text competing in retrieval. Harmless as long as nothing rebuilds in between.

DOC-56's `projected: false` I left alone — separate from what you asked for, still worth a one-field fix whenever.

<!-- xgd-turn id="836a5831-ff47-4bf6-971d-78da8282f780-user" -->

<!-- xgd-chat role="user" ts="2026-09-25T01:01:51.958115+00:00" -->
#### You
This ticket was create to ensure that the source documents for the system kb are exclusively kind: system_kb DOC tickets. I'm not sure about the other files you are refering to - can we just start with that requirement first please

<!-- xgd-turn id="836a5831-ff47-4bf6-971d-78da8282f780-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-25T01:02:34.360038+00:00" -->
#### Claude
Understood — narrowing to exactly that.

## The requirement, and the one thing violating it

**Every document in the system KB comes from a `doc` ticket of kind `system_kb`. No exceptions.**

Today there is exactly one exception: `writeProjections()` writes three files into `kb/system/` with no ticket behind them. That's the whole defect. DOC-57/58/59 now exist, so the fix is to point the generator at them.

To clear up what I confused things with: the files I kept naming (`kb/system/*.md`) are not sources — that directory is gitignored build output, regenerated by `1c kb export` from the ticket store. I wasn't proposing anything else become ticket-backed. Setting aside everything else I raised.

## The change

1. The generator writes the three **ticket bodies** (`xgd ticket update <uid> --body-file -`, the same call `1c fonts doc` already makes for DOC-56) instead of writing corpus files, resolving each ticket by its `fields.source`.
2. `exportCorpus()` becomes the only writer into `kb/system/`. Its sweep exception for the `REF-` namespace goes away — which means the sweep deletes the stale `REF-*.md` files on the first export, no migration step needed.
3. Deletions that follow: `writeProjections()`, `projectedDocument()`, `corpusMembership()` (it exists only so a ticketless file could assert KB membership — a ticket carries `doc_kind` itself), `isProjected()`/`PROJECTED_PREFIX`, and the `projected` count in `1c kb status`, which goes back to the honest comparison "corpus documents == member tickets".

## The one thing that follows necessarily

The generator still has to run somewhere. My default: **leave the call exactly where it is** — first inside `1c kb export` and `1c kb build`, as today — so there's no new verb and no new gate, and the corpus→index ordering `bin/kb-release` enforces is untouched. The only visible difference is that an export now writes ticket bodies, and `xgd ticket update` auto-commits, so a build can produce a `xgd(ticket): update` commit. If that turns out to be annoying in practice we can split it into its own verb later; the requirement doesn't depend on which way we go.

Say go and I'll record that decision in the ticket body, cut the branch, and implement it.

<!-- xgd-turn id="6b4e1f8c-7ec7-4d66-a6cf-e2b144f6feab-user" -->

<!-- xgd-chat role="user" ts="2026-09-25T01:06:15.981429+00:00" -->
#### You
Actually no, I'm ok with automatically generated documentation - I think there is nothing here that is needed.

<!-- xgd-chat-end -->