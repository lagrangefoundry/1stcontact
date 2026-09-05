---
uid: request-b813aa4a
id: REQ-179
type: request
title: The business selector is shell chrome, not a tab's toolbar
created_by: xgd
created_at: '2026-09-02T23:15:33.822429+00:00'
updated_at: '2026-09-05T00:37:05.166658+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  priority: high
  story_points: 3
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-c4e1817d
  commits:
  - working_sha: 6d25bf25baf5633574b69975a7ea046389da199c
    reconcile_sha: null
    main_sha: null
  version: 0.2.61
  depends_on:
  - REQ-178
---

# The business selector is shell chrome, not a tab's toolbar

## The gap

The site selector is an action in the **site tab's toolbar** (`apps/control-app/src/builder/app.js:106,115,147`), so it scopes one tab. Every other tab either ignores it or reaches for it sideways — `app.js:214,231,253,305` all call `panel.getSite()` to borrow the site tab's selection.

That is the per-tab model, and it does not survive the tab set the product is growing into. [[DOC-40]] §2 makes the **business** the unit everything belongs to: CRM, marketing, monitoring, payments, scheduling and the library are all scoped to it. A person's jobs cross those tabs — _a lead came in from the contact form, is the form still working, did they pay_ is one job over three tabs and one business — and a selector that must be re-set per tab makes the common path the painful one.

## The selector moves up

One control, in the shell's chrome, applying to every tab:

- **Header left: the business switcher.** Lists what [[REQ-178]]'s `Admission` returned, labelled by `tenants.name`, with lapsed businesses shown and unselectable.

- **Header right: the account**, behind the avatar — _not_ a tab. It is the one surface that is not business-scoped ([[REQ-180]]), and putting it in the tab strip would make it the only place where the selector silently does not apply. A control that is present and ignored reads as a bug.

- **The tab strip stays uniformly business-scoped**, with no exception to explain.

`app.js:158` currently records the rule this ticket replaces — _"the toolbar's selector is the one place a site is chosen, and a second control would…"_ — and that comment is the design record, so it is rewritten rather than deleted. The rule it protects (**one** place a scope is chosen, never two) is exactly the rule this ticket keeps; only the place changes.

## v1: selecting a business selects its site

A business has exactly one site in v1 ([[DOC-40]] §2.3), so the switcher yields both. The chat pane, the preview, uploads and the palette stop asking the site tab what is selected and read the shell's scope instead.

This is deliberately **not** a second selector. When several sites per business arrive, a site selector belongs inside the site tab, subordinate to this one — and at that point `panel.getSite()` becomes meaningful again, one level down. Nothing here should make that harder.

## Persistence

The selection survives a reload, so a returning operator lands where they left. The value is per account and belongs with the existing `STORAGE_KEYS` namespacing; the server-side half — resolution accepting the target and authorising it — is [[REQ-168]], and this ticket sends it rather than deciding it. A stored selection naming a business the account can no longer operate falls back to the first admissible one rather than erroring.

## Acceptance

- The selector renders in shell chrome and is visible from every tab.

- Changing it re-scopes every mounted tab, not just the site tab.

- No tab reads `panel.getSite()` to discover the scope.

- The account surface is reachable from the avatar and is absent from the tab strip.

- A stored selection for a business the account cannot operate falls back silently to an admissible one.

- With one business, the switcher is present but claims no more chrome than the name — the modal case is one, and it must not look like an unmade choice.

## Ordering

Depends on [[REQ-178]] for the set and on [[REQ-180]] for the endpoint that serves it. If this lands first it owns a minimal version of that endpoint, on the [[REQ-170]]/[[REQ-161]] precedent for `webui-list-detail`: whichever ticket arrives first adds it, a UAT asserts it exists either way, and neither ordering leaves it out.

---

## Implementation scope (added at free-coding time)

The sections above state the intent. These are the behaviours that follow from it as technical consequence, recorded here so they are matrix-visible rather than discovered by reconciliation.

### The endpoint this ticket owns

`GET /api/businesses` answers, in one call, the two things the chrome needs before it can draw anything:

```
{ "account": { "name": "...", "email": "..." },
  "businesses": [ { "id": "acct_...", "name": "...", "selectable": true } ] }

```

It is the minimal version [[REQ-180]] will grow — the account half is what the avatar surface shows, and the businesses half is what the switcher lists. It is answered from the request's `Admission` rather than from the store, because the admission IS the answer to "which businesses may this account operate"; the router is handed it as an injected dependency for the same reason it is handed a store. On the unconfigured-local-dev path there is no admission, so the endpoint reports the resolved scope as a single selectable business — one entry, which is what that path has by construction.

### Selecting a business scopes the requests, not only the chrome

The switcher sets the `/b/<businessId>` prefix [[REQ-168]] already parses, and every URL the builder builds — API calls, the preview channel, asset and material file URLs — is prefixed through one place in `api.js`. Without that, changing the switcher would re-label the chrome while every request still resolved to the server's fallback, which is the failure this ticket exists to prevent, one layer down.

The site list is re-read after a switch (`/b/<id>/api/sites`) rather than shipped inside the businesses payload: the site-per-business relation belongs to the site store and the route that serves it is already business-scoped, so asking it again costs one round trip and no new query.

### The toolbar's site selector is removed, not duplicated

`siteSelectorAction` and the `site-selector` entry in both render channels' `actions` are deleted. Keeping it beside the shell switcher would be the two controls that can disagree which `app.js:158` forbids; the rule survives, the place changes.

The display panel keeps `setSite`/`getSite` — that is the pane's own display state, and the shell scope drives it. What changes is that nothing else reads it to discover the scope: the editor, the palette, the Library and the upload path all read the shell's scope. That is the layering that makes a per-site selector inside the site tab a later addition rather than a later untangling.

### Where it mounts, and an upstream gap

`webui-shell` offers a trailing `actions` slot and no leading one, so the switcher is prepended into the shell's own header bar and the avatar is an ordinary shell action. The reach into `.shell-bar` is the one place this app touches shell-internal markup and is marked as such: when upstream grows a leading slot it is a one-line change here.

### Acceptance, in test terms

- `GET /api/businesses` exists and reports the admission's set, lapsed members included and marked unselectable.

- With several businesses the switcher is a live control in shell chrome, outside every tab panel; with one it renders the name and no control.

- Changing it moves the scope every surface reads — the pane's site, the Library's site, the palette's site, the upload's site — in one act.

- No module outside the display panel itself reads `panel.getSite()`.

- The selection is persisted under the shell's storage namespace and restored on remount; a stored id that is not admissible falls back to the first selectable business and rewrites the stored value.

- The avatar opens the account surface, and no tab in `TABS` is the account.

---

## Reopened 2026-09-04: the switcher must render for a lapsed account ([[DOC-42]])

Moved back to `draft` from `ready_to_reconcile` to take this amendment before the
work reconciles. **The commits above stand**; this is a delta on top of them.

### The gap this closes

The acceptance says *"a stored selection for a business the account cannot
operate falls back silently to an admissible one"* — which assumes an admissible
one exists. When none does, the account is refused at the door today
([[REQ-178]], `no_entitlement`), so the switcher never renders at all for exactly
the person whose businesses have all lapsed.

[[REQ-178]]'s reopen removes that refusal: membership admits, and a session may
now legitimately hold **zero selectable businesses**. This ticket owns what the
chrome does in that state, and it presently has no answer.

### What the switcher does with nothing selectable

- **It renders.** The businesses are the person's own and they are entitled to
  see that they exist; an empty switcher and a missing switcher say different
  things, which is the same argument this ticket's *Acceptance* already makes for
  the one-business case.
- **Every entry is present and unselectable**, carrying [[REQ-180]] D4's lapse.
  An `<option>` is a label and cannot hold a sentence, so the switcher keeps the
  short suffix and the sentence is stated elsewhere — D4 already settles this.
- **The fallback has nothing to fall back to.** "Falls back silently to an
  admissible one" needs a stated behaviour when the admissible set is empty,
  rather than whatever `firstAdmissible` happens to do.

### What must stay reachable in that state

Not this ticket's surface to build, but its constraint to honour: a member with
no live grant still reaches the chrome that links to their own account
([[REQ-183]]), because that is where they would see what they were charged, pay,
or ask for erasure ([[DOC-37]]). [[DOC-42]] §5 — the Portal is what membership
**is**, not something granted.

So the avatar and its link out remain present and functional when nothing is
selectable. The tabs are what become unavailable, not the chrome.

### Where the boundary sits

The tab strip is the entitled product; the chrome is not. That line is the same
one [[DOC-42]] §5 draws between *a fact about this person's relationship with this
business* and *something the business provides*, and it is what decides which
parts of the shell survive an empty selectable set.