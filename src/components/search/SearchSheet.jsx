import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react'
import SoftKeyboard from './SoftKeyboard'
import { getSuggestions, normalize, POPULAR_SEARCHES } from '../../utils/search'
import { useUiTheme } from '../../utils/uiTheme'
import './SearchSheet.css'

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
)
const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="24" height="24" aria-hidden>
    <path className="glass-chevron" d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path className="glass-arrow" d="M10 17L5 12L9.99996 7M5 12H19" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
  </svg>
)
const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="24" height="24" aria-hidden>
    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

/* a desktop preview has no OS keyboard, so it gets the drawn one; phones raise their own */
const wantsSoftKeyboard = () =>
  typeof window !== 'undefined' && Boolean(window.matchMedia?.('(hover: hover) and (pointer: fine)').matches)

/* the typed part stays regular, the completion is bold (as the store app shows it) */
function Highlight({ text, typed }) {
  const q = normalize(typed)
  if (!q || !text.startsWith(q)) return text
  return (
    <>
      {text.slice(0, q.length)}
      <b>{text.slice(q.length)}</b>
    </>
  )
}

/**
 * Full-screen search: the field with the keyboard up, popular searches before anything is
 * typed, autocomplete suggestions as soon as something is. Always mounted (hidden) so
 * `open()` can focus the field inside the tap itself — the only way iOS Safari raises its
 * keyboard. Submitting a term (Enter, the keyboard's search key, a suggestion) closes the
 * sheet and hands the term to `onSubmit`.
 */
const SearchSheet = forwardRef(function SearchSheet({ onSubmit, placeholder }, ref) {
  const [theme] = useUiTheme()
  const isIos = theme === 'ios'
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [softKeyboard] = useState(wantsSoftKeyboard)
  const inputRef = useRef(null)

  const close = () => {
    setOpen(false)
    inputRef.current?.blur()
  }
  useImperativeHandle(ref, () => ({
    open(initial = '') {
      setDraft(initial)
      setOpen(true)
      inputRef.current?.focus({ preventScroll: true })
    },
    close,
  }))

  const submit = (term) => {
    const q = term.trim()
    if (!q) return
    close()
    onSubmit(q)
  }

  const suggestions = useMemo(() => getSuggestions(draft), [draft])
  const typed = draft.trim().length > 0

  const back = (
    <button type="button" className={isIos ? 'home-search-back' : 'search-sheet-back'} aria-label="Back" tabIndex={open ? 0 : -1} onMouseDown={(e) => e.preventDefault()} onClick={close}>
      <BackIcon />
    </button>
  )

  return (
    <div className={`search-sheet${open ? ' search-sheet--open' : ''}`} role="dialog" aria-label="Search" aria-hidden={!open}>
      <form
        className="search-sheet-bar"
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          submit(draft)
        }}
      >
        {!isIos && back}
        <div className="home-search search-sheet-field">
          {isIos && back}
          <input
            ref={inputRef}
            className="home-search-input"
            type="search"
            enterKeyHint="search"
            inputMode="search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            tabIndex={open ? 0 : -1}
            placeholder={placeholder ?? (isIos ? 'Search for ‘Kurtis’' : "Search for 'kurtis'")}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') close()
            }}
            aria-label="Search products"
          />
          {typed && (
            <button type="button" className="home-search-icon-btn search-sheet-clear" aria-label="Clear" onMouseDown={(e) => e.preventDefault()} onClick={() => setDraft('')}>
              <CloseIcon />
            </button>
          )}
        </div>
      </form>

      <div className="search-sheet-body">
        {typed ? (
          <ul className="search-suggest" aria-label="Suggestions">
            {suggestions.map((s) => (
              <li key={s} className="search-suggest-row">
                <button type="button" className="search-suggest-main" onMouseDown={(e) => e.preventDefault()} onClick={() => submit(s)}>
                  <SearchIcon />
                  <span className="search-suggest-text"><Highlight text={s} typed={draft} /></span>
                </button>
                {/* ↖ puts the suggestion in the field to keep typing (store-app pattern) */}
                <button type="button" className="search-suggest-fill" aria-label={`Edit ${s}`} onMouseDown={(e) => e.preventDefault()} onClick={() => setDraft(`${s} `)}>
                  ↖
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <section className="search-popular">
            <h2 className="search-popular-title">Popular searches</h2>
            <div className="search-popular-chips">
              {POPULAR_SEARCHES.map((p) => (
                <button key={p} type="button" className="search-popular-chip" onMouseDown={(e) => e.preventDefault()} onClick={() => submit(p)}>
                  {p}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      {open && softKeyboard && (
        <div className="search-sheet-kb">
          <SoftKeyboard
            skin={isIos ? 'ios' : 'android'}
            onInput={(ch) => setDraft((d) => d + ch)}
            onBackspace={() => setDraft((d) => d.slice(0, -1))}
            onEnter={() => submit(draft)}
          />
        </div>
      )}
    </div>
  )
})

export default SearchSheet
