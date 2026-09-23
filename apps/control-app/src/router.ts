import {
  editAssetList,
  editCopyGet,
  editCopySet,
  editPageList,
  editPageUpdate,
  editPaletteAdd,
  editPaletteGet,
  editPaletteRename,
  editPaletteRm,
  editPaletteSet,
} from '../../../tools/generate/src/cli/edit'
import {
  CommandError,
  InvalidDefinitionError,
  NO_PUBLIC_ADDRESS_CODE,
  NoPublicAddressError,
} from '../../../tools/generate/src/cli/errors'
import { PreviewRenderer, type PreviewChannel } from '../../../tools/generate/src/cli/preview'
import {
  PORTAL_PATH,
  PORTAL_SLUG,
  portalBusinessId,
  portalFallbackStore,
} from './portal'
// THE PORTAL'S ONE WRITE AND THE READ BESIDE IT ([[REQ-245]]). Both come from
// the acceptance layer rather than being assembled here: the refusals that bound
// the write are facts about what an acceptance IS, and a route that restated any
// of them would be a second place for them to be true.
import {
  AcceptanceDocumentNotFoundError,
  AcceptanceRefusedError,
  UnknownAcceptanceError,
  portalAcceptances,
  setPreference,
} from './acceptances'
import { eventsOf, type EventEnv } from './events'
import { ChatAddressError, readChats, writeChats, type ChatsPayload } from './chat-copy'
import { payloadToWrite, readSiteDraft, type SitePayload } from '../../../tools/generate/src/cli/push'
import { publishSite, revisionHistory } from '../../../tools/generate/src/publish/publish'
import type {
  ImageLadder,
  LadderProgressReporter,
} from '../../../tools/generate/src/publish/ladder'
import { ladderFor } from './image-ladder'
import { liveRevisionOf } from '../../../tools/generate/src/store/revision-model'
import { previewPath, publicSiteUrl } from './public-url'
// [[BUG-97]] — the draft channel answers the gated download too, so the link a
// preview submission mails is one the operator can actually open.
import { openGate, takeAsset } from './gate'
import {
  downloadsPage,
  GATE_CACHE,
  GATE_HEADERS,
  parseDownloadPath,
} from '../../../packages/framework/src/modules/contact-form/gate'
/*
 * THE LEAD ENDPOINT IS IMPORTED, NOT REBUILT ([[BUG-78]]). `handleLead` is
 * `public-site`'s, and it stays `public-site`'s: it owns what a hostile caller
 * meets, and the preview needs exactly those refusals rather than a second set
 * that agrees with them today. The WRITE it calls is already ours — `captureLead`
 * below is the same function `worker.ts`'s `LeadIntake` entrypoint delegates to,
 * which is why the preview needs no service binding to reach it.
 */
import { handleLead, type LeadEnv as LeadRequestEnv } from '../../public-site/src/lead'
import { captureLead, type LeadEnv as LeadIntakeEnv, type LeadSubmission } from './lead'
import { UnknownTenantError } from '../../../tools/generate/src/store/d1r2-store'
import type { TenantSiteStore } from '../../../tools/generate/src/store/d1r2-store'
import type { SiteStore } from '../../../tools/generate/src/store/site-store'
import { upgradeSiteModules } from '../../../tools/generate/src/store/upgrade-site'
import {
  openBusinessSession,
  openSession,
  streamPrompt,
  tailSession,
  UnknownSessionError,
} from '../../../tools/generate/src/cli/ai/host-core'
import {
  sessionImageDescriber,
  sessionTextDescriber,
  workerHost,
  type WorkerHost,
} from './ai'
import { imageSurface } from './imagegen'
// [[REQ-273]] — filing a defect in THIS software. The surface, the HTTP reach to
// the project that builds it, and the one place a deployment's address becomes a
// capability all live in one module; this router is its only caller.
import { developmentFor, type DevelopmentEnv, type DevelopmentSurface } from './development'
import { canEmbed, type EmbedderEnv } from './embedder'
import { chatLibrary } from './library'
// THE BUSINESS'S OWN RECORD ([[REQ-237]]) — one module owns the name rule, and
// this route is one of its two ordinary callers.
import {
  BusinessNameTakenError,
  InvalidBusinessNameError,
  businessSettings,
  renameBusiness,
} from './business'
import {
  HostnameAlreadyHeldError,
  HostnameTakenError,
  InvalidHostnameError,
  NoSiteError,
  PLATFORM_APEX,
  ReservedHostnameError,
  addressesOf,
  businessAddresses,
  checkHostname,
  claimHostname,
  revokeHostname,
  siteOf,
} from './hostname'
// [[REQ-258]] — serving a custom domain. The records, the runtime Worker route
// and the row, composed in one module so no call site can perform two of the
// three and report success.
import {
  NoZoneForHostError,
  ZoneNotReadyError,
  serveHostOnSite,
  stopServingHost,
} from './serving'
// [[REQ-257]] — the DNS layer. The zone table, the enumerated Cloudflare client
// and the external resolver, each reached through its own module and never a
// second time: this router is one of the three consumers the ticket names.
import {
  cloudflareFor,
  CloudflareApiError,
  CloudflareNotConfiguredError,
  type CloudflareClient,
  type CloudflareEnv,
} from './cloudflare'
import { dnsResolver, ResolverUnreachableError, type DnsResolver } from './resolver'
// [[REQ-259]] — the customer-facing configuration for a domain we already hold:
// the selector, the sending toggle, and release. It composes [[REQ-257]]'s pool
// and resolver with [[REQ-258]]'s serving, and this router is its one caller.
import {
  attachDomain,
  domainState,
  NotTheAccountHolderError,
  releaseDomain,
  setDomainEmail,
  UnknownDomainError,
  isAccountHolder,
} from './domains'
import { SendingNotConfiguredError } from './sending'
// [[REQ-260]] — the assistant's domain tools, the change history and the undo.
// The wire is `dns-assistant.ts`; every safety rule is `dns-ops.ts`'s and holds
// for these routes exactly as it does for the assistant, which is the point of
// them being there rather than here.
import { businessDns, changeView, undoDnsChange } from './dns-assistant'
import {
  DnsAlreadyUndoneError,
  DnsDriftError,
  UnknownDnsChangeError,
  changesFor,
} from './dns-changes'
import {
  resendFor,
  ResendApiError,
  ResendNotPermittedError,
  type ResendClient,
} from './resend'
import {
  attributeZone,
  allZones,
  driftCheck,
  PlatformZoneError,
  UnknownZoneError,
  ZoneApexTakenError,
} from './zones'
import { fidelityDeps } from './shot'
import {
  d1TurnSpend,
  tenantDelegatedSpend,
  tenantSpendDays,
  tenantSpendLeague,
  tenantSpendReport,
  type SpendPeriod,
} from './spend'
import {
  openTurn,
  sessionTurnFailure,
  tenantTurns,
  turnHealth,
  type OpenTurn,
  type TurnLogOutcome,
} from './turn-log'
import { platformSites } from './directory'
import { siteImageLibrary } from '../../../tools/generate/src/cli/edit'
import { mergeImageLibraries } from '../../../tools/generate/src/cli/image-library'
import type { ImageLibrary } from '../../../tools/generate/src/cli/image-library'
import { imageRendererFor, materialRecipes, republishingRecipes } from './image-edit'
import {
  RecipeRefusedError,
  type ImageRenderer,
} from '../../../tools/generate/src/cli/image-recipe'
import { adoptCapture } from './capture-material'
import { r2ReferenceStore } from '../../../tools/generate/src/store/r2-reference-store'
import {
  assertNotCaptureMirrored,
  MirroredAssetError,
} from '../../../tools/generate/src/store/asset-rights'
import type { ReferenceStore } from '../../../tools/generate/src/store/reference-store'
import type { BrowserLauncher } from '../../../tools/generate/src/cli/capture/cf-driver'
import type { HostDeps } from '../../../tools/generate/src/cli/ai/host-core'
import {
  addContact,
  CONTACT_CHANGE_POLL_MS,
  contactChangeHead,
  contactsChangedSince,
  InvalidContactError,
  InvalidPersonRecordError,
  openGrant,
  peopleOf,
  personDetail,
  type PersonPatch,
  revokeGrant,
  setPersonRecord,
  setPersonStatus,
  UnknownPersonError,
  windBack,
} from './people'
import {
  discardSender,
  inboundFor,
  pendingInbound,
  promotePending,
  restoreSender,
  suppressedAddresses,
  UnknownMessageError,
} from './inbound'
import {
  inviteDraft,
  invitePeople,
  UnknownInviteeError,
  type InviteResult,
} from './invites'
import { currentNameOf, type NamePatch } from './names'
import { displayNameFrom, NAME_PART_NAMES } from './builder/people-name.js'
import { chromeHtml } from './chrome'
import { redactor } from './redact'
import { KINDS } from './generated/logging'
import type { RequestLog } from './log'
import { storeFor, TenantNotConfiguredError, type StoreEnv } from './store'
import { NoBusinessError, businessPath, splitBusinessPrefix, type Scope } from './scope'
import {
  findAccount,
  ownsBusiness,
  ownsPlatformBusiness,
  provisionBusiness,
  type Admission,
  type BusinessLapse,
  type IdentityEnv,
} from './identity'
import {
  BlobsNotConfiguredError,
  ticketStoreFor,
  type TicketStore,
  type TicketStoreEnv,
  type TicketStoreOptions,
  type TicketSubscription,
} from './tickets'
import { bouncedContactIds, messagesFor } from './messages'
import { projectKnowledgeFor } from './knowledge'
import { systemKnowledge } from './system-knowledge'
import { sessionKnowledgeFor } from './session-knowledge'
import type { DescribeImage, DescribeText } from './describe'
import { FetchRefusedError } from './fetch-guard'
import { mailerFor, mailFrom, MailNotConfiguredError, type MailEnv, type SendEmail } from './mail'
import {
  inviteUrlIssuer,
  SessionsNotConfiguredError,
  type SessionCookieEnv,
  type SessionEnv,
} from './sessions'
import { type ConvertHeic, imagesHeicConverter, type ImagesLike } from './heic'
import { TemplateRefusedError } from './templates'
import {
  AlreadyOnSiteError,
  archiveMaterial,
  ingestFetch,
  ingestUpload,
  listMaterial,
  MATERIAL_CHANGE_POLL_MS,
  materialFile,
  materialImageLibrary,
  MaterialRejectedError,
  NotAPictureError,
  NotMaterialError,
  NotRepublishableError,
  pictureChoices,
  placedOriginOf,
  placePicture,
  type PictureChoice,
  promoteToSiteAsset,
  readMaterial,
  reviseDescription,
  reviseRole,
  reviseName,
  reviseRecipe,
  RoleNotChosenError,
  watchMaterial,
  type IndexMaterial,
  type MaterialChange,
  type MaterialRole,
} from './material'

/**
 * The builder's route table, in workerd (REQ-145 phases 2 and 3).
 *
 * This is `handleBuilderRequest` — the same routes, over the same functions,
 * against the same {@link SiteStore} port. What changed is the transport
 * (`Request`/`Response` rather than `node:http`) and the adapter underneath the
 * port (D1 + R2 rather than the filesystem). Nothing here reimplements an edit:
 * every write goes through the `edit*` functions the `1c` CLI dispatches to, so
 * the builder remains a second *producer* of structured edits and never a second
 * write path. Validation, atomicity and the journal all stay where they live.
 *
 * THREE ROUTES ARE GONE, not moved. `/builder/*`, `/webui/*` and `/framework/*.js`
 * are build artifacts now (`1c assets`), served by the assets binding. Nothing
 * below type-strips, transpiles or resolves a package at request time.
 *
 * They are reached by FALLING THROUGH to `env.ASSETS`, at the end, rather than by
 * letting the assets binding answer ahead of the Worker. That ordering is a
 * security control (`wrangler.toml`): the Access gate lives in `fetch`, so bytes
 * served before `fetch` are bytes served to anyone. Falling through here means
 * an asset is delivered only to a caller the gate has already verified.
 *
 * PUBLISH ANSWERS FOR REAL NOW ([[REQ-149]]). It was the last 501: the port had
 * no notion of a revision, so the capability genuinely did not exist here. The
 * port has five revision verbs and `publish.ts` sequences them, so this route is
 * a transport over the same function `1c publish` calls — which is why the Node
 * transport no longer intercepts the path on its way past.
 *
 * `/api/ai/*` was the other such route, deferred to lagrange-framework REQ-103
 * because the library loaded itself from an out-of-repo artifact store by file
 * URL. REQ-103 landed the `/workers` packaging and [[REQ-146]] wired it in, so
 * those routes now answer for real.
 */

/** The channels a preview URL may name. `published` is served from R2 by public-site. */
const PREVIEW_CHANNELS: PreviewChannel[] = ['draft', 'edit']

/**
 * One {@link PreviewRenderer} per STORE, so the render cache survives across
 * requests. A cache entry can never go stale: the renderer re-checks the
 * definition's stamp before reading it, which is a store read either way — the
 * cache saves the *render*, not the lookup that proves it current.
 *
 * Keyed by the store OBJECT, not by its tenant id. The Worker has one store per
 * tenant per isolate, so the two are equivalent there — but the Node transport
 * opens a store per workspace, all of them the same notional tenant, and a
 * tenant-keyed cache handed the first workspace's renderer to every later one.
 * A `WeakMap` also lets a finished workspace's renderer be collected with it.
 */
const PREVIEWS = new WeakMap<SiteStore, PreviewRenderer>()

/**
 * The chat host, ONE PER BUSINESS PER ISOLATE (REQ-146, scoped by [[REQ-168]]).
 *
 * Every other route builds its store per request, because `forTenant` performs
 * the tenant check and a cached handle would carry a check made against a row
 * that may since have been deactivated. The chat routes cannot do that: the AI
 * host keys its `SessionManager` cache by the store's OBJECT IDENTITY, so a new
 * store per request is a new manager per request — the conversation would reset
 * on every turn and the junction would be empty every time.
 *
 * IT WAS ONE PER ISOLATE, FULL STOP, AND THAT BECAME A LEAK. A single module
 * `let` held a site store, a ticket store and an opened project KB, all bound to
 * whichever tenant made the FIRST chat request in that isolate. With one
 * configured tenant that was harmless. With the scope coming from the caller's
 * identity it is a cross-business leak: a second caller sharing the isolate takes
 * their turn against the first caller's store, transcripts and KB vectors. Under
 * [[DOC-40]] §2 it does not even take two people — one operator switching between
 * two of their own businesses straddles the same isolate, so it is reachable in
 * ordinary single-user use.
 *
 * KEYED BY SCOPE, which keeps the property the paragraph above needs and
 * partitions it. Reuse stays per-isolate WITHIN a business and cannot cross one.
 * Nothing upstream changes: `host-core.ts` already keys its manager cache by the
 * store's object identity, so it partitions for free as soon as the store does.
 *
 * The map is not bounded, and does not need to be: isolates are short-lived and
 * it dies with them. What is given up is unchanged — re-checking a deactivation
 * mid-isolate, on these two routes only — and `resolveScope` now checks
 * `tenants.status` per request ahead of this, which is what makes that
 * acceptable rather than merely stated.
 */
const CHATS = new Map<string, Promise<WorkerHost>>()

/**
 * The assistant's eyes, assembled for one business ([[REQ-206]]).
 *
 * THE SURFACE WAS BUILT, TESTED AND GRANTED AND SIMPLY NEVER MOUNTED. `1c`
 * supplied `HostDeps.fidelity` from the day it landed ([[REQ-157]]); this host
 * did not, so a consultant in the builder had no `capture_site`, no
 * `screenshot`, no `compare` — and, because the manual is projected from the
 * grant, no way to learn they existed. Asked whether it could take a picture it
 * said no, truthfully. This is the wire, and it is the whole of the change.
 *
 * NULL WHERE EITHER HALF IS MISSING, and both absences are ordinary. Without
 * `BROWSER` there is nothing to look with; without `BLOBS` there is nowhere
 * private to keep what is looked at, and a capture written into the bucket
 * `public-site` serves from is the disclosure shape [[REQ-155]] refuses. A
 * deployment missing either still opens the session, still replays the
 * transcript and simply has no eyes.
 *
 * A FACTORY OF THE SLUG, because that is the shape `HostDeps` declares and the
 * reason it declares it: the surface is bound to one site at construction, so no
 * operation takes a site and no picture can name a site the session is not
 * about. Nothing rations what it then does: the per-session browser quota that
 * used to be minted here was removed on purpose ([[REQ-286]]) — what is scarce
 * is the conversation's context, and that is metered in tokens at the point of
 * call rather than in page loads here.
 *
 * EXPORTED for the reason {@link previewRenderer} is: a UAT that wants to prove
 * what this deployment actually hands the surface — its adoption, the bucket its
 * references live in, that it looks as often as the work needs — must reach the
 * production assembly rather than build a second one that agrees with it today.
 */
export async function sessionFidelity(
  env: RouterEnv,
  scope: Scope,
  deps: RouterDeps,
  store: TenantSiteStore,
  tickets: TicketStore,
  origin: string,
): Promise<HostDeps['fidelity']> {
  // `deps.launch` is the injected browser and `env.BROWSER` is the real binding.
  // Neither present means no eyes; no `BLOBS` means nowhere private to keep what
  // is looked at, which is the same answer for a different reason.
  if (!deps.launch && !env.BROWSER) return null
  if (!env.BLOBS) return null

  // THE RENDERER, SO A PICTURE CAN BE LOOKED AT AS IT CURRENTLY STANDS
  // ([[REQ-219]]). Null where this deployment has no `[images]` binding, which
  // makes every picture its own original — the answer this surface gave before
  // recipes existed, and still the right one for a deployment that cannot apply
  // them.
  const renderer = imageRendererFor(env, scope.businessId)

  // THE CLIENT'S OWN PRIVATE BUCKET, bound to THIS business by `forTenant`, so
  // one business never sees another's references. That barrier is a property of
  // the handle rather than a predicate the surface has to remember, which is why
  // nothing below re-enforces it.
  const references = await r2ReferenceStore({ DB: env.DB, BLOBS: env.BLOBS }).forTenant(
    scope.businessId,
  )

  /**
   * What turns a finished bundle into findable material ([[REQ-166]]).
   *
   * PART OF THIS TICKET RATHER THAN A FOLLOW-ON. A capture that stored perfectly
   * and was never written up looks identical to one that worked, and a client
   * who asks the assistant to "make it look like our old site" and is told the
   * capture cannot be found has been given half a feature.
   *
   * THE INDEXER AND THE DESCRIBER ARE RESOLVED PER ADOPTION, not once per host.
   * `defaultIndexer` opens the project knowledge base, and a capture is rare
   * where a chat host is per-isolate — holding a KB handle open for the life of
   * every conversation to serve an operation most of them never call is the
   * wrong way round. Both are the same seams `/api/material` resolves, so a
   * capture and an upload become material by one path.
   */
  const adopt = async (bundle: string): Promise<{ uid: string; created: boolean }> => {
    const adopted = await adoptCapture(
      tickets,
      references.bundle(bundle),
      // NO `clientDomain` YET, so every capture is marked third-party: not
      // republishable, exportable. Nothing in the schema declares a business's
      // own domain ([[DOC-43]] §5's mapping table is not built), and guessing
      // one would mark somebody else's site as the client's own — the direction
      // that gets a stranger's page republished. The conservative half is the
      // safe half, and this becomes a one-line read when the table lands.
      {},
      {
        index: deps.index
          ? await deps.index(env, scope)
          : await defaultIndexer(env, scope),
        describeImage: deps.describeImage ?? defaultDescriber(env),
      },
    )
    return { uid: adopted.ticket.uid, created: adopted.created }
  }

  return (site: string) =>
    fidelityDeps(
      env,
      // THE SAME RENDERER THE `/preview/*` ROUTE USES, memoised per store. A
      // second instance would render the draft a second time and could answer
      // from a different stamp than the one the operator is looking at.
      previewRenderer(store),
      references,
      origin,
      site,
      // Spread rather than set to `undefined`: `ShotDeps.launch` is optional and
      // an explicit `undefined` would satisfy the type while reading as a
      // launcher that was supplied and is broken.
      deps.launch ? { launch: deps.launch } : {},
      adopt,
      // REQ-218 — BOTH NAMESPACES, MERGED HERE BECAUSE THIS IS WHERE BOTH STORES
      // ARE IN SCOPE. A client asking about "the logo" does not know whether it
      // is a file they dropped on the conversation or a drawing already on the
      // site, and neither does the assistant answering them; merging at the one
      // seam that holds both handles is what makes that not a question anybody
      // has to answer. The barrier the two buckets exist to keep is untouched —
      // nothing here copies a byte across it, and each half still reads only its
      // own store.
      sessionPictures(store, tickets, renderer)(site),
    )
}

/**
 * Every stored picture this session can reach, as one library — [[REQ-218]]'s
 * merge, built once and handed to both surfaces that need it ([[REQ-219]]).
 *
 * ONE LIBRARY AND NOT TWO, which is the whole of why this is a function rather
 * than two call sites. The surface that LOOKS at a picture and the surface that
 * CHANGES one have to agree about what every picture is called, or the assistant
 * is told it can see something it cannot edit under the name it just used. They
 * agree by construction here, because there is one merge.
 *
 * THE RENDERER TRAVELS WITH THE LIBRARY HALF, so a picture asked for as it
 * currently stands arrives with its recipe applied — which is what makes *"crop
 * it, then look at it"* a thing the assistant can actually do. Absent, every
 * picture is its own original, which is the deployment that has no renderer.
 */
function sessionPictures(
  store: TenantSiteStore,
  tickets: TicketStore,
  renderer: ImageRenderer | null,
): (site: string) => ImageLibrary {
  return (site: string) =>
    mergeImageLibraries({
      site: siteImageLibrary(site, store),
      library: materialImageLibrary(tickets, renderer ?? undefined),
    })
}

/**
 * One material's bytes as the route should serve them — [[REQ-219]].
 *
 * SEPARATE FROM THE ROUTE BECAUSE IT IS A DECISION AND THE ROUTE IS A
 * TRANSPORT, which is the division every other handler in this file keeps.
 *
 * FOUR WAYS TO END UP WITH THE STORED BYTES, and only one of them is a failure:
 * the caller asked for the original; this deployment has no renderer; the
 * material is not a picture; or it is a picture nobody has edited. All four are
 * ordinary, and a picture in the last of them must not pay a transform — which
 * is every picture in the Library today.
 *
 * A RENDER THAT THROWS SERVES THE STORED BYTES. The pane's job is to show the
 * client their own file, and a renderer that refused a picture it had already
 * accepted a recipe for is a fault on our side; blanking the pane over it would
 * turn a degraded picture into a missing one.
 */
async function renderedMaterial(
  env: RouterEnv,
  scope: Scope,
  store: TicketStore,
  uid: string,
  file: { bytes: Uint8Array; contentType: string; filename: string },
  url: URL,
): Promise<{ bytes: Uint8Array; contentType: string }> {
  if (url.searchParams.get('original') !== null) return file
  const renderer = imageRendererFor(env, scope.businessId)
  if (!renderer) return file
  const width = Number(url.searchParams.get('width') ?? '')
  const wanted = Number.isInteger(width) && width > 0 ? { width } : {}
  try {
    const recipe = await materialRecipes(store).read(uid)
    if (recipe.length === 0 && wanted.width === undefined) return file
    const out = await renderer.render(file.bytes, file.contentType, recipe, wanted)
    return { bytes: out.bytes, contentType: out.mediaType }
  } catch {
    return file
  }
}

/**
 * What the `image` surface needs, or `null` where this deployment has no
 * renderer to apply a recipe with ([[REQ-219]]).
 *
 * THE SAME MERGE THE FIDELITY SURFACE GETS, so the two surfaces cannot disagree
 * about what a picture is called. What this adds is the one thing only a write
 * needs: somewhere to keep a recipe, which the Library has and the site's own
 * files do not — so `recipes` carries one namespace and the other's absence is
 * what `NOT_EDITABLE` is made of.
 */
export function sessionPicturesFor(
  env: RouterEnv,
  scope: Scope,
  store: TenantSiteStore,
  tickets: TicketStore,
): HostDeps['pictures'] {
  const renderer = imageRendererFor(env, scope.businessId)
  if (!renderer) return null
  const pictures = sessionPictures(store, tickets, renderer)
  return (site: string) => ({
    images: pictures(site),
    // WRAPPED, SO THE ASSISTANT'S CROP REACHES THE SITE ([[REQ-229]]). `edit_image`
    // writes a recipe through this port and nothing else; the wrapper is what
    // makes that write carry to the bytes the client's pages reference, by the
    // same function the modal's route calls. Without it the assistant would be
    // able to edit a picture and not to change it.
    recipes: {
      library: republishingRecipes(materialRecipes(tickets), {
        tickets,
        sites: store,
        renderer,
      }),
    },
    // WHERE AN ADJUSTMENT TO A PLACED PICTURE ACTUALLY LANDS ([[BUG-126]]). The
    // site's own files carry no recipe and never will, so the surface refuses
    // them — and the client is looking at the page, not at the Library. This is
    // the half that makes the refusal act on: it reads `placed_as` back the
    // other way, so the sentence names the Library item whose recipe governs
    // those bytes. The wrapper above is what then carries the edit to the page,
    // so the path the refusal describes is the path that already works.
    //
    // BOUND TO THIS SESSION'S SITE, like `assetUrl` and the libraries above: a
    // placement is recorded per slug, and an origin lookup that took one would
    // be able to ask about a site the conversation is not about.
    originOf: placedOriginOf(tickets, site),
    renderer,
  })
}

function chatHost(
  env: RouterEnv,
  scope: Scope,
  deps: RouterDeps,
  /**
   * This deployment's own address, taken from the request ([[REQ-206]]).
   *
   * THE FIDELITY SURFACE NEEDS SOMEWHERE TO NAVIGATE. A picture of the draft is
   * a real browser loading a real absolute preview URL, answered in process by
   * `previewOriginResolver` — so the origin is what makes the page's own
   * relative asset references resolve, and only the host knows its own address.
   *
   * IT IS TAKEN FROM THE FIRST REQUEST THAT BUILDS THE HOST, and the cache means
   * later requests do not revise it. That is correct rather than merely
   * tolerable: a deployment has one address, and a Worker answering on two would
   * render the same draft either way.
   */
  origin: string,
): Promise<WorkerHost> {
  let host = CHATS.get(scope.businessId)
  if (!host) {
    host = (async () => {
      const tenantId = scope.businessId
      const store = await (deps.store ?? storeFor)(env, scope)
      // THE TICKET STORE IS THE TRANSCRIPT'S HOME NOW ([[REQ-160]]), so it is
      // held for the isolate's life exactly as the site store above is, and for
      // the same reason: `TicketSessionArchive` caches the chat ticket's uid and
      // its transcript comment's uid per archive, and both lookups behind that
      // cache are full store scans (upstream BUG-29). A store per request would
      // be an archive per request, so every turn would pay the scan that only a
      // session's first turn should.
      const tickets = await (deps.tickets ?? ticketStoreFor)(env, scope)
      // Opened HERE and not inside `workerHost`, for the reason the store above
      // is: this is the one place per isolate where the expensive things are
      // built, and the KB is one of them — `KnowledgeRuntime.open` decodes the
      // whole bundled index into vectors. Doing it per request would decode it
      // per turn, for an artefact that cannot change while the isolate lives.
      //
      // TWO KNOWLEDGE BASES, ONE SESSION ([[REQ-160]]). `deps.knowledge` stays
      // exactly what it was — the SYSTEM half, injectable so a UAT can plant a
      // corpus whose content it chose — and `sessionKnowledgeFor` opens the
      // tenant's beside it. Composing here rather than widening that seam keeps
      // the injection point about the one KB a test has any business replacing:
      // the project corpus is the tenant's real D1 store either way.
      const system = await (deps.knowledge ?? systemKnowledge)(env)
      const knowledge = await sessionKnowledgeFor(env, scope, { system, tickets })
      // ONE RENDERER PER HOST, composed where every other expensive thing is and
      // handed to each surface that needs it ([[REQ-219]]). `null` where this
      // deployment has no `[images]` binding, which is the same ordinary absence
      // the fidelity and image surfaces already answer to.
      const renderer = imageRendererFor(env, scope.businessId)
      return workerHost(
        env,
        store,
        tenantId,
        tickets,
        knowledge,
        await sessionFidelity(env, scope, deps, store, tickets, origin),
        // THE ASSISTANT'S HANDS ([[REQ-208]]). Assembled here, like the eyes
        // above, because what the plugin needs is request-scoped: this
        // business's ticket store, normalised to this product's material
        // vocabulary, and the same indexer an upload goes through — so a
        // generated image is findable the instant it exists rather than after
        // some later pass.
        //
        // THE INDEXER IS RESOLVED THROUGH THE SAME SEAM THE UPLOAD ROUTES USE,
        // so a UAT that substitutes a counter observes a generated image being
        // indexed exactly as it observes an uploaded one — and `null` where this
        // deployment has no `AI` binding is the same ordinary degradation
        // `defaultIndexer` already documents.
        imageSurface(
          env,
          tickets,
          await (deps.index ?? defaultIndexer)(env, scope),
          {
            ...(deps.imageFetch ? { fetch: deps.imageFetch } : {}),
            // AND WHERE THE PICTURE IT MAKES CAN BE SEEN ([[REQ-217]]). The
            // route and the business are both here and nowhere else, which is
            // why the composition is here: `imagegen.ts` says what a display
            // sentence SAYS, this says what it points AT.
            materialUrl: (uid: string) =>
              businessPath(scope.businessId, `/api/material/file?uid=${encodeURIComponent(uid)}`),
          },
        ),
        // THE ASSISTANT'S HANDS FOR *CHANGING* A PICTURE ([[REQ-219]]).
        // Assembled here like the eyes and the generator above, and for the same
        // reason: what it needs is request-scoped — this business's ticket
        // store, the renderer bound to this business's rendition prefix, and the
        // merged picture library. `null` where there is no `[images]` binding,
        // which composes no surface at all.
        sessionPicturesFor(env, scope, store, tickets),
        // WHERE A DRAWING THE ASSISTANT MAKES CAN BE SEEN ([[REQ-217]]).
        //
        // THE SAME ADDRESS THE BUILDER'S OWN PREVIEW PANE LOADS, deliberately: a
        // drawing is a SITE ASSET and not a piece of material — `write_image`
        // mints no catalogue ticket and [[BUG-84]] settles that it should not —
        // so the only address it has is the one the draft channel serves it at.
        // A reader who clicks it opens nothing, and that is the designed
        // outcome rather than a gap.
        //
        // SCOPED EXPLICITLY. The builder's document stays at `/`, so a
        // root-absolute path pasted into a bubble would arrive naming no
        // business and resolve against the first admissible one — which for an
        // operator holding two is the crossing `scope.ts` exists to prevent.
        // Naming the business is what keeps a replayed transcript correct.
        (site: string, handle: string) =>
          /^[a-z][a-z0-9+.-]*:|^\/\//i.test(handle)
            ? handle
            : businessPath(
                scope.businessId,
                `/preview/${encodeURIComponent(site)}/draft/${handle.replace(/^\/+/, '')}`,
              ),
        // THE CLIENT'S CATALOGUE ([[REQ-228]]). Assembled here, like every wire
        // above it, because what it needs is request-scoped and both halves are
        // already open at this point: this business's ticket store, which is
        // where the Library lives, and the tenant site store, which is where a
        // placement puts the bytes.
        //
        // BOTH STORES ARE ALREADY TENANT-BOUND, so the surface cannot address
        // another client's material and nothing below re-enforces a barrier it
        // could not reach around anyway.
        //
        // WITH THE RENDERER, so a picture the assistant places arrives as it
        // currently stands ([[REQ-229]]). The same one every other surface on
        // this host is composed from — the catalogue and the client's Library
        // must not put different bytes on the site for the same material.
        (site: string) => chatLibrary(tickets, store, site, renderer ?? undefined),
        // THE BUSINESS'S OWN RECORD, AND WHICH BUSINESS THIS IS ([[REQ-239]]).
        //
        // ASSEMBLED HERE BECAUSE THE SCOPE IS HERE. `scope.businessId` is
        // resolved per request, before this host is built, and it is what the
        // settings conversation is ABOUT — so binding the record to it here is
        // the same act as keying this cache by it, made once. A host that bound
        // its own would be deciding which business a session is for, which is
        // `scope.ts`'s decision and has already been taken.
        //
        // `businessSettings` IS THE WIRE AND DECIDES NOTHING. What a refusal is
        // called and what shape the model reads are the surface's; whether a name
        // is free is `business.ts`'s, over the account that owns the business —
        // the same rule `/api/business/name` goes through, which is what makes
        // the pane and the assistant two callers of one operation rather than two
        // write paths.
        {
          businessId: scope.businessId,
          deps: businessSettings(env as unknown as IdentityEnv, scope.businessId),
        },
        // WHETHER A SITE HAS A PUBLIC ADDRESS ([[REQ-238]]). Assembled here for
        // the reason every wire above it is: the answer is a D1 query and the
        // identity environment is already in hand.
        //
        // IT IS THE SAME CALL `POST /api/publish` MAKES, and that is the point.
        // A publish must refuse a site with no address whichever path reached
        // it, and `Publish` being outside the consultant's grant today is a line
        // of configuration rather than a guarantee.
        (deps.addresses ?? addressesFor)(env),
        // THE CLIENT'S DOMAIN ([[REQ-260]]). Assembled here for the reason every
        // wire above it is — the identity environment and the scope are both in
        // hand — and NULL where this deployment has no zone credential, which
        // composes no surface at all rather than one that refuses every call.
        //
        // THE SAME CLIENT AND THE SAME RESOLVER `/api/domain` USES, through the
        // same injectable seams: one credential read, one place a deployment with
        // none is discovered, and a suite that drives the domain routes with
        // doubles drives the assistant's operations with the same ones.
        //
        // `businessDns` IS THE WIRE AND DECIDES NOTHING. Which names are
        // privileged, whether a policy may be published and what an SPF merge
        // produces are `dns-ops.ts`'s and hold for every caller — the assistant
        // is not where those rules live, and a rule that lived there could be
        // bypassed by a caller that renders no card.
        (() => {
          const client = deps.cloudflare ? deps.cloudflare(env) : cloudflareFor(env)
          if (client === null) return null
          return businessDns(
            env as unknown as IdentityEnv,
            client,
            deps.resolver ? deps.resolver(env) : dnsResolver(),
            scope.businessId,
          )
        })(),
        // FILING A DEFECT IN THIS SOFTWARE ([[REQ-273]]). Assembled here for the
        // reason every wire above it is — the environment is in hand and this
        // file is where a deployment's configuration becomes a capability — and
        // `null` where there is no address, which composes no surface at all.
        //
        // IT TAKES NO SCOPE AND THAT IS THE POINT. Every other wire on this call
        // is bound to `scope.businessId`, because everything else the assistant
        // can do is done to one client's material. This one is bound to OUR
        // project and to nothing of theirs, so there is no business to name and
        // no argument anywhere on the path that could name one.
        (deps.development ?? developmentFor)(env),
        // WHAT THE TURN COST ([[REQ-292]]). Assembled here for the reason the
        // ticket gives: the D1 binding is not on `WorkerAiEnv` and should not be
        // put there, and the TENANT the meter is scoped to is this function's
        // own — resolved per request, ahead of the host, by the same `scope.ts`
        // that decides everything else the conversation may reach.
        //
        // BOUND ONCE, BESIDE THE CACHE KEY, and those are the same act: this
        // host lives for the isolate keyed by `scope.businessId`, so a meter
        // bound to `tenantId` here cannot outlive or cross the scope it was
        // built under. Nothing below this line can name another business's
        // meter, because nothing below this line is given one.
        //
        // NULL WHERE THERE IS NO DATABASE. Every deployment has `DB` and the
        // type says so; the guard is for the degenerate environment a test or a
        // partially-configured preview can construct, and it degrades to the
        // `1c` CLI's permanent state — a conversation that runs and is not
        // metered — rather than to a builder that will not talk.
        env.DB ? d1TurnSpend(env, tenantId) : null,
      )
    })()
    // EVICTED IF IT FAILS TO BUILD. A rejected promise left in the map would
    // poison that business for the isolate's life: a missing binding repaired a
    // second later would keep answering with the first failure, and only for the
    // business unlucky enough to have asked first. The single `let` had the same
    // flaw and could hide it, because one failure looked like a dead isolate
    // rather than like one dead tenant.
    host.catch(() => CHATS.delete(scope.businessId))
    CHATS.set(scope.businessId, host)
  }
  return host
}

/** Drop every cached chat host. For tests that rebuild bindings per case. */
export function resetChatHost(): void {
  CHATS.clear()
}

/**
 * The renderer for a store, memoised per store (see {@link PREVIEWS}).
 *
 * EXPORTED for REQ-154. A screenshot of `/preview/<siteKey>/draft/` is fulfilled
 * from this renderer rather than fetched, so it must be the SAME renderer the
 * route uses — a second instance would render the draft a second time and could
 * answer from a different stamp than the one the operator is looking at.
 */
export function previewRenderer(store: SiteStore): PreviewRenderer {
  let renderer = PREVIEWS.get(store)
  if (!renderer) {
    renderer = new PreviewRenderer(store)
    PREVIEWS.set(store, renderer)
  }
  return renderer
}

/**
 * The longest surface name the signal above will store.
 *
 * A CEILING ON A DIMENSION, not on a payload. `route` is a group-by key, so an
 * unbounded value there is a key with as many distinct values as there are
 * callers — which makes every aggregate over it useless and every index over it
 * expensive. The tab ids this is actually for are one word.
 */
const MAX_SURFACE_LENGTH = 64

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

/**
 * A Resend credential this deployment cannot use, answered as a state rather
 * than as an error ([[REQ-264]]).
 *
 * 409 AND NOT 502, on `SendingNotConfiguredError`'s reasoning: 502 says *the
 * thing you asked for went wrong upstream and might work if you press it
 * again*, and this will not. It is the same answer a deployment with no
 * `RESEND_API_KEY` gives, which is the whole point — the two are one state to
 * a customer and must arrive as one.
 *
 * THE PROVIDER'S SENTENCE GOES TO THE LOG AND NOWHERE ELSE. An operator needs
 * *"This API key is restricted to only send emails"* to fix it; the person
 * looking at the screen has no API key, and showing them ours is this epic's
 * standing falsifier. The scrubber is an argument because it is built per
 * request from this deployment's own secrets — the message is ours and carries
 * nothing to redact, and a path that scrubbed beside one that did not is an
 * invitation to add a third that did not.
 */
function notPermitted(err: ResendNotPermittedError, scrub: (said: string) => string): Response {
  console.warn(
    JSON.stringify({
      event: 'resend_credential_refused',
      status: err.status,
      detail: err.detail,
    }),
  )
  return json(409, { error: scrub(err.message) })
}

function text(status: number, body: string): Response {
  return new Response(body, {
    status,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  const body = await request.text()
  if (body.trim() === '') return {}
  return JSON.parse(body) as Record<string, unknown>
}

/**
 * `MailEnv` IS EXTENDED RATHER THAN RESTATED ([[REQ-196]]). `RESEND_API_KEY` and
 * `MAIL_FROM` are declared once, in `mail.ts`, beside the code that reads them —
 * a second copy here would be free to drift by a character in silence, and the
 * symptom of that drift is mail that is never sent.
 */
export interface RouterEnv
  extends StoreEnv,
    TicketStoreEnv,
    MailEnv,
    SessionCookieEnv,
    EmbedderEnv,
    // [[REQ-257]] — `CLOUDFLARE_DNS_TOKEN`, and it is DELIBERATELY NOT the pair
    // `EmbedderEnv` above carries. Those two are Workers AI's ([[BUG-73]]) and
    // are both-or-neither; a zone token wearing that name would be the wrong
    // scope, and declaring their account id in `wrangler.toml` so production
    // could see it would hand `transportFor` half a credential and take the
    // project knowledge base down with it.
    CloudflareEnv,
    // [[REQ-273]] — where a defect in this software gets filed. Two dev-server
    // vars rather than a binding, and `development.ts` says why neither is
    // written down in `wrangler.toml`: both are minted per `1c builder` run.
    DevelopmentEnv {
  /** The build artifacts (`1c assets`), served only to an already-verified caller. */
  ASSETS: Fetcher
  /**
   * The Anthropic key, as a `wrangler secret` (REQ-146).
   *
   * A SECRET AND NOT A VAR: a var is readable in the dashboard and echoed by
   * `wrangler deploy`, and this one is a bearer credential for a paid API. It is
   * pushed by `bin/deploy.d/secrets/10-anthropic-api-key`, which carries the NAME
   * and never the value.
   *
   * Optional, and absent must stay an ordinary state rather than a boot failure:
   * a builder with no key still opens the conversation and still shows its
   * history, and says why it cannot take a turn.
   */
  ANTHROPIC_API_KEY?: string
  /**
   * Browser Rendering ([[REQ-154]]), for `shot.ts` — the assistant's eyes.
   *
   * OPTIONAL, and absent must stay an ordinary state rather than a boot failure,
   * for the same reason the key above is: a builder that cannot take a picture
   * still edits, renders and publishes, and should say what it cannot do rather
   * than refuse to start. `bindingLauncher` raises a named error naming the
   * missing binding.
   */
  BROWSER?: Fetcher
  /**
   * Workers AI ([[REQ-159]]) — the embedder behind the project knowledge base.
   *
   * On the router's env because [[REQ-163]]'s ingestion routes index what they
   * create: an unindexed document is INVISIBLE ([[DOC-39]] §4), not merely stale,
   * so the upload path needs the same embedder the KB does. Optional here for the
   * same reason it is optional there — a deployment without it still stores and
   * still lists material, and says loudly that nothing can find it.
   *
   * THE BINDING IS ONE OF TWO TRANSPORTS SINCE [[BUG-73]]. The credential half
   * arrives through `EmbedderEnv` below, and no route reads either directly —
   * `embedder.ts` is what turns configuration into an embedder, and
   * {@link defaultIndexer} asks it rather than testing this field.
   */
  AI?: { run(model: string, input: unknown): Promise<unknown> }
  /**
   * Cloudflare Images ([[REQ-219]]), which this route needs for one thing:
   * reading the HEIC an iPhone produces ([[REQ-221]]).
   *
   * THE STRONGEST SINGLE REASON THAT DEPENDENCY IS WORTH TAKING. Neither the
   * client's canvas nor Browser Rendering can decode HEIC — a headless Chrome is
   * still a Chrome — so without this binding the upload path needs a wasm
   * decoder shipped inside the Worker bundle.
   *
   * OPTIONAL, and absent stays an ordinary state rather than a boot failure, for
   * the reason {@link RouterEnv.BROWSER} is optional: a deployment without it
   * still stores, describes, lists and publishes every other format. What it
   * does NOT do is silently accept a photograph it cannot show — `ingestUpload`
   * refuses the file and names the format, which is the loud failure this
   * repository chooses over a Library row with no picture in it.
   *
   * THREE CONSUMERS NOW, AND ONE DECLARATION ([[REQ-219]], [[REQ-222]]). The
   * second is the renderer an edit recipe is applied by: `/api/material/file`
   * serves the Library its picture as it currently stands, and
   * `sessionPicturesFor` hands the assistant the surface that changes one. The
   * third is the delivery width ladder a publish builds, which rides that same
   * renderer rather than reaching the binding itself. Declaring the binding once,
   * here, is what stops any of them being wired to something the others have not
   * got.
   *
   * ITS ABSENCE IS A LOUD FAILURE FOR THE FIRST TWO AND A QUIET ONE FOR THE
   * THIRD, deliberately. No binding means an upload of a HEIC is refused by name
   * and the editing tool is not composed; it also means a publish carries no
   * `srcset`, which is this repository's publish exactly as it was before the
   * ladder existed, and exactly what `1c publish` does against an operator's
   * disk. Refusing to publish would take away something that works in exchange
   * for an optimisation.
   *
   * THE TYPE STAYS THE NARROW ONE the HEIC path named, and the renderer narrows
   * further at runtime rather than widening it here. `ImagesLike` names two calls
   * so a UAT can hand this field a double without implementing an image service;
   * widening it to the platform's whole `ImagesBinding` would take that away from
   * a path that has nothing to do with recipes. `imageRendererFor` asks the
   * object whether it can transform, and answers `null` where it cannot — which
   * is the same "no renderer" state a missing binding already means.
   */
  IMAGES?: ImagesLike
  /**
   * The image-generation credential ([[REQ-208]]) — **the first credential in
   * this product for a vendor that is not Anthropic**.
   *
   * A SECRET AND NOT A VAR, for the reason {@link RouterEnv.ANTHROPIC_API_KEY}
   * is one: it is a bearer credential for a paid API, and a `[vars]` entry is
   * readable in the dashboard and echoed by `wrangler deploy`.
   *
   * AN IMAGE CREDENTIAL, NOT A CHAT BACKEND, and the distinction is
   * load-bearing. The session still runs on `ClaudeAPIBackend`; what this buys
   * is that ONE TOOL reaches OpenAI's images API underneath. Running a session's
   * own turns on a ChatGPT backend is a different change with different
   * consequences and is deliberately not what this is.
   *
   * OPTIONAL, AND ABSENT IS AN ORDINARY STATE rather than a deployment fault —
   * more so than the Anthropic key, whose absence stops every turn. No image key
   * means no image tool: the surface is never composed, the manual never
   * mentions it, and every other tool keeps working. Which is exactly why
   * {@link aiConfigured} does not read it: that predicate asks whether this
   * deployment can reach a model AT ALL, and letting a missing image key make
   * the whole product report itself unconfigured would turn an ordinary state
   * into a fault.
   *
   * The NAME is the plugin's, not ours — see `imagegen.ts`'s `IMAGE_SECRET`.
   */
  OPENAI_API_KEY?: string
}

/**
 * What the route table needs from its host, so that ONE route table can serve
 * two transports (REQ-145).
 *
 * The Worker supplies none and gets the default: a D1/R2 store from its
 * bindings. `1c builder`'s Node transport supplies a filesystem-backed store, so
 * the test suite and the operator's local loop drive the SAME routing, edits and
 * render as production rather than a second implementation that agrees with it
 * today.
 *
 * REQ-148 — the render is no longer one of these. It used to be: a behavior
 * module was an Astro component, so rendering one was a capability of the HOST,
 * injected here, and the Worker simply lacked it. Behavior components are plain
 * functions now, so both transports render every page through the same code and
 * there is nothing left to inject.
 */
/**
 * Where a site can be reached, as this deployment answers it ([[REQ-238]]).
 *
 * THE DEFAULT, AND IT ALWAYS ANSWERS. A Worker holding a D1 binding can always
 * say whether a site has an address — the answer may be "none", which is what
 * refuses the publish, and that is a different statement from "this deployment
 * cannot say". The transports that cannot say are the ones that supply
 * `RouterDeps.addresses` returning null, and there is exactly one of them.
 *
 * ONE READER PER ENV AND NOT PER SITE, because the site is what varies within a
 * request and the binding is what varies between deployments. Which one the
 * caller has is the question `publishSite` and the chat host each ask once.
 */
export function addressesFor(
  env: RouterEnv,
): (site: string) => Promise<readonly unknown[]> {
  return (site: string) => addressesOf(env as unknown as IdentityEnv, site)
}

export interface RouterDeps {
  /** The store this request reads and writes through. */
  store?: (env: RouterEnv, scope: Scope) => Promise<TenantSiteStore>
  /**
   * The delivery width ladder `/api/publish` builds ([[REQ-222]]).
   *
   * INJECTABLE FOR THE REASON THE STORE IS: the real one reaches a metered
   * platform transform, so a UAT that wanted to assert what a published page's
   * `srcset` says would otherwise have to pay for renditions to find out. It
   * returns null where the deployment has no Images binding, and a UAT returning
   * null is asserting the no-binding publish rather than simulating it.
   */
  ladder?: (env: RouterEnv, scope: Scope) => ImageLadder | null
  /**
   * How this deployment answers *where can this site be reached* ([[REQ-238]]),
   * or `null` where it cannot answer at all.
   *
   * INJECTABLE FOR THE REASON {@link ladder} IS, AND FOR ONE MORE. The reason it
   * shares: the real one reads D1, and a suite asserting what a publish does
   * with an address should plant the address rather than have a binding happen
   * to hold one. The reason it does not: `null` here is not a degraded publish,
   * it is an UNGATED one — `publishSite` treats an absent answer as unchecked —
   * and the Node builder transport is exactly that case. It has no database, no
   * business and no address a site could have: it publishes a directory on
   * somebody's disk, which is `1c publish`, and gating that would be refusing to
   * publish a workspace on the grounds that a hostname nobody can buy there has
   * not been bought.
   */
  addresses?: (env: RouterEnv) => ((site: string) => Promise<readonly unknown[]>) | null
  /**
   * The ticket store the ingestion routes write material into ([[REQ-163]]).
   *
   * `opts` IS THE SUBSCRIPTION'S ([[REQ-201]]). Every route but one opens this
   * without options; the Library's change feed asks for a slower tailer cadence
   * than the component's default, and a double that ignored the argument would
   * be a double the poll-cadence claim could not be made against.
   */
  tickets?: (env: RouterEnv, scope: Scope, opts?: TicketStoreOptions) => Promise<TicketStore>
  /**
   * How often the Contacts change feed asks D1 what has moved ([[REQ-233]]).
   *
   * A CLOCK AND NOT DATA, on the grounds `tickets`' `opts` is injectable. The
   * shipped cadence is {@link CONTACT_CHANGE_POLL_MS} and a suite that waited
   * for it would spend seconds per assertion; the number that ships is checked
   * where it is chosen rather than where it is inconvenient.
   */
  contactChangePollMs?: number
  /**
   * The tenant's capture bundles, for the import route's rights gate (BUG-84).
   *
   * Injectable for the reason the stores above are: a UAT that has to plant a
   * capture in order to assert it is refused should plant one it wrote, not one
   * a binding happened to hold. `null` means this deployment has nowhere for
   * captures to live — see the import route on why that is an ordinary state
   * and not a refusal.
   */
  references?: (env: RouterEnv, scope: Scope) => Promise<ReferenceStore | null>
  /**
   * The system knowledge base the chat session searches ([[REQ-158]]).
   *
   * Injectable for the same reason `index` below is: the built-in one is the
   * corpus `1c kb build` produced for THIS checkout, which is a release artefact
   * a test cannot depend on and must not assert against. A UAT hands in a corpus
   * it planted itself, so "the assistant answered from the document and named
   * it" is a claim about a document whose content the test chose.
   */
  knowledge?: (env: RouterEnv) => Promise<unknown>
  /**
   * Step 5's indexer, and the whole reason it is injectable.
   *
   * Wired below to the project KB's `onMaterialWritten`. A UAT substitutes a
   * counter to prove the pipeline calls it EXACTLY ONCE per created material —
   * a claim that would otherwise need an embedder, an R2 index and a real
   * Workers AI binding to make.
   */
  index?: (env: RouterEnv, scope: Scope) => Promise<IndexMaterial | null>
  /** The vision seam, so ingestion UATs describe an image without a network. */
  describeImage?: DescribeImage
  /** The digest seam, so a document is described without a network (REQ-173). */
  describeText?: DescribeText
  /**
   * The HEIC converter ([[REQ-221]]), so the door is provable without an image
   * service.
   *
   * THE SEAM IS THE ONLY WAY TO PROVE THE INTERESTING HALF. The Images binding's
   * local implementation supports a subset of transforms and does not decode
   * HEIC, so a suite that reached for the real binding could prove the happy
   * path nowhere and the refusals nowhere either. What the claims here are
   * actually about is what the PIPELINE does with a conversion, with its
   * absence, and with its failure — and a double makes all three reachable while
   * the real binding makes none of them.
   *
   * `null` IS A MEANINGFUL VALUE and not merely a default, which is why the
   * wiring below uses `??` on the whole expression rather than `||`: a UAT
   * passing `null` is asserting the unconfigured deployment, and a falsy test
   * would silently hand it the real binding instead.
   */
  convertHeic?: ConvertHeic | null
  /** The fetch the guard drives, so redirect re-validation is provable offline. */
  fetch?: typeof fetch
  /**
   * The browser the assistant looks with ([[REQ-206]]), so the eyes are provable
   * offline.
   *
   * THE SAME SEAM `shot.ts` HAS ALWAYS HAD, lifted to where the chat routes can
   * reach it. Browser Rendering is a third party reached over a wire protocol and
   * miniflare has none, so this is the one boundary a fidelity UAT may fake —
   * and everything on this side of it is the production path: the picture
   * resolution, the in-process preview fulfilment, the egress guard, the budget,
   * the adoption, the manual the model is handed.
   *
   * ABSENT IS THE ORDINARY CASE and resolves to the `BROWSER` binding.
   */
  launch?: BrowserLauncher
  /**
   * The transport the image generator is reached through ([[REQ-208]]).
   *
   * THE SAME KIND OF SEAM `launch` IS, at the same kind of boundary: a third
   * party over a wire, which miniflare has none of. Everything on this side of
   * it is the production path — the plugin, the declared surface, the refusal
   * taxonomy, the per-session budget, the ticket write and this product's own
   * normalisation of it — so a UAT proves the capability with no live
   * credential and no spend.
   *
   * SEPARATE FROM {@link RouterDeps.fetch}, which drives the material fetch
   * GUARD. Folding the two would mean a suite faking an image provider had
   * silently also replaced the transport that ingestion's redirect
   * re-validation is proved against.
   *
   * ABSENT IS THE ORDINARY CASE and the adapter uses the runtime's own `fetch`.
   */
  imageFetch?: typeof fetch
  /**
   * The mail port ([[REQ-196]]), injected so the invite is provable offline
   * ([[REQ-199]]).
   *
   * ABSENT IS THE ORDINARY CASE and resolves to {@link mailerFor}, which picks
   * its adapter by whether the deployment holds a credential. It is here so a
   * UAT can OBSERVE what was sent — how many messages, to whom, with what
   * subject — which the capturing adapter alone cannot report from behind
   * `mailerFor`. It cannot become a way to send mail from a test: the injected
   * double is the test's own, and the default still has no path to a provider
   * without a real key.
   */
  sendEmail?: SendEmail
  /**
   * Who is asking, for {@link BUSINESSES_PATH} alone ([[REQ-179]]).
   *
   * INJECTED RATHER THAN RECOMPUTED. `index.ts` already ran `admit` — ahead of
   * routing, which is the security property that file is built around — so the
   * answer to "which businesses may this account operate" exists by the time a
   * route runs. Asking again here would be a second answer to a question that
   * must have one, and would need the verified email the router deliberately
   * never sees.
   *
   * OPTIONAL, AND ABSENT IS ORDINARY. The unconfigured-local-dev path skips
   * `admit` entirely, and the Node transport calls `route()` with no identity at
   * all; both resolve a scope by other means, and the endpoint reports that
   * scope rather than pretending to an admission it does not have.
   */
  admission?: Admission | null
  /**
   * This invocation's logging ([[REQ-235]]).
   *
   * THREADED RATHER THAN REACHED FOR, on `ctx`'s precedent and for the same
   * reason: it is minted in `index.ts`, once, where the `trace_id` is chosen and
   * where the business and the actor are bound onto it — so a route that wants
   * to say something about this invocation can only get it by being handed it.
   *
   * OPTIONAL, AND ABSENT IS ORDINARY. The Node builder transport calls `route()`
   * directly and has no D1 to log into; the surface signal below simply records
   * nothing there, which is the honest answer for a host with no store rather
   * than a refusal of a route that has otherwise done its job.
   */
  log?: RequestLog
  /**
   * The Cloudflare zone client ([[REQ-257]]), or `null` where this deployment
   * has no token.
   *
   * INJECTABLE AT A TRUE EXTERNAL BOUNDARY, for the reason `imageFetch` is and
   * with a sharper edge. The real client can DELETE A ZONE, and a suite that
   * reached it would not fail — it would succeed, against whatever account the
   * credential on the machine belongs to, and the first time it happened it
   * would take a customer's mail down with it. Everything on this side of the
   * seam is the production path: the guards, the provenance, the drift diff and
   * the row that gets written.
   *
   * ABSENT IS THE ORDINARY CASE and resolves to {@link cloudflareFor}, which
   * answers `null` when the deployment carries no credential — and `null` is a
   * refusal here rather than a degraded mode.
   */
  cloudflare?: (env: RouterEnv) => CloudflareClient | null
  /**
   * The external DNS resolver ([[REQ-257]]).
   *
   * INJECTABLE FOR A DIFFERENT REASON FROM THE CLIENT ABOVE: reading public DNS
   * is harmless, and what it is not is REPEATABLE. A UAT asserting that six DKIM
   * selectors are probed by name and that an `MX` of `aspmx.l.google.com` is
   * reported as Google Workspace has to drive a resolver it scripted, because
   * the alternative is a suite whose verdict depends on what somebody else's
   * domain published this week.
   *
   * SEPARATE FROM {@link RouterDeps.fetch} on `imageFetch`'s reasoning — a suite
   * scripting DNS answers must not thereby have replaced the transport the
   * material fetch guard is proved against.
   *
   * ABSENT IS THE ORDINARY CASE and resolves to {@link dnsResolver}, which needs
   * no credential and therefore no configuration.
   */
  resolver?: (env: RouterEnv) => DnsResolver
  /**
   * Resend's domain API — the sending half of a customer's domain
   * ([[REQ-259]]).
   *
   * INJECTABLE FOR {@link RouterDeps.cloudflare}'S REASON AND NOT THE
   * RESOLVER'S. The real client registers and deletes sending domains on the
   * account this product actually sends from, so a suite holding a live key
   * would not fail against the real API — it would succeed, and leave test
   * domains behind on it.
   *
   * THE SEAM AND THE DEFAULT ANSWER THE SAME WAY — `null` for a deployment with
   * no key — so a suite injecting `() => null` is asserting the real no-key
   * behaviour rather than simulating one. A domain still attaches for the WEB
   * without it; what does not happen is the sending half.
   */
  resend?: (env: RouterEnv) => ResendClient | null
  /**
   * Where a defect in this software gets filed ([[REQ-273]]), or `null` where
   * this deployment has no project to reach.
   *
   * INJECTABLE FOR THE RESOLVER'S REASON RATHER THAN THE CLIENT'S. The real one
   * is an HTTP call to a listener in somebody's `1c builder`, so a suite that
   * did not script it would either pass because nothing was running — proving
   * only that an absent service is absent — or file a real ticket into this
   * repository's own ticket store the first time it ran on a developer's
   * machine. Neither is a test.
   *
   * ABSENT IS THE ORDINARY CASE and resolves to {@link developmentFor}, which
   * answers `null` when the deployment carries no address. `null` composes no
   * surface at all rather than one that refuses every call — the same shape
   * {@link RouterDeps.cloudflare} already has, and the state every DEPLOYED
   * builder is permanently in.
   */
  development?: (env: RouterEnv) => DevelopmentSurface | null
}

/**
 * FRESHNESS, SET ONCE, FOR EVERY RESPONSE THIS ROUTE TABLE CAN PRODUCE.
 *
 * The builder rewrites its own bytes underneath the browser — a save changes the
 * very channel the frame is displaying — so a single cacheable response leaves
 * an operator looking at a stale page that appears to be working. Stamping on
 * the way out covers the chrome document, every JSON envelope, every rendered
 * preview, every build artifact and every 400/404/500/501 alike.
 *
 * IT LIVES HERE, NOT IN THE WORKER'S `fetch`. It was in `fetch` first, and the
 * Node transport — which calls `route()` directly — therefore served the chrome
 * document with no directive at all. That is the same hole the Node origin's
 * `json()` helper once opened, rediscovered one layer up: a per-HOST
 * restatement is as forgettable as a per-route one. One wrapper, at the only
 * point every host shares.
 */
const NO_STORE = 'no-store, must-revalidate'

/**
 * The Worker's own secrets, for {@link redactor} (REQ-146, AC4).
 *
 * Listed rather than swept out of `env`, because `env` also carries bindings and
 * ordinary vars — `TENANT_ID` is a short, common word, and scrubbing it out of
 * error messages would destroy diagnostics to protect nothing. What belongs here
 * is only what is a CREDENTIAL: the model key, and since [[REQ-196]] the mail
 * provider's, which can send as our own domain and is the more damaging of the
 * two to leak into a message somebody is shown.
 */
function secretsOf(env: RouterEnv): Array<string | undefined> {
  // THE IMAGE KEY IS ON THIS LIST FROM THE DAY IT EXISTS ([[REQ-208]]). It is a
  // bearer credential for a paid API exactly as the other two are, and the path
  // it travels ends in a provider error message that a model reads and a person
  // may be shown — which is the shape of leak this scrub exists for.
  //
  // AND THE ZONE TOKEN, FROM THE DAY IT EXISTS ([[REQ-257]]). It travels the
  // same path and is the most damaging of the four to leak: it can rewrite the
  // DNS of every domain this deployment manages, including the MX records that
  // carry a customer's mail. `cloudflare.ts` repeats Cloudflare's own words in
  // its refusals and the zone routes return them, so the message a person is
  // shown is composed from a reply to a request that carried this value.
  return [
    env.ANTHROPIC_API_KEY,
    env.RESEND_API_KEY,
    env.OPENAI_API_KEY,
    env.CLOUDFLARE_DNS_TOKEN,
  ]
}

/**
 * Step 5, wired to the project knowledge base ([[REQ-163]] / [[REQ-159]]).
 *
 * `onMaterialWritten` is the right call rather than a bare `refreshIndex`: an
 * upload is a REQUEST FOR ATTENTION ([[DOC-39]] §4.2). The client is not adding a
 * document to be thorough; they want to talk about it now. So the index refresh
 * is awaited — the material is searchable the instant the upload returns — and
 * the awareness-map rebuild is deferred behind it, which is the decomposition
 * that leaves the assistant never blocked and never blind.
 *
 * `null` WHEN NOTHING CAN EMBED, and the caller says so loudly rather than
 * treating it as a degradation. `projectKnowledgeFor` raises rather than
 * degrading when there is no embedder, which is right for the KB's own routes and
 * wrong here: an upload that 500s because nothing can embed it would lose the
 * client's file to a problem the operator has to fix.
 *
 * `canEmbed` AND NOT `env.AI` ([[BUG-73]] B1). This gate and the constructor it
 * guards have to agree about what "can embed" means; asking the binding here
 * while `projectKnowledgeFor` asks the resolver would leave a REST-configured
 * deployment storing every upload and indexing none of them, reporting nothing.
 */
async function defaultIndexer(env: RouterEnv, scope: Scope): Promise<IndexMaterial | null> {
  if (!canEmbed(env)) return null
  const knowledge = await projectKnowledgeFor(env, scope)
  return async () => knowledge.onMaterialWritten()
}

/**
 * The image describer, or nothing.
 *
 * Absent is an ordinary state, exactly as it is for the chat routes: a
 * deployment with no key still stores every file the client hands it, and says
 * in each body that nothing has looked at it yet.
 *
 * A SESSION ON THE AI HOST SINCE REQ-207, where it used to be a direct Messages
 * API call. That was the one place this Worker reached a model without going
 * through the host it already runs, and it is gone; this reads identically to
 * {@link defaultTextDescriber} below because the two are now the same thing with
 * different content.
 */
function defaultDescriber(env: RouterEnv): DescribeImage | undefined {
  return env.ANTHROPIC_API_KEY ? sessionImageDescriber(env.ANTHROPIC_API_KEY) : undefined
}

/**
 * The document describer, or nothing (REQ-173).
 *
 * Its absence is no longer an ordinary state the way the image describer's was:
 * {@link aiConfigured} refuses the upload before this is reached, so nothing
 * should ever ingest a document with no digest on a real deployment. It stays
 * optional because `describe.ts` must not throw on a caller that got past the
 * gate — losing a client's file to a missing key would be the worse failure by
 * the same margin [[DOC-38]] §10 measures everywhere else in this pipeline.
 */
function defaultTextDescriber(env: RouterEnv): DescribeText | undefined {
  return env.ANTHROPIC_API_KEY ? sessionTextDescriber(env.ANTHROPIC_API_KEY) : undefined
}

/**
 * Can this deployment reach a model at all? (REQ-173)
 *
 * NOTHING IN THIS PRODUCT WORKS WITHOUT A KEY. The assistant cannot take a turn,
 * an image cannot be looked at, and since REQ-173 a document cannot be described
 * either. The builder used to discover that one surface at a time — a frozen chat
 * panel here, a body reading *"no describer is configured"* there — which asks an
 * operator to infer a deployment-wide fact from a scattering of local symptoms.
 * So it is one question, asked once, answered at {@link AI_STATUS_PATH}, and the
 * routes that genuinely need a model refuse rather than half-succeed.
 *
 * AN INJECTED DESCRIBER COUNTS AS CONFIGURED, and that is not a test affordance
 * smuggled into production logic. The question this predicate asks is *"can a
 * description be written here"*, and a host that handed in a describer has
 * answered it — the key is merely how the Worker's own default obtains one.
 */
function aiConfigured(env: RouterEnv, deps: RouterDeps): boolean {
  return Boolean(env.ANTHROPIC_API_KEY || deps.describeImage || deps.describeText)
}

/** Where the builder asks whether this deployment can do anything (REQ-173). */
export const AI_STATUS_PATH = '/api/status'

/** Where the chrome asks which businesses it may offer ([[REQ-179]]). */
export const BUSINESSES_PATH = '/api/businesses'

/**
 * Where a signed-in CONTACT reads and changes their own acceptances
 * ([[REQ-245]]).
 *
 * ITS OWN PATH AND NOT A SECOND HALF OF {@link BUSINESSES_PATH}. That endpoint
 * answers facts about the SESSION and is read by the builder's chrome before it
 * has drawn anything; this one answers facts about the caller as a CONTACT OF A
 * BUSINESS, is read by a page of a site, and — unlike every other route the
 * portal touches — takes a write. Folding the two together would put the one
 * mutable thing on the surface onto the chrome's own hot path, and would make
 * "what may the portal do" answerable only by reading a handler.
 *
 * `/api/` AND NOT `/api/admin/`, on {@link PEOPLE_PATH}'s reasoning. It is
 * deliberately customer-reachable — the whole point is that the person whose
 * preferences these are is the one changing them — and the prefix says so.
 */
export const ACCEPTANCES_PATH = '/api/acceptances'

/**
 * Where the OPERATOR adds a business to an account ([[REQ-180]]).
 *
 * `/api/admin/` AND NOT `/api/businesses`, and the prefix is the decision rather
 * than the tidying. [[REQ-180]] answers §2's fourth bullet the other way: there
 * is no self-serve "add a business", because we are pre-billing and
 * pre-entitlement-control and a customer-reachable creation route mints a live
 * `pro` grant to whoever asks. Hanging the operator's path off the same path the
 * chrome reads would make the two one keystroke apart in every future diff; a
 * separate prefix makes "is this reachable by a customer" answerable by looking
 * at the URL.
 */
export const ADMIN_BUSINESSES_PATH = '/api/admin/businesses'

/**
 * Where the OPERATOR reads and attributes zones ([[REQ-257]]).
 *
 * `/api/admin/` FOR {@link ADMIN_BUSINESSES_PATH}'S REASON, and this one earns
 * it twice over. Attributing a zone spends nothing and creates nothing, but it
 * decides WHOSE a domain is, which is the fact every later authorisation
 * question about that domain reads — and the answer cannot be derived from
 * anywhere, so there is nobody but an operator to ask.
 *
 * NO SELF-SERVE COUNTERPART, and unlike the business route that is not a
 * pre-billing gap to be filled in later. The zones this attributes are already
 * in the platform Cloudflare account and already active; a customer-reachable
 * route onto them would be a route by which one customer names somebody else's
 * domain as their own.
 *
 * GET IS A REPORT AND WRITES NOTHING. It is the drift check — what Cloudflare
 * holds that this deployment has not recorded, and the reverse — and its whole
 * value is that it asks a question rather than answering it.
 */
export const ADMIN_ZONES_PATH = '/api/admin/zones'

/**
 * Where the OPERATOR reads live DNS for a domain ([[REQ-257]]).
 *
 * THE RESOLVER'S REAL ENTRY POINT, and the reason it has one at all. The read
 * half is consumed in three places that do not exist yet — [[REQ-259]]'s
 * pre-attach check, [[REQ-260]]'s assistant tools, [[EPIC-7]]'s check engine —
 * so without a route it would ship as a function nothing calls, which is a
 * capability nobody can confirm works.
 *
 * AND IT IS USEFUL ON ITS OWN. *"Is there a live business on this domain
 * today"* is the question [[EPIC-5]] says decides the work, and an operator
 * about to attribute a zone is exactly the person who needs it answered.
 *
 * READ-ONLY AND ABOUT SOMEBODY ELSE'S DOMAIN, so it is behind the same gate as
 * the zones route: the answer names a business's mail provider and every sender
 * authorised to send as them, which is not a fact about this deployment to hand
 * to whoever asks.
 */
export const ADMIN_DNS_PATH = '/api/admin/dns'

/**
 * Where the OPERATOR points a domain at a site, and takes it back down again
 * ([[REQ-258]]).
 *
 * `/api/admin/` AND NOT A CUSTOMER SURFACE, on {@link ADMIN_ZONES_PATH}'s
 * reasoning exactly: the selector a customer presses is a different ticket, and
 * what this ticket builds is the mechanism beneath it. The gate is
 * `ownsPlatformBusiness` and the refusal is a 404, because a caller asking
 * whether an administrative surface exists is owed nothing.
 *
 * IT EXISTS AT ALL BECAUSE A MECHANISM WITH NO ENTRY POINT IS UNPROVABLE. Every
 * claim this ticket makes — the ordering, the guards, the rollback, the
 * cross-tenant refusal — is a claim about a request arriving somewhere, and a
 * suite that called the module directly would be evidence about a function
 * rather than about the product.
 *
 * `DELETE` IS HERE BECAUSE A CUSTOM DOMAIN IS NOT FINAL, which is the rule this
 * ticket introduces and the one most likely to be got wrong by whoever reads
 * `hostname.ts`'s header and applies the `1stc.site` rule uniformly. An
 * attachment that cannot be undone is one nobody can safely make: a mistyped
 * domain would otherwise be repairable only by editing the database by hand.
 */
export const ADMIN_DOMAINS_PATH = '/api/admin/domains'

/**
 * Where the OPERATOR reads what a business's conversations have cost
 * ([[REQ-293]]).
 *
 * `/api/admin/` AND NOT A CUSTOMER SURFACE, and unlike the zones route that is
 * a temporary position rather than a permanent one. A client WILL be shown
 * their hours — that is the unit EPIC-20 says this product is sold in — but
 * what they are shown is a bill, and a bill needs a plan, a cap and a decision
 * about what happens when somebody reaches it, none of which exist yet. What
 * exists is a meter, and the person who needs to read it today is the person
 * setting the price. Customer-facing billing is named out of scope on the
 * ticket.
 *
 * IT NAMES THE BUSINESS RATHER THAN READING THE RESOLVED SCOPE, on
 * {@link ADMIN_BUSINESSES_PATH}'s reasoning: an operator comparing two tenants'
 * cost per engaged hour is asking about somebody else's meter by definition,
 * and a route that could only report the scope it was reached through would
 * make that question unaskable from anywhere.
 *
 * GET AND NOTHING ELSE, because there is nothing here to write. Engaged time is
 * derived at read from the two stamps each row already holds (REQ-293), so a
 * report can neither create nor revise a row — which is what makes it safe to
 * run against a meter that will be billed from.
 */
export const ADMIN_SPEND_PATH = '/api/admin/spend'

/**
 * Where the OPERATOR CONSOLE'S cost control reads EVERY business at once
 * ([[REQ-297]]).
 *
 * `/businesses` AND NOT `/tenants`, and that is not cosmetic ([[REQ-180]] §3).
 * `tenant` is the schema's word and stays in the column, the index and every
 * identifier; *Business* is the product's, and it is what a person reads —
 * including the operator, who is the one person most likely to be handed our
 * data model by accident because they also read the schema. A path is a string
 * a reader meets, so it uses the reader's noun.
 *
 * A SECOND PATH AND NOT AN OPTIONAL `business` ON THE FIRST. Making the
 * parameter optional would have given one route two answers of different
 * shapes — a report, or a list of reports — decided by whether a query string
 * was present, so a caller that forgot the parameter would get a plausible
 * answer to a question it did not ask. It would also silently relax the one
 * refusal {@link ADMIN_SPEND_PATH} makes for its own protection: *business is
 * required* is what stops an unscoped read being one omission away.
 *
 * UNDER `/spend/` BECAUSE IT IS THE SAME METER. The rows, the arithmetic and
 * the gate are the period route's; what differs is only how many tenants are
 * in the answer. A sibling prefix would have read as a second subject.
 *
 * GET AND NOTHING ELSE, for the reason the route it sits beside gives: engaged
 * time is derived at read, so a report can neither create nor revise a row.
 */
export const ADMIN_BUSINESS_SPEND_PATH = '/api/admin/spend/businesses'

/**
 * Every site on the platform, which is the OPERATOR CONSOLE'S left-hand list
 * ([[REQ-298]]).
 *
 * THE SAME GATE AND THE SAME 404 as the two meter routes beside it, and for
 * {@link ADMIN_BUSINESSES_PATH}'s reason rather than a weaker one: a directory of
 * every customer's sites is a question about the PLATFORM, not about the business
 * the request happened to resolve to, and it names who owns each of them.
 *
 * IT IS NOT MERGED INTO {@link ADMIN_BUSINESS_SPEND_PATH}, and the boundary is
 * the ticket's. That route answers the meter and is ordered by it, so a business
 * with no measured turn is absent from it — the record's own *nothing, never
 * zero* rule. A site with no spend must appear here, because this is a directory;
 * folding the two would give one route two answers, decided by whether the caller
 * wanted the quiet rows. The console joins them by business id and does its own
 * ordering, because the ordering is a property of the surface and the period is
 * the surface's.
 *
 * NO PERIOD PARAMETER. Nothing this route answers is measured over a window — a
 * site exists, belongs to somebody and is reachable or not — so accepting one
 * would be a parameter that changed no answer.
 *
 * GET AND NOTHING ELSE, for the reason the meter routes give: there is nothing
 * here to write. A site is created by provisioning and an address by
 * `claimHostname`, both elsewhere and both with consequences this read has none
 * of.
 */
export const ADMIN_SITES_PATH = '/api/admin/sites'

/**
 * How one business's recent turns ended — the OPERATOR CONSOLE'S health section
 * ([[REQ-306]]).
 *
 * THE QUESTION IT ANSWERS is the ticket's fifth requirement verbatim: *is this
 * site failing turns repeatedly, and can I see that without a customer telling
 * me*. A whole tenant failed every turn for a period and the only trace was a
 * Cloudflare tail entry somebody went looking for. A number on the console is
 * what that absence costs to fix.
 *
 * THE SAME GATE AND THE SAME 404 as the meter routes beside it. The answer names
 * somebody else's conversations and how often this platform broke them, which is
 * strictly no more shareable than what they spent.
 *
 * NO PERIOD PARAMETER, WHERE ITS NEIGHBOURS TAKE ONE, and the asymmetry is the
 * ticket's point rather than an omission. *Failing repeatedly* is a statement
 * about consecutive turns, not about a window: a site that takes four turns a
 * week and lost all four is as broken as one that lost forty in an hour, and a
 * period wide enough to catch the first buries the second. So this reads the
 * most recent N turns and reports the run of losses at the head of them.
 *
 * GET AND NOTHING ELSE. The one fact this surface is about — a row nobody
 * closed — is recorded by its absence, so there is nothing here anybody could
 * write that would be evidence of anything.
 */
export const ADMIN_TURNS_PATH = '/api/admin/turns'

/**
 * The period both meter routes take, off the query string ([[REQ-293]],
 * [[REQ-297]]).
 *
 * ONE PARSER FOR BOTH, because the two routes must agree about what a period IS
 * — a league whose window meant something slightly different from the expansion
 * opened out of it would make every comparison on the console wrong in a way
 * nobody could see. It is a function rather than a copied block for the reason
 * the router already applies to its gates: a rule restated twice is a rule that
 * can drift once.
 *
 * BOTH ENDS OPTIONAL, ABSENT MEANING UNBOUNDED, and [[REQ-297]] deliberately did
 * NOT change that to a thirty-day default. The meter is retained rather than
 * pruned, so *everything this tenant has ever spent* is a question it must still
 * answer, and a default here would quietly give a different answer to a caller
 * who asked for all of it. The console's thirty days is the CONSOLE's default
 * and travels in the request it makes.
 *
 * AN UNREADABLE STAMP IS A REFUSAL AND NOT AN IGNORED BOUND. Dropping a `from`
 * nobody could parse would answer a DIFFERENT, wider question with no sign that
 * it had, and the reader would take the total for the month they asked about.
 */
function spendPeriodOf(url: URL): { period: SpendPeriod; unreadable: 'from' | 'to' | null } {
  const period: SpendPeriod = {}
  for (const end of ['from', 'to'] as const) {
    const raw = (url.searchParams.get(end) ?? '').trim()
    if (raw === '') continue
    if (!Number.isFinite(Date.parse(raw))) return { period, unreadable: end }
    period[end] = raw
  }
  return { period, unreadable: null }
}

/**
 * The User tab's four routes ([[REQ-170]]).
 *
 * `/api/people` AND NOT `/api/admin/people`. The prefix is the decision rather
 * than the spelling: this tab is the people of WHICHEVER business the caller is
 * in, so an `admin` segment would encode a platform-only reading in the URL and
 * be wrong for every customer who ever reaches it ([[DOC-42]] §7). The one
 * control that IS 1st Contact's alone already has its own path above, and keeps
 * it — provisioning a business is our product-fulfilment action, and it is
 * separate here for the same reason it is separate there.
 */
export const PEOPLE_PATH = '/api/people'
export const PERSON_DETAIL_PATH = '/api/people/detail'
export const PERSON_STATUS_PATH = '/api/people/status'
/**
 * Where a business's owner corrects who somebody is ([[BUG-54]]).
 *
 * SEPARATE FROM `/status`, and not folded into it. The two write to the same
 * table and mean unrelated things: this one corrects the operator's own answer
 * to who this person is, and that one withdraws a login ([[DOC-42]] §5). One
 * route taking both would make suspending somebody reachable from every caller
 * that only meant to fix a typo in their name.
 */
export const PERSON_RECORD_PATH = '/api/people/record'
/**
 * Where a business's owner ADDS a contact — the fundamental act ([[REQ-199]]).
 *
 * ITS OWN PATH, AND NOT A FLAG ON THE INVITE. Adding somebody and asking them in
 * are two acts, and the tab performs them from two controls; one route taking an
 * `alsoInvite` boolean would make the difference between recording a person and
 * emailing a stranger a field in a JSON body, which is the kind of parameter
 * that eventually arrives wrong from a client nobody remembered to update.
 */
export const PERSON_ADD_PATH = '/api/people/add'

/**
 * Where a business's owner invites a SELECTION of contacts ([[REQ-186]],
 * [[REQ-199]]).
 *
 * TWO VERBS ON ONE PATH, AND THEY ARE THE SAME SUBJECT. `GET` answers *what
 * would this send* — the From, and the Subject and Body the `invite` template
 * carries — which is what the modal opens with. `POST` sends it, with whatever
 * the operator changed. Two paths would let the prefill and the send disagree
 * about which template they mean.
 */
export const PERSON_INVITE_PATH = '/api/people/invite'

/**
 * What we have said to one person, and whether it arrived ([[REQ-198]]).
 *
 * A ROUTE OF ITS OWN RATHER THAN A FIELD ON THE DETAIL. The detail pane answers
 * *who is this and what do they hold*, which is identity-schema data; this
 * answers *what did we send them*, which is the tenant's ticket store. Two
 * stores, two reads, and the pane that draws both can fill one in while the
 * other is still coming.
 */
export const PERSON_MESSAGES_PATH = '/api/people/messages'

/**
 * The Contacts pane's change feed ([[REQ-233]]).
 *
 * UNDER `/api/people` AND NOT `/api/contacts`, because it is the same list this
 * table's other six routes are about and a second noun for one population is how
 * two surfaces start disagreeing about who is in it.
 *
 * A `GET` PRECISELY SO IT CAN BE AN `EventSource`, which is the argument
 * `/api/material/changes` already makes: the browser then does the two parts of
 * a subscription least worth writing twice — reconnect with backoff, and
 * re-presenting the last `id:` it saw as `Last-Event-ID`.
 */
export const PERSON_CHANGES_PATH = '/api/people/changes'

/**
 * One contact's history, page by page ([[REQ-267]] §8).
 *
 * A ROUTE OF ITS OWN, AND THE DETAIL STILL CARRIES THE FIRST PAGE. The pane
 * cannot render without the history, so making it a second round trip on FIRST
 * paint would trade a whole paint for a control most contacts never need. What
 * this answers is *the page after the one you have* — which by definition
 * nobody needs until they have pressed something.
 *
 * THE CURSOR IS OPAQUE AND IS THE SERVER'S. A client that composed its own would
 * be a second definition of the timeline's ordering, free to disagree with the
 * query's.
 */
export const PERSON_EVENTS_PATH = '/api/people/events'

/**
 * Received mail nobody in this business could be matched to ([[REQ-267]] §6).
 *
 * UNDER `/api/people` BECAUSE IT IS THE CONTACT LIST'S OWN ANTECHAMBER. What is
 * in it is not a population of people — no row was created for any of them — it
 * is the messages that would have to become people before they could be listed.
 * A noun of its own would invite a second surface that eventually disagrees with
 * the first about who this business knows.
 *
 * `GET` LISTS, `POST /promote` MAKES ONE A CONTACT, `POST /discard` STOPS ASKING.
 * Three verbs on two paths rather than one path with an `action` field, on
 * `/api/people/add`'s reasoning: promoting a stranger and silencing them are
 * opposite acts, and a client sending the wrong string must not be able to do
 * the other one.
 */
export const PERSON_INBOUND_PATH = '/api/people/inbound'
export const PERSON_INBOUND_PROMOTE_PATH = '/api/people/inbound/promote'
export const PERSON_INBOUND_DISCARD_PATH = '/api/people/inbound/discard'
export const PERSON_INBOUND_RESTORE_PATH = '/api/people/inbound/restore'
/**
 * Where the business's own record is changed ([[REQ-237]], [[EPIC-4]]).
 *
 * BUSINESS-SCOPED LIKE EVERY ROUTE BELOW IT, and that is the whole of how it
 * knows which business it is about: the name never travels in the body, so no
 * caller can address a business the request did not already resolve to.
 *
 * IT IS THE API, NOT THE FORM. The settings pane and the settings assistant are
 * both ordinary callers of the rename — neither wraps the other, and neither is a
 * fallback for the other. This is the half a browser can reach.
 */
export const BUSINESS_NAME_PATH = '/api/business/name'

/**
 * The two operations on the `1stc.site` hostname ([[REQ-238]]).
 *
 * TWO PATHS AND NOT ONE, because they are two operations and the difference
 * between them is the entire design. `GET .../check` asks *is this available* —
 * no side effect, repeatable, cheap, and safe to call as fast as somebody can
 * type; a `GET` is what says that in the only vocabulary every cache, proxy and
 * client already understands. `POST .../claim` takes it, is final, and is the
 * only one with a consequence. One path taking a `commit: true` flag would make
 * the difference between looking and living-with-it a boolean in a body.
 *
 * THEY ARE THE API AND NOT THE FORM, the same claim `BUSINESS_NAME_PATH` makes.
 * The settings pane and the settings assistant are both ordinary callers: the
 * pane presses return and calls `check`, the assistant proposes names and calls
 * the same `check`, and neither wraps the other. That is [[REQ-239]]'s rule —
 * one API, two callers — and it is what closes this ticket's falsifier *"a route
 * to claiming a hostname that exists only inside a conversation."*
 *
 * BUSINESS-SCOPED LIKE EVERY ROUTE AROUND THEM, so the business is never named
 * in a body and no caller can claim an address for one the request did not
 * already resolve to.
 */
export const HOSTNAME_PATH = '/api/hostname'
export const HOSTNAME_CHECK_PATH = '/api/hostname/check'
export const HOSTNAME_CLAIM_PATH = '/api/hostname/claim'

/**
 * Where we take one back ([[REQ-238]], [[TODO-6]] §2).
 *
 * NOT UNDER `/api/hostname` WITH THE OTHER TWO, deliberately. Those are the
 * customer's own operations on their own business, reached under the business
 * scope; this is 1st Contact acting ON a customer, and it sits beside
 * `/api/grants/revoke` — the other route where we withdraw something we issued
 * — rather than in the surface the person it happens to is looking at.
 */
export const HOSTNAME_REVOKE_PATH = '/api/hostname/revoke'

/**
 * The customer's own domain — the selector, the sending toggle, and release
 * ([[REQ-259]]).
 *
 * TWO PATHS FOR THREE CONTROLS, and the split is which SUBJECT is being changed.
 * `/api/domain` is about the address — `GET` draws the whole section, `POST`
 * attaches, `DELETE` releases — and `/api/domain/email` is about mail from it,
 * which is separately reversible and must be, because a customer who wants their
 * old `From` address back must not have to give up the website address they have
 * just put on a van.
 *
 * `/api/domain` AND NOT `/api/admin/domains`. That one is the operator's, is
 * gated on `ownsPlatformBusiness` and takes a business id in its body; this is
 * business-scoped like every route around it, so the business is never named in a
 * body and no caller can attach an address to one the request did not already
 * resolve to. Two surfaces over one mechanism, and the mechanism — [[REQ-258]]'s
 * `serveHostOnSite` — is called by both rather than reimplemented by either.
 *
 * THE GATE IS THE ACCOUNT HOLDER AND NOT THE BUSINESS OWNER, which is the one
 * place this differs from `/api/hostname/claim` next door. What is being spent
 * is an ACCOUNT asset — `zones.account_id` — and the assignment happens inside a
 * business, so a member of one business must not be able to consume a domain the
 * account holder bought for a sibling one. `isAccountHolder` is the predicate and
 * `GET` answers it rather than refusing on it: a member who may not attach still
 * needs to be told what their site's address is, and told who to ask.
 *
 * `GET` IS ALSO THE VERIFICATION POLL. Resend's wait is minutes and has no
 * webhook here; a separate poll route would be a second way to ask one question,
 * and a state that only moved when somebody pressed something would read as
 * broken. See `domainState`.
 */
export const DOMAIN_PATH = '/api/domain'
export const DOMAIN_EMAIL_PATH = '/api/domain/email'

/**
 * The client's own record of what we have changed about their domain, and the
 * undo ([[REQ-260]]).
 *
 * WHY THE HISTORY IS NOT IN THE CHAT. The card in the conversation is where a
 * change is announced, and a conversation scrolls away — so the durable home of
 * *"what has been done to my domain, and can I put it back"* is the settings
 * surface, beside the domain section it is about. The card carries the same
 * undo while it is on screen; this is where it still is a year later.
 *
 * `GET` IS NOT GATED ON BEING THE ACCOUNT HOLDER, on `/api/domain`'s reasoning:
 * a member who may not change anything is still owed the truth about what
 * changed, and a 403 would tell them neither what happened nor who to ask.
 *
 * `POST .../undo` IS THE ACCOUNT HOLDER'S, like every other write that touches a
 * zone the account owns.
 */
export const DNS_CHANGES_PATH = '/api/domain/changes'
export const DNS_UNDO_PATH = '/api/domain/changes/undo'

/**
 * What `/api/ai/session` is asked for when the conversation is the business's own
 * ([[REQ-239]]).
 *
 * A VALUE ON THE WIRE, DECLARED, because both ends have to agree on it and one of
 * them is browser JavaScript that cannot import this module's TypeScript — the
 * same shape `SIGN_OUT_PATH` already has, held equal by a UAT rather than by an
 * import.
 */
export const BUSINESS_SESSION_SCOPE = 'business'
export const GRANTS_PATH = '/api/grants'
export const GRANT_REVOKE_PATH = '/api/grants/revoke'

/**
 * What an operator-only route says to everybody else.
 *
 * 404 AND NOT THE 403 EVERY OTHER REFUSAL USES, and the difference is the point.
 * `identity.ts` and `scope.ts` answer 403 because their caller asked a question
 * about themselves and is owed the fact that the answer is no. This caller asked
 * whether an administrative surface exists, and 403 answers that question with
 * *yes* — which is a fact about the system rather than about them, and one they
 * have no use for except to come back at it. So the route reports what an
 * unprivileged caller should be able to observe, which is nothing.
 *
 * IT IS WRITTEN RATHER THAN FALLEN THROUGH TO. Letting the path drop past the
 * route table into `env.ASSETS` would produce a more perfectly identical 404 —
 * and would make the refusal depend on a binding that some hosts do not have, so
 * the one place it is missing answers 500 and says by contrast that something is
 * there. A refusal that is uniform everywhere beats one that is indistinguishable
 * in most places.
 */
const ADMIN_ONLY_MESSAGE = 'Not found.'

/**
 * What {@link BUSINESSES_PATH} answers with.
 *
 * TWO THINGS IN ONE CALL, because the chrome needs both before it can draw
 * anything and they come from one source. The businesses half is the switcher's
 * list; the other half is who is signed in — which is the one thing in this
 * product that is NOT business-scoped ([[DOC-40]] §2), so a second endpoint for
 * it would be a second round trip for a value the first one already holds.
 *
 * THAT HALF IS CALLED `person` AND USED TO BE CALLED `account` ([[REQ-194]]). It
 * has always carried a person's `display_name` and their verified address, and
 * calling it an account was the API surface of the missing table: an account is
 * the payer and the owner of businesses, and a receipt is not addressed to
 * whoever happens to be signed in. The account has a table now, so the label goes
 * back to the noun it was always holding.
 *
 * AND THE ACCOUNT IS DELIBERATELY NOT ADDED BESIDE IT. What an account holds —
 * its plan, its invoices, its details — is the customer portal's subject
 * ([[DOC-40]] §2.1), and putting the beginnings of it on the chrome's own
 * endpoint is how the bespoke admin billing page gets built. This endpoint
 * answers facts about the SESSION, which is exactly what a portal on another
 * origin cannot state.
 *
 * LAPSED BUSINESSES ARE RETURNED, MARKED. `admit` returns them deliberately —
 * "your grant expired" and "that business does not exist" need to look different
 * to the person who owns both — so the wire keeps the distinction rather than
 * filtering it out and making a lapsed business indistinguishable from a deleted
 * one.
 *
 * `id` RATHER THAN `businessId`, on the wire only. The chrome has no other kind
 * of id to confuse it with; the TypeScript name stays explicit where an account
 * id and a business id are both opaque strings ([[REQ-168]]).
 */
export interface BusinessesPayload {
  /**
   * WHO IS SIGNED IN ([[REQ-194]]) — a person, under the noun for one.
   *
   * `email` IS NULLABLE ([[REQ-191]]). It is the person's PRIMARY address, joined
   * from `user_emails` rather than read off a column, and a contact reached only
   * by phone holds none — the shape the old column could not represent. The
   * chrome already renders whichever of name and address it has.
   */
  person: { name: string | null; email: string | null } | null
  /**
   * `lapse` IS PRESENT EXACTLY WHEN `selectable` IS FALSE ([[REQ-180]] §1).
   *
   * Marked is not the same as explained. [[REQ-179]] made a lapsed business
   * distinguishable from a deleted one, which is what stops the list lying; this
   * carries the sentence that tells its owner which of "pay us" and "talk to us"
   * is the fix. It is a fact about a business the caller holds a live membership
   * on — the payload contains no others — so it discloses nothing about anybody
   * else, unlike `DenialReason`, which is why that one never leaves the log.
   */
  businesses: Array<{
    id: string
    name: string
    selectable: boolean
    lapse: BusinessLapse | null
  }>
  /**
   * Whether this session owns the 1st Contact business ([[REQ-297]], [[DOC-42]]
   * §7).
   *
   * THE NAME IS THE PREDICATE'S, DELIBERATELY. Calling it `isOperator`, `isAdmin`
   * or `level` would put on the wire the exact reading `identity.ts` forbids —
   * *a surface that appears "because you are an admin"* — and the wire is where a
   * later hand looks first. This says which question was asked, and the answer is
   * `ownsPlatformBusiness`, over `memberships.role`; the `platform_operator`
   * column is not consulted and `scope.ts` remains its only reader.
   *
   * IT BELONGS ON THIS ENDPOINT BECAUSE IT IS A FACT ABOUT THE SESSION, which is
   * what this payload answers — like `person`, and unlike the plan and invoices
   * this endpoint deliberately does not carry. It is not the account's, and it is
   * not any one business's.
   *
   * AND IT IS A CONVENIENCE FOR THE CHROME, NOT THE GATE — `canFulfil`'s exact
   * shape ([[REQ-170]]). The console's routes each ask the same question again
   * for themselves, because a control that is merely unrendered is refused to
   * nobody who can type a URL.
   */
  ownsPlatformBusiness: boolean
}

/**
 * Build it from the admission, or from the scope when there is none.
 *
 * THE ACCOUNT'S NAME IS PASSED IN, because a name is a row now and not a column
 * ([[REQ-193]]). This function is pure and stays pure; the route resolves the
 * current name through `names.ts` — the one place `superseded_at IS NULL` is
 * written — and hands it over. Reading it off the admission would have meant
 * either a name on every admission, which is a query on every request for a
 * value one endpoint uses, or this function reaching for a database.
 *
 * THE NO-ADMISSION ANSWER IS ONE SELECTABLE BUSINESS, and that is not a
 * placeholder: on the dev-open path `resolveScope` answers from `TENANT_ID`, so
 * there IS exactly one business by construction and reporting it is reporting
 * the truth. Reporting an empty list instead would leave the chrome with nothing
 * to scope itself to and no way to tell that state apart from a broken one.
 *
 * The name falls back to the id there because no `tenants` row has been read —
 * an opaque label is worse than a human one and better than a guess.
 *
 * AN ADMITTED ACCOUNT WITH NOTHING SELECTABLE STILL GETS ITS LIST, and this is
 * the route that matters most to it ([[DOC-42]] §10.1). The `admission?.ok`
 * branch is reached with every business marked unselectable and each carrying
 * its `lapse`, which is the whole of what the switcher needs to say which of
 * "pay us" and "talk to us" is the fix. It is why the scope may be null here:
 * this endpoint answers a question about the ACCOUNT, so it never needed one.
 *
 * A NULL SCOPE WITH NO ADMISSION IS AN EMPTY LIST, and is not constructible
 * today — the dev-open path resolves from `TENANT_ID` or refuses outright, so
 * there is always exactly one business on it. It is written rather than asserted
 * because an empty list is the one answer that is true whatever produced it,
 * where an invented id would be a business the chrome would then try to open.
 */
export function businessesPayload(
  admission: Admission | null | undefined,
  scope: Scope | null,
  personName: string | null = null,
  ownsPlatform: boolean = false,
): BusinessesPayload {
  if (admission?.ok) {
    return {
      person: { name: personName, email: admission.user.email },
      businesses: admission.businesses.map((b) => ({
        id: b.businessId,
        name: b.name,
        selectable: b.selectable,
        lapse: b.lapse,
      })),
      ownsPlatformBusiness: ownsPlatform,
    }
  }
  return {
    person: null,
    businesses: scope
      ? [{ id: scope.businessId, name: scope.businessId, selectable: true, lapse: null }]
      : [],
    // FALSE ON THE DEV-OPEN PATH, AND THAT IS THE SAME REFUSAL
    // `/api/admin/businesses` already makes: there is no admission there and
    // therefore nobody who could own anything, so a loopback door onto the
    // operator console would be a shape that reads as a feature and would
    // eventually be relied upon.
    ownsPlatformBusiness: false,
  }
}

/**
 * What the builder is told when it cannot work — one sentence, and an action.
 *
 * ADDRESSED TO WHOEVER CAN FIX IT. The client cannot set a `wrangler secret`, so
 * this does not ask them to; it says what is not working and names the thing that
 * is missing, which is what an operator reading a client's screenshot needs.
 */
export const NO_API_KEY_MESSAGE =
  'This builder has no Anthropic API key, so nothing that needs the assistant ' +
  'can run — no conversation, and no describing the material you upload. Set ' +
  'ANTHROPIC_API_KEY on the deployment and reload.'

/**
 * What an ingestion answers with.
 *
 * THE DESCRIPTION STATUS AND `indexed` ARE IN THE ENVELOPE, not just in the log.
 * The Library has to be able to show *"stored, but nothing has read it"* without
 * a second request, and a client watching an upload succeed deserves to be told
 * when what they uploaded cannot yet be found.
 */
function materialEnvelope(ingested: {
  ticket: { uid: string; title: string; fields: Record<string, unknown> }
  attachment: { uid: string; fields: Record<string, unknown> }
  description: { status: string }
  indexed: boolean
  text?: { uid: string } | null
}): Record<string, unknown> {
  return {
    uid: ingested.ticket.uid,
    title: ingested.ticket.title,
    // THE NAME THE CLIENT CAN SAY BACK ([[REQ-287]]). The uid addresses the row
    // and the filename addresses the bytes; neither is a name a person could be
    // expected to repeat, and a uuid off a phone camera is not even a name they
    // could read. The label is — it is what the Library's rows show and what the
    // assistant accepts as a handle ([[REQ-218]]) — so anything composing a
    // sentence about this material needs it in the same answer that announced
    // the material, rather than a second request to find out what to call it.
    //
    // NOT READ BACK. `ingest` allocates the label in the same `create` as the
    // classification it is derived from, so by the time an envelope is composed
    // the value is already on the ticket in hand.
    //
    // `?? null` FOR THE SAME REASON `description_model` IS NEVER OMITTED: the
    // key is then present on every envelope, and a caller deciding what to call
    // the material never has to tell absence from emptiness. Nothing ingested
    // through this path can lack one, but the field is `string | null` on the
    // row and the envelope should not be the one place that claims otherwise.
    label: ingested.ticket.fields.label ?? null,
    kind: ingested.ticket.fields.kind,
    rights: ingested.ticket.fields.rights,
    republishable: ingested.ticket.fields.republishable,
    exportable: ingested.ticket.fields.exportable,
    origin: ingested.ticket.fields.origin,
    // WHAT THE CLIENT SAID IT WAS FOR ([[REQ-161]]). Echoed rather than left to
    // be re-derived from `republishable`, because the two come apart the moment
    // captures land ([[DOC-38]] 3a is reference material AND republishable), and
    // the Library filters on this one.
    role: ingested.ticket.fields.role,
    source_url: ingested.ticket.fields.source_url,
    description_status: ingested.description.status,
    description_model: ingested.ticket.fields.description_model,
    attachment: {
      uid: ingested.attachment.uid,
      sha256: ingested.attachment.fields.sha256,
      size: ingested.attachment.fields.size,
      content_type: ingested.attachment.fields.content_type,
    },
    indexed: ingested.indexed,
    // WHERE THE DOCUMENT'S OWN TEXT WENT (REQ-173). Echoed because the body no
    // longer carries it: a caller that wants the verbatim text now has to know
    // there is a comment to ask for, and the uid is the honest way to say so.
    text_comment: ingested.text ? ingested.text.uid : null,
  }
}

/**
 * "Site asset" means the bytes are actually on the site ([[REQ-161]]).
 *
 * THE ROLE IS NOT A LABEL. The overlay's first area promises the file will be
 * something visitors see, and a ticket in a store is not that — until the bytes
 * are in the site's asset library the client has dropped their logo into a
 * filing cabinet. So the upload route completes the promise, immediately, which
 * is also what makes a dropped logo pickable in the same second rather than
 * after some later step nobody has specified.
 *
 * THROUGH THE GATE, NEVER AROUND IT. `promoteToSiteAsset` refuses anything whose
 * ticket is not `republishable`, and `classify` writes that bit from the role —
 * so the second area is mechanically incapable of reaching a published site,
 * rather than merely not routed there. That is [[DOC-38]] §5's invariant getting
 * its first real caller, which is the whole reason [[REQ-163]] shipped the
 * refusal before anything could call it.
 *
 * A FAILURE HERE DOES NOT LOSE THE UPLOAD. The material is stored, described and
 * indexed by the time this runs; a site store that refuses the write (an unknown
 * site key, a store that is not there) must not turn that into a 500 that tells the
 * client their file did not arrive. It is reported in the envelope instead —
 * named, not swallowed, so the overlay can say what did and did not happen.
 *
 * WHICH IS WHY PLACEMENT IS RECORDED INSIDE `promoteToSiteAsset` AND NOT HERE
 * (BUG-47). Because this path fails softly, a `placed_on` written on the way in
 * would mark every soft failure as a success — the material is kept, so the row
 * would survive carrying a placement that never happened. The record is written
 * after the asset write returns, so the only rows that claim a site are the ones
 * whose bytes reached it.
 *
 * AND SCRUBBED ON THE WAY OUT, exactly as the route table's own failures are.
 * This is a 200 carrying a message from a caught exception, which is the one
 * shape that looks like it escapes REQ-146's guarantee — the envelope leaves the
 * Worker whatever the status code on it says, so the scrubber has to travel with
 * it rather than being applied only where an error status is set.
 *
 * IT TAKES THE THREE FACTS IT READS, NOT AN `Ingested` ([[REQ-213]]). There are
 * two callers now — the upload, and a client correcting what a file is for — and
 * the second has no ingestion to hand it: nothing was ingested, a ticket that has
 * been sitting in the Library for a week simply changed its mind. Narrowing the
 * parameter to `uid`/`role`/`filename` is what lets the two share this rather
 * than the second growing its own copy of the gate, the soft failure and the
 * scrub. `role`/`filename` are `unknown` because both callers read them off a
 * ticket's untyped `fields`, and the comparison is against the literal either way.
 */
async function placeOnSite(
  material: { uid: string; role: unknown; filename: unknown },
  site: string | undefined,
  openTickets: () => Promise<TicketStore>,
  openStore: () => Promise<TenantSiteStore>,
  scrub: (message: string) => string,
  /**
   * The renderer, so what lands on the site is the picture as it stands
   * ([[REQ-229]]).
   *
   * NULL IS ORDINARY AND IS NOT A FAILURE — a deployment with no `[images]`
   * binding promotes the bytes it was given, which is what promotion meant
   * before recipes existed. Both callers reach this by way of an upload or a
   * role correction, neither of which has any business refusing over a
   * capability the client never asked for.
   */
  renderer: ImageRenderer | null,
): Promise<Record<string, unknown>> {
  if (material.role !== 'site' || !site) return { site_asset: null }
  const name = String(material.filename ?? '')
  try {
    const placed = await promoteToSiteAsset(
      await openTickets(),
      await openStore(),
      { uid: material.uid, slug: site, name },
      { ...(renderer ? { renderer } : {}) },
    )
    return { site_asset: placed.name }
  } catch (err) {
    return {
      site_asset: null,
      site_asset_error: scrub(err instanceof Error ? err.message : String(err)),
    }
  }
}

/**
 * The site a correction's bytes should go on, when there is exactly one ([[REQ-213]]).
 *
 * ASKED OF THE STORE RATHER THAN OF THE CLIENT, and that is the whole point.
 * The upload route takes its site off the form because the OVERLAY knows which
 * site is open — it is mounted in the builder, over an editor, with a site in
 * front of it. The Library is not: [[REQ-181]] removed the site as a dimension
 * of that tab deliberately, because a business holds one site in v1 and so *"on
 * this site"* and *"on the site"* are the same sentence. Threading a site key
 * back through the panel to reach this would restore the dimension that ticket
 * deleted, in the one module whose suite asserts it cannot ask.
 *
 * SO THE ANSWER COMES FROM THE TENANT HANDLE, which is already scoped to this
 * business and cannot address another's. One site is the v1 case and the only
 * one with an unambiguous answer.
 *
 * ANYTHING ELSE IS `undefined`, WHICH MEANS "DO NOT PLACE" RATHER THAN "FAIL".
 * A business with no site yet has nowhere to put a picture and has not done
 * anything wrong; a business with several (v2) has a question nobody asked it,
 * and guessing would put a client's logo on a site they were not looking at.
 * Both land on `placeOnSite`'s existing soft path, so the correction stands and
 * the row honestly reports that the bytes are not on a site — which is exactly
 * what [[REQ-181]]'s warning badge is for.
 *
 * A STORE THAT WILL NOT OPEN IS THE SAME ANSWER. This runs on a path whose whole
 * failure model is soft, and a deployment with no site store must not turn a
 * role correction that did land into a 500.
 */
async function theOneSite(openStore: () => Promise<TenantSiteStore>): Promise<string | undefined> {
  try {
    // KIND `site`, NOT EVERY SITE THE BUSINESS HOLDS ([[REQ-236]]). A business
    // that has authored a portal owns two rows, and asking for all of them made
    // this answer `undefined` — so a correction stopped being placed on the
    // customer's own site because of a page they authored at `/account`. The
    // portal is not a site anybody uploads a logo onto; naming the kind is what
    // makes "the one site" mean what the sentence above says.
    const sites = await (await openStore()).siteKeys('site')
    return sites.length === 1 ? sites[0] : undefined
  } catch {
    return undefined
  }
}

/**
 * This business's site store, or nothing at all ([[REQ-229]]).
 *
 * THE SAME SOFT READING `theOneSite` TAKES, for the same reason: the paths that
 * want a site store here are paths whose primary act has already succeeded — a
 * role corrected, a recipe accepted — and a deployment with no store, or a
 * business with no site yet, has not done anything wrong. Spread into the deps
 * object so "there is no store" is the ABSENCE of the key rather than a `null`
 * every reader downstream has to narrow.
 */
async function siteStoreOrNone(
  openStore: () => Promise<TenantSiteStore>,
): Promise<{ sites?: TenantSiteStore }> {
  try {
    return { sites: await openStore() }
  } catch {
    return {}
  }
}

function uncacheable(response: Response): Response {
  const headers = new Headers(response.headers)
  headers.set('cache-control', NO_STORE)
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

/**
 * The runtime's promise to keep this isolate alive past the response (BUG-46).
 *
 * A FOURTH PARAMETER AND NOT A {@link RouterDeps} FIELD, because it is not a
 * dependency this route table chooses — it is per-request state the runtime
 * hands the fetch handler, exactly like `request` and `env`, and it is a
 * different object on every invocation.
 *
 * OPTIONAL, because `route()` has hosts that have no such thing: the Node
 * transport in `builder.ts` calls it directly, and a Node process does not end
 * when a response does, so there is nothing there to extend. Every use below is
 * therefore a graceful degradation rather than a requirement — absent, the work
 * still runs, it just runs with only the client's attention holding it open,
 * which is the behaviour that predates this and is correct off-Worker.
 */
export interface RouteContext {
  waitUntil(promise: Promise<unknown>): void
}

/**
 * THE SCOPE IS AN ARGUMENT, NOT SOMETHING THIS FILE DERIVES ([[REQ-168]]).
 *
 * It arrives already authorised: `index.ts` resolves it from the caller's
 * admission before any route is examined, in the same place and for the same
 * reason the Access gate and `admit` sit there. A route table that resolved its
 * own scope would be a second authorisation path beside the one in `fetch`, and
 * the interesting question about two authorisation paths is only ever when they
 * begin to disagree.
 *
 * REQUIRED, AND AHEAD OF `deps`. Both are deliberate. An optional scope would
 * need a default, and the only available default is the deployment's own
 * business — which is precisely the value this ticket exists to stop routes
 * reading. Putting it ahead of `deps` makes every existing call site a compile
 * error rather than letting one slide through on a positional argument that
 * still type-checks.
 *
 * NULLABLE, WHICH IS NOT THE SAME AS OPTIONAL ([[DOC-42]] §10.1). It is still a
 * required argument with no default; what it may now carry is the resolver's
 * answer that this admitted account has no business to be in — a lapsed customer
 * who must still reach the chrome and the switcher that explains why
 * ([[REQ-179]], [[REQ-180]] §1). Every route that needs a business asks
 * {@link NoBusinessError} for it through the openers below, so the ones that do
 * not — the chrome, `/api/status`, `/api/businesses` — keep answering without a
 * per-route null check, and a route added later cannot forget one.
 */
export async function route(
  request: Request,
  env: RouterEnv,
  scope: Scope | null,
  deps: RouterDeps = {},
  ctx?: RouteContext,
): Promise<Response> {
  return uncacheable(await routeUncached(request, env, scope, deps, ctx))
}

async function routeUncached(
  request: Request,
  env: RouterEnv,
  scope: Scope | null,
  deps: RouterDeps = {},
  ctx?: RouteContext,
): Promise<Response> {
  const url = new URL(request.url)
  // THE BUSINESS PREFIX IS STRIPPED ONCE, HERE, and the route table below is
  // untouched by it. Every route matches on `p`, so one rewrite at the top scopes
  // all of them — including `/preview/<siteKey>/<channel>/…`, whose relative
  // sub-resources inherit the prefix from the document that referenced them,
  // which is the property `scope.ts` chose a path over a query string for.
  //
  // The id is DISCARDED here rather than re-read: `index.ts` already resolved and
  // authorised it. Reading it a second time would be a second answer to "which
  // business", and the whole point of the resolver is that there is one.
  const p = splitBusinessPrefix(url.pathname).path
  const method = request.method

  // ONE SCRUBBER FOR THE WHOLE TABLE (REQ-146 AC4). It was built per catch block,
  // which is three declarations of the same thing and, more to the point, three
  // places for the next route to forget one. Hoisting it makes "every `error:`
  // value out of this table is `scrub(...)`" a rule with a single subject —
  // which is the rule the boundary UAT actually checks for.
  const scrub = redactor(secretsOf(env))

  /**
   * The business this request runs in, or a refusal ([[DOC-42]] §10.1).
   *
   * ONE PLACE, so the null cannot be forgotten. Every route that needs a
   * business reaches it through the three openers below, and all three come
   * through here — so an admitted account with nothing selectable refuses those
   * routes uniformly, and the routes above the store keep answering. A per-route
   * check would be the same rule written a dozen times, with the twelfth one
   * missing and returning a 503 to the one person whose problem is a payment.
   */
  const requireScope = (): Scope => {
    if (scope === null) throw new NoBusinessError()
    return scope
  }

  /**
   * The same `env`, seen as the identity module sees it.
   *
   * HOISTED because [[REQ-170]]'s five routes need it as well as
   * `/api/admin/businesses`, and a cast repeated six times is six places for one
   * of them to drift into a different assertion. It is a view and not a
   * conversion: nothing is copied and no binding is added.
   */
  const identityEnv = env as unknown as IdentityEnv

  /**
   * This tenant's capture bundles, or `null` where they have nowhere to live.
   *
   * HOISTED TO THE TOP OF THE TABLE rather than built inside the one route that
   * reads it, because the route it serves — `/api/import`, BUG-84's rights gate
   * — sits ABOVE the three store openers, and a `const` declared below it is in
   * its temporal dead zone. Put here it is declared before every route, which is
   * where a thing every route may reach belongs anyway.
   *
   * NULL IS AN ORDINARY STATE, NOT A REFUSAL. `BLOBS` is where a capture's bytes
   * go, so a deployment without it cannot be holding any — there is nothing to
   * check against, and the gate has nothing to say. Turning that into a 503
   * would refuse every push on a deployment that never had a capture to
   * republish, which protects nobody from anything.
   */
  const openReferences = async (): Promise<ReferenceStore | null> => {
    if (deps.references) return deps.references(env, requireScope())
    if (!env.BLOBS) return null
    return r2ReferenceStore({ DB: env.DB, BLOBS: env.BLOBS }).forTenant(requireScope().businessId)
  }

  if (p === '/' || p === '/index.html') {
    return new Response(chromeHtml(), {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    })
  }

  /**
   * POST /api/activity/surface — the builder says which surface it is on
   * ([[REQ-235]] §5).
   *
   * THE ONE CLIENT-SIDE PIECE, AND THE SMALLEST THING THAT CLOSES THE GAP. The
   * builder makes requests as an operator works, but a quiet tab makes none — so
   * *"which tab, and for how long"* is not inferable from server traffic at all:
   * a tab nobody has opened and a tab somebody has been reading for twenty
   * minutes are indistinguishable. This is the statement that separates them.
   *
   * IT IS A SIGNAL AND NOT A BEACON PROTOCOL. No heartbeats, no timers, no
   * duration computed in the browser. One post when the surface CHANGES, and the
   * server timestamps what it receives — which is why the record carries stamps
   * and the arithmetic happens on read.
   *
   * THE CLIENT'S OWN TIMESTAMP AND TENANT CLAIM ARE NOT WHAT IS STORED
   * ([[EPIC-1]] §41.1). `kind=client` means *a browser said this*, and a browser
   * is re-stamped rather than trusted: `ts` comes from the server clock, the
   * business comes from the scope the request was authorised under, and the
   * actor comes from the admission — none of the three is read off the body. A
   * body field naming any of them is simply ignored, which is stronger than
   * rejecting it, because there is no branch to get wrong.
   *
   * WHAT THE BODY MAY SAY IS THE SURFACE, AND ONLY THAT. It is bounded in length
   * and stripped, because it lands in a dimension — an unbounded string in a
   * group-by key is a group-by key with as many values as there are callers.
   *
   * IT ANSWERS 204 AND NOT 200. Nothing is returned, nothing is read back, and a
   * body would invite a client to depend on one.
   */
  if (p === '/api/activity/surface' && method === 'POST') {
    const scoped = requireScope()
    const body = await readJsonBody(request)
    const surface = String(body.surface ?? '').trim().slice(0, MAX_SURFACE_LENGTH)
    if (surface === '') return json(400, { error: 'surface is required' })
    // A HOST WITH NO LOG RECORDS NOTHING AND STILL SUCCEEDS. The Node builder
    // transport has no D1 to write into; refusing there would make a surface
    // change fail in a builder where nothing is wrong.
    deps.log?.logger().info('surface.shown', {
      kind: KINDS.CLIENT,
      route: surface,
      business: scoped.businessId,
      actor: deps.admission?.ok ? deps.admission.user.id : undefined,
    })
    return new Response(null, { status: 204 })
  }

  /**
   * POST /api/import — one whole site, copied up from a local store (REQ-145).
   *
   * THE WORKER IS THE WRITER, deliberately. The caller runs in Node, which
   * has no D1 binding and no R2 binding; the alternatives were shelling out to
   * `wrangler d1 execute` with site JSON hand-escaped into SQL, or a third
   * store adapter over Cloudflare's HTTP API. Posting the payload here means
   * an import lands through exactly the store an edit lands through.
   *
   * ONE WRITE, so an import either lands whole or not at all. Against this
   * adapter that is one `db.batch()`. A half-landed import would be worse than
   * a failed one: the site would exist, would validate as far as it went, and
   * would be missing pages nobody had a record of.
   *
   * IDEMPOTENT by construction — `createDraft` is a no-op for a site that
   * exists and the write replaces each page and asset by name — so re-running a
   * copy after a LOCAL edit is the ordinary way to use it.
   *
   * "Idempotent" was doing too much work in that sentence, and BUG-51 is the
   * bill. Re-running the command is safe when the local copy is the only place
   * the site is edited; it is destructive the moment the site has also been
   * edited in the builder, because this route replaces what is there rather than
   * merging with it. The guard below draws that line, so the sentence above is
   * now true of the case it was always meant to describe.
   *
   * IT RESOLVES ITS OWN TARGET NOW ([[REQ-236]]). The payload used to address
   * one, by slug, and it cannot any more: a D1 site is named by a key, and a
   * file-backed sender names a directory and has never seen one.
   * So the target is THIS BUSINESS'S SITE — the one of kind `site`, created when
   * the business holds none — which is the only unambiguous reading while a
   * business holds exactly one ([[BUG-90]]). A business holding several is
   * refused with a message saying so rather than guessed at, because guessing
   * would overwrite a site the operator was not pushing to.
   *
   * `payload.slug` SURVIVES AND NAMES THE SOURCE. It is what the site is called
   * on the laptop it came from, which is what a refusal has to say back to the
   * operator, and it addresses nothing here.
   */
  if (p === '/api/import' && method === 'POST') {
    // DECLARED OUTSIDE THE `try` so the catch below can name the site it was
    // refusing (BUG-84). A refusal that does not say which slug it was about is
    // half a message when the operator is pushing several.
    let payload: SitePayload | null = null
    try {
      payload = (await readJsonBody(request)) as unknown as SitePayload
      if (!payload || typeof payload.slug !== 'string' || payload.slug === '') {
        return json(400, { error: 'slug is required' })
      }
      if (!Array.isArray(payload.pages) || !Array.isArray(payload.assets)) {
        return json(400, { error: 'pages and assets must be arrays' })
      }
      // The SAME opener every other route uses (BUG-36). This route had its own
      // for a while, because `forTenant` refuses an unknown tenant — which on a
      // fresh database is every request, including the one that would populate
      // it. But that made the import the only way a deployment's tenant ever got
      // registered, so a builder nobody had published to could not be read at
      // all. `storeFor` registers the configured tenant itself now, and there is
      // one opener again.
      const store = await (deps.store ?? storeFor)(env, requireScope())
      // BUG-51 — AN IMPORT MAY NOT SILENTLY REPLACE WORK DONE IN THE BUILDER.
      //
      // This route replaces `site.json` and every page the payload carries, and
      // the write is unconditional. That is correct for what it was built for
      // — copying a locally authored site up — and catastrophic for the case
      // nobody had separated from it: a freshly scaffolded site pushed over one
      // somebody spent an afternoon building. BUG-51 is that case. The site was
      // not deleted, so nothing looked broken; its `site.json` and `home.json`
      // were simply the starter's, while the change journal, the assets, the
      // audit trail and the chat transcript all survived to say what had been
      // there.
      //
      // THE COUNTER IS THE TEST, NOT THE VERSION, and the difference is the
      // whole reason this refusal does not break the ordinary loop. `write`
      // bumps `version` on every call including this route's own, so a site that
      // has only ever arrived through this route still has a version well above
      // zero — guarding on it would refuse the second copy of the same site,
      // every time. `counter` moves only through `appendChange`,
      // which is what a builder edit, an AI turn or a structured-edit command
      // does. So it separates content somebody AUTHORED HERE from content this
      // very command put here, which is exactly the distinction being made.
      //
      // REFUSED BEFORE THE WRITE, not rolled back after it: there is nothing to
      // learn from the attempt, and a `createDraft` left behind would turn a
      // refusal into a half-landed one.
      // THE TARGET, RESOLVED BEFORE ANYTHING IS READ OR WRITTEN ([[REQ-236]]).
      // `null` means the business holds none and one will be minted below; more
      // than one is the ambiguity this route refuses rather than resolves.
      const held = await store.siteKeys('site')
      if (held.length > 1) {
        return json(409, {
          error:
            `This business holds ${held.length} sites, so '${payload.slug}' has no ` +
            'unambiguous destination. Nothing was written.',
          slug: payload.slug,
          sites: held.length,
        })
      }
      const target = held[0] ?? null
      const authored = target === null ? 0 : await store.counter(target)
      if (authored > 0 && payload.force !== true) {
        return json(409, {
          error:
            `Site '${payload.slug}' has ${authored} change(s) made in the builder. ` +
            'Importing would replace them. Nothing was written.',
          slug: payload.slug,
          changes: authored,
          // Named in the body rather than only in the prose, so a caller that
          // is not a person can tell "refused, and here is the way to mean it"
          // from "refused" without parsing a sentence.
          force: 'Re-send with "force": true (bin/copy-to-cloud --force).',
        })
      }
      const write = payloadToWrite(payload)
      // BUG-84 — THE RIGHTS GATE THIS DOOR NEVER HAD.
      //
      // `promoteToSiteAsset` refuses to put a capture-sourced picture on a site,
      // because doing so publishes third-party copyright under the client's own
      // domain — [[DOC-38]] §5's "most damaging single action available in the
      // system". It enforces that by reading `republishable` off the material's
      // own record. THIS route has no record to read: a subresource mirrored
      // into `storage/sandbox/<slug>/draft/assets/` by `1c repro` and copied up
      // arrives as bare bytes under a bare name, so the gate had nothing to
      // consult and the bytes went straight past it.
      //
      // SO IDENTITY IS THE BYTES. The copy destroys every other link back to the
      // capture; the content hash is the only evidence it cannot erase. See
      // `asset-rights.ts` for why the scan is the bundle's `assets/` prefix and
      // why there is no override.
      //
      // ENFORCED HERE AS WELL AS IN THE SENDER, not instead of it. The CLI checks
      // the operator's own `storage/references/` tree and this checks the
      // tenant's cloud bundles; neither sees the other's captures, and a request
      // posted by hand never runs the CLI at all. The Worker is the writer, so
      // the Worker enforces the rule.
      //
      // AFTER THE 409 AND BEFORE `createDraft`. After, because "you would
      // replace work somebody did in the builder" is the question the operator
      // has to answer first and `--force` is its answer. Before the draft is
      // created, because a refusal must leave NOTHING behind — the same reason
      // the 409 above refuses ahead of the write rather than rolling back after
      // it. A business with no site does not acquire one because somebody tried
      // to publish a picture they may not publish.
      const references = await openReferences()
      if (references) await assertNotCaptureMirrored(write.assets, references)
      const site = target ?? (await store.createDraft('site'))
      await store.write(site, write)
      return json(200, {
        // THE KEY THIS LANDED ON ([[REQ-236]]). The caller sent a name that means
        // something only on the laptop it came from, and the destination is
        // addressed by a key the store minted — so without this the pusher has no
        // way to say which site it just wrote, and no way to open a builder on it.
        site,
        pages: write.pages.length,
        assets: write.assets.length,
        siteJson: write.siteJson !== undefined,
      })
    } catch (err) {
      // Rethrown for the reason the table's own handler rethrows it: this route
      // opens the store itself rather than through the memoised opener, so it is
      // the one place a missing business would be swallowed into a 500 instead
      // of reaching `index.ts` as the caller-level 403 it is.
      if (err instanceof NoBusinessError) throw err
      // 403 AND NOT 400 (BUG-84). The request was well formed, the caller is
      // who they say they are, and the payload is exactly what they meant to
      // send — the answer is no. A 400 would read as "fix your request", which
      // is advice this caller cannot act on: there is no re-formed push that
      // makes somebody else's photograph publishable.
      //
      // AND NOT 409 EITHER, which this route already uses for BUG-51's "you
      // would replace builder changes". That one is a question with an answer
      // (`--force`); this one is a rule with none, and collapsing the two would
      // make the reflex for the first reach for a flag that cannot help here.
      if (err instanceof MirroredAssetError) {
        return json(403, {
          error: scrub(err.message),
          slug: payload?.slug,
          asset: err.asset,
          bundle: err.bundle,
          member: err.member,
        })
      }
      // Applied here too, though this route never touches a credential: a path
      // that scrubs and a path that does not is an invitation to add a third
      // that does not, and the cost when there is nothing to scrub is nil.
      if (err instanceof CommandError) {
        return json(400, { error: scrub(err.message), ...err.toEnvelope() })
      }
      const message = err instanceof Error ? err.message : String(err)
      return json(500, { error: scrub(message) })
    }
  }

  /**
   * GET /api/export — this business's site, in the shape `/api/import` takes
   * ([[REQ-289]]).
   *
   * THE WORKER READS, THROUGH THE VERY STORE IT SERVES FROM, which is
   * `/api/import`'s argument in reverse and the whole reason this is a route
   * and not a script. The sites that exist were authored in the builder and
   * live in D1 and R2 — under `wrangler dev` that is a miniflare SQLite file
   * whose layout is an implementation detail, plus a second SQLite and a blob
   * directory beside it. Opening those from Node would be a third store adapter
   * with no contract behind it. One HTTP GET against the Worker that already
   * has the bindings costs nothing and cannot disagree with the store.
   *
   * IT IS `/api/import`'s MATCHED PAIR, and that is a maintenance obligation
   * rather than a resemblance. Export followed by import yields a draft
   * identical to the original — same `site.json`, same page documents, same
   * asset bytes under the same names — because both halves are the same
   * {@link SitePayload}, produced and consumed by the same two functions in
   * `push.ts`. A change to the payload shape that touches one must touch the
   * other.
   *
   * IT RESOLVES ITS TARGET THE WAY THE IMPORT DOES. The business comes from the
   * authorised scope, never from a query parameter; a business holding more than
   * one site is refused as ambiguity, in the words the import refuses it in,
   * rather than resolved by first match — the difference being that guessing
   * here hands back a site the operator was not asking for, and guessing there
   * overwrites one.
   *
   * A BUSINESS HOLDING NO SITE IS A 404 NAMING IT, not an empty payload. An
   * empty export is a legible thing to import over the top of something real,
   * so "there was nothing to read" must not be expressible as a successful read
   * of nothing.
   *
   * NO RIGHTS GATE HERE, deliberately (BUG-84). The gate refuses PUBLISHING a
   * capture-mirrored asset under a client's own domain; this hands a caller who
   * already owns the store the bytes that are already in it. The gate is on the
   * write side, where it already runs against the destination's own bundles —
   * so an export that carries such an asset is refused the moment somebody tries
   * to import it, which is the moment it matters.
   */
  if (p === '/api/export' && method === 'GET') {
    try {
      const scoped = requireScope()
      const store = await (deps.store ?? storeFor)(env, scoped)
      const held = await store.siteKeys('site')
      if (held.length > 1) {
        return json(409, {
          error:
            `This business holds ${held.length} sites, so there is no unambiguous ` +
            'site to export. Nothing was read.',
          sites: held.length,
        })
      }
      const site = held[0]
      if (site === undefined) {
        return json(404, {
          error: `Business '${scoped.businessId}' holds no site to export.`,
          business: scoped.businessId,
        })
      }
      const { payload } = await readSiteDraft(store, site)
      return json(200, payload)
    } catch (err) {
      // Rethrown for the reason the import route rethrows it: this route opens
      // the store itself rather than through the memoised opener, so it is one
      // of the two places a missing business would be swallowed into a 500
      // instead of reaching `index.ts` as the caller-level 403 it is.
      if (err instanceof NoBusinessError) throw err
      const message = err instanceof Error ? err.message : String(err)
      return json(500, { error: scrub(message) })
    }
  }

  /**
   * GET /api/chats/export — this business's whole conversation history
   * ([[REQ-294]]).
   *
   * THE SECOND PAIR, AND IT IS A SECOND PAIR ON PURPOSE. `/api/export` above
   * carries a site and nothing else; the obligation `/api/import` and it owe
   * each other is that a change to one touches the other, and folding
   * conversations into `SitePayload` would make every future change to either
   * half of THAT pair a change to conversations too — while making a plain site
   * copy carry data the operator did not ask for. So this is its own payload,
   * produced and consumed by `chat-copy.ts`'s own two functions.
   *
   * THE WORKER READS, THROUGH THE VERY STORE IT SERVES FROM, for the reason the
   * site export gives: under `wrangler dev` a conversation is rows in a
   * miniflare SQLite file whose layout is an implementation detail, and Node has
   * no contract for it.
   *
   * A BUSINESS WITH NO CONVERSATIONS IS 200 AND AN EMPTY LIST, and that is the
   * OPPOSITE of the site export's 404 — deliberately, because the two are not
   * the same statement. "This business holds no site" makes an export
   * meaningless: an empty site payload is a perfectly legible thing to import
   * over the top of something real, so it must not be expressible. "This
   * business has had no conversations yet" is an ordinary, true fact about a new
   * client, and the import it produces writes nothing. Nothing can be destroyed
   * by an empty history, so nothing needs to be refused.
   *
   * NO AMBIGUITY TO REFUSE EITHER. The site export refuses a business holding
   * two sites because there is no unambiguous site to read; a history is every
   * conversation the business holds, which is unambiguous however many there
   * are.
   */
  if (p === '/api/chats/export' && method === 'GET') {
    try {
      const scoped = requireScope()
      const store = await (deps.tickets ?? ticketStoreFor)(env, scoped)
      return json(200, await readChats(store, scoped.businessId))
    } catch (err) {
      // Rethrown for the reason the two site routes rethrow it: this route opens
      // its store itself rather than through the memoised opener below, so it is
      // one of the places a missing business would be swallowed into a 500
      // instead of reaching `index.ts` as the caller-level 403 it is.
      if (err instanceof NoBusinessError) throw err
      const message = err instanceof Error ? err.message : String(err)
      return json(500, { error: scrub(message) })
    }
  }

  /**
   * POST /api/chats/import — a conversation history, written into this business
   * ([[REQ-294]]).
   *
   * `/api/chats/export`'s MATCHED PAIR, and the same maintenance obligation the
   * site pair carries: export followed by import yields the same conversations —
   * same transcripts, same ledgers, same standing notes — because both halves
   * are the same `ChatsPayload`, produced and consumed by the same two functions
   * in `chat-copy.ts`.
   *
   * IT RESOLVES ITS OWN TARGET, exactly as `/api/import` does. The business
   * comes from the authorised scope and never from the payload; `payload.business`
   * names where the conversations were read and addresses nothing here.
   *
   * AND IT RESOLVES ITS OWN SITE TOO, WHICH IS [[BUG-137]]. A conversation is
   * addressed by a session id DERIVED from the thing it is about — `site-<site
   * key>` or `business-<business id>` — and neither id survives a crossing: a
   * business's is minted independently on each side, and the destination's site
   * key is minted fresh by `/api/import`. Carried through unchanged, every
   * imported conversation named a site and a business that do not exist here;
   * the rows landed in the right tenant with their transcripts intact and
   * nothing could ever ask for them, while the operator was told the copy had
   * succeeded. So this route hands `writeChats` the two ids this destination
   * actually has and the payload's addresses are re-derived from them — the same
   * treatment `tenant_id` already got, applied to the id hidden inside a derived
   * key.
   *
   * THE SITE IS RESOLVED THE WAY THE SITE PAIR RESOLVES IT, and refused on the
   * same ambiguity in the same words: a business holding more than one site has
   * no unambiguous site for a conversation to be re-addressed onto, and a first
   * match would put one site's history in another's pane. `null` — a business
   * holding no site — is an ordinary state and only refused if a conversation
   * about a site actually arrives.
   *
   * RE-RUNNING IT IS THE ORDINARY WAY TO USE IT, and this time the sentence is
   * true without a footnote. Conversations are matched by `session_id` and each
   * is written whole or not at all, so a second copy adds no ticket, no comment
   * and no turn. `force` is what replaces a conversation the destination already
   * holds; without it that conversation is kept and counted. See `writeChats`
   * for why this is a count rather than the 409 `/api/import` answers.
   */
  if (p === '/api/chats/import' && method === 'POST') {
    try {
      const scoped = requireScope()
      const store = await (deps.tickets ?? ticketStoreFor)(env, scoped)
      const payload = (await readJsonBody(request)) as unknown as ChatsPayload
      const chats = Array.isArray(payload?.chats) ? payload.chats : null
      if (chats === null) {
        // NAMED RATHER THAN COERCED TO AN EMPTY IMPORT. A body with no `chats`
        // is a caller sending the wrong shape, and answering 200 "0 landed"
        // would report that as a successful copy of nothing.
        return json(400, {
          error: 'A conversation history must carry a `chats` array. Nothing was written.',
        })
      }
      const sites = await (deps.store ?? storeFor)(env, scoped)
      const held = await sites.siteKeys('site')
      if (held.length > 1) {
        return json(409, {
          error:
            `This business holds ${held.length} sites, so there is no unambiguous ` +
            'site to re-address these conversations onto. Nothing was written.',
          sites: held.length,
        })
      }
      return json(
        200,
        await writeChats(
          store,
          { ...payload, chats },
          { businessId: scoped.businessId, siteKey: held[0] ?? null },
        ),
      )
    } catch (err) {
      if (err instanceof NoBusinessError) throw err
      // 409 AND NOT 400 ([[BUG-137]]). The request is well formed and the caller
      // meant exactly what it sent — what it cannot do is say where these
      // conversations belong HERE. That is a conflict with the state of this
      // destination, which is what 409 already means on both import routes, and
      // is the same distinction `/api/import` draws between its own 409 and
      // BUG-84's 403: a question about this side's state, not advice to re-form
      // the request.
      if (err instanceof ChatAddressError) {
        return json(409, { error: scrub(err.message), sessions: err.sessions })
      }
      if (err instanceof CommandError) {
        return json(400, { error: scrub(err.message), ...err.toEnvelope() })
      }
      const message = err instanceof Error ? err.message : String(err)
      return json(500, { error: scrub(message) })
    }
  }

  /**
   * THE STORE IS OPENED LAZILY, and that is a bug fix rather than a
   * micro-optimisation (REQ-149).
   *
   * It used to be opened HERE, unconditionally, before any route matched — so
   * every request built a tenant-scoped handle, including the ones that fall
   * through to the assets binding at the bottom. `forTenant` refuses an unknown
   * tenant, which is correct, so on a store with no tenant row every
   * `/builder/*` and `/webui/*` request answered 503. Those are BUILD ARTIFACTS:
   * they have nothing to do with a tenant and must not depend on one.
   *
   * The visible symptom was a blank builder. `/` is answered above, before the
   * store, so the document arrived 200 while every module in its import graph
   * died — a page that loaded successfully and did nothing, with the reason
   * reachable only in devtools.
   *
   * WHY NOT MOVE THE FALL-THROUGH UP INSTEAD. Because the fall-through is last
   * on purpose: an asset must never shadow a route. Deferring the store keeps
   * that ordering exactly as it was and removes the dependency, which is the
   * part that was actually wrong.
   *
   * Memoised per request, so a route that reads it twice still performs one
   * tenant check — the same handle the eager version produced, obtained at the
   * first moment something genuinely needs it.
   */
  let opening: Promise<TenantSiteStore> | null = null
  const openStore = (): Promise<TenantSiteStore> => {
    opening ??= (deps.store ?? storeFor)(env, requireScope())
    return opening
  }
  // `actor: 'client'` — REQ-131. A write arriving on these routes is the
  // operator's own hand in the builder, and the journal says so, which is the
  // difference between the assistant reading "you changed this" and reading
  // "something changed".
  const edit = async () => ({ store: await openStore(), actor: 'client' as const })

  // Memoised per request for the same reason the site store is: a route that
  // opens it twice would perform two tenant-registry checks to obtain the same
  // handle.
  let tickets: Promise<TicketStore> | null = null
  const openTickets = (): Promise<TicketStore> => {
    tickets ??= (deps.tickets ?? ticketStoreFor)(env, requireScope())
    return tickets
  }

  /**
   * Every picture the editor's image picker may offer — [[REQ-282]] Part 2.
   *
   * `null` WHERE THIS DEPLOYMENT HOLDS NO LIBRARY, and that is not a degraded
   * mode: the `1c` dev builder is a site store with no ticket store at all, and
   * {@link BlobsNotConfiguredError} is the named way it says so. The picker then
   * draws the descriptor's own `enum` — the site's assets — which is genuinely
   * every picture such a deployment has.
   *
   * ONLY THAT ONE REFUSAL IS ABSORBED. Any other failure is a deployment that
   * DOES hold a Library and could not read it, and quietly handing back the
   * narrow list would reproduce exactly the bug this ticket closes with no way
   * to tell. It travels out as itself.
   */
  const pickerCatalogue = async (site: string): Promise<PictureChoice[] | null> => {
    try {
      return await pictureChoices(await openTickets(), await openStore(), site)
    } catch (err) {
      if (err instanceof BlobsNotConfiguredError) return null
      throw err
    }
  }

  /**
   * What ingestion needs from this deployment — the indexer and the describer.
   *
   * BOTH ARE OPTIONAL AND THE TWO ABSENCES ARE NOT ALIKE, which is why they are
   * reported differently:
   *
   *   - NO DESCRIBER is an ordinary, visible state. The material is stored, its
   *     body says nothing has looked at it, and `description_status` makes the
   *     backlog a query. Nothing is lost that a later pass cannot recover.
   *   - NO INDEXER IS NOT. [[DOC-39]] §4 is explicit that an unindexed document
   *     is **invisible** — search cannot return what it has not embedded — so an
   *     unwired hook is a silent failure of the worst kind: every upload
   *     succeeds, the Library fills up, and the assistant can find none of it.
   *     So it is LOGGED LOUDLY, once per affected upload, naming the binding.
   *
   * [[REQ-159]] is landed, so the hook has a real implementation to reach —
   * `onMaterialWritten` refreshes the vector index inline and defers the
   * awareness-map rebuild behind it. The seam survives anyway, because the claim
   * a UAT needs to make ("called exactly once per created material") should not
   * require an embedder, an R2 index and a Workers AI binding to make.
   */
  const ingestDeps = async () => ({
    index: deps.index
      ? await deps.index(env, requireScope())
      : await defaultIndexer(env, requireScope()),
    describeImage: deps.describeImage ?? defaultDescriber(env),
    describeText: deps.describeText ?? defaultTextDescriber(env),
    // `undefined` MEANS "NOT INJECTED" AND `null` MEANS "NO BINDING", and both
    // reach `ingestUpload` as themselves ([[REQ-221]]). `imagesHeicConverter`
    // returns `null` for an unconfigured deployment, so the two ways of having
    // no converter converge on the value the refusal is keyed on.
    convertHeic: deps.convertHeic !== undefined ? deps.convertHeic : imagesHeicConverter(env),
  })

  try {
    /**
     * GET /api/status — can this deployment do anything at all? (REQ-173)
     *
     * ABOVE THE STORE AND ABOVE THE TENANT CHECK, deliberately, and the same
     * reasoning the lazy store above records applies with more force here: this
     * is the question the builder asks BEFORE it decides whether to offer the
     * operator anything, so answering it must not depend on the parts of the
     * deployment that may themselves be unconfigured.
     *
     * IT REPORTS A CAPABILITY, NOT A SECRET. The key's presence is the answer;
     * the key never appears in it, and `redactor` guards the rest of the table
     * for the case where one leaks into a message.
     */
    if (p === AI_STATUS_PATH && method === 'GET') {
      const ready = aiConfigured(env, deps)
      return json(200, { ai: ready, message: ready ? null : NO_API_KEY_MESSAGE })
    }

    /**
     * GET /api/businesses — what the shell's switcher lists ([[REQ-179]]).
     *
     * ABOVE THE STORE, for the reason `/api/status` is: this is asked BEFORE the
     * chrome has chosen a business, so it must not depend on a store handle
     * scoped to one. It is also the only route whose answer is about the ACCOUNT
     * rather than about the resolved scope, which is why it reads `deps.admission`
     * and nothing else does.
     *
     * IT IS NOT AN ORACLE. It reports only what this caller already passed
     * `admit` for, so it discloses nothing a refused visitor could not already
     * infer — unlike a lookup by id, which is why `scope.ts` refuses one target
     * with one message.
     */
    if (p === BUSINESSES_PATH && method === 'GET') {
      return json(
        200,
        businessesPayload(
          deps.admission,
          scope,
          deps.admission?.ok
            ? displayNameFrom(await currentNameOf(identityEnv, deps.admission.user.id))
            : null,
          // THE CHROME IS TOLD WHETHER THE OPERATOR CONSOLE EXISTS FOR IT
          // ([[REQ-297]]). Answered here rather than inferred by the client from
          // anything it can see — the switcher's list does not distinguish
          // owning the 1st Contact business from merely being able to open it,
          // and a client that guessed would draw a control whose routes then
          // refuse it.
          ownsPlatformBusiness(identityEnv, deps.admission),
        ),
      )
    }

    /**
     * GET/POST /api/acceptances — the portal's own endpoint ([[REQ-245]]).
     *
     * ABOVE THE STORE, and for a reason stronger than the two routes before it:
     * it is not scoped to the business the caller is OPERATING at all. Like the
     * portal page itself ([[DOC-42]] §10.1) it answers about the business the
     * caller is a CONTACT OF — `portalBusinessId`'s expression, and the one that
     * needs no second implementation when the portal moves origins. So
     * `requireScope` is never called, and an account whose every grant has
     * lapsed reads and changes its preferences exactly as anyone else does.
     *
     * IT REQUIRES AN ADMISSION AND NOT A SCOPE. There is no contact on the
     * dev-open path — a configured tenant id is a business, not a person — and
     * a portal that answered about "whoever the deployment is configured as"
     * would be answering about somebody. So no admission is 404, which is the
     * same answer the portal page gives a host with nobody behind it.
     *
     * THE CONTACT IS READ OFF THE ADMISSION AND NEVER OFF THE REQUEST. Both
     * verbs derive it from the session; the POST additionally REFUSES a body
     * that names a different one, rather than ignoring it — a caller who
     * believed they had written to somebody else must be told they did not
     * ([[REQ-245]] AC7).
     *
     * THE WRITE IS THE ONE OPENING IN THE PORTAL'S READ-ONLY CONTRACT
     * ([[REQ-245]] §2), and its bound is `setPreference`, which refuses every
     * key whose type is not a preference. There is no route here that grants
     * access, moves an entitlement or deletes anything, and no argument this one
     * takes that could reach code which does.
     */
    if (p === ACCEPTANCES_PATH && (method === 'GET' || method === 'POST')) {
      const admission = deps.admission
      // `ok` AND NOT `portalBusinessId`. That helper falls back to the scope for
      // the dev-open path, which answers "which business hosts a portal" — a
      // question this route cannot use, because it also needs a person.
      //
      // The message is SCRUBBED though there is nothing in it to scrub, on the
      // reasoning the push route already records: a path that scrubs and a path
      // that does not is an invitation to add a third that does not, and the
      // cost where there is nothing to find is nil.
      if (!admission?.ok) return json(404, { error: scrub(ADMIN_ONLY_MESSAGE) })
      const contactId = admission.user.id
      const portalScope: Scope = { businessId: admission.user.tenant_id }
      const eventEnv = env as unknown as EventEnv
      const store = await (deps.tickets ?? ticketStoreFor)(env, portalScope)

      if (method === 'GET') {
        return json(200, {
          acceptances: await portalAcceptances(eventEnv, store, portalScope, contactId),
        })
      }

      const body = await readJsonBody(request)
      const named = typeof body.contactId === 'string' ? body.contactId : null
      if (named !== null && named !== contactId) {
        // 403 AND NOT 404. The caller is who they say they are and the request
        // is well formed; the answer is no. Answering 404 would make this
        // indistinguishable from "no such contact" and therefore an existence
        // oracle over every contact id in the system.
        return json(403, { error: 'A contact may only change their own preferences.' })
      }
      const key = typeof body.key === 'string' ? body.key : ''
      if (typeof body.granted !== 'boolean') {
        // BOTH DIRECTIONS ARE FACTS ([[REQ-240]] §2), so neither is the default
        // a missing value falls back to. An absent `granted` is a request that
        // did not say which way, and guessing would record a withdrawal nobody
        // asked for as readily as a grant.
        return json(400, { error: 'granted must be true or false.' })
      }
      try {
        return json(200, {
          acceptance: await setPreference(
            eventEnv,
            store,
            portalScope,
            contactId,
            key,
            body.granted,
          ),
        })
      } catch (err) {
        if (err instanceof UnknownAcceptanceError) return json(400, { error: scrub(err.message) })
        if (err instanceof AcceptanceRefusedError) return json(403, { error: scrub(err.message) })
        if (err instanceof AcceptanceDocumentNotFoundError) {
          return json(404, { error: scrub(err.message) })
        }
        throw err
      }
    }

    /**
     * POST /api/admin/businesses — the operator adds a business ([[REQ-180]]).
     *
     * THERE IS NO SELF-SERVE COUNTERPART, and its absence is the ticket's
     * decision rather than an omission to be filled in later. `provisionBusiness`
     * writes a live `pro` grant, so a customer-reachable route onto it is an
     * unbounded free-plan mint until billing exists ([[DOC-40]] §9). Adding a
     * business is therefore an operator action, done by hand, and this is the
     * whole of the mechanism.
     *
     * IT CALLS `provisionBusiness` AND NOTHING ELSE. A business is a tenant, a
     * membership, a grant and a starter site, and the ONE thing this route must
     * not do is write some of them: a `tenants` row without a membership is a
     * business nobody may operate and `businessesFor`'s join silently drops it,
     * so the operator would see a successful response and an unchanged switcher.
     * The rows live in one function ([[REQ-178]]) and both the invite path and
     * this one go through it, which is also what keeps an invited business and an
     * added one indistinguishable afterwards.
     *
     * ABOVE THE STORE, like the two routes before it, because provisioning
     * REGISTERS the tenant a store handle would need to already exist.
     *
     * WHAT THE GATE IS ACTUALLY FOR, and it is not "administrators get extra
     * pages" ([[DOC-42]] §7). Provisioning a business is 1st Contact FILLING AN
     * ORDER — our own product-fulfilment action — and it needs privilege because
     * it writes a `tenants` row, not because the caller holds a badge. As two
     * conditions: you are an owner of this business, and this business's product
     * is businesses. The first is uniform — a customer is the owner of theirs, and
     * will have fulfilment actions of their own that look nothing like this one
     * and will not sit behind the same check. The second is what confines this
     * control to us.
     *
     * AND BOTH ARE SPELLED OUT NOW ([[REQ-185]]). They used to be one read of
     * `users.platform_admin`, because that flag selected exactly this set — and
     * that is precisely what [[DOC-42]] §10.3 called the defect: a flag bundling
     * "owner of the 1st Contact business" with "may enter a business I hold no
     * membership on", so a hand reading it here would build a generic
     * admin-surface mechanism rather than these two conditions, and [[REQ-170]]'s
     * console would be the first to inherit it. `ownsPlatformBusiness` asks the
     * two questions instead, over `memberships.role` — the same way ownership is
     * expressed for every other business — and `platform_operator`, which is what
     * is left of the flag, is not consulted here at all. A holder of it who owns
     * no membership on this business is refused, and a UAT says so.
     *
     * THE ADMISSION IS THE ONLY THING CONSULTED, because this is a question about
     * the PERSON and not about the business the request resolved to: an operator
     * filling an order is not thereby operating the business they are creating.
     * On the dev-open path there is no admission and therefore nobody to fill an
     * order, and the route is refused: a loopback door onto account provisioning
     * is a shape that reads as a feature and would eventually be relied upon.
     */
    if (p === ADMIN_BUSINESSES_PATH && method === 'POST') {
      const admission = deps.admission
      // `env` is structurally an `IdentityEnv` — it carries the same `DB` and
      // `SITES` — and this cast is the whole of the coupling. The router never
      // names `TENANT_ID`: which business's product is businesses, and where the
      // platform's accounts live, are both `identity.ts`'s knowledge, kept there
      // so [[REQ-168]]'s two readers stay two.
      if (!ownsPlatformBusiness(identityEnv, admission)) {
        console.warn(
          JSON.stringify({
            event: 'admin_route_refused',
            path: p,
            email: admission?.ok ? admission.user.email : null,
          }),
        )
        return text(404, ADMIN_ONLY_MESSAGE)
      }

      const body = await readJsonBody(request)
      const accountEmail = typeof body.accountEmail === 'string' ? body.accountEmail : ''
      const name = typeof body.name === 'string' ? body.name : ''
      if (accountEmail.trim() === '' || name.trim() === '') {
        return json(400, { error: 'accountEmail and name are required' })
      }

      const account = await findAccount(identityEnv, accountEmail)
      // Reported plainly, because the caller is an administrator who typed the
      // address and is owed the difference between "no such account" and "done".
      // The oracle argument that silences every other refusal does not apply to
      // someone who already holds the flag that would answer the question anyway.
      if (!account) return json(404, { error: 'No account with that email address.' })

      const business = await provisionBusiness(identityEnv, {
        // THE ACCOUNT'S KEY, NOT A PERSON'S ([[REQ-194]]). `findAccount` used to
        // return a `UserRow` and this line used to read `account.id` off it, which
        // is where "an account is a user" actually cost something: the business
        // being created recorded a person as its owner.
        accountId: account.id,
        name,
        plan: typeof body.plan === 'string' ? body.plan : undefined,
        endsAt: typeof body.endsAt === 'string' ? body.endsAt : null,
        // The gate above has already established that this caller owns the 1st
        // Contact business, which is only true of a successful admission — but
        // `ownsPlatformBusiness` is a boolean and not a type predicate (for the
        // reason it gives), so the read is guarded again rather than asserted.
        grantedBy: (admission?.ok ? admission.user.email : null) ?? undefined,
        note: typeof body.note === 'string' ? body.note : undefined,
      })
      return json(200, business)
    }

    /**
     * `/api/admin/zones` — the operator's view of the DNS layer ([[REQ-257]]).
     *
     * ONE GATE FOR BOTH METHODS, AND IT IS `ADMIN_BUSINESSES_PATH`'S EXACTLY:
     * `ownsPlatformBusiness`, over the admission and not over the resolved
     * business, answering 404 rather than 403 because a caller asking whether an
     * administrative surface exists is owed nothing. Zones are not a per-business
     * capability that we happen to hold more of — they are the platform's own
     * Cloudflare account, and every zone in it is equally ours until this table
     * says otherwise.
     *
     * NO TOKEN IS A REFUSAL AND NOT AN EMPTY REPORT. This is the fail-closed rule
     * the ticket states, and here it has teeth in an unobvious direction: a drift
     * check assembled from no upstream data reports NO DRIFT, which is the one
     * answer it must never give by accident. `requireCloudflare` throws and the
     * route says which secret is missing.
     */
    if (p === ADMIN_ZONES_PATH && (method === 'GET' || method === 'POST')) {
      const admission = deps.admission
      if (!ownsPlatformBusiness(identityEnv, admission)) {
        console.warn(
          JSON.stringify({
            event: 'admin_route_refused',
            path: p,
            email: admission?.ok ? admission.user.email : null,
          }),
        )
        return text(404, ADMIN_ONLY_MESSAGE)
      }

      // THE SEAM AND THE DEFAULT ANSWER THE SAME WAY — `null` for a deployment
      // that cannot reach Cloudflare — so a suite injecting `() => null` is
      // asserting the real no-token refusal rather than simulating one.
      const client: CloudflareClient | null = deps.cloudflare
        ? deps.cloudflare(env)
        : cloudflareFor(env)
      if (client === null) {
        // SCRUBBED THOUGH THERE IS NOTHING IN IT TO SCRUB, on the reasoning
        // this file already records: a path that scrubs beside a path that does
        // not is an invitation to add a third that does not, and the cost when
        // there is nothing to scrub is nil.
        return json(503, { error: scrub(new CloudflareNotConfiguredError().message) })
      }

      try {
        /**
         * GET — every recorded zone, and the drift report beside it.
         *
         * THE TWO TOGETHER RATHER THAN TWO ROUTES, because the question an
         * operator actually has is *"what is the state of this"* and the drift
         * is only readable against the rows it is a diff of. It writes nothing:
         * `origin` is a human decision and there is no way to derive it, so a
         * report that reconciled would be inventing the one fact the table
         * exists to record.
         */
        if (method === 'GET') {
          const [zones, drift] = await Promise.all([allZones(identityEnv), driftCheck(identityEnv, client)])
          return json(200, { zones, drift })
        }

        /**
         * POST — the backfill. An operator names the apex and the account.
         *
         * THE ACCOUNT ARRIVES BY EMAIL AND IS RESOLVED TO A KEY HERE, on
         * `/api/admin/businesses`'s reasoning: an operator knows who somebody is
         * by their address and has no reason to hold an `acct_…`. And the
         * refusal is reported plainly for that route's reason too — the caller
         * typed the address and is owed the difference between *no such account*
         * and *done*.
         */
        const body = await readJsonBody(request)
        const apex = typeof body.apex === 'string' ? body.apex : ''
        const accountEmail = typeof body.accountEmail === 'string' ? body.accountEmail : ''
        if (apex.trim() === '' || accountEmail.trim() === '') {
          return json(400, { error: 'apex and accountEmail are required' })
        }
        const account = await findAccount(identityEnv, accountEmail)
        if (!account) return json(404, { error: 'No account with that email address.' })

        const zone = await attributeZone(identityEnv, client, { apex, accountId: account.id })
        return json(200, { zone })
      } catch (err) {
        // EACH REFUSAL KEEPS ITS OWN STATUS, because they are four different
        // things an operator does four different things about: a platform apex
        // is a rule they cannot argue with, an apex already recorded is a
        // decision somebody already made, an apex Cloudflare does not hold is a
        // step not yet taken, and an API refusal is somebody else's problem.
        if (err instanceof PlatformZoneError) return json(403, { error: scrub(err.message) })
        if (err instanceof ZoneApexTakenError) return json(409, { error: scrub(err.message) })
        if (err instanceof UnknownZoneError) return json(404, { error: scrub(err.message) })
        // CLOUDFLARE'S OWN WORDS COME BACK THROUGH THE SCRUBBER, and this is the
        // path that actually needs it: the message is composed from a refusal
        // built BELOW us by a client that was handed a bearer token, which is
        // exactly the shape of leak [[REQ-146]] AC4 defends against.
        if (err instanceof CloudflareApiError) return json(502, { error: scrub(err.message) })
        throw err
      }
    }

    /**
     * `/api/admin/domains` — point a domain at a site, or stop ([[REQ-258]]).
     *
     * ONE GATE FOR BOTH METHODS AND IT IS {@link ADMIN_ZONES_PATH}'S EXACTLY,
     * including the `null` client seam and the no-token refusal. A deployment
     * that cannot reach Cloudflare cannot write a record or a route, and
     * attaching the row anyway would produce this ticket's first falsifier — a
     * row whose host resolves nowhere — rather than a refusal.
     *
     * THE REFUSALS KEEP THEIR OWN STATUS CODES, on the zones route's reasoning:
     * they are different things an operator does different things about. A
     * domain that is not a domain is theirs to retype (400); a zone this
     * deployment does not hold, or a business with no site, is a step not yet
     * taken (404); a zone that is not ready to serve is a wait or an
     * attribution (409); a host already pointed at a site is a decision somebody
     * already made (409); an API refusal is somebody else's problem (502).
     */
    if (p === ADMIN_DOMAINS_PATH && (method === 'POST' || method === 'DELETE')) {
      const admission = deps.admission
      if (!ownsPlatformBusiness(identityEnv, admission)) {
        console.warn(
          JSON.stringify({
            event: 'admin_route_refused',
            path: p,
            email: admission?.ok ? admission.user.email : null,
          }),
        )
        return text(404, ADMIN_ONLY_MESSAGE)
      }

      const client: CloudflareClient | null = deps.cloudflare
        ? deps.cloudflare(env)
        : cloudflareFor(env)
      if (client === null) {
        return json(503, { error: scrub(new CloudflareNotConfiguredError().message) })
      }

      try {
        if (method === 'DELETE') {
          // THE HOST IS IN THE QUERY AND NOT IN A BODY. A `DELETE` carrying one
          // is accepted by some clients and silently dropped by others, and a
          // delete whose subject went missing in transit is the worst shape of
          // request there is.
          const host = url.searchParams.get('host') ?? ''
          if (host.trim() === '') return json(400, { error: 'host is required' })
          const stopped = await stopServingHost(identityEnv, client, host)
          // IDEMPOTENT, on `revokeHostname`'s reasoning: an operator repeating a
          // command should get the same answer twice, and *"that was not
          // serving"* is not a failure.
          return json(200, { released: stopped?.hosts ?? [], siteKey: stopped?.siteKey ?? null })
        }

        const body = await readJsonBody(request)
        const host = typeof body.host === 'string' ? body.host : ''
        const businessId = typeof body.businessId === 'string' ? body.businessId : ''
        if (host.trim() === '' || businessId.trim() === '') {
          return json(400, { error: 'host and businessId are required' })
        }
        // THE BUSINESS NAMES THE SITE, AND `hostname.ts` OWNS THAT STEP. A route
        // that took a site key would be asking an operator to hold an opaque
        // value they have no way to look up, and one that resolved the site here
        // would be a second answer to *"which site is a business's"* beside the
        // one `businessAddresses` already uses.
        const siteKey = await siteOf(identityEnv, businessId)
        if (siteKey === null) {
          return json(404, { error: 'That business has no site yet, so there is nothing to address.' })
        }
        const result = await serveHostOnSite(identityEnv, client, { siteKey, host })
        return json(200, {
          siteKey: result.siteKey,
          zone: result.zone,
          addresses: result.addresses,
          routes: result.routes,
          // REPORTED AND NEVER SWALLOWED. Pointing a domain at us IS replacing
          // whatever its apex pointed at, and an operator who has just taken a
          // live site off the air is owed the list rather than a surprise.
          replaced: result.replaced,
        })
      } catch (err) {
        if (err instanceof InvalidHostnameError) return json(400, { error: scrub(err.message) })
        if (err instanceof NoZoneForHostError) return json(404, { error: scrub(err.message) })
        if (err instanceof ZoneNotReadyError) return json(409, { error: scrub(err.message) })
        if (err instanceof HostnameTakenError) return json(409, { error: scrub(err.message) })
        if (err instanceof CloudflareApiError) return json(502, { error: scrub(err.message) })
        throw err
      }
    }

    /**
     * GET /api/admin/dns?domain=… — what the world currently resolves
     * ([[REQ-257]]).
     *
     * THE ANSWER TO *"IS THERE A LIVE BUSINESS ON THIS DOMAIN TODAY"*, which
     * [[EPIC-5]] identifies as the question that decides the work — and the
     * operator about to attribute a zone is exactly the person who needs it
     * answered before they do.
     *
     * READ FROM OUTSIDE AND NEVER FROM OUR OWN ZONE. It follows the domain's
     * current delegation, so it reports what the customer's visitors and the
     * customer's mail servers actually get, which is the only reading that can
     * detect a domain we have not taken over.
     *
     * BEHIND THE SAME GATE AS THE ZONES ROUTE. The answer names a business's mail
     * provider and every sender authorised to send as them; that is a profile of
     * somebody else's infrastructure, assembled on request, and it is not
     * something to hand to whoever asks.
     */
    if (p === ADMIN_DNS_PATH && method === 'GET') {
      const admission = deps.admission
      if (!ownsPlatformBusiness(identityEnv, admission)) {
        console.warn(
          JSON.stringify({
            event: 'admin_route_refused',
            path: p,
            email: admission?.ok ? admission.user.email : null,
          }),
        )
        return text(404, ADMIN_ONLY_MESSAGE)
      }
      const domain = url.searchParams.get('domain') ?? ''
      if (domain.trim() === '') return json(400, { error: 'domain is required' })
      const resolver = deps.resolver ? deps.resolver(env) : dnsResolver()
      try {
        return json(200, await resolver.snapshot(domain))
      } catch (err) {
        // COULD-NOT-LOOK IS NOT THE SAME AS NOTHING-IS-PUBLISHED, and this is
        // the one place the difference can be reported. An empty snapshot says
        // *this domain is green field, write what you like*; a resolver that
        // could not be reached must never be read as saying that.
        if (err instanceof ResolverUnreachableError) return json(502, { error: scrub(err.message) })
        throw err
      }
    }

    /**
     * GET /api/admin/spend?business=…&from=…&to=… — what a tenant's
     * conversations have cost, in engaged hours and in dollars ([[REQ-293]]).
     *
     * THE TWO NUMBERS A PERSON CAN ACT ON, and the arithmetic that turns the
     * meter's rows into them lives in `spend-report-core.ts`, not here. This
     * route is the transport: it decides WHO may ask and WHICH tenant and WHAT
     * period, and hands the rest over.
     *
     * BEHIND `ownsPlatformBusiness`, AND 404 RATHER THAN 403, on
     * {@link ADMIN_ZONES_PATH}'s reasoning exactly: a caller asking whether an
     * administrative surface exists is owed nothing. The answer here is a
     * profile of somebody else's spending — how long they worked, on what, and
     * at what rate — which is not a fact to hand to whoever asks.
     *
     * BOTH ENDS OF THE PERIOD ARE OPTIONAL AND ABSENT MEANS UNBOUNDED. The
     * meter is retained rather than pruned (REQ-292), so *everything this
     * tenant has ever spent* is a question it can answer — and the first person
     * to read this has no period in mind yet, because the baseline they are
     * establishing is what a period would be judged against.
     *
     * AN UNREADABLE STAMP IS A REFUSAL AND NOT AN IGNORED BOUND. Dropping a
     * `from` nobody could parse would answer a DIFFERENT question — a wider one
     * — with no sign that it had, and the reader would take the total for the
     * month they asked about.
     */
    if (p === ADMIN_SPEND_PATH && method === 'GET') {
      const admission = deps.admission
      if (!ownsPlatformBusiness(identityEnv, admission)) {
        console.warn(
          JSON.stringify({
            event: 'admin_route_refused',
            path: p,
            email: admission?.ok ? admission.user.email : null,
          }),
        )
        return text(404, ADMIN_ONLY_MESSAGE)
      }
      const business = (url.searchParams.get('business') ?? '').trim()
      if (business === '') return json(400, { error: 'business is required' })
      const { period, unreadable } = spendPeriodOf(url)
      if (unreadable) return json(400, { error: `${unreadable} is not a readable timestamp` })
      /**
       * THREE ANSWERS IN ONE ROUND TRIP, AND THEY ARE ONE ANSWER ([[REQ-297]]).
       * The console opens a tenant's detail as a single act, and the day rows and
       * the delegated half are meaningless apart from the report they are a
       * decomposition of — two more requests would let a surface paint a
       * decomposition of a period it is no longer showing.
       *
       * `report` IS THE PRINCIPAL HALF and is exactly what [[REQ-293]] has always
       * returned: the tenant's OWN turns. It is NOT the total. `delegated` is the
       * other half and the two are never added here — a caller's true total is
       * `usage + sum(attributed)`, and a route that folded them would remove the
       * one distinction that makes a delegation experiment readable.
       *
       * `delegated` IS `null` RATHER THAN A ZEROED SHAPE for a tenant that handed
       * nothing off, which is every tenant while the switch is off ([[REQ-295]]).
       * Nothing, never zero.
       */
      return json(200, {
        business,
        period: { from: period.from ?? null, to: period.to ?? null },
        report: await tenantSpendReport(env, business, period),
        days: await tenantSpendDays(env, business, period),
        delegated: await tenantDelegatedSpend(env, business, period),
      })
    }

    /**
     * GET /api/admin/turns?business=… — how that business's recent turns ended
     * ([[REQ-306]]).
     *
     * THE TRANSPORT AND NOT THE JUDGEMENT. What "lost" means — a row nobody
     * closed, long enough ago that *still running* has stopped being credible —
     * belongs to `turn-log.ts` and is spelled there once, beside the ceiling it
     * depends on. A route that derived it here would be a second opinion about
     * the one fact this whole ticket turns on.
     *
     * IT REPORTS THE ROWS AND THE TALLY, NOT ONE OR THE OTHER. The tally is what
     * makes a pattern visible at a glance — `consecutiveLost` most of all, since
     * a run at the head of the list is what *failing right now* looks like — and
     * the rows are what let an operator carry a session id and a turn id to the
     * incident without reconstructing it from a platform tail, which is
     * requirement 4.
     *
     * BEHIND `ownsPlatformBusiness`, AND 404 RATHER THAN 403, on
     * {@link ADMIN_ZONES_PATH}'s reasoning exactly.
     */
    if (p === ADMIN_TURNS_PATH && method === 'GET') {
      const admission = deps.admission
      if (!ownsPlatformBusiness(identityEnv, admission)) {
        console.warn(
          JSON.stringify({
            event: 'admin_route_refused',
            path: p,
            email: admission?.ok ? admission.user.email : null,
          }),
        )
        return text(404, ADMIN_ONLY_MESSAGE)
      }
      const business = (url.searchParams.get('business') ?? '').trim()
      if (business === '') return json(400, { error: 'business is required' })
      const health = turnHealth(await tenantTurns(env, business))
      return json(200, {
        business,
        counts: health.counts,
        consecutiveLost: health.consecutiveLost,
        turns: health.turns,
      })
    }

    /**
     * GET /api/admin/spend/businesses?from=…&to=… — every tenant’s period, dearest
     * first ([[REQ-297]]).
     *
     * THE QUESTION THE OPERATOR CONSOLE EXISTS FOR — *which tenant is costing us
     * money* — and the only one on this console that cannot be asked of the route
     * above, because it is a question about the ORDER of tenants rather than
     * about any one of them.
     *
     * THE SAME GATE, THE SAME 404, and not a weaker one because the answer looks
     * like a summary. It is a profile of every customer's spending at once, which
     * is strictly more than the per-tenant route declines to hand over.
     *
     * NO `business` PARAMETER AND NO SCOPE READ. Like {@link ADMIN_BUSINESSES_PATH}
     * this is a question about the PLATFORM rather than about the business the
     * request happened to resolve to, and an operator comparing two tenants is
     * asking about somebody else's meter by definition.
     */
    if (p === ADMIN_BUSINESS_SPEND_PATH && method === 'GET') {
      const admission = deps.admission
      if (!ownsPlatformBusiness(identityEnv, admission)) {
        console.warn(
          JSON.stringify({
            event: 'admin_route_refused',
            path: p,
            email: admission?.ok ? admission.user.email : null,
          }),
        )
        return text(404, ADMIN_ONLY_MESSAGE)
      }
      const { period, unreadable } = spendPeriodOf(url)
      if (unreadable) return json(400, { error: `${unreadable} is not a readable timestamp` })
      return json(200, {
        period: { from: period.from ?? null, to: period.to ?? null },
        businesses: await tenantSpendLeague(env, period),
      })
    }

    /**
     * GET /api/admin/sites — every site on the platform ([[REQ-298]]).
     *
     * THE HALF OF THE CONSOLE'S LIST THE METER CANNOT ANSWER. The league knows
     * which businesses spent; this knows which sites exist, who owns them and
     * where they can be reached — including the ones that have never cost us
     * anything, which the league is right to leave out and this would be wrong to.
     *
     * THE SAME GATE, THE SAME 404, AND THE SAME LOG LINE as the routes above,
     * written out rather than routed through a helper for the reason the ones
     * above are: the refusal is the gate, and a gate that is one call away from
     * every route is one edit away from being the wrong call on one of them.
     */
    if (p === ADMIN_SITES_PATH && method === 'GET') {
      const admission = deps.admission
      if (!ownsPlatformBusiness(identityEnv, admission)) {
        console.warn(
          JSON.stringify({
            event: 'admin_route_refused',
            path: p,
            email: admission?.ok ? admission.user.email : null,
          }),
        )
        return text(404, ADMIN_ONLY_MESSAGE)
      }
      return json(200, { sites: await platformSites(identityEnv) })
    }

    /**
     * GET /api/people — everyone in the business this caller is in ([[REQ-170]]).
     *
     * THE SAME ANSWER FOR EVERY BUSINESS, and that uniformity is the ticket. The
     * rows are `users WHERE tenant_id = <the resolved business>`; viewed from 1st
     * Contact they are our customers, viewed from a customer's business they are
     * theirs. There is no branch on which business it is, because a people list
     * that had one would be the platform-only capability [[DOC-40]] §2.1 rule 1
     * forbids.
     *
     * CONTACTS ARE IN IT. A person the business knows and has never invited is a
     * row with `invited_at` null and it is listed as such ([[DOC-42]] §9) — the
     * CRM reads these same rows, and a tab that filtered them out would be a
     * second population that could disagree with the first about someone who is
     * both.
     *
     * `canInvite` IS THE OTHER HALF, AND IT IS A DIFFERENT QUESTION ([[REQ-186]]).
     * It answers [[DOC-42]] §7's FIRST condition alone — *you own this business* —
     * and is therefore true of every business owner, where `canFulfil` adds the
     * second condition and is true only of ours. Two flags rather than one
     * because the two controls they render are two acts: inviting makes a member
     * of this business, provisioning makes a business. Collapsing them would gate
     * the invite on being 1st Contact and foreclose level 2.
     *
     * `canFulfil` IS REPORTED WITH THE LIST rather than inferred by the client
     * from anything it can see. It answers [[DOC-42]] §7's two conditions —
     * *you own this business* and *this business's product is businesses* — and
     * the client renders the provisioning control on it. It is a convenience for
     * the chrome and NOT the gate: `/api/admin/businesses` asks the same question
     * again for itself, because a control that is merely unrendered is not
     * refused.
     */
    if (p === PEOPLE_PATH && method === 'GET') {
      const scope = requireScope()
      // THE HEAD IS READ BEFORE THE LIST, AND THE ORDER IS THE WHOLE POINT
      // ([[REQ-233]], on `/api/material`'s precedent). A write landing between
      // the two is then in the page AND in the replay the subscription opens
      // with — which patches a row the pane already drew, and is idempotent. The
      // other order puts that write in NEITHER, which is a contact the tab never
      // learns about: the exact failure this feed exists to remove.
      const seq = await contactChangeHead(identityEnv, scope)
      return json(200, {
        seq,
        people: await peopleOf(identityEnv, scope),
        canFulfil: ownsPlatformBusiness(identityEnv, deps.admission),
        canInvite: ownsBusiness(deps.admission, scope.businessId),
        /**
         * The contacts holding a bounced message ([[REQ-198]], [[REQ-199]]).
         *
         * REPORTED WITH THE LIST BECAUSE THAT IS WHERE IT IS NEEDED. A bad
         * address is the most valuable signal a beta produces and it is worth
         * nothing if it takes a click to find, so the list itself has to be able
         * to mark the row — which means the list's own read has to carry it.
         *
         * A SEPARATE ARRAY AND NOT A FIELD ON EACH PERSON. `peopleOf` is the
         * identity schema and knows nothing of messages; merging the two here
         * would put a ticket-store fact on a row whose shape is a `users` row,
         * and every other reader of that shape would inherit a field that is
         * sometimes there.
         *
         * ONE EXTRA QUERY, SCOPED LIKE EVERY OTHER. It reads this business's own
         * `email` records and no others.
         */
        bounced: await bouncedContactIds(await openTickets()),
      })
    }

    /**
     * GET /api/people/detail?id= — one person, with what they run, what they
     * hold, and what has happened to them.
     *
     * NOT FOUND AND NOT IN THIS BUSINESS ARE THE SAME ANSWER, which is what stops
     * this becoming the existence oracle `identity.ts` and `scope.ts` both refuse
     * to be: `personDetail` scopes by tenant AND id, so a caller in one business
     * guessing an id from another learns nothing a stranger could not.
     *
     * THE HISTORY TRAVELS WITH THE DETAIL AND NOT ON A ROUTE OF ITS OWN
     * ([[REQ-195]]). The pane draws it in the same paint as the record and the
     * businesses, so a second endpoint would be a second round trip for a pane
     * that cannot render without both — and a second surface to scope, which is
     * one more place the tenant barrier depends on somebody remembering it.
     * `events` is capped and `provenance` is its own query, so the cap can never
     * silently redefine where a contact came from.
     */
    if (p === PERSON_DETAIL_PATH && method === 'GET') {
      const id = new URL(request.url).searchParams.get('id') ?? ''
      const detail = await personDetail(identityEnv, requireScope(), id)
      if (!detail) return json(404, { error: 'No such person in this business.' })
      return json(200, detail)
    }

    /**
     * GET /api/people/messages?id= — what we have said to this person ([[REQ-198]]).
     *
     * SCOPED BY THE STORE HANDLE AND NOT BY THE QUERY. `openTickets` binds the
     * business into the handle, so this read cannot reach another business's
     * messages even given a contact id from one — the same guarantee
     * `personDetail` gets from scoping by tenant AND id, obtained here
     * structurally instead.
     *
     * NO EXISTENCE CHECK ON THE CONTACT, deliberately. An unknown id returns an
     * empty list rather than a 404, which is the same answer a real contact with
     * no messages gives — so this route is not a second way to ask whether a
     * person exists, which `/api/people/detail` is careful not to be.
     */
    if (p === PERSON_MESSAGES_PATH && method === 'GET') {
      const id = new URL(request.url).searchParams.get('id') ?? ''
      // `openTickets` requires the scope and binds it into the handle, so there
      // is no separate scope check here that could disagree with the one the
      // read is actually performed under.
      const store = await openTickets()
      // BOTH DIRECTIONS ON ONE ROUTE, AND AS TWO LISTS ([[REQ-267]] §5). The
      // question is *what has passed between us and this person*, and answering
      // half of it would leave the pane to discover the other half existed. They
      // arrive unmerged because the two types carry different fields and only
      // the surface knows how it wants to interleave them — merged here, that
      // choice could not be undone.
      return json(200, {
        messages: await messagesFor(store, id),
        received: await inboundFor(store, id),
      })
    }

    /**
     * GET /api/people/events?id=&before= — the rest of one contact's history
     * ([[REQ-267]] §8).
     *
     * THE CAP STOPPED BEING SAFE. `TIMELINE_LIMIT` was a cap and not a page on a
     * stated assumption — *data nobody has enough of* — that inbound mail
     * falsifies: every message in both directions lands on the spine. Left as
     * it was, the hundredth row is where a contact's history appears to BEGIN,
     * and nothing anywhere says so.
     *
     * NO EXISTENCE CHECK ON THE CONTACT, deliberately, for the reason
     * `/api/people/messages` gives: an unknown id answers with an empty page,
     * which is what a real contact with no older history answers too.
     */
    if (p === PERSON_EVENTS_PATH && method === 'GET') {
      const params = new URL(request.url).searchParams
      const events = await eventsOf(identityEnv, requireScope(), params.get('id') ?? '', {
        before: params.get('before'),
      })
      return json(200, { events })
    }

    /**
     * GET /api/people/inbound — mail from senders this business does not know
     * ([[REQ-267]] §6).
     *
     * PENDING IS A STATE OF THE MESSAGE AND NOT A NEW ENTITY. No `users` row was
     * created for any of these and no timeline entry was written, which is
     * exactly what [[DOC-54]] rests on: a forwarding test from an unmatched
     * sender creates no contact, no timeline entry and no metric, so there is
     * nothing for the notification rule to suppress and the rule never engages.
     *
     * DISCARDED SENDERS AND THE TEST GUTTER ARE BOTH ABSENT, and neither
     * exclusion is this route's to remember — `pendingInbound` performs both,
     * which is what keeps one answer to *what is waiting* rather than one per
     * caller.
     */
    if (p === PERSON_INBOUND_PATH && method === 'GET') {
      const scope = requireScope()
      return json(200, {
        pending: await pendingInbound(identityEnv, await openTickets(), scope),
        suppressed: [...(await suppressedAddresses(identityEnv, scope))].sort(),
      })
    }

    /**
     * POST /api/people/inbound/promote — this stranger is a contact
     * ([[REQ-267]] §6).
     *
     * IT RUNS `addContact` AND DOES NOT MINT A CONTACT BY A SECOND ROUTE. What
     * it adds is the attachment: the message is already stored, so promotion is
     * a contact plus a pointer and never a re-capture.
     *
     * THE SAME GATE `/api/people/add` CARRIES, because it performs that act. A
     * route that could create a contact without meeting the gate the create
     * route meets would be the gate's own bypass.
     */
    if (p === PERSON_INBOUND_PROMOTE_PATH && method === 'POST') {
      const scope = requireScope()
      if (!ownsBusiness(deps.admission, scope.businessId)) {
        return json(403, { error: 'Only an owner of this business may add contacts to it.' })
      }
      const body = await readJsonBody(request)
      try {
        return json(
          200,
          await promotePending(
            identityEnv,
            await openTickets(),
            scope,
            typeof body.uid === 'string' ? body.uid : '',
          ),
        )
      } catch (err) {
        // SCRUBBED LIKE EVERY OTHER ERROR VALUE OUT OF THIS TABLE. The message
        // is ours and carries no secret today, and that is exactly the reasoning
        // that makes an unscrubbed path a hole the next edit walks through.
        if (err instanceof UnknownMessageError) return json(404, { error: scrub(err.message) })
        throw err
      }
    }

    /**
     * POST /api/people/inbound/discard — stop asking about this sender, and
     * POST /api/people/inbound/restore — start again ([[REQ-267]] §6).
     *
     * STICKY, AND REVERSIBLE, AND NEITHER IS ERASURE. A discard that did not
     * persist would re-surface the same sender every day and teach the client to
     * ignore the queue; a discard that could not be undone would make a
     * mis-click permanent. The messages are untouched by both.
     *
     * LATER MAIL IS STILL RECORDED AND STILL FORWARDED. A triage decision may
     * not break the business's mail — that promise is what the whole inbound
     * path is built on, and a suppression is a preference about a QUEUE.
     */
    if (
      (p === PERSON_INBOUND_DISCARD_PATH || p === PERSON_INBOUND_RESTORE_PATH) &&
      method === 'POST'
    ) {
      const scope = requireScope()
      if (!ownsBusiness(deps.admission, scope.businessId)) {
        return json(403, { error: 'Only an owner of this business may triage its mail.' })
      }
      const body = await readJsonBody(request)
      const address = typeof body.address === 'string' ? body.address : ''
      if (p === PERSON_INBOUND_DISCARD_PATH) await discardSender(identityEnv, scope, address)
      else await restoreSender(identityEnv, scope, address)
      return json(200, { address })
    }

    /**
     * GET /api/people/changes — the Contacts pane, live ([[REQ-233]]).
     *
     * WHY A SUBSCRIPTION AND NOT A POLL, AND NOT A REFRESH. The writes this pane
     * most needs to see are not made by this pane: a `contact-form` submission on
     * the published site captures a lead through `captureLead`, and an operator
     * sitting on the tab saw nothing at all until they reloaded — so the surface
     * they use to CHECK that a form works reported a working capture path as a
     * broken one. A second operator, a second tab, and an invite sent from
     * anywhere else are the same shape.
     *
     * SCOPED BY THE SAME `requireScope()` THE LIST READ USES, and the read
     * underneath it carries `WHERE tenant_id = ?` exactly as `peopleOf` does. A
     * subscription is a read ([[DOC-8]] §6.6), and there is no cross-business
     * form of this URL to construct.
     *
     * THE CURSOR IS THE CLIENT'S. `Last-Event-ID` — which a browser's
     * `EventSource` re-presents automatically on reconnect — wins over `?since`,
     * which seeds only the first connection. Neither present means "from now",
     * which is the right answer for a subscriber that has read nothing.
     */
    if (p === PERSON_CHANGES_PATH && method === 'GET') {
      const resumed = request.headers.get('last-event-id')
      const since = resumed ?? url.searchParams.get('since')
      return streamContactChanges(
        identityEnv,
        requireScope(),
        since,
        deps.contactChangePollMs ?? CONTACT_CHANGE_POLL_MS,
      )
    }

    /**
     * POST /api/people/status — may this person sign in at all ([[DOC-42]] §5).
     *
     * `users.status` IS THE LOGIN CONTROL AND `memberships` IS NOT. `admit`
     * checks the status before it looks at any business and refuses
     * `user_inactive`, so this is the field that stops a sign-in. Revoking a
     * membership withdraws the right to RUN a business and deliberately leaves
     * that person's own Portal reachable — a different act, and the distinction
     * this route exists to keep.
     */
    if (p === PERSON_STATUS_PATH && method === 'POST') {
      const body = await readJsonBody(request)
      const id = typeof body.id === 'string' ? body.id : ''
      const status = typeof body.status === 'string' ? body.status.trim() : ''
      if (status === '') return json(400, { error: 'A status is required.' })
      return json(200, await setPersonStatus(identityEnv, requireScope(), id, status))
    }

    /**
     * POST /api/people/record — correct who somebody is ([[BUG-54]]).
     *
     * THE FIELDS THE OPERATOR OWNS, and no others. The address and every part
     * of the name are their own answer to a question only they can answer — a
     * typo in an invited address, a person who has since said what to call them,
     * a customer who is a Dr — and there was no way to correct any of it.
     * Everything else on the row is what the system OBSERVED, and
     * `setPersonRecord` will not write it.
     *
     * `'email' in body` AND NOT `body.email` — the patch distinction. An absent
     * key means leave it alone and a present one means write it, which is what
     * lets the panel commit one field without sending back a stale copy of the
     * other. Read as a truthiness test, clearing a name would be
     * indistinguishable from not mentioning it.
     *
     * GATED ON `ownsBusiness`, THE SAME FIRST CONDITION AS THE INVITE
     * ([[DOC-42]] §7) and emphatically not `ownsPlatformBusiness`. Correcting
     * the record of your own business's people is uniform — Alice does it on
     * hers — so gating it on being 1st Contact would be §7's falsifier and
     * would foreclose level 2 exactly as it would for the invite.
     *
     * 403 AND NOT THE 404 THE FULFILMENT ROUTE ANSWERS, for the invite route's
     * reason: this surface is not administrative, every business owner has it,
     * so its existence is not a secret and the refusal is an answer about the
     * caller.
     */
    if (p === PERSON_RECORD_PATH && method === 'POST') {
      const scope = requireScope()
      if (!ownsBusiness(deps.admission, scope.businessId)) {
        console.warn(
          JSON.stringify({
            event: 'person_record_refused',
            businessId: scope.businessId,
            email: deps.admission?.ok ? deps.admission.user.email : null,
          }),
        )
        return json(403, { error: 'Only an owner of this business may edit its people.' })
      }
      const body = await readJsonBody(request)
      const patch: PersonPatch = {}
      if ('email' in body) patch.email = typeof body.email === 'string' ? body.email : ''
      /**
       * THE NAME PARTS ARRIVE FLAT AND ARE GATHERED HERE ([[REQ-193]]).
       *
       * The record pane commits one field at a time, so the body it posts is
       * `{id, knownAs}` — the same flat patch shape the address already uses.
       * The model underneath is a name RECORD, so the route collects whichever
       * parts arrived into one; sending them nested would make the client know
       * that a name is a row, which is exactly the thing it should not have to.
       *
       * `nameReason` ONLY TRAVELS WITH PARTS. On its own it would be a request
       * to record a supersession that changes nothing, which `writeName` would
       * correctly decline — so it is read only when there is a name to write.
       */
      const name: NamePatch = {}
      for (const part of NAME_PART_NAMES) {
        if (part in body) {
          name[part as keyof NamePatch] = typeof body[part] === 'string' ? body[part] : null
        }
      }
      if (Object.keys(name).length > 0) {
        patch.name = name
        patch.nameReason = typeof body.nameReason === 'string' ? body.nameReason : null
      }
      const id = typeof body.id === 'string' ? body.id : ''
      return json(200, await setPersonRecord(identityEnv, scope, id, patch))
    }

    /**
     * POST /api/people/add — the fundamental act ([[REQ-199]]).
     *
     * IT ADDS A CONTACT AND DOES NOTHING ELSE. The new row is a **Lead**
     * ([[DOC-44]] §4), no mail is sent and `invited_at` is not stamped, because
     * most contacts are never invited at all and the surface that records one
     * must not also ask them to sign up.
     *
     * THE SAME GATE AS THE INVITE, AND FOR THE SAME REASON. `ownsBusiness` is
     * [[DOC-42]] §7's first condition alone — *you own this business* — which is
     * uniform and true of Alice on hers. Reusing the fulfilment gate here would
     * mean only 1st Contact may write down a contact, which forecloses level 2
     * exactly as it would for the invite.
     */
    if (p === PERSON_ADD_PATH && method === 'POST') {
      const scope = requireScope()
      if (!ownsBusiness(deps.admission, scope.businessId)) {
        return json(403, { error: 'Only an owner of this business may add contacts to it.' })
      }
      const body = await readJsonBody(request)
      return json(
        200,
        await addContact(identityEnv, scope, {
          email: typeof body.email === 'string' ? body.email : '',
          displayName: typeof body.displayName === 'string' ? body.displayName : null,
        }),
      )
    }

    /**
     * GET /api/people/invite — what the modal opens with ([[REQ-199]]).
     *
     * IT ANSWERS *WHAT WOULD THIS SEND*, not *what did we send*. From, Subject
     * and Body, the last two prefilled from this business's `invite` template
     * ([[REQ-197]]) and editable in the modal FOR THIS SEND ONLY. The template
     * ticket is untouched by anything on this path — editing one is a different
     * act with a different surface, and a modal that quietly rewrote it would
     * let a one-off change to one invite alter what every later invite says.
     *
     * IT SEEDS THE TEMPLATE IF THE BUSINESS HAS NEVER HAD ONE, because
     * `templateFor` does. That is a write on a GET, and it is the same
     * seed-if-absent `ticketStoreFor` makes for tenant registration: a business
     * asked for its invite copy for the first time is given the default rather
     * than an empty box, and the very next act on it is ordinary authoring.
     *
     * THE GATE IS THE INVITE'S, because this is the invite's first half. What it
     * discloses is the copy this business would send, which is not a secret from
     * its own owner and is nobody else's business at all.
     */
    if (p === PERSON_INVITE_PATH && method === 'GET') {
      const scope = requireScope()
      if (!ownsBusiness(deps.admission, scope.businessId)) {
        return json(403, { error: 'Only an owner of this business may invite people to it.' })
      }
      return json(200, await inviteDraft(await openTickets(), mailFrom(env)))
    }

    /**
     * POST /api/people/invite — invite the checked contacts ([[REQ-186]],
     * [[REQ-199]], [[DOC-42]] §9).
     *
     * IT TAKES IDS AND NOT AN ADDRESS. The tab checks rows and presses Invite,
     * so every contact named here already exists; creating one is
     * `/api/people/add`, which is a different act on a different path
     * ([[REQ-199]]).
     *
     * ONE CONTROL FOR BOTH LEVELS, and there is no branch here on which one it
     * is. The invite writes into whichever business `requireScope` resolved, so
     * called from 1st Contact it moves Alice and called from Alice's business it
     * moves Bob — same route, same rows, differing only in `users.tenant_id`.
     * A level is a position and not a property ([[DOC-42]] §3), so a route that
     * asked which level it was standing at would be that section's falsifier.
     *
     * THE GATE IS `ownsBusiness` AND EMPHATICALLY NOT `ownsPlatformBusiness`.
     * This is [[DOC-42]] §7's FIRST condition alone — *you are an owner of this
     * business* — which is uniform and true of Alice on hers. Reusing the
     * fulfilment gate is the one mistake this route is most likely to attract,
     * because the two sit adjacent in this table and select the same set today;
     * it would mean only 1st Contact may invite anybody, which forecloses level 2
     * entirely and is exactly §7's "generic admin extension" falsifier standing
     * in for a capability every business owner needs.
     *
     * 403 AND NOT THE 404 THE FULFILMENT ROUTE ANSWERS. That one hides because
     * an unprivileged caller asking whether an administrative surface exists is
     * owed nothing; this surface is not administrative — every business owner
     * has it — so its existence is not a secret and the refusal is an answer
     * about the caller, which is the status the rest of this system gives one.
     *
     * AND IT REFUSES WITH NO ADMISSION AT ALL, which is the dev-open loopback
     * path. There is nobody there to own anything, and a door onto mailing
     * people that opens only when authentication is switched off is a shape that
     * reads as a feature and would eventually be relied upon — the same argument
     * `/api/admin/businesses` makes for itself. It is a stronger argument here
     * than it was for the transition alone: this route now sends real mail to
     * real strangers.
     *
     * THE `From` IN THE BODY IS IGNORED IF ONE IS SENT. An arbitrary sender
     * fails DKIM and lands in spam — so the modal shows the address and does not
     * offer it, and the route does not read it either. A field a client could
     * set and the server ignores is a field that eventually gets believed; not
     * reading it is what makes the display-only claim true rather than a
     * convention of one client.
     *
     * WHICH ADDRESS IT IS, THOUGH, IS THE INVITE TEMPLATE'S ([[REQ-205]]). It
     * was `MAIL_FROM` for every message this deployment sends; the invite now
     * carries its own, and the draft resolves it — so the address travels with
     * the operator's edited copy the same way the declaration does, and the
     * modal displays exactly what the send will use.
     *
     * `{{cta_url}}` IS A REDEEMABLE INVITE LINK, ONE PER CONTACT ([[REQ-202]]).
     * It used to be this origin's bare front door, which was not a design choice
     * — there was no token to build a link from — and it meant the invitee met
     * Cloudflare Access and its own one-time-PIN email instead of the invitation
     * they had just been sent. The token is minted in THIS business, because the
     * contact is in this business: an operator of Alice's Plumbing invites Alice's
     * contacts, and `resolveSubject` has no answer without a tenant.
     *
     * THE ORIGIN IS STILL THE REQUEST'S, for the reason it always was: a
     * configured constant would be a second answer to "where is this deployment",
     * and a `wrangler dev` session would get it wrong — which shows up as an
     * invite whose only link goes to production.
     */
    if (p === PERSON_INVITE_PATH && method === 'POST') {
      const scope = requireScope()
      if (!ownsBusiness(deps.admission, scope.businessId)) {
        console.warn(
          JSON.stringify({
            event: 'invite_refused',
            businessId: scope.businessId,
            email: deps.admission?.ok ? deps.admission.user.email : null,
          }),
        )
        return json(403, { error: 'Only an owner of this business may invite people to it.' })
      }
      const body = await readJsonBody(request)
      const ids = Array.isArray(body.ids)
        ? body.ids.filter((id): id is string => typeof id === 'string' && id !== '')
        : []
      // AN EMPTY SELECTION IS THE CALLER'S MISTAKE AND NOT A NO-OP SUCCESS. The
      // button is disabled with nothing checked, so a POST with no ids is a
      // client that got out of step — and answering 200 with an empty list would
      // report a send that never happened.
      if (ids.length === 0) {
        return json(400, { error: 'Nobody was selected, so there is nobody to invite.' })
      }
      const store = await openTickets()
      const from = mailFrom(env)
      // THE COPY IS TAKEN ONLY WHEN BOTH HALVES ARRIVE. A body with a subject and
      // no text — or the reverse — is a client that sent half a form, and
      // filling the gap from the template would send a message that is neither
      // what the operator typed nor what the template says.
      const subject = typeof body.subject === 'string' ? body.subject : null
      const text = typeof body.body === 'string' ? body.body : null
      const draft = await inviteDraft(store, from)
      const results: InviteResult[] = await invitePeople(
        {
          env: identityEnv,
          scope,
          store,
          send: deps.sendEmail ?? mailerFor(env, { fetch: deps.fetch }),
          from,
          inviteUrl: inviteUrlIssuer(
            identityEnv as SessionEnv,
            scope.businessId,
            new URL(request.url).origin,
          ),
          copy:
            subject !== null && text !== null
              ? {
                  subject,
                  body: text,
                  // THE ADDRESS COMES FROM THE DRAFT AND NEVER FROM THE POST
                  // ([[REQ-205]]). It is the invite template's own, already
                  // resolved against `MAIL_FROM`; taking it from the body would
                  // be the editable sender this route refuses to offer.
                  from: draft.from,
                  // THE DECLARATION TRAVELS WITH THE EDIT AND IS NEVER TAKEN FROM
                  // IT ([[REQ-197]]). It is the template's promise about what its
                  // copy must carry, so an operator who deletes `{{cta_url}}` out
                  // of the body is refused rather than mailing a dead button.
                  declared: draft.declared,
                  templateKey: draft.templateKey,
                  templateUid: draft.templateUid,
                }
              : undefined,
        },
        ids,
      )
      return json(200, { results })
    }

    /**
     * POST /api/grants — open a dated grant ([[REQ-170]], [[DOC-40]] §5).
     *
     * IT NAMES THE BUSINESS, ALWAYS. "This user's plan" is unrepresentable: an
     * account running three businesses holds up to three grants, and an editor
     * that omitted the object would silently change whichever one it found first.
     * The subject is separate and optional — null opens a per-business capacity
     * grant, which is what every row written so far is ([[REQ-184]]).
     */
    if (p === GRANTS_PATH && method === 'POST') {
      const body = await readJsonBody(request)
      return json(
        200,
        await openGrant(identityEnv, {
          businessId: typeof body.businessId === 'string' ? body.businessId : '',
          accountId: typeof body.accountId === 'string' ? body.accountId : null,
          plan: typeof body.plan === 'string' ? body.plan : '',
          startsAt: typeof body.startsAt === 'string' ? body.startsAt : undefined,
          endsAt: typeof body.endsAt === 'string' ? body.endsAt : null,
          note: typeof body.note === 'string' ? body.note : null,
          grantedBy: deps.admission?.ok ? deps.admission.user.email : null,
        }),
      )
    }

    /**
     * POST /api/grants/revoke — withdraw one, keeping the row ([[REQ-170]]).
     *
     * REVOCATION IS NOT DELETION. The history of what access was given is the
     * thing being kept, and a deleted row takes with it the answer to "what were
     * they promised, and when did we stop honouring it" — which is what anyone
     * asking about a refusal is actually asking.
     */
    if (p === GRANT_REVOKE_PATH && method === 'POST') {
      const body = await readJsonBody(request)
      await revokeGrant(identityEnv, typeof body.id === 'string' ? body.id : '')
      return json(200, { ok: true })
    }

    /**
     * POST /api/business/name — the customer corrects what their business is
     * called ([[REQ-237]]).
     *
     * A TEXT FIELD AND NOT A DIALOGUE. Correcting a typo in your own business
     * name is the kind of thing that is simply easier done directly, and a
     * product that insists on a conversation for it has added the friction it
     * exists to remove. The assistant reaches the same operation through the
     * `settings` surface; both are callers of one rule.
     *
     * OWNERS ONLY, the same gate `/api/people/record` carries and for the same
     * reason: this is the business's own identity to the product, and a `support`
     * membership exists to help operate a business rather than to re-label it.
     *
     * IT REPORTS EFFECTS AND CHANGES NOTHING ELSE. The site still says what it
     * said; the response is what lets the pane show that as something to look at
     * rather than silently diverge.
     *
     * THE TWO REFUSALS ARE DISTINGUISHED. A name already held by another of this
     * account's businesses is a 409 naming it — the only moment that sentence is
     * useful — and an empty name is a 400. Collapsing them into one status would
     * leave the pane unable to say which happened.
     */
    if (p === BUSINESS_NAME_PATH && method === 'POST') {
      const scope = requireScope()
      if (!ownsBusiness(deps.admission, scope.businessId)) {
        console.warn(
          JSON.stringify({
            event: 'business_name_refused',
            businessId: scope.businessId,
            email: deps.admission?.ok ? deps.admission.user.email : null,
          }),
        )
        return json(403, { error: 'Only an owner of this business may change its name.' })
      }
      const body = await readJsonBody(request)
      try {
        return json(
          200,
          await renameBusiness(
            identityEnv,
            scope.businessId,
            typeof body.name === 'string' ? body.name : '',
          ),
        )
      } catch (error) {
        // SCRUBBED LIKE EVERY OTHER MESSAGE THAT LEAVES THIS WORKER
        // ([[REQ-146]] AC4). Nothing in either of these is built from an
        // upstream diagnostic, so there is nothing here to redact today — and a
        // path that scrubs beside a path that does not is an invitation to add a
        // third that does not. The cost when there is nothing to scrub is nil.
        if (error instanceof BusinessNameTakenError) {
          return json(409, { error: scrub(error.message), takenBy: error.takenBy })
        }
        if (error instanceof InvalidBusinessNameError) {
          return json(400, { error: scrub(error.message) })
        }
        throw error
      }
    }

    /**
     * GET /api/hostname — what public address this business has, if any
     * ([[REQ-238]]).
     *
     * IT ANSWERS A LIST AND THE APEX. The list because the question every caller
     * actually has is *can this be published* — which is about addresses, plural
     * and kind-agnostic, not about the `1stc.site` one. The apex because a
     * surface that is about to ask somebody to choose a permanent name has to
     * show them the WHOLE host as it will be, and composing `alice` with
     * `1stc.site` in the browser would be a second place that string is written.
     *
     * NOT OWNERS-ONLY, unlike the claim below. A published site's address is
     * public by construction, and anybody who may operate this business may
     * certainly know where it is.
     */
    if (p === HOSTNAME_PATH && method === 'GET') {
      const scope = requireScope()
      return json(200, {
        apex: PLATFORM_APEX,
        addresses: await businessAddresses(identityEnv, scope.businessId),
      })
    }

    /**
     * GET /api/hostname/check — is this one available ([[REQ-238]])?
     *
     * NO SIDE EFFECT, AND IT RESERVES NOTHING. Two customers can check `alice`
     * in the same second and both be told yes; the unique index on `host`
     * decides between them and the loser is refused at the claim. A check that
     * held anything would be a hold on a finite public namespace, with no
     * expiry, obtainable by typing.
     *
     * EXPOSING IT IS NOT AN INFORMATION LEAK ([[DOC-45]] §5). An existence
     * oracle matters when the value is one a business would not otherwise
     * disclose, and a public address exists in order to be publicly resolvable —
     * DNS gives this away for free to anyone who asks.
     *
     * IT ALWAYS ANSWERS 200, INCLUDING FOR A NAME IT REFUSES. "Taken" is the
     * answer to the question rather than a failure to answer it, and a 409 here
     * would make the field on the pane treat a perfectly ordinary outcome as an
     * error.
     */
    if (p === HOSTNAME_CHECK_PATH && method === 'GET') {
      requireScope()
      return json(200, await checkHostname(identityEnv, url.searchParams.get('label') ?? ''))
    }

    /**
     * POST /api/hostname/claim — take it ([[REQ-238]]). Final.
     *
     * OWNERS ONLY, the same gate `/api/business/name` carries and for a stronger
     * version of the same reason: a `support` membership exists to help operate
     * a business, and this is the one decision on the tab that cannot be undone
     * by the person it is done to.
     *
     * IT DOES NOT TRUST THE CHECK THE CALLER JUST MADE. `claimHostname` inserts
     * and lets the unique index decide; this route only translates what it
     * decided. Re-checking here would be the same race with an extra round trip
     * and a more confident-looking answer.
     *
     * THE REFUSALS ARE DISTINGUISHED BY STATUS because the pane and the
     * assistant do different things with each. 409 means *somebody has it* —
     * either the world (`taken`) or this business already (`held`), and the body
     * says which, because "you already have one" is useless without naming it.
     * 400 means *that is not a hostname we can issue*, which is answered by
     * typing a different one.
     */
    if (p === HOSTNAME_CLAIM_PATH && method === 'POST') {
      const scope = requireScope()
      if (!ownsBusiness(deps.admission, scope.businessId)) {
        console.warn(
          JSON.stringify({
            event: 'hostname_claim_refused',
            businessId: scope.businessId,
            email: deps.admission?.ok ? deps.admission.user.email : null,
          }),
        )
        return json(403, { error: 'Only an owner of this business may choose its address.' })
      }
      const body = await readJsonBody(request)
      try {
        return json(
          200,
          await claimHostname(
            identityEnv,
            scope.businessId,
            typeof body.label === 'string' ? body.label : '',
          ),
        )
      } catch (error) {
        // SCRUBBED LIKE EVERY OTHER MESSAGE THAT LEAVES THIS WORKER
        // ([[REQ-146]] AC4), on `/api/business/name`'s reasoning: there is
        // nothing upstream in any of these sentences to redact today, and a
        // path that scrubs beside one that does not is an invitation to add a
        // third that does not.
        if (error instanceof HostnameTakenError) {
          return json(409, { error: scrub(error.message), host: error.host, taken: true })
        }
        if (error instanceof HostnameAlreadyHeldError) {
          return json(409, { error: scrub(error.message), held: error.held })
        }
        if (error instanceof ReservedHostnameError || error instanceof InvalidHostnameError) {
          return json(400, { error: scrub(error.message) })
        }
        if (error instanceof NoSiteError) {
          return json(409, { error: scrub(error.message) })
        }
        throw error
      }
    }

    /**
     * `/api/domain` — the customer's own domain ([[REQ-259]]).
     *
     * THREE CONTROLS AND NO RECORDS. `GET` draws the section — the pool, what is
     * attached, where mail got to, and whether this caller may change any of it.
     * `POST` attaches. `DELETE` releases. Nothing in any of the three answers
     * names a record type, a record value or a Cloudflare zone id, which is this
     * ticket's first falsifier.
     *
     * `GET` IS NOT GATED ON BEING THE ACCOUNT HOLDER; it REPORTS whether the
     * caller is one. A member who may not attach still needs to be told what
     * their site's address is and who to ask, and a 403 would tell them neither.
     *
     * `DELETE` IS IDEMPOTENT, on `/api/hostname/revoke`'s reasoning, and it
     * exists at all because **finality is a `platform` rule and is not
     * inherited**: a customer's own domain may be moved between sites, taken off
     * a site, and taken away entirely, because it is theirs.
     */
    if (p === DOMAIN_PATH && (method === 'GET' || method === 'POST' || method === 'DELETE')) {
      const scope = requireScope()
      const resend: ResendClient | null = deps.resend ? deps.resend(env) : resendFor(env)

      if (method === 'GET') {
        return json(200, await domainState(identityEnv, deps.admission, scope.businessId, resend))
      }

      // THE WRITES ARE THE ACCOUNT HOLDER'S ALONE. Otherwise a member of one
      // business can spend a domain belonging to a sibling business.
      if (!(await isAccountHolder(identityEnv, deps.admission, scope.businessId))) {
        console.warn(
          JSON.stringify({
            event: 'domain_write_refused',
            businessId: scope.businessId,
            email: deps.admission?.ok ? deps.admission.user.email : null,
          }),
        )
        return json(403, { error: scrub(new NotTheAccountHolderError().message) })
      }

      // A DEPLOYMENT THAT CANNOT REACH CLOUDFLARE CANNOT ATTACH OR RELEASE, and
      // writing the row anyway would be [[REQ-258]]'s first falsifier — a
      // hostname that resolves nowhere — rather than a refusal.
      const client: CloudflareClient | null = deps.cloudflare
        ? deps.cloudflare(env)
        : cloudflareFor(env)
      if (client === null) {
        return json(503, { error: scrub(new CloudflareNotConfiguredError().message) })
      }
      const resolver = deps.resolver ? deps.resolver(env) : dnsResolver()

      try {
        if (method === 'DELETE') {
          return json(200, await releaseDomain(identityEnv, client, resend, scope.businessId))
        }
        const body = await readJsonBody(request)
        const attached = await attachDomain(identityEnv, client, resolver, resend, {
          businessId: scope.businessId,
          domain: typeof body.domain === 'string' ? body.domain : '',
          // ON BY DEFAULT. The toggle's default is the ticket's, and the shape
          // here is what makes it one: only an explicit `false` turns it off, so
          // a caller that forgot the field gets the default rather than the
          // opposite of it.
          email: body.email !== false,
        })
        return json(200, attached)
      } catch (err) {
        // EACH REFUSAL KEEPS ITS OWN STATUS, on `/api/admin/domains`'s reasoning.
        // A domain this account does not hold is a 404; a host already pointed at
        // another site is a 409 and is a decision somebody already made; a zone
        // that is not ready is a wait; an API refusal is somebody else's problem.
        if (err instanceof UnknownDomainError) return json(404, { error: scrub(err.message) })
        if (err instanceof NoZoneForHostError) return json(404, { error: scrub(err.message) })
        if (err instanceof ZoneNotReadyError) return json(409, { error: scrub(err.message) })
        if (err instanceof HostnameTakenError) return json(409, { error: scrub(err.message) })
        if (err instanceof SendingNotConfiguredError) return json(409, { error: scrub(err.message) })
        if (err instanceof InvalidHostnameError) return json(400, { error: scrub(err.message) })
        if (err instanceof CloudflareApiError) return json(502, { error: scrub(err.message) })
        // A REFUSED CREDENTIAL IS NOT A FAILED REQUEST ([[REQ-264]]), and it is
        // tested before the general case because it IS one — the subclass would
        // otherwise be caught below and answer with 502 and a sentence about an
        // API key to somebody who has none.
        if (err instanceof ResendNotPermittedError) return notPermitted(err, scrub)
        // RESEND'S OWN WORDS COME BACK THROUGH THE SCRUBBER, for the reason
        // Cloudflare's do: the message is composed below us by a client that was
        // handed a bearer token ([[REQ-146]] AC4).
        if (err instanceof ResendApiError) return json(502, { error: scrub(err.message) })
        throw err
      }
    }

    /**
     * GET /api/domain/changes — what we have changed, newest first ([[REQ-260]]).
     *
     * SENTENCES AND NOT RECORDS. Every entry is the sentence the client was shown
     * when the change was made, stored with it — never a record type, never a
     * value, never a zone. *"If a customer is being shown a record type, we have
     * failed"* is [[REQ-259]]'s rule and this route is where it would be easiest
     * to break, because the underlying rows hold exactly those things.
     */
    if (p === DNS_CHANGES_PATH && method === 'GET') {
      const scope = requireScope()
      const changes = await changesFor(identityEnv, scope.businessId)
      return json(200, {
        changes: changes.map((change) => ({
          ...changeView(change),
          at: change.createdAt,
          // WHETHER THE BUTTON IS DRAWN AT ALL. An undo that has itself been
          // undone, and an entry that IS an undo, both carry nothing to press —
          // and a disabled button with no explanation is how a client learns the
          // surface is unreliable.
          undoable: change.undoneAt === null && change.operation !== 'undo',
        })),
        mayUndo: await isAccountHolder(identityEnv, deps.admission, scope.businessId),
      })
    }

    /**
     * POST /api/domain/changes/undo — put one back, or say why not ([[REQ-260]]).
     *
     * THE REFUSAL IS THE FEATURE. It compares the zone against what the change
     * left before it writes anything, and a single drifted record refuses the
     * whole undo — because a partial revert is worse than none, and because the
     * thing that moved may be somebody else's work or an email provider rotating
     * a key with nobody here doing anything at all. A 409 carrying a sentence is
     * the answer; the surface reads it out.
     */
    if (p === DNS_UNDO_PATH && method === 'POST') {
      const scope = requireScope()
      if (!(await isAccountHolder(identityEnv, deps.admission, scope.businessId))) {
        console.warn(
          JSON.stringify({
            event: 'dns_undo_refused',
            businessId: scope.businessId,
            email: deps.admission?.ok ? deps.admission.user.email : null,
          }),
        )
        return json(403, { error: scrub(new NotTheAccountHolderError().message) })
      }
      const client: CloudflareClient | null = deps.cloudflare
        ? deps.cloudflare(env)
        : cloudflareFor(env)
      if (client === null) {
        return json(503, { error: scrub(new CloudflareNotConfiguredError().message) })
      }
      const body = await readJsonBody(request)
      try {
        const undone = await undoDnsChange(
          identityEnv,
          client,
          scope.businessId,
          typeof body.change === 'string' ? body.change : '',
        )
        return json(200, { ...changeView(undone), at: undone.createdAt, undoable: false })
      } catch (err) {
        if (err instanceof UnknownDnsChangeError) return json(404, { error: scrub(err.message) })
        if (err instanceof DnsAlreadyUndoneError) return json(409, { error: scrub(err.message) })
        // A 409 AND NOT A 500. Drift is the expected outcome of an undo pressed
        // late, not a failure of the request — and the body is a sentence the
        // surface shows verbatim.
        if (err instanceof DnsDriftError) {
          return json(409, { error: scrub(err.message), drifted: err.what })
        }
        if (err instanceof CloudflareApiError) return json(502, { error: scrub(err.message) })
        throw err
      }
    }

    /**
     * POST /api/domain/email — send from this domain, or stop ([[REQ-259]]).
     *
     * ITS OWN PATH BECAUSE IT IS SEPARATELY REVERSIBLE. A customer who turned
     * sending on and then found the new `From` address confusing must be able to
     * put it back without giving up the website address they have just told
     * their customers about — and one path taking an `email` flag beside an
     * `attach` would make those two acts one request.
     *
     * THE ACCOUNT HOLDER'S, like the writes above: it writes DNS into a zone the
     * account owns.
     */
    if (p === DOMAIN_EMAIL_PATH && method === 'POST') {
      const scope = requireScope()
      if (!(await isAccountHolder(identityEnv, deps.admission, scope.businessId))) {
        console.warn(
          JSON.stringify({
            event: 'domain_email_refused',
            businessId: scope.businessId,
            email: deps.admission?.ok ? deps.admission.user.email : null,
          }),
        )
        return json(403, { error: scrub(new NotTheAccountHolderError().message) })
      }
      const client: CloudflareClient | null = deps.cloudflare
        ? deps.cloudflare(env)
        : cloudflareFor(env)
      if (client === null) {
        return json(503, { error: scrub(new CloudflareNotConfiguredError().message) })
      }
      const body = await readJsonBody(request)
      try {
        const email = await setDomainEmail(
          identityEnv,
          client,
          deps.resend ? deps.resend(env) : resendFor(env),
          deps.resolver ? deps.resolver(env) : dnsResolver(),
          { businessId: scope.businessId, enabled: body.enabled !== false },
        )
        return json(200, { email })
      } catch (err) {
        if (err instanceof UnknownDomainError) return json(404, { error: scrub(err.message) })
        if (err instanceof SendingNotConfiguredError) return json(409, { error: scrub(err.message) })
        if (err instanceof CloudflareApiError) return json(502, { error: scrub(err.message) })
        if (err instanceof ResendNotPermittedError) return notPermitted(err, scrub)
        if (err instanceof ResendApiError) return json(502, { error: scrub(err.message) })
        throw err
      }
    }

    /**
     * POST /api/hostname/revoke — take one back ([[REQ-238]], [[TODO-6]] §2).
     *
     * THE SAFETY VALVE FINALITY CREATES THE NEED FOR. An owner cannot change
     * their own hostname, so a hostname that has to go can only go by our hand —
     * *"whatever the list says, something will get through it, and the only
     * alternative to revocation is leaving it up."*
     *
     * `ownsPlatformBusiness` AND NOT A NEW PRIVILEGE, and that choice is the
     * point of the route being one line of gate. It is the same predicate
     * `/api/businesses/provision` carries and asks the same two questions —
     * *you are an owner of this business*, and *this business's product is
     * businesses* ([[DOC-42]] §7). `isPlatformAdminSeed` was the other
     * candidate and is deliberately not used: it answers whether the DEPLOYMENT
     * NAMES an address, which is break-glass configuration and a diagnostic,
     * never an authorisation.
     *
     * IT TAKES A HOST AND NOT A BUSINESS, because the operator acting on it is
     * looking at a hostname — in a report, in a complaint, in a browser — and
     * making them resolve it to a business first would be asking them to do the
     * lookup this route is about.
     *
     * IT IS NOT AN UPDATE PATH ON `host`. The row keeps the value it was created
     * with forever; what changes is whether it is live, which is also what makes
     * a revoked hostname permanently unissuable to anybody else.
     */
    if (p === HOSTNAME_REVOKE_PATH && method === 'POST') {
      if (!ownsPlatformBusiness(identityEnv, deps.admission)) {
        console.warn(
          JSON.stringify({
            event: 'hostname_revoke_refused',
            email: deps.admission?.ok ? deps.admission.user.email : null,
          }),
        )
        return json(403, { error: 'Only 1st Contact may withdraw a hostname.' })
      }
      const body = await readJsonBody(request)
      const revoked = await revokeHostname(
        identityEnv,
        typeof body.host === 'string' ? body.host : '',
      )
      // NULL IS A 200 AND NOT A 404. Revoking something already revoked is not
      // an error, and an operator repeating a command under pressure should get
      // the same answer twice rather than a failure that reads as "it is still
      // up".
      return json(200, { revoked })
    }

    if (p === '/api/sites' && method === 'GET') {
      // `latest` is the live revision — the highest id in the log, derived and
      // never stored (REQ-149). It read `null` for every site while the store
      // held no revisions; saying so was better than implying one, and now there
      // is something true to say.
      const store = await openStore()
      // KIND `site` ([[REQ-236]]). This is the builder's site list, and a portal
      // authored at `/account` is not a site the builder may open — it was
      // listed here only because the store had one enumeration and it returned
      // every row. Naming the kind is what stops the builder offering to edit a
      // page it does not own the shape of.
      const sites = await store.siteKeys('site')
      return json(
        200,
        await Promise.all(
          sites.map(async (site) => ({
            site,
            latest: liveRevisionOf(await store.revisions(site)),
          })),
        ),
      )
    }

    /**
     * POST /api/publish — freeze the draft as a revision and render it (REQ-149).
     *
     * A TRANSPORT, exactly like every other route here. `publishSite` is the one
     * implementation and `1c publish` calls the same function against the
     * filesystem store; nothing about what a publish IS is decided in this file.
     *
     * THE ONE NON-500 FAILURE IS NAMED, AND IT IS MAPPED IN THE CATCH AT THE
     * BOTTOM rather than here: an invalid draft is an `InvalidDefinitionError`
     * carrying the path-pointed validation errors the toolbar shows. Catching it
     * locally would mean building an `error:` value outside the one place that
     * scrubs them (REQ-146 AC4), and the next such route would inherit the
     * omission.
     *
     * THE SECOND ONE CAME BACK, AND IT IS NOT THE OLD ONE ([[REQ-238]]). A
     * publish used to be refusable with 409 because another business already
     * held the SLUG — `/site/<slug>/` was the public grammar, so a name somebody
     * chose had to be unique across the deployment, and being refused told them
     * it was taken ([[REQ-190]], [[REQ-236]] removed both the grammar and the
     * slug). The 409 here is the opposite shape: nobody has taken anything, and
     * what is missing is an address this business has not chosen yet. It is
     * mapped in the same catch at the bottom, for the same reason.
     */
    if (p === '/api/publish' && method === 'POST') {
      const body = await readJsonBody(request)
      if (typeof body.site !== 'string' || body.site === '') {
        return json(400, { error: 'site is required' })
      }
      const site = body.site
      const store = await openStore()
      // [[REQ-222]] — the delivery ladder, built here in the Worker and nowhere
      // else. `publishSite` sequences it like every other step; what this line
      // decides is only whether this DEPLOYMENT can build one.
      const scope = requireScope()
      const ladder = (deps.ladder ?? ladderFor)(env, scope) ?? undefined
      const message = typeof body.message === 'string' ? body.message : undefined

      /*
       * [[REQ-238]] — WHERE THIS SITE CAN BE REACHED, read here in the Worker
       * for the reason the ladder and the template check are: `publishSite`
       * sequences the refusal, and what this line decides is only whether this
       * DEPLOYMENT can answer. It can, because a publish is authenticated and
       * scoped and the addresses are rows in this deployment's own database;
       * `1c publish` against a directory on somebody's disk has none and
       * supplies none, so the gate does not run there.
       *
       * IT PASSES THE LIST AND NOT A BOOLEAN, and that is this ticket's own
       * falsifier made structural: the question `publishSite` asks is *does this
       * site have at least one address*, over a list that has two kinds and one
       * implementation today. A route that reduced it to "has a hostname" here
       * would put the wrong check back, one layer down.
       */
      const reader = (deps.addresses ?? addressesFor)(env)
      const addresses = reader ? () => reader(site) : undefined

      /**
       * What the client is told when it worked — the same value in both forms.
       *
       * ONE FUNCTION SO THE TWO FORMS CANNOT DISAGREE about what a publish
       * answered. The streaming form's terminal frame carries exactly the JSON
       * form's body, which is what lets the builder treat the two as one call.
       */
      const answer = async (result: Awaited<ReturnType<typeof publishSite>>) => ({
        id: result.id,
        changes: result.changes,
        published: result.published,
        // THE ADDRESS IS THE VALUE THE CALLER ALREADY SENT ([[REQ-236]]). This
        // used to ask the store to turn a slug into the site's key, because
        // `/site/<siteId>/` is the public address and the slug meant nothing
        // outside the business that chose it. The builder addresses the site by
        // its key now, so the translation — and the null the missing-slug case
        // produced — have nothing left to do.
        url: publicSiteUrl(site),
      })

      // [[REQ-222]] — THE STREAMING FORM, ASKED FOR BY `Accept` AND NOTHING ELSE.
      // It is the HTTP-native way to ask for a different representation of the
      // same resource, so every existing caller — `1c`, a UAT, anything that
      // posts and reads JSON — is untouched and continues to get the envelope it
      // always got. A body flag would have been a second vocabulary for something
      // the protocol already has a word for.
      if ((request.headers.get('accept') ?? '').includes('text/event-stream')) {
        return streamPublish(
          (onLadderProgress) =>
            publishSite(store, site, {
              message,
              ladder,
              addresses,
              onLadderProgress,
            }),
          answer,
          scrub,
        )
      }

      return json(
        200,
        await answer(
          await publishSite(store, site, { message, ladder, addresses }),
        ),
      )
    }

    /**
     * POST /api/modules/upgrade — carry this site's stored module instances up
     * to the current behavior contracts ([[BUG-85]]).
     *
     * THE WORKER DOES IT because the store that orphaned an instance was D1,
     * and Node holds no D1 binding. The same reasoning `/api/import` states:
     * the alternatives were hand-escaping site JSON into `wrangler d1 execute`
     * or a third store adapter over the HTTP API, and both end with a second
     * writer that can disagree about what a site is made of. Here the upgrade
     * lands through exactly the store an edit lands through.
     *
     * REPORTING IS THE DEFAULT and `write` is opt-in, matching `1c module
     * upgrade`. Both drivers call the same port-to-port function, so the dry
     * run an operator reads locally is the dry run this route performs.
     */
    if (p === '/api/modules/upgrade' && method === 'POST') {
      const body = await readJsonBody(request)
      if (typeof body.site !== 'string' || body.site === '') {
        return json(400, { error: 'site is required' })
      }
      try {
        return json(
          200,
          await upgradeSiteModules(await openStore(), body.site, {
            ...(body.write === true ? { write: true } : {}),
          }),
        )
      } catch (err) {
        // A missing migration or a migration whose output fails its own
        // contract is a defect in the catalog, not a bad request — 500 with the
        // message, so the operator sees the sentence the framework wrote rather
        // than a status code they have to go and interpret.
        return json(500, { error: scrub(err instanceof Error ? err.message : String(err)) })
      }
    }

    if (p === '/api/revisions' && method === 'GET') {
      const site = url.searchParams.get('site')
      if (!site) return json(400, { error: 'site is required' })
      return json(200, await revisionHistory(await openStore(), site))
    }

    if (p === '/api/assets' && method === 'GET') {
      const site = url.searchParams.get('site')
      if (!site) return json(400, { error: 'site is required' })
      return json(200, (await editAssetList(site, await edit())).data)
    }

    /**
     * GET /api/pages?site= — every page, and whether a reader could get to it
     * ([[REQ-248]]).
     *
     * A THIN TRANSPORT OVER `editPageList`, exactly as `/api/assets` is over
     * `editAssetList` and `/api/palette` is over `editPalette*`. The reachability
     * walk stays in `edit.ts` beside the definition it reads, so the page control
     * and the assistant's own `list_pages` answer from one derivation rather than
     * from two that could disagree about the same site.
     *
     * READ-ONLY, AND THERE IS NO WRITE BESIDE IT. The control reports what the
     * navigation does and does not reach; adding an entry, removing one, or
     * offering to is deliberately not its job.
     */
    if (p === '/api/pages' && method === 'GET') {
      const site = url.searchParams.get('site')
      if (!site) return json(400, { error: 'site is required' })
      return json(200, (await editPageList(site, await edit())).data)
    }

    /**
     * POST /api/pages/subject — what a message arrives as ([[REQ-252]]).
     *
     * A ROUTE OF ITS OWN AND NOT A WRITE ON `/api/pages`. The listing above says
     * so in as many words — it reports what the navigation reaches and adding a
     * page, removing one or offering to is deliberately not its job — and that
     * stance is worth more than the path it is written at. This writes ONE field
     * of ONE page, which is the shape every other narrow write here already has
     * (`/api/material/name`, `/api/business/name`), and naming it in the path is
     * what keeps a reader from having to read the handler to learn its reach.
     *
     * A THIN TRANSPORT OVER `editPageUpdate`, which is the same call the
     * assistant's `update_page` makes. So the placeholder rule, the refusal on a
     * page that is not a message, and the blank-subject fallback are all applied
     * once, in the command, rather than being restated for the chrome — and a
     * subject changed here and a subject changed in the conversation cannot come
     * out differently.
     *
     * A REFUSAL ARRIVES AS ITSELF. `editPageUpdate` throws `CommandError`, which
     * the handler at the foot of this file renders as a 400 carrying the
     * validator's own message and hint — the sentence the strip prints beside
     * the box. Nothing is caught here, because catching it would be the second
     * opinion this route exists not to have.
     */
    if (p === '/api/pages/subject' && method === 'POST') {
      const body = await readJsonBody(request)
      const site = typeof body.site === 'string' ? body.site : ''
      const page = typeof body.page === 'string' ? body.page : ''
      const subject = body.subject
      if (site === '' || page === '' || typeof subject !== 'string') {
        return json(400, { error: 'site, page and subject are required' })
      }
      return json(200, (await editPageUpdate(site, page, { ...(await edit()), subject })).data)
    }

    /**
     * The Library's read surface ([[REQ-161]]) — the list, one item, its bytes.
     *
     * THREE ROUTES AND NOT ONE, and the split is the payload rather than taste.
     * A material's body is its extracted text, so a brand book is tens of
     * kilobytes of it; a list that carried bodies would ship the client's entire
     * corpus to draw a column of filenames. So the list is rows, the item adds
     * the body, and the bytes are their own response with their own content type.
     *
     * SCOPED BY THE TENANT AND BY NOTHING ELSE ([[REQ-181]]). No slug is sent
     * here and none would mean anything: a business holds one site in v1, so
     * material is the business's and there is no narrower scope to ask for.
     * `placed_on` still travels on each row — the pane reads it to WARN about a
     * promotion that did not land — but it is never a boundary this route
     * enforces.
     */
    if (p === '/api/material' && method === 'GET') {
      const tickets = await openTickets()
      // THE HEAD IS READ BEFORE THE LIST, AND THE ORDER IS THE WHOLE POINT
      // ([[REQ-201]] §8). A write landing between the two is then in the page
      // AND in the replay the subscription opens with — which patches a row it
      // already drew, and is idempotent. The other order puts that write in
      // NEITHER, which is a material the tab never learns about.
      const seq = await tickets.accessor.changeHead()
      return json(200, { material: await listMaterial(tickets), seq })
    }

    /**
     * The Library's change feed ([[REQ-201]], [[DOC-24]]).
     *
     * WHY A SUBSCRIPTION AND NOT A POLL. The Library's most interesting writes
     * are not made by the Library: every material is a ticket with an AI-written
     * body, and the body arrives from `describeCapture` after the upload has
     * already returned — and again from a background re-describe pass. So the
     * common sequence is an operator uploading, a row appearing with no
     * description, and the description landing seconds later into a tab that has
     * no way to hear about it.
     *
     * SCOPED EXACTLY AS THE READ ABOVE IS, and by the same mechanism rather than
     * by a check written here: `openSubscriptionTickets` goes through
     * `ticketStoreFor`, whose accessor carries `WHERE tenant_id = ?` into the
     * change tail. A subscription is a read ([[DOC-8]] §6.6), and this route has
     * no widening available to it.
     *
     * THE CURSOR IS THE CLIENT'S. `Last-Event-ID` — which a browser's
     * `EventSource` re-presents automatically on reconnect — wins over `?since`,
     * which seeds only the first connection. Neither present means "from now",
     * which is the right answer for a subscriber that has read nothing.
     */
    if (p === '/api/material/changes' && method === 'GET') {
      const resumed = request.headers.get('last-event-id')
      const asked = resumed ?? url.searchParams.get('since')
      const since = asked == null ? null : Number(asked)
      if (since != null && !Number.isSafeInteger(since)) {
        return json(400, { error: 'since must be an integer change cursor' })
      }
      return streamMaterialChanges(
        await (deps.tickets ?? ticketStoreFor)(env, requireScope(), {
          changePollMs: MATERIAL_CHANGE_POLL_MS,
        }),
        since,
      )
    }

    /**
     * The client deletes one of their own files ([[REQ-281]]).
     *
     * `DELETE` ON THE LIST'S OWN PATH, and not a `POST /api/material/delete`.
     * The three POST routes above are each a NARROW WRITE OF ONE FIELD — a
     * description, a name, a role — and naming the field in the path is what
     * keeps a reader from having to read the handler to learn a route's reach.
     * This is not one of those: it is the removal of the resource `GET
     * /api/material` lists and `POST /api/material` adds to, which is what the
     * method already says. `/api/domain` spells its own erasure the same way.
     *
     * A THIN TRANSPORT OVER `archiveMaterial`, which is the component's
     * `archive` — the declared erasure path ([[DOC-37]]). So the cascade onto
     * the attachment bytes, the row leaving every list, and the change feed's
     * `exit` are all inherited rather than arranged here.
     *
     * IT HANDS DOWN THE INDEX SEAM, exactly as the description route does and
     * for the mirror of its reason: retrieval reads the index rather than the
     * body, so a deletion that never reached the index would leave the assistant
     * quoting a file the client has deleted. The answer travels in the envelope
     * because the erasure stands whether or not that refresh worked, and a
     * caller is entitled to know which.
     *
     * A UID THAT IS NOT THIS TENANT'S MATERIAL IS A 404, mapped at the foot of
     * this file with every other material refusal — the same answer the read
     * routes give, for the same reason: distinguishing "not material" from "not
     * here" would turn this into an oracle for which uids exist in the tenant.
     */
    if (p === '/api/material' && method === 'DELETE') {
      const uid = url.searchParams.get('uid')
      if (!uid) return json(400, { error: 'uid is required' })
      return json(200, await archiveMaterial(await openTickets(), uid, (await ingestDeps()).index))
    }

    if (p === '/api/material/item' && method === 'GET') {
      const uid = url.searchParams.get('uid')
      if (!uid) return json(400, { error: 'uid is required' })
      return json(200, await readMaterial(await openTickets(), uid))
    }

    /**
     * The bytes, so the detail pane can SHOW the thing rather than name it.
     *
     * Served from the private bucket through the tenant-bound blob handle, which
     * is why this is a route on the builder origin and not a URL into `SITES`:
     * the public Worker has no binding on the material bucket, deliberately
     * ([[DOC-38]] §7.1), and giving it one to save a hop is the disclosure that
     * boundary exists to prevent.
     */
    if (p === '/api/material/file' && method === 'GET') {
      const uid = url.searchParams.get('uid')
      if (!uid) return json(400, { error: 'uid is required' })
      // `member` NAMES ONE FILE INSIDE A CAPTURE ([[REQ-166]]). Absent is the
      // ordinary single-file material and behaves exactly as it always did, so
      // every existing caller is unaffected; present, it addresses one of a
      // bundle's 11–99 members without materialising the rest of it.
      const member = url.searchParams.get('member') ?? undefined
      const store = await openTickets()
      const file = await materialFile(store, uid, member)
      // THE PICTURE AS IT CURRENTLY STANDS, BY DEFAULT ([[REQ-219]]).
      //
      // The default is the edited state and not the stored bytes, which is what
      // makes the Library's existing detail pane show a cropped picture with no
      // change of its own — and what [[REQ-220]]'s modal fetches when it commits
      // a recipe and re-draws. `?original=1` is the other half: *"what did the
      // crop take away"* is a real question, and the answer has to be reachable
      // from the same route or somebody will build a second one.
      //
      // `?width=` IS A DELIVERY SIZE AND NEVER AN EDIT. It renders this picture
      // smaller for whoever is showing it; it does not touch the recipe, and the
      // recipe is what the picture IS. Ignored where it is wider than the
      // picture, because nothing is ever enlarged.
      //
      // A MEMBER OF A CAPTURE IS NEVER RENDERED. A capture bundle's screenshots
      // are not Library pictures and carry no recipe — the `member` parameter is
      // what says so, and rendering one would be applying another material's
      // recipe to bytes that have nothing to do with it.
      const rendered =
        member === undefined ? await renderedMaterial(env, requireScope(), store, uid, file, url) : file
      return new Response(rendered.bytes as unknown as BodyInit, {
        status: 200,
        headers: {
          'content-type': rendered.contentType,
          // INLINE, with the original name. The pane renders images and audio
          // directly and offers everything else as a download; a bare
          // `attachment` would make the preview a download prompt instead.
          'content-disposition': `inline; filename="${file.filename.replace(/["\\]/g, '')}"`,
        },
      })
    }

    /**
     * The client corrects what we said their material is ([[REQ-161]]).
     *
     * The body IS the description ([[DOC-38]] §6), so this is a ticket write —
     * but it re-indexes, which is the half that makes the ticket's acceptance
     * true. A correction that changed the body and not the index would leave the
     * Library showing the client's words while search kept answering with ours.
     */
    if (p === '/api/material/description' && method === 'POST') {
      const body = await readJsonBody(request)
      if (typeof body.uid !== 'string' || body.uid === '') {
        return json(400, { error: 'uid is required' })
      }
      if (typeof body.body !== 'string') {
        return json(400, { error: 'body is required' })
      }
      const revised = await reviseDescription(
        await openTickets(),
        { uid: body.uid, body: body.body },
        (await ingestDeps()).index,
      )
      return json(200, revised.row)
    }

    /**
     * The client corrects what their material is FOR ([[REQ-213]]).
     *
     * THE SIBLING OF THE ROUTE ABOVE, and the pair is worth reading together:
     * one corrects what we SAID a file is, the other what the client said it is
     * for. Both are the Library's rights block admitting that one of its rows was
     * never inferred — see `reviseRole` for why exactly one of them was not, and
     * why every other field on that block stays read-only.
     *
     * VALIDATED AND NOT COERCED, in the same words the upload route uses, because
     * it is the same value and the two silent alternatives are wrong in the same
     * two ways: falling back to `site` publishes something the client marked
     * private, and falling back to `reference` withholds a photograph they meant
     * to put on their site. Unlike the upload, ABSENT IS NOT ALLOWED — there is no
     * pipeline entry point here that could predate the question, only a person who
     * picked one of two options, so a missing role is a malformed request.
     *
     * THE REFUSALS ARE THE DOMAIN'S AND ARE MAPPED AT THE BOTTOM, which is where
     * every other named material refusal is mapped. Building an `error:` value
     * here would be doing it outside the one place that scrubs them ([[REQ-146]]
     * AC4), and the next such route would inherit the omission.
     *
     * IT PLACES, AND THE PLACEMENT IS SOFT. Widening to `Site asset` is only half
     * a promise until the bytes are in the site's asset library — the same half
     * the upload completes, by the same call, for the same reason: without it the
     * row flips straight to [[REQ-181]]'s *"Not on the site"* warning, which would
     * be true and useless. And it is soft for the reason `placeOnSite` argues: the
     * role change has already landed by the time it runs, so a site store that
     * refuses the write must not be reported as the correction not happening.
     *
     * THE ROW IS RE-READ AFTER A PLACEMENT AND NOT BEFORE. `promoteToSiteAsset`
     * writes `placed_on` when the copy lands, so the row `reviseRole` returned is
     * one write out of date in exactly the case the client is looking at — and it
     * is the field the warning badge reads. Only when something was placed, since
     * that is the only branch that wrote.
     */
    /**
     * The client fixes what their picture is CALLED ([[REQ-220]]).
     *
     * THE THIRD OF THE CORRECTION ROUTES, beside the description and the role, and
     * it is the one a generated image needs: the imagegen plugin titles its ticket
     * from the prompt that made the picture, so it arrives in the Library under a
     * sentence nobody chose to call it.
     *
     * IT WRITES THE TITLE AND NOT THE FILENAME. Those are two different facts
     * about one material — what we call it, and what the bytes arrived as — and
     * the download link reads the second. `reviseName` is where that is argued.
     *
     * NO INDEXING CALL, WHICH IS THE DIFFERENCE FROM THE DESCRIPTION ROUTE ABOVE.
     * Retrieval reads the indexed body; a rename changes a label on a row, and
     * re-embedding an unchanged description on every rename would be a cost with
     * no reader.
     */
    if (p === '/api/material/name' && method === 'POST') {
      const body = await readJsonBody(request)
      if (typeof body.uid !== 'string' || body.uid === '') {
        return json(400, { error: 'uid is required' })
      }
      if (typeof body.title !== 'string') {
        return json(400, { error: 'title is required' })
      }
      return json(200, await reviseName(await openTickets(), { uid: body.uid, title: body.title }))
    }

    /**
     * The client edits a picture ([[REQ-220]], [[REQ-219]]).
     *
     * **AN EDIT IS A RECIPE, NOT NEW BYTES.** Nothing on this path writes an
     * attachment: the original is kept forever and what is stored is an ordered
     * list of parameterised operations over it. That is what makes a crop
     * revisable a year later rather than a file the client has to re-upload.
     *
     * A THIN TRANSPORT OVER `reviseRecipe`, which parses, compiles and writes
     * through `image-recipe.ts` — the same functions `edit_image` dispatches to.
     * The builder is a second PRODUCER of structured edits and never a second
     * write path, so nothing here can bypass a refusal because nothing here does
     * any of that work itself.
     *
     * IT HANDS DOWN A WAY TO MEASURE THE PICTURE, because a recipe in fractions
     * cannot be checked against the picture without its real pixels — and where
     * this deployment has no renderer there is nothing to measure with, which is
     * what `rendered: false` reports. That flag is what lets the modal say *you
     * are looking at this picture before the change* rather than implying bytes
     * that do not exist.
     *
     * A NON-PICTURE IS A 403 AND NOT A 400, on the pattern the two routes above
     * set: the request is perfectly well formed and there is nothing the caller
     * could send instead that would make a crop of a brand PDF mean something.
     */
    if (p === '/api/material/recipe' && method === 'POST') {
      const body = await readJsonBody(request)
      if (typeof body.uid !== 'string' || body.uid === '') {
        return json(400, { error: 'uid is required' })
      }
      if (!Array.isArray(body.recipe)) {
        return json(400, { error: 'recipe must be a list of operations' })
      }
      const scope = requireScope()
      const store = await openTickets()
      const renderer = imageRendererFor(env, scope.businessId)
      return json(
        200,
        await reviseRecipe(store, { uid: body.uid, recipe: body.recipe }, {
          ...(renderer ? { renderer } : {}),
          // THE SITE STORE, SO THE EDIT REACHES THE SITE ([[REQ-229]]). Opened
          // softly: a deployment or a business with no site is an ordinary thing
          // to be, and a client editing a picture in their Library must not be
          // refused because there is nowhere yet for the bytes to go. Absent, the
          // recipe lands and `republished` is empty — which is also true.
          ...(await siteStoreOrNone(openStore)),
        }),
      )
    }

    if (p === '/api/material/role' && method === 'POST') {
      const body = await readJsonBody(request)
      if (typeof body.uid !== 'string' || body.uid === '') {
        return json(400, { error: 'uid is required' })
      }
      if (body.role !== 'site' && body.role !== 'reference') {
        return json(400, { error: "role must be 'site' or 'reference'" })
      }
      const tickets = await openTickets()
      const revised = await reviseRole(tickets, { uid: body.uid, role: body.role })
      const placement = await placeOnSite(
        { uid: revised.uid, role: revised.role, filename: revised.filename },
        await theOneSite(openStore),
        openTickets,
        openStore,
        scrub,
        imageRendererFor(env, requireScope().businessId),
      )
      const row = placement.site_asset ? await readMaterial(tickets, revised.uid) : revised
      return json(200, { ...row, ...placement })
    }

    /**
     * The two ingestion entry points ([[REQ-163]], [[DOC-38]] §10).
     *
     * THEY BELONG HERE AND NOT TO [[REQ-161]], and the line is worth stating
     * because the two tickets meet exactly at it: these are PIPELINE ENTRY
     * POINTS — the only way a byte enters the system — while listing material,
     * showing it, and the drag-and-drop overlay that will POST to them are
     * SURFACES over what already exists. So the contract below is public from
     * the start: the Library is written against it rather than alongside it.
     *
     * `multipart/form-data` for the upload, because that is what a dropped file
     * is in a browser and what `FormData` produces without ceremony. JSON for
     * the fetch, because its whole input is one address.
     */
    if (p === '/api/material' && method === 'POST') {
      // REFUSED BEFORE THE BYTES ARE READ (REQ-173). Storing a document nothing
      // can describe used to be the degraded-but-honest path, and it was the
      // right one while a body was the extracted text: the material was still
      // findable by its own words. It is not right now. The body is a digest, so
      // a deployment with no describer produces material with no description at
      // all — and the Library would fill up with rows saying why, one per upload,
      // for a fact that is true of the whole deployment and is stated once at the
      // top of the screen instead.
      if (!aiConfigured(env, deps)) return json(503, { error: scrub(NO_API_KEY_MESSAGE) })
      const form = await request.formData()
      // CAST BECAUSE `@cloudflare/workers-types` DECLARES `get` TOO NARROWLY —
      // `get(name): string | null`, with no `File` in the union, even though the
      // runtime returns one for a file part and the same file's declaration is a
      // class two hundred lines up in that very file. Without the cast the
      // `instanceof` below does not compile, and narrowing structurally instead
      // would leave the value `never`.
      const file = form.get('file') as unknown as File | string | null
      if (!(file instanceof File)) {
        return json(400, { error: 'a file is required, sent as multipart form field `file`' })
      }
      const formSite = form.get('site')
      const siteKey = typeof formSite === 'string' && formSite !== '' ? formSite : undefined
      /**
       * WHICH DROP AREA THE CLIENT CHOSE ([[REQ-161]]).
       *
       * VALIDATED AND NOT COERCED. A misspelled role must be a refusal, because
       * the two silent alternatives are both wrong in a way nobody would notice:
       * falling back to `site` publishes something the client marked private,
       * and falling back to `reference` quietly withholds a hero photograph they
       * meant to put on their site.
       *
       * ABSENT IS STILL ALLOWED, and that is deliberate. This route is the
       * pipeline's entry point as well as the overlay's target, so a caller that
       * predates the question — [[REQ-163]]'s own path — lands on [[DOC-38]]
       * §10.1's provenance answer exactly as it did. The guarantee that a human
       * chose belongs to the overlay, which has no drop target that is not one of
       * the two areas; it is not something a route can assert on its behalf.
       */
      const rawRole = form.get('role')
      if (rawRole != null && rawRole !== 'site' && rawRole !== 'reference') {
        return json(400, { error: "role must be 'site' or 'reference'" })
      }
      const role = (rawRole ?? undefined) as MaterialRole | undefined
      const ingested = await ingestUpload(
        await openTickets(),
        {
          bytes: new Uint8Array(await file.arrayBuffer()),
          filename: file.name,
          // The browser's own observation about the bytes, with a fallback
          // rather than a refusal — a type we cannot read still gets stored and
          // still says so, which is the trade the pipeline makes throughout.
          contentType: file.type || 'application/octet-stream',
          role,
        },
        await ingestDeps(),
      )
      return json(200, {
        ...materialEnvelope(ingested),
        ...(await placeOnSite(
          {
            uid: ingested.ticket.uid,
            role: ingested.ticket.fields.role,
            filename: ingested.ticket.fields.filename,
          },
          siteKey,
          openTickets,
          openStore,
          scrub,
          imageRendererFor(env, requireScope().businessId),
        )),
      })
    }

    if (p === '/api/material/fetch' && method === 'POST') {
      // The same gate as the upload route, for the same reason: both entry points
      // converge on `ingest`, so a guard on one of them is not a guard.
      if (!aiConfigured(env, deps)) return json(503, { error: scrub(NO_API_KEY_MESSAGE) })
      const body = await readJsonBody(request)
      if (typeof body.url !== 'string' || body.url === '') {
        return json(400, { error: 'url is required' })
      }
      // NO SLUG (BUG-47). What we fetch on a client's behalf is always
      // `reference` and never `republishable`, so it can never be promoted onto
      // a site — a slug here could only ever have recorded which site happened
      // to be open, which is the fact the Library was misreading as placement.
      const ingested = await ingestFetch(await openTickets(), body.url, {
        ...(await ingestDeps()),
        fetch: deps.fetch,
      })
      return json(200, materialEnvelope(ingested))
    }

    /**
     * The palette popup's calls (REQ-133 / DOC-28 §8).
     *
     * Thin transports over the same `editPalette*` functions `1c palette`
     * dispatches to. That is what makes the guards real: the delete refusal and
     * the rename collision check run inside those functions against the stored
     * definition, so a stale tab posting a count it read five minutes ago cannot
     * talk the store into an orphaned reference.
     */
    if (p === '/api/palette') {
      if (method === 'GET') {
      const site = url.searchParams.get('site')
      if (!site) return json(400, { error: 'site is required' })
      return json(200, (await editPaletteGet(site, await edit())).data)
      }

      if (method === 'POST') {
      const body = await readJsonBody(request)
      const { site, op, name, value, to } = body
      if (typeof site !== 'string' || typeof op !== 'string') {
          return json(400, { error: 'site and op are required' })
      }
      // The op vocabulary is CLOSED and checked here, so an unknown verb is a
      // 400 rather than an exception rendered as a 500 — the client is a
      // second producer of edits, and a malformed one deserves to be told so.
      if (op !== 'set' && op !== 'add' && op !== 'rm' && op !== 'rename') {
          return json(400, { error: `unknown palette op '${op}'` })
      }
      if (typeof name !== 'string') return json(400, { error: 'name is required' })
      const scope = await edit()
      const out =
          op === 'set'
            ? await editPaletteSet(site, name, value, scope)
            : op === 'add'
              ? await editPaletteAdd(site, name, value, scope)
              : op === 'rm'
                ? await editPaletteRm(site, name, scope)
                : await editPaletteRename(site, name, String(to ?? ''), scope)
      // The census travels back with every write, so the popup redraws from
      // what the store now holds rather than from its own guess at it — a
      // rename changes one name and no count, a delete changes the list, and
      // the client needs neither to know which.
      const census = (await editPaletteGet(site, scope)).data as Record<string, unknown>
      return json(200, { ...(out.data as Record<string, unknown>), ...census })
      }
    }

    /**
     * WHAT BECAME OF THE LAST TURN OF A CONVERSATION BEING RE-OPENED ([[REQ-306]]).
     *
     * THE HALF OF THIS TICKET THE CUSTOMER SEES. A panel whose stream stopped
     * without a terminal frame re-opens the conversation to find out what
     * happened; before the ledger there was nothing to find, so it repainted in
     * silence and the only thing on screen said the connection had been lost —
     * which was not true and was not actionable. This travels back with the
     * conversation, on the request the panel already makes, so the notice it
     * paints is drawn from a database rather than from a guess about a socket.
     *
     * ON THE SESSION ROUTE AND NOT A ROUTE OF ITS OWN, for the reason the route
     * below gives about `/api/ai/session` being the one place a conversation is
     * opened: a second call would be a second answer about one conversation,
     * able to describe a fold this one is no longer showing.
     *
     * IT TAKES `live` FROM THE ANSWER IT IS DECORATING. That is the whole
     * judgement — see `sessionTurnFailure` — and taking it from anywhere else
     * would be asking two different isolates the same question.
     */
    const turnFailure = async (opened: { sessionId: string; live?: boolean }) =>
      sessionTurnFailure(
        env.DB ? env : null,
        requireScope().businessId,
        opened.sessionId,
        opened.live === true,
      )

    /**
     * The assistant's two calls (REQ-122 / REQ-127), now in workerd (REQ-146).
     *
     * THIN, exactly as the Node origin's were. Both are transports over
     * `host-core.ts` — the same session model, the same tool loop, the same
     * `edit.ts` write path every other route uses. Nothing here decides anything
     * about a conversation.
     *
     * A SITE BECOMES A SESSION IN ONE PLACE, and it is not here: `openSession`
     * takes the site and hands back an id, and every turn afterwards carries
     * only that id. `/api/ai/prompt` never sees a site, which is what stops a
     * late answer landing in a window that has since switched sites.
     */
    if (p === '/api/ai/session' && method === 'POST') {
      const body = await readJsonBody(request)
      /**
       * WHICH CONVERSATION IS BEING OPENED ([[REQ-239]]).
       *
       * ONE ROUTE AND NOT TWO, because opening a conversation is one act and the
       * three routes below it — prompt, reattach — already take nothing but an
       * id. A second path here would have to be mirrored in neither of them,
       * which is how a surface acquires an asymmetry nobody can justify later.
       *
       * THE BUSINESS IS NOT NAMED IN THE BODY, and that is the point of the
       * flag. The request has already resolved to exactly one business
       * (`requireScope`), so a body that carried an id would be offering a
       * caller a choice it does not have and this route a value to check. `site`
       * still travels because a business holds several sites and the caller IS
       * choosing one.
       */
      if (body.scope === BUSINESS_SESSION_SCOPE) {
        const businessHost = await chatHost(env, requireScope(), deps, url.origin)
        const opened = await openBusinessSession({}, businessHost.deps)
        await businessHost.flush(opened.sessionId)
        return json(200, { ...opened, failed: await turnFailure(opened) })
      }
      const site = body.site
      if (typeof site !== 'string' || site === '') {
        return json(400, { error: 'site is required' })
      }
      const host = await chatHost(env, requireScope(), deps, url.origin)
      const session = await openSession(site, {}, host.deps)
      // Opening can run a tool-free turn's worth of policy — nothing to audit
      // yet in practice, but flushed for the same reason the prompt route
      // does it: the buffer is per host, and leaving records in it would
      // attribute them to whatever turn drained next.
      await host.flush(session.sessionId)
      return json(200, { ...session, failed: await turnFailure(session) })
    }

    if (p === '/api/ai/prompt' && method === 'POST') {
      const body = await readJsonBody(request)
      const { sessionId, text } = body
      if (typeof sessionId !== 'string' || sessionId === '') {
        return json(400, { error: 'sessionId is required' })
      }
      if (typeof text !== 'string') {
        return json(400, { error: 'text is required' })
      }
      const host = await chatHost(env, requireScope(), deps, url.origin)
      /**
       * THE LEDGER IS OPENED HERE, AND *HERE* IS THE WHOLE OF IT ([[REQ-306]]).
       *
       * BEFORE THE `Response` EXISTS, awaited, on the route's own critical path.
       * `streamTurn` hands back its response before `start()` runs, so once it
       * has returned there is no code left whose running is guaranteed — an
       * isolate killed mid-stream never reaches the `catch`, never reaches the
       * `finally`, and leaves the client a 200 with an empty body. Every other
       * record of a turn this system keeps is written after the model call and
       * therefore dies with it. This one is written before anything can go
       * wrong, which is the only way a turn's END can be recorded by its absence.
       *
       * IT COSTS ONE INSERT AND CANNOT COST THE TURN. `openTurn` swallows its own
       * failure and answers `null`, on which the close is a no-op — so a
       * deployment with no database, or a database that refused, behaves exactly
       * as this route did before the ledger existed.
       */
      const ledger = await openTurn(env.DB ? env : null, requireScope().businessId, sessionId)
      return streamTurn(host, sessionId, text, scrub, ctx, ledger)
    }

    /**
     * POST /api/ai/reattach — rejoin a turn already in flight (BUG-46).
     *
     * THE THIRD CALL THIS SURFACE HAS, and the first that is a pure READ of a
     * conversation. `/api/ai/session` says what to paint, `/api/ai/prompt`
     * starts a turn, and neither lets a page that loaded DURING a turn catch up:
     * the transcript is a still frame, correct as of the fold, of something
     * still being written. Without this the operator watches a reply frozen
     * mid-sentence and reloads again — which is the loop that cost them a turn
     * to begin with.
     *
     * IT TAKES THE CURSOR `/api/ai/session` HANDED OUT, and that pairing is the
     * point. The tail resumes at exactly the offset the transcript was folded
     * at, so painted-then-tailed reads as one reply with no gap and nothing
     * shown twice (DOC-21 §11). A cursor invented anywhere else is a cursor for
     * a different fold.
     *
     * NO `ctx.waitUntil`, unlike the prompt route, and the asymmetry is the
     * whole distinction between the two. Tailing produces nothing durable —
     * there is no `turn_end` to append, no `sync` to drain, no audit to flush —
     * so a client that walks away leaves nothing behind that needs finishing.
     * The turn it was watching is driven by whoever started it and is entirely
     * unaffected either way.
     */
    if (p === '/api/ai/reattach' && method === 'POST') {
      const body = await readJsonBody(request)
      const { sessionId, cursor } = body
      if (typeof sessionId !== 'string' || sessionId === '') {
        return json(400, { error: 'sessionId is required' })
      }
      // A MISSING CURSOR IS NOT ZERO. Defaulting it would silently replay the
      // whole conversation into a panel that has already painted it, which is
      // the exact duplication the cursor exists to prevent — and it would look
      // like the feature working.
      if (typeof cursor !== 'number' || !Number.isFinite(cursor) || cursor < 0) {
        return json(400, { error: 'cursor is required' })
      }
      const host = await chatHost(env, requireScope(), deps, url.origin)
      return streamTail(host, sessionId, cursor, scrub)
    }

    /**
     * The copy modal's two calls (REQ-117 / DOC-28 §4).
     *
     * Both are thin transports over `editCopyGet` / `editCopySet` — the same
     * functions `1c copy get|set` dispatches to, not a parallel implementation.
     * The editor is a second producer of structured edits, not a second write
     * path, and nothing here can bypass validation because nothing here does any
     * of that work itself.
     */
    if (p === '/api/copy') {
      const scoped = async (read: (k: string) => string | undefined) => ({
      ...(await edit()),
      module: read('module'),
      slot: read('slot'),
      })

      if (method === 'GET') {
      const q = url.searchParams
      const get = (k: string): string | undefined => {
          const v = q.get(k)
          return v !== null && v !== '' ? v : undefined
      }
      const [site, page, addr] = [q.get('site'), q.get('page'), q.get('path')]
      if (!site || !page || !addr) {
          return json(400, { error: 'site, page and path are required' })
      }
      const got = (await editCopyGet(site, page, addr, await scoped(get))).data as Record<
          string,
          unknown
      >
      // THE PICKER'S LIST IS THE LIBRARY'S ([[REQ-282]] Part 2), and it travels
      // WITH the descriptors that consume it — the same rule `palette` follows
      // above, for the same reason: a client fetching the catalogue separately
      // could draw a tile from one reading of it and commit against another.
      //
      // IT IS ADDED HERE AND NOT IN `copyFieldsOf` BECAUSE ONLY THIS SIDE HOLDS
      // THE LIBRARY. A material is a ticket and the ticket store is the
      // Worker's; the derivation is served to the browser type-stripped and
      // reads no files at all. So the descriptor keeps saying what an L1 node
      // may hold — the site's own handles, which is what the write side
      // validates — and the catalogue rides beside it as what a person may
      // choose from. The two lists are genuinely different questions and the
      // envelope now asks both.
      //
      // ABSENT WHERE THERE IS NO PICKER, so a text segment pays nothing for a
      // listing it cannot use.
      const pickable = Array.isArray(got.fields)
          ? (got.fields as Array<Record<string, unknown>>).some((f) => f.format === 'image')
          : false
      const pictures = pickable ? await pickerCatalogue(site) : null
      return json(200, pictures ? { ...got, pictures } : got)
      }

      if (method === 'POST') {
      const body = await readJsonBody(request)
      const get = (k: string): string | undefined => {
          const v = body[k]
          return typeof v === 'string' && v !== '' ? v : undefined
      }
      const [site, page, addr] = [body.site, body.page, body.path]
      if (typeof site !== 'string' || typeof page !== 'string' || typeof addr !== 'string') {
          return json(400, { error: 'site, page and path are required' })
      }
      const values = body.values
      if (values === null || typeof values !== 'object' || Array.isArray(values)) {
          return json(400, { error: 'values must be an object of field → string' })
      }
      /**
       * PLACE ON SAVE, NOT ON PICK ([[REQ-282]] Part 2).
       *
       * `place` names, per field, the Library material whose bytes this Save has
       * to put on the site before the value it produces can be written. The
       * modal stages a pick and commits nothing; this is the single flush point,
       * so a client who opens the picker, chooses a photograph and then cancels
       * leaves no asset behind.
       *
       * IT IS A SEPARATE KEY AND NOT A MAGIC VALUE, deliberately. `values` is
       * always L1 values and stays readable as such; a `library:` token hidden
       * inside one would have to be told apart from a client's own alt text,
       * which is a guess this does not have to make. The token is still sent in
       * `values` alongside it — so a `place` that was ignored fails loudly at the
       * validator rather than quietly writing the image back as it was.
       *
       * A REFUSAL IS REPORTED AND NOTHING IS WRITTEN. `promoteToSiteAsset`
       * refuses material we hold no right to republish, and that refusal is the
       * answer the client needs to read on the modal — so it travels out as a
       * 4xx rather than being swallowed into a save that silently kept the old
       * picture. The write below has not happened yet, so the draft is untouched.
       */
      const place = body.place
      if (place !== undefined && (place === null || typeof place !== 'object' || Array.isArray(place))) {
          return json(400, { error: 'place must be an object of field → material uid' })
      }
      const placed: Record<string, unknown> = { ...(values as Record<string, unknown>) }
      const picks = Object.entries((place ?? {}) as Record<string, unknown>)
      if (picks.length) {
          // NULL IS ORDINARY AND IS NOT A FAILURE — a deployment with no
          // `[images]` binding places the bytes it was given, which is what
          // promotion meant before recipes existed.
          const renderer = imageRendererFor(env, requireScope().businessId)
          for (const [field, uid] of picks) {
          if (typeof uid !== 'string' || uid === '') {
              return json(400, { error: `place.${field} must be a material uid` })
          }
          placed[field] = await placePicture(
              await openTickets(),
              await openStore(),
              { uid, slug: site },
              { ...(renderer ? { renderer } : {}) },
          )
          }
      }
      // `editCopySet` throws on an invalid edit before writing anything, so a
      // failure here leaves the draft exactly as the user left it — the iframe
      // they are looking at is still accurate, which is what makes surfacing
      // the error safe. No re-render follows (REQ-119): the next fetch of
      // either channel renders the definition this write just produced.
      const out = await editCopySet(site, page, addr, placed, await scoped(get))
      return json(200, out.data)
      }
    }

    /**
     * /preview/<siteKey>/<channel>/<...> — a rendered channel (REQ-119).
     *
     * `draft` and `edit` render ON REQUEST from the stored definition, now in
     * workerd. `published` is not here: it is the immutable artifact a publish
     * produced, it lives in R2, and `public-site` serves it. Re-deriving it from
     * today's draft would make the published channel show unpublished work.
     *
     * SO `published` REDIRECTS rather than being served (REQ-149 D4). One serving
     * path for published bytes, as DOC-12 §7 assigns it. Proxying instead would
     * duplicate the resolve-and-serve logic that seam exists to own, and the cost
     * of the redirect — a never-published site shows public-site's 404 rather
     * than a builder-shaped message — lands on a URL the toolbar never produces.
     */
    /**
     * GET /account — the customer portal ([[REQ-183]]).
     *
     * A SITE PAGE, SERVED BY THE RENDERER THAT SERVES EVERY OTHER PAGE. The
     * surface showing an account its own relationship with a business is the
     * customer portal of that business's SITE ([[DOC-40]] §2.1) — the same
     * surface, rendered by the same code, that our customers will give their own
     * customers. So there is deliberately no template here and no second render
     * path: this is `servePreview`, against a different store, at a different
     * path. If a later hand finds themselves adding a rendering path for it, the
     * reading has been abandoned and that belongs in [[DOC-40]] §2.1 rather than
     * in a quiet diff.
     *
     * IT APPEARS ON THIS ORIGIN BECAUSE THE IDENTITY IS HERE, AND THAT IS THE
     * PROVISIONAL HALF ([[REQ-183]] D1). `app.1stcontact.io` already verifies an
     * email and runs `admit`; `1stcontact.io` is `GET`-only, edge-cached and
     * authenticates nobody, so one cached copy of a portal page would be
     * everybody's answer. The ORIGIN is what moves when the credential layer is
     * ours ([[DOC-40]] §3); the pages do not, because they are site content.
     *
     * IT TAKES NO SCOPE, and that is [[DOC-42]] §10.1's whole point. The store
     * is opened against the business the caller is an ACCOUNT OF rather than the
     * one they are operating, so `requireScope` is not called and an account whose
     * every grant has lapsed reaches it — which is the population most likely to
     * want the one control on it.
     *
     * A BUSINESS THAT HAS NOT AUTHORED A PORTAL GETS THE SHIPPED DEFAULT, through
     * a real in-memory `SiteStore` rather than a branch in the renderer. Authoring
     * one is an ordinary site write and it takes over the moment it exists.
     */
    if (p === PORTAL_PATH || p.startsWith(`${PORTAL_PATH}/`)) {
      if (method !== 'GET' && method !== 'HEAD') {
        return text(405, 'Method Not Allowed')
      }
      const businessId = portalBusinessId(deps.admission ?? null, scope)
      // No identity and no scope: there is no business whose portal this could
      // be, and inventing one would render somebody else's page.
      if (businessId === null) return text(404, 'Not found')
      const hostStore = await (deps.store ?? storeFor)(env, { businessId })
      // FOUND BY KIND, NOT BY A RESERVED NAME ([[REQ-236]]). It was
      // `hasDraft('portal')` — a magic slug a customer could have collided with
      // by calling their own site `portal`, and one with nowhere to live once
      // `sites.slug` went. `kind` is the schema's own word for what a row is,
      // so the portal is addressed by its key like everything else and found by
      // what it IS rather than by what somebody agreed to call it.
      const authored = (await hostStore.siteKeys('portal'))[0] ?? null
      const portalStore =
        authored !== null
          ? hostStore
          : portalFallbackStore(BUSINESSES_PATH, ACCEPTANCES_PATH)
      const rel = p.slice(PORTAL_PATH.length) || '/'
      // `draft` rather than a published revision: the portal is not published
      // through `public-site` and has no revision log of its own yet, so the
      // draft IS the live copy. When the portal moves to a customer's origin that
      // becomes a publish like any other site's.
      // THE FALLBACK KEEPS THE RESERVED NAME, and that is not an inconsistency.
      // `portalFallbackStore` is an in-memory adapter with one site in it and no
      // business to collide inside; the name it seeds under is a local label,
      // not a row in the multi-tenant schema [[DOC-45]] §6 is about.
      return servePreview(portalStore, authored ?? PORTAL_SLUG, 'draft', rel)
    }

    const preview = p.match(/^\/preview\/([^/]+)\/([^/]+)(\/.*)?$/)
    if (preview) {
      // THE FIRST SEGMENT IS THE SITE'S KEY ([[REQ-236]]). It was the slug, and
      // readability bought nothing: this URL is an iframe `src` and an
      // open-in-new-tab the operator looks at rather than shares, it is already
      // business-scoped by `setBusinessScope`, and every store verb behind it
      // now takes the key. What it cost was a lookup on every preview byte and a
      // name that moved when the business was renamed.
      const site = decodeURIComponent(preview[1])
      const channel = decodeURIComponent(preview[2])

      /**
       * POST /preview/<siteKey>/draft/api/lead — the preview submits for real
       * ([[BUG-78]]).
       *
       * WHY THIS EXISTS AT ALL. A rendered form's `action` is root-relative, so
       * it resolves against whichever host served the document. Published, that
       * host is `public-site` and the endpoint is there. In the preview it is
       * THIS Worker, which had no such route — so the one surface an operator can
       * actually press the button on was the one surface where the button could
       * not work. The path is the preview channel's own root plus the same
       * `api/lead` suffix `public-site` answers, so one `action` value is correct
       * in both places and the renderer never learns which channel it is in.
       *
       * THE SAME `handleLead`, NEVER A SECOND ONE. Body limits, field caps, the
       * two submit shapes, the honeypot, the frozen acknowledgement and the
       * refusal envelope are all already decided in `public-site`'s endpoint, and
       * a copy here would be two endpoints that agree until they do not.
       *
       * THE SITE KEY COMES FROM THE ROUTE AND IS CHECKED, never taken from the
       * body. It is the URL's own first segment ([[REQ-236]]), and `hasDraft`
       * against the store already scoped to this operator's business is what
       * refuses a key belonging to somebody else — so a submission cannot name a
       * tenant, exactly as `public-site` gets from its route grammar.
       *
       * `draft` ONLY. The site is not intended to be functional in edit mode: the
       * edit render emits no `action` and no `method` and ships no client script,
       * so nothing can submit from it today — and refusing here keeps that true
       * if the renderer ever changes. `published` falls through to the redirect
       * below, which sends the whole channel to `public-site` where the real
       * endpoint lives.
       */
      if (method === 'POST' && (preview[3] ?? '/') === '/api/lead') {
        if (channel !== 'draft') return text(404, 'Not found')
        const store = await openStore()
        if (!(await store.hasDraft(site))) return text(404, 'Not found')
        return handleLead(request, {
          siteKey: site,
          // The in-process intake. `public-site` reaches `captureLead` over a
          // service binding because it lives in another Worker; here it is the
          // same Worker, so a binding to ourselves would be a hop for nothing.
          // The CHANNEL is added here and not taken from the payload: it is a
          // fact about which server received the request.
          env: {
            ...env,
            LEAD_INTAKE: {
              captureLead: (spec: LeadSubmission) =>
                captureLead(env as LeadIntakeEnv, {
                  ...spec,
                  channel: 'draft',
                  // AND SO IS THE ORIGIN ([[BUG-97]]). A draft submission's mail
                  // links back into the draft, which only this server serves — so
                  // the link has to name this server, and the honest source for
                  // that is the request that arrived at it rather than a var
                  // somebody sets per deployment. On a development machine it is
                  // what makes the mailed link followable at all.
                  origin: new URL(request.url).origin,
                }),
            },
          } as unknown as LeadRequestEnv,
          identified: true,
        })
      }

      /**
       * GET /preview/<siteKey>/draft/api/download/<token>[/<assetKey>] — the
       * gated download, against the draft ([[BUG-97]]).
       *
       * WHY THIS EXISTS AT ALL, which is `api/lead`'s reason one step further on.
       * [[BUG-78]] made the preview's form submit for real, and the mail it sends
       * carries a link — so the surface an operator can actually press the button
       * on is the surface whose link had nowhere to land. A draft link with no
       * route is the same defect as a published link on the wrong host: something
       * we sent somebody that cannot be opened.
       *
       * AND IT IS WHAT MAKES TESTING BEFORE PUBLISHING POSSIBLE. A site that has
       * never been published has no published channel at all — `public-site`
       * resolves a site through its live revision, so there is not even a form to
       * submit — so the preview is not a convenience here, it is the only place
       * the whole loop can run. With this route the operator presses the button,
       * reads the mail, follows the link and takes the paper, with nothing
       * published and no mail provider configured.
       *
       * `draft` ONLY, on the `api/lead` route's reasoning. The edit channel is
       * not meant to be functional, and `published` falls through to the redirect
       * below — which sends it to `public-site`, where the published gate lives
       * and has lived since [[REQ-244]].
       *
       * THE SAME `openGate`/`takeAsset` THE PUBLISHED GATE USES, over a channel
       * argument, and never a second implementation. `recordEvent` is the one
       * definition of how a fact enters a contact's history ([[DOC-44]] §4.1) —
       * the whole reason those functions live in this app rather than in the
       * server that receives the request — so an arrival through the preview is
       * recorded by the same statement as an arrival through the live site, and
       * *"they opened it"* means one thing in the timeline.
       *
       * THE BYTES COME OUT OF `servePreview` AND NOT OUT OF R2. A gated artifact
       * is a site asset ([[REQ-244]] §5), and on the draft channel the site's
       * assets are whatever the draft holds — which is exactly what the renderer
       * this route already uses serves for every other draft byte, including the
       * refusals it applies to a path that tries to leave the site.
       *
       * THE OPERATOR IS AUTHENTICATED AND THE KEY IS CHECKED, so the indistinguishable
       * 404 `public-site`'s gate is careful about is not this route's property to
       * keep: there is no unauthenticated caller here to be given an oracle. What
       * IS kept is that a site key this business does not hold is a 404 — the same
       * check the `api/lead` route above makes, for the same reason.
       */
      const download =
        method === 'GET' && channel === 'draft'
          ? parseDownloadPath((preview[3] ?? '/').replace(/^\/+/, ''))
          : null
      if (download) {
        const store = await openStore()
        if (!(await store.hasDraft(site))) return text(404, 'Not found')
        // THE SAME CAST THE `api/lead` ROUTE BELOW MAKES, to the same type:
        // `GateEnv` IS `LeadEnv` and both are this app's own shape.
        const gateEnv = env as LeadIntakeEnv
        if (download.assetKey === null) {
          const page = await openGate(gateEnv, site, download.token, 'draft')
          if (!page) return text(404, 'Not found')
          // THE REQUEST'S OWN PATHNAME AND NOT `p`. The page links its artifacts
          // from the path it was reached at, and `p` has had the `/b/<id>` prefix
          // split off it — so using it would emit links that drop the business and
          // resolve against whichever one sorted first.
          const listing = downloadsPage(new URL(request.url).pathname, page.assets)
          return new Response(listing.body, { status: 200, headers: listing.headers })
        }
        const artifact = await takeAsset(gateEnv, site, download.token, download.assetKey, 'draft')
        if (!artifact) return text(404, 'Not found')
        return await deliverDraftArtifact(store, site, artifact.url)
      }

      if (channel === 'published') {
        // CHECKED AGAINST THE STORE, THOUGH NO LONGER TRANSLATED BY IT. The
        // segment already IS the public address ([[REQ-190]], [[REQ-236]]), so
        // there is nothing to resolve — but a key this business does not hold
        // must still be a 404 here rather than a redirect to a URL that could
        // only 404 one hop later.
        if (!(await (await openStore()).hasDraft(site))) return text(404, 'Not found')
        return Response.redirect(publicSiteUrl(site, preview[3] ?? '/'), 302)
      }
      if (!PREVIEW_CHANNELS.includes(channel as PreviewChannel)) {
      return text(404, 'Unknown channel')
      }
      return servePreview(await openStore(), site, channel as PreviewChannel, preview[3] ?? '/')
    }

    // Not a route: the build artifacts, or a genuine 404 from the binding that
    // holds them. Last, so no asset can shadow a route.
    return env.ASSETS.fetch(request)
  } catch (err) {
    // A CommandError is the EXPECTED answer to a bad edit — the validator
    // refusing a change map, an address that resolves to nothing. It is the
    // user's mistake, not the server's, so it carries its own code/path/hint
    // envelope out to the modal at 400. Reporting it as 500 would tell the
    // client "the builder broke" for a rejected heading, and would throw away
    // the message naming which field was wrong and why.
    // Scrubbed on the way out, not at the throw site: the message that carries a
    // credential is the one nobody wrote — see `redact.ts`.
    // A STORE THAT COULD NOT BE OPENED IS A CONFIGURATION FAILURE, not a bad
    // request, and `index.ts` renders it as 503 in prose an operator can act on.
    // It reaches this handler at all only because REQ-149 deferred the store's
    // construction into this `try` — before that it threw past `route()`
    // entirely. Rethrowing keeps the status exactly where it was: without it,
    // moving WHEN the store opens would silently downgrade "this deployment is
    // misconfigured" to "the server broke on your request".
    if (err instanceof TenantNotConfiguredError || err instanceof UnknownTenantError) throw err

    // A ROUTE THAT NEEDS A BUSINESS AND HAS NONE IS AN ANSWER ABOUT THE CALLER,
    // and rethrowing is what keeps it one. `index.ts` is the only frame that
    // knows who this is, so it is the only frame that can log the refusal
    // against them and render it as the 403 it is ([[DOC-42]] §10.1). Caught
    // here it would become the generic 500 below — a server that broke, reported
    // to the one person whose problem is a payment.
    if (err instanceof NoBusinessError) throw err

    // AN ADD WITH NO ADDRESS IS THE CALLER'S MISTAKE ([[REQ-199]]) — 400, and
    // not the 500 below, which would report "the builder broke" for an empty box
    // and send the operator back to retry the one thing that cannot work.
    if (err instanceof InvalidContactError) {
      return json(400, { error: scrub(err.message) })
    }

    // A REFUSED TEMPLATE IS COPY THAT CANNOT BE SENT TO ANYBODY ([[REQ-197]],
    // [[REQ-199]]) — 400, because the operator deleted the token out of the
    // modal's body or the template has come apart from its own declaration, and
    // both are things they can go and fix. The sentence names the template and
    // the token, which is what makes it actionable.
    if (err instanceof TemplateRefusedError) {
      return json(400, { error: scrub(err.message) })
    }

    // NO SENDING ADDRESS IS THE DEPLOYMENT'S FAULT AND NOT THE OPERATOR'S — 503,
    // because retrying will not help and the remedy is `wrangler.toml`. Reported
    // as a 500 it would read as a crash; reported as a 400 it would send them
    // back to correct a form that is perfectly correct.
    if (err instanceof MailNotConfiguredError) {
      return json(503, { error: scrub(err.message) })
    }

    // NO SESSION COOKIE IS THE SAME KIND OF FAULT ([[REQ-202]]) — 503, same
    // reasoning, and it reaches here from the invite: an invite's link is a
    // redeemable sign-in token now, so a deployment that names no session cookie
    // cannot mint one and must say so rather than mailing somebody a link that
    // goes to a front door they cannot get through. The remedy is
    // `wrangler.toml`, and retrying will not help.
    if (err instanceof SessionsNotConfiguredError) {
      return json(503, { error: scrub(err.message) })
    }

    // AN ID THAT NAMES NOBODY HERE IS THE SAME ANSWER AS NOT FOUND ([[REQ-199]]),
    // for `personDetail`'s reason: 404 rather than a message distinguishing "no
    // such contact" from "not yours", which would make this an existence oracle.
    if (err instanceof UnknownInviteeError) {
      return json(404, { error: scrub(err.message) })
    }

    // A BAD ADDRESS, OR ONE ALREADY TAKEN, IS THE OPERATOR'S TYPO ([[BUG-54]]) —
    // 400 carrying the sentence, because the fields panel prints it beside the
    // box that is wrong. Reported as the generic 500 below it would say "the
    // builder broke" for a missing `.` and give them nothing to correct.
    if (err instanceof InvalidPersonRecordError) {
      return json(400, { error: scrub(err.message) })
    }

    // AN ID THAT NAMES NOBODY IN THIS BUSINESS IS 404 — the same non-oracle
    // answer `/api/people/detail` gives, and for the same reason: not found and
    // not yours must be indistinguishable, or the route becomes the existence
    // oracle `identity.ts` and `scope.ts` both refuse to be.
    if (err instanceof UnknownPersonError) {
      return json(404, { error: scrub(err.message) })
    }

    if (err instanceof CommandError) {
      return json(400, { error: scrub(err.message), ...err.toEnvelope() })
    }
    // A draft that does not validate is the AUTHOR'S error, like a rejected
    // change map — 400, carrying the path-pointed errors so the toolbar can say
    // which field is wrong rather than "publish failed". It is deliberately not
    // folded into `CommandError`: this one carries a LIST of errors, and
    // flattening it to a single code/path/hint would throw away the part the
    // author needs.
    if (err instanceof InvalidDefinitionError) {
      return json(400, {
        error: scrub(err.message),
        code: 'INVALID_DEFINITION',
        errors: err.errors.map((e) => ({ path: e.path, message: scrub(e.message) })),
      })
    }
    /*
     * [[REQ-238]] — A SITE WITH NO PUBLIC ADDRESS CANNOT BE PUBLISHED. 409 and
     * not 400: the request is perfectly well formed and the draft is perfectly
     * valid — what is missing is a decision nobody has made yet, and the state
     * of the business is what makes the call refusable. That is the same
     * distinction `/api/business/name` draws between its 409 and its 400.
     *
     * MAPPED HERE AND NOT AT THE ROUTE, like `InvalidDefinitionError` above it
     * and for the reason that one gives: catching it locally would mean building
     * an `error:` value outside the one place that scrubs them, and the next
     * route to refuse a publish would inherit the omission.
     *
     * THE MESSAGE IS THE ERROR'S, AND IT NAMES BOTH THINGS THAT WOULD FIX IT —
     * a `1stc.site` hostname, or a domain the business owns. Writing a second
     * sentence here is how the toolbar and the assistant would come to describe
     * one refusal two ways.
     */
    if (err instanceof NoPublicAddressError) {
      return json(409, { error: scrub(err.message), code: NO_PUBLIC_ADDRESS_CODE })
    }
    // [[REQ-163]] — three refusals a client can act on, and each carries the
    // status that says WHOSE problem it is.
    //
    // A file over the ceiling, or one nothing can store, is 413/400: the request
    // is wrong and the message says how ([[DOC-38]] §14 asks for "a clear
    // rejection rather than an out-of-memory", and a clear rejection is one the
    // person who dragged the file can act on). An address the guard refuses is
    // 400 for the same reason — it is not a server failure and it is not a
    // permission the caller could be granted.
    //
    // Promotion of a non-republishable source is 403 and NOT 400, because the
    // request is perfectly well formed: it is forbidden. That distinction is the
    // whole of [[DOC-38]] §5 — the most damaging single action available in the
    // system is refused as a matter of RIGHTS, not of syntax.
    if (err instanceof MaterialRejectedError) {
      return json(err.message.includes('the limit is') ? 413 : 400, { error: scrub(err.message) })
    }
    if (err instanceof FetchRefusedError) {
      return json(400, { error: scrub(err.message), url: err.url })
    }
    if (err instanceof NotRepublishableError) {
      return json(403, { error: scrub(err.message), uid: err.uid })
    }
    // AND 403 FOR THE SAME REASON ([[REQ-213]]). Correcting the role of material
    // whose role was never chosen is the well-formed request the paragraph above
    // is about — it is refused as a matter of rights, not of syntax, and it is
    // refused by the same §5 gate one step earlier.
    if (err instanceof RoleNotChosenError) {
      return json(403, { error: scrub(err.message), uid: err.uid })
    }
    // AND 403 FOR THE THIRD TIME ([[REQ-220]]). Asking for a crop of a font, a PDF
    // or a capture is the well-formed request the paragraphs above are about: no
    // other body would make it mean something, so it is not a 400.
    if (err instanceof NotAPictureError) {
      return json(403, { error: scrub(err.message), uid: err.uid })
    }
    // A REFUSED RECIPE IS A 409, AND THE DIFFERENCE FROM THE 403 ABOVE IS WHETHER
    // ANOTHER BODY COULD EVER SUCCEED ([[REQ-219]], [[REQ-220]]). *"That would
    // leave nothing of a 400×300 picture"* is a conflict with the picture as it
    // currently stands — trim less, or resize first, and the same route takes it.
    // The sentence is `image-recipe.ts`'s own, written for the person who asked,
    // and it reaches the modal unaltered because inventing a second wording here
    // is how the assistant and the editor come to explain the same refusal two
    // different ways.
    if (err instanceof RecipeRefusedError) {
      return json(409, { error: scrub(err.message) })
    }
    // 409 AND NOT 403, AND THE DIFFERENCE IS WHETHER IT COULD EVER SUCCEED
    // ([[REQ-213]]). Everything above is forbidden and stays forbidden however
    // the deployment changes. This is a conflict with the material's CURRENT
    // state: the same client may make the same change the moment the file is off
    // their site, so answering it as a permission would tell them to stop trying.
    if (err instanceof AlreadyOnSiteError) {
      return json(409, { error: scrub(err.message), uid: err.uid, placed_on: err.placedOn })
    }
    // 404 AND NOT 403 ([[REQ-161]]). The uid names nothing this surface reaches:
    // either it does not exist or it is a ticket of another kind. The two are
    // answered identically on purpose — distinguishing them would turn the
    // Library's read routes into an oracle for which uids exist in the tenant.
    if (err instanceof NotMaterialError) {
      return json(404, { error: scrub(err.message), uid: err.uid })
    }
    const message = err instanceof Error ? err.message : String(err)
    return json(500, { error: scrub(message) })
  }
}

/**
 * One turn, as the `data: {json}` frames the chat panel consumes.
 *
 * THE FRAMING IS THE CLIENT'S, not a standard SSE library's: `api.js` splits on
 * a blank line and parses what follows `data:`. Restating it here rather than
 * reaching for `text/event-stream` niceties keeps the two halves obviously the
 * same shape.
 *
 * THE AUDIT IS FLUSHED IN A `finally`, INSIDE THE STREAM. That placement is the
 * whole of AC3 and is not incidental:
 *
 *   - it is inside the stream, so it happens while the response is still open
 *     and the isolate is still alive. A Worker may be torn down the moment the
 *     response completes;
 *   - it is in a `finally`, so an abandoned or failed turn still records what it
 *     managed to do. An audit that only survives success is not an audit.
 *
 * AND THE `finally` IS NOW HELD OPEN BY `ctx.waitUntil` (BUG-46). This comment
 * used to say `ctx.waitUntil` was not reachable from here, which was true of
 * the code and not of the runtime — nothing had threaded the `ExecutionContext`
 * this far. It cost an operator a turn. A reload aborts the SSE, the next
 * `controller.enqueue` throws on the cancelled stream, that runs the generator's
 * `finally` — where the library appends `turn_end` and awaits `sync()` — and
 * that drain is a multi-round-trip D1 sequence starting AFTER the client has
 * gone, with nothing left holding the request open. The turn's tool calls had
 * already committed; only the transcript died. Registering the stream's
 * completion means the drain and this audit flush both outlive the client that
 * walked away, which is what makes a COMPLETED turn durable under a reload race.
 *
 * It does not make an in-flight turn durable — that is the junction's business,
 * and in this Worker the junction is RAM (`ai.ts`), so an isolate evicted
 * mid-turn still loses it. Rendering from the junction is what narrows the
 * window; only a Durable Object would close it.
 *
 * AN ERROR MID-TURN BECOMES A FRAME, not a torn connection. The status line went
 * out with the first byte, so there is no status code left to change — the panel
 * has to be told in the channel it is already reading, and a dropped socket
 * would render as a turn that simply stopped.
 *
 * AND AN UNCATCHABLE END BECOMES AN UNCLOSED ROW ([[REQ-306]]). Every paragraph
 * above assumes some line of this function still runs; an isolate killed
 * mid-stream — `exceededMemory` is what happened, but a CPU-time overrun or an
 * eviction is the same shape — runs none of them. No `catch`, so no frame. No
 * `finally`, so no audit, no meter, no `turn_end`. The client is left a 200 with
 * an empty body and the operator is left a platform tail entry to go and find.
 * The `ledger` this now takes was opened by the ROUTE before the `Response`
 * existed, precisely so that the ONE thing which cannot be written from inside a
 * dead isolate — that the turn ended at all — is recorded by the absence of the
 * close below rather than by the presence of anything.
 */
function streamTurn(
  host: WorkerHost,
  sessionId: string,
  text: string,
  scrub: (text: string) => string,
  ctx?: RouteContext,
  ledger?: OpenTurn | null,
): Response {
  const encoder = new TextEncoder()
  const frame = (event: unknown): Uint8Array =>
    encoder.encode(`data: ${JSON.stringify(event)}\n\n`)

  // WHAT `waitUntil` IS GIVEN, and why it is a promise of its own rather than
  // whatever `start` returns. The runtime needs one promise that settles when
  // the WORK is done, and it must never reject: a rejected `waitUntil` is an
  // invocation error, and every failure worth reporting here has already been
  // sent to the client as a frame or deliberately swallowed below.
  let settle = (): void => {}
  const drained = new Promise<void>((resolve) => {
    settle = resolve
  })
  ctx?.waitUntil(drained)

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // ENQUEUEING ONTO A STREAM THE CLIENT MAY HAVE ABANDONED THROWS, and that
      // throw is load-bearing on the happy path — it is how an aborted SSE stops
      // the turn, and the library records the result as `aborted` rather than
      // discarding it. So it is caught where it must not propagate (the error
      // path, and the close below) and left to propagate where it must (the
      // loop). What changed in BUG-46 is only who is holding the isolate open
      // while the resulting drain runs.
      const tell = (event: unknown): void => {
        try {
          controller.enqueue(frame(event))
        } catch {
          // The reader is gone. Nothing to say and nobody to say it to.
        }
      }
      /**
       * HOW THIS TURN ENDED, FOR THE LEDGER ([[REQ-306]]).
       *
       * `aborted` UNTIL SOMETHING SAYS OTHERWISE, which is `streamPrompt`'s own
       * initial value for the same variable and for the same reason: a turn
       * whose consumer walks away runs neither the success path nor the error
       * path, and the honest word for what it managed is the one that does not
       * claim either.
       *
       * OFF THE TERMINAL FRAME AND NOT OFF A SECOND JUDGEMENT. The library
       * already decided what became of the turn and stamps it on the `done`
       * event's `meta.status`; reading it here is transcription, so the ledger
       * and the meter cannot disagree about one turn.
       */
      let outcome: TurnLogOutcome = 'aborted'
      let detail: string | null = null
      try {
        for await (const event of streamPrompt(sessionId, text, {}, host.deps)) {
          if (event.kind === 'done') {
            const status = typeof event.meta?.status === 'string' ? event.meta.status : ''
            outcome = status === 'error' ? 'error' : status === 'aborted' ? 'aborted' : 'complete'
          }
          controller.enqueue(frame(event))
        }
      } catch (err) {
        const message =
          err instanceof UnknownSessionError
            ? 'That conversation is no longer open — reload the builder to start it again.'
            : err instanceof Error
              ? err.message
              : String(err)
        outcome = 'error'
        // SCRUBBED FOR THE LEDGER TOO, and not only for the client. The row is
        // read back by an operator surface and by the panel's own recovery, so a
        // credential in the message would have been persisted rather than merely
        // shown once.
        detail = scrub(message)
        // The backend is the one component here that holds the credential, so
        // this is the error path most likely to carry it — AC4.
        tell({ kind: 'text', content: `\n\n_${scrub(message)}_` })
        tell({ kind: 'done' })
      } finally {
        /**
         * THE LEDGER'S OTHER HALF ([[REQ-306]]), first in the block and beside
         * the audit flush for the audit flush's stated reason: it is inside the
         * stream, so it happens while the isolate is still alive, and it is in a
         * `finally`, so an abandoned turn is closed as abandoned rather than left
         * looking like a death. What makes it worth anything is that it is the
         * half that CAN fail to run — a row still open long after it was written
         * is the record of an isolate that did not survive to reach this line,
         * and nothing inside that isolate could ever have written that down.
         */
        try {
          await ledger?.close(outcome, detail)
        } catch {
          // Deliberately swallowed, like the flush below: a ledger is a safety
          // net, and a net that fails the turn has made matters worse.
        }
        // Durable before the response ends. A failure to write the audit must
        // not also fail the turn the operator already had — the records are
        // gone either way, and taking the answer with them helps nobody.
        try {
          await host.flush(sessionId)
        } catch {
          // Deliberately swallowed; see above.
        }
        try {
          controller.close()
        } catch {
          // Already cancelled by the client; closing it again is not an error
          // worth failing the drain over.
        }
        // LAST, unconditionally. Everything above has either finished or been
        // swallowed, so this is the moment the isolate is genuinely free to go.
        settle()
      }
    },
  })

  return new Response(stream, {
    status: 200,
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      // The turn is generated as it goes; a proxy holding it back would turn a
      // streaming answer into a long silence and then a wall of text.
      'x-content-type-options': 'nosniff',
    },
  })
}

/**
 * The tail from `cursor`, as the SAME `data: {json}` frames {@link streamTurn}
 * sends (BUG-46).
 *
 * SAME FRAMING BECAUSE IT IS THE SAME CONVERSATION. `host-core.ts` projects the
 * junction's records into the library's stream vocabulary, so what arrives here
 * is already what a live turn yields — which is what lets the pane's existing
 * SSE reader consume a reattach with no idea it is one. A second frame shape
 * would be a second parser to keep in step for no gain.
 *
 * A SHORTER `finally` THAN THE PROMPT ROUTE'S, and deliberately so: there is no
 * audit to flush and no drain to protect, because a subscriber writes nothing.
 * Closing the controller is the whole of it.
 */
function streamTail(
  host: WorkerHost,
  sessionId: string,
  cursor: number,
  scrub: (text: string) => string,
): Response {
  const encoder = new TextEncoder()
  const frame = (event: unknown): Uint8Array =>
    encoder.encode(`data: ${JSON.stringify(event)}\n\n`)

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of tailSession(sessionId, cursor, {}, host.deps)) {
          controller.enqueue(frame(event))
        }
      } catch (err) {
        const message =
          err instanceof UnknownSessionError
            ? 'That conversation is no longer open — reload the builder to start it again.'
            : err instanceof Error
              ? err.message
              : String(err)
        try {
          // Scrubbed on the same grounds the prompt route scrubs (AC4): this is
          // a different route but the same secrets and the same operator.
          controller.enqueue(frame({ kind: 'text', content: `\n\n_${scrub(message)}_` }))
          controller.enqueue(frame({ kind: 'done' }))
        } catch {
          // The reader is gone; a reattach nobody is reading needs no epilogue.
        }
      } finally {
        try {
          controller.close()
        } catch {
          // Already cancelled by the client.
        }
      }
    },
  })

  return new Response(stream, {
    status: 200,
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'x-content-type-options': 'nosniff',
    },
  })
}

/**
 * The Library's material, as a live stream of changes ([[REQ-201]], [[DOC-24]]).
 *
 * SAME FRAMING AS {@link streamTurn} AND {@link streamTail} — `data: {json}` and
 * a blank line — plus the one thing those two have no use for: an `id:` line
 * carrying the change cursor. That single addition is what makes reconnect free.
 * A browser's `EventSource` remembers the last `id:` it saw and re-presents it
 * as `Last-Event-ID`, so a dropped connection resumes at the exact record it
 * stopped on, through code nobody wrote. Reconnect with backoff is the part of a
 * subscription least worth implementing twice.
 *
 * A `ready` FRAME GOES OUT FIRST, AND IT IS NOT A GREETING. It carries the
 * cursor this connection actually opened at, as its `id:`. Without it a
 * connection that drops before the first real event leaves `Last-Event-ID`
 * unset, and the reconnect starts from "now" — silently skipping everything that
 * happened in between. Seeding the id is what makes the gap unconstructible.
 *
 * WHAT THE HEARTBEAT IS FOR. An SSE comment (`: ping`) every
 * {@link SSE_HEARTBEAT_MS} keeps an idle connection from being reaped by an
 * intermediary. A reap is survivable — the cursor makes the reconnect lossless —
 * but it is a reconnect per idle period on every open tab, for nothing.
 *
 * NOTHING HERE IS HELD OPEN WITH `waitUntil`, and the omission is deliberate on
 * the grounds {@link streamTail} states: a subscriber WRITES NOTHING. There is
 * no audit to flush and no drain to protect, so when the client goes there is
 * genuinely nothing left to finish.
 *
 * TEARDOWN IS THE PART THAT MATTERS. A tailer polls on an interval, so a
 * subscription outliving its reader is a timer reading D1 for nobody. It is
 * reached two ways, because a client can leave two ways: `cancel` fires when the
 * stream is dropped, and a failed `enqueue` catches the case where the write is
 * what discovers it.
 */
function streamMaterialChanges(store: TicketStore, since: number | null): Response {
  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // OMITTED `since` MEANS "FROM NOW", and the head is resolved here rather
      // than left to the component so the `ready` frame can state it. A cursor
      // the client cannot see is a cursor it cannot resume from.
      const cursor = since ?? (await store.accessor.changeHead())

      let live = true
      let heartbeat: ReturnType<typeof setInterval> | null = null
      let subscriptions: TicketSubscription[] = []

      const teardown = (): void => {
        if (!live) return
        live = false
        if (heartbeat != null) clearInterval(heartbeat)
        heartbeat = null
        for (const sub of subscriptions) sub.close()
        // BOTH, because they answer different questions. Closing the
        // subscriptions drops the handlers; `closeWatches` stops the store's
        // shared tailer and its timer, which is the thing actually reading D1.
        store.closeWatches()
        try {
          controller.close()
        } catch {
          // Already cancelled by the client; closing it twice is not a failure
          // worth reporting to nobody.
        }
      }

      /**
       * Write one frame, and treat a failure as the client having left.
       *
       * ENQUEUEING ONTO AN ABANDONED STREAM THROWS, and that throw is the most
       * reliable signal there is that the reader has gone — more reliable than
       * `cancel`, which a runtime is not obliged to deliver promptly. Returning
       * false rather than rethrowing is what lets the caller stop cleanly.
       */
      const write = (text: string): boolean => {
        if (!live) return false
        try {
          controller.enqueue(encoder.encode(text))
          return true
        } catch {
          teardown()
          return false
        }
      }

      const send = (seq: number, event: unknown): boolean =>
        write(`id: ${seq}\ndata: ${JSON.stringify(event)}\n\n`)

      // The cursor, stated, before anything can move it. See the header.
      if (!send(cursor, { kind: 'ready', seq: cursor })) return

      try {
        subscriptions = await watchMaterial(
          store,
          cursor,
          (change: MaterialChange) => {
            // A FALSE RETURN IS NOT SWALLOWED. `watchMaterial` promises the
            // component's contract — a throwing handler leaves the cursor where
            // it was — so a frame that could not be written must throw rather
            // than let the subscription advance past an event nobody received.
            // The subscription is already torn down by then; this only keeps the
            // record from being marked delivered.
            if (!send(change.seq, change)) throw new StreamClosedError()
          },
          {
            /**
             * The cursor predates the retention floor ([[DOC-24]] §6.4).
             *
             * A partial history is worse than none, because the consumer cannot
             * tell it from a complete one. So the client is TOLD, and falls back
             * to the full re-read it already has — `refresh()`, the path a
             * business switch uses. Saying nothing here is the failure mode this
             * whole design exists to remove.
             */
            onReset: ({ floor }) => {
              send(floor, { kind: 'reset', seq: floor })
            },
          },
        )
      } catch (err) {
        // A REFUSED SUBSCRIPTION IS A FRAME, not a torn connection. The status
        // line went out with the `ready` frame, so there is no status code left
        // to change and the honest place to report it is the channel the client
        // is already reading.
        if (!(err instanceof StreamClosedError)) {
          send(cursor, { kind: 'error', message: err instanceof Error ? err.message : String(err) })
        }
        teardown()
        return
      }

      heartbeat = setInterval(() => {
        // A COMMENT FRAME, which SSE defines and every client ignores — the
        // cheapest thing that is still bytes on the wire.
        write(`: ping\n\n`)
      }, SSE_HEARTBEAT_MS)
      // A heartbeat must never be the reason a runtime holds an isolate open.
      if (typeof (heartbeat as { unref?: () => void })?.unref === 'function') {
        ;(heartbeat as unknown as { unref: () => void }).unref()
      }
    },

    cancel() {
      // The other way a client leaves. `teardown` is idempotent, so whichever of
      // the two arrives first is the one that does the work.
      store.closeWatches()
    },
  })

  return new Response(stream, {
    status: 200,
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'x-content-type-options': 'nosniff',
      // A change feed that a proxy answered from cache would be a tab watching a
      // recording of a conversation that has moved on.
      'cache-control': 'no-store',
    },
  })
}

/**
 * The Contacts pane's people, as a live stream of changes ([[REQ-233]]).
 *
 * SAME WIRE FORMAT AS {@link streamMaterialChanges} — `id:` + `data:` + a blank
 * line, a `ready` frame first carrying the cursor this connection opened at, and
 * a `: ping` comment on an idle connection so nothing reaps it. Written as its
 * own function rather than shared with that one because the two differ in the
 * half that matters: material rides a ticket-store change LOG with a monotonic
 * counter and a retention floor, and a contact is a `users` row whose cursor is
 * a clock. Factoring the shell out would leave a parameterised thing whose
 * parameters are precisely the interesting parts.
 *
 * IT POLLS D1 HERE SO THE TAB DOES NOT POLL THE ORIGIN. One connection per open
 * pane asking a scoped, indexed question every couple of seconds is cheaper than
 * the same tab issuing a full `/api/people` read on a timer — and it is the only
 * shape in which a lead captured on the published site can reach an already-open
 * pane at all.
 *
 * `delivered` IS THE WHOLE OF WHY A LOOKBACK IS AFFORDABLE. Each poll reads from
 * {@link CONTACT_CHANGE_LOOKBACK_MS} BEFORE the cursor, because the cursor is a
 * wall clock and two isolates do not agree to the millisecond — a row stamped
 * just behind an already-advanced cursor would otherwise be a contact that never
 * appears. Re-reading that window costs a scoped index scan; re-SENDING it every
 * two seconds would rebuild every row on screen for ever, so what has already
 * gone out is remembered by `(id → seq)` and skipped, and entries that fall out
 * of the window are dropped.
 *
 * NOTHING IS HELD OPEN WITH `waitUntil`, on the grounds {@link streamMaterialChanges}
 * states: a subscriber WRITES NOTHING, so when the client goes there is nothing
 * left to finish.
 *
 * TEARDOWN IS THE PART THAT MATTERS. A timer reading D1 for nobody is the one
 * way this feature can cost money while doing nothing, so it is reached both
 * ways a client can leave: `cancel` when the stream is dropped, and a failed
 * `enqueue` when the write is what discovers it.
 */
function streamContactChanges(
  env: IdentityEnv,
  scope: Scope,
  since: string | null,
  pollMs: number,
): Response {
  const encoder = new TextEncoder()

  // HOISTED OUT OF `start` SO `cancel` CAN REACH IT. A client that simply drops
  // the stream writes nothing and reads nothing, so without this the interval
  // would keep reading D1 until the next heartbeat's `enqueue` happened to
  // fail — up to {@link SSE_HEARTBEAT_MS} of polling for a reader that has gone.
  let stop = (): void => {}

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // OMITTED `since` MEANS "FROM NOW", and the head is resolved here rather
      // than left to the poll so the `ready` frame can state it. A cursor the
      // client cannot see is a cursor it cannot resume from.
      let cursor = since ?? (await contactChangeHead(env, scope))

      let live = true
      let timer: ReturnType<typeof setInterval> | null = null
      let polling = false
      let lastWrite = Date.now()
      /** What has already gone out, by person, within the lookback window. */
      const delivered = new Map<string, string>()

      const teardown = (): void => {
        if (!live) return
        live = false
        if (timer != null) clearInterval(timer)
        timer = null
        try {
          controller.close()
        } catch {
          // Already cancelled by the client; closing it twice is not a failure
          // worth reporting to nobody.
        }
      }

      /** Write one frame, and treat a failure as the client having left. */
      const write = (text: string): boolean => {
        if (!live) return false
        try {
          controller.enqueue(encoder.encode(text))
          lastWrite = Date.now()
          return true
        } catch {
          teardown()
          return false
        }
      }

      const send = (seq: string, event: unknown): boolean =>
        write(`id: ${seq}\ndata: ${JSON.stringify(event)}\n\n`)

      stop = teardown

      // The cursor, stated, before anything can move it. See the header.
      if (!send(cursor, { kind: 'ready', seq: cursor })) return

      const tick = async (): Promise<void> => {
        // A POLL THAT OVERRUNS ITS INTERVAL MUST NOT STACK. D1 under load is the
        // case, and two overlapping polls would both read the same window and
        // both try to advance the same cursor.
        if (polling || !live) return
        polling = true
        try {
          const floor = windBack(cursor)
          const changes = await contactsChangedSince(env, scope, floor)
          const fresh = changes.filter((change) => delivered.get(change.person.id) !== change.seq)
          for (const change of fresh) {
            if (!send(change.seq, { kind: 'contact', ...change })) return
            delivered.set(change.person.id, change.seq)
          }
          // ADVANCED PAST WHAT WAS READ, NOT PAST WHAT WAS SENT. The skipped rows
          // are ones this connection already delivered, so leaving the cursor
          // behind them would re-read the same window for ever.
          //
          // AND FORWARD ONLY. The window starts BEHIND the cursor, so a batch
          // large enough to fill {@link CONTACT_CHANGE_LIMIT} entirely out of the
          // lookback could otherwise end on a row older than where we already
          // were — which would wind the cursor back, widen the window again, and
          // read the same rows for ever.
          const last = changes.at(-1)
          if (last && last.seq > cursor) cursor = last.seq
          // A remembered delivery older than the window can never be read again,
          // so holding it would make an all-day subscription grow without bound.
          for (const [id, seq] of delivered) if (seq < floor) delivered.delete(id)
          if (Date.now() - lastWrite >= SSE_HEARTBEAT_MS) write(': ping\n\n')
        } catch {
          // A TRANSIENT READ FAILURE IS NOT THE END OF THE SUBSCRIPTION. The
          // cursor has not moved, so the next tick reads the same window and the
          // client loses nothing — and there is no operator-facing thing to say
          // about one failed poll that the next one repairs.
        } finally {
          polling = false
        }
      }

      timer = setInterval(() => void tick(), pollMs)
      // A poll must never be the reason a runtime holds an isolate open.
      if (typeof (timer as { unref?: () => void })?.unref === 'function') {
        ;(timer as unknown as { unref: () => void }).unref()
      }
    },

    cancel() {
      // The other way a client leaves. `teardown` is idempotent, so whichever of
      // the two arrives first is the one that does the work.
      stop()
    },
  })

  return new Response(stream, {
    status: 200,
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'x-content-type-options': 'nosniff',
      // A change feed a proxy answered from cache would be a pane watching a
      // recording of a list that has moved on.
      'cache-control': 'no-store',
    },
  })
}

/**
 * A publish, as the `data: {json}` frames the builder consumes ([[REQ-222]]).
 *
 * WHY A PUBLISH STREAMS AT ALL. Building the ladder decodes and re-encodes every
 * picture on the site, which on a photo-heavy site's FIRST publish is minutes.
 * A toolbar button that goes quiet for a minute reads as a hang, and a client who
 * reloads mid-publish is a client who has learned not to trust the button. The
 * budget for this work is explicitly *minutes with explanation*, so the
 * explanation is part of the deliverable rather than a nicety.
 *
 * THE SAME FRAMING AS EVERY OTHER SSE ROUTE HERE — `data:` then a blank line —
 * because `api.js` has one split-on-blank-line parser and a fourth caller of it
 * is not a new transport. A second frame shape would be a second parser to keep
 * in step for no gain.
 *
 * THE ONE REAL DESIGN COST, NAMED: A FAILURE AFTER THE HEADERS ARE SENT. The
 * response has already committed `200` by the time the first rendition is built,
 * so a publish that fails midway cannot report itself as an HTTP status. Hence:
 *
 *   - the TERMINAL frame distinguishes success from failure explicitly, in the
 *     frame rather than in the status. `{kind:'done', ok:true, …}` carries exactly
 *     what the JSON form's body carries; `{kind:'done', ok:false, error}` carries
 *     the sentence;
 *   - and the CLIENT must read a stream that ends WITHOUT a terminal frame as a
 *     failure. A dropped connection rendering as a completed publish is the worst
 *     outcome available here — the client would believe a site is live that is
 *     not — so the contract is stated on both sides and tested on both.
 *
 * THE ERROR SENTENCE GOES THROUGH `scrub`, like every other error this router
 * emits. An over-budget ladder is written for the client and names only the
 * site's own facts, but it reaches here as an ordinary `Error` and must not be the
 * one place a message escapes the scrubber.
 */
function streamPublish<T>(
  run: (onLadderProgress: LadderProgressReporter) => Promise<T>,
  answer: (result: T) => Promise<unknown>,
  scrub: (message: string) => string,
): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      /**
       * One frame, or nothing if the client has gone.
       *
       * SWALLOWED RATHER THAN THROWN, because a client that closed the tab is an
       * ordinary way for a publish to be watched and not an ordinary way for one
       * to fail. The publish itself is already past the point where it could be
       * abandoned — every rendition it built is in the cache and the revision it
       * writes is the revision it would have written — so there is nothing to
       * report and nobody to report it to.
       */
      const write = (frame: unknown): void => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(frame)}\n\n`))
        } catch {
          // The client left. See above.
        }
      }

      try {
        // THE PLAN FRAME IS THE FIRST THING THE LADDER SAYS, and the builder's
        // whole decision rests on it: a total of zero means there is nothing to
        // resize, so nothing about resizing is shown. That is why this is the
        // ladder's own progress rather than a step count invented here — only the
        // ladder knows what the cache already holds.
        const result = await run((progress) => write({ kind: 'progress', ...progress }))
        write({ kind: 'done', ok: true, ...((await answer(result)) as object) })
      } catch (err) {
        write({
          kind: 'done',
          ok: false,
          error: scrub(err instanceof Error ? err.message : String(err)),
        })
      } finally {
        try {
          controller.close()
        } catch {
          // Already cancelled by the client; closing it twice is not a failure.
        }
      }
    },
  })

  return new Response(stream, {
    status: 200,
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'x-content-type-options': 'nosniff',
      // A publish a proxy answered from cache would be a button that reported
      // the last publish's outcome for this one.
      'cache-control': 'no-store',
    },
  })
}

/** How often an idle change feed says something, so nothing reaps it. */
const SSE_HEARTBEAT_MS = 20_000

/**
 * Raised inside a change handler when the frame could not be written.
 *
 * A TYPE RATHER THAN A BARE `Error` so the registration path above can tell "the
 * client left mid-subscribe" from "the subscription was refused" — the first has
 * nobody left to report to and the second must be reported.
 */
class StreamClosedError extends Error {
  readonly name = 'StreamClosedError'
}

/**
 * One gated artifact, out of the DRAFT ([[BUG-97]]).
 *
 * IT IS `public-site`'s `deliver` WITH THE CHANNEL CHANGED, and the two are
 * deliberately not one function: that one reads a published revision's objects
 * out of R2 by prefix, this one asks the draft renderer, and the only thing they
 * share is the rule about what an `assets[].url` MEANS. That rule is restated
 * here rather than imported because it is four lines and the import would be an
 * app depending on another app's Worker.
 *
 * AN ABSOLUTE URL IS A REDIRECT AND NOT A REFUSAL, exactly as it is on the
 * published side. `assets[].url` is a free `url` an author types and every one in
 * the stores today points off-site; refusing them would break every gated
 * download that exists for no visitor's benefit. It is not an open redirect: the
 * value is authored by the site's own operator, reached only through a valid
 * token, and nothing a caller sends arrives here.
 *
 * A SITE-RELATIVE URL IS A DRAFT ASSET, served by {@link servePreview} — which is
 * what serves every other draft byte, and therefore applies the same refusals to
 * a path that tries to leave the site. The query and fragment are dropped for the
 * reason the published side drops them: what follows is a store key, and `?v=2`
 * would name an object nobody wrote.
 */
async function deliverDraftArtifact(
  store: SiteStore,
  site: string,
  url: string,
): Promise<Response> {
  if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//')) {
    return new Response(null, {
      status: 302,
      headers: { location: url, 'cache-control': GATE_CACHE },
    })
  }
  const rel = url.split('#')[0].split('?')[0].replace(/^\/+/, '')
  // A COMPONENT THAT LOOKS LIKE TRAVERSAL IS REFUSED rather than resolved, on
  // `routes.ts`'s reasoning: a store key is built by concatenation, and a
  // component whose meaning depends on who reads it is one to refuse outright.
  if (rel === '' || rel.split('/').some((part) => part === '.' || part === '..')) {
    return text(404, 'Not found')
  }
  const served = await servePreview(store, site, 'draft', `/${rel}`)
  if (served.status !== 200) return served
  // THE GATE'S OWN HEADERS ON THE WAY OUT. A per-contact artifact must not reach
  // a shared cache or an index, and `servePreview` says nothing about either
  // because every other byte it serves is an operator looking at their own draft.
  //
  // `cache-control` IS THEN RESTAMPED BY `uncacheable`, and that is not a reason
  // to leave it unset here. What arrives is `NO_STORE`, which is strictly
  // stronger than the gate's `private, no-store` — bare `no-store` forbids
  // storage by any cache at all — so the property holds either way, and setting
  // it means it still holds if this response ever leaves by another door.
  // `x-robots-tag` has no such backstop, which is the half that is load-bearing.
  const headers = new Headers(served.headers)
  for (const [name, value] of Object.entries(GATE_HEADERS)) headers.set(name, value)
  return new Response(served.body, { status: 200, headers })
}

/** Render `rel` out of a draft-side channel and answer with it. */
async function servePreview(
  store: SiteStore,
  site: string,
  channel: PreviewChannel,
  rel: string,
): Promise<Response> {
  let file
  try {
    file = await previewRenderer(store).file(site, channel, rel)
  } catch (err) {
    // A definition that no longer validates is the one failure this route can
    // hit that the OPERATOR can fix, and it is visible the moment it happens
    // rather than hidden behind the last good render. It answers in the iframe,
    // as a page, because that is where they are looking — a JSON envelope would
    // render as a wall of escaped text.
    if (!(err instanceof InvalidDefinitionError)) throw err
    const body = `<!doctype html><meta charset="utf-8"><title>Invalid draft</title>
<body style="font:14px/1.6 ui-monospace,monospace;padding:2rem;color:#b00">
<h1 style="font-size:1rem">This draft does not validate</h1>
<pre>${escapeHtml(err.errors.map((e) => `${e.path}: ${e.message}`).join('\n'))}</pre>
</body>`
    return new Response(body, {
      status: 500,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    })
  }

  if (!file) return text(404, 'Not found')
  // Text or bytes, one response. An asset arrives as bytes rather than as a
  // filename to stream: the store owns where they live, and a store with no
  // filesystem has no name to hand over.
  // Cast because this module is typechecked under two libs: the Worker's, where
  // a Uint8Array is a BodyInit, and tools/generate's, where the DOM's narrower
  // union does not name it. The runtime accepts both.
  const body = (file.kind === 'text' ? file.body : file.body) as unknown as BodyInit
  return new Response(body, {
    status: 200,
    headers: { 'content-type': file.contentType },
  })
}
