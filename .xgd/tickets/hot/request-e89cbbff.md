---
uid: request-e89cbbff
id: REQ-239
type: request
title: The Settings tab, and the settings chat role
created_by: EPIC-4
created_at: '2026-09-13T21:18:15.497079+00:00'
updated_at: '2026-09-14T03:54:23.160992+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  depends_on:
  - request-1e65c6db
  - request-2ac88003
  epic_parent: epic-0728e1c5
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-1f599763
  story_points: 8
  commits:
  - working_sha: 8cf16c5f861a906c74703140ab20a128ec7b0782
    reconcile_sha: null
    main_sha: null
  - working_sha: 5ac1d5fcacb1376894248ad3ec9b719561ee5f38
    reconcile_sha: null
    main_sha: null
  version: 0.2.196
---

## What this is

A fourth tab, two panes: the settings on the left, and on the right an assistant
with a role of its own that can reach the settings API.

## The tab

- **Rightmost in the strip**, after Site, Library and Contacts
  (`TABS`, `apps/control-app/src/builder/config.js:90`).
- **Business-scoped like every other tab**, which is why it is allowed to be a
  tab at all. [[REQ-179]] makes the strip uniformly business-scoped and keeps the
  Account surface out of it as a header modal, because the account is the one
  surface the shell's business switcher does not apply to, and *"a control that is
  present and ignored reads as a bug"*. Business name, hostname and site all
  belong to a business, so this satisfies that rule and needs no exception.
- **Blocked with the others when a grant lapses**, per `blockTabs`.
- **`fill: true`**, for the same reason the other three have it: it hosts a split,
  and a split resolves its height against the panel.
- **Its `id` is stable and its `label` is provisional**, declared in `config.js`
  and referenced from there, with a `STORAGE_KEYS` entry for the split position.
  A label string never appears as a literal anywhere else ([[REQ-115]]).

## The two panes

Left: the settings, as **fields that can be edited in place** — click one, change
it, done. Business name ([[REQ-237]]) and the `1stc.site` hostname ([[REQ-238]]),
the latter behaving as a registrar's field does: type, press return, told taken
or available, then claim.

Right: the assistant, holding an API to those same operations.

### Editing directly is the primary path, not a concession

[[EPIC-4]] argues Settings is *"a record-and-status surface, not a workshop"* and
that the conversational path is primary, from [[DOC-46]]'s position that the
client is not operating a tool. **That is taken too far here, and the correction
is recorded in the epic.** Some things are simply easier done directly than
through discursive communication, and correcting a typo in your own business name
is the clearest possible example: a text field is better than a conversation, and
a product that insists on the conversation has added the friction it exists to
remove.

The conversational path is not demoted — the assistant can do everything the pane
can, whenever the customer would rather ask. What changes is that neither is a
fallback for the other.

### One API, two callers

**The pane and the assistant call the same operations.** Not the pane calling the
assistant, and not the assistant driving the pane — both are ordinary callers of
[[REQ-237]]'s and [[REQ-238]]'s surface.

This is the rule that keeps the two honest. A second write path with its own
validation is how one half of a surface ends up permitting what the other refuses
— and here that would mean a name the field accepts and the assistant rejects,
with no way for the customer to tell which is right. It is also what your own
framing asks for: an API *exposed to* the settings chat role is an API that
stands on its own, with the chat as one of its consumers.

## The settings role

This is the project's **second role**. `roles.ts` today defines exactly one,
`CONSULTANT_ROLE`, and has always been shaped for a second — the header
anticipates *"the caretaker the ongoing tier will need"* and separates the
product-facts entry from the role text precisely so that standing one up does not
mean copying the facts and maintaining two divergent copies.

- **A new entry in `instances.json`** granting the settings surface and nothing
  else. A session is never told about a capability it was not granted, so the
  settings assistant's manual never mentions publishing a page or drawing an
  image, and it cannot propose, apologise for, or probe for one.
- **Priming carried as configuration, not code** — entries in `priming.json`, as
  [[REQ-182]] requires. The role text is what sets the register, and the register
  here is not the consultant's: a consultant forms a view and argues for it; this
  role is helping somebody through a small number of consequential, mostly
  one-time decisions, and its job is to make the consequences legible before they
  are committed to.
- **No site line.** `siteLine(slug)` is unconditional in the consultant's
  priming because a session acting on the wrong site is a failure with no signal
  to wait for. A settings session is about a business, so the framing it needs is
  which *business* it is in.

## The session is business-scoped, and that is the novel part

Everything in the host assumes a session is about a site. `sessionIdFor(slug)`
returns `` `site-${slug}` `` (`host-core.ts:427`), managers are held *"one
`SessionManager` per site"* (`host-core.ts:450`), and `registerSiteProviders`
binds a slug. A settings session is about a business — which, after [[REQ-236]],
is also the only scope under which the business name and the hostname mean
anything.

So the session id gains a business form alongside the site form, and the manager
map keys on whichever this session is. This is where the unknowns in this ticket
are; the browser work above is a few hours and this is not.

## What this ticket does not own

- **The settings operations themselves, and their prose.** [[REQ-237]] and
  [[REQ-238]] each declare their own operations, parameter descriptions and
  refusals in the surface, because the tool manual is *projected* from that
  declaration and a description that lives apart from its operation falls behind
  it. This ticket owns who is reading the manual — the role, the grant, the
  priming — and not what is in it.
- **DNS records, nameservers, registrar operations, and whether an address
  actually resolves.** [[EPIC-5]], [[EPIC-6]], [[EPIC-7]]. Settings renders those
  verdicts; it does not compute them and does not embed a record editor.

## Falsifiers

- A settings write that reaches the store without passing through the same
  operation the assistant calls.
- A setting that can only be changed by asking the assistant.
- A settings session that has to name a site.
- A tab label as a literal outside `config.js`.

---

## What was built

### The tab and its two panes

`SETTINGS_TAB` is declared in `config.js` and appended to `TABS`, rightmost, with
`fill: true` and its own `STORAGE_KEYS.settingsSplit` and
`STORAGE_KEYS.settingsChat` — a second split position and a second composer draft,
because the site tab's division is where the operator wants the *preview* divided
and this one is a short form beside a conversation.

`settings.js` is the left pane: a section per setting, each carrying its own field,
its hint and its notes. The business name is a `mountFields` control in `commit:
'auto'` — click the value, type, press return. Emptying it is refused in the
browser as well as at the origin, because `auto` reverts the control when the
commit throws and throwing is how the customer gets their own word back.

The right pane is a **second `createChatPanel` instance**, not a second mode of the
site tab's. `chat.js` shows one conversation and each instance keys its own draft
storage, so sharing one would swap the site's conversation out on every tab change
and lose whatever was half-typed in the other.

**A business switch moves both halves.** `selectBusiness` sets the pane's record
and opens a new settings conversation, alongside the Library's and Contacts'
clear-and-re-read — this is a different business's record and a different
conversation, not the same ones under a new heading. With no business open the
pane says so and renders no field.

### One API, two callers

The pane calls `POST /api/business/name` ([[REQ-237]]'s route) and the assistant
calls the `settings` surface's `rename_business`. Both bottom out in
`business.ts`'s single rename rule, over the account that owns the business, so the
field and the conversation cannot come to permit different names.

A rename reports what it left out of date and changes none of it. The pane renders
those as notes — *your site still calls you X*, *your old name is in N pages* —
with **no control beside them**: what to do about a site is a site edit, made in
the site tab.

**The chrome follows the record.** A rename relabels the switcher above the field,
through `switcher.rename(id, name)`, which re-derives the label so a lapsed
business's suffix cannot be dropped by a rename. The switcher and the pane read the
same list — the one `/api/businesses` answered with — so there is no second fetch
and no second answer.

### The settings role

`SETTINGS_ROLE` in `roles.ts`, with its own declared order in `priming.json`
(`settings_priming` / `settings_reminders`) and its own template, `business-line`.
It is loaded through the framework's `rolesFromMapping` for the reason the
consultant is: a `provider:` naming something nobody registered must be a start-up
failure naming the entry, and this role names two providers that did not exist
before.

**It inherits neither of the consultant's static entries.** `consultant-role` and
`product-system` are both about building a site — how a page is changed, what a
tool will accept, what publishing means — and this session is granted none of it.
A session told about a capability it was not granted will offer it, apologise for
it, or probe for it. It has no corpus either: its whole subject is two operations
and their consequences, and a landscape here would be a map of documents about
building sites handed to a session that cannot build one.

**No site line, and no change signal or corpus delta either** — each is a fact
about a site or a corpus this session has no tool to reach. The framing is
`business-line`, rendered from the record's **name** rather than its id (the id is
opaque and is never shown to the customer) and **read per turn**, because the name
is the thing this conversation exists to change.

`aiStatus` reports both roles on a host that holds a business record, and the
consultant alone on one that does not.

### The business-scoped session

- `businessSessionIdFor(id)` → `business-<id>`, minted from the business's **key**
  and never its name: this is the conversation about renaming the business, and an
  id derived from the name would be moved by the very operation the session exists
  to perform — silently replacing the transcript rather than destroying it visibly.
- `businessBackendName(id)` → `claude+business:<id>`, a different **prefix** rather
  than a different suffix, so a business and a site that happened to share a string
  cannot share a registry entry — which would not merely be wrong, it would hand a
  site conversation the settings surface.
- One manager map, keyed by store and scope, with the business entries prefixed.
  Two maps would be two places to clear on `resetAiHost`.
- `attach` takes the role and the backend as parameters instead of deriving them
  from a slug.
- `openBusinessSession` **takes no subject at all**: the request has already
  resolved to exactly one business, so a parameter would be a value the caller
  could get wrong about a choice it does not have. `POST /api/ai/session` with
  `{scope: "business"}` — one route, because `prompt` and `reattach` already take
  nothing but an id.
- `streamPrompt` takes an early return for a settings turn rather than branching
  through the site path: the change counter, the corpus delta and the per-write
  `site_changed` have no answer for a session with no site.
- A session id naming **another** business is refused. The check is an equality
  against the scope the request already resolved to, not a store read for
  existence — strictly stronger, because a client cannot reach another business's
  conversation even knowing its id.

## Decisions taken during implementation

**The grant travels with the surface; there is no `instances.json` entry.** This
ticket asked for one. [[REQ-237]] settled it the other way while building the
surface, and this follows [[REQ-237]]: `instances.json` is validated in CI against
the declarations *this repository* hands the validator, so a key there for a
surface composed per deployment is a grant nothing can check. The property this
ticket actually wanted is unchanged and is one expression in `host-core.ts` —
`settingsInstanceConfig()` plus the manual's own, and nothing else — and it is
proved on the wire: the tools a real turn is offered are the settings surface's,
with no site operation among them.

**The hostname field is not built.** [[REQ-238]] is still `draft` — there is no
operation to call and nothing true to render. A registrar-shaped box that refused
every entry would be worse than its absence ([[DOC-47]]: never build a fake). The
pane is a list of sections precisely so that field is an append rather than a
rewrite, and the left pane holds the business name alone until [[REQ-238]] lands.

**The settings toolbox is composed in `host-core.ts` rather than through
`createL1Toolbox`.** That function's first act is to construct the L1 surface over
a slug; a settings session has no site. What it does that is general — append the
manual, merge each travelling grant, narrow to the surfaces composed — is three
lines, written out where a reader can see that the settings surface and the manual
are the whole of what this session has.

## Test plan

- `tests/test_UAT_FC_REQ-239_settings_tab.test.ts` (jsdom) — the real builder over
  the installed `webui-*` components: the tab is rightmost and fills, its label is
  a literal nowhere outside `config.js`, it has its own keys, it is blocked with
  the other tabs when a grant lapses, both panes are in its panel and the
  conversation is not the site tab's, typing a name reaches the rename with no turn
  taken, the switcher follows, the effects render as offers with no control beside
  them, an empty name is refused before it is sent, and a business switch moves
  both halves.
- `tests/test_UAT_FC_REQ-239_settings_role.test.ts` (node) — the role through the
  framework's own loader, with the providers this host registers: it loads, an
  unregistered provider name is a load failure, it reuses neither consultant entry,
  the role text is first and the manual last before the marker, the reminder names
  the business and neither a site nor a corpus, and the two session identities and
  backend namespaces cannot collide.
- `tests/test_UAT_FC_REQ-239_settings_session.workers.test.ts` (workerd) — real
  turns through the Worker's route table over real D1: the session names the
  business and not the site beside it, the client and the route agree on the wire
  value, a turn that calls `rename_business` moves the record read back with the
  shipped `businessRecord`, the tools on the wire are the settings surface's with
  no site operation among them, the priming is the settings role's and not the
  consultant's, the framing names the business and never the site, and a session id
  naming another business is refused with nothing moved in either.