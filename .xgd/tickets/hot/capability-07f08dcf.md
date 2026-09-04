---
uid: capability-07f08dcf
id: CAP-110
type: capability
title: 'Identity, Accounts & Entitlement: Who Exists, What They Own, And For How Long'
created_by: xgd
created_at: '2026-09-04T05:50:13.396282+00:00'
updated_at: '2026-09-04T05:50:13.396282+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  name: Identity, Accounts & Entitlement
---

Who exists in this platform, which account they may operate, and for how long.

Three nouns and the join between them: a **person**, identified by a verified email
address; an **account**, the unit of isolation whose identifier appears in storage keys
and is therefore permanent; and a **grant** of access to that account, for a plan, for a
period, from a source. The join between a person and an account is its own record, so one
account can be operated by several people and one person can be moved between accounts
without either becoming a migration.

Two asymmetric operations sit on top of it. **Provisioning** creates the whole set — the
person, the account, the ownership that joins them, the grant that admits them, and
something for them to edit when they arrive. **Admission** creates nothing: it binds a
verified email to a live grant or refuses, and every refusal looks the same from outside.

This capability decides *whether* an identity may be here. Deciding *who the identity is*
belongs to the Operator Access Gate capability, which verifies the caller's token and
hands on the email; this capability is what happens next. Billing, self-signup, trials,
discounts, a warning period and time-boxed support access are all later branches that
land on this model without changing its shape.
