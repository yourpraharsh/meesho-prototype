import { useState } from 'react'
import './SoftKeyboard.css'

/* Simulated phone keyboard for desktop viewing (touch devices get the real one; the parent
   decides whether to render this). In-flow block meant to sit last in a flex column.
   Keys never take focus, so the search input keeps its caret: pointer/mouse down is
   cancelled and the action fires on click. */

/* Same glyph as the app's search icon (src/pages/Home.jsx → SearchIcon) */
const SearchGlyph = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
)

const LETTER_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']
const NUMBER_ROWS = {
  ios: ['1234567890', ['-', '/', ':', ';', '(', ')', '₹', '&', '@', '"'], ['.', ',', '?', '!', "'"]],
  android: ['1234567890', ['@', '#', '₹', '_', '&', '-', '+', '(', ')', '/'], ['.', ',', '?', '!', "'"]],
}

const stop = (e) => e.preventDefault()

const Key = ({ kind = 'char', className = '', label, onPress, ariaLabel, active }) => (
  <button
    type="button"
    tabIndex={-1}
    className={`soft-kb-key soft-kb-key--${kind}${active ? ' soft-kb-key--on' : ''}${className ? ` ${className}` : ''}`}
    aria-label={ariaLabel}
    aria-pressed={active === undefined ? undefined : active}
    onPointerDown={stop}
    onMouseDown={stop}
    onClick={onPress}
  >
    {label}
  </button>
)

export default function SoftKeyboard({ skin = 'ios', onInput, onBackspace, onEnter }) {
  const isIos = skin !== 'android'
  const [layer, setLayer] = useState('letters') // 'letters' | 'numbers'
  const [shift, setShift] = useState(false) // one-shot: applies to the next letter

  const type = (ch) => onInput?.(ch)
  const typeLetter = (ch) => {
    type(shift ? ch.toUpperCase() : ch)
    if (shift) setShift(false)
  }
  const toggleLayer = () => {
    setLayer((l) => (l === 'letters' ? 'numbers' : 'letters'))
    setShift(false)
  }

  const letters = layer === 'letters'
  const rows = letters ? LETTER_ROWS : NUMBER_ROWS[isIos ? 'ios' : 'android']
  const charKeys = (row) =>
    [...row].map((ch) => (
      <Key
        key={ch}
        label={letters && shift ? ch.toUpperCase() : ch}
        onPress={() => (letters ? typeLetter(ch) : type(ch))}
      />
    ))

  const backspace = <Key kind="fn" className="soft-kb-key--side" label="⌫" ariaLabel="Delete" onPress={() => onBackspace?.()} />
  const layerKey = (
    <Key
      kind="fn"
      className="soft-kb-key--layer"
      label={letters ? (isIos ? '123' : '?123') : 'ABC'}
      ariaLabel={letters ? 'Numbers' : 'Letters'}
      onPress={toggleLayer}
    />
  )
  const space = (
    <Key
      className="soft-kb-key--space"
      label={isIos ? 'space' : <span className="soft-kb-space-hint">English</span>}
      ariaLabel="Space"
      onPress={() => type(' ')}
    />
  )
  const enter = (
    <Key
      kind="enter"
      label={isIos ? 'search' : <SearchGlyph />}
      ariaLabel="Search"
      onPress={() => onEnter?.()}
    />
  )

  // Taps in the gaps between keys must not blur the input either
  return (
    <div
      className={`soft-kb soft-kb--${isIos ? 'ios' : 'android'}`}
      role="group"
      aria-label="Keyboard"
      onPointerDown={stop}
      onMouseDown={stop}
    >
      <div className="soft-kb-rows">
        <div className="soft-kb-row">{charKeys(rows[0])}</div>
        <div className="soft-kb-row">{charKeys(rows[1])}</div>
        <div className="soft-kb-row soft-kb-row--split">
          {letters ? (
            <Key
              kind="fn"
              className="soft-kb-key--side"
              label="⇧"
              ariaLabel="Shift"
              active={shift}
              onPress={() => setShift((s) => !s)}
            />
          ) : (
            /* Symbols page switch — shown for realism, not wired */
            <Key kind="fn" className="soft-kb-key--side soft-kb-key--text" label={isIos ? '#+=' : '=\\<'} ariaLabel="More symbols" />
          )}
          <div className={`soft-kb-mid${letters ? '' : ' soft-kb-mid--wide'}`}>{charKeys(rows[2])}</div>
          {backspace}
        </div>
        <div className="soft-kb-row soft-kb-row--bottom">
          {layerKey}
          {!isIos && <Key kind="fn" className="soft-kb-key--punct" label="," onPress={() => type(',')} />}
          {space}
          {!isIos && <Key kind="fn" className="soft-kb-key--punct" label="." onPress={() => type('.')} />}
          {enter}
        </div>
      </div>
      {/* Home indicator (iOS) / gesture-nav pill (Android) */}
      <div className="soft-kb-safe" aria-hidden><span className="soft-kb-bar" /></div>
    </div>
  )
}
