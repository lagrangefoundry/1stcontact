---
uid: comment-9e94df72
id: COMMENT-3002
type: comment
title: Comment on bug BUG-92
created_by: xgd
created_at: '2026-09-15T00:54:22.505458+00:00'
updated_at: '2026-09-15T01:20:57.951573+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-08631a8c
  kind: chat_transcript
---

<!-- xgd-turn id="87ab43df-86c2-46f0-a76a-819b78118744-user" -->

<!-- xgd-chat role="user" ts="2026-09-15T00:54:13.322660+00:00" -->
#### You
The AI created a page that was not at the top level - this broke the whole site with the message: 

I see this now "page slug 'papers/download' is nested: rendered pages must sit flat at the snapshot root, because emitted asset URLs are relative to it (REQ-109)" is that due to your change? Is it a bug?

We should validate for that and fail the change with an error to the AI not let it break the site for the user

<!-- xgd-turn id="87ab43df-86c2-46f0-a76a-819b78118744-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-15T00:57:57.973430+00:00" -->
#### Claude
Answered first, then the scope.

**Is it due to a recent change? No.** The flatness guard in `render.ts:335` has been there since REQ-109 and is correct — emitted asset URLs are document-relative (`assets/x.svg`), which is only valid while every page sits flat at the snapshot root. A page one directory down would resolve its assets against its own subdirectory and 404.

**Is it a bug? Yes — but not the guard.** The bug is *where* the invariant is enforced. Three things line up:

1. `pageSchema.slug` (`packages/site-schema/src/schema.ts:601`) is `z.string()` with only the REQ-153 locale-shape refusal. `papers/download` validates cleanly and gets written.
2. The render guard then throws for the **whole snapshot** on the first nested page — so it isn't one broken page, it's every page. Preview, publish and published render all go dark until someone repairs the definition by hand.
3. The tool surface actively invites it. `add_page`'s `path` param reads *"Its address in the site. Defaults to the page id."* Nothing says one segment.

Same gap exists on `pageSchema.id` (unconstrained, becomes the store key `<id>.json`).

**Proposed fix** — move the refusal to the write, keep the render throw as a backstop. Ticket body is populated; summary:

| | |
|---|---|
| 1 | Schema-level shape refusal on `pageSchema.slug`, beside the REQ-153 locale rule. Every authoring path funnels through `validateSite`, so one rule covers `add_page`, `update_page`, the toolbox and the store loader. Error at `/pages/N/slug` naming a concrete alternative (`papers-download`). |
| 2 | Same refusal on `pageSchema.id` — concatenated into the store key. |
| 3 | Refuse a *non-home* page slugged `index`: `renderSiteFiles` writes `index.html` as the home alias **after** the page loop, so such a page is silently overwritten and serves home's bytes. Same class, cheap to close. |
| 4 | Fix the `path` description in `l1-surface.json` so the surface stops inviting it. |
| 5 | Keep the render throw. `test_UAT_FC_REQ-109_nested_page_fails_loud` stays green. |

**One thing worth your call — how strict the character set is.** I've proposed mirroring `SITE_KEY_PATTERN` from `apps/public-site/src/routes.ts`, which already made this decision for the same reason (value concatenated into an R2 key):

```
/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/
```

That refuses the hazards (`/`, `\`, `\0`, `.`, `..`, empty, whitespace) without refusing shapes a live site might already hold (`about_us`, `Products`). The stricter kebab-only alternative (`^[a-z0-9]+(?:-[a-z0-9]+)*$`) is nicer for public URLs but would block *all* edits on any existing site holding an underscore or capital — bad trade for a rule whose whole point is not bricking sites. Your three sites in `storage/` (`home`, `contact`, `whitepapers`) are unaffected either way.

Also worth noting: a site already in this state stays repairable — the edit path reads pages raw from the store, so `update_page --path` fixes it rather than the new rule locking it out.

Confirm the scope (and the pattern choice) and I'll cut the branch and code it.

<!-- xgd-turn id="fef77968-11b6-4e33-a841-3cea4ef78de8-user" -->

<!-- xgd-chat role="user" ts="2026-09-15T01:04:28.874275+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="fef77968-11b6-4e33-a841-3cea4ef78de8-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-15T01:20:57.482031+00:00" -->
#### Claude
Scope confirmed. Starting the protocol.

Now the new module.

Now wire it into the schema.

Now export from the package index, and update the `add_page` / `update_page` surface description.

Now update the ticket body to match what was actually built.

Now the one wording fix in the ticket — I named a function that doesn't exist.

Done. BUG-92 is at `free_coded`, commit `419c6e4` merged into `xgd-working`, version `0.2.203`.

## What landed

`packages/site-schema/src/page-name.ts` is the new home of the rule; `pageSchema` is wired to it, so every authoring path — `editPageAdd`, `editPageUpdate`, the toolbox's `add_page`/`update_page`, the store loader — is covered by one statement of it. That's the arrangement REQ-153 already used for the locale reservation, which is why the fix is one file plus two hooks rather than a check per writer.

A slug and an id are both **one addressable segment**: `/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/`. Deliberately the set `sanitizeAssetName` (REQ-246) and `SITE_KEY_PATTERN` admit — all three answer the same question, so the value stays byte-identical as a URL segment, an R2 key and a filename. Requiring an alphanumeric head is what makes `.`, `..` and `.hidden` unreachable without naming them individually.

**Refused, not sanitised.** That's the deliberate split from asset names, which *are* sanitised because refusing a customer's file over its filename isn't a thing this product should do. A page name is an address chosen on purpose and permanent once a revision ships — quietly filing `papers/download` under `papers-download` would put the page somewhere its author doesn't know, and the nav link they write next would 404. The message carries the flat slug instead.

Two neighbouring collisions closed with it, both the same class (a value taken on write that can't be served at the address it names): `index` is the home page's alias written *after* the page loop, so such a page was rendered then silently overwritten; a `.html` tail collides the other way — `about.html` renders to `about.html.html`, so `/about.html` resolves to the page slugged `about`.

The surface stopped inviting it: `path` now reads "one segment, no slashes" and names `papers-download` against `papers/download`. `surface_version` 10 → 11.

## Two judgment calls worth your eye

**No store-level floor.** Assets have `assertWritableAssetNames` because names arrive from clients. Every path that *mints* a page name goes through `editPageAdd`; every other page write reuses a name the store already holds. Four adapter checks would guard a path that can't produce a new name.

**Five fixtures changed.** `req107-authored-l1-envelope`, `BUG-76_slot_error_localisation`, `reconciliation-colour-palette-overlay`, `reconciliation-colour-shade-axis`, `reconciliation-l1-authoring-envelope` all built a home page with `slug: ''` as "no path segment". That was never true — the scaffolder writes `'home'`, and an empty slug renders to `.html` at the snapshot root. They now carry the scaffolder's own value.

## Verification

- New suite: 40 assertions, all pass. RED check — 23 of them fail with the schema wiring stashed out, so they're not vacuous.
- Full suite: **4205 passed, 2 failed**. Both failures (`bug32-webui-scope-rebrand`, `BUG-67_backend_settings`) reproduce on the unmodified base branch — pre-existing, unrelated. I confirmed that by stashing rather than assuming.
- Typecheck error count per package unchanged (`tools/generate` has 16 pre-existing errors about `apps/control-app`'s untyped `.js` imports, before and after).
- Repair path is tested end-to-end: a site whose store already holds `papers/download` now fails to *load* with the field named — better than the render throw — and is fixed by an ordinary `update_page --path`, after which it renders.

Ticket body describes the implementation as built, including both judgment calls. It's parked at `free_coded`; promotion to `ready_to_reconcile` is yours.

<!-- xgd-chat-end -->