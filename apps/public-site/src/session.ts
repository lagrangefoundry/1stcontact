/**
 * Reading a session, for the one purpose this Worker has for one ([[REQ-200]]).
 *
 * `index.ts` used to say *"there is no authentication, and published sites are
 * public by definition."* That is amended here, and the amendment is deliberately
 * narrow: the Worker reads a session cookie **to choose which of `account-chrome`'s
 * states to render**, and for nothing else. Published content stays public and
 * unauthenticated; no page becomes gated, and no content varies by who is looking
 * beyond which of the two controls the chrome shows.
 *
 * SESSIONS DO NOT CROSS A COOKIE DOMAIN, AND NOTHING HERE MAY ASSUME THEY DO.
 * The session cookie's `Domain` is host configuration ([[REQ-134]]), so
 * `1stcontact.io` and `app.1stcontact.io` share a session — a cookie on
 * `.1stcontact.io` reaches both — while a customer site on `alicesplumbing.com`
 * cannot read that cookie and never will. That is correct rather than a
 * limitation: two businesses' sites sharing a login would be exactly the
 * cross-tenant reach the tenancy model exists to prevent.
 *
 * So {@link readSessionId} takes the request's HOST and refuses a cookie that was
 * not issued for it. The browser would not have sent one anyway; the check is
 * here because "the browser would not do that" is not a property this deployment
 * can hold — a proxy, a test, or a second Worker in front could all present a
 * `Cookie` header the browser never wrote, and a session read that does not name
 * the domain it was issued for is the falsifier this ticket wrote down.
 */

/**
 * One cookie out of a `Cookie` header, decoded tolerantly.
 *
 * Seven lines rather than a dependency: the issuing component percent-encodes
 * the value and this is the matching decode, and a Worker that reads exactly one
 * cookie should not pull a package in to do it.
 */
function readCookie(header: string | null, name: string): string | null {
  if (!header) return null
  for (const pair of header.split(';')) {
    const eq = pair.indexOf('=')
    if (eq === -1) continue
    if (pair.slice(0, eq).trim() !== name) continue
    const raw = pair.slice(eq + 1).trim()
    try {
      return decodeURIComponent(raw)
    } catch {
      return raw
    }
  }
  return null
}

/** The cookie domain and name a deployment issues its sessions under. */
export interface SessionCookieConfig {
  /** The cookie's name. Absent means this deployment issues no sessions. */
  name?: string
  /**
   * The cookie's `Domain` attribute, without a leading dot — the host it was
   * issued for. Absent means a host-only cookie, which only the issuing host
   * may present.
   */
  domain?: string
}

/**
 * Whether a cookie carrying `domain` would be sent to `host`, by the rule a
 * browser uses: an exact match, or a subdomain of it.
 *
 * `alice.plumbing.example` does NOT match `plumbing.example.evil` and
 * `notplumbing.example` does not match `plumbing.example` — the dot is required,
 * which is the whole of what makes suffix matching safe.
 */
export function hostInCookieDomain(host: string, domain: string | undefined): boolean {
  if (!host) return false
  const h = host.toLowerCase()
  if (domain === undefined || domain === '') return false
  const d = domain.replace(/^\./, '').toLowerCase()
  if (!d) return false
  return h === d || h.endsWith(`.${d}`)
}

/**
 * The session id this request carries for THIS host, or null.
 *
 * Null is an ordinary answer and the common one — most visitors to a published
 * site are not signed in to it, and most published sites have no accounts at all.
 */
export function readSessionId(request: Request, config: SessionCookieConfig): string | null {
  if (!config.name) return null
  const host = new URL(request.url).hostname
  // The domain the cookie was issued for is what decides whether a cookie header
  // on THIS host may be read as a session. A deployment that configures no domain
  // issues host-only cookies, and this Worker is not the issuing host.
  if (!hostInCookieDomain(host, config.domain)) return null
  const value = readCookie(request.headers.get('cookie'), config.name)
  return value && value.length > 0 ? value : null
}

/**
 * What this Worker needs to know about the person asking, and nothing more.
 *
 * `operatesBusiness` is a fact about the PERSON — whether they hold any
 * membership at all — and never about the site being served. That is what makes
 * the builder link a general rule rather than a platform special case.
 */
export interface SessionFacts {
  operatesBusiness: boolean
}

/** Resolve a session id to the facts the chrome needs, or null when it is not live. */
export interface SessionReader {
  read(sessionId: string): Promise<SessionFacts | null>
}

/** The D1 subset this reader needs — narrow enough to fake in a UAT. */
export interface SessionDatabase {
  prepare(query: string): {
    bind(...values: unknown[]): { first<T>(): Promise<T | null> }
  }
}

/**
 * {@link SessionReader} over the passwordless component's `sessions` table and
 * this deployment's `memberships` ([[REQ-134]], [[DOC-40]] §2).
 *
 * TWO NARROW READS AND NO WRITE. The session row says the cookie is live and
 * names an opaque subject; the membership read says whether that subject operates
 * anything. Neither reaches a site, a tenant or a business — there is nothing here
 * to scope, because nothing here is about the site being served.
 *
 * A FAILED READ IS "SIGNED OUT", AND THAT IS THE SAFE DIRECTION. The tables the
 * component owns are applied by the host that consumes it, and a deployment that
 * has not yet stood the sign-in routes up has no `sessions` table. Answering
 * "signed out" there is exactly right — there are no sessions to be signed in
 * with — and it can never grant anything, because the only thing this answer can
 * do is swap one visible control for another on a page that was public either way.
 */
export class D1SessionReader implements SessionReader {
  constructor(
    private readonly db: SessionDatabase,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  async read(sessionId: string): Promise<SessionFacts | null> {
    try {
      const session = await this.db
        .prepare('SELECT subject_id FROM sessions WHERE id = ? AND expires_at > ?')
        .bind(sessionId, this.now())
        .first<{ subject_id: string }>()
      if (!session?.subject_id) return null

      const membership = await this.db
        .prepare(
          "SELECT 1 AS held FROM memberships WHERE user_id = ? AND status = 'active'" +
            ' AND revoked_at IS NULL LIMIT 1',
        )
        .bind(session.subject_id)
        .first<{ held: number }>()
      return { operatesBusiness: membership !== null }
    } catch {
      return null
    }
  }
}
