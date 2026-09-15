---
uid: comment-9e94df72
id: COMMENT-3002
type: comment
title: Comment on bug BUG-92
created_by: xgd
created_at: '2026-09-15T00:54:22.505458+00:00'
updated_at: '2026-09-15T00:57:58.522942+00:00'
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

<!-- xgd-chat-end -->