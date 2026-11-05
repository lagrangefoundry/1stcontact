---
uid: doc-4d7da14b
id: DOC-1
type: doc
title: Architecture Policy
created_by: xgd
created_at: '2026-06-30T00:54:42.824137+00:00'
updated_at: '2026-11-04T19:48:16.221300+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  doc_kind: architecture_policy
  references:
  - id: DOC-5
    title: Gendev Website Caretaker Architecture
---

## Overview

The GenDev Labs Website Caretaker Platform is a JAMstack-native, AI-assisted system for building and operating small-business websites. The architecture is Cloudflare-first, with Workers providing the API layer, D1 as the primary structured data store, R2 for blob/artifact storage, KV for low-criticality cached values, Durable Objects for per-site coordination, and Queues/Cron for background jobs. External dependencies are deliberately limited to AI model providers, Stripe, email, and SMS delivery. Customer sites are mostly configuration and content layered on a fixed shared framework, generated statically from D1 site definitions and R2 assets. GitHub is explicitly NOT required for customer sites; a Git-like revision model in Cloudflare storage handles history. Authentication uses magic email links exclusively — no passwords, no social login. Public forms remain login-free, protected by Turnstile and rate limiting. The XGD ticket model is borrowed conceptually but reimplemented as a simpler product-native schema in D1. CRM Lite, invoicing (via Stripe), monitoring, and a customer portal are first-class platform features. AI is constrained to translating user intent into structured changes (theme tokens, section reordering, content blocks) rather than rewriting arbitrary site code, keeping cost and risk bounded.

## Policy

1. Host the platform primarily on Cloudflare, with external dependencies limited to AI providers, Stripe, email delivery, SMS delivery, and domain registrar services. [DOC-5]
2. Use Cloudflare Workers as the main backend API layer for site builder, CRM, portal, form submissions, Stripe webhooks, magic-link authentication, monitoring, and dynamic site endpoints. Workers handle bounded edge requests only; they do NOT run agent turns or other work whose size grows with a business (amended 2026-11-04, see item 31). [DOC-5, DOC-86]
3. Use Cloudflare Workers Static Assets to host the control application frontend, customer JAMstack websites, and preview builds. [DOC-5]
4. Use D1 as the primary product database for all structured operational data including users, accounts, sites, pages, sections, theme tokens, leads, customers, invoices, payments, monitoring events, audit events, automation tickets, and magic-link tokens. [DOC-5]
5. Use R2 for blob and artifact storage including uploaded/generated images, customer assets, static build artifacts, site backups, snapshots, large content exports, and archived revision payloads. [DOC-5]
6. Use KV only for low-criticality, globally distributed values such as public runtime config, cached site metadata, feature flags, and rate-limit metadata; KV must NOT be the source of truth for critical customer or billing data. [DOC-5]
7. Use Durable Objects selectively for per-site or per-session coordination such as serializing builds, preventing concurrent publishes, live preview sessions, chat session coordination, and addressing a job's container — not as a general data store and not as a place to run compute (a DO shares its isolate's 128 MB with others). [DOC-5, DOC-86]
8. Use Cloudflare Queues, Cron Triggers, and Workflows to orchestrate background work including builds, deployments, preview generation, uptime checks, form testing, SEO checks, Stripe event sync, consultant jobs, and AI maintenance tasks. They provide durability, retries, and checkpoints; heavy work they sequence runs in a container (item 31). [DOC-5, DOC-86]
9. Generate published customer sites as static assets from structured D1 data and R2 assets; the authoring system uses a database but the public site remains JAMstack. [DOC-5]
10. Customer sites must be mostly configuration and content layered on a fixed shared framework (layouts, components, section renderers, form handlers, SEO generation, static renderer); avoid requiring significant custom code per customer. [DOC-5]
11. Implement dynamic public-site features only as Worker endpoints where strictly needed (e.g. contact forms, newsletter signup, Stripe payment, customer portal). [DOC-5]
12. Do NOT require GitHub as infrastructure for customer sites; customer-site source of truth must live in Cloudflare storage. [DOC-5]
13. Implement a Git-like revision model with site_revisions records (revision_id, site_id, parent_revision_id, author_type, author_id, change_summary, snapshot_ref, timestamps) supporting rollback, auditability, preview generation, and AI accountability. [DOC-5]
14. Store revision snapshots in D1 for small payloads or R2 for larger serialized site definitions. [DOC-5]
15. Do NOT import the full XGD ticketing implementation; instead borrow the ticket/event model and implement a simpler product-native schema in D1 for automation tickets, monitoring issues, lead follow-ups, change requests, payment issues, content review, and support escalation. [DOC-5]
16. Separate the two major data classes — Site Definition Data (drives static generation) and Business Operational Data (remains dynamic in D1, surfaced through the portal). [DOC-5]
17. Implement CRM Lite directly in the platform database, modelling leads conceptually as tickets but exposing user-facing concepts (Leads, Customers, Follow-ups, Conversations, Quotes, Invoices) rather than the internal ticket abstraction. [DOC-5]
18. Use Stripe for all payment processing; the platform must NOT store credit card data — store only Stripe customer IDs, invoice/payment IDs, payment status, invoice metadata, and subscription status. [DOC-5]
19. Deliberately exclude accounting, payroll, inventory, ERP, and fulfillment from platform scope; the platform stops at collecting money. [DOC-5]
20. Use magic email links as the sole authentication model for MVP; do NOT implement social login or password authentication. [DOC-5]
21. Anchor identity around verified email addresses, with separate authentication (proves inbox access) and authorization (determines permitted access). [DOC-5]
22. Public website forms must NOT require login; lead capture must remain frictionless. [DOC-5]
23. Handle spam on public forms via Cloudflare Turnstile, rate limiting, honeypot fields, AI spam detection, and reputation checks — never by forcing visitor account creation. [DOC-5]
24. Provide magic-link-based lead access (post-submission "Manage this inquiry" link) and customer portal access via owner-initiated invitation links. [DOC-5]
25. Support scoped magic-link permissions including account owner, site admin, business staff, lead record access, customer portal access, and GenDev Labs admin. [DOC-5]
26. Apply PII privacy principles: collect only necessary data, attach account/site IDs to all customer records, avoid storing payment card data, use provider-managed email/SMS, provide export and deletion capabilities early, maintain audit events, and disclose the AI and media providers the platform uses in the terms and conditions — not per tool in the conversation. The client is never asked permission for a tool call; what they agree to is the design. Material a client is putting on their public website (photos, copy) may go to such providers; private customer data (e.g. visitor or lead email addresses) must not be sent to them. [DOC-5]
27. Treat the customer portal as trust architecture providing data viewing, deletion, export, invoice/payment access, subscription management, monitoring transparency, AI activity transparency, and site change rollback. [DOC-5]
28. Implement basic monitoring covering site availability, SSL validity, DNS health, contact form testing, lead capture verification, broken links, missing assets, basic SEO, sitemap/robots.txt, metadata presence, and static build/deploy status; failures must create internal events or automation tickets. [DOC-5]
29. Constrain AI to translating user intent into structured changes (theme tokens, section reordering, content blocks, predefined form components) rather than rewriting arbitrary site code, to bound cost, risk, and validation complexity. [DOC-5]
30. Restrict GitHub usage to GenDev Labs platform source code, internal CI/CD, and optional future export/sync — never as a required customer-site dependency. [DOC-5]
31. Run agent and batch compute (consultant and builder rounds, page capture and screenshots, catalog-wide rebuilds, media processing, and any work whose size grows with a business's pages, products, Library, or conversation) in Cloudflare Containers, one on-demand instance per job, addressed through a Durable Object and orchestrated by a Workflow step. No container is kept awake per site between jobs. [DOC-86, EPIC-32]
32. Containers are disposable compute and hold no state: the junction (DO), D1, and R2 are the only record, a container rebuilds what it needs from them on start, and a killed container is a retried Workflow step. Containers reach platform data through the control-app's internal entrypoint, never with account credentials. [DOC-86]
33. Only the runner (Workflow step or container) declares a job's liveness or ending; streams and panels read that state and never infer death from silence. [DOC-86]
34. A published site never depends on compute: its pages, assets, and photos are static bytes served from R2 and the edge cache, and visitor requests never reach the agent path or depend on control-app health, except the narrow lead-capture and checkout endpoints. [DOC-86]
35. Code that stays on Workers and DOs must be bounded by construction: no per-item store query inside a loop over a business's items, no unbounded Promise.all fan-out, and no whole-log reads per poll. [DOC-86]
