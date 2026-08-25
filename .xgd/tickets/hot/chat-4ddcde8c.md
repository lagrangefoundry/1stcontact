---
uid: chat-4ddcde8c
id: CHAT-12
type: chat
title: XGD website copy
created_by: xgd
created_at: '2026-07-30T20:42:45.219423+00:00'
updated_at: '2026-07-31T00:51:22.997404+00:00'
completed_at: null
last_field_updated: body
status: open
fields:
  chat_comment: comment-aef798fe
---

## Session record — xgd.dev copy pass

### DOC-9 rewritten first (xgd-biz, `doc-d27f58f5`)

The positioning keystone had drifted from the product *and* from its own downstream papers.
It described XGD's original conception — spec in at the top, validated code out at the bottom.
That is now the **secondary** mode. DOC-4 §Wave 3 and DOC-5 §4 had already moved to the current
position; the keystone was the stale one.

Revised: §1 core message (**"XGD makes generative development safe without making it slow"**),
§2 spine (governance runs *behind* you, not in front), §2.1 new (two modes, cadence as
positioning, the route-around argument), §3 (Kubernetes analogy strengthened — reconciliation is
literally an async background controller), §5 (the qualify-out tension cadence language creates),
§6, §7, §8 (split into three proof assets), §10.

**§6 is the load-bearing correction:** never say "out of the loop" bare. It is the *coding* loop.
The human stays in **product design, architecture and QA**. Unqualified, the phrase says the human
has left the project — untrue, and it hands the magic-wand audience exactly the reading §5 exists
to prevent. Rules added to both the do and don't lists.

Regression benchmark framing fixed per operator: one regression per two tickets is **the error
rate to expect from structured vibe coding as a practice**, not a defect XGD introduces. Our claim
is the instrument and the repair, not the rate. §10 forbids quoting it unframed.

### Page rewritten against it

`storage/sites/xgd/draft/pages/home.json` — 31 text slots, copy only, no structural change.

- **Hero sub** now leads on cadence ("Work at conversational speed. Behind you, XGD…"), then
  mechanism, then ownership. Was pure mechanism.
- **Problem** retold as the trap rather than a list of complaints: fast breaks quietly →
  discipline costs cadence → so you route around it. Sets up the answer instead of restating
  the pain three times.
- **How** is now the loop, not a static description of the matrix: you build → XGD reconciles →
  the record can't go stale → regressions get repaired. Carries the benchmark, framed.
- **Proof** gains the numbers (9 months, 1 person, 130k/300k, zero lines read) and the
  **abandonment story** — built autonomous-first, then noticed we were avoiding it. Previously
  unused in any material.
- **Contract** corrected: it described autonomous mode. Headline is now *"You're out of the code.
  Not out of the project."* Columns match DOC-9 §6 exactly.
- **Close/signup**: waitlist is primary, both papers named.

### IA fixes

`id="papers"` was on the **Proof** section, so the nav "Whitepapers" link and the hero's secondary
CTA both landed on a section with no paper in it. Renamed to `proof`. Papers are email-gated now,
so nav "Whitepapers" → `#signup`; hero secondary is *"See the evidence"* → `#proof`, giving
sceptics a non-committal path while ready readers take the primary CTA.

Also softened "the ninety thousand **already there**" → "**it wrote last month**". The original
invited brownfield readers that DOC-7 says we cannot yet serve.

### Open

- **Mailing-list opt-in is not on the page** — `contact-form` supports `text|email|tel|textarea`
  only (`packages/framework/src/modules/contact-form/meta.ts:48`). A checkbox is behavioural, so
  it belongs as a `config` addition to the module. Needs its own ticket.
- **Whitepaper delivery has no artifact and no backend.** No PDFs exist in either repo; the papers
  are ticket bodies. `/api/lead` does not exist. Deferred by the operator as "easy mechanics".
- **Candidate L1 gap:** a text leaf carries one style, so the two paper titles run unemphasised
  inside the sentence. No way to mark an inline run without splitting the node and losing the
  flow. Same family as the REQ-95 gap list.
- **Structural, not done:** section shape is still eyebrow → headline → paragraph → grid, six
  times; the proof section is still small for what it carries. Both are layout work, not copy.
- DOC-5 §4 is titled "Three Modes of Working" and describes two.


## /whitepapers — second page authored

`storage/sites/xgd/draft/pages/whitepapers.json`. Operator decisions: one form, paper request as
the primary ask with mailing list and waitlist secondary, slug `whitepapers`.

Structure: nav → header → the two papers → capture → footer. Built by deep-copying the home page's
chrome and band structures so the visual system is inherited rather than re-derived; `paper-items`
is the home page's 3-card row with two children, so DOC-8 drops in later without new structure.
Form is email-only (the `message` field and its matching `control` node both removed) — this page
is the low-friction ask.

Home page adjusted: nav "Whitepapers" now leaves for the real page, and the close section drops the
two-title sentence it was carrying, so it asks for the waitlist and nothing else.

### Framework findings — both only reachable with a second page

**1. No shared chrome (expected, now confirmed).** A page is a self-contained L1 document
(`widths`, `background`, `resources`, `root`). There is no partial, layout or include mechanism, so
nav and footer are duplicated across the two pages. **Every future nav edit must be made in both or
they diverge silently.** Same duplication-tax family as the REQ-95 CTA workaround, one level up.
Wants a ticket.

**2. `relativizeUrl` breaks cross-page anchors (new, a real defect).** REQ-109
(`packages/framework/src/l1/render.ts:115`) strips a single leading slash so a rendered snapshot is
relocatable. Correct for `/assets/x.svg`. **Wrong for `/#how`**, which becomes `#how` — "the `how`
anchor on *this* page" rather than on the site root. On a one-page site the two are
indistinguishable; on `/whitepapers` the nav silently pointed at anchors that do not exist there.

The function's own docstring contains the argument against its behaviour: it explains that `''`
would resolve to the current *page*, "which is a different target once the page is not
`index.html`" — and that reasoning applies verbatim to `/#frag`. Suggested fix: when the remainder
after the slash begins with `#`, emit `./#frag` rather than `#frag`. Relocatability is preserved;
the cross-page target stops being wrong.

Worked around in the site by authoring `/index.html#how` and `/index.html#signup` on the
whitepapers page, which relativize to `index.html#how` and resolve correctly from any page. The
home page keeps bare `#how` because there the same-page anchor is the correct target.

### Routing

`1c serve` (`tools/generate/src/cli/serve.ts:66-74`) resolves directories to `index.html` and
otherwise requires an exact path — there is no extensionless `.html` fallback, so `/whitepapers`
404s locally while Cloudflare Pages would serve it. Links point at `/whitepapers.html`, which works
in both. A three-line serve fix would allow the clean URL; not filed.

### Still open

- **Mailing-list checkbox is not on the page.** `contact-form` has no checkbox field type, so the
  copy does not promise one. Deliberate — no copy written for a control that cannot render.
- Paper 02 is titled "Extreme Generative Development" on the card; the full title carries the
  subtitle "An Experiment in AI Software Development". Shortened for the card, worth confirming.


## URL fix shipped; relocatable-URL bug filed

**REQ-113 — `1c serve` extensionless URLs** (`free_coded`, `4d7515c95`, v0.1.8).
A request that resolves to nothing and carries no extension now falls back to `<path>.html`.
Applied to the already-confined absolute path so reach cannot widen; gated on having no extension
so a missing asset still 404s rather than returning HTML under the wrong MIME; ordered last so a
real directory's `index.html` still wins over `<dir>.html`.

4 UATs (`tests/req113-serve-extensionless.test.ts`), driven over loopback against the real server
rather than a path helper — the defect was in request resolution, so the contract that matters is
the status and bytes a browser receives. RED was clean: only the AC1 test failed, the three
regression guards passed before the fix as well as after.

Site links restored to `/whitepapers`. Verified end-to-end: `/`, `/whitepapers`,
`/whitepapers.html` and assets all 200; `/nope` still 404s.

**BUG-30 — `relativizeUrl` turns `/#frag` into a same-page anchor.** Filed, not implemented.
`render.ts:115` strips one leading slash for relocatability, which is right for `/assets/x.svg` and
wrong for `/#how` — it changes the base the fragment resolves against. Undetectable on a
single-page site. Ticket also asks for the whole relativization sink to be reviewed at once:
query-string handling, whether `renderSite`'s flat-snapshot assertion still holds and still fires
now that sites have more than one page, and the general case of a current document that is not
`index.html` — a condition unreachable until this week.

Workaround still in the site: the whitepapers page authors `/index.html#how` and
`/index.html#signup`. Remove when BUG-30 lands.

## Pre-existing test failures on xgd-working (NOT from this work)

Full suite: **954 passed, 4 failed**. All four fail identically against HEAD's `serve.ts`, verified
by reverting the change and re-running. Untouched by REQ-113 and unrelated to it — they are fold /
schema drift:

- `reconciliation-1c-astro-free-render` — `InvalidDefinitionError: Invalid site definition 'acme'`
- `reconciliation-l1-fold-full-language` (AC-733) — `['Expressible Heading', 'slot']` vs `['Expressible Heading']`
- `reconciliation-3probe-gate-evaluator` (AC-737) — `['image','text']` vs `['field','image','text']`
- `reconciliation-3probe-gate` (AC-705) — a 4-element vs 4-element leaf-kind mismatch

The shape of all three assertion failures is a `field`/`slot` leaf appearing or disappearing, which
suggests one schema change moved fold's output and these expectations were not updated with it.
Worth its own investigation; not this session's scope.

## Operational note

While cleaning up a temporary verification server I ran `pkill -f "1c.mjs serve xgd"`, which also
matched the long-running preview server on :8792 and killed it. Restarted on the same port and
confirmed serving. No data affected — it is a static file server — but the pattern was too broad.


<!-- xgd-chat-end -->