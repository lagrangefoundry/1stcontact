import { WorkerEntrypoint } from 'cloudflare:workers'
import handler, { type Env } from './index'
import { captureLead, type LeadOutcome, type LeadSubmission } from './lead'

/**
 * THE MODULE WRANGLER LOADS — every entrypoint this Worker exposes, in one place.
 *
 * WHY IT IS NOT `index.ts` ([[REQ-223]]). `cloudflare:workers` is a workerd
 * BUILT-IN: there is no package to install and nothing for Node to resolve, so
 * any module importing it can only be loaded inside the runtime. `index.ts` is
 * imported by roughly sixty suites in the node project — the ones that check the
 * Access gate's ordering, the router's shape, the deployment's configuration —
 * and putting the import there would have made every one of them fail to load,
 * for a class none of them exercises.
 *
 * SO THE SPLIT IS ALONG THE RUNTIME BOUNDARY AND NOT ALONG A CONCERN. `index.ts`
 * stays the default handler and stays plain TypeScript; this file is the one
 * module that may only exist in workerd, and it is `main` in `wrangler.toml`.
 * Anything else needing a workerd built-in belongs here for the same reason.
 *
 * IT ADDS NO BEHAVIOUR. Both exports are re-exports; there is nothing here to
 * test that is not tested where it is defined.
 */

/** The default handler, unchanged — `index.ts` is still where every route lives. */
export default handler
export type { Env }

/**
 * The internal surface, and it is NOT A ROUTE ([[REQ-223]] §3.2).
 *
 * WHAT THIS IS FOR. A visitor's form submission arrives at `public-site`, on the
 * published site's own origin, and the WRITE it implies belongs here: `addContact`
 * is the one definition of how a person enters a tenant, and a second
 * implementation over there would be two answers to that question, free to drift.
 * So the two Workers need a seam.
 *
 * WHY THE SEAM IS NOT AN HTTP PATH. A path is something a request can NAME. An
 * internal route at `app.1stcontact.io/internal/lead` is one Access
 * misconfiguration — one policy edited by somebody who did not know it was
 * load-bearing — away from being a public write endpoint into every tenant's
 * contact list. That is the specific failure `access.ts` argues against at
 * length, and the answer is not a better-hidden path but no path at all: a named
 * `WorkerEntrypoint` is reachable over a service binding and there is no URL that
 * reaches it. `fetch` below is untouched, so every route it serves is gated
 * exactly as it was.
 *
 * AND A SERVICE-BINDING CALL NEVER TRAVERSES THE EDGE, which is the other half of
 * why lead capture works where the sign-in route currently does not: it needs no
 * Access bypass policy, so it cannot inherit the missing-bypass failure
 * [[REQ-223]] §3 records against `/sign-in` and `/api/email/webhook`.
 *
 * IT IS A THIN WRAPPER ON PURPOSE. Everything it does is `lead.ts`'s, so the
 * behaviour is testable as a function and this class is only the doorway — which
 * is what keeps "what a submission does" and "how the other Worker reaches it"
 * two separable questions.
 */
export class LeadIntake extends WorkerEntrypoint<Env> {
  /**
   * Take one public form submission.
   *
   * IT REPORTS AND THE CALLER STILL ANSWERS ONE FROZEN ACKNOWLEDGEMENT. The
   * outcome exists so a refusal can be LOGGED where the operator is; nothing in
   * it may reach the visitor, or the endpoint becomes a way to test whether an
   * address is already a contact ([[REQ-223]] §2).
   */
  async captureLead(spec: LeadSubmission): Promise<LeadOutcome> {
    return captureLead(this.env, spec)
  }
}
