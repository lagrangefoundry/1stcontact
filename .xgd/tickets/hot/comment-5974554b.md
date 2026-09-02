---
uid: comment-5974554b
id: COMMENT-2173
type: comment
title: Comment on request REQ-175
created_by: xgd
created_at: '2026-09-02T22:39:47.319566+00:00'
updated_at: '2026-09-02T23:23:22.101927+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-2bd9d184
  kind: chat_transcript
---

<!-- xgd-turn id="e0884232-3a4e-487a-ac4c-daa19e36e0df-user" -->

<!-- xgd-chat role="user" ts="2026-09-02T22:39:14.551051+00:00" -->
#### You
Please investigate the root cause or the implementation of this ticket. Report your findings here so that we can discuss them. Do not make any code changes until we are aligned.

<!-- xgd-turn id="e0884232-3a4e-487a-ac4c-daa19e36e0df-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-02T22:44:18.933212+00:00" -->
#### Claude
## Findings

I've verified the ticket's diagnosis against the code. It's accurate, and the investigation turned up two things it doesn't yet say.

### 1. The document-level gap is exactly as described, and it is total

`l1DocumentSchema` (`packages/site-schema/src/l1/schema.ts:1339`) is `{ widths, background?, textColor?, resources?, column?, root }`. The address grammar bottoms out at `segmentRoots` returning `[l1.root]` (`tools/generate/src/cli/edit.ts:415`), and `parseL1Path` accepts only dotted non-negative integers — so `"0"` **is** `root` and there is no lexical form that reaches the document object at all. `writeSegmentRoots` (`edit.ts:463`) writes back only `.root`.

Nothing else writes them. `editPageUpdate` refuses unless one of `title`/`path`/`seo` is given (`edit.ts:1002`); `set_config` writes `site.json`. Grep confirms the only writers of `doc.background` are `fold.ts:2317` (the importer) and `scaffold.ts:69-70`, and the only writer of `textColor` anywhere is the scaffolder.

The corpus uses all five keys:

| page | keys |
|---|---|
| `gigabytealchemy/home` | `widths, background {ref:sand}, textColor {ref:slate,-0.43}, column {1152/24/896}, resources` |
| `xgd/home`, `xgd/whitepapers` | `widths, background {ref:surface}, textColor {ref:text,-0.22}, resources` |

So the palette-ref requirement in the ticket is confirmed by the corpus, not just anticipated.

### 2. It is a read gap before it is a write gap — and the read already exists one layer down

`editPageGet` (`edit.ts:897`) returns the **whole page**, `l1` included. A CLI operator running `1c page get` can see the background. `describe_page` (`toolbox-core.ts:219`) then narrows that to `{page: {id, slug, title, seoMeta}, components, segments}` and drops the document. The consultant's blindness is introduced by the toolbox projection, not by the edit layer — which means the read half is a one-line-ish widening plus a `page_map` shape entry, not new plumbing.

That's also why CHAT-35 went the way it did: `#ffffff` was sitting in the draft and the surface simply never showed it.

### 3. New finding — `resources.fonts` is the sharpest of the five, and fails silently

`documentFonts` (`edit.ts:573`) reads the font table to populate the **direct-manipulation editor's font picker**. So the operator clicking a text run gets a font choice; the consultant cannot add a face to that table at all.

Worse, there is no cross-check: `validate.ts` scheme-checks each `font.src` (`:691`) but never checks that a text leaf's `axes.fontFamily` resolves to a declared face. So the consultant can set `fontFamily: "Poppins"`, get a clean accept, and ship a serif fallback. That's the same failure class as white-on-white — a plausible write that is accepted and wrong — rather than a refusal it could learn from.

Caveat on scope: the caretaker is granted `DrawImages` but **not** `ManageAssets` (`instances.json`), so it can only bind faces the site already holds. Worth deciding whether `resources` writability without asset-add is useful enough to be worth having.

### 4. New finding — parity here is free of safety cost

I expected `widths` and `column` to be footguns. They aren't, because the envelope validator already guards every cross-key invariant, and `set_l1`-style writes validate the **whole assembled site** before a byte lands:

- `validate.ts:130,211` — every geometry/scalar keyframe `at` must be a member of `doc.widths`. Dropping a rung something anchors to is refused whole.
- `validate.ts:712-723` — `geometry.anchor` without `doc.column` is refused.
- `validate.ts:691` — font `src` scheme allowlist.

So making all five writable inherits the existing all-or-nothing refusal model unchanged. The one genuinely unguarded key is `resources` vs `fontFamily` (§3), and that gap exists today regardless of this ticket.

---

## What I'd want to agree before coding

**A. Where the document write lives.** Three shapes:

1. **Extend the path grammar** above `"0"` (e.g. a `doc` sentinel). I'd argue against it: `l1/edit.ts` states "the **one** resolution rule" as the contract that keeps the stamped address and the resolved address identical, and DOC-30's `l1_address` param type is documented as positional child indices. A non-positional address in the same parameter breaks both.
2. **Fold into `update_page`** as a `document` param, merged like `seoMeta`. Cheapest, but it lands page *appearance* in the `ManagePages` grant, next to slug and SEO — while `set_l1` sits in `AuthorPages`. A role granted authoring but not page management could paint every element and not the page.
3. **A new pair in `AuthorPages`** — e.g. `get_page_style` / `set_page_style` (naming open), merge semantics like `set_config` so writing `background` can't silently drop `resources`. My recommendation.

Read side in all three cases: widen `describe_page` to carry the document keys, and add them to the `page_map` shape. That alone closes CHAT-35's specific failure.

**B. How far the parity test reaches.** Two layers, and I think you want both:

- **Corpus round-trip** — for each reproduced page in `storage/sites/`, walk every address, `get_l1` → `set_l1` unchanged, assert byte-identity and acceptance; same for each document key present. Catches anything the surface strips or refuses today.
- **Schema-enumeration** — derive the key set from `l1DocumentSchema.shape` rather than listing it, and assert each is covered by a surface operation. This is the half that makes the guarantee structural: adding a sixth document key fails the test on the day it lands, which is precisely the "next capability reopens the gap silently" failure the ticket is written against.

The corpus check alone would pass a schema key that no reproduced page happens to use yet.

**C. Does `widths` belong in the writable set?** It's the authoring ladder, derived from `RESPONSIVE_VIEWPORTS`. It's *safe* to write (§4), but I can't construct a client request that means "change the viewport ladder." Options: include it for parity's sake; or read-only with a declared absence explaining that the ladder is the site's, not the page's. I lean to including it — an absence here is a rule the parity test would then have to encode an exception for, and exceptions are how these gaps come back.

**D. Is `resources` in scope for this ticket?** It's a document key, so mechanically yes. But making it writable without also closing the silent-fallback hole (§3) hands the consultant a way to half-bind a font. The fallback check could be a small addition to `validate.ts` here, or its own ticket.

No code changed. Tell me which way on A–D and I'll populate the ticket body accordingly before cutting a branch.

<!-- xgd-turn id="a0c53fe1-6388-4ea1-939a-bbdb50bbe730-user" -->

<!-- xgd-chat role="user" ts="2026-09-02T23:23:22.044541+00:00" -->
#### You
The consultant needs access to all the capabilities you are discussing - in fact we will be expanding on the set. So yes to everything.

In general L1 needs to be self-validating - if the AI propose a change that will break things we should not allow the change with a clear and helpful warning

<!-- xgd-chat-end -->