---
uid: comment-e7b812c7
id: COMMENT-6838
type: comment
title: Comment on request REQ-633
created_by: xgd
created_at: '2026-11-02T20:37:24.458988+00:00'
updated_at: '2026-11-02T22:19:08.231428+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-786480ef
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "767ed466-cd1b-4e14-91d5-08bdf0943c30",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="dcb69edf-bfb5-4f2a-8625-8f44ce587fc0-user" -->

<!-- xgd-chat role="user" ts="2026-11-02T20:36:32.207033+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="dcb69edf-bfb5-4f2a-8625-8f44ce587fc0-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-02T20:43:24.111696+00:00" -->
#### Claude
I'm reading the tickets and the framework's module code to scope this before coding.I've read REQ-633, its epic (EPIC-31), its sibling REQ-631 and the framework code it touches. I haven't written any code or cut a branch. Most of the design I can decide myself, but six questions need your answer first, and one of them blocks the start.

**1. The inventory table doesn't exist yet. Who creates it?** REQ-631 has no code: no migration, no Save endpoint, and no session is working on it. This ticket needs real records to test against, and it needs a Save to hook the rebuild onto.
- My recommendation: this ticket adds the `inventory` migration exactly as REQ-631's body describes it, plus one extra field, `slug`. I'd also add a read function for live items and a `rebuildCatalog(business, item)` function that REQ-631's Save calls. REQ-631 then builds the Shop tab and the import on top of that table.
- The alternative is to wait for REQ-631's migration. If both tickets are built at the same time, the migration numbers will collide.

**2. What does an item's Save do to the published site?** A Save has to rebuild the item's product page and the grids that show it, without a site Publish.
- My recommendation: re-render the live revision's site definition against current inventory and overwrite that revision's files in place. Inventory isn't site design, so a Save shouldn't create a new revision in the site's history.
- One consequence: rolling the site back to an older revision re-renders it against current inventory. Is that right?

**3. How do I represent the per-site product-page template?** I'd use an ordinary page, so it keeps the site's own header and footer. On that page, a `catalog` instance set to product mode holds the `product-page` slot. The generator then produces one copy of that page per live item at `/shop/<slug>`, and the template page itself is never served.
- A grid is a `catalog` instance set to grid mode, with a `card` slot and the selection rule.
- Today page slugs can't contain `/` (a REQ-109 rule), so I'll make relative asset URLs work one level down for these generated pages.
- Does that shape suit you?

**4. Paging or a cap for big grids?** With 365 items, a "Portfolio of sold pieces" grid with no limit could get either:
- a fixed cap, for example 48, which is simple but hides the rest, or
- static pages (`/portfolio`, `/portfolio/2`, …) with next and previous links.

I lean towards static pages, because a cap would hide most of her sold work.

**5. Where do the enquiry and commission links go?** "Enquiry about this piece" (shown where Buy will be) and "Commission something like this" both need to open a form prefilled with the item. The contact form can't be prefilled today.
- My plan: each grid and product-page instance names the form's page in its config. The link carries the item in the URL (`?item=<slug>&intent=enquiry|commission`), and the contact form's script prefills its message field from that.
- Is one form with two kinds of opening line right, or does she have a separate commission form?

**6. Size.** This is close to the 20-point limit. It covers:
- the new L1 field-binding primitive
- the module and its rule engine
- generated `/shop/` pages
- the Save-driven rebuild
- live preview
- contact-form prefill
- the consultant's module knowledge

I'd keep it as one ticket, since the parts only make sense together, unless you'd rather split it.

These are the parts I'll decide myself and record in the ticket:
- A field binding is a typed property on text and image nodes, from a closed list of field names. Unknown names are rejected, and bound values go through the existing escaping and URL allowlist.
- Prices are formatted with integer arithmetic from a per-currency decimal-places and symbol table, with no `Intl` and no floating point.
- Sold, price, Buy and Commission are module controls whose visibility follows the item's state.
- The consultant picks the module up from the generated module list, plus a short hint where carousel's hint already lives.

Once you answer 1–5, I'll cut `free-REQ-633` and start.

<!-- xgd-turn id="933d4e3d-53c0-440b-b245-95c01ef74506-user" -->

<!-- xgd-chat role="user" ts="2026-11-02T21:32:50.497503+00:00" -->
#### You
Your ticket has been updated to answer the questions that you asked. Please reread it and determine if you are ready to code

<!-- xgd-turn id="933d4e3d-53c0-440b-b245-95c01ef74506-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-02T22:19:01.646562+00:00" -->
#### Claude
The answers settle every open question. One small thing I noticed: the Purpose section repeats the "no checkout" sentence; I'll remove the duplicate when I next update the body. I'm starting now.

Setting up the new worktree so tests can run.

Worktree is ready. Now reading the L1 node schema for text and image, to design the field binding.

Reading the generator's page renderer, which is where the `/shop/` pages and paging will be produced.

Reading the behaviour-module contract types next.

Now checking the L1 round-trip gate, since the binding primitive has to survive it.

Writing the binding primitive in the L1 schema now.

Schema exports flow through `export *`. Adding the binding schemas:

Now the type exports and the page-tree refusal:

Now the renderer side. Looking at RenderState and the text-run helper:

Now implementing the binding in the renderer:

Binding added to the schema and renderer; typechecking it now.

Typecheck is clean. Before writing the module I need to know how L1 lays out a grid of cards, since the module can't ship CSS:

Typecheck clean. Checking which existing tests iterate over every catalog module, since the new module will have to pass them:

Writing the catalog module: item model, selection rule and per-item record.

Writing the module contract:

Palette and design are already resolved in module slots when the site loads, so cards pick up the site's design tokens like any other module. Writing the component:

Module is registered and typechecks. Next: the generator writing `/shop/<slug>` pages and grid paging. First, the published-site routing for nested paths:

Nested paths already resolve (`/shop/x` → `shop/x.html`). I'll mark the product-page template as not served in `isServedPage`, so every consumer (nav, sitemap, publish) agrees:

Now the generator. Wiring catalog data, product pages and grid paging into `renderSiteFiles`:

The module and generator changes typecheck. I'm now writing the first generator-level UATs.

Eight of nine pass on the first run. The failure is my assertion, not the code: the brass lamp has a summary and the glass lamp doesn't. Fixing it to check template order:

All 9 generator UATs pass. Now the existing suites that enumerate every module or every L1 schema key, which the new module and field will touch:

Two failures. The AC-954 one is a registry obligation: every module needs a seam case, so I'll add one for `catalog`. The REQ-148 one could be pre-existing, so I'm checking it on clean `xgd-working`:

REQ-148 fails on clean `xgd-working` too, so it isn't mine. Adding the `catalog` seam case:

Now pointing the seam case at the grid's `card` seam, which the builder draws as authored when there's no inventory:

The edit channel and catalog suites both pass. Next is the `capture(render(L1)) ≈ L1` round-trip for bindings. Finding where capture reads per-element attributes:

Working on the capture round-trip now. Checking whether the capture schema enforces that every extracted key is registered:

Adding `bind` as a carried (not diffed) axis, alongside `href`:

Now the fold: turning the captured marker back into `bind` on text and image nodes.

Typecheck clean. Writing the round-trip UAT, modelled on the video one:

Every binding survives the round-trip. Only the order differs, because the fold places images after text, which is an existing fold behaviour and not a binding loss. Comparing order-insensitively:

The round-trip passes with Chromium. I'll start a broad regression batch (render, L1, fold, capture and module suites) in the background while I move on to Publish and the Save rebuild.

While that runs, reading the publish path to see where the live inventory has to be passed in:

Live is always the highest revision id, so the Save rebuild can re-render that revision and replace its output files in place. Reading how the D1/R2 store writes a revision's output:

Ladder renditions are cached, so a rebuild can ask for the delivery manifest again cheaply. Checking which store adapters would need a new "replace a revision's pages" verb:

Regression batch still running. Meanwhile, looking at how control-app maps a business to its site, which `catalogItemChanged(business, itemId)` needs:

While the batch runs, I'll build the per-site coordinator. Looking at how the existing Durable Objects are declared and exported:

While the batch runs, adding the two store verbs the rebuild needs. Reading the three adapters' revision code:

Adding the delivery manifest to revisions and the in-place page replacement verb on all three adapters:

Now the three implementations. Memory store first:

The site store now records which image sizes each published revision used, and has a verb to swap a revision's pages in place; the D1/R2 adapter is the last piece of that.

All three adapters and both apps typecheck. Now wiring the catalog into publish, and adding the rebuild that re-renders the live revision:

Publish and rebuild typecheck. Checking the regression batch:

18 failures across 15 files. Before blaming anything on my diff, I'm running the same files on clean `xgd-working` for a baseline:

While the baseline runs, reading my branch's failure messages for the capture suites, which are the most likely to be mine (the new `bind` key):

Writing the per-site coordinator Durable Object, with an in-isolate fallback for when the binding is absent (the same pattern as `SESSION_JUNCTION`):

Now the inventory source and `catalogItemChanged`:

I'm making the builder preview read inventory live; editing the preview renderer directly.

The constructor edit had already landed on the first attempt. Applying the remaining two:

Now the router: publish takes the site's turn and renders with the live inventory, and the preview gets the business's inventory.

I'll register each opened store's business once in `openSiteStore`, so every existing `previewRenderer(store)` caller gets live inventory without changing signatures:

Control app typechecks. Now exporting the Durable Object and binding it in all three wrangler environments:

Now the Worker-level UATs: publish, the Save rebuild, the preview and the coordinator. Checking how the existing test opens a tenant's D1 store directly:

The R2 key is gone, so the Worker is answering from somewhere else. Checking whether the public site caches responses:

A lead's provenance is a JSON object, so the item can go there without a migration. Checking how the public site separates reserved form fields from answers:

Implementing the prefill in the contact form's contract, component and client:

The browser bundle (`capabilities.js`) is built from a precompiled `module-assets.ts`, not from `client.js` directly. Checking my notes on regenerating it:

Node has no TS runner here, so I'll regenerate `module-assets.ts` through a throwaway vitest file and delete it afterwards:

The regenerated file changes only the client-JS line, which carries the new prefill. Now the generator hands the live items to the contact form, and the lead path records the item:

All four projects typecheck. Writing the prefill UAT: the generator renders the contact page, the form's own client script runs against `?item=&intent=`, and the result is checked in jsdom.

I'm adding the prefill UATs now: a jsdom test of the contact page the generator writes, and a Worker test that the item reaches the lead.

All 11 node UATs pass. Now the Worker test that a prefilled submission records the item on the lead:

Both lead UATs pass. Last behaviour piece: the consultant's module knowledge. Reading how the module reference is generated and where the carousel hint sits:

Module guidance isn't in code, so it's probably in the project's knowledge-base doc tickets. Searching those:

Two system knowledge-base docs describe the modules: DOC-25 (the module contract and catalogue) and DOC-47 (what the tool can do today). Looking at how each covers the existing modules:

While the regression runs, I'm drafting the consultant's module guidance for DOC-47. Reading the rest of its component section so the new text fits:

Writing the DOC-47 update as targeted replacements on its stored body:

Now a short worked example in DOC-25, the module contract doc:

Both docs are updated. While the regression runs, I'm updating the REQ-633 ticket body. Re-reading it first in case the operator has changed it since:

The only change since I last read the body is my own status flip. I'll write the "as built" section once the regression confirms this slice. Checking it:

Still running. Drafting the ticket's "as built" section in the meantime:

Typecheck is clean. Rerunning the suites that broke, plus three other failures I need to look at (the contact-form instance handle, the enhancement gate, and CLI boot):

The first pin edit applied; the import line matched twice. Fixing that, then applying the second file's edit:

Both pins pass now. The workers regression has finished, so I'm reading its results while the deploy-smoke baseline runs:

Three workers failures. Baselining them on clean `xgd-working`:

All three fail identically on clean `xgd-working`, so none are mine. Checking the deploy-smoke baseline:

Rerunning my Worker UATs after the Durable Object split:

AC1333 fails on clean `xgd-working` too. A final rerun of the node suites the router import had broken, to confirm the split fixed them:

Only the three failures that also fail on clean `xgd-working` remain. Committing the second slice:

Second slice committed as `b95f77b03f`. Updating the ticket body with the "as built" section, then merging back. Re-checking first that the body hasn't changed since I drafted the update:

Following my notes' recipe for the merge back: lock, merge `xgd-working` into the branch, bump, commit, fast-forward, then the gate.

Only `package.json` conflicts: another ticket landed 0.2.735 on `xgd-working` too. Taking the branch's higher version, committing the merge, then bumping on the branch:

Before landing the merge, a quick rerun of my UATs against what just came in from `xgd-working`:

Fast-forwarded onto `xgd-working`. Now the gate, with the three non-merge commits:

Cleaned up. REQ-631's body records the original hook signature, which I changed, so I'll leave a comment there so its session builds against the real interface:

Yes, I was ready, and REQ-633 is now built, merged into `xgd-working` and set to `free_coded` at 20 story points. It's in two commits plus a version bump (`dce013745e`, `b95f77b03f`, `870001a2a3`, version 0.2.737). All 21 new UATs pass, across the generator, the builder preview, the published-site Worker, the lead endpoint and a Chromium capture round-trip.

**What it does**
- **Field binding:** a card or product-page node can name an item field (`bind: { field }`) instead of holding its own text. Unknown field names are rejected, and so is a binding outside a catalog slot. Bound values go through the same escaping and URL allowlist as typed-in copy, and the capture round-trip still holds.
- **The `catalog` module:**
  - a grid mode, driven by a selection rule, and a product mode
  - one page per live item at `/shop/<slug>`, drawn from a template page that is never served itself
  - static paging at `/<page>/2`, 24 items per page by default
  - sold pieces show Sold, hide their price and offer the commission link; available items show the enquiry link
  - prices go through `formatMoney`
- **A Save follows the item:** `catalogItemChanged` re-renders the live revision against current inventory and replaces its pages in place. It adds no new revision and never uses the unpublished draft. Each publish now stores its image-size manifest so a rebuild keeps every `srcset`.
- **Publish and Save take turns** through a new per-site Durable Object, `SiteCoordinator`, bound in all three `wrangler.toml` environments. None existed before.
- **The preview reads inventory live.**
- **The contact form fills itself in** from `?item=&intent=`, as plain text. The item's slug is recorded on the lead.
- **The consultant:** I updated DOC-47 (its components section said a product catalogue wasn't available) and added a worked example to DOC-25.

**Where it departs from the ticket** (all recorded in its new "As built" section)
- **Sold, price, Buy and Commission are bound text fields, not module controls.** That keeps their wording in the site definition, as your answer 5 asked.
- **The hook is `catalogItemChanged(deps, business, itemId)`,** because a rebuild needs the store and the coordinator. I left a comment on REQ-631 with the exact interface.
- **Two extra slots:** `list` arranges the cards and `pager` holds the previous/next links. L1 has to own both, because the module ships no CSS.
- **A Save can take up to 60 seconds to reach visitors,** the same as a Publish today, because of the public site's edge cache.
- **Two commits instead of five:** the Save rebuild and the form prefill share files, and splitting them would have needed interactive staging, which isn't available here.

**Two existing tests changed:** AC878 pins the contact form's config keys and REQ-223 pins its reserved field names. This ticket adds to exactly those lists, so I updated both. Every other failure in the regression runs fails the same way on a clean `xgd-working`.

**Not verified**
- The Durable Object migration hasn't been deployed; it has only run in the local test runtime.
- The form prefill was tested in jsdom, not a real browser.
- No Shop tab Save calls the hook yet. That arrives with REQ-631; until then the items come from an in-memory stand-in.
- The new consultant guidance hasn't been tried in a live consultant session.

`xgd branch cut` failed because the sandbox won't let it write `.git/config`, so I created the worktree by hand with `git worktree add`.

<!-- xgd-chat-end -->