---
uid: request-9533ae5a
id: REQ-368
type: request
title: 'Profile portal: multiple login emails, validation, and primary'
created_by: EPIC-23
created_at: '2026-10-03T18:32:40.956444+00:00'
updated_at: '2026-10-03T22:13:15.430956+00:00'
completed_at: null
last_field_updated: body
status: ready_to_reconcile
fields:
  epic_parent: epic-ee37a03f
  priority: medium
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-4765f10a
  commits:
  - working_sha: 7301b15c0da7de319dcaeeda56a200063a0d989c
    reconcile_sha: null
    main_sha: null
  - working_sha: 07c7b8674198a528d5d26a7c6395e22b1d70da4d
    reconcile_sha: null
    main_sha: null
  version: 0.2.448
  story_points: 5
---

Child of [[EPIC-23]]. The epic holds the cross-feature context and the decisions log.

# Multiple login emails (profile portal)

### What the account owner gets

- On the **profile portal**, a list of the addresses they can sign in with, with **Add** and **Remove**.

- A magic link sent to **any** address on the list signs into the same account.

- Each address shows whether it is **validated**. Validated means at least one sign-in has completed from that address.

### Rules

- **At least one validated address is always retained.** The remove control refuses to remove the last validated address, and so does the server.

- **An address belongs to one account only.** Adding an address that already signs into another account is refused. The wording must not confirm that the other account exists (existence oracle, see the `user_emails` comments).

- **Adding an address does not validate it.** An unvalidated address can receive a magic link. Signing in through that link is what validates it.

- **Primary (decided 2026-10-03):** exactly one address is primary (`idx_user_emails_one_primary`). The platform sends its mail there, and it is the address you are shown as. **It defaults to the first address you entered.** On the profile portal, a **Make primary** control next to each **validated** address lets you choose a different one. An unvalidated address cannot be made primary. You cannot remove the primary address until you have made another address primary.

### What already exists

- **Storage:** `user_emails` already holds many addresses per person, with one primary.

- **Sign-in:** `subjectFor` (`sessions.ts:348`) already signs in by **any** address in the platform tenant. So "a link to any listed address signs in" is already true for the server.

### What is missing

- **Validation tracking.** Nothing records verification per address. `login_tokens` does not store the address the link was sent to, so redeeming a link cannot tell which address was proved. This item needs:

- the address recorded where the link is issued

- a `user_emails.verified_at` column, stamped when that link is redeemed

- **The first self-edit surface on **`/account`**.** The profile portal (`portal.ts`, `packages/framework/src/modules/account-portal`) is read-only by design. Nobody can edit their own profile today. The only address-editing path is `setPersonRecord` (`people.ts:975`), which lets an owner rewrite a contact's **primary** address. This item adds add and remove for your own addresses, Make primary, and the last-validated rule, all enforced by the server.

## What landed (2026-10-03)

### Profile portal (`/account`)

- A new **"Addresses you sign in with"** section on the account portal. It lists every address on the account, primary first. Each row says **Primary** (when it is), and **Validated** or **Not validated yet — sign in with it to validate it**.

- A row shows **Make primary** only when the address is validated and not already primary, and **Remove** only when removing it is allowed. There is no disabled control: a row the rules protect simply has no button.

- Below the list, one form adds another address.

- When a change is refused, the section shows the server's own reason and leaves the list as it was. A successful change redraws the list from the server's answer. A primary change also re-reads the "signed in as" line.

- The section stays hidden until the endpoint answers. If the endpoint fails, only this section is lost; the rest of the portal is unaffected.

### Endpoint: `GET`/`POST /api/account/emails`

- It needs a signed-in person, and it reads that person from the session, never from the request. With nobody signed in, the gate refuses the request.

- `GET` returns `{emails: [{id, email, primary, validated, removable, canMakePrimary}]}`. The two permission flags are computed by the server.

- `POST {action: "add", email}` adds an address. It arrives **unvalidated**. It becomes primary only if the person has no primary at all.

- `POST {action: "remove", id}` refuses (409) to remove the primary address, and refuses (409) to remove the last validated address. The rules sit inside the `DELETE` itself, so two removals at once cannot together take the last validated address.

- `POST {action: "primary", id}` makes an address primary. It refuses (409) an unvalidated address. The old primary is cleared and the new one set in one transaction.

- An address held by **another account** is refused (409) with the same wording any unavailable address gets: "That address cannot be added to your account." The wording does not confirm that the other account exists. Adding an address that is already on your own list gets its own message, because that list is already visible to you.

- An address id that belongs to somebody else answers 404, exactly as an id that does not exist.

- Every change moves `users.updated_at`, so the operator's Contacts pane sees it.

### Validation tracking

- Migration `0026_login_email_verification.sql` adds `user_emails.verified_at` and a host table `login_token_addresses (token_id, email_id)`.

- The component's `login_tokens` table is left untouched. It holds no address by design, and adding a column would fork the component's schema.

- When a link is mailed, the host records which address it went to. The hook is inside `passwordlessFor`'s mail port, so it covers both sign-in links and invite links.

- When a link is redeemed, `redeemSignIn` stamps `verified_at` on that address. This is now the only redeem path, and it stamps only once (`COALESCE(verified_at, ...)`). The token row is then deleted.

- `purgeSessions` sweeps rows whose token the component has already reaped.

- **Backfill:** an existing primary address is marked validated (at `first_seen_at`) when its person has already been admitted. Before this change, nobody could hold a second address of their own, so anyone already admitted had signed in through their primary.

### Primary

- The primary address is what `PRIMARY_EMAIL_SQL` reads. So a new primary is immediately where platform mail goes, and the session now resolves to it as the address you are shown as.

### Supersedes (intent change, deliberate)

The portal's contract used to make exactly one `POST` to exactly two declared endpoints. This ticket makes it two `POST`s to three endpoints. The new config field is `emails`, with the label `emailsLabel` and an invariant `addresses` control. These assertions were updated to the new shape:

- REQ-245 `test_UAT_FC_REQ-245_the_client_still_has_no_verb_that_destroys_or_grants`

- REQ-183 `test_UAT_FC_REQ-183_the_module_has_no_verb_that_could_destroy_anything`

There is still no `DELETE`, `PUT` or `PATCH`, and nothing that deletes the account or grants access. `portalHomePage` and `portalFallbackStore` now take the third endpoint.

## Test plan

UATs `test_UAT_FC_REQ-368_*`, one per rule above: the happy path, plus each refusal the body names.

- `tests/test_UAT_FC_REQ-368_sign_in_addresses.workers.test.ts` (real Worker, real D1, links read from the recorded message and redeemed by POST):

- an added address signs into the same account and is validated by doing so

- an address held by another account is refused without saying so

- a validated address can be made primary, and the old one then removed

- an unvalidated address cannot be made primary

- the primary cannot be removed until another address is primary

- the last validated address cannot be removed

- an unvalidated address can be removed

- another person's address cannot be removed or made primary

- nobody signed in can read or change any address

- `tests/test_UAT_FC_REQ-368_portal_addresses.test.ts` (the rendered default portal, plus `client.js` in JSDOM):

- the default portal names the endpoint and draws nothing before it answers

- each row shows whether it is validated, and only the controls it allows

- Add posts the action and the address and nothing else, then redraws

- a refusal shows the endpoint's reason and leaves the list

- an unreachable endpoint costs this section and nothing else