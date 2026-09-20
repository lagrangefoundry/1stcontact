/**
 * The assistant can report a defect ([[REQ-273]]).
 *
 * WHAT WAS MISSING, AND WHAT WAS NOT. `@lagrangefoundry/ai-ticketing` has shipped
 * a SECOND declaration beside `tickets` for a long time — surface `development`,
 * group `FileDevelopmentTickets`, operations `report_bug`, `request_capability`
 * and `add_ticket_detail` — and this product had never composed it. So the
 * builder assistant could read every ticket in the client's project and had no
 * way at all to file a defect in OUR software: three of them reached the operator
 * as prose in a chat pane and a person transcribed them by hand.
 *
 * WHY NOT `WriteTickets` ON THE CLIENT'S STORE. That grant exists, it is one line
 * away in `ai.ts`, and it is the wrong answer: it would let the assistant create
 * and patch arbitrary tickets in the CLIENT'S store, which is the client's data,
 * in the client's tenant, and is not where a defect in our software belongs. The
 * decision `sessionTicketSurface` records — read the client's tickets, write none
 * of them — is unchanged by this file. What changes is that there is now a
 * SECOND store, which is ours, and three verbs that reach only it.
 *
 * THE BARRIER IS THE HANDLE, NOT A PREDICATE — the same rule `tickets.ts` states
 * for tenancy, applied in the other direction. Nothing here touches `TicketStore`
 * and nothing here is `forTenant`-bound, because nothing here reaches the
 * client's store at all. A ticket filed through this surface therefore cannot
 * appear in the client's ticket views, cannot appear in their Library, and cannot
 * enter the project knowledge base the consultant searches: those are all
 * projections of the tenant store, and this writes somewhere else entirely.
 *
 * ## Where "somewhere else" is, and how a Worker reaches it
 *
 * The project that builds this product is an xgd project on a developer's disk.
 * Upstream's own reach to one (`XgdProject`, behind the package's `./node`
 * subpath) spawns the project's CLI, and `node:child_process` does not exist in
 * workerd — which is exactly why the `development` surface takes a PROJECT HANDLE
 * rather than importing one, and why upstream says in as many words that "the
 * same three methods can be served over HTTP by a ticket server, and this file
 * does not change".
 *
 * {@link httpProject} is that HTTP client, written against the three methods the
 * surface calls. Today the thing answering is the local filing service — a
 * loopback listener in a `1c` process (`1c filing`, or `1c builder` as a
 * convenience), which holds the real `XgdProject` and is therefore the one place
 * a subprocess is spawned. WHICH `1c` STARTED IT IS NOT THIS FILE'S BUSINESS AND
 * NO LONGER ANYONE'S ([[BUG-124]]): the address is configuration, read from the
 * same env files as every other var. The day there is a hosted ticket server, the
 * answer is a different address in that same configuration rather than a line of
 * code here.
 *
 * THREE CONSEQUENCES WORTH STATING PLAINLY:
 *
 *   - THE TRANSLATION IS NOT DUPLICATED. The service runs upstream's `XgdProject`
 *     verbatim, so the two-call create-then-read-back, the xgd error-code
 *     mapping and `WrittenButUnreadable` all stay in the one place they were
 *     written. This side carries a transport and a rehydration of what came back,
 *     and no knowledge of xgd whatsoever.
 *   - WORKERD CAN REACH LOOPBACK, and that was measured rather than assumed
 *     before any of this was written: a `fetch('http://127.0.0.1:…')` from
 *     inside the workers pool answers normally. It is the one runtime fact the
 *     whole arrangement rests on and it is not written down anywhere else.
 *   - A DEPLOYMENT WITH NO ADDRESS COMPOSES NO SURFACE. `null` is ordinary here,
 *     exactly as it is for a missing browser or a missing image credential: the
 *     assistant is not told about a tool it has not got, which is DOC-20's rule
 *     and the honest alternative to a surface that refuses every call. A deployed
 *     builder talking to a real client has no project to file into and will say
 *     it cannot file rather than failing at it.
 */

import * as ticketBridge from './generated/ai-ticketing.js'

/** The bridge is untyped JavaScript; the boundary is narrow and named here. */
type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

const bridge = ticketBridge as unknown as Untyped

/**
 * The one thing this product has to tell the model that upstream cannot.
 *
 * THE DECLARATION ALREADY CARRIES THE REST. It says what the surface is for, that
 * what is filed reaches the people who build the product and nobody else, and —
 * the discipline this ticket specifically asked for — that "filing is not
 * something to do on your own initiative. Someone asks for a ticket; your part is
 * writing the good version of it." None of that needs restating, and a copy here
 * would be the second copy that drifts.
 *
 * WHAT IT CANNOT CARRY IS WHOSE MATERIAL THIS SESSION IS HOLDING. Upstream's
 * surface knows nothing about tenants, briefs or transcripts; this product's
 * whole information barrier is built on them. A report is about OUR software, and
 * a report that quotes the client's brief to illustrate a defect has moved the
 * client's confidential material into our project store — where it is outside
 * every barrier `tickets.ts` builds and nothing will ever take it out again. So
 * the sentence is appended HERE, where the fact it states is true.
 *
 * AS AN OVERVIEW AMENDMENT AND NOT A PRIMING ENTRY, deliberately. Priming is
 * static per role and would tell a deployment with no filing service about a
 * capability it has not got. The declaration override is composed exactly where
 * the surface is, so the sentence exists precisely when the tool does.
 */
export const CONFIDENTIALITY_NOTE =
  'What you are working on for this business is theirs, and it does not belong ' +
  'in a report filed here. Name the surfaces, operations, arguments and outcomes ' +
  'that were involved and describe the defect in those terms. Do not quote or ' +
  'summarise their brief, their material, their conversation with you, or ' +
  'anything identifying them — a report that needs their content to make sense ' +
  'is a report that has not yet found what actually went wrong.'

/**
 * The declaration as this product composes it: upstream's, plus the sentence
 * above.
 *
 * A COPY OF THE OBJECT AND NEVER A MUTATION OF IT. The shipped declaration is a
 * module-level import shared with anything else that reads it, and a surface that
 * edited it in place would amend a document its neighbours also hold.
 */
export function developmentDeclaration(): Record<string, unknown> {
  const shipped = bridge.DEVELOPMENT_DECLARATION as { overview?: string }
  return {
    ...shipped,
    overview: `${String(shipped.overview ?? '').trimEnd()}\n\n${CONFIDENTIALITY_NOTE}`,
  }
}

/**
 * What a project handle has to do — upstream's three methods, named here so this
 * file's own transport can be type-checked against them.
 *
 * `Untyped` returns rather than a modelled ticket: the shapes are upstream's, the
 * surface projects them itself, and a second declaration of them here would be a
 * copy that drifts.
 */
export interface DevelopmentProject {
  create(spec: { type: string; title: string; body?: string; status?: string | null }): Promise<Untyped>
  append(spec: { uid: string; body: string }): Promise<Untyped>
  get(spec: { uid: string }): Promise<Untyped>
}

/**
 * A failure that came back from the project, as the Toolbox reads one.
 *
 * DUCK-TYPED ON PURPOSE, and this is not laziness. `describeFailure` reads
 * `code`, `detail` and `message` off whatever was thrown and renders the refusal
 * from the DECLARATION's error table — it never asks what class it is. So
 * rehydrating upstream's four exception classes across the wire would buy
 * nothing, and would pull four more names into the generated shim to buy it.
 *
 * The declared codes (`validation`, `not_found`, `project_unreachable`,
 * `written_but_unreadable`) arrive from the service, which got them from
 * upstream's own error objects. Nothing here invents one.
 */
export class DevelopmentFailure extends Error {
  readonly name = 'DevelopmentFailure'
  constructor(
    message: string,
    readonly code: string,
    readonly detail: string = '',
  ) {
    super(message)
  }
}

/** How long a single filing call may take before the project counts as absent. */
export const FILING_TIMEOUT_MS = 20000

/**
 * The project, over HTTP.
 *
 * ONE REQUEST SHAPE FOR ALL THREE METHODS — `{op, ...args}` to one address —
 * because the three are one conversation with one listener and a path grammar
 * would be a second thing to keep in step across two files.
 *
 * A DECLARED FAILURE IS A 200. The listener answers `{ok: false, error}` for
 * anything the project itself refused, and reserves a non-200 (and a network
 * error, and a timeout) for "the listener could not be reached". That split is
 * the whole reason the transport can be honest: `project_unreachable` says
 * NOTHING WAS FILED and invites a retry, so a refusal wearing it would invite
 * the model to file the same ticket twice.
 *
 * @param url the filing service's address
 * @param token the bearer it was started with, or `''` where it wants none
 * @param fetchImpl injectable so a UAT drives this without a listener
 */
export function httpProject(
  url: string,
  token: string,
  fetchImpl: typeof fetch = fetch,
): DevelopmentProject {
  async function call(op: string, args: Record<string, unknown>): Promise<Untyped> {
    let response: Response
    try {
      response = await fetchImpl(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ op, ...args }),
        signal: AbortSignal.timeout(FILING_TIMEOUT_MS),
      })
    } catch (error) {
      throw new DevelopmentFailure(
        `the project could not be reached: ${(error as Error)?.message ?? String(error)}`,
        'project_unreachable',
      )
    }
    if (!response.ok) {
      // A MISCONFIGURATION IS `project_unreachable` AND NOT A REFUSAL. A wrong
      // token, a listener that has gone away and a 500 are all "this product is
      // set up wrong" — which is what that code's declared message says, and
      // what makes "tell whoever asked that the ticket could not be filed" the
      // right thing for the model to do about it.
      throw new DevelopmentFailure(
        `the project could not be reached: the filing service answered ${response.status}`,
        'project_unreachable',
      )
    }
    let payload: Untyped
    try {
      payload = await response.json()
    } catch {
      throw new DevelopmentFailure(
        'the project could not be reached: the filing service answered with no JSON',
        'project_unreachable',
      )
    }
    if (payload?.ok === true) return payload.result
    const failure = payload?.error ?? {}
    throw new DevelopmentFailure(
      String(failure.message ?? 'the project refused the ticket'),
      String(failure.code ?? 'project_unreachable'),
      String(failure.detail ?? ''),
    )
  }

  return {
    create: (spec) => call('create', spec as unknown as Record<string, unknown>),
    append: (spec) => call('append', spec as unknown as Record<string, unknown>),
    get: (spec) => call('get', spec as unknown as Record<string, unknown>),
  }
}

/**
 * The `development` surface and the grant that travels with it.
 *
 * THE GRANT TRAVELS WITH THE SURFACE, like the knowledge surface's, the ledger's
 * and the ticket surface's, and for the reason `ai.ts` already states: this
 * declaration is UPSTREAM'S, and `instances.json` is validated against the
 * declarations THIS repository holds — so a key there would be a grant the
 * validator could never check.
 *
 * `FILE_GROUP` IS READ FROM THE BRIDGE'S OWN VOCABULARY rather than spelled
 * `'FileDevelopmentTickets'` here, which is the rule `sessionTicketSurface`
 * already follows for `READ_GROUP`: a literal would go on granting *something*
 * the day upstream renamed the group, rather than failing to construct.
 *
 * NO SCOPE AXES, and upstream says why: the two things a scope could narrow —
 * which project and which ticket type — are not parameters of any operation
 * here. The project is fixed when the handle is built and the type follows from
 * which verb was called, so there is no argument through which a ticket could be
 * filed somewhere, or as something, unintended.
 */
export interface DevelopmentSurface {
  surface: Untyped
  granted?: Record<string, unknown>
}

export function developmentSurface(project: DevelopmentProject): DevelopmentSurface {
  return {
    surface: new bridge.DevelopmentToolbox(project, developmentDeclaration()),
    granted: bridge.developmentInstanceConfig({ groups: [bridge.FILE_GROUP] }),
  }
}

/** What a deployment needs to reach the project that builds it. */
export interface DevelopmentEnv {
  /**
   * Where the filing service is listening, or absent.
   *
   * A LINE IN `.dev.vars`, WHICH IS TO SAY A SETTING ([[BUG-124]]). It used to be
   * a `--var` composed by `1c builder`, because the port was bound as 0 and the
   * bearer minted per run — so only the process that had just minted them could
   * say what they were. That made this var, and therefore this whole surface, a
   * property of HOW THE DEV SERVER WAS LAUNCHED: started any other way, the
   * Worker saw nothing here and the assistant silently had no filing tool. The
   * defence offered for it — that a committed value would be a stale one — was
   * circular, since the value was only unpredictable because it had been
   * randomised. A fixed loopback port cannot go stale, so it lives in the file
   * wrangler reads anyway and every launch path sees the same address.
   *
   * STILL NO `[vars]` ENTRY, and that part was always right: `.dev.vars` is
   * gitignored and per-clone, and a DEPLOYED builder has no project on any disk
   * to file into. Absent is the ordinary production state.
   */
  DEVELOPMENT_TICKETS_URL?: string
  /**
   * The bearer the service was started with.
   *
   * WHY A TOKEN FOR A LOOPBACK LISTENER. Loopback keeps other machines out; it
   * does not keep out a page in the operator's own browser, which can POST JSON
   * cross-origin without ever reading the answer. What that page could do is file
   * tickets into our project store, which is a nuisance rather than a breach —
   * but the token costs one header and removes it.
   *
   * FIXED PER CLONE RATHER THAN PER RUN, AND STILL UNGUESSABLE. What closed that
   * hole was never the freshness; it was that the page cannot read the value.
   * `.dev.vars` is gitignored, so a token minted into it once is as unreadable to
   * that page as a new one every run — and, unlike a new one every run, it is
   * still correct after the listener restarts. A value in `wrangler.toml` would
   * NOT be: that file is committed, and a well-known bearer is no bearer at all.
   */
  DEVELOPMENT_TICKETS_TOKEN?: string
}

/**
 * The filing surface for this deployment, or `null` where it has no project.
 *
 * THE ADDRESS IS THE WHOLE TEST. A deployment either knows where its project is
 * or it does not, and this is the single place that question is asked — the same
 * shape `cloudflareFor` has for a missing credential.
 */
export function developmentFor(
  env: DevelopmentEnv,
  fetchImpl: typeof fetch = fetch,
): DevelopmentSurface | null {
  const url = (env.DEVELOPMENT_TICKETS_URL ?? '').trim()
  if (!url) return null
  return developmentSurface(httpProject(url, (env.DEVELOPMENT_TICKETS_TOKEN ?? '').trim(), fetchImpl))
}
