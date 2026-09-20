/**
 * Image generation, adopted rather than authored ([[REQ-208]]).
 *
 * The assistant could look at what a client uploaded and place it on a site; it
 * could not make a picture. A client with no photograph of their shopfront and
 * no budget for one ended the conversation there. This is the wiring that lets
 * the consultant answer *"here is a hero image in the mood we just described,
 * tell me if it is close"* — an absent asset becomes a draft.
 *
 * NOTHING HERE IS A TOOL SURFACE. The surface, the executor, the refusal
 * taxonomy and the cost model are lagrange-framework's `create_image` plugin
 * ([[REQ-141]]) over `components/imagegen`. This file installs it: it names the
 * provider, supplies the credential, supplies the ticket type, and hands the
 * plugin the one thing a framework component cannot know — this product's own
 * vocabulary for a piece of material. If any of that ever needs more than
 * wiring, the finding belongs upstream rather than in a local workaround.
 *
 * THIS IS THE PRODUCT'S FIRST NON-ANTHROPIC CREDENTIAL, and that is the change
 * worth reading carefully. Anthropic does not generate images, so a deployment
 * that can make one holds an image key for a vendor that is not the one taking
 * the conversation's turns. What that is NOT is a second chat backend: the
 * session still runs on `ClaudeAPIBackend` and one *tool* reaches OpenAI's
 * images API underneath. Running a session's turns on a ChatGPT backend is a
 * different change with different consequences — it is what would make tool
 * availability vary by backend — and it is deliberately not made here.
 *
 * THREE PROPERTIES THIS FILE IS RESPONSIBLE FOR:
 *
 *   1. **The model never learns which vendor drew the image.** The provider is a
 *      construction option ({@link IMAGE_PROVIDER}), not a parameter. No error
 *      sentence and no line of the manual names it, so this deployment can move
 *      from OpenAI to Google without the assistant noticing.
 *   2. **A deployment with no image key has no image tool.** {@link imageSurface}
 *      answers `null`, the surface is never composed, and `createL1Toolbox`
 *      narrows the grant away — so the manual never mentions a capability the
 *      session has not got and the model cannot propose, apologise for, or probe
 *      for one. The session still opens; every other tool keeps working. It is
 *      the same shape a missing describer already has, and it must not make
 *      `aiConfigured` report the whole product unconfigured: that predicate asks
 *      whether this deployment can reach a model at all, and the answer still
 *      turns on the Anthropic key.
 *   3. **A generated image is an ordinary `material`.** See
 *      {@link generatedMaterialStore}, which is the substance of the ticket.
 */

import { displayLine } from '../../../tools/generate/src/cli/ai/toolbox-core'
import { resolveStoredImage } from '../../../tools/generate/src/cli/image-library'
import * as imagegenLib from './generated/ai-imagegen'
import * as aiLib from './generated/ai-workers.js'
import {
  MATERIAL_TYPES,
  indexAfterWrite,
  materialImageLibrary,
  nextMaterialLabel,
  type IndexMaterial,
} from './material'
import type { Ticket, TicketStore } from './tickets'

/** The libraries are untyped JavaScript; the boundary is narrow and named here. */
type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

const images = imagegenLib as unknown as Untyped
const lib = aiLib as unknown as Untyped

/**
 * Which vendor draws the images.
 *
 * NAMED ONCE, HERE, AND NOWHERE ELSE. `gpt-image-1` declares transparency and
 * three aspect ratios where the Google adapter declares fewer, so it is the one
 * to offer a client who may want a logo on a transparent background. Nothing
 * downstream reads this: the plugin turns it into a credential requirement and a
 * backend, and the model is given no parameter through which to ask.
 */
export const IMAGE_PROVIDER = 'openai'

/**
 * The credential the chosen provider needs.
 *
 * DERIVED FROM THE PLUGIN'S OWN TABLE rather than written out, because the
 * plugin is what actually decides: it declares `requires` from this name, and a
 * second spelling here would produce a deployment that supplies a key nobody
 * asks for and a tool that is silently absent. `router.ts` reads it to redact
 * the value out of anything a person is shown.
 */
export const IMAGE_SECRET: string = images.PROVIDERS[IMAGE_PROVIDER].secret

/**
 * How many images one session may generate.
 *
 * THE FRAMEWORK'S DEFAULT, KEPT DELIBERATELY. At the pinned price for
 * `gpt-image-1` a full session's worth is well under a dollar, so this is not a
 * cost control — it is a runaway-loop stop, and it is set where an honest
 * session never reaches it. The intended use is iterative: a client who rejects
 * three drafts of a hero image is behaving exactly as the conversation invites
 * them to, and a cap tight enough to bite that session would be buying nothing.
 */
export const IMAGE_BUDGET: number = images.DEFAULT_BUDGET

/**
 * The type a generated image lands as, and it is this product's decision.
 *
 * The framework takes the ticket type as configuration because a type pack is
 * the deployment's (DOC-8 §13.1). `material` is the answer here: a generated
 * image is a piece of the client's material like any other and must be
 * indistinguishable from an uploaded one everywhere downstream — the Library's
 * rows, the knowledge index, the re-describe pass, `promoteToSiteAsset`. A
 * second shape would mean a second code path in every one of those places,
 * forever, to save one normalising step once.
 */
export const IMAGE_MATERIAL_TYPE = 'material'

/**
 * `origin` for material this system made rather than received ([[DOC-38]] §9).
 *
 * A VALUE ON THE FIELD THAT ALREADY ASKS THE QUESTION, not a new field beside
 * it. The ticket asks for a field that says a picture was generated, distinct
 * from `description_model`, selectable by a predicate and visible where the
 * Library shows what it knows about a file. `origin` is that field already: it
 * answers *where did these bytes come from*, `tickets.ts` declares it required
 * on every material, `MaterialRow` carries it, and the Library renders it under
 * **Where it came from**. Adding a value costs one enum entry; adding a field
 * would have cost a field, a row, a label and a migration for absence.
 *
 * IT IS NOT `description_model`, AND THE DISTINCTION IS THE POINT. A model id is
 * a fact about provenance and means nothing to the person it is written for —
 * somebody months from now choosing an image for a printed brochure, who needs
 * to know this picture is synthetic and does not know what any of our model
 * names are. This is the fact about the *picture*.
 */
export const GENERATED_ORIGIN = 'generated'

/**
 * What [[DOC-38]] §9 files a generated picture as.
 *
 * NAMED BECAUSE TWO LINES NOW READ IT — the record's own `kind`, and the
 * sequence [[REQ-280]]'s label draws its number from. Those must be the same
 * word or a generated picture is labelled out of a sequence nothing else uses.
 */
export const GENERATED_KIND = 'image'

/** The type the ticketing component mints an attachment record as. */
const ATTACHMENT_TYPE = 'attachment'

/** One call the image surface makes on the handle it is given. */
type ImageStoreMethod = 'create' | 'attach' | 'get' | 'attachments' | 'read_attachment'

/**
 * The handle the image surface is given — **typed against what it calls, not
 * against what generation happens to touch** ([[BUG-126]]).
 *
 * THIS TYPE IS THE BUG. What was here was `Pick<TicketStore, 'create' | 'attach'>`,
 * and the narrowing was right in spirit and one operation short in fact: the
 * surface's own edit path reads a picture back before it draws over it, so it
 * calls `get`, `attachments` and `read_attachment` too. `edit_image` therefore
 * crashed on its first line — `this.store.get is not a function` — on every
 * picture, for every client, since the day it was granted, and it could not have
 * done anything else. The handle crosses into the plugin through an `Untyped`
 * boundary, so the one place a two-method object met a five-method expectation
 * was the one place TypeScript was switched off.
 *
 * SO THE METHOD SET IS NAMED ONCE AND BOTH HALVES READ IT. This type and the
 * grant {@link imageGrantFor} derives are two consumers of
 * {@link IMAGE_STORE_METHODS} rather than two lists that can disagree, and a UAT
 * holds that list against the calls upstream's executor actually makes. So a
 * rung that grows a sixth call fails in this repository's own suite; adding it
 * to {@link ImageStoreMethod} is then what makes a handle that does not supply
 * it a COMPILE error. The failure moves from a client's turn to the build.
 */
export type ImagePluginStore = Pick<TicketStore, ImageStoreMethod>

/**
 * What each of the surface's two capability groups asks of the handle behind it.
 *
 * THE GROUP NAMES ARE UPSTREAM'S AND ARE NEVER SPELLED HERE, for the reason
 * {@link IMAGE_SECRET} is derived rather than written: a second spelling is a
 * grant that keeps naming a group after a rename has moved it.
 *
 * EDITING SUBSUMES GENERATING because an edit ENDS in a generation — it reads
 * the source, draws over it, and stores the result as a new picture through the
 * same `create`/`attach` pair. A deployment that could read but not write would
 * be able to fetch a client's picture and produce nothing, which is not a
 * capability anybody should be granted.
 */
const GROUP_METHODS: ReadonlyArray<{ group: string; methods: readonly ImageStoreMethod[] }> = [
  { group: images.CREATE_GROUP, methods: ['create', 'attach'] },
  {
    group: images.EDIT_GROUP,
    methods: ['create', 'attach', 'get', 'attachments', 'read_attachment'],
  },
]

/**
 * Every method the image surface calls on its store, in one list.
 *
 * DERIVED FROM {@link GROUP_METHODS} rather than written beside it, so the set
 * the handle is checked against and the sets the grant is derived from cannot
 * come apart.
 */
export const IMAGE_STORE_METHODS: readonly ImageStoreMethod[] = [
  ...new Set(GROUP_METHODS.flatMap((entry) => entry.methods)),
]

/**
 * The grant a given handle can actually honour ([[BUG-126]]).
 *
 * **DO NOT OFFER WHAT CANNOT BE SERVED.** `instanceConfig()` grants both groups
 * by default, and that default is right upstream: the surface itself withholds
 * `EditImages` on a provider that cannot edit, so one configuration is correct
 * on every vendor. What it cannot know is the STORE, which is this host's — so
 * for five months the grant said *"you may change a picture"* on every turn and
 * the operation behind it could only crash. An offered-and-always-crashing
 * capability is worse than an absent one: a model proposes it, apologises for
 * it, and spends a client's turns establishing that it is broken, which is
 * exactly what happened. Absence costs nothing, because a model is never told.
 *
 * It is the same shape {@link imageSurface} already takes when this deployment
 * holds no image key, and the same shape `createL1Toolbox` takes for a surface
 * that was not composed — narrow the grant to what exists rather than advertise
 * what does not.
 */
export function imageGrantFor(store: Partial<ImagePluginStore>): Record<string, unknown> {
  const groups = GROUP_METHODS.filter((entry) =>
    entry.methods.every((method) => typeof store[method] === 'function'),
  ).map((entry) => entry.group)
  return images.instanceConfig({ groups }) as Record<string, unknown>
}

/**
 * Everything a generated material carries that the plugin cannot know.
 *
 * `filename` and `content_type` are absent here and only here, because they do
 * not exist until the bytes do — see {@link generatedMaterialStore}.
 *
 * `label` IS ABSENT FOR A DIFFERENT REASON ([[REQ-280]]): it needs the store, to
 * take a number from this client's own sequence, and this function has none. It
 * is composed in {@link generatedMaterialStore}'s `create` and merged in beside
 * these — in the SAME write, which is what [[REQ-208]]'s note about a
 * write-through rather than a patch requires of every field this product adds to
 * a plugin's record.
 */
function generatedFields(describer: string): Record<string, unknown> {
  return {
    // THE VOCABULARY [[DOC-38]] §9 ALREADY DECLARES, so a generated image files
    // beside an uploaded one rather than beside nothing.
    kind: GENERATED_KIND,
    origin: GENERATED_ORIGIN,
    // OURS, AND PLACEABLE. `promoteToSiteAsset` reads `republishable` off the
    // record and refuses anything we do not hold the right to publish; an image
    // this deployment commissioned on the client's behalf is the one case where
    // that right is not in doubt. Without this the whole capability would be a
    // picture nobody could ever put on a site.
    rights: 'owned',
    republishable: true,
    // NOT EXPORTABLE, exactly as an upload is not ([[DOC-38]] §4.2). The
    // cross-client corpus may learn from third-party public documents; it may
    // not learn from a picture made for one client's business.
    exportable: false,
    // GENERATED TO BE PLACED. The conversation that produces one is about a
    // hero, a background, a stand-in for photography — so `site` is what the
    // client is actually being offered, and `reference` would be a quiet lie
    // about why the picture exists.
    role: 'site',
    // AND HONESTLY `ok`. The body is the prompt, which is a description of the
    // picture written in the words somebody would search by — it is what the
    // vision describer works to produce, arriving for free because a person
    // typed it. So this material is not degraded and must not be selected by a
    // later re-describe pass. Leaving the field absent would make it a THIRD
    // state every predicate over it would have to learn about, which is the
    // failure [[DOC-38]] §10's one mechanism exists to prevent.
    description_status: 'ok',
    // WHAT GENERATED IT, not what described it — for this one kind of material
    // those are the same act. It is also what makes *"which of these did we
    // make"* a query rather than an inspection.
    description_model: describer,
  }
}

/**
 * The plugin's own ticket store: scoped, and normalising ([[REQ-208]]).
 *
 * **THIS IS THE SUBSTANCE OF THE TICKET.** The plugin creates a ticket of the
 * configured type, titles it from the prompt, writes the prompt and the outcome
 * into the body, and attaches the bytes. It sets none of `kind`,
 * `description_status`, `description_model`, `content_type` or `filename` — and
 * it should not, because those are 1stcontact's vocabulary and the plugin's
 * record shape is the framework's, shared by every adopter. A field that only
 * makes sense here does not belong in it.
 *
 * SO THE GAP IS FILLED FROM THIS SIDE, THROUGH THE SEAM THE FRAMEWORK ALREADY
 * DECLARES. `options.store` is documented as *the plugin's own scoped handle*,
 * which is exactly the place a host gets to say what a record written on its
 * behalf looks like. Nothing upstream changes.
 *
 * IT IS A WRITE-THROUGH AND NOT A PATCH AFTER THE FACT, and the ordering is why.
 * The requirement is that no material is ever visible in the Library carrying
 * the plugin's fields and not this product's. A patch after the whole operation
 * would leave a window — however short — in which a Library poll could see one.
 * Merging at `create` closes it: the record is this product's shape from the
 * first write. `content_type` and `filename` cannot join it there, because they
 * are measured off bytes that do not exist until `attach` — so they arrive one
 * round trip later, from the same resolved values the attachment record itself
 * takes, which is the invariant [[BUG-41]] made durable on the upload path.
 *
 * IT WOULD NOT WORK ANY OTHER WAY, INCIDENTALLY. `rights`, `republishable`,
 * `exportable`, `origin` and `kind` are `required: true` on `material`, so a
 * bare plugin write is refused by the type pack outright. The normalisation is
 * not a nicety layered over a working path; it is what makes the path exist.
 *
 * AND IT IS THE SCOPE, TOO. The handle refuses any type but the configured one
 * and any attach against a ticket it did not itself create — so *"the only
 * record this plugin can cause is one holding a picture it was allowed to
 * make"* is a property of the handle rather than of the plugin's good behaviour.
 *
 * **READS HAVE THEIR OWN SCOPE RULE, AND IT IS A DIFFERENT SENTENCE**
 * ([[BUG-126]]). The write rule is about what this plugin may CAUSE; the read
 * rule is about what it may REACH, and the answer is *this client's own
 * material and nothing else*. The store is already tenant-bound, so no barrier
 * is being added here — what is being added is a TYPE check, because a business
 * holds a great deal that is not material: its leads, its invoices, its
 * conversations, and the files hanging off them. {@link MATERIAL_TYPES} is the
 * Library's own definition of what the client's material is, so the rule is that
 * definition rather than a second one, and an attachment is readable exactly
 * when the record it hangs off is.
 *
 * **A PICTURE ANSWERS TO EVERY NAME IT ANSWERS TO ELSEWHERE.** The consultant
 * that found this bug spent five attempts on it — by document id, by the right
 * Library id, and by filename — and a fix that accepted only the canonical uid
 * would have left two of those three still failing. `resolveStoredImage` is
 * [[REQ-218]]'s single rule for what a stored picture is CALLED, and
 * `storedImageOf` already declares the label and the filename as spellings of
 * one; so the fallback here is that rule, reached only when a direct read finds
 * nothing. A second matcher would be the drift REQ-218 exists to prevent.
 *
 * @param tickets This business's real store, already tenant-bound.
 * @param describer What to write as `description_model` — read late, because the
 *   backend that answers it is constructed by the plugin after this store is.
 * @param index The KB indexer, or `null`. A generated image is findable the
 *   moment it exists precisely because its body is already a description, so
 *   skipping the index here would throw that away for nothing.
 */
export function generatedMaterialStore(
  tickets: TicketStore,
  describer: () => string,
  index: IndexMaterial | null,
  type: string = IMAGE_MATERIAL_TYPE,
): ImagePluginStore {
  const ours = new Set<string>()

  /**
   * The record a name means, by uid or by any other spelling of it.
   *
   * THE DIRECT READ FIRST, ALWAYS, because it is one indexed lookup and it is
   * what every id this surface hands out actually is. The listing behind
   * `resolveStoredImage` is a scan, and it runs only when the direct read found
   * nothing — which is the miss path, not the ordinary one.
   */
  async function named(uid: string): Promise<Ticket> {
    try {
      return (await tickets.get({ uid })).ticket
    } catch {
      // Not a uid this store holds. It may still be a name a picture answers to.
    }
    const { match, candidates } = resolveStoredImage(uid, await materialImageLibrary(tickets).list())
    if (match) return (await tickets.get({ uid: match.name })).ticket
    if (candidates.length > 1) {
      throw new Error(
        `'${uid}' is the name of ${candidates.length} pictures: ` +
          `${candidates.map((c) => `'${c.name}'`).join(', ')}. Ask again with one of those.`,
      )
    }
    throw new Error(`there is no picture called '${uid}' in this client's material`)
  }

  /**
   * The record this handle may read, or the refusal for one it may not.
   *
   * An attachment is reached through the record it hangs off, so the same
   * sentence covers both: what is readable is the client's material, and the
   * files on it.
   */
  async function readable(uid: string): Promise<Ticket> {
    const ticket = await named(uid)
    if (MATERIAL_TYPES.includes(ticket.type as (typeof MATERIAL_TYPES)[number])) return ticket
    if (ticket.type === ATTACHMENT_TYPE) {
      const subject = String(ticket.fields.subject_uid ?? '')
      if (subject !== '') {
        const owner = (await tickets.get({ uid: subject })).ticket
        if (MATERIAL_TYPES.includes(owner.type as (typeof MATERIAL_TYPES)[number])) return ticket
      }
    }
    throw new Error(
      `${ticket.uid} is a ${ticket.type} rather than a piece of this client's material, ` +
        `and the image tools may only read material`,
    )
  }

  return {
    async create(args): Promise<{ ticket: Ticket }> {
      if (args.type !== type) {
        throw new Error(
          `the image plugin may only create '${type}' tickets, and was asked for ` +
            `'${args.type}'`,
        )
      }
      const created = await tickets.create({
        ...args,
        fields: {
          ...(args.fields ?? {}),
          ...generatedFields(describer()),
          // THE NAME THE CLIENT AND THE CONSULTANT WILL BOTH USE ([[REQ-280]]).
          // This path is the one the ticket opens with: three generated variants
          // of one prompt arrive titled identically, and until they each carried
          // a label neither half of the engagement could point at one of them.
          label: await nextMaterialLabel(tickets, GENERATED_KIND),
        },
      })
      ours.add(created.ticket.uid)
      return created
    },

    async attach(args): Promise<{ attachment: Ticket }> {
      if (!ours.has(args.uid)) {
        throw new Error(
          `the image plugin may only attach to a ticket it created, and ${args.uid} ` +
            `is not one`,
        )
      }
      const attached = await tickets.attach(args)
      // THE TWO FIELDS THAT COULD NOT BE WRITTEN AT `create`, from the same
      // values the attachment record above just took. The Library's list rows
      // and its detail pane read both off the material rather than off the
      // attachment — a call per row to draw a list is what that duplication
      // buys — so a generated image without them would be a row that renders
      // differently from every other row for no reason a client could see.
      await tickets.update({
        uid: args.uid,
        patch: {
          fields: {
            ...(args.filename ? { filename: args.filename } : {}),
            ...(args.content_type ? { content_type: args.content_type } : {}),
          },
        },
      })
      // AWAITED, AND THE SAME CALL AN UPLOAD MAKES. [[DOC-39]] §4 is explicit
      // that the index, not the body, is what retrieval sees: a generated image
      // that was never embedded would sit in the Library while the assistant
      // that just made it could not find it.
      //
      // AND IT CANNOT THROW FROM HERE, WHICH IS [[BUG-119]]. This handle is a
      // TicketStore to the plugin, and the plugin reads any throw out of it as
      // `store_unavailable` — *the image was generated but could not be stored,
      // so there is no ticket to hand on. This is a deployment fault.* That
      // sentence was reported twice for two pictures that were stored perfectly:
      // the bytes, the record and this product's whole vocabulary were all
      // written by the lines above, and then a broken embedder ([[BUG-117]])
      // made the index refresh throw and took the uid down with it. The picture
      // had been paid for; the only thing lost was the ability to name it.
      //
      // {@link indexAfterWrite} is therefore not a softening of the contract but
      // the contract stated correctly: THIS HANDLE REPORTS ON THE STORE. Its
      // throws mean the store refused, so `store_unavailable` means what it says
      // and a retry is worth the model's while. An index refresh is not the
      // store — it is a change-feed pass that the next write repeats for free —
      // and it has no business speaking for it.
      await indexAfterWrite(index, args.uid)
      return attached
    },

    // -- the read half, which is the edit path ([[BUG-126]]) -----------------
    //
    // THREE METHODS AND ONE RULE. Each of them resolves the name, checks the
    // record is the client's material, and then asks the real store — so the
    // scope is enforced once, in {@link readable}, rather than three times in
    // three places that could come to disagree.
    //
    // THE *RESOLVED* UID IS WHAT REACHES THE STORE, never the string the caller
    // passed. A caller that named a picture by its label gets the record; if
    // this handed the label straight on to the next call, the listing would be
    // asked for the attachments of a ticket that does not exist.

    async get(args): Promise<{ ticket: Ticket }> {
      return { ticket: await readable(args.uid) }
    },

    async attachments(args): Promise<{ attachments: Ticket[] }> {
      const subject = await readable(args.uid)
      return tickets.attachments({ ...args, uid: subject.uid })
    },

    async read_attachment(args): Promise<{
      attachment: Ticket
      bytes: Uint8Array
      trashed: boolean
    }> {
      const record = await readable(args.uid)
      return tickets.read_attachment({ ...args, uid: record.uid })
    },
  }
}

/**
 * How this product says *"the picture is in the Library, here is how to look at
 * it, and here is how to show it to your client"* ([[REQ-217]], [[BUG-118]]).
 *
 * THE SEAM IS THE PLUGIN'S AND THE SENTENCE IS OURS, which is this file's whole
 * job restated. lagrange-framework REQ-149 opened `display` precisely because the
 * plugin cannot know it: it composes the record, and whether there is anywhere to
 * put the picture — and what a line that puts it there looks like — is a fact
 * about the host's own surface. So supplying one is not the local workaround this
 * module's header forbids; it is another instance of *"this product's own
 * vocabulary"*, beside the material fields above.
 *
 * IT SAYS WHERE THE PICTURE WENT, AND THAT IS [[BUG-118]]. The plugin's
 * `generated_image` names a ticket, an attachment and a filename and says of none
 * of them which of this deployment's two stores now holds the bytes — so an
 * assistant that went looking in the site's assets, found nothing, and told its
 * client it could not see its own work was reasoning correctly from everything it
 * had been given. Which store a generated picture lands in is not a fact the
 * plugin can know: `store` is the host's, `origin: 'generated'` is the host's
 * vocabulary, and the Library is the host's surface. So it is said here, in the
 * one place the assistant is certain to be reading — the result of the call it
 * just made — rather than left to a rule about when to go and fetch a fuller
 * manual entry, which is a rule that has to fire to help.
 *
 * AND IT NAMES THE *UID* AS THE NAME TO LOOK WITH, not the filename. The
 * catalogue's canonical name for a piece of material is its record's uid
 * (`storedImageOf` in `material.ts`, and `resolveStoredImage` is the one rule),
 * so the uid is the spelling that always means exactly one picture — a filename
 * is an alias and two uploads may share one. It is also already in the record as
 * `ticket`, so the sentence teaches that the handle the model is holding IS the
 * name every way of looking at a picture takes.
 *
 * ONE COMPOSER FOR BOTH HALVES. The markdown is {@link displayLine}, the same
 * function `write_image` uses, because a picture in the conversation is one
 * contract with one reader: the chat pane recovers what a picture IS by reading
 * the address back off the `<img>`, and two spellings of that address is how the
 * two come apart.
 *
 * A SENTENCE RATHER THAN A BARE LINE, because that is what the seam takes — the
 * plugin wraps it in no prose of its own, so the instruction has to be in it.
 */
function generatedDisplay(
  materialUrl: (uid: string) => string,
): (record: Record<string, unknown>) => string {
  return (record) => {
    const uid = String(record.ticket ?? '')
    if (uid === '') return ''
    const name = String(record.filename ?? 'image')
    return (
      `This picture is in the client's Library now, catalogued as ${uid} — ` +
      '`screenshot` takes that name unchanged, so you can look at what you made, ' +
      'and it is on the site only once you place it there. Show this picture to ' +
      'the person you are talking to by including this line in your reply, ' +
      `exactly as written: ${displayLine(name, materialUrl(uid))}`
    )
  }
}

/** What a caller may substitute, so the capability is provable with no key. */
export interface ImageSurfaceOptions {
  /**
   * The transport the provider is reached through.
   *
   * THE ONE BOUNDARY A SUITE MAY FAKE, and it is the network. The plugin passes
   * it to the adapter, which skips its own credential check when a transport is
   * injected — which is what lets every UAT below drive the real surface, the
   * real refusal taxonomy, the real budget and the real normalisation with no
   * live credential and no spend.
   */
  fetch?: typeof fetch

  /**
   * Where a piece of this business's material is served from ([[REQ-217]]).
   *
   * THE ROUTER'S TO SUPPLY, because it is the only place that holds both halves:
   * the route (`/api/material/file`) and the business the request resolved to.
   * Absent means this deployment has nowhere to show a generated picture, so the
   * result carries no display line and the id is the whole of what the model can
   * pass on — which is exactly what the plugin's own prose says absence means.
   *
   * WHICH IS WHY [[BUG-118]]'s SENTENCE RIDES ON THE SAME CONDITION. The one
   * field a host may write into this result is `display`, and the plugin's
   * declaration composes it in only where a handle was supplied — so a
   * deployment with nowhere to show a picture is also told nothing about where
   * the picture went. `router.ts` is the only caller and always supplies this,
   * so no shipped session reads the poorer result; making the field
   * unconditional would instead make the manual describe a display line that
   * never arrives, which is the drift the plugin's composition exists to avoid.
   */
  materialUrl?: (uid: string) => string
}

/** What this deployment needs to be able to generate an image. */
export interface ImageEnv {
  /**
   * The image credential, as a `wrangler secret`.
   *
   * OPTIONAL, AND ABSENT IS ORDINARY — not a deployment fault and not a boot
   * failure. See this module's note: no key means no tool, and the session is
   * otherwise untouched.
   */
  OPENAI_API_KEY?: string
}

/**
 * The `create_image` surface for one session, or `null` where this deployment
 * cannot generate images.
 *
 * ASSEMBLED IN `router.ts` AND PASSED TO `workerHost`, which is the division of
 * labour every other wire on this host follows ([[REQ-206]]'s fidelity surface
 * is the precedent): the router is where the request-scoped things are, and
 * keeping the assembly there keeps the plugin out of `ai.ts`'s import graph.
 *
 * NULL RATHER THAN A SURFACE THAT THROWS. `resolvePlugins` reports a plugin
 * whose credentials do not resolve as ABSENT rather than as an error — that is
 * the machinery [[REQ-139]] ships and the reason the plugin declares its
 * credential by name. Passing the absence straight through is what keeps the
 * manual honest.
 */
export function imageSurface(
  env: ImageEnv,
  tickets: TicketStore,
  index: IndexMaterial | null = null,
  opts: ImageSurfaceOptions = {},
): { surface: Untyped; granted: Record<string, unknown> } | null {
  // READ LATE, NOT CAPTURED. The store below is constructed before the plugin
  // builds its backend, and the backend is what can say which model actually
  // draws — so the store asks for the name at write time, by which point this
  // is filled in. Parsing it back out of the body the plugin writes would be a
  // second reading of a format the framework owns.
  let model: string | null = null
  const store = generatedMaterialStore(tickets, () => model ?? IMAGE_PROVIDER, index)

  // BELOW THIS LINE THE HANDLE IS UNTYPED, WHICH IS WHY IT IS TYPED ABOVE IT
  // ([[BUG-126]]). It passes into the plugin through `options`, and `options` is
  // `any` on both sides of the seam — so nothing here can check it and nothing
  // there will. {@link ImagePluginStore} is the check: `generatedMaterialStore`
  // declares that return type, so a handle one method short of what the surface
  // calls is a compile error in this repository rather than a crash on a
  // client's turn. A runtime assertion here would be the same claim made
  // second, later, and weaker.
  const { surfaces } = lib.resolvePlugins(
    [
      images.createImagePlugin({
        provider: IMAGE_PROVIDER,
        ticketType: IMAGE_MATERIAL_TYPE,
        budget: IMAGE_BUDGET,
      }),
    ],
    {
      // THE VALUE PASSES THROUGH HERE AND IS WRITTEN NOWHERE. A plugin never
      // reads an environment (DOC-25); the host supplies what it declared it
      // needs, and a deployment that cannot answer makes the plugin absent
      // rather than broken.
      secrets: { [IMAGE_SECRET]: env.OPENAI_API_KEY },
      options: {
        create_image: {
          store,
          ...(opts.fetch ? { fetch: opts.fetch } : {}),
          // SUPPLIED ONLY WHERE THERE IS SOMEWHERE TO SHOW IT. The plugin
          // composes its declaration to match, so a deployment that can show a
          // picture reads a manual that says so and one that cannot reads the
          // manual it read before — which is why absence is passed through
          // rather than papered over with a handle that answers nothing.
          ...(opts.materialUrl ? { display: generatedDisplay(opts.materialUrl) } : {}),
        },
      },
    },
  )
  if (surfaces.length === 0) return null

  const surface = surfaces[0]
  model = String(surface.backend().model)
  // THE GRANT TRAVELS WITH THE SURFACE, unlike fidelity's, which is an entry in
  // `instances.json`. Two reasons, and the second is the load-bearing one.
  //
  // Fidelity's declaration lives in this repository and CI validates the
  // instance configuration against it, so an entry there is checked. This
  // surface's declaration lives upstream: a grant written into `instances.json`
  // would name a surface that validator has never seen, and
  // `test_UAT_FC_REQ_157_both_declarations_validate_together` fails on exactly
  // that — correctly, because a grant nothing can check is a grant that can
  // silently name a group that no longer exists.
  //
  // And derived rather than written, which is stronger than either: a grant the
  // surface builds from its own declaration cannot name a capability the surface
  // has not got, so an upstream rename becomes a resolution error rather than a
  // deployment that quietly grants nothing.
  //
  // DERIVED FROM THE HANDLE AS WELL AS FROM THE DECLARATION ([[BUG-126]]). The
  // paragraph above is about the SURFACE's half — it cannot name a group the
  // surface has not got. It was silent about the STORE's half, and that silence
  // is the whole bug: the surface had `EditImages` and the handle behind it
  // could not serve one call of it, so the grant offered the operation on every
  // turn and the operation could only crash. {@link imageGrantFor} closes the
  // second half the same way the first is closed — by asking rather than
  // asserting.
  return { surface, granted: imageGrantFor(store) }
}
