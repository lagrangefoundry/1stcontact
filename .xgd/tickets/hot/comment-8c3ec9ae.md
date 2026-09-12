---
uid: comment-8c3ec9ae
id: COMMENT-2843
type: comment
title: Comment on bug BUG-85
created_by: xgd
created_at: '2026-09-12T00:14:49.418413+00:00'
updated_at: '2026-09-12T19:09:42.352581+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-776609f0
  kind: chat_transcript
---

<!-- xgd-turn id="5be409d9-fcd4-40b3-9bad-ada0326b9365-user" -->

<!-- xgd-chat role="user" ts="2026-09-12T00:14:44.069966+00:00" -->
#### You
The first contact site is not showing in the builder. Instead I get: Module not found in catalog: 'account-chrome' v1. Known modules: contact-form@4, carousel@3, account-portal@1, account-chrome@2.

<!-- xgd-turn id="5be409d9-fcd4-40b3-9bad-ada0326b9365-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-12T00:18:55.207560+00:00" -->
#### Claude
Diagnosed. Ticket BUG-85 is populated.

## What's wrong

Your live 1st Contact draft lives in D1, and its `account-chrome` instance (`id: "signin"`) is pinned to **version 1**. Commit `0b5a32d465` (BUG-76) took that module's contract to **v2 and dropped v1 from the catalog**, so the pin no longer resolves — and one unresolvable module instance kills the whole page load.

v2 is genuinely breaking against what's stored:

| v2 requires | stored instance has |
|---|---|
| `sent` slot (required) | absent |
| `error` slot (required) | absent |
| no `sentMessage` config | `sentMessage` present |
| strict config keys | stray `account` key |

**Scope: exactly one orphan.** I audited every stored instance in both stores — the other nine (`contact-form@4` ×8, `account-chrome@2` ×1) all resolve. 1st Contact has no published revisions, so only the draft row is hit.

**Why nothing caught it:** the bump commit *did* migrate `storage/sites/1stcontact/draft/pages/home.json` to v2 — but that's the file-backed fixture (module `id: "chrome"`), a completely separate copy from your D1 draft (`id: "signin"`). The fixture going green is what hid the orphan.

## The systemic gap

A breaking version bump silently orphans every stored instance on the old version. No migration facility, no compatibility window, nothing that fails at bump time — the first signal is the site going dark. `latestModuleVersion`'s own comment claims "existing instances still pin their own version", which is only true if the catalog keeps resolving those pins. It doesn't. DOC-25 defines `version` as "bumped on a breaking contract change" and says nothing about what happens to instances already carrying the old number.

## What I need from you before coding

**1. The repair itself** — I'd rewrite the stored instance as a valid v2: drop `sentMessage`/`account`, and add authored `sent` and `error` cards matching your dialog's own paint (paper fill, accent border, radius 16, 24px padding, 380px max). The `sent` card carries your existing wording: *"Please check your email. If you are already a member we have just sent you a sign up link."* The `error` card needs words that don't exist yet — suggestion: *"That didn't send. Please check your connection and try again."* Happy with both, or want different copy?

**2. How far to close the class.** Three options, increasing cost:

- **(a) Guard only** — a test that walks every stored instance in both stores and asserts it resolves in the catalog. Cheap, would have caught this at bump time, fixes nothing automatically.
- **(b) Guard + declared migrations** — each bump ships an `N-1 → N` migration on the meta, plus a `1c` upgrade pass over a `SiteStore`. The honest fix; real work.
- **(c) Keep old versions resolvable** — I'd argue against: it means keeping v1's component and stylesheet alive forever, and BUG-76 deleted that behaviour deliberately.

My recommendation is **(a) now**, with (b) filed as its own request — the guard is what turns this from "site goes dark" into "the bump fails in CI", which is the whole difference, and (b) is a design decision DOC-25 should settle rather than something to improvise inside a bug fix.

Say the word and I'll cut the branch. I'll back up the D1 row before touching it.

<!-- xgd-turn id="8f325965-5fb9-4bc9-8499-6b5b8bce0286-user" -->

<!-- xgd-chat role="user" ts="2026-09-12T00:22:22.960336+00:00" -->
#### You
Why did only this site break?

<!-- xgd-turn id="8f325965-5fb9-4bc9-8499-6b5b8bce0286-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-12T00:23:41.271988+00:00" -->
#### Claude
Three things had to line up, and they only did here.

**1. It's the only site that has an `account-chrome` instance at all.** The module is gated on `config.capabilities.accounts`, declared per site and never derived. Across all seven sites in D1, exactly one declares it:

```
1stcontact      caps= {'accounts': True}
gigabytealchemy caps= None
xgd             caps= None
alpha           caps= None
unnamed ×2      caps= None
xgd (2nd)       caps= None
```

Everything else is a brochure site whose only module is `contact-form`, which BUG-76 didn't touch. The blast radius of an `account-chrome` bump is "every site with accounts" — a set with one member today.

**2. `contact-form` has never been exposed to this, so it never demonstrated the hazard.** Its last bump (3→4) landed in `3d35dec430` on **2026-07-25**. The earliest site in D1 was created **2026-09-06** — six weeks later. Every stored `contact-form` instance was *born* at v4; there has never been a stored instance on an old `contact-form` pin. The bump that would have taught us this happened before there was any data to break.

**3. The copy that got migrated was the one visible in the repo.** `0b5a32d465` did update `storage/sites/1stcontact/draft/pages/home.json` to v2 — +68 lines adding the `sent`/`error` slots. But that's the file-backed fixture, module `id: "chrome"`. Your draft is a different copy in a different store, module `id: "signin"`. The stored draft was last written `2026-09-11T02:14Z`; the bump landed ~21 hours later and never reached it.

Point 3 is the one that generalises: **a migration done by editing files in the repo can only ever reach the fixtures.** As long as that's how a version bump migrates data, the live stores are structurally guaranteed to be missed — and the only reason this cost one site rather than all of them is point 1. The next bump to `contact-form` hits six.

That sharpens my earlier recommendation: the guard can't just check the repo fixtures, it has to walk a real `SiteStore`. Ticket updated with the analysis.

<!-- xgd-turn id="bfcec88a-d388-4180-b6e5-0fd5b6e19c7b-user" -->

<!-- xgd-chat role="user" ts="2026-09-12T00:24:46.749822+00:00" -->
#### You
What is account-chrome?

<!-- xgd-turn id="bfcec88a-d388-4180-b6e5-0fd5b6e19c7b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-12T00:25:03.133922+00:00" -->
#### Claude
It's the module that provides the two controls a site with accounts owes its visitor: **a way in, and a way to their own portal**. Introduced in REQ-200; the contract lives at `packages/framework/src/modules/account-chrome/meta.ts`.

**What it renders** — four visitor states, all painted into the page at render time, with the serving Worker choosing which is current from the session cookie:

| state | control |
|---|---|
| signed out | a Sign In button that opens a dialog |
| signed in | a link to this site's account portal |
| signed in *and* operates a business | additionally, a link to the builder |
| dialog open | an email field + submit, POSTing to the site's sign-in endpoint |

Plus, since BUG-76, two more slots: `sent` (the confirmation card) and `error` (the network-failure card).

**Four design decisions worth knowing**, because they explain why it looks the way it does:

- **It is not platform chrome.** The obvious build was the apex Worker painting a "Sign In" link into 1st Contact's own corner. DOC-40 §2.1 names that as a failure mode — a capability built for the platform that every customer needs too. Any customer site can have accounts; 1st Contact's is just the first.
- **It's not on every site either.** Gated per site by `config.capabilities.accounts`, never derived. A login link on a brochure site is a dead end. (That gate is exactly why your bug hit one site and not seven.)
- **It's a module rather than Worker markup so L1 owns placement and look.** Each state is a slot, so a site can put the portal link in the footer and Sign In in the header. It ships an L2 preset (`l2/account-chrome.ts`) so you don't have to author four subtrees just to get a Sign In link.
- **It authenticates nothing and gates nothing.** It renders every state and lets the Worker pick. No published content varies by who's looking — the only verb is the address POST.

There's one deliberate carve-out: the `<label>` on the email field is an *invariant* element, clipped to 1×1px and not bindable from L1 — an accessibility obligation, not taste. The visitor reads the prompt via `config.emailLabel` + `labelMode`. That invariant was mis-documented, which is what kicked off BUG-76 and the v2 bump your draft is now stranded behind.

<!-- xgd-turn id="98629a2c-f743-4692-9e38-ce30f14156fa-user" -->

<!-- xgd-chat role="user" ts="2026-09-12T00:28:12.076410+00:00" -->
#### You
ok yes please fix the data and then I would love to get 2b - I'm not sure if I understand how that could be automated exactly?

<!-- xgd-turn id="98629a2c-f743-4692-9e38-ce30f14156fa-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-12T00:30:25.084621+00:00" -->
#### Claude
Good — let me unblock the site first, then build 2b properly. Starting with the data.

**Data fixed.** Every stored pin now resolves. The original row is backed up at `.xgd/tmp/bug85/home-v1-backup.json` — I'll promote that to a committed test fixture when I build 2b, since it's the only surviving example of a real orphaned instance.

What I changed in that one instance: `version` 1→2, dropped `sentMessage` and the never-declared `account` key, and added `sent` + `error` cards built from **your dialog's own paint** (paper fill, accent border, radius 16, 380px max, ink text at 15/22) rather than the preset's hardcoded `#ffffff`/radius-8 defaults. Your `sentMessage` wording carried into the `sent` card verbatim; `error` says *"That didn't send. Please check your connection and try again."* I verified it against `validateBehaviorConfig`/`validateBehaviorSlots` before writing. Restart the dev server if it's holding a cached page.

---

## How 2b automates — and the part that honestly can't

The thing to be clear about first: **a migration cannot be derived from the data.** Look at what v1→v2 actually needs:

| change | derivable? |
|---|---|
| drop `account` | yes — trivially |
| `labelMode` default | yes — defaults already fill in |
| `sentMessage` → `sent` slot | **partly** — the words carry; the card's design doesn't exist in v1 |
| new `error` slot | **no** — zero source data; v1 had a hardcoded string in the component |

So nothing can infer the migration. What *can* be automated is everything around it: giving it a declared home, applying it everywhere, and refusing to let a bump land without one.

**1. Declare it beside the contract that changed.** A new optional field on `BehaviorMeta`, keyed by the version it *produces*:

```ts
migrations?: Record<number, (prev: BehaviorInstance) => BehaviorInstance>
```

`account-chrome` would carry `{ 2: v1ToV2 }`. The author writing the breaking change writes the migration in the same commit — they're the only one who knows what the old field meant. The L2 preset is what makes the hard rows tractable: `accountChromePreset()` already emits vetted `sent`/`error` cards, so `v1ToV2` is "take the preset's card, substitute the author's `sentMessage` words" — roughly the function I just ran by hand.

**2. Apply it as an explicit pass over the `SiteStore` port.** `upgradeInstance` walks `stored.version + 1 … latestModuleVersion(type)`, applying each migration in turn (so a v1 instance can cross two bumps), then validates the result against the target contract and refuses to write if it doesn't pass. Wrapped in a `1c` verb, read-through-port/write-through-port exactly like `importSite` — so **the same code upgrades the file store and D1**, which is precisely the gap that caused this.

I'd reject the tempting alternative of upgrading silently on read: the stored data stays stale forever, the bug becomes permanent and invisible, and every read pays for it.

**3. The guard — two of them, and this is the real automation.**

- **A pure CI check, no data required:** for every module in the catalog, every version from 1 to current must have a migration path to current. Bump `account-chrome` to 3 without declaring `migrations[3]` and the build fails *at bump time*. This is what converts "site goes dark next Tuesday" into "your commit doesn't compile."
- **A store check:** a `1c` verb reporting any stored instance whose pin doesn't resolve — the audit I ran by hand at the top of this session, as a command. This one has to run against a **real** store, not repo fixtures; the fixture being green is exactly what hid your bug.

The honest limit: (3) can force a migration to *exist*, but it can't verify the migration is *good*. That stays a UAT per bump — which is fine, because that's one test written by the person who already understands the change.

---

Before I cut the branch, one scoping call: **does the upgrade pass write, or only report?** My instinct is `1c modules upgrade --dry-run` by default, printing the diff per instance, with `--write` to commit it — a migration that silently rewrites live site data on first run is not something I'd want to ship without a look. Agree? And should the CI guard land as a blocking test now, given it'll fail immediately until `account-chrome`'s `migrations[2]` is written?

<!-- xgd-turn id="60e650e0-5cda-4e7a-a8fb-74b8bddc299d-user" -->

<!-- xgd-chat role="user" ts="2026-09-12T00:39:54.372946+00:00" -->
#### You
Agree go ahead

<!-- xgd-turn id="60e650e0-5cda-4e7a-a8fb-74b8bddc299d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-12T01:01:31.514695+00:00" -->
#### Claude
Scoping the ticket now with the full behaviour spec, so the UATs have language to trace to.

Now the framework layer — `migrations` on the contract plus `upgradeInstance`.

Adding the `migrations` field to the contract:

Now the upgrade module:

Now the `account-chrome` v1→v2 migration itself:

Exporting the upgrade surface from both entries:

Now the port-level pass over `SiteStore`:

Clean. Now the CLI verb:

Adding `editModuleUpgrade` to the edit surface, then wiring the CLI:

Now wiring the CLI dispatch and usage text:

Now the Worker route so the pass can reach D1 — the store that actually broke:

Now the UATs. Starting with the guard and the instance-level behaviour:

Guard is red exactly as expected — and broader than `account-chrome`: `contact-form` v2–4 and `carousel` v2–3 have no migrations either. Those are bumps whose old contracts are long gone, for versions nothing has ever been stored at. That needs an explicit declaration rather than a silent exemption:

Now declaring the extinct versions on the two modules, with the evidence:

Parity check: the migration reproduces the hand repair **exactly**, except one line — and that difference is instructive:

Now the port-level and route UATs:

Now the route UAT — how are router tests structured here?

Now updating the ticket with the `migrationsFrom` behaviour, which the guard forced into existence:

Now the full suite, to check nothing else regressed:

Two of the four are mine. Fixing:

Workers suite fully green. Verifying the CLI path end-to-end against the real filesystem store:

Done — both parts landed. BUG-85 is `free_coded` at `efba90de`, merged into `xgd-working`.

## Your site

Fixed and verified earlier — every stored pin in D1 resolves. Restart the dev server if it's still holding a cached page.

## 2b, as built

**The migration can't be derived, so the design doesn't pretend it can.** `BehaviorMeta.migrations` holds a hand-written function keyed by the version it produces; `account-chrome` carries `{ 2: accountChromeV1ToV2 }`. Everything around it is automated:

- **`upgradeInstance`** chains the steps, then validates against the target contract and **throws** if the result fails it. Undeclared keys are dropped *after* the migrations have read them (v1→v2 needs `sentMessage`) and every one is named in the report.
- **`upgradeSiteModules`** runs port-to-port over `SiteStore`, read-only unless asked. Its default mode *is* the audit.
- **`1c module upgrade <slug> [--write]`** drives the filesystem store; **`POST /api/modules/upgrade`** drives D1 from inside the Worker.
- **`missingMigrations()`** is the guard — pure function of the catalog, so a bump without its migration goes red in the commit that does the bumping.

**A strong result worth flagging:** running the new migration against the captured orphan reproduces my hand repair *byte for byte*, with exactly one difference — the error card's wording. The migration uses v1's actual hardcoded string (verified at `component.ts:123` in `9ff59758e8`), on the principle that an upgrade changes where words are authored, not what the visitor reads. Your site keeps the wording you approved, and because the migration only authors a card where none exists, re-running never clobbers it.

## One thing I had to design that wasn't in the plan

Landing the guard immediately showed it demands more than `account-chrome`'s missing step: `contact-form` v2–4 and `carousel` v2–3 have no migrations either. Writing those means inventing transformations of contracts that no longer exist, for data in no store — untestable code whose only effect is a green guard. But *omitting* them silently is exactly how this bug shipped.

So I added **`migrationsFrom`**: the oldest version a module still migrates from, defaulting to 1. Below it, versions are *declared extinct* — a number a reviewer sees, carrying its evidence in the comment (last `contact-form` bump 2026-07-25, earliest cloud site 2026-09-06, audit found ten instances all at v4). A floor is a **claim about the world**, not an exemption, so an instance found below one is refused with its own message telling you to lower the number and write the steps.

## Test state

New: 35 assertions across five UATs. Full workers suite **759/759 green** (including the new route against real D1). Node suite: two failures I introduced and fixed (the origin-route probe and an unscrubbed error path caught by the REQ-146 boundary test — good catch by that test), plus `AC961`, the known dist-assets rebuild race that passes in isolation.

Two pre-existing failures on `xgd-working` are untouched by this work — I confirmed both fail identically on the unmodified tree: `bug32-webui-scope-rebrand` and `test_UAT_FC_BUG-67_backend_settings`.

<!-- xgd-turn id="28fd983f-bd2c-4de1-894e-f41b65135d7b-user" -->

<!-- xgd-chat role="user" ts="2026-09-12T19:09:41.472454+00:00" -->
#### You
please complete the free-coding of this ticket

Blocking details:
- branch `free-BUG-85` still exists at `/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-85`
- branch HEAD: `efba90deab3082da7d0c81d7ac2a04b27a1694a9`

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-chat-end -->