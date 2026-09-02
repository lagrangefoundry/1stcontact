---
uid: comment-0475401d
id: COMMENT-2157
type: comment
title: Comment on chat CHAT-36
created_by: xgd
created_at: '2026-09-02T21:22:45.844195+00:00'
updated_at: '2026-09-02T21:32:52.272910+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: chat-b2147b5c
  kind: chat_transcript
---

<!-- xgd-turn id="e01ade04-f0bb-4f6b-9af1-de454f406939-user" -->

<!-- xgd-chat role="user" ts="2026-09-02T21:22:33.602353+00:00" -->
#### You
I encountered this question in thinking about the library tab. However it extends to all our tabs. I wanted to talk it through. So let's think about the functionality that we are proposing for first contact:
Site

<!-- xgd-turn id="e01ade04-f0bb-4f6b-9af1-de454f406939-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-02T21:23:28.614159+00:00" -->
#### Claude
Your message got truncated — it ends at "Site" with nothing after it. So I have the setup ("this question came up on the Library tab but it generalises to all tabs") but neither the question nor the functionality list.

While you retype, here's the ground state so you don't have to re-establish it:

**Shipped today** — exactly two tabs, in `apps/control-app/src/builder/config.js`:
- `SITE_TAB` — a `webui/split`: chat left, preview iframe right. Scoped to *one site*.
- `LIBRARY_TAB` — `webui/list-detail` over the client's material tickets. Explicitly **tenant-wide, not site-scoped**, and deliberately placed beside the site tab rather than inside it (the comment cites DOC-38 §7.7 / DOC-10 §4.1 — a client's second site shares one Library).

**Proposed but unbuilt**, from DOC-4's MVP scope: CRM Lite (leads/customers/follow-ups/conversations), invoicing & payments, the user portal/subscriptions, and monitoring. Each of those is a plausible future tab, and each has a different scope answer — leads are arguably per-site (which form did they come from?) while customers, invoices and the account are clearly tenant-wide.

That scope question — *what is this tab about: the site, the tenant, or something else* — is the one the Library forced you to answer first, and it's the one I'd guess generalises. But say it in your own words; I don't want to answer a question you didn't ask.

<!-- xgd-turn id="9c531e7d-6e48-463a-b167-7b3fc92cd41f-user" -->

<!-- xgd-chat role="user" ts="2026-09-02T21:32:52.131042+00:00" -->
#### You
I encountered this question in thinking about the library tab. However it extends to all our tabs. I wanted to talk it through. So let's think about the functionality that we are proposing for first contact: 

- Site

- Library
  - site 
   - CRM
   - Marketing
   - Monitoring
   - Payments
   - Scheduling (this is new)
  
  I think all of these are going to be specific to a site in most cases. Take my example I want a site for first contact which will have customers and payments and customer portal and monitoring and I will have a site for XGD which will have different customers and different payments and different monitoring.  It is conceivable that there are documents that I might want to see on both sites but this is a very narrow use case I think all our functionality is site-specific for v1. Maybe there is a world in which the are complicated business ecosystems which will have multiple sites for multiple products but share customers? I don't think that is our core use-case.
  
  There are tabs that would not be site specific. I can think of one which we might call "Account" that would be the site owner account details, billing etc. - at some level this is not even a 1stcontact app tab (although it would appear as one) it is a 1stcontact site customer portal. 
  
  So, there are two questions one how do we model this as a data structure two what is the user experience. Let's take them in reverse order.
  UX options
  (1) We promote the "site selection" capability to the top menu (first item) and it applies across all tabs
  (2) We have a site selector in each tab
  
  I strongly favor (1) I will have jobs to be done that are site specific and involve multiple tabs. Having to reselect the site I am on on a per tab basis sounds painful. I'm ok with Account being an anomaly in this model.
  
  How do we model us in the back end? Do we already have this capability? Library has "used on"? Should we have site <--> tenant and allow an account to be associated with multiple tenants?

<!-- xgd-chat-end -->