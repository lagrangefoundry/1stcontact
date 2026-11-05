---
uid: todo-8efd37b5
id: TODO-18
type: todo
title: 'Stripe: create the platform account and our own business account'
created_by: EPIC-9
created_at: '2026-11-02T19:37:55.371445+00:00'
updated_at: '2026-11-03T20:55:51.142458+00:00'
completed_at: null
last_field_updated: status
status: done
fields:
  kind: user_task
  parent_uid: epic-ce0874f2
  auto_merge_back: true
  session_id: 064285fe-28fd-4c29-9ced-46b85db3d2a2
  chat_comment: comment-17742336
---

**Operator task, not code.** This is the first thing [[EPIC-9]]'s payments foundation needs for [[GOAL-55]] (Lauren Owens Jewellery live by 2026-11-30). Without the platform account there are no API keys, so Connect, webhooks and checkout cannot be built or tested against Stripe at all. **Sections 1–3 unblock the code. Section 5 has waiting in it** (Stripe's verification), so start it at the same time.

Stripe renames dashboard menus from time to time. Where a label below doesn't match what you see, look for the same idea nearby.

## Why two accounts, and why neither of them is the "test" one

**Every Stripe account has a test side and a live side.** One account does both, using different keys. So the two accounts are not "real" and "test". They have **different jobs**:

| | Account | Its job | Connect? |
|---|---|---|---|
| **A** | **1st Contact platform** | Holds our API keys. Every business, Lauren's included, links its own Stripe account **to this one**. | **Yes**, Connect is enabled here |
| **B** | **1st Contact as a business** | A business on 1st Contact like any other, linked to A through the same Settings → Payments flow Lauren will use. Later it is the merchant that charges our own customers (subscriptions). Until then it is **our shop for live tests**: a real purchase with our own card, refunded, so the money is ours and Lauren's records are never touched. | No |

**Why B can't simply be A:** a platform cannot link to itself as one of its own connected accounts. And [[EPIC-9]] already requires that "the 1st Contact business holds a connected account like every other business", so that no code needs to ask "is this our own tenant?". B exists for that reason, and live testing is a second use of it.

**Test-mode testing needs neither a second account nor Lauren's.** In test mode, Stripe's link page offers to create a throwaway test account in one click, so automated tests can make as many test businesses as they like. (I believe the button is called "Skip this form"; check when we get there.)

## 0. Decide before you start

1. **The legal entity and country** behind 1st Contact. Stripe asks for it at sign-up, and it decides the platform's country. Standard accounts in other countries (Lauren is in Ireland) can link to a platform with direct charges, but confirm Stripe supports your country pairing when you choose.
2. **New account, or one you already have?** An existing Stripe account of yours can become the platform (account A). Its payment history doesn't matter.

## 1. Account A: create and activate the platform account

1. Sign up at stripe.com, or sign in to the existing account. Name it **1st Contact**.
2. **Turn on two-factor authentication** (Settings → your profile). This account will hold keys that can take money on other people's behalf.
3. **Activate it** ("Activate payments" / "Complete your profile"). Stripe asks for:
   - the business type and legal name, plus registration and tax numbers if it's a company
   - a representative: you, with date of birth, home address, and possibly a photo ID
   - a bank account for payouts
   - the website (`https://1stcontact.io`) and a short description of what 1st Contact does
   - a statement descriptor (the name on a buyer's card statement) and a support email and phone number
4. Activation can take minutes or days. You can carry on with sections 2 and 3 meanwhile; only the live keys wait for it.

## 2. Account A: enable Connect

1. In account A, open **Connect** and choose **Get started**.
2. **The platform profile.** Answer with what [[EPIC-9]] decided:
   - **What you're building:** a platform, where businesses use our software to sell to their own customers (not a marketplace that sells on their behalf).
   - **Account type:** connected accounts with **full access to the Stripe Dashboard**, which Stripe calls "Standard". This is the only kind that can link an account a business already has.
   - **Charge type:** **direct charges.** The business is the merchant of record.
   - **Who pays Stripe's fees:** the connected account (the business).
   - **Who is liable for refunds, chargebacks and negative balances:** the connected account, or Stripe. **Not the platform.**
   - **Platform fee:** none for now. The beta takes no fee, so don't configure one.
3. **Branding** (Connect → Settings → Branding): the name **1st Contact**, an icon, a brand colour, and a support URL and email. These appear on the Stripe page where a business approves the link.
4. **OAuth** (Connect → Settings → Onboarding options → OAuth): **enable OAuth for Standard accounts.**
   - Copy the **client ID** (it starts `ca_`) for **live mode**. Switch the dashboard to test mode and copy the **test** client ID too.
   - Client IDs are **not secret**. Paste both into a comment on this ticket.
   - **Redirect URIs: leave them empty for now.** The foundation ticket will give you the exact paths, under `https://app.1stcontact.io/…` for production and the dev host for dev.
   - **Don't** set anything up under the newer "create accounts for businesses" options. Creating accounts inside our UI is a later fast follow.

## 3. Account A: API keys

1. Open **Developers → API keys.**
2. **The test secret key** (`sk_test_…`) goes in your secrets file, `~/Documents/secrets/1c.dev.env`, as `STRIPE_SECRET_KEY_TEST`. Dev and local only ever use test keys.
3. **The live secret key** (`sk_live_…`), once account A is activated, goes in **your password manager only for now. Not in the dev secrets file.** `bin/deploy` pushes everything in that file to production, and the dev servers read it too. The foundation ticket will decide how a production-only secret is supplied, and add a deploy hook that checks each key against Stripe before pushing it (`bin/deploy.d/secrets/README.md`).
4. **Never paste a secret key into a chat, a ticket or a commit.** The variable names above are provisional; the foundation ticket fixes them.
5. **Ignore the publishable keys** (`pk_…`). Stripe Checkout is hosted by Stripe, so we don't need them at launch.

## 4. Account A: webhooks (later, listed so it isn't forgotten)

Wait until the foundation ticket says its endpoints are deployed. Then, in **Developers → Webhooks**, add **two endpoints**: one in test mode and one in live mode. Each must:
- listen to events on **Connected accounts** (not "Your account")
- subscribe to the events the ticket lists: checkout completed and expired, payment succeeded and failed, refunds, `account.updated`, `account.application.deauthorized`

Each endpoint has its own **signing secret** (`whsec_…`), which goes in your secrets file the same way as the keys. The test one can go in now; the live one waits on the same decision as the live key.

## 5. Account B: 1st Contact as a business

1. Signed in to Stripe, open the account menu (top left) and choose **New account** (or "Create account"). It sits under the same login as A.
2. Name it **1st Contact (business)**, and give it its own statement descriptor.
3. **Activate it** as in section 1, step 3. The same legal entity and bank account are fine.
4. **Do not enable Connect on it.** It is a business, not a platform.
5. **Do not link it to A yet.** It gets linked through our own Settings → Payments section once that exists, which makes it the first real run of the flow Lauren will use.

## 6. For Lauren (pass this on; nothing for her to do yet)

- She needs to be an **owner or administrator** of her Stripe account to approve the link.
- **Linking to 1st Contact doesn't affect WooCommerce.** Her current shop keeps working through the same Stripe account until she switches over, so she can link early.
- The capture-setting check already listed in [[GOAL-55]] still applies.

## Report back (comment on this ticket)

None of these are secret:
- the legal entity and country
- account A's id and account B's id (`acct_…`, in Settings → Business, or the URL)
- the live and test Connect client IDs (`ca_…`)
- whether A and B are each fully activated, or what Stripe is still asking for
- confirmation that `STRIPE_SECRET_KEY_TEST` is in the secrets file, and that the live key is in your password manager

## Done when

Accounts A and B both exist. A has Connect enabled with OAuth for Standard accounts, and its test key is in the secrets file. Both are activated, or are only waiting on Stripe. The report-back comment is posted. Section 4 is done later, against the foundation ticket.