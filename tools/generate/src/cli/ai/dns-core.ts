/**
 * [[REQ-260]] — the `dns` surface: a client's domain, as the assistant reads it
 * and as the assistant is allowed to change it.
 *
 * A SURFACE OF ITS OWN, for the reason `settings-core.ts` is one and
 * `ledger-core.ts` is another. `l1-surface.json` is the documented way to change
 * a SITE ([[DOC-30]]) and a domain is not a site — it is the address people type
 * to reach one, it belongs to the ACCOUNT rather than to the site, and it
 * carries the client's email, which no site operation has any business being
 * near.
 *
 * THE READ HALF NEEDED NO NEW MECHANISM, and that is worth saying because it
 * decided the shape. *"The surface declares the whole API and the grant narrows
 * it"* ([[DOC-30]]) means *"read freely, cannot write"* is already expressible —
 * so the diagnostic half, which has the most support value and the least risk,
 * is declared over [[REQ-257]]'s resolver and granted, and a deployment that
 * wants nothing else withholds five groups.
 *
 * SIX GROUPS AND NOT TWO. The five writes are five capabilities because they are
 * five different decisions about somebody's mail: allowing a sender edits a live
 * policy, reporting publishes one where there was none, a verification code is
 * inert until somebody else reads it, a subdomain moves where a visitor lands,
 * and a signing key repairs a specific failure. A deployment that wants an
 * assistant which can diagnose and repair but not authorise a new sender can
 * express exactly that.
 *
 * THE SAFETY IS NOT HERE. Every rule — SPF merges rather than appends, `_dmarc`
 * only when absent and only at `p=none`, privileged names refused, a
 * verification record only ever created — lives in `apps/control-app/src/`, on
 * the far side of {@link DnsDeps}, so it holds for the settings route and the
 * operator as well as for the assistant. **A rule enforced by this file would be
 * a rule a caller that does not go through the assistant could bypass**, which is
 * the ticket's own falsifier. What this file does is translate the refusals into
 * the declaration's codes so the model reads the declaration's sentence and the
 * diagnosis only the call knows.
 *
 * A PORT, NOT A DATABASE. Everything arrives as {@link DnsDeps}; the
 * implementation is the Worker's, over D1 and Cloudflare, neither of which can
 * be imported here without putting a runtime into a module the `1c` CLI also
 * loads.
 *
 * AND THE CARD IS NOT ON THIS PATH. `onChange` is told after a write returns, so
 * the host can put a notice in the conversation — a notice, with an undo, and
 * never a question. There is no operation here that proposes a change for
 * approval and no shape in the declaration that could carry one: *a confirmation
 * step the client cannot meaningfully perform is worse than none, because it
 * launders our error into their approval.*
 */
import dnsSurface from './dns-surface.json'

/** The declaration, imported as data for the reason `toolbox-core.ts` gives. */
export const DNS_DECLARATION: Record<string, unknown> = dnsSurface as unknown as Record<
  string,
  unknown
>

/** The surface name, so nothing addresses it as a literal. */
export const DNS_SURFACE = 'dns'

/** Which domain this business has, and whether it is serving their site. */
export interface DnsDomainView {
  domain: string
  serving: boolean
}

/** A host and whose it is — [[REQ-257]]'s `Attribution`, unchanged. */
export interface DnsAttribution {
  host: string
  provider: string | null
}

/** One signing key that answered a probe. */
export interface DnsSigningKey {
  selector: string
  provider: string
  value: string
}

/** What the world currently says about the domain. */
export interface DnsReadingView {
  domain: string
  web: DnsAttribution | null
  mail: DnsAttribution | null
  senders: DnsAttribution[]
  signing: DnsSigningKey[]
  live: boolean
  takenAt: string
}

/** One recorded change, as the model reads it. */
export interface DnsChangeView {
  id: string
  summary: string
  /** When the world may be expected to agree — the propagation window's end. */
  settlesBy: string
  undone: boolean
}

/**
 * What this surface needs from the deployment it is composed into.
 *
 * EVERY WRITE RAISES RATHER THAN RETURNING A REFUSAL, on `settings-core.ts`'s
 * arrangement exactly: whether a name is privileged, whether a policy already
 * exists, whether two conflicting ones do, are all decided by the module that
 * owns the rule — and translating what it raises into the declared code is
 * {@link dnsOperations}'s job.
 */
export interface DnsDeps {
  /** The domain this business holds, or null where it holds none. */
  domain(): Promise<DnsDomainView | null>
  /** The live reading, from outside. [[REQ-257]]'s resolver and never a second one. */
  reading(): Promise<DnsReadingView>
  /** This business's changes, newest first. */
  changes(): Promise<DnsChangeView[]>
  allowSender(request: { host?: string; include: string; who: string }): Promise<DnsChangeView>
  publishEmailReporting(): Promise<DnsChangeView>
  addVerification(request: { host?: string; value: string; who: string }): Promise<DnsChangeView>
  pointSubdomain(request: { host: string; target: string; who: string }): Promise<DnsChangeView>
  restoreSigningKey(request: {
    selector: string
    value: string
    who: string
  }): Promise<DnsChangeView>
}

/**
 * Raised for every way this surface refuses.
 *
 * ITS CODES ARE THE DECLARATION'S. The Toolbox renders a failure from the
 * declaration when the error carries a declared code, so the sentence the model
 * reads is `dns-surface.json`'s and this class carries the diagnosis, which is
 * the part only the call knows.
 */
export class DnsSurfaceError extends Error {
  readonly name = 'DnsSurfaceError'
  constructor(
    readonly code:
      | 'NO_DOMAIN'
      | 'DNS_UNAVAILABLE'
      | 'ALREADY_SET'
      | 'PRIVILEGED_NAME'
      | 'NOT_YOUR_DOMAIN'
      | 'DMARC_EXISTS'
      | 'APEX_IS_YOUR_SITE'
      | 'IN_USE_BY_YOUR_SITE'
      | 'SPF_CONFLICT'
      | 'BAD_VALUE'
      | 'CHANGE_NOT_FOUND'
      | 'DRIFTED',
    message: string,
  ) {
    super(message)
  }
}

type Params = Record<string, unknown>
type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * What a session may do with a client's domain. Travels with the surface.
 *
 * ALL SIX ARE GRANTED HERE, and the split is what makes narrowing it later a
 * line of configuration rather than a redesign — the property [[DOC-30]] asks a
 * surface to keep. An assistant that could see a client's domain was broken and
 * not repair it is the half-feature this ticket exists to avoid; an assistant
 * that can do all five writes is a decision this deployment is making, out loud,
 * in one expression.
 *
 * IT TRAVELS WITH THE SURFACE rather than sitting in `instances.json`, for the
 * reason `settings-core.ts` and `image-core.ts` both give: that file is
 * validated in CI against the declarations THIS repository hands the validator,
 * so a key there naming a surface composed per deployment is a grant nothing can
 * check.
 */
export function dnsInstanceConfig(): Record<string, unknown> {
  return {
    [DNS_SURFACE]: {
      groups: [
        'ReadDns',
        'AllowSender',
        'PublishEmailReporting',
        'AddVerification',
        'PointSubdomain',
        'RestoreSigningKey',
      ],
    },
  }
}

/**
 * The read-only grant — the diagnostic half on its own.
 *
 * DECLARED HERE RATHER THAN LEFT TO A CALLER TO ASSEMBLE, because it is the
 * configuration this ticket says can ship ahead of any mutation at all, and a
 * deployment reaching for it should not have to know which group names spell it.
 */
export function dnsReadOnlyInstanceConfig(): Record<string, unknown> {
  return { [DNS_SURFACE]: { groups: ['ReadDns'] } }
}

/** A change as the model reads it — the declaration's `change` shape. */
function changeView(change: DnsChangeView): Record<string, unknown> {
  return {
    change: change.id,
    summary: change.summary,
    settles_by: change.settlesBy,
    undone: change.undone,
  }
}

/**
 * A host's refusal, as the declaration's code.
 *
 * RE-CODED AND NOT RE-DECIDED — the treatment `settings-core.ts` gives
 * `hostname.ts`'s refusals. It switches on the error's own NAME, which is the
 * one thing every host in this repository can be relied on to carry and the one
 * thing a bundler cannot rewrite: this module is the port and cannot import
 * `apps/control-app/src/dns-ops.ts` without putting a Worker's D1 runtime into a
 * module the `1c` CLI also loads.
 */
function dnsCode(error: unknown): DnsSurfaceError['code'] | null {
  const named = error as { name?: unknown; code?: unknown } | null
  switch (named?.name) {
    case 'DnsRefusedError':
      return String(named.code) as DnsSurfaceError['code']
    case 'SpfConflictError':
      return 'SPF_CONFLICT'
    case 'UnknownDomainError':
      return 'NO_DOMAIN'
    case 'CloudflareNotConfiguredError':
    case 'CloudflareApiError':
    case 'ResolverUnreachableError':
      return 'DNS_UNAVAILABLE'
    case 'UnknownDnsChangeError':
      return 'CHANGE_NOT_FOUND'
    case 'DnsDriftError':
      return 'DRIFTED'
    default:
      return null
  }
}

/** Run a call, and give whatever it raises the declaration's code. */
async function translated<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run()
  } catch (error) {
    const code = dnsCode(error)
    if (code === null) throw error
    throw new DnsSurfaceError(code, error instanceof Error ? error.message : String(error))
  }
}

/** The domain this conversation is about, refusing when there is none. */
async function theDomain(deps: DnsDeps): Promise<DnsDomainView> {
  const domain = await translated(() => deps.domain())
  if (!domain) {
    throw new DnsSurfaceError(
      'NO_DOMAIN',
      'this business has no domain with us, so there is nothing to read or change.',
    )
  }
  return domain
}

/**
 * Which operations on this surface CHANGE something.
 *
 * READ OUT OF THE DECLARATION, NOT LISTED HERE — `settings-core.ts`'s rule, for
 * its reason: the declaration already says which operations are writes, because
 * the framework's validator refuses a `write` group holding a `read` operation,
 * and a second list beside it is a second statement of one fact that somebody
 * will update only one of.
 */
export function dnsWriteOperations(): ReadonlySet<string> {
  const ops = (DNS_DECLARATION.operations ?? []) as { op?: string; effect?: string }[]
  return new Set(ops.filter((o) => o.effect === 'write').map((o) => String(o.op)))
}

/**
 * The operations, bound to one deployment's domain.
 *
 * @param onChange told AFTER a write has returned, with the change it made, and
 *   never otherwise. This is what puts the card in the conversation — the surface
 *   itself renders nothing and knows nothing about panes; it reports that a
 *   change landed, and the host is the one place that knows which conversation's
 *   change it was.
 *
 *   IT IS A HOOK ON THE RETURN AND NOT A DECLARED OPERATION, for [[BUG-43]]'s
 *   reason and [[REQ-251]]'s: a tool the model may call to announce itself is a
 *   tool the model may forget to call, and the turns it would forget on are the
 *   long ones — which are the turns where an unannounced change to somebody's
 *   DNS does the most damage. Placed after the `await`, it cannot report a
 *   change that was refused; placed once per call, it cannot report one twice,
 *   which is what makes *"one change is one card"* structural.
 */
export function dnsOperations(
  deps: DnsDeps,
  onChange: (change: DnsChangeView) => void = () => {},
): Record<string, (p: Params) => Promise<Untyped>> {
  const announce = async (run: () => Promise<DnsChangeView>): Promise<Record<string, unknown>> => {
    const change = await translated(run)
    onChange(change)
    return changeView(change)
  }
  const text = (p: Params, key: string): string => String(p[key] ?? '').trim()
  const optional = (p: Params, key: string): string | undefined => {
    const value = text(p, key)
    return value === '' ? undefined : value
  }

  return {
    read_domain: async () => {
      const domain = await translated(() => deps.domain())
      return { domain: domain?.domain ?? null, serving: domain?.serving ?? false }
    },

    read_domain_dns: async () => {
      await theDomain(deps)
      const reading = await translated(() => deps.reading())
      return {
        domain: reading.domain,
        web: reading.web,
        mail: reading.mail,
        senders: reading.senders,
        signing: reading.signing.map((key) => ({
          selector: key.selector,
          provider: key.provider,
        })),
        live: reading.live,
        taken_at: reading.takenAt,
      }
    },

    /**
     * The history, and it is an ORDINARY EMPTY LIST for a domain nothing has
     * been done to — not a refusal. A client whose domain has never been changed
     * is the common case, and a model reading an error looks for something to
     * fix.
     */
    read_dns_changes: async () => {
      const changes = await translated(() => deps.changes())
      return { changes: changes.map(changeView) }
    },

    allow_sender: async (p: Params) =>
      announce(async () => {
        await theDomain(deps)
        return deps.allowSender({
          host: optional(p, 'host'),
          include: text(p, 'include'),
          who: text(p, 'who'),
        })
      }),

    publish_email_reporting: async () =>
      announce(async () => {
        await theDomain(deps)
        return deps.publishEmailReporting()
      }),

    add_verification_code: async (p: Params) =>
      announce(async () => {
        await theDomain(deps)
        return deps.addVerification({
          host: optional(p, 'host'),
          value: text(p, 'value'),
          who: text(p, 'who'),
        })
      }),

    point_subdomain: async (p: Params) =>
      announce(async () => {
        await theDomain(deps)
        return deps.pointSubdomain({
          host: text(p, 'host'),
          target: text(p, 'target'),
          who: text(p, 'who'),
        })
      }),

    restore_signing_key: async (p: Params) =>
      announce(async () => {
        await theDomain(deps)
        return deps.restoreSigningKey({
          selector: text(p, 'selector'),
          value: text(p, 'value'),
          who: text(p, 'who'),
        })
      }),
  }
}

const bound = new WeakMap<object, Promise<Untyped>>()

function dnsToolboxClass(lib: Untyped): Promise<Untyped> {
  return Promise.resolve(lib).then((mod: Untyped) => {
    const existing = bound.get(mod as object)
    if (existing) return existing
    const built = Promise.resolve(
      class DnsToolbox extends mod.ToolboxSurface {
        constructor(deps: DnsDeps, onChange: (change: DnsChangeView) => void = () => {}) {
          super(DNS_DECLARATION)
          // Installed as OWN methods, not prototype ones, so the Toolbox's
          // startup binding check sees exactly the declared set and no more.
          for (const [op, run] of Object.entries(dnsOperations(deps, onChange))) {
            ;(this as unknown as Params)[op] = run
          }
        }
      },
    )
    bound.set(mod as object, built)
    return built
  })
}

/** The surface, bound to one business's domain. */
export async function dnsSurfaceFor(
  lib: Untyped,
  deps: DnsDeps,
  onChange: (change: DnsChangeView) => void = () => {},
): Promise<Untyped> {
  const DnsToolbox = await dnsToolboxClass(lib)
  return new DnsToolbox(deps, onChange)
}
