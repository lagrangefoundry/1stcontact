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

import * as imagegenLib from './generated/ai-imagegen'
import * as aiLib from './generated/ai-workers.js'
import type { IndexMaterial } from './material'
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
 * Everything a generated material carries that the plugin cannot know.
 *
 * `filename` and `content_type` are absent here and only here, because they do
 * not exist until the bytes do — see {@link generatedMaterialStore}.
 */
function generatedFields(describer: string): Record<string, unknown> {
  return {
    // THE VOCABULARY [[DOC-38]] §9 ALREADY DECLARES, so a generated image files
    // beside an uploaded one rather than beside nothing.
    kind: 'image',
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
): Pick<TicketStore, 'create' | 'attach'> {
  const ours = new Set<string>()
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
        fields: { ...(args.fields ?? {}), ...generatedFields(describer()) },
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
      if (index) await index(args.uid)
      return attached
    },
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
        create_image: { store, ...(opts.fetch ? { fetch: opts.fetch } : {}) },
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
  return { surface, granted: images.instanceConfig() as Record<string, unknown> }
}
