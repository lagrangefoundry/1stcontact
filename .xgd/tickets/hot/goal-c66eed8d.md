---
uid: goal-c66eed8d
id: GOAL-54
type: goal
title: 1c From Beta to Launch
created_by: martin-github@westhead.me
created_at: '2026-10-30T00:49:38.264913+00:00'
updated_at: '2026-10-31T00:46:50.781133+00:00'
completed_at: null
last_field_updated: children
status: draft
fields:
  provenance: planned
  workstream: false
  chat_comment: comment-06649659
  children:
  - goal-08c4289b
  - goal-90dcda92
  - goal-80d0e882
  - todo-50d6cb3e
---

## Purpose

Tracks the things that must be closed before 1c moves from beta to public launch. Capture only for now; no work is scheduled under this goal yet.

## Launch blockers

1. **Payments.** Payment processing (Stripe) has to be complete and working end to end by launch.
2. **Account closure.** A user can close their own account. Closing it starts a 30-day period, after which the account and its data are deleted automatically. (Fits the DOC-5 privacy commitment to deletion and export.)
3. **Legal review of the Terms & Conditions.** A lawyer reviews the T&Cs for both customer tiers: level 1 customers and level 2 customers.
4. **Customers' own terms and conditions.** A level 1 customer can publish their own T&Cs to their level 2 customers, and record those customers' acceptance on their site. Deferred from beta by the operator on 2026-10-29. Item 3 covers 1st Contact's own terms; this item covers the customer's.
5. **Real-time alerting.** The operator hears about a failure without a tester having to report it: unhandled worker errors, failed builder turns and stuck builders at minimum. During beta, testers email the operator. The monitoring design exists ([[EPIC-15]], [[EPIC-18]]).
6. **Data export.** A user can export their data and their site, not only delete them. This goes with item 2 under the DOC-5 privacy commitment (rule 26: export and deletion).

## Notes

- Add further launch-critical items here as they come up; the operator will decide when each one becomes its own ticket.

## Folded-in goals from the old GOAL-1 map (2026-10-30)

These open goals from the abandoned [[GOAL-1]] map are launch work, not beta work.

### [[GOAL-5]] Payments (with [[GOAL-11]] Subscriptions and [[GOAL-12]] Invoicing)

Invoicing and payments (DOC-4 MVP item 4, DOC-5) cover quotes, invoices, Stripe payment links, payment status, subscription payments, and invoice and payment history in the portal. Stripe processes payments. 1c stores only Stripe IDs, statuses and metadata, never card data, and stops at collecting money: no accounting, payroll, inventory, ERP or fulfilment.
- **GOAL-11 Subscriptions** is the recurring billing for the ~$50/month plan: signup, active / past-due / cancelled, and the entitlement signal the control app reads. It owns subscription state; the portal only shows it.
- **State:** no Stripe code yet. The design is [[EPIC-9]] (draft), rewritten 2026-09-12 so one billing capability serves both us and our customers. The L1 schema already reserves a payments behaviour-module slot.
- **Launch:** this is launch blocker 1. During beta nobody is charged.

### [[GOAL-3]] Web monitoring

Monitoring checks whether the site is doing its job, not technical metrics (DOC-4, DOC-5): availability, SSL, DNS, contact-form and lead-capture tests, broken links, missing assets, basic SEO, sitemap/robots, metadata, and build/deploy status. Failures create internal events or automation tickets, run by Queues and Cron.
- **State:** split across epics. [[EPIC-15]] (basic flow monitoring, underway) and [[EPIC-7]] (DNS checks, draft) sit under [[GOAL-49]], which is beta-adjacent but not beta-blocking. [[EPIC-8]] (Monitoring tab, draft) is the customer-facing view. [[EPIC-14]] (notifications, draft) delivers alerts.
- **Launch:** the full check list and the customer's Monitoring tab are launch work, and the customer promise ("stop worrying about your website") depends on them. Blocker 5 (real-time alerting) is the operator-facing part of this goal.

### [[GOAL-10]] User portal

The 1c subscriber's account surface (DOC-4 MVP item 5): sign in by magic link, see their site, and manage their relationship with 1c. It is part of the control app, and it shows billing state without owning it.
- **State:** magic-link sign-in and the builder's Settings tab ([[EPIC-4]]) already serve testers as their account surface. REQ-183 (ready to reconcile) ships the customer-portal site rendered by the site pipeline, including a Delete account button. The goal's body still says "no code".
- **Launch:** account closure (blocker 2), data export (blocker 6), and subscription and invoice views (GOAL-5) all show up here. Nothing more is needed for beta.

### Left in neither goal

- [[GOAL-6]] Marketing brainstorm: DOC-4 lists marketing (newsletters, SEO and AI-visibility advice, SEM) as future expansion that waits for customer demand. It is neither beta nor launch work, so it stays under the abandoned [[GOAL-1]] until the operator decides.

## Open operator to-dos reviewed for launch (2026-10-30)

- [[TODO-10]] **Sensitive data in uploaded documents.** Clients will upload documents that contain their customers' names, addresses and card numbers. Nothing in the upload path detects this today. DOC-5 forbids storing card data and forbids sending private customer data to AI providers. Testers know they are testing, so this can wait for launch, but it must be closed before the public can upload.
- Launch items from to-dos that are filed under [[GOAL-50]]:
  - [[TODO-5]]: Google Postmaster Tools, and DMARC moved to `p=quarantine`.
  - [[TODO-6]]: CAA record, registrar hygiene, the custom-domain redirect decision, and a gate against label squatting.
