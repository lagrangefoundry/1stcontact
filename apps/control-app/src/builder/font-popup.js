import { createModalShell, modalButton, modalFooter } from './modal.js'
import { FONT_CATEGORIES, browseList } from './font-search.js'

/**
 * [[REQ-314]] — the font picker: thirty curated faces, and a query box that
 * reaches all of them.
 *
 * ONE CONTROL, TWO STATES, NO MODE SWITCH. Opened with an empty query it is the
 * curated thirty, **each written in its own face** — a font control that names
 * fonts in a UI font is asking somebody to choose a typeface from a list of
 * words, which is not how anyone picks type. Type anything and the curated list
 * is replaced by matches from the WHOLE mirror. There is no "advanced" toggle,
 * no second screen and no preference to find: typing is the only gesture, and it
 * is available the moment the dialog opens.
 *
 * SEARCH RESULTS ARE LISTED IN THE UI FACE, and that is a decision rather than
 * an omission (operator, 2026-09-22: *"I only want to render the curated list in
 * fonts — if you go looking by name you need to know what you are looking for"*).
 * Somebody typing `Archivo` is already committed to Archivo; the preview earns
 * its cost in browse mode, not in lookup mode. It is also what makes the whole
 * design affordable: **typing fetches no fonts at all**, so the debounce-and-
 * fetch-storm problem this control could have had does not arise.
 *
 * WHAT IT RETURNS. A family NAME, or `null` for a cancel. It binds nothing,
 * writes nothing and reaches no page: the caller stages the answer and the
 * modal's Save posts it with everything else, so a typeface travels in the same
 * diff as the words beside it. The origin is the authority on whether the family
 * can actually be served — see `font-search.js`.
 */

/** Where the previewed faces are fetched from, and the marker on the sheet. */
const PREVIEW_STYLE_MARKER = 'data-font-preview'

/**
 * Inject an `@font-face` for one curated row, once.
 *
 * `font-display: swap` IS THE WHOLE LOADING POLICY. A row paints in the fallback
 * immediately and upgrades when its face arrives, so the list NEVER BLOCKS on a
 * preview — the dialog is usable while 30 files are still in flight, and a
 * mirror that 404s costs a row its face rather than costing the control its
 * responsiveness.
 *
 * THE URL IS RESOLVED AGAINST THE PREVIEW'S OWN ROOT, which is the root the
 * page's own faces resolve at ([[REQ-312]]). The `src` arrives root-relative and
 * composed by the schema's own `platformFontSrc`, so the leading slash is all
 * this has to take off; a `_fonts/` literal here would be a fifth spelling of a
 * path four programs already have to agree about.
 */
function injectFace(sheet, family, src, base) {
  const key = `${family}::${src}`
  if (sheet.dataset.loaded?.includes(`\u0000${key}\u0000`)) return
  sheet.dataset.loaded = `${sheet.dataset.loaded ?? ''}\u0000${key}\u0000`
  let url = src
  try {
    url = new URL(src.replace(/^\/+/, ''), base).href
  } catch {
    // A base the caller could not supply (no frame yet) leaves the root-relative
    // `src` standing, which is the right address on this origin anyway.
  }
  sheet.append(
    document.createTextNode(
      `@font-face{font-family:"${family.replace(/["\\]/g, '')}";src:url("${url}") format("woff2");font-display:swap;}\n`,
    ),
  )
}

/**
 * Open the picker.
 *
 * @param {object} spec
 * @param {Element} [spec.host] - inside the shell root; see `modal.js`
 * @param {string} [spec.value] - the family the caller currently holds
 * @param {() => Promise<object>} spec.loadCorpus - `/api/fonts`, once per session
 * @param {string} [spec.previewBase] - the preview frame's own URL
 * @returns {Promise<string|null>} the chosen family, or `null`
 */
export function openFontPopup(spec) {
  const { value = '', loadCorpus, previewBase = '' } = spec

  return new Promise((resolve) => {
    let corpus = null
    let selected = value || null
    let chips = new Set()
    /** Resolved once, on close, so every route out answers exactly once. */
    let answer = null

    const { panel, close, mount } = createModalShell({
      host: spec.host,
      title: 'Choose a font',
      onClose: () => resolve(answer),
    })

    const heading = document.createElement('h2')
    heading.className = 'builder-modal__title'
    heading.textContent = 'Choose a font'

    // THE QUERY BOX IS FIRST AND IS FOCUSED, which is the whole of "reaching the
    // full mirror takes no discovery". A person who knows what they want types
    // it; a person who does not reads the thirty rows underneath.
    const search = document.createElement('input')
    search.type = 'search'
    search.className = 'builder-font__search'
    search.placeholder = 'Search all fonts…'
    search.setAttribute('aria-label', 'Search all fonts')

    const chipRow = document.createElement('div')
    chipRow.className = 'builder-font__chips'
    chipRow.setAttribute('role', 'group')
    chipRow.setAttribute('aria-label', 'Font categories')

    const list = document.createElement('div')
    list.className = 'builder-font__list'
    // `radiogroup`, so the browser supplies arrow-key navigation, the
    // single-selection invariant and the announcement — the same reasoning the
    // palette popup and the image picker's grid give for theirs.
    list.setAttribute('role', 'radiogroup')
    list.setAttribute('aria-label', 'Fonts')

    const status = document.createElement('p')
    status.className = 'builder-font__status'

    const note = document.createElement('div')
    note.className = 'builder-font__note'
    note.hidden = true

    // The faces of whatever is currently on screen. A `<style>` inside the
    // dialog, so closing the dialog takes the rules with it — the builder chrome
    // is not left resolving thirty families it no longer draws.
    const sheet = document.createElement('style')
    sheet.setAttribute(PREVIEW_STYLE_MARKER, '')

    panel.append(heading, sheet, search, chipRow, status, note, list)

    const cancel = modalButton('Cancel', 'builder-modal__btn', close)
    const use = modalButton(
      'Use this font',
      'builder-modal__btn builder-modal__btn--primary',
      () => {
        if (!selected) return
        answer = selected
        close()
      },
    )
    panel.append(modalFooter([cancel, use]))
    // The skeleton is complete, so mount it — the corpus arrives below and paints
    // into a dialog the operator can already see. Waiting for the load would
    // leave the click that opened this doing nothing visible.
    mount()
    search.focus()

    for (const category of FONT_CATEGORIES) {
      const chip = document.createElement('button')
      chip.type = 'button'
      chip.className = 'builder-font__chip'
      chip.dataset.chip = category.id
      chip.textContent = category.label
      // `aria-pressed`, because a chip is a TOGGLE and not a link: the state has
      // to be announced, and a class cannot announce anything.
      chip.setAttribute('aria-pressed', 'false')
      chip.addEventListener('click', () => {
        if (chips.has(category.id)) chips.delete(category.id)
        else chips.add(category.id)
        chip.setAttribute('aria-pressed', chips.has(category.id) ? 'true' : 'false')
        chip.classList.toggle('is-on', chips.has(category.id))
        render()
      })
      chipRow.append(chip)
    }

    // No debounce and nothing fetched: the corpus is already here and the rows a
    // query produces are drawn in the UI face.
    search.addEventListener('input', render)

    void (async () => {
      try {
        corpus = await loadCorpus()
      } catch (err) {
        status.textContent =
          err instanceof Error ? err.message : 'The font list could not be loaded.'
        return
      }
      render()
    })()

    // ── rendering ────────────────────────────────────────────────────────────

    function render() {
      if (!corpus) return
      list.textContent = ''
      note.hidden = true
      note.textContent = ''

      // A DEPLOYMENT WITH NO MIRROR SAYS SO. `1c fonts mirror` is a build step
      // and a fresh checkout has not run it; an empty list would read as a
      // broken control rather than as an unpopulated one.
      if (!corpus.families?.length) {
        status.textContent = 'This deployment serves no fonts yet — the font mirror has not been built.'
        use.disabled = true
        return
      }

      const view = browseList(corpus, { query: search.value, chips })
      use.disabled = !selected

      if (view.unserved) sayUnserved(view.unserved)

      for (const family of view.rows) {
        list.append(rowFor(family, view.previewFaces))
      }

      // THE CAP IS VISIBLE WHEN IT BITES. A list that silently stopped at thirty
      // reads as "that is all there is", which is the one thing this control must
      // not tell a developer who is looking for something.
      if (view.total > view.rows.length) {
        status.textContent = `Showing ${view.rows.length} of ${view.total} — keep typing to narrow it.`
      } else if (view.curated) {
        status.textContent = `${view.rows.length} favourites — type to search all ${corpus.families.length}.`
      } else if (view.total === 0) {
        status.textContent = view.unserved
          ? ''
          : `No font matches “${search.value.trim()}”.`
      } else {
        status.textContent = `${view.total} ${view.total === 1 ? 'font' : 'fonts'}.`
      }
    }

    /**
     * Say why a famous family is missing, rather than showing an empty list.
     *
     * A DEVELOPER TYPING `Helvetica` HAS ASKED A REASONABLE QUESTION. Answering
     * it with nothing says "no such font", which is false and unhelpable; the
     * true answer names the obstacle and the way round it, and offers the open
     * faces that set a page the same way.
     */
    function sayUnserved(entry) {
      note.hidden = false
      const why = document.createElement('p')
      why.className = 'builder-font__why'
      why.textContent =
        entry.reason === 'system'
          ? `${entry.family} is licensed with the operating system it ships on, so it cannot be served as a web font.`
          : `${entry.family} is a commercial typeface. Web font licences are per-licensee and cannot be shared across customer sites, so we cannot serve it for you.`
      note.append(why)

      const how = document.createElement('p')
      how.className = 'builder-font__how'
      how.textContent =
        'If the client holds a licence for it, ask me in chat to upload their own copy and it will be served from their site.'
      note.append(how)

      if (entry.instead.length) {
        const swap = document.createElement('p')
        swap.className = 'builder-font__instead'
        swap.append(document.createTextNode('Close open alternatives: '))
        entry.instead.forEach((name, i) => {
          if (i) swap.append(document.createTextNode(', '))
          const pick = document.createElement('button')
          pick.type = 'button'
          pick.className = 'builder-font__swap'
          pick.textContent = name
          // Puts the name in the box rather than choosing outright: the person
          // still gets to see the family sitting in a list before committing to
          // it, which is the same beat every other route through this control
          // has.
          pick.addEventListener('click', () => {
            search.value = name
            render()
          })
          swap.append(pick)
        })
        note.append(swap)
      }
    }

    /** One row: the family's name, in its own face when this state previews. */
    function rowFor(family, preview) {
      const row = document.createElement('button')
      row.type = 'button'
      row.className = 'builder-font__row'
      row.dataset.family = family.family
      row.setAttribute('role', 'radio')
      row.setAttribute('aria-checked', family.family === selected ? 'true' : 'false')
      if (family.family === selected) row.classList.add('is-selected')

      const name = document.createElement('span')
      name.className = 'builder-font__name'
      name.textContent = family.family
      if (preview && family.preview) {
        name.classList.add('builder-font__name--face')
        // The family is named on the ELEMENT and the face is injected when the
        // row scrolls into view — see {@link watch}. Naming it here rather than
        // at injection time means a row whose face never arrives still paints
        // its name, in the fallback, rather than paintingly nothing.
        name.style.fontFamily = `"${family.family}", var(--shell-font, sans-serif)`
      }

      const kind = document.createElement('span')
      kind.className = 'builder-font__kind'
      kind.textContent = family.slab ? 'Slab Serif' : family.category
      row.append(name, kind)

      row.addEventListener('click', () => {
        selected = family.family
        use.disabled = false
        for (const other of list.querySelectorAll('.builder-font__row')) {
          const on = other.dataset.family === selected
          other.classList.toggle('is-selected', on)
          other.setAttribute('aria-checked', on ? 'true' : 'false')
        }
      })

      if (preview && family.preview) watch(row, family)
      return row
    }

    /**
     * Load a row's face when the row is on screen, and not before.
     *
     * ONLY WHAT IS VISIBLE. The curated set is bounded and cached — roughly a
     * megabyte of unmodified upstream `woff2`, shared across tenants because the
     * platform tier is shared-served — so the cost is paid once per reader
     * rather than once per site. Fetching all thirty the instant the dialog opens
     * would still be bounded, and would still spend most of it on rows nobody
     * scrolled to.
     *
     * NO OBSERVER IS AN ORDINARY ENVIRONMENT, not a failure: a document without
     * `IntersectionObserver` loads every row's face instead, which is the same
     * bounded set arriving less lazily.
     */
    function watch(row, family) {
      const load = () => injectFace(sheet, family.family, family.preview, previewBase)
      if (typeof IntersectionObserver !== 'function') {
        load()
        return
      }
      const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          load()
          observer.disconnect()
        }
      })
      observer.observe(row)
    }
  })
}
