---
uid: report-8a166a9b
id: REPORT-11110
type: report
title: 'Report: mode_override for story-7b1025b8'
created_by: xgd
created_at: '2026-11-07T07:48:13.515480+00:00'
updated_at: '2026-11-07T08:01:49.289724+00:00'
completed_at: null
last_field_updated: conformance_verdict
fields:
  report_kind: mode_override
  subject_uid: story-7b1025b8
  anchor_ticket: bundle-7988e925
  rule: code_frozen
  batch_index: 0
  parent_report_uid: report-72de7cec
  quality_mode: reconcile
  justification: REQ-199, an intent in this bundle's scope, states 'the selection
    clears only once something was sent' and lists 'every selected contact gets an
    outcome line, and the selection survives a send in which nothing was sent' among
    its acceptance points; AC-2339 encodes it and its UAT fails because people.js
    clears the selection unconditionally after every send. The test is right and the
    code is wrong; the change is confined to making that clear conditional.
  files:
  - apps/control-app/src/builder/people.js
  rung: 1
  tip_evidence:
  - file: apps/control-app/src/builder/people.js
    lines: 1566-1602
  external_cause: null
  planner_trust_boundary: false
  granted_head: 04ce65ae31b087fd65dd62e55cbb88181a514bbf
  files_touched:
  - apps/control-app/src/builder/people.js
  - tests/reconciliation-identity-accounts.workers.test.ts
  - tests/reconciliation-identity-invite-control.test.ts
  - tests/reconciliation-identity-invite-provision-admission.workers.test.ts
  - tests/reconciliation-identity-person-addresses-names.workers.test.ts
  - tests/support/add-and-invite.ts
  - tests/test_reconciliation_contacts_add_invite_tab.test.ts
  unnamed_files_touched: []
  trust_boundary_touched: false
  trust_boundary_matches: []
  trust_boundary_notes: []
  trust_boundary_mismatch: false
  conformance_verdict: pass
  conformance_findings: []
---

# Mode override granted: code_frozen

REQ-199, an intent in this bundle's scope, states 'the selection clears only once something was sent' and lists 'every selected contact gets an outcome line, and the selection survives a send in which nothing was sent' among its acceptance points; AC-2339 encodes it and its UAT fails because people.js clears the selection unconditionally after every send. The test is right and the code is wrong; the change is confined to making that clear conditional.

Planner instructions for the batch:

Two different fixes in one batch. (1) PRODUCTION FIX, the only code change allowed: in apps/control-app/src/builder/people.js, the invite modal's Send handler (reference lines 1576-1580) calls selected.clear() and syncInvite() unconditionally after transport.invite returns. REQ-199 requires that 'the selection clears only once something was sent' and that 'the selection survives a send in which nothing was sent'. Make the clear conditional on at least one result having actually gone out, so an all-refused send leaves every row checked and Invite enabled. Keep the existing close-on-all-sent (BUG-318) and stay-open-on-any-refusal behaviour. Extend AC2339's tab UAT so the mixed send also asserts the selection is cleared when something was sent; at the moment a fix that never clears would pass. (2) TEST REALIGNMENT, tests only: the ACs are already rewritten to the new surface (AC-2169/1743/1744/2171/2172 at 07:21Z; AC-2173 and AC-2176 in this plan; AC-2175 is superseded). Read each AC body before touching its test. (a) Delete the AC2175 UAT in tests/reconciliation-identity-invite-control.test.ts: its AC is superseded and the Add-dialog behaviour it described is proven by AC2336. (b) In tests/reconciliation-identity-accounts.workers.test.ts and tests/reconciliation-identity-invite-provision-admission.workers.test.ts, replace every invitePerson(identityEnv(), scope, {email}) imported from people.ts, which no longer exports it, with addContact from people.ts, plus invitePeople from invites.ts where the AC needs the invited transition, using a recording mail port the way tests/test_reconciliation_contacts_add_invite.workers.test.ts does. (c) In all three workers files, replace postInvite(token, {email}) with the add route followed by the invite route posting {ids:[contactId]}. tests/test_reconciliation_contacts_add_invite.workers.test.ts already passes on the new surface: reuse its helpers and pattern rather than writing a third. Where that file already proves an AC (AC2169, AC1743, AC1744, AC2171, AC2172, AC2248, AC2253, AC2339), the old-file UAT is a stale duplicate and may be deleted. Where it does not (AC2170, AC2173, AC2176, AC2247, AC2257, AC1742, AC2115, AC2254, AC1745, AC1759, the 10 orphans), the old UAT must be moved onto the new surface and end green, because those ACs have no other evidence. (d) AC2173: assert per the rewritten AC. The invite writes no membership and no grant, an invitee with member_since null whose account owns no business is admitted with an EMPTY business set, not refused (REQ-203, identity.ts admit signingUp branch), provisioning then lists exactly that business, and a withdrawn membership still refuses no_membership. (e) AC2176: add, invite by id, provision, sign in, accept terms, exactly one business (accept does not provision a second, because ensureOwnBusiness is idempotent on tenants.owner_account_id), /account 200, provisioning route 404. (f) AC1745 and AC1759: once the import and invite plumbing is fixed, re-check their assertions against BUG-62 (commit d1cac8424d, 'a refusal that claims nothing ended, and says why in the log'). If the logged refusal shape changed, assert the reference shape the AC describes. Do not edit ACs. The .workers.test.ts suites need local port binding to run.

## Diff

```diff
diff --git a/apps/control-app/src/builder/people.js b/apps/control-app/src/builder/people.js
index 09bd36e00e..7657e93dfb 100644
--- a/apps/control-app/src/builder/people.js
+++ b/apps/control-app/src/builder/people.js
@@ -995,15 +995,19 @@ export function createPeoplePanel(options = {}) {
             subjectField.value,
             bodyField.value,
           )
-          await refresh()
-          said.replaceChildren(...outcomeLines(answer.results ?? []))
-          said.hidden = false
           // THE SELECTION IS CLEARED ONLY ONCE SOMETHING WAS SENT, and the
           // dialog stays open on top of the report. An operator who has just
           // mailed nine people and refused one needs to read which one; closing
-          // over the answer is how that gets missed.
-          selected.clear()
-          syncInvite()
+          // over the answer is how that gets missed. A send in which nothing
+          // went out (every result refused or failed) leaves every tick in
+          // place, so the operator can fix those rows and send again
+          // ([[REQ-199]]). Cleared before the refresh, so the redrawn rows
+          // show the selection as it now is.
+          const results = Array.isArray(answer.results) ? answer.results : []
+          if (results.some((result) => result && result.status === 'sent')) selected.clear()
+          await refresh()
+          said.replaceChildren(...outcomeLines(results))
+          said.hidden = false
         } catch (err) {
           said.replaceChildren(
             el('p', 'builder-people__outcome', err instanceof Error ? err.message : String(err)),
diff --git a/tests/reconciliation-identity-accounts.workers.test.ts b/tests/reconciliation-identity-accounts.workers.test.ts
index 5f866df3f8..7e364b0d00 100644
--- a/tests/reconciliation-identity-accounts.workers.test.ts
+++ b/tests/reconciliation-identity-accounts.workers.test.ts
@@ -13,7 +13,8 @@ import {
   type Admission,
   type IdentityEnv,
 } from '../apps/control-app/src/identity'
-import { invitePerson, openGrant, personDetail } from '../apps/control-app/src/people'
+import { openGrant, personDetail } from '../apps/control-app/src/people'
+import { addAndInvite } from './support/add-and-invite'
 import { seedContact } from './support/contact'
 import { applySchema } from './support/d1-site-factory'
 import { inviteAccount } from './support/invite-account'
@@ -23,8 +24,9 @@ import { inviteAccount } from './support/invite-account'
  * people belong to it** ([[REQ-194]]).
  *
  * WHAT THIS FILE PROVES. The account criteria the story gained or had restated
- * when the account became a table of its own: the invite mints an account beside
- * the person and the schema refuses a person without one (AC-2253); an account may
+ * when the account became a table of its own (the add minting an account beside
+ * the person, AC-2253, is proved on the add route by
+ * `test_reconciliation_contacts_add_invite.workers.test.ts`): an account may
  * hold several people and provisioning makes all of them owners (AC-2254); the
  * role is a foothold read by one ownership question only (AC-2257); a business key
  * is opaque and distinct from its owning account's key (AC-1741); provisioning
@@ -39,7 +41,8 @@ import { inviteAccount } from './support/invite-account'
  *
  * WHAT MAKES IT EVIDENCE. Every case runs inside workerd against a real D1 with
  * the deployed baseline applied by the helper the store suites use. Behaviour is
- * driven through the shipped calls (`invitePerson`, `provisionBusiness`, `admit`,
+ * driven through the shipped calls (`addContact` then `invitePeople` by id —
+ * the `addAndInvite` fixture, [[REQ-199]] — `provisionBusiness`, `admit`,
  * `openGrant`, `personDetail`, `ensurePlatformOperator`), and rows are read back
  * out of D1 rather than trusted from a return value. The only direct writes are
  * the ones a criterion demands: the second person on an account (the shape v1
@@ -109,56 +112,10 @@ beforeAll(async () => {
 // ─── The account record ─────────────────────────────────────────────────────
 
 describe('the account is a record people belong to', () => {
-  it('test_UAT_AC2253_an_invite_mints_an_opaque_account_and_the_schema_refuses_a_person_without_one', async () => {
-    const invited = await invitePerson(identityEnv(), { businessId: PLATFORM }, { email: anEmail() })
-    expect(invited.created).toBe(true)
-
-    // Read the person's account back from storage, not from the return value.
-    const accountId = await accountOf(invited.person.id)
-    expect(accountId).toBe(invited.person.accountId)
-    expect(accountId).toMatch(/^acct_[0-9a-f]{32}$/)
-
-    const account = await accountById(identityEnv(), accountId)
-    expect(account?.tenant_id, 'the account belongs to the inviting business').toBe(PLATFORM)
-    expect(account?.status).toBe('active')
-    expect(await peopleOnAccount(identityEnv(), accountId)).toEqual([invited.person.id])
-
-    // Break glass gives a newly created operator an account of their own too.
-    const operatorEmail = anEmail()
-    await ensurePlatformOperator({ ...identityEnv(), PLATFORM_ADMINS: operatorEmail }, operatorEmail)
-    const operator = await env.DB.prepare(
-      'SELECT u.id AS id, u.account_id AS account_id FROM users u ' +
-        'WHERE u.id = (SELECT user_id FROM user_emails WHERE tenant_id = ? AND email = ?)',
-    )
-      .bind(PLATFORM, operatorEmail)
-      .first<{ id: string; account_id: string }>()
-    expect(operator?.account_id).toMatch(/^acct_[0-9a-f]{32}$/)
-    expect(await peopleOnAccount(identityEnv(), operator!.account_id)).toEqual([operator!.id])
-
-    // The schema refuses a person with no account, and one naming a missing account.
-    const peopleBefore = await count('users')
-    await expect(
-      env.DB.prepare(
-        'INSERT INTO users (id, tenant_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
-      )
-        .bind(newId('usr'), PLATFORM, 'active', '2026-01-01', '2026-01-01')
-        .run(),
-    ).rejects.toThrow()
-    await expect(
-      env.DB.prepare(
-        'INSERT INTO users (id, tenant_id, account_id, status, created_at, updated_at) ' +
-          'VALUES (?, ?, ?, ?, ?, ?)',
-      )
-        .bind(newId('usr'), PLATFORM, newId('acct'), 'active', '2026-01-01', '2026-01-01')
-        .run(),
-    ).rejects.toThrow()
-    expect(await count('users')).toBe(peopleBefore)
-  })
-
   it('test_UAT_AC2254_an_account_holding_two_people_makes_both_owners_of_its_new_business', async () => {
     const firstEmail = anEmail()
     const secondEmail = anEmail()
-    const first = await invitePerson(identityEnv(), { businessId: PLATFORM }, { email: firstEmail })
+    const first = await addAndInvite(identityEnv(), { businessId: PLATFORM }, { email: firstEmail })
     const accountId = first.person.accountId
     // The shape v1 does not build: a second person on the same account, as a row.
     const second = await seedContact(identityEnv(), {
@@ -206,7 +163,7 @@ describe('the account is a record people belong to', () => {
     expect([...identity.matchAll(/role === 'owner'/g)]).toHaveLength(1)
 
     // People sharing an account are not told apart by role: both hold `owner`.
-    const first = await invitePerson(identityEnv(), { businessId: PLATFORM }, { email: anEmail() })
+    const first = await addAndInvite(identityEnv(), { businessId: PLATFORM }, { email: anEmail() })
     const second = await seedContact(identityEnv(), {
       tenantId: PLATFORM,
       email: anEmail(),
@@ -252,7 +209,7 @@ describe('a business is owned by an account', () => {
   })
 
   it('test_UAT_AC1742_provisioning_writes_an_account_owned_business_grant_and_unnamed_starter_site', async () => {
-    const invited = await invitePerson(identityEnv(), { businessId: PLATFORM }, { email: anEmail() })
+    const invited = await addAndInvite(identityEnv(), { businessId: PLATFORM }, { email: anEmail() })
     const accountId = invited.person.accountId
 
     // The invite wrote no tenant, membership, grant or site for that account.
@@ -328,7 +285,7 @@ describe('a business is owned by an account', () => {
 
     // The invite writes no grant.
     const before = await count('entitlements')
-    const invited = await invitePerson(identityEnv(), { businessId: PLATFORM }, { email: anEmail() })
+    const invited = await addAndInvite(identityEnv(), { businessId: PLATFORM }, { email: anEmail() })
     expect(await count('entitlements'), 'the invite wrote a grant').toBe(before)
     const accountId = invited.person.accountId
 
@@ -391,7 +348,7 @@ describe('a business is owned by an account', () => {
 
   it('test_UAT_AC2255_a_business_names_its_owning_account_the_platform_is_owned_by_nobody_and_no_business_key_reads_acct', async () => {
     // Provisioned through invite-then-provision: the owner is the account, not the person.
-    const invited = await invitePerson(identityEnv(), { businessId: PLATFORM }, { email: anEmail() })
+    const invited = await addAndInvite(identityEnv(), { businessId: PLATFORM }, { email: anEmail() })
     const accountId = await accountOf(invited.person.id)
     const business = await provisionBusiness(identityEnv(), { accountId, name: 'Owned Ltd' })
     expect(business.businessId).toMatch(/^biz_[0-9a-f]{32}$/)
@@ -455,7 +412,7 @@ describe('provisioning needs a real payer', () => {
 
     // The operator's lookup takes an address, in any case, and answers with the account.
     const email = anEmail()
-    const invited = await invitePerson(identityEnv(), { businessId: PLATFORM }, { email })
+    const invited = await addAndInvite(identityEnv(), { businessId: PLATFORM }, { email })
     const accountId = await accountOf(invited.person.id)
     await provisionBusiness(identityEnv(), { accountId, name: 'Looked Up Ltd' })
     const found = await findAccount(identityEnv(), email.toUpperCase())
diff --git a/tests/reconciliation-identity-invite-control.test.ts b/tests/reconciliation-identity-invite-control.test.ts
deleted file mode 100644
index b119541437..0000000000
--- a/tests/reconciliation-identity-invite-control.test.ts
+++ /dev/null
@@ -1,169 +0,0 @@
-// @vitest-environment jsdom
-/**
- * STORY-7b1025b8 — the invite control on the Users tab (REQ-186).
- *
- * Mounted against the actually-installed panel; the only double is the HTTP
- * transport, because that is the network. The double implements the invite as
- * the origin does — a transition on the row for that address, inserting only
- * when there is none — so a panel that reported every invite the same way would
- * fail here.
- */
-
-import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
-import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
-
-let createPeoplePanel: (opts?: Record<string, unknown>) => never
-
-if (!WEBUI_INSTALLED) console.warn(`STORY-7b1025b8 invite-control suite skipped: ${WEBUI_SKIP_REASON}`)
-
-const settle = () => new Promise((resolve) => setTimeout(resolve, 0))
-
-function memoryStorage() {
-  const map = new Map<string, string>()
-  return {
-    getItem: (k: string) => map.get(k) ?? null,
-    setItem: (k: string, v: string) => void map.set(k, String(v)),
-    removeItem: (k: string) => void map.delete(k),
-    clear: () => map.clear(),
-    key: (i: number) => [...map.keys()][i] ?? null,
-    get length() {
-      return map.size
-    },
-  }
-}
-
-interface Person {
-  id: string
-  email: string
-  displayName: string | null
-  status: string
-  invitedAt: string | null
-  firstSeenAt: string | null
-  lastSeenAt: string | null
-  termsAcceptedAt: string | null
-  pipelineStage: string
-  createdAt: string
-}
-
-const person = (over: Partial<Person> & { id: string; email: string }): Person => ({
-  displayName: null,
-  status: 'active',
-  invitedAt: null,
-  firstSeenAt: null,
-  lastSeenAt: null,
-  termsAcceptedAt: null,
-  pipelineStage: 'lead',
-  createdAt: '2026-09-01T09:00:00.000Z',
-  ...over,
-})
-
-function transportOver(people: Person[], canInvite: boolean) {
-  const rows = people.map((p) => ({ ...p }))
-  return {
-    rows,
-    list: async () => ({ people: rows.map((p) => ({ ...p })), canInvite, canFulfil: false }),
-    item: async (id: string) => ({ person: { ...rows.find((p) => p.id === id)! }, operates: [], grants: [] }),
-    saveStatus: async () => ({}),
-    grant: async () => ({}),
-    revoke: async () => ({}),
-    fulfil: async () => ({}),
-    invite: async (email: string, displayName: string | null) => {
-      const normalised = String(email ?? '').trim().toLowerCase()
-      if (normalised === '') throw new Error('An invite needs an email address.')
-      const existing = rows.find((p) => p.email === normalised)
-      if (existing) {
-        existing.invitedAt ??= '2026-09-02T10:00:00.000Z'
-        existing.pipelineStage = 'invited'
-        return { created: false, person: { ...existing } }
-      }
-      const made = person({
-        id: `usr_${rows.length + 1}`,
-        email: normalised,
-        displayName: displayName || null,
-        invitedAt: '2026-09-02T10:00:00.000Z',
-        pipelineStage: 'invited',
-      })
-      rows.push(made)
-      return { created: true, person: { ...made } }
-    },
-  }
-}
-
-beforeAll(async () => {
-  if (WEBUI_INSTALLED) {
-    ;({ createPeoplePanel } = await import('../apps/control-app/src/builder/people.js'))
-  }
-  globalThis.ResizeObserver ??= class {
-    observe() {}
-    unobserve() {}
-    disconnect() {}
-  } as never
-})
-
-let root: HTMLElement
-beforeEach(() => {
-  document.body.replaceChildren()
-  root = document.createElement('div')
-  document.body.append(root)
-})
-
-async function panelOver(canInvite: boolean) {
-  const transport = transportOver(
-    [person({ id: 'usr_1', email: 'known@example.test', displayName: 'Known' })],
-    canInvite,
-  )
-  const panel = createPeoplePanel({ storage: memoryStorage(), transport })
-  root.append(panel.element)
-  await panel.refresh()
-  return transport
-}
-
-const inviteButton = () => root.querySelector('.builder-people__invite') as HTMLButtonElement | null
-const dialog = () => ([...root.querySelectorAll('.builder-modal')].at(-1) ?? null) as HTMLElement | null
-const said = () => root.querySelector('.builder-people__invite-said') as HTMLElement
-
-async function submitInvite(email: string) {
-  ;(root.querySelector('.builder-people__invite-email') as HTMLInputElement).value = email
-  ;(root.querySelector('.builder-people__invite-name') as HTMLInputElement).value = ''
-  const buttons = [...dialog()!.querySelectorAll('button')] as HTMLButtonElement[]
-  buttons.find((b) => b.textContent === 'Invite')!.click()
-  await settle()
-  await settle()
-}
-
-describe.skipIf(!WEBUI_INSTALLED)('the invite control', () => {
-  it('test_UAT_AC2175_the_invite_control_is_owner_only_and_its_dialog_says_no_message_is_sent', async () => {
-    // Hidden for a caller who may not invite.
-    await panelOver(false)
-    expect(inviteButton(), 'the control was not rendered at all').not.toBeNull()
-    expect(inviteButton()!.hidden).toBe(true)
-
-    // Shown, with the list controls, for one who may.
-    root.replaceChildren()
-    await panelOver(true)
-    expect(inviteButton()!.hidden).toBe(false)
-    expect(root.querySelector('.builder-people__filter')?.contains(inviteButton())).toBe(true)
-
-    inviteButton()!.click()
-    expect(dialog(), 'the invite dialog did not open').not.toBeNull()
-    expect(dialog()!.querySelector('.builder-people__invite-email')).not.toBeNull()
-    expect(dialog()!.querySelector('.builder-people__invite-name')).not.toBeNull()
-    expect(dialog()!.textContent ?? '').toMatch(/no message is sent/i)
-
-    // A new address is reported as newly added.
-    await submitInvite('new@example.test')
-    expect(said().hidden).toBe(false)
-    expect(said().textContent).toBe('new@example.test is invited.')
-
-    // An already-known address is reported as already known.
-    await submitInvite('known@example.test')
-    expect(said().textContent).toMatch(/already known/i)
-    expect(said().textContent).toContain('known@example.test')
-
-    // A refusal is shown in the dialog rather than closing it.
-    await submitInvite('   ')
-    expect(said().hidden).toBe(false)
-    expect(said().textContent).toContain('needs an email address')
-    expect(dialog(), 'the dialog closed over a refusal').not.toBeNull()
-  })
-})
diff --git a/tests/reconciliation-identity-invite-provision-admission.workers.test.ts b/tests/reconciliation-identity-invite-provision-admission.workers.test.ts
index 6c5865e7ff..da7eb27bc4 100644
--- a/tests/reconciliation-identity-invite-provision-admission.workers.test.ts
+++ b/tests/reconciliation-identity-invite-provision-admission.workers.test.ts
@@ -17,16 +17,16 @@ import {
   type AdmittedBusiness,
   type IdentityEnv,
 } from '../apps/control-app/src/identity'
-import { currentNameOf } from '../apps/control-app/src/names'
-import { invitePerson, peopleOf } from '../apps/control-app/src/people'
+import { peopleOf } from '../apps/control-app/src/people'
 import { PORTAL_PATH } from '../apps/control-app/src/portal'
 import {
   ADMIN_BUSINESSES_PATH,
   PEOPLE_PATH,
+  PERSON_ADD_PATH,
   PERSON_INVITE_PATH,
 } from '../apps/control-app/src/router'
 import { acceptTerms, TERMS_ACCEPT_PATH } from '../apps/control-app/src/terms'
-import { seedContact } from './support/contact'
+import { addAndInvite } from './support/add-and-invite'
 import { applySchema } from './support/d1-site-factory'
 import { inviteAccount } from './support/invite-account'
 
@@ -45,9 +45,14 @@ import { inviteAccount } from './support/invite-account'
  * from a return value.
  *
  * `inviteAccount` IS A FIXTURE, not a shipped call: it composes the two shipped
- * calls (`invitePerson` into the 1st Contact business, then `provisionBusiness`)
+ * calls (`addContact` into the 1st Contact business, then `provisionBusiness`)
  * so a case whose subject is admission can start from "an entitled account
- * exists". Cases whose subject is the invite or provisioning call those directly.
+ * exists". Since [[REQ-199]] the invite is a transition on an existing contact,
+ * by id: a case whose subject is the invite adds the contact first and then
+ * invites that id — through the routes (`addThenInvite`) or the shipped calls
+ * (`addAndInvite`). The add-route and invite-route criteria themselves (AC-1743,
+ * AC-1744, AC-2169, AC-2171, AC-2172) are proved in
+ * `test_reconciliation_contacts_add_invite.workers.test.ts`.
  */
 
 const PLATFORM = 'story7b1025b8-r186-platform'
@@ -146,8 +151,36 @@ interface InvitedPersonJson {
   invitedAt: string | null
 }
 
+/** What a deliverable deployment carries, so the invite route can send ([[REQ-199]]). */
+const DELIVERABLE: Partial<Env> = { MAIL_FROM: 'no-reply@example.test', SESSION_COOKIE_NAME: 'session' } as Partial<Env>
+
+const postAdd = async (token: string | null, body: unknown, businessId: string | null) =>
+  worker.fetch(POST(token, PERSON_ADD_PATH, body, businessId), workerEnv(DELIVERABLE))
+
 const postInvite = async (token: string | null, body: unknown, businessId: string | null) =>
-  worker.fetch(POST(token, PERSON_INVITE_PATH, body, businessId), workerEnv())
+  worker.fetch(POST(token, PERSON_INVITE_PATH, body, businessId), workerEnv(DELIVERABLE))
+
+/**
+ * Add a contact through the add route, then invite that contact by id through
+ * the invite route — the two acts [[REQ-199]] split the old invite into. Both
+ * must answer 200 and the invite must report one `sent` result for that id.
+ */
+async function addThenInvite(
+  token: string,
+  body: { email: string; displayName?: string },
+  businessId: string,
+): Promise<{ created: boolean; person: InvitedPersonJson }> {
+  const added = await postAdd(token, body, businessId)
+  expect(added.status, 'the add was refused').toBe(200)
+  const addedBody = await added.json<{ created: boolean; person: InvitedPersonJson }>()
+  const invited = await postInvite(token, { ids: [addedBody.person.id] }, businessId)
+  expect(invited.status, 'the invite was refused').toBe(200)
+  const { results } = await invited.json<{
+    results: Array<{ contactId: string; status: string; person: InvitedPersonJson | null }>
+  }>()
+  expect(results.map((r) => [r.contactId, r.status])).toEqual([[addedBody.person.id, 'sent']])
+  return { created: addedBody.created, person: results[0].person! }
+}
 
 /** An entitled account of 1st Contact who has accepted the terms — setup, not a claim. */
 async function anAccount(email: string, name = 'A Business') {
@@ -286,40 +319,7 @@ afterEach(() => {
 
 // ─── The invite: a transition on one row ────────────────────────────────────
 
-describe('the invite is a transition, not a creation', () => {
-  it('test_UAT_AC2169_inviting_a_known_contact_promotes_that_row_and_reports_created', async () => {
-    stubJwks()
-    const owner = anEmail()
-    const account = await anAccount(owner, "Alice's Plumbing")
-    const token = await mint(owner)
-
-    const contact = anEmail()
-    // A contact: known to the business, never invited.
-    const contactId = await seedContact(identityEnv(), { tenantId: account.businessId, email: contact })
-    expect((await rowsFor(account.businessId, contact))[0].invited_at).toBeNull()
-
-    const promoted = await postInvite(token, { email: contact }, account.businessId)
-    expect(promoted.status).toBe(200)
-    const promotedBody = await promoted.json<{ created: boolean; person: InvitedPersonJson }>()
-    expect(promotedBody.created, 'a promoted contact was reported as created').toBe(false)
-    expect(promotedBody.person.id).toBe(contactId)
-    const rows = await rowsFor(account.businessId, contact)
-    expect(rows, 'the invite inserted a second row for one address').toHaveLength(1)
-    expect(rows[0].id).toBe(contactId)
-    expect(rows[0].invited_at, 'the promotion did not stamp the row').toBeTruthy()
-
-    const fresh = anEmail()
-    const inserted = await postInvite(token, { email: fresh }, account.businessId)
-    expect(inserted.status).toBe(200)
-    const insertedBody = await inserted.json<{ created: boolean; person: InvitedPersonJson }>()
-    expect(insertedBody.created).toBe(true)
-    const [row] = await rowsFor(account.businessId, fresh)
-    expect(row.id).toBe(insertedBody.person.id)
-    expect(row.status).toBe('active')
-    expect(row.invited_at).toBeTruthy()
-    expect(row.first_seen_at).toBeNull()
-  })
-
+describe('the invite is a transition on an existing contact', () => {
   it('test_UAT_AC2170_invites_from_two_businesses_differ_only_in_tenant_and_no_level_column', async () => {
     stubJwks()
     const operatorEmail = anEmail()
@@ -329,18 +329,13 @@ describe('the invite is a transition, not a creation', () => {
 
     const alice = anEmail()
     const bob = anEmail()
-    const fromPlatform = await postInvite(
-      await mint(operatorEmail),
-      { email: alice, displayName: 'Same Name' },
-      PLATFORM,
-    )
-    expect(fromPlatform.status).toBe(200)
-    const fromCustomer = await postInvite(
+    // The same two acts — add, then invite that contact by id — into two businesses.
+    await addThenInvite(await mint(operatorEmail), { email: alice, displayName: 'Same Name' }, PLATFORM)
+    await addThenInvite(
       await mint(customerOwner),
       { email: bob, displayName: 'Same Name' },
       customer.businessId,
     )
-    expect(fromCustomer.status).toBe(200)
 
     const [aliceRow] = await rowsFor(PLATFORM, alice)
     const [bobRow] = await rowsFor(customer.businessId, bob)
@@ -348,7 +343,7 @@ describe('the invite is a transition, not a creation', () => {
     expect(bobRow.tenant_id).toBe(customer.businessId)
 
     // Every column apart from identifiers, the address, timestamps and the tenant.
-    // `account_id` is a per-person identifier: the invite mints one account per
+    // `account_id` is a per-person identifier: the add mints one account per
     // person ([[REQ-194]]).
     const shape = (row: UserDbRow) =>
       Object.fromEntries(
@@ -370,156 +365,9 @@ describe('the invite is a transition, not a creation', () => {
     expect(customers.map((p) => p.email)).toContain(bob)
     expect(ours.map((p) => p.email)).not.toContain(bob)
   })
-
-  it('test_UAT_AC2171_a_re_invite_does_not_restamp_and_never_overwrites_a_name', async () => {
-    stubJwks()
-    const owner = anEmail()
-    const account = await anAccount(owner, "Alice's Plumbing")
-    const token = await mint(owner)
-    const email = anEmail()
-
-    const first = await postInvite(token, { email }, account.businessId)
-    expect(first.status).toBe(200)
-    const firstBody = await first.json<{ person: InvitedPersonJson }>()
-    const personId = firstBody.person.id
-    expect(firstBody.person.name).toBeNull()
-    expect(await currentNameOf(identityEnv(), personId), 'a nameless invite wrote a name').toBeNull()
-    const stamp = (await rowsFor(account.businessId, email))[0].invited_at
-    expect(stamp).toBeTruthy()
-
-    // The name history lives in `user_names` ([[REQ-193]]): every row, current or superseded.
-    const nameRows = async () =>
-      (
-        await env.DB.prepare('SELECT display_name, superseded_at FROM user_names WHERE user_id = ?')
-          .bind(personId)
-          .all<{ display_name: string; superseded_at: string | null }>()
-      ).results ?? []
-
-    const second = await postInvite(token, { email, displayName: 'Bob Smith' }, account.businessId)
-    expect(second.status).toBe(200)
-    const secondBody = await second.json<{ created: boolean; person: InvitedPersonJson }>()
-    expect(secondBody.created).toBe(false)
-    expect(secondBody.person.id).toBe(personId)
-    let [row] = await rowsFor(account.businessId, email)
-    expect(row.invited_at, 'a re-invite restamped the invitation').toBe(stamp)
-    expect((await currentNameOf(identityEnv(), personId))?.displayName, 'an empty name was not filled').toBe(
-      'Bob Smith',
-    )
-
-    const third = await postInvite(token, { email, displayName: 'Robert Smith' }, account.businessId)
-    expect(third.status).toBe(200)
-    ;[row] = await rowsFor(account.businessId, email)
-    expect(row.invited_at).toBe(stamp)
-    expect(
-      (await currentNameOf(identityEnv(), personId))?.displayName,
-      'the invite overwrote an existing name',
-    ).toBe('Bob Smith')
-    expect(await nameRows(), 'the re-invite wrote or superseded a name row').toEqual([
-      { display_name: 'Bob Smith', superseded_at: null },
-    ])
-  })
-
-  it('test_UAT_AC1743_re_inviting_a_known_address_reports_the_person_and_creates_nothing', async () => {
-    stubJwks()
-    const owner = anEmail()
-    const account = await anAccount(owner, "Alice's Plumbing")
-    const token = await mint(owner)
-    const email = anEmail()
-
-    const before = {
-      tenants: await count('tenants'),
-      memberships: await count('memberships'),
-      entitlements: await count('entitlements'),
-    }
-    const first = await postInvite(token, { email }, account.businessId)
-    const again = await postInvite(token, { email }, account.businessId)
-    expect(first.status).toBe(200)
-    expect(again.status, 'a re-invite failed rather than reporting').toBe(200)
-
-    const firstBody = await first.json<{ created: boolean; person: InvitedPersonJson }>()
-    const againBody = await again.json<{ created: boolean; person: InvitedPersonJson }>()
-    expect(againBody.created).toBe(false)
-    expect(againBody.person.id).toBe(firstBody.person.id)
-    expect(await rowsFor(account.businessId, email)).toHaveLength(1)
-    expect({
-      tenants: await count('tenants'),
-      memberships: await count('memberships'),
-      entitlements: await count('entitlements'),
-    }).toEqual(before)
-  })
-
-  it('test_UAT_AC1744_case_and_padding_are_the_same_person_at_the_invite_route_and_at_login', async () => {
-    stubJwks()
-    const operatorEmail = anEmail()
-    await anOperator(operatorEmail)
-    const token = await mint(operatorEmail)
-    const email = anEmail()
-
-    const first = await postInvite(token, { email: `  ${email.replace('story', 'StOrY')}  ` }, PLATFORM)
-    expect(first.status).toBe(200)
-    const firstBody = await first.json<{ created: boolean; person: InvitedPersonJson }>()
-    expect(firstBody.created).toBe(true)
-    const stored = await rowsFor(PLATFORM, email)
-    expect(stored, 'the address was not stored casefolded and trimmed').toHaveLength(1)
-    expect(stored[0].email).toBe(email)
-
-    const again = await postInvite(token, { email: email.toUpperCase() }, PLATFORM)
-    const againBody = await again.json<{ created: boolean; person: InvitedPersonJson }>()
-    expect(againBody.created).toBe(false)
-    expect(againBody.person.id).toBe(firstBody.person.id)
-    expect(await rowsFor(PLATFORM, email)).toHaveLength(1)
-
-    await provisionBusiness(identityEnv(), { accountId: firstBody.person.accountId, name: 'Cased' })
-    const admitted = await admit(identityEnv(), ` ${email.toUpperCase()} `)
-    expect(admitted.ok).toBe(true)
-    expect(admitted.ok && admitted.user.id).toBe(firstBody.person.id)
-  })
 })
 
 describe('who may invite', () => {
-  it('test_UAT_AC2172_only_an_owner_may_invite_and_every_refusal_writes_nothing', async () => {
-    stubJwks()
-    const alice = anEmail()
-    const account = await anAccount(alice, "Alice's Plumbing")
-
-    // An owner into their own business.
-    const ok = await postInvite(await mint(alice), { email: anEmail() }, account.businessId)
-    expect(ok.status).toBe(200)
-
-    // Scoped to the 1st Contact business, which Alice does not own.
-    const intoOurs = anEmail()
-    const refusedOurs = await postInvite(await mint(alice), { email: intoOurs }, PLATFORM)
-    expect(refusedOurs.status).toBe(403)
-    expect(await rowsFor(PLATFORM, intoOurs)).toHaveLength(0)
-
-    // A platform-operator holder with no owner membership on the scoped business.
-    const operatorEmail = anEmail()
-    const operator = await anOperator(operatorEmail)
-    expect(operator.platform_operator, 'the operator does not hold the capability').toBe(1)
-    const intoHers = anEmail()
-    const refusedOperator = await postInvite(await mint(operatorEmail), { email: intoHers }, account.businessId)
-    expect(refusedOperator.status).toBe(403)
-    expect(await rowsFor(account.businessId, intoHers)).toHaveLength(0)
-
-    // The dev-open loopback path carries no admission and owns nothing.
-    const loopback = anEmail()
-    const refusedLoopback = await worker.fetch(
-      POST(null, PERSON_INVITE_PATH, { email: loopback }),
-      workerEnv({ ACCESS_DEV_OPEN: '1', ACCESS_TEAM_DOMAIN: '', ACCESS_AUD: '' }),
-    )
-    expect(refusedLoopback.status).toBe(403)
-    expect(await rowsFor(PLATFORM, loopback)).toHaveLength(0)
-
-    // An owner posting an empty address.
-    const usersBefore = await count('users')
-    for (const blank of ['', '   ']) {
-      const refusedEmpty = await postInvite(await mint(alice), { email: blank }, account.businessId)
-      expect(refusedEmpty.status).toBe(400)
-      expect((await refusedEmpty.json<{ error: string }>()).error).toMatch(/needs an email address/i)
-    }
-    expect(await count('users')).toBe(usersBefore)
-  })
-
   it('test_UAT_AC2174_the_people_list_reports_canInvite_and_canFulfil_separately', async () => {
     stubJwks()
     const operatorEmail = anEmail()
@@ -552,18 +400,25 @@ describe('the invite writes no membership and no grant', () => {
     await anOperator(operatorEmail)
     const email = anEmail()
 
+    // Add a contact to the 1st Contact business and invite them by id.
     const memberships = await count('memberships')
     const entitlements = await count('entitlements')
-    const response = await postInvite(await mint(operatorEmail), { email }, PLATFORM)
-    expect(response.status).toBe(200)
-    const invited = await response.json<{ person: InvitedPersonJson }>()
-    expect(await count('memberships'), 'the invite wrote a membership').toBe(memberships)
-    expect(await count('entitlements'), 'the invite wrote a grant').toBe(entitlements)
-
+    const invited = await addThenInvite(await mint(operatorEmail), { email }, PLATFORM)
+    expect(invited.created).toBe(true)
+    expect(invited.person.invitedAt, 'the invite did not stamp the contact').toBeTruthy()
+    expect(await count('memberships'), 'the add or invite wrote a membership').toBe(memberships)
+    expect(await count('entitlements'), 'the add or invite wrote a grant').toBe(entitlements)
+
+    // Not signed up, and their account owns no business: admitted with nothing,
+    // not refused ([[REQ-203]]). The terms gate is what bounds this admission.
+    const [stored] = await rowsFor(PLATFORM, email)
+    expect(stored.tos_accepted_at, 'the invitee has already signed up').toBeNull()
     const bare = await admit(identityEnv(), email)
-    expect(bare.ok).toBe(false)
-    expect(!bare.ok && bare.reason).toBe('no_membership')
+    expect(bare.ok, `refused: ${!bare.ok ? bare.reason : ''}`).toBe(true)
+    expect(bare.ok && bare.user.id).toBe(invited.person.id)
+    expect(bare.ok && bare.businesses).toEqual([])
 
+    // Provisioning lists exactly that business, and no second person exists.
     const business = await provisionBusiness(identityEnv(), {
       accountId: invited.person.accountId,
       name: 'Now Theirs',
@@ -571,6 +426,18 @@ describe('the invite writes no membership and no grant', () => {
     const admitted = await admit(identityEnv(), email)
     expect([...byId(admitted).keys()]).toEqual([business.businessId])
     expect(await rowsFor(PLATFORM, email)).toHaveLength(1)
+
+    // Their account now owns a business: with the membership withdrawn they are
+    // refused, and the missing membership is the recorded reason.
+    await env.DB.prepare('UPDATE memberships SET revoked_at = ? WHERE user_id = ?')
+      .bind(ISO(0), invited.person.id)
+      .run()
+    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
+    const withdrawn = await admit(identityEnv(), email)
+    expect(withdrawn.ok).toBe(false)
+    expect(!withdrawn.ok && withdrawn.reason).toBe('no_membership')
+    const logged = warn.mock.calls.map(([line]) => String(line))
+    expect(logged.some((line) => line.includes('"reason":"no_membership"') && line.includes(email))).toBe(true)
   })
 
   it('test_UAT_AC2115_a_grant_names_its_business_as_object_and_optionally_an_account_as_subject', async () => {
@@ -590,8 +457,9 @@ describe('the invite writes no membership and no grant', () => {
     // The invite writes no grant; provisioning writes one naming the business only.
     const email = anEmail()
     const before = await count('entitlements')
-    const invited = await invitePerson(identityEnv(), { businessId: PLATFORM }, { email })
-    expect(await count('entitlements'), 'the invite wrote a grant').toBe(before)
+    const invited = await addAndInvite(identityEnv(), { businessId: PLATFORM }, { email })
+    expect(invited.person.invitedAt).toBeTruthy()
+    expect(await count('entitlements'), 'the add or invite wrote a grant').toBe(before)
     const business = await provisionBusiness(identityEnv(), { accountId: invited.person.accountId, name: 'Object' })
     const { results: written } = await env.DB.prepare(
       'SELECT business_id, account_id FROM entitlements WHERE business_id = ?',
@@ -636,9 +504,10 @@ describe('provisioning a business', () => {
     const email = anEmail()
     const tenantsBefore = await count('tenants')
     const sitesBefore = await count('sites')
-    const invited = await invitePerson(identityEnv(), { businessId: PLATFORM }, { email })
+    const invited = await addAndInvite(identityEnv(), { businessId: PLATFORM }, { email })
+    expect(invited.person.invitedAt).toBeTruthy()
 
-    // The invite: no tenant, membership, grant or site for that person.
+    // The add and the invite: no tenant, membership, grant or site for that person.
     expect(await count('tenants')).toBe(tenantsBefore)
     expect(await count('sites')).toBe(sitesBefore)
     expect(
@@ -771,10 +640,10 @@ describe('invite plus provisioning makes a customer', () => {
     const operatorToken = await mint(operatorEmail)
     const alice = anEmail()
 
-    const invited = await postInvite(operatorToken, { email: alice }, PLATFORM)
-    expect(invited.status).toBe(200)
-    const invitedBody = await invited.json<{ created: boolean; person: InvitedPersonJson }>()
+    // Add Alice, then invite her by id ([[REQ-199]]).
+    const invitedBody = await addThenInvite(operatorToken, { email: alice }, PLATFORM)
     expect(invitedBody.created).toBe(true)
+    expect(invitedBody.person.invitedAt).toBeTruthy()
 
     const provisioned = await worker.fetch(
       POST(operatorToken, ADMIN_BUSINESSES_PATH, { accountEmail: alice, name: "Alice's Plumbing" }, PLATFORM),
@@ -786,6 +655,11 @@ describe('invite plus provisioning makes a customer', () => {
     const aliceToken = await mint(alice)
     const accepted = await worker.fetch(POST(aliceToken, TERMS_ACCEPT_PATH, {}), workerEnv())
     expect(accepted.status).toBe(204)
+    // Accepting did not provision a second business: the account already owns one ([[REQ-203]]).
+    const { results: owned } = await env.DB.prepare('SELECT id FROM tenants WHERE owner_account_id = ?')
+      .bind(invitedBody.person.accountId)
+      .all<{ id: string }>()
+    expect((owned ?? []).map((t) => t.id)).toEqual([business.businessId])
 
     const admitted = await admit(identityEnv(), alice)
     expect(admitted.ok).toBe(true)
@@ -823,13 +697,14 @@ describe('login binds, and provisions nothing', () => {
     await expect(admit(identityEnv({ TENANT_ID: '' }), email)).rejects.toThrow(/TENANT_ID.*wrangler\.toml/s)
     expect(await stamps()).toEqual(before)
 
-    // The invite carries no such refusal: it is scoped by the caller's business.
-    const invited = await invitePerson(
+    // The add and the invite carry no such refusal: they are scoped by the caller's business.
+    const invited = await addAndInvite(
       identityEnv({ TENANT_ID: '' }),
       { businessId: seeded.businessId },
       { email: anEmail() },
     )
     expect(invited.created).toBe(true)
+    expect(invited.person.invitedAt).toBeTruthy()
   })
 
   it('test_UAT_AC1747_a_proven_address_with_no_person_is_refused_and_creates_nothing', async () => {
@@ -1243,9 +1118,15 @@ describe('the request path', () => {
     const inactiveSeed = await inviteAccount(identityEnv(), { email: inactive, endsAt: null })
     await env.DB.prepare('UPDATE users SET status = ? WHERE id = ?').bind('suspended', inactiveSeed.user.id).run()
 
-    // Invited and given no business: no live membership.
+    // An account that owns a business, with the membership withdrawn: no live
+    // membership. (An invitee who has not signed up and owns nothing is admitted
+    // with nothing since [[REQ-203]], so is not this reason.)
     const unmembered = anEmail()
-    await invitePerson(identityEnv(), { businessId: PLATFORM }, { email: unmembered })
+    const unmemberedSeed = await inviteAccount(identityEnv(), { email: unmembered, endsAt: null })
+    await acceptTerms(identityEnv(), unmemberedSeed.user.id)
+    await env.DB.prepare('UPDATE memberships SET revoked_at = ? WHERE user_id = ?')
+      .bind(ISO(0), unmemberedSeed.user.id)
+      .run()
 
     const ungranted = anEmail()
     const ungrantedSeed = await inviteAccount(identityEnv(), { email: ungranted, endsAt: null })
diff --git a/tests/reconciliation-identity-person-addresses-names.workers.test.ts b/tests/reconciliation-identity-person-addresses-names.workers.test.ts
index b7dd78c134..180996805c 100644
--- a/tests/reconciliation-identity-person-addresses-names.workers.test.ts
+++ b/tests/reconciliation-identity-person-addresses-names.workers.test.ts
@@ -17,6 +17,7 @@ import { currentNameOf, formerNamesOf } from '../apps/control-app/src/names'
 import {
   ADMIN_BUSINESSES_PATH,
   PEOPLE_PATH,
+  PERSON_ADD_PATH,
   PERSON_INVITE_PATH,
   PERSON_RECORD_PATH,
   PERSON_STATUS_PATH,
@@ -33,16 +34,17 @@ import { inviteAccount } from './support/invite-account'
  * Covers the criteria this bundle adds or restates:
  *  - AC-2247 the person record carries no address; addresses are rows, casefolded,
  *    at most one primary, one person per address per business;
- *  - AC-2248 admission and the invite resolve a person through any address;
- *  - AC-1744 case/padding are the same person, with the schema enforcing it;
- *  - AC-2171 a re-invite neither restamps nor supersedes an existing name;
+ *  - AC-2257 (runtime) a non-owner role is refused only at the ownership gates;
  *  - AC-2249 correcting the address rewrites the primary row and moves no key;
  *  - AC-2251 a name is a superseding row, corrected unless marked changed;
  *  - AC-2252 (the route half) clearing every part leaves no name, and clearing
  *    the displayed name while a part remains is refused.
  *
- * EVIDENCE. workerd against real D1 with the deployed baseline. Invites go
- * through the Worker's own `fetch` with a real RS256 Access token verified
+ * AC-2248, AC-1744 and AC-2171 moved onto the add route with [[REQ-199]] and are
+ * proved in `test_reconciliation_contacts_add_invite.workers.test.ts`.
+ *
+ * EVIDENCE. workerd against real D1 with the deployed baseline. Contacts are
+ * created through the add route, via the Worker's own `fetch` with a real RS256 Access token verified
  * against a stubbed JWKS (the one external boundary). Constraints are proved by
  * the database refusing the write; rows are read back out of D1.
  */
@@ -59,7 +61,7 @@ function identityEnv(tenantId = PLATFORM): IdentityEnv {
   return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: tenantId }
 }
 
-function workerEnv(): Env {
+function workerEnv(overrides: Partial<Env> = {}): Env {
   return {
     DB: env.DB as D1Database,
     SITES: env.SITES as R2Bucket,
@@ -69,9 +71,13 @@ function workerEnv(): Env {
     ACCESS_TEAM_DOMAIN: TEAM,
     ACCESS_AUD: AUD,
     ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
+    ...overrides,
   } as Env
 }
 
+/** What a deliverable deployment carries, so the invite route can send ([[REQ-199]]). */
+const DELIVERABLE = { MAIL_FROM: 'no-reply@example.test', SESSION_COOKIE_NAME: 'session' } as Partial<Env>
+
 function b64url(bytes: Uint8Array | string): string {
   const raw =
     typeof bytes === 'string' ? bytes : Array.from(bytes, (b) => String.fromCharCode(b)).join('')
@@ -107,18 +113,22 @@ function stubJwks(): void {
 let seq = 0
 const anEmail = (): string => `story7b1025b8-b37-${(seq += 1)}@example.test`
 
-interface InviteBody {
+interface AddBody {
   created: boolean
   person: Person
 }
 
-async function postInvite(
+/**
+ * Add a contact through the add route ([[REQ-199]]) — the act that creates a
+ * person and their first address. (Before REQ-199 the invite route did this.)
+ */
+async function postAdd(
   token: string,
   body: Record<string, unknown>,
   businessId: string,
-): Promise<{ status: number; body: InviteBody }> {
+): Promise<{ status: number; body: AddBody }> {
   const response = await worker.fetch(
-    new Request(`https://app.example/b/${businessId}${PERSON_INVITE_PATH}`, {
+    new Request(`https://app.example/b/${businessId}${PERSON_ADD_PATH}`, {
       method: 'POST',
       headers: { 'content-type': 'application/json', 'cf-access-jwt-assertion': token },
       body: JSON.stringify(body),
@@ -127,8 +137,8 @@ async function postInvite(
   )
   const status = response.status
   const text = await response.text()
-  expect(status, `invite refused: ${text}`).toBe(200)
-  return { status, body: JSON.parse(text) as InviteBody }
+  expect(status, `add refused: ${text}`).toBe(200)
+  return { status, body: JSON.parse(text) as AddBody }
 }
 
 /** An owner of the 1st Contact business, seeded the way production seeds one. */
@@ -254,9 +264,9 @@ describe('a person and their addresses', () => {
     const { results: columns } = await env.DB.prepare('PRAGMA table_info(users)').all<{ name: string }>()
     expect((columns ?? []).map((c) => c.name)).not.toContain('email')
 
-    // An invited person is written together with their first address, primary.
+    // A person created by the add is written together with their first address, primary.
     const first = anEmail()
-    const invited = await postInvite(token, { email: first }, PLATFORM)
+    const invited = await postAdd(token, { email: first }, PLATFORM)
     expect(invited.body.created).toBe(true)
     const personId = invited.body.person.id
     let held = await emailsOf(identityEnv(), personId)
@@ -303,7 +313,7 @@ describe('a person and their addresses', () => {
     }
 
     // Within one business an address reaches exactly one person.
-    const rival = await postInvite(token, { email: anEmail() }, PLATFORM)
+    const rival = await postAdd(token, { email: anEmail() }, PLATFORM)
     await expect(
       userEmailInsert(identityEnv(), {
         userId: rival.body.person.id,
@@ -316,7 +326,7 @@ describe('a person and their addresses', () => {
 
     // The same address in another business is an unrelated person there.
     const owner = await aCustomerOwner()
-    const there = await postInvite(owner.token, { email: first }, owner.businessId)
+    const there = await postAdd(owner.token, { email: first }, owner.businessId)
     expect(there.body.created).toBe(true)
     expect(there.body.person.id).not.toBe(personId)
     expect(await peopleAt(owner.businessId, first)).toEqual([there.body.person.id])
@@ -330,7 +340,7 @@ describe('a person and their addresses', () => {
     stubJwks()
     const owner = await aCustomerOwner()
     const older = anEmail()
-    const invited = await postInvite(owner.token, { email: older }, owner.businessId)
+    const invited = await postAdd(owner.token, { email: older }, owner.businessId)
     expect(invited.body.created).toBe(true)
     const personId = invited.body.person.id
     const newer = anEmail()
@@ -395,7 +405,7 @@ describe('a person and their addresses', () => {
 
     // A real contact in the owner's business, put there through the product path,
     // so the list comparison below compares something and the refusals have a target.
-    const contact = await postInvite(owner.token, { email: anEmail(), displayName: 'Kept Name' }, owner.businessId)
+    const contact = await postAdd(owner.token, { email: anEmail(), displayName: 'Kept Name' }, owner.businessId)
     expect(contact.body.created).toBe(true)
     const contactId = contact.body.person.id
     const stateOf = async () =>
@@ -423,15 +433,29 @@ describe('a person and their addresses', () => {
     expect(ownerPeople.canInvite).toBe(true)
     expect(staffPeople.canInvite).toBe(false)
 
-    // Refused at the owner-gated routes: invite, record edit, sign-in status.
+    // Refused at the owner-gated routes: add, invite, record edit, sign-in status.
     const target = contactId
     const before = await countPeople(owner.businessId)
-    const invite = await at(owner.businessId, PERSON_INVITE_PATH, {
+    const addAsStaffMember = await at(owner.businessId, PERSON_ADD_PATH, {
       method: 'POST',
       body: JSON.stringify({ email: anEmail() }),
     })
+    expect(addAsStaffMember.status).toBe(403)
+    const staffInvite = (path: string, init: RequestInit, token = staffToken) =>
+      worker.fetch(
+        new Request(`https://app.example/b/${owner.businessId}${path}`, {
+          ...init,
+          headers: { 'content-type': 'application/json', 'cf-access-jwt-assertion': token },
+        }),
+        workerEnv(DELIVERABLE),
+      )
+    const invite = await staffInvite(PERSON_INVITE_PATH, {
+      method: 'POST',
+      body: JSON.stringify({ ids: [contactId] }),
+    })
     expect(invite.status).toBe(403)
     expect(await countPeople(owner.businessId)).toBe(before)
+    expect(await invitedAtOf(contactId), 'a refused invite stamped the contact').toBeNull()
     const record = await at(owner.businessId, PERSON_RECORD_PATH, {
       method: 'POST',
       body: JSON.stringify({ id: target, displayName: 'Not Allowed' }),
@@ -448,9 +472,14 @@ describe('a person and their addresses', () => {
     expect(contactAfter?.status).toBe(contactBefore?.status)
     expect(contactAfter?.status).not.toBe('suspended')
 
-    // The owner passes the same invite gate.
-    const ownerInvite = await postInvite(owner.token, { email: anEmail() }, owner.businessId)
+    // The owner passes the same invite gate, for the same contact.
+    const ownerInvite = await staffInvite(
+      PERSON_INVITE_PATH,
+      { method: 'POST', body: JSON.stringify({ ids: [contactId] }) },
+      owner.token,
+    )
     expect(ownerInvite.status).toBe(200)
+    expect(await invitedAtOf(contactId)).toBeTruthy()
 
     // Add-a-business: a `staff` member of the 1st Contact business is refused
     // (404, the admin route's answer), where an owner of it is let through.
@@ -473,100 +502,6 @@ describe('a person and their addresses', () => {
     )
     expect(addAsOwner.status).toBe(400)
   })
-
-  it('test_UAT_AC2248_admission_and_the_invite_resolve_a_person_through_any_of_their_addresses', async () => {
-    stubJwks()
-    const token = await anOperatorToken()
-    const primary = anEmail()
-    const secondary = anEmail()
-
-    const invited = await postInvite(token, { email: primary }, PLATFORM)
-    const personId = invited.body.person.id
-    await userEmailInsert(identityEnv(), { userId: personId, tenantId: PLATFORM, email: secondary, primary: false }).run()
-
-    // Inviting the secondary address reaches the same person and writes nothing new.
-    const before = await countPeople(PLATFORM)
-    const again = await postInvite(token, { email: secondary }, PLATFORM)
-    expect(again.body.created).toBe(false)
-    expect(again.body.person.id).toBe(personId)
-    expect(await countPeople(PLATFORM)).toBe(before)
-    expect(await peopleAt(PLATFORM, primary)).toEqual([personId])
-    expect(await peopleAt(PLATFORM, secondary)).toEqual([personId])
-    expect(await emailsOf(identityEnv(), personId)).toHaveLength(2)
-
-    // A login at the secondary address is that person, carrying the primary.
-    await provisionBusiness(identityEnv(), { accountId: await accountIdOf(personId), name: 'Secondary Co' })
-    const admitted = await admit(identityEnv(), secondary)
-    expect(admitted.ok, `refused: ${!admitted.ok ? admitted.reason : ''}`).toBe(true)
-    expect(admitted.ok && admitted.user.id).toBe(personId)
-    expect(admitted.ok && admitted.user.email).toBe(primary)
-  })
-
-  it('test_UAT_AC1744_case_and_padding_are_the_same_person_at_the_invite_route_and_at_login_with_the_schema_casefolding', async () => {
-    stubJwks()
-    const token = await anOperatorToken()
-    const email = anEmail()
-    const typed = `  ${email.replace('story', 'StOrY').replace('example', 'EXAMPLE')}  `
-
-    const first = await postInvite(token, { email: typed }, PLATFORM)
-    expect(first.body.created).toBe(true)
-    const personId = first.body.person.id
-    const stored = await emailsOf(identityEnv(), personId)
-    expect(stored.map((e) => e.email)).toEqual([email])
-
-    // The schema refuses an address not already casefolded and trimmed.
-    const now = new Date().toISOString()
-    await expect(
-      env.DB.prepare(
-        'INSERT INTO user_emails (id, user_id, tenant_id, email, is_primary, created_at, updated_at) ' +
-          'VALUES (?, ?, ?, ?, 0, ?, ?)',
-      )
-        .bind(newId('eml'), personId, PLATFORM, `Mixed-${email}`.replace('mixed', 'MIXED'), now, now)
-        .run(),
-    ).rejects.toThrow(/CHECK constraint failed/i)
-
-    const again = await postInvite(token, { email: email.toUpperCase() }, PLATFORM)
-    expect(again.body.created).toBe(false)
-    expect(again.body.person.id).toBe(personId)
-    expect(await peopleAt(PLATFORM, email)).toEqual([personId])
-
-    await provisionBusiness(identityEnv(), { accountId: await accountIdOf(personId), name: 'Cased Co' })
-    const admitted = await admit(identityEnv(), ` ${email.toUpperCase()} `)
-    expect(admitted.ok, `refused: ${!admitted.ok ? admitted.reason : ''}`).toBe(true)
-    expect(admitted.ok && admitted.user.id).toBe(personId)
-  })
-})
-
-describe('a re-invite', () => {
-  it('test_UAT_AC2171_a_re_invite_does_not_restamp_and_never_supersedes_an_existing_current_name', async () => {
-    stubJwks()
-    const owner = await aCustomerOwner()
-    const email = anEmail()
-
-    const first = await postInvite(owner.token, { email }, owner.businessId)
-    expect(first.body.person.name).toBeNull()
-    const personId = first.body.person.id
-    const stamp = await invitedAtOf(personId)
-    expect(stamp).toBeTruthy()
-
-    const second = await postInvite(owner.token, { email, displayName: 'Bob Smith' }, owner.businessId)
-    expect(second.body.created).toBe(false)
-    expect(second.body.person.id).toBe(personId)
-    expect(await invitedAtOf(personId), 'a re-invite restamped the invitation').toBe(stamp)
-    expect(second.body.person.name?.displayName).toBe('Bob Smith')
-
-    const third = await postInvite(owner.token, { email, displayName: 'Robert Smith' }, owner.businessId)
-    expect(third.body.created).toBe(false)
-    expect(await invitedAtOf(personId)).toBe(stamp)
-    expect(third.body.person.name?.displayName, 'the invite superseded an existing name').toBe('Bob Smith')
-
-    const { results } = await env.DB.prepare(
-      'SELECT display_name, superseded_at FROM user_names WHERE user_id = ?',
-    )
-      .bind(personId)
-      .all<{ display_name: string; superseded_at: string | null }>()
-    expect(results).toEqual([{ display_name: 'Bob Smith', superseded_at: null }])
-  })
 })
 
 describe('correcting an address', () => {
@@ -578,7 +513,7 @@ describe('correcting an address', () => {
     const corrected = anEmail()
 
     // A person with a business of their own, a name, and a second address.
-    const invited = await postInvite(token, { email: first, displayName: 'Casey Typo' }, PLATFORM)
+    const invited = await postAdd(token, { email: first, displayName: 'Casey Typo' }, PLATFORM)
     const personId = invited.body.person.id
     await provisionBusiness(identityEnv(), { accountId: await accountIdOf(personId), name: 'Correction Co' })
     await userEmailInsert(identityEnv(), { userId: personId, tenantId: PLATFORM, email: second, primary: false }).run()
@@ -607,7 +542,7 @@ describe('correcting an address', () => {
     expect(await footprint(personId)).toEqual(before)
 
     // A person holding no address at all gains the corrected one, as primary.
-    const bare = await postInvite(token, { email: anEmail() }, PLATFORM)
+    const bare = await postAdd(token, { email: anEmail() }, PLATFORM)
     const bareId = bare.body.person.id
     await env.DB.prepare('DELETE FROM user_emails WHERE user_id = ?').bind(bareId).run()
     expect(await emailsOf(identityEnv(), bareId)).toEqual([])
@@ -636,7 +571,7 @@ describe('a name is a row that is superseded, never updated', () => {
   it('test_UAT_AC2251_a_name_is_superseded_as_corrected_unless_marked_changed_and_only_changed_former_names_reach_the_client', async () => {
     stubJwks()
     const owner = await aCustomerOwner()
-    const contact = await postInvite(owner.token, { email: anEmail() }, owner.businessId)
+    const contact = await postAdd(owner.token, { email: anEmail() }, owner.businessId)
     const personId = contact.body.person.id
 
     // The person record carries no name column.
@@ -717,7 +652,7 @@ describe('a name is a row that is superseded, never updated', () => {
     expect(await formerNamesOf(identityEnv(), personId)).toEqual(['Sarah Jones'])
 
     // A mononym — a displayed name and nothing else — is a complete name.
-    const prince = await postInvite(owner.token, { email: anEmail() }, owner.businessId)
+    const prince = await postAdd(owner.token, { email: anEmail() }, owner.businessId)
     const mono = await postRecord(owner.token, { id: prince.body.person.id, displayName: 'Prince' }, owner.businessId)
     expect(mono.status, await mono.clone().text()).toBe(200)
     expect(await currentNameOf(identityEnv(), prince.body.person.id)).toMatchObject({
@@ -734,7 +669,7 @@ describe('a name is a row that is superseded, never updated', () => {
   it('test_UAT_AC2252_clearing_every_part_through_the_route_leaves_no_name_and_clearing_only_the_displayed_name_is_refused', async () => {
     stubJwks()
     const owner = await aCustomerOwner()
-    const contact = await postInvite(owner.token, { email: anEmail() }, owner.businessId)
+    const contact = await postAdd(owner.token, { email: anEmail() }, owner.businessId)
     const personId = contact.body.person.id
     const set = await postRecord(
       owner.token,
diff --git a/tests/support/add-and-invite.ts b/tests/support/add-and-invite.ts
new file mode 100644
index 0000000000..58108ab4c2
--- /dev/null
+++ b/tests/support/add-and-invite.ts
@@ -0,0 +1,69 @@
+import { env } from 'cloudflare:test'
+import type { IdentityEnv } from '../../apps/control-app/src/identity'
+import { invitePeople } from '../../apps/control-app/src/invites'
+import type { Message } from '../../apps/control-app/src/mail'
+import { addContact, type Person } from '../../apps/control-app/src/people'
+import type { Scope } from '../../apps/control-app/src/scope'
+import { ticketStoreFor } from '../../apps/control-app/src/tickets'
+
+/**
+ * ADD A CONTACT, THEN INVITE THEM BY ID — the two shipped calls, in order
+ * ([[REQ-199]]).
+ *
+ * The invite used to be one call that took an address and created the row. It
+ * is now a transition on an existing contact, and the add is the separate act
+ * that creates one. Suites whose criterion says "invite an address" need both,
+ * so this fixture spells exactly those two calls and nothing else, the way
+ * `invite-account.ts` spells add-then-provision.
+ *
+ * THE MAIL PORT IS A RECORDING DOUBLE, because `invitePeople` takes the port as
+ * an argument and imports no adapter ([[REQ-196]]). The fixture asserts that
+ * exactly one message went to the added address, so a suite built on it cannot
+ * pass on an invite that silently sent nothing.
+ */
+
+export const FIXTURE_FROM = 'no-reply@example.test'
+export const FIXTURE_CTA = 'https://app.example/sign-in/fixture-token'
+
+export interface AddedAndInvited {
+  /** True when the add inserted the row. */
+  created: boolean
+  /** The row as the invite left it (pipeline Invited, invitation stamped). */
+  person: Person
+  /** What was handed to the mail port. */
+  sent: Message[]
+}
+
+export async function addAndInvite(
+  identity: IdentityEnv,
+  scope: Scope,
+  spec: { email: string; displayName?: string | null },
+): Promise<AddedAndInvited> {
+  const added = await addContact(identity, scope, spec)
+  const sent: Message[] = []
+  const store = await ticketStoreFor(
+    { DB: identity.DB, BLOBS: env.BLOBS as R2Bucket },
+    scope,
+  )
+  const [result] = await invitePeople(
+    {
+      env: identity,
+      scope,
+      store,
+      send: async (message) => {
+        sent.push(message)
+        return { providerId: `prov_${sent.length}` }
+      },
+      from: FIXTURE_FROM,
+      inviteUrl: async () => FIXTURE_CTA,
+    },
+    [added.person.id],
+  )
+  if (!result || result.status !== 'sent' || !result.person) {
+    throw new Error(`the invite did not go out: ${result?.status} ${result?.reason ?? ''}`)
+  }
+  if (sent.length !== 1 || sent[0].to !== added.person.email) {
+    throw new Error(`the invite was not one message to ${added.person.email}`)
+  }
+  return { created: added.created, person: result.person, sent }
+}
diff --git a/tests/test_reconciliation_contacts_add_invite_tab.test.ts b/tests/test_reconciliation_contacts_add_invite_tab.test.ts
index c2b5e1a8a7..4c99229380 100644
--- a/tests/test_reconciliation_contacts_add_invite_tab.test.ts
+++ b/tests/test_reconciliation_contacts_add_invite_tab.test.ts
@@ -295,6 +295,12 @@ describe.skipIf(!WEBUI_INSTALLED)('story-7b1025b8 — the invite modal', () => {
     expect(text(lines[2])).toContain('Cara NoAddress')
     expect(text(lines[2])).toMatch(/no primary address/i)
     expect(document.querySelector('.builder-people__tolist'), 'the modal closed over its report').toBeTruthy()
+    // Something was sent, so the selection is cleared and Invite goes dead again.
+    expect(
+      boxes().map((box) => box.checked),
+      'a send in which something went out left the selection ticked',
+    ).toEqual([false, false, false])
+    expect(inviteButton().disabled, 'a cleared selection left Invite live').toBe(true)
 
     // Only the no-primary contact, and every result refused: the selection survives.
     document.body.replaceChildren()

```