/**
 * The Library tab (REQ-161, DOC-38 §6).
 *
 * Everything the client has given us — photos, fonts, brand guidelines,
 * positioning papers, and eventually captures — is a ticket with an AI-written
 * body, and until this existed the builder could see none of it. The image
 * picker (REQ-132) lists what one site's assets already hold and is reached by
 * clicking an image; it is a field editor, not a library.
 *
 * STANDARD `webui/split` + `webui/list-detail`, CONFIGURED RATHER THAN REBUILT.
 * The list pane, its filter slot, the selection, the collapse-to-rail and the
 * detail's persisted scroll are all the component's; what is written here is the
 * three host-injected functions it asks for — how a row looks, what a detail
 * contains, and what the filter means.
 *
 * TENANT-WIDE, WITH THE SITE AS A BADGE AND NEVER A BOUNDARY. DOC-38 §7.7 lets
 * one blob back two sites and DOC-10 §4.1 makes shared knowledge across a
 * client's sites deliberate — their second site should not start as cold as
 * their first. So `placed_on` decides a badge and a filter the client can turn
 * on, and the origin is never asked to hide anything on the strength of it.
 *
 * ONE FACT, READ BY ALL THREE (BUG-47). The pill, the `Used on` field and the
 * `Used on this site` checkbox are three statements about the same thing, so
 * they read the same field and can no longer disagree with each other. That
 * field is `placed_on` — WHERE THE BYTES WENT — and it replaced `site_slug`,
 * which held WHICH SITE WAS OPEN WHEN THE FILE ARRIVED. Reading upload context
 * as placement is what put the pill on a file dropped on *"just for you to
 * read"*, whose own hint had promised seconds earlier that it would not appear
 * on the site.
 *
 * THE DETAIL REUSES THE EDITORS WE ALREADY HAVE. Both halves are `mountFields`:
 * the §9 rights block read-only, and the description as one editable field. A
 * second editing vocabulary for material would be a second set of controls to
 * keep in step with the first, for no behaviour the first does not already have.
 *
 * THE DESCRIPTION IS MARKDOWN, AND IS SHOWN AS SUCH (BUG-42). It is the ticket
 * body an AI wrote about the file (DOC-38 §6), so it arrives with headings, bold
 * and lists in it — and `mountFields` reads a scalar, which means its read cell
 * is a plain-text span by design. So the cell is REPAINTED rather than replaced:
 * see `paintDescription`. Keeping the component's own element is what keeps this
 * from becoming the second editing vocabulary the paragraph above rules out —
 * click-to-edit still opens the component's textarea, over the markdown SOURCE,
 * and commits through the component's own path.
 */

import { mountFields } from '@lagrangefoundry/webui-fields'
import { mountListDetail } from '@lagrangefoundry/webui-list-detail'
import {
  fetchMaterial,
  fetchMaterialItem,
  materialFileUrl,
  saveMaterialDescription,
} from './api.js'
import { UPLOAD_AREAS } from './config.js'
import {
  markdownEngineReady,
  markdownReady as defaultMarkdownReady,
  renderSafe,
} from './markdown.js'
import { mountReader, readerKind } from './reader.js'

/** Shown in the detail pane before a row is chosen. */
const EMPTY_DETAIL = 'Pick something on the left, or drop a file here to add one.'

/** Shown in place of a description nothing has written yet. */
const NO_DESCRIPTION =
  "Nothing has read this yet, so I can't find it by what's in it. Tell me what it is."

/** The `kind` vocabulary (DOC-38 §9), as a filter offers it. */
const KINDS = ['image', 'document', 'font', 'capture']

/**
 * The member every capture bundle holds its full-page picture under (REQ-166).
 *
 * NAMED HERE AS A CONSTANT rather than discovered from the member list, because
 * the preview is built SYNCHRONOUSLY and the member list arrives with the
 * detail's second request. The image's own `error` handler is what covers a
 * bundle that somehow lacks one, which is the same guard an ordinary material's
 * preview already relies on.
 */
const SCREENSHOT_MEMBER = 'screenshot.full.png'

/**
 * The glyph a row opens with, by `kind` (REQ-176).
 *
 * A TYPE IS A SHAPE BEFORE IT IS A WORD, which is why this replaced the `kind`
 * pill rather than joining it: the pill spent a row's width restating what a
 * picture says at a glance, and the row has to fit on one line.
 *
 * PARTIAL BY DESIGN, WITH A FALLBACK THAT IS NOT AN ERROR. `kind` is
 * `document | image | font | capture` today (DOC-38 §9) and will grow — a
 * capture is an ingested bundle rather than a file the client handed us, and
 * whatever §9 adds next arrives before this map hears about it. So the three
 * kinds a client uploads are named and everything else lands on the paperclip.
 * A row must never render iconless: an empty leading cell reads as a missing
 * icon, which is a bug, not a kind.
 *
 * Emoji rather than SVG, matching the upload overlay's own area icons — one
 * convention for the two places in the builder that draw a type.
 */
const KIND_ICON = { document: '\u{1F4C4}', image: '\u{1F5BC}', font: '\u{1F524}' }

/** Everything the map does not name, including `capture`. */
const KIND_ICON_FALLBACK = '\u{1F4CE}'

/** The §9 rights block, shown read-only. The client's own record of what we hold. */
const RIGHTS_FIELDS = [
  { name: 'filename', label: 'File' },
  { name: 'kind', label: 'Kind' },
  { name: 'role', label: 'What it is for' },
  { name: 'origin', label: 'Where it came from' },
  { name: 'rights', label: 'Rights' },
  { name: 'republishable', label: 'Can appear on the site', type: 'boolean' },
  { name: 'placed_on', label: 'Used on' },
  { name: 'source_url', label: 'Address' },
]

/**
 * The same block for a capture, minus the one field that cannot mean anything.
 *
 * A CAPTURE HAS NO FILENAME because it is 11–99 files (REQ-166, DOC-38 §9), and
 * the row's `filename` falls back to the TICKET TITLE when the field is absent —
 * so leaving *File* in place would print the site's name in a row labelled as
 * its filename. What replaces it is the member count, which is the true answer
 * to the question *how much of this do we hold*, and it is written beside the
 * picture rather than in the rights record.
 */
const CAPTURE_RIGHTS_FIELDS = RIGHTS_FIELDS.filter((f) => f.name !== 'filename')

/** Whether this row is a capture bundle rather than a single file. */
function isCapture(row) {
  return row.kind === 'capture'
}

/** The role labels, taken from the overlay so the two surfaces cannot disagree. */
const ROLE_LABEL = Object.fromEntries(UPLOAD_AREAS.map((a) => [a.id, a.label]))

/** The one field the description form carries — `mountFields` keys its row on it. */
const DESCRIPTION_FIELD = 'body'

/**
 * Show the description's read cell as rendered markdown instead of its source.
 *
 * THE COMPONENT'S ELEMENT IS KEPT AND ONLY ITS CHILDREN REPLACED, which is the
 * whole reason this is safe: `makeEditable` puts the click-to-edit affordance,
 * the `role`/`tabindex` and both listeners on the CELL, so rewriting what is
 * inside it leaves every one of them attached. Replacing the cell would take
 * them with it, and this would have quietly become a second editing vocabulary.
 *
 * IDEMPOTENT, AND UPGRADEABLE. The mark records which engine painted it, so a
 * cell painted while the CDN was still loading — escaped source, the honest
 * fallback — is repainted once the engine lands, and a cell already painted by
 * the same engine is left alone. That second property is what stops the
 * observer below from re-triggering on its own write.
 *
 * An empty description is left to the component: its placeholder is the answer
 * there, not an empty render.
 */
function paintDescription(host) {
  const cell = host.querySelector(
    `.fields-row[data-field="${DESCRIPTION_FIELD}"] > .fields-value`,
  )
  if (!cell || cell.classList.contains('fields-value-empty')) return
  const engine = markdownEngineReady() ? 'rendered' : 'escaped'
  if (cell.dataset.markdownPaint === engine) return
  // Read the source back off the cell the FIRST time only; after that the cell
  // holds HTML and its text is the rendered prose, not the markdown.
  const markdown = cell.dataset.markdownSource ?? cell.textContent ?? ''
  cell.dataset.markdownSource = markdown
  cell.dataset.markdownPaint = engine
  cell.classList.add('md-body')
  cell.innerHTML = renderSafe(markdown)
  openLinksAway(cell)
}

/**
 * Send every link in a description somewhere that is not this tab (REQ-166).
 *
 * WHY IT IS NEEDED AT ALL. A capture's description OPENS with a link to the site
 * it describes, which is the whole point — the client reads what we made of a
 * site and can go and look at it. But the Library is a tab inside a single-page
 * builder, so an ordinary anchor navigates the WHOLE APP away and takes the
 * client's unsaved editing state with it. The sanitizer keeps anchors and adds
 * no `target` of its own, so the fix belongs here.
 *
 * `rel` AS WELL AS `target`, and not as a formality: these hrefs come from a
 * page we captured off the public web, and `noopener` is what stops the opened
 * document reaching back through `window.opener` into the builder.
 *
 * APPLIED AFTER EVERY PAINT, because `paintDescription` replaces the cell's
 * children each time and would otherwise leave the repainted anchors bare.
 */
function openLinksAway(cell) {
  for (const anchor of cell.querySelectorAll('a[href]')) {
    anchor.target = '_blank'
    anchor.rel = 'noopener noreferrer'
  }
}

/**
 * Where a row's bytes are, as a list of site slugs (BUG-47).
 *
 * TOLERANT OF ABSENCE, so a row that predates `placed_on` — or one the origin
 * has not filled in — reads as "placed nowhere" rather than as a third state
 * every caller has to guard. The three consumers below then ask exactly one
 * question of it and cannot come apart from one another.
 */
function placedList(row) {
  return Array.isArray(row.placed_on) ? row.placed_on : []
}

/** Whether this material's bytes are on the site currently open. */
function placedHere(row, site) {
  return placedList(row).includes(site)
}

function el(tag, className, text) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text != null) node.textContent = text
  return node
}

/**
 * Mount the Library.
 *
 * @param {object} [options]
 * @param {Storage} [options.storage]  the shell's namespaced handle
 * @param {object}  [options.transport] `{list, item, save, fileUrl}` — injected by tests
 * @param {() => string|null} [options.getSite] the site the "used here" badge is about
 * @param {Promise<void>} [options.markdownReady] when the markdown engines have
 *   settled (BUG-42); injected by tests so the cold-load repaint is observable.
 * @param {() => Element|null} [options.getModalHost] where an expanded reader
 *   window is appended (REQ-172). A FUNCTION rather than an element, because the
 *   Library is constructed before the shell hands out its root — the same reason
 *   `getSite` is one. Defaults to `document.body`, which is what a suite driving
 *   the tab against a bare document has.
 */
export function createLibraryPanel(options = {}) {
  const {
    storage,
    transport = {
      list: fetchMaterial,
      item: fetchMaterialItem,
      save: saveMaterialDescription,
      fileUrl: materialFileUrl,
    },
    getSite = () => null,
    markdownReady = defaultMarkdownReady,
    getModalHost = () => null,
  } = options

  const element = el('div', 'builder-library')

  /** Everything the tenant has. The filter narrows this; it never re-fetches. */
  let all = []
  const filter = { text: '', role: '', kind: '', hereOnly: false }

  // --- the filter, in the list header's own slot --------------------------------
  const controls = el('div', 'builder-library__filter')

  const search = document.createElement('input')
  search.type = 'search'
  search.className = 'builder-library__search'
  search.placeholder = 'Filter'
  search.setAttribute('aria-label', 'Filter the library')

  const roleSelect = document.createElement('select')
  roleSelect.className = 'builder-library__role'
  roleSelect.setAttribute('aria-label', 'What it is for')
  roleSelect.append(new Option('Anything', ''))
  for (const area of UPLOAD_AREAS) roleSelect.append(new Option(area.label, area.id))

  const kindSelect = document.createElement('select')
  kindSelect.className = 'builder-library__kind'
  kindSelect.setAttribute('aria-label', 'Kind')
  kindSelect.append(new Option('Any kind', ''))
  for (const kind of KINDS) kindSelect.append(new Option(kind, kind))

  const hereLabel = el('label', 'builder-library__here')
  const here = document.createElement('input')
  here.type = 'checkbox'
  hereLabel.append(here, el('span', null, 'Used on this site'))

  controls.append(search, roleSelect, kindSelect, hereLabel)

  search.addEventListener('input', () => {
    filter.text = search.value.trim().toLowerCase()
    apply()
  })
  roleSelect.addEventListener('change', () => {
    filter.role = roleSelect.value
    apply()
  })
  kindSelect.addEventListener('change', () => {
    filter.kind = kindSelect.value
    apply()
  })
  here.addEventListener('change', () => {
    filter.hereOnly = here.checked
    apply()
  })

  /**
   * Which rows survive the filter.
   *
   * ALL FOUR ARE CONJUNCTIVE and all four are computed here rather than asked of
   * the origin. The list is one tenant's material — tens to low hundreds of rows
   * — so filtering in the browser is instant and, more usefully, keeps "used on
   * this site" a VIEW of a tenant-wide list rather than a query that would make
   * it look like a scope.
   */
  function visible() {
    const site = getSite()
    return all.filter((row) => {
      if (filter.role && row.role !== filter.role) return false
      if (filter.kind && row.kind !== filter.kind) return false
      if (filter.hereOnly && (!site || !placedHere(row, site))) return false
      if (!filter.text) return true
      return `${row.title} ${row.filename}`.toLowerCase().includes(filter.text)
    })
  }

  function apply() {
    listDetail.setItems(visible())
  }

  // --- the list rows ------------------------------------------------------------
  function renderRow(row) {
    const wrap = el('div', 'builder-library__row')

    // THE ICON CARRIES THE KIND, AND CARRIES IT TO A SCREEN READER TOO. Dropping
    // the pill dropped the only place the row said its type in words, so the
    // glyph is labelled rather than hidden — the fact moved, it did not go.
    const icon = el('span', 'builder-library__row-icon', KIND_ICON[row.kind] ?? KIND_ICON_FALLBACK)
    icon.setAttribute('role', 'img')
    icon.setAttribute('aria-label', row.kind ?? 'file')
    icon.title = row.kind ?? ''
    wrap.append(icon)

    wrap.append(el('span', 'builder-library__row-title', row.title || row.filename))

    const meta = el('div', 'builder-library__row-meta')
    if (row.role) {
      meta.append(
        el('span', 'builder-library__badge builder-library__badge--role', ROLE_LABEL[row.role] ?? row.role),
      )
    }
    // THE BADGE THE TICKET ASKS FOR. Present only when it is true, because a
    // "not used on this site" badge on every other row would be noise about the
    // majority to say something about the few.
    const site = getSite()
    if (site && placedHere(row, site)) {
      meta.append(el('span', 'builder-library__badge builder-library__badge--here', 'On this site'))
    }
    wrap.append(meta)
    return wrap
  }

  // --- the detail ---------------------------------------------------------------
  /**
   * One material, in full.
   *
   * BUILT SYNCHRONOUSLY, FILLED ASYNCHRONOUSLY. `openDetail` must return an
   * element now; the body — the description, which the list deliberately does not
   * carry — arrives from a second request. So the frame goes up immediately and
   * the description drops into it, which is also what stops a slow fetch from
   * making the click feel unresponsive.
   */
  function openDetail(row) {
    const view = el('div', 'builder-library__detail')
    let fields = null
    let description = null
    let repaint = null

    // DESTROYED WITH THE DETAIL, because it owns an in-flight fetch and possibly
    // an open dialog. `list-detail` swaps details as the client browses, and a
    // reader left behind would repaint an element that is no longer on screen —
    // and, worse, leave its expanded window over the pane that replaced it.
    const shown = preview(row)
    view.append(shown.element)

    const rights = el('div', 'builder-library__rights')
    view.append(rights)
    fields = mountFields(rights, {
      schema: isCapture(row) ? CAPTURE_RIGHTS_FIELDS : RIGHTS_FIELDS,
      values: {
        filename: row.filename,
        kind: row.kind,
        role: ROLE_LABEL[row.role] ?? row.role ?? '',
        origin: row.origin,
        rights: row.rights,
        republishable: row.republishable,
        // JOINED, BECAUSE PLACEMENT IS PLURAL. `mountFields` reads a scalar, and
        // a material may be on two of the client's sites (DOC-38 §7.7) — so the
        // list is rendered as one, and an unplaced material shows nothing rather
        // than an empty bracket.
        placed_on: placedList(row).join(', '),
        source_url: row.source_url ?? '',
      },
      // READ-ONLY, AND NOT BECAUSE IT IS HARD TO MAKE THEM EDITABLE. These are
      // the rights record, and DOC-38 §10.1 is explicit that it is inferred from
      // provenance rather than asserted by anyone — a client who could set
      // `republishable` by hand would be answering the legal question that
      // section refuses to ask. The one thing they may change is what the
      // material SAYS, below.
      editable: false,
    })

    const heading = el('h3', 'builder-library__heading', 'What this is')
    view.append(heading)

    const status = el('p', 'builder-library__status')
    view.append(status)

    const host = el('div', 'builder-library__description')
    view.append(host)

    void (async () => {
      let item
      try {
        item = await transport.item(row.uid)
      } catch (err) {
        status.textContent = `That could not be loaded: ${err.message}`
        return
      }
      status.textContent = item.body ? '' : NO_DESCRIPTION
      // The member list travels on the item and not on the row — see
      // `membersOf` in `material.ts` for why listing it per row was refused.
      shown.setMembers(item.members)
      description = mountFields(host, {
        schema: [
          {
            name: 'body',
            label: 'What this is',
            widget: 'textarea',
          },
        ],
        values: { body: item.body ?? '' },
        layout: 'stacked',
        // AUTO, NOT BUFFERED. There is one field and no other decision on this
        // pane, so a Save button would be a second click for a form that is
        // already unambiguous — and `auto` reverts the control itself if the
        // write fails, which a hand-rolled Save would have to reimplement.
        commit: 'auto',
        onCommit: async (changes) => {
          const saved = await transport.save(row.uid, changes.body)
          status.textContent = ''
          // The row carries `description_status`, which this write changes, so
          // the list is refreshed from what the store now holds rather than from
          // a guess at what changed.
          Object.assign(row, saved)
          apply()
        },
      })

      // WATCHED RATHER THAN HOOKED, because the component rebuilds the read cell
      // on more occasions than it announces: a commit, a rollback after a failed
      // write, and a cancelled edit all call its `refreshRow`, and only the first
      // two emit anything. Watching the host catches all three with one rule, and
      // `paintDescription` is idempotent so its own write does not re-trigger it.
      paintDescription(host)
      repaint = new MutationObserver(() => paintDescription(host))
      repaint.observe(host, { childList: true, subtree: true })
      // And once more when the engines land, for a detail opened during a cold
      // load: the paint above will have escaped the source, honestly and wrongly.
      void markdownReady.then(() => paintDescription(host))
    })()

    return {
      element: view,
      destroy() {
        repaint?.disconnect()
        shown.destroy()
        fields?.destroy()
        description?.destroy()
      },
    }
  }

  /**
   * The blob, shown rather than named.
   *
   * AN IMAGE IS RENDERED, AND SO NOW IS A DOCUMENT (REQ-172). This pane could
   * show a client their photograph and not their brand guidelines, which left
   * the download link doing the same *"recognise it by its path"* work REQ-132
   * removed from the picker. Markdown, plain text and PDFs get the reader window
   * above the metadata; `reader.js` owns which is which and how each is drawn.
   *
   * THE DOWNLOAD LINK SURVIVES EVERY CASE, including the ones that now render.
   * Being able to read a file on screen is not the same as having it, and the
   * kinds nothing can render — a font, an unrecognised binary — reach exactly
   * the pane they reached before.
   */
  function preview(row) {
    const wrap = el('div', 'builder-library__preview')
    // A CAPTURE'S BYTES ARE ITS SCREENSHOT (REQ-166). The bare file URL serves
    // whichever of a bundle's 11–99 records comes back first, so both the
    // picture and the download name the member explicitly.
    const href = isCapture(row)
      ? transport.fileUrl(row.uid, SCREENSHOT_MEMBER)
      : transport.fileUrl(row.uid)
    let reader = null
    // A capture reads no other way: `capture.json` is `application/json`, which
    // the reader would happily render as text, and a client opening their
    // Library to see a site they admired should be shown the SITE.
    const kind = row.kind === 'image' || isCapture(row) ? null : readerKind(row.content_type)
    if (kind) {
      reader = mountReader({
        kind,
        href,
        filename: row.filename,
        host: getModalHost(),
        markdownReady,
      })
      wrap.append(reader.element)
    }
    if (row.kind === 'image' || isCapture(row)) {
      const img = document.createElement('img')
      img.className = 'builder-library__image'
      img.src = href
      img.alt = row.title || row.filename
      // A material whose bytes are gone is a record naming absent bytes — the
      // failure DOC-38 §7.3's ordering makes unconstructible. If one ever shows
      // up, say so rather than leaving a broken-image glyph.
      img.addEventListener('error', () => {
        img.replaceWith(el('p', 'builder-library__missing', 'That file is no longer in storage.'))
      })
      wrap.append(img)
    }
    const link = document.createElement('a')
    link.className = 'builder-library__download'
    link.href = href
    // THE SCREENSHOT IS WHAT A CAPTURE OFFERS. `row.filename` on a capture is
    // the ticket title (the field is absent and the row falls back to it), so
    // downloading under that name would save a PNG called *Gigabyte Alchemy*.
    link.download = isCapture(row) ? SCREENSHOT_MEMBER : row.filename
    link.textContent = isCapture(row) ? SCREENSHOT_MEMBER : row.filename
    wrap.append(link)

    // HOW MUCH OF THE SITE WE HOLD, filled in when the detail's own request
    // lands. It replaces the *File* field rather than joining it: members are
    // re-extraction machinery and a 99-row list of them would be honest and
    // useless, but the COUNT is the one thing a client would actually want to
    // know about a bundle.
    const count = isCapture(row) ? el('p', 'builder-library__members') : null
    if (count) wrap.append(count)

    return {
      element: wrap,
      destroy: () => reader?.destroy(),
      /** Say how many files the bundle holds, once the detail knows. */
      setMembers(members) {
        if (!count) return
        const n = Array.isArray(members) ? members.length : 0
        count.textContent = n === 0 ? '' : `${n} file${n === 1 ? '' : 's'} captured`
      },
    }
  }

  // --- the component ------------------------------------------------------------
  const listDetail = mountListDetail(element, {
    id: 'library',
    ...(storage ? { storage } : {}),
    items: [],
    getKey: (row) => row.uid,
    listTitle: 'Your material',
    listControls: controls,
    renderRow,
    // ONE PANE, NOT TABS. Tabs are for comparing two things side by side over a
    // long session; a Library is browsed one item at a time, and a tab bar that
    // fills up as the client clicks through their own files is clutter with a
    // close button on it.
    mode: 'no-tab',
    openDetail,
    emptyDetail: EMPTY_DETAIL,
  })

  /** Re-read the tenant's material and redraw. Called after every upload. */
  async function refresh() {
    const { material } = await transport.list()
    all = Array.isArray(material) ? material : []
    apply()
    return all
  }

  return {
    element,
    listDetail,
    refresh,
    /** Everything currently shown, for a host that wants to report a count. */
    getRows: () => visible(),
    /** The site changed under us: the badge and the "used here" filter follow it. */
    siteChanged: () => apply(),
    destroy() {
      listDetail.destroy()
      element.remove()
    },
  }
}
