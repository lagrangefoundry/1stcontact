import {
  ATTACHMENT_SCHEMA,
  ATTACHMENT_TYPE,
  Accessor,
  MultiTenantTicketStore,
  R2BlobStore,
  TypePack,
} from './generated/ticketing'
import { chatSchemas } from './generated/ai-workers'
import {
  AWARENESS_REPORT_KIND,
  AWARENESS_REPORT_TYPE,
  KB_FIELD,
} from './generated/knowledge'

/**
 * The product ticket store (REQ-162) — [[DOC-38]] §6, [[DOC-10]] §8.
 *
 * WHAT THIS IS FOR. The site store (`store.ts`) holds *sites*. This holds
 * everything a site is made **from**: the client's uploads, the background the
 * assistant fetched, the capture bundles it re-maps from, the brief recording
 * what was decided — and the conversations themselves. [[DOC-38]] §6 rests on
 * every one of those being a ticket, and until this file existed none of them
 * could be: there was no schema, no store, and no type pack of any kind.
 *
 * TENANCY IS BOUND INTO THE HANDLE, NEVER PASSED PER CALL. `forTenant` returns a
 * store whose accessor carries `WHERE tenant_id = ?` on every read and stamps it
 * on every write, and whose blob handle prefixes every key. That is [[DOC-10]]
 * §4.1's information barrier expressed structurally: no call site is trusted to
 * remember the tenant, because no call site is given the chance to forget it.
 * The scoped handle is also terminal — `forTenant` on it throws — so holding one
 * tenant's store conveys no reach into another's.
 *
 * THE BYTES ARE NOT IN `SITES`, and that is the point of {@link TicketStoreEnv}
 * carrying a second bucket. See `wrangler.toml` for the argument at length; the
 * short form is that `1stcontact-sites` is bound by the Worker that serves the
 * public internet, and attachment blobs are the client's confidential material.
 */

/**
 * The rights and provenance record carried by every piece of material
 * ([[DOC-38]] §9).
 *
 * ONE BLOCK, SHARED BY `material` AND `reference`, rather than two that drift.
 * [[DOC-38]] §9 specifies the identical six fields for both types, and
 * [[REQ-159]]'s corpus predicate and [[REQ-161]]'s Library both query across the
 * two — a `fields.kind` that meant something subtly different depending on which
 * type answered would make every such query wrong in a way nothing would report.
 *
 * `republishable` AND `exportable` ARE REQUIRED, WHICH IS THE WHOLE POINT.
 * [[DOC-38]] §4.2 shows the two inverting between a client's own site (copy may
 * be republished; it must not leave the tenant as aggregate) and a third-party
 * reference (the opposite on both counts), so no rule derives either from
 * `rights` without being wrong for half the corpus. A DEFAULT WOULD BE SUCH A
 * RULE. Defaulting them to `false` was considered — it fails closed, which is
 * this repository's habit everywhere else — and rejected here, because the
 * failure it produces is not a refusal an operator sees: it is a corpus of
 * material silently marked unusable, indistinguishable from material genuinely
 * marked so. "Explicit" in §4.2 means the ingester states them, and the only way
 * to mean that is to refuse a create that does not.
 *
 * `source_url` is required exactly where it exists — material that was captured
 * or fetched came FROM somewhere, and an upload did not.
 */
const MATERIAL_FIELDS = {
  rights: { type: 'enum', enum: ['owned', 'licensed', 'third_party'], required: true },
  republishable: { type: 'boolean', required: true },
  exportable: { type: 'boolean', required: true },
  origin: {
    type: 'enum',
    enum: ['uploaded', 'captured', 'fetched', 'site'],
    required: true,
  },
  kind: { type: 'enum', enum: ['document', 'image', 'font', 'capture'], required: true },
  source_url: { type: 'string', required_when: 'origin in [captured, fetched]' },
  /** Which site this belongs to, where it belongs to one. Absent = tenant-wide. */
  site_slug: { type: 'string' },

  /**
   * What the client said the material is FOR — [[REQ-161]], [[DOC-38]] §4.2.
   *
   * THE ONE THING PROVENANCE CANNOT INFER. `origin` records where the bytes came
   * from and `kind` is read off the content type, so between them the system
   * already knows everything about the file EXCEPT what it is wanted for. The
   * case that proves the gap is a JPEG: a hero photograph destined for the site,
   * and a screenshot of a competitor the assistant should look at and must never
   * publish, are identical bytes with an identical content type and opposite
   * rights. No rule over `origin` and `kind` separates them.
   *
   * NOT A LEGAL QUESTION, WHICH IS WHY IT MAY BE ASKED AT ALL. [[DOC-38]] §10.1
   * refuses to ask *"do you own this?"* because the client frequently does not
   * know; *"is this for the site, or for me to read?"* is a question about their
   * own intention, which they answer instantly and correctly. So this narrows
   * §10.1's accepted residual risk without reintroducing the dialog it rejected.
   *
   * NOT REQUIRED, and deliberately not derivable from `republishable`. A capture
   * of the client's OWN previous site ([[DOC-38]] 3a) is `republishable` and yet
   * plainly reference material, so the two fields come apart the moment captures
   * land — which is why this is a field rather than a reading of that one. It is
   * absent on material created before anyone was asked.
   */
  role: { type: 'enum', enum: ['site', 'reference'] },

  /**
   * How the description in the body went — one mechanism for every degraded case
   * (REQ-163, `describe.ts`).
   *
   * DECLARED HERE RATHER THAN LEFT UNDECLARED, even though the engine tolerates
   * an undeclared field. The whole value of the status is that a later
   * re-describe pass is a QUERY (`fields.description_status = no_describer`)
   * rather than a migration, and a predicate over a field nothing declares is a
   * predicate over a convention.
   *
   * NOT REQUIRED, because a `reference` created by a capture has no description
   * at the moment its bundle lands — the same reason the body is not required.
   */
  description_status: {
    type: 'enum',
    enum: ['ok', 'no_describer', 'no_text', 'unsupported', 'too_large', 'failed'],
  },
  /**
   * Who wrote the description: a model id where a model wrote it, an extractor's
   * name (`unpdf`, `sfnt-name-table`, `text-decode`) where code did, absent where
   * nothing has.
   *
   * A plain string rather than an enum: the value is a MODEL ID as the API
   * returned it, and an enum would have to be widened for every model release —
   * turning "which describer wrote this" into a schema change.
   */
  description_model: { type: 'string' },
  /**
   * The name the file arrived under.
   *
   * Kept on the material even though the attachment record carries it too, and
   * the duplication is deliberate: the Library lists materials, and reading a
   * filename would otherwise cost an `attachments` call per row. It is also the
   * only handle a client recognises when the description is degraded.
   */
  filename: { type: 'string' },
}

/**
 * The product type pack — the types this platform's tickets come in.
 *
 * A pack is dev-time *configuration* over the component's one validation engine,
 * not a set of validator classes, so adding a type is adding a literal here.
 *
 * NO `status` VOCABULARY ON THE THREE NEW TYPES, deliberately. [[DOC-38]] §9
 * specifies six fields and no lifecycle, and a status enum invented here would
 * be a lifecycle nothing implements and every later ticket would have to honour.
 * The component already ships the one lifecycle these need — `archive` /
 * `unarchive`, which is a column and not a status — and `chat` brings its own
 * because [[DOC-10]] gave it one.
 */
export function productTypePack(): ProductTypePack {
  return TypePack.from({
    /**
     * Client uploads and fetched background — [[DOC-38]] 3c, 4a, 4b.
     *
     * ONE TYPE FOR ALL THREE. An uploaded PDF, a fetched industry report and an
     * uploaded photo are one shape — a blob with a text shadow and a rights
     * record — and differ by `kind`, not by type ([[DOC-38]] §9).
     *
     * The body is the AI-written text shadow: what the material SAYS, extracted
     * so it can be retrieved without pulling the bytes. Not required, because
     * the record is created when the blob arrives and the shadow is written
     * after — a material whose extraction has not run yet is an ordinary state,
     * not an invalid ticket.
     */
    material: {
      fields: { ...MATERIAL_FIELDS },
      body: { required: false },
    },

    /**
     * A capture bundle — [[DOC-38]] 3a, 3b.
     *
     * SEPARATE FROM `material`, which [[REQ-162]] recorded as the last cheap
     * moment to reverse and did not. Two reasons, both structural rather than
     * taxonomic: a capture is a multi-member bundle where a material is one
     * blob, and it has a lifecycle of its own — [[DOC-13]] §9's "capture once,
     * re-map forever", re-extraction, and gap logging into the module backlog.
     *
     * A BUNDLE IS N ATTACHMENT RECORDS ON ONE TICKET, one per member, each with
     * `meta.member` naming its role (`capture.json`, `screenshot.full.png`,
     * `assets/hero.jpg`). Not one record over a tar: re-extraction reads three
     * members selectively, and an archive would force a Worker to pull all
     * 11–23MB to read one of them. Because addressing is content-derived, a
     * recapture dedups against the previous one automatically — an unchanged
     * hero image is one blob across every capture that ever saw it.
     */
    reference: {
      fields: { ...MATERIAL_FIELDS },
      body: { required: false },
    },

    /**
     * The per-site canonical decisions document — [[DOC-9]], [[DOC-38]] §9.
     *
     * A TYPE, not a well-known ticket of another type. "Exactly one per site" is
     * not "exactly one per tenant", and a tenant may own many sites — so either
     * way it needs `site_slug`, and the well-known-ticket spelling would add a
     * lookup convention on top without removing the field.
     *
     * MOSTLY NOT A RETRIEVAL TARGET ([[DOC-38]] §9): it is small and always
     * relevant, so it belongs inlined in the priming context rather than fetched
     * by search. Its body is the document, and it is required and non-empty —
     * an empty brief is not a brief, and unlike a material there is no
     * asynchronous extraction that fills it in later.
     */
    brief: {
      fields: {
        site_slug: { type: 'string', required: true },
      },
      body: { required: true, non_empty: true },
    },

    /**
     * The chat session and its transcript comment — [[DOC-10]] §8.
     *
     * IMPORTED, NOT RESTATED. The AI component owns this shape because
     * `TicketSessionArchive` is what reads it back: it finds a session by
     * `fields.session_id`, keeps the whole session file in a `chat_transcript`
     * comment, and leaves the body for the AI-maintained summary. A local copy
     * of the schema would be free to drift from the code that depends on it, and
     * the drift would surface as a validation failure mid-conversation.
     *
     * Note this also supplies the `comment` type, which is why the merge order
     * below matters — see the attachment note.
     */
    ...chatSchemas(),

    /**
     * The session's change-feed cursor, added to the imported chat type ([[REQ-160]]).
     *
     * MERGED ONTO THE COMPONENT'S SHAPE, NOT A RESTATEMENT OF IT. The note above
     * is that a local copy of the chat schema would be free to drift from the
     * archive that reads it back; this adds one field and leaves every field the
     * component declared exactly as it ships, so there is nothing to drift.
     *
     * WHY IT LIVES HERE AND NOT BESIDE THE INDEX. [[REQ-159]] keeps its transcript
     * cursors beside the index, correctly: those are a property of an index pass
     * — derived data, exactly like the assignment map the component tells its
     * callers to persist there. This one is a property of a CONVERSATION. It
     * answers "what has this session already been told about", it lives and dies
     * with the session, and the session is a ticket ([[DOC-10]] §8), so it is a
     * field on that ticket.
     *
     * A STRING HOLDING JSON rather than two fields, because the timestamp and the
     * uids that sit exactly on it are one fact — a boundary in an inclusive feed
     * — and splitting them would let a store update move one without the other.
     */
    chat: {
      ...chatSchemas().chat,
      fields: {
        ...chatSchemas().chat.fields,
        kb_cursor: { type: 'string' },
      },
    },

    /**
     * The attachment record — the component's own, merged as it ships.
     *
     * The bytes live in the blob store; this is the record that names them
     * (`sha256`, `size`, `content_type`) and hangs off its parent by
     * `subject_uid`, exactly as a comment does — so `backlinks` traverses
     * attachments for free and there is no second lifecycle to keep in step.
     *
     * MERGED AS SHIPPED, never transcribed. `attach` writes these fields and
     * `attachments` reads them back, so they are the component's intrinsics
     * rather than a matter of local taste — and a hand-written approximation
     * would fail at the first upload rather than at edit time. Keyed by the
     * exported `ATTACHMENT_TYPE` for the same reason: the type NAME is upstream's
     * too, and `attachments` filters on it.
     *
     * Domain classification deliberately stays OFF this record and on the parent.
     * A rights model is a property of the material, not of a byte range — which
     * is why {@link MATERIAL_FIELDS} sits on `material` and `reference` and not
     * here.
     */
    [ATTACHMENT_TYPE]: ATTACHMENT_SCHEMA,

    /**
     * The knowledge system's own awareness map — [[REQ-159]], [[DOC-39]] §4.2.
     *
     * MACHINE-OWNED, AND NOT A DOCUMENT. The knowledge component publishes one
     * `system`/`awareness_report` ticket per knowledge base and recycles it in
     * place, so the map keeps a stable uid across rebuilds and its body is
     * replaced wholesale. Without this type declared the very first rebuild
     * fails validation — the store refuses an undeclared type, as it must — so
     * a host that wants a derived landscape has to say so here.
     *
     * SPELLED FROM THE COMPONENT'S OWN CONSTANTS, never from literals. The three
     * of them are exactly the `(type, kind, kb)` triple `findAwarenessReport`
     * queries on and `resolveCorpus` excludes as its recursion guard — cluster
     * the map into its own corpus and the next rebuild clusters the map into
     * itself. A local approximation of any one of them would break the lookup,
     * the guard, or both, and would do it silently.
     *
     * `kb` names which knowledge base the map describes. Required, because a map
     * that does not say what it maps cannot be recycled in place: the lookup is
     * by KB name, and a report missing it is a second untraceable report.
     */
    [AWARENESS_REPORT_TYPE]: {
      fields: {
        kind: { type: 'string', required: true },
        [KB_FIELD]: { type: 'string', required: true },
      },
      body: { required: true, non_empty: true },
    },
  })
}

/** The `fields.kind` value marking a `system` ticket as an awareness map. */
export const AWARENESS_KIND = AWARENESS_REPORT_KIND

/**
 * The pack, as far as this repository types it.
 *
 * `TypePack` reaches us through the generated shim as a value, not a type — the
 * component is untyped JavaScript — so the surface a caller actually uses is
 * named here rather than asserted away with a cast.
 */
export interface ProductTypePack {
  types(): string[]
  has(type: string): boolean
  schema(type: string): { fields?: Record<string, unknown>; body?: Record<string, unknown> }
}

/** The bindings the ticket store needs. `BLOBS` is NOT `SITES` — see above. */
export interface TicketStoreEnv {
  DB: D1Database
  /**
   * The client's private material. A bucket of its own, never `SITES`: that one
   * is bound by `apps/public-site`, and a brand guideline is not a published
   * asset.
   */
  BLOBS?: R2Bucket
  /** The account this deployment serves. No default — see `store.ts`. */
  TENANT_ID?: string
}

export class TenantNotConfiguredError extends Error {
  readonly name = 'TenantNotConfiguredError'
  constructor() {
    super(
      'TENANT_ID is not configured. This Worker serves one tenant and cannot ' +
        'infer which — set it in apps/control-app/wrangler.toml, under [vars] for ' +
        '`wrangler dev` and again under [env.production.vars], which does not inherit it.',
    )
  }
}

export class BlobsNotConfiguredError extends Error {
  readonly name = 'BlobsNotConfiguredError'
  constructor() {
    super(
      'The BLOBS binding is not configured, so the ticket store has no home for ' +
        'attachment bytes. Declare it in apps/control-app/wrangler.toml, under ' +
        '[[r2_buckets]] for `wrangler dev` and again under ' +
        '[[env.production.r2_buckets]], which does not inherit it. It must name a ' +
        'bucket of its own and never 1stcontact-sites, which apps/public-site ' +
        'serves to the public internet.',
    )
  }
}

/**
 * The ticket store for this request, tenant-scoped and attachment-capable.
 *
 * IT REFUSES TO BUILD WITHOUT A BLOB STORE, which is a decision made here rather
 * than upstream. The component treats attachments as a *capability*: a
 * `TicketStore` built without one refuses `attach`/`attachments` at first call
 * and is otherwise fully conforming, which is right for a general component that
 * cannot know whether its host has bytes to store. This host does. A
 * control-app deployment whose material has nowhere to go is misconfigured, and
 * the difference between saying so at construction and saying so at the first
 * upload is the difference between a failed deploy and a client's file
 * disappearing months later. So {@link BlobsNotConfiguredError} is raised here,
 * on the same principle — and in the same shape — as `TENANT_ID`'s absence.
 *
 * REGISTER-IF-ABSENT, NEVER REGISTER-UNCONDITIONALLY. `forTenant` validates
 * against the `tenants` registry and refuses an unknown tenant, as it must; a
 * freshly migrated database has an empty registry, which is exactly the dead
 * builder BUG-36 diagnosed on the site store's side. So the row is made to
 * exist — but only after a read proves it absent, because `putTenant` is an
 * UPSERT that overwrites `status`. Registering unconditionally would silently
 * reactivate a deactivated tenant on the next request, turning account
 * suspension into a suggestion. The read is one indexed lookup by primary key;
 * the write runs once in a database's life.
 *
 * The tenant can only ever be this deployment's own `TENANT_ID`, so this widens
 * nothing: it names exactly the account the configuration already names and can
 * reach no other. That is the argument `store.ts` makes for the site store, and
 * it is the same argument here.
 *
 * Constructed per request rather than memoised: `forTenant` performs the
 * registry check, and a handle cached across requests would carry a check made
 * against a tenant row that may since have been deactivated.
 */
export async function ticketStoreFor(env: TicketStoreEnv): Promise<TicketStore> {
  const tenantId = (env.TENANT_ID ?? '').trim()
  if (tenantId === '') throw new TenantNotConfiguredError()
  if (!env.BLOBS) throw new BlobsNotConfiguredError()

  const base = new MultiTenantTicketStore(new Accessor(env.DB), productTypePack(), {
    // UNSCOPED on purpose: `forTenant` binds the accessor and every
    // tenant-partitioned port together, from one validated id. Handing a
    // pre-scoped blob store in would be the one wiring mistake the component's
    // single wiring point exists to make impossible.
    blobs: new R2BlobStore(env.BLOBS),
  })
  if (!(await base.accessor.getTenant(tenantId))) {
    await base.registerTenant({ id: tenantId, name: tenantId })
  }
  return base.forTenant(tenantId)
}

/**
 * The scoped store's surface, as far as this repository types it.
 *
 * The component is untyped JavaScript and the boundary is narrow, so the ops the
 * product actually reaches for are named rather than wildcarded — the same
 * treatment `ai.ts` gives the AI library, and for the same reason: a wildcard
 * would silence a typo as readily as it silences the missing types.
 */
export interface TicketStore {
  create(a: {
    type: string
    title: string
    fields?: Record<string, unknown>
    body?: string
    status?: string
  }): Promise<{ ticket: Ticket }>
  get(a: { uid: string }): Promise<{ ticket: Ticket }>
  resolve_id(a: { id: string }): Promise<{ uid: string }>
  list(a?: { type?: string; limit?: number | 'all' }): Promise<{ tickets: Ticket[] }>
  query(a: { predicate?: string; limit?: number | 'all' }): Promise<{ tickets: Ticket[] }>
  update(a: {
    uid: string
    patch?: Record<string, unknown>
    expected_version?: number
  }): Promise<{ ticket: Ticket }>
  comment(a: { uid: string; kind: string; body: string }): Promise<{ comment: Ticket }>
  comments(a: { uid: string }): Promise<{ comments: Ticket[] }>
  attach(a: {
    uid: string
    bytes: Uint8Array | ArrayBuffer
    filename?: string
    content_type?: string
    meta?: Record<string, unknown>
  }): Promise<{ attachment: Ticket }>
  attachments(a: { uid: string }): Promise<{ attachments: Ticket[] }>
  /**
   * The tenant-bound blob handle, for reading an attachment's bytes back.
   *
   * NAMED HERE rather than reached for with a cast at the one call site that
   * needs it (REQ-163's asset promotion). It is the component's own scoped
   * handle — `forTenant` binds it alongside the accessor — so reading through it
   * cannot address another account's blob even by a correctly-formed key, and
   * that guarantee is worth stating in the type rather than in a comment beside
   * an `as unknown as`.
   *
   * `null` on a store built without a blob store. `ticketStoreFor` refuses to
   * build one, so this Worker never sees it — but the component's contract does.
   */
  blobs: { get(key: string): Promise<Uint8Array | null> } | null
}

/** The canonical ticket object every op above returns. */
export interface Ticket {
  uid: string
  type: string
  title: string
  status: string | null
  human_id: string | null
  fields: Record<string, unknown>
  links: Array<{ rel: string; ref: string }>
  body: string
  version: number
  archived: boolean
  created_at: string
  updated_at: string
}
