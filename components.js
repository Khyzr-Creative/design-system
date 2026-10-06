/* khyzr design system: the React primitives, as one script. Needs React 18 on window. */
(function () {
var ns = (window.KhyzrComponents = window.KhyzrComponents || {});
// Button
(function () {
function Button({ variant = 'primary', size = 'm', href, onClick, disabled, children }) {
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const [focus, setFocus] = React.useState(false);
  const v = ['primary', 'secondary', 'white', 'ghost'].indexOf(variant) < 0 ? 'primary' : variant;
  const onDark = v === 'white' || v === 'ghost';
  // khyzr.com's two pills: m is the compact one (the nav's, 13.5px in a 40px pill),
  // l the page's (the hero's, 15px with 14px by 26px of padding). In rem, so they follow the root.
  const sizes = {
    m: { fontSize: '.84375rem', height: '2.5rem', padding: '0 1.25rem' },
    l: { fontSize: '.9375rem', padding: '.875rem 1.625rem' }
  };
  const looks = {
    primary:   { backgroundColor: 'var(--ink)', color: 'var(--on-dark-heading)', borderColor: 'transparent' },
    secondary: { backgroundColor: 'transparent', color: 'var(--ink)', borderColor: 'var(--hairline)' },
    white:     { backgroundColor: 'var(--on-dark-heading)', color: 'var(--ink)', borderColor: 'transparent' },
    ghost:     { backgroundColor: 'transparent', color: 'var(--on-dark-heading)', borderColor: 'rgba(255,255,255,.28)' }
  };
  // hover: every pill but the ghost grows; the page's primary pill also deepens to black and
  // takes the button shadow; the secondary turns white under a darker border; the ghost stays color-only
  const hovers = {
    primary:   size === 'l' ? { backgroundColor: '#000', boxShadow: 'var(--shadow-button)' } : {},
    secondary: { backgroundColor: 'var(--paper)', borderColor: 'var(--hairline-strong)' },
    white:     {},
    ghost:     { borderColor: 'rgba(255,255,255,.6)' }
  };
  const live = !disabled;
  const grown = hover && v !== 'ghost';
  const style = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '.55em',
    fontFamily: 'var(--font-text)', fontWeight: 'var(--fw-ui)', lineHeight: 1, whiteSpace: 'nowrap',
    borderRadius: 'var(--radius-pill)', borderWidth: 1, borderStyle: 'solid', boxShadow: 'none',
    cursor: live ? 'pointer' : 'default', textDecoration: 'none', boxSizing: 'border-box', userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    opacity: live ? 1 : .45, pointerEvents: live ? 'auto' : 'none',
    transform: live && press ? 'scale(.98)' : live && grown ? 'scale(1.05)' : 'scale(1)',
    transition: 'transform var(--dur-hover, 500ms) var(--ease-pop, ease), background-color var(--dur-color, 200ms) var(--ease-standard, ease), box-shadow var(--dur-hover, 500ms) var(--ease-standard, ease), border-color var(--dur-color, 200ms) var(--ease-standard, ease)',
    // keyboard focus: the system's ring, outside the pill; white on a dark ground
    outline: focus ? 'var(--focus-width, 2px) solid var(' + (onDark ? '--focus-ring-on-dark' : '--focus-ring') + ')' : 'none',
    outlineOffset: 'var(--focus-offset, 3px)',
    ...(sizes[size] || sizes.m),
    ...looks[v],
    ...(live && hover ? hovers[v] : {})
  };
  const props = {
    style, onClick,
    // a hover only where the pointer can hover; a press answers every pointer
    onPointerEnter: (e) => { if (e.pointerType !== 'touch') setHover(true); },
    onPointerLeave: () => { setHover(false); setPress(false); },
    onPointerDown: () => setPress(true),
    onPointerUp: () => setPress(false),
    onPointerCancel: () => setPress(false),
    // the ring shows for the keyboard, not for a click
    onFocus: (e) => { let k = true; try { k = e.target.matches(':focus-visible'); } catch (_) {} setFocus(k); },
    onBlur: () => setFocus(false)
  };
  return href ? React.createElement('a', { href, ...props }, children) : React.createElement('button', { type: 'button', disabled, ...props, style: { ...style, appearance: 'none' } }, children);
}
ns.Button = Button;
})();
// Badge
(function () {
function Badge({ tone = 'outline', children }) {
  const looks = {
    solid:   { color: 'var(--on-dark-heading)', background: 'var(--khyzr-green)', border: '1px solid var(--khyzr-green)' },
    outline: { color: 'var(--khyzr-green)', background: 'transparent', border: '1px solid var(--green-100)' },
    neutral: { color: 'var(--muted)', background: 'transparent', border: '1px solid var(--hairline)' },
    mint:    { color: 'var(--deep-forest)', background: 'var(--green-100)', border: '1px solid var(--green-100)' }
  };
  return React.createElement('span', { style: {
    ...looks[tone] || looks.outline, display: 'inline-flex', alignItems: 'center',
    fontFamily: 'var(--font-tech)', fontWeight: 600, fontSize: 'var(--text-label, 11px)',
    letterSpacing: 'var(--tracking-label, .10em)', textTransform: 'uppercase',
    borderRadius: 'var(--radius-pill)', padding: '3px 9px', lineHeight: 1.4
  } }, children);
}
ns.Badge = Badge;
})();
// Eyebrow
(function () {
function Eyebrow({ num, children, onDark }) {
  // the eyebrow as khyzr's documents set it: the technical register, in khyzr Green, behind a short green dash
  const green = onDark ? 'var(--on-dark-accent)' : 'var(--khyzr-green)';
  return React.createElement('p', { style: {
    margin: 0, fontFamily: 'var(--font-tech)', fontWeight: 600, fontSize: 'var(--text-eyebrow, 12px)',
    letterSpacing: 'var(--tracking-eyebrow, .16em)', textTransform: 'uppercase', lineHeight: 1.2,
    color: green, display: 'inline-flex', alignItems: 'center', gap: '.85ch'
  } },
    React.createElement('span', { 'aria-hidden': true, style: { width: 24, height: 1, background: green } }),
    num ? num + ' · ' + children : children
  );
}
ns.Eyebrow = Eyebrow;
})();
// ProofStat
(function () {
function ProofStat({ value, suffix, label, onDark }) {
  // khyzr.com's Trusted by figure: the numeral and its unit mark at one size, the caption a line below.
  // The site sizes the numeral on its own column unit; here the same clamp reads the window (the two agree up to 1200px wide).
  return React.createElement('div', { style: { fontFamily: 'var(--font-text)' } },
    React.createElement('span', { style: { display: 'block', fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-display)', fontSize: 'clamp(2.6rem,4.2vw,4rem)', letterSpacing: '-.03em', lineHeight: 1, whiteSpace: 'nowrap', color: onDark ? 'var(--on-dark-heading)' : 'var(--ink)', fontVariantNumeric: 'tabular-nums' } },
      value,
      suffix && React.createElement('span', { style: { color: onDark ? 'var(--green-300)' : 'var(--khyzr-green)' } }, suffix)
    ),
    label && React.createElement('span', { style: { display: 'block', marginTop: 'var(--space-1)', fontFamily: 'var(--font-tech)', fontWeight: 600, fontSize: 'var(--text-eyebrow)', lineHeight: 1.2, letterSpacing: 'var(--tracking-eyebrow)', textTransform: 'uppercase', color: onDark ? 'var(--on-dark-muted)' : 'var(--muted)' } }, label)
  );
}
ns.ProofStat = ProofStat;
})();
// PlateField
(function () {
function PlateField({ label, helper, error, textarea, onDark, placeholder, value, onChange, disabled, type = 'text', rows = 4 }) {
  const [focus, setFocus] = React.useState(false);
  const base = onDark ? {
    background: error ? 'rgba(224,138,128,.10)' : focus ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.08)',
    border: '1px solid ' + (error ? '#E08A80' : focus ? 'var(--green-300)' : 'transparent'),
    color: 'var(--on-dark-heading)',
    boxShadow: focus ? '0 0 0 3px rgba(145,188,145,.18)' : 'none'
  } : {
    background: error ? 'rgba(182,83,44,.06)' : focus ? 'var(--paper)' : 'var(--surface-2)',
    border: '1px solid ' + (error ? 'var(--error)' : focus ? 'var(--khyzr-green)' : 'transparent'),
    color: 'var(--body)',
    boxShadow: focus ? '0 0 0 3px rgba(10,105,10,.14)' : 'none'
  };
  const field = {
    ...base, width: '100%', boxSizing: 'border-box', borderRadius: 'var(--radius-m)', padding: '13px 16px',
    fontFamily: 'var(--font-text)', fontSize: 15, lineHeight: 1.45, outline: 'none',
    transition: 'background var(--dur-color, 200ms) var(--ease-standard, ease), border-color var(--dur-color, 200ms) var(--ease-standard, ease), box-shadow var(--dur-color, 200ms) var(--ease-standard, ease)', resize: 'vertical'
  };
  const el = React.createElement(textarea ? 'textarea' : 'input', {
    style: field, placeholder, value, disabled,
    ...(textarea ? { rows } : { type }),
    onChange: onChange ? (e) => onChange(e.target.value) : undefined,
    onFocus: () => setFocus(true), onBlur: () => setFocus(false)
  });
  return React.createElement('label', { style: { display: 'flex', flexDirection: 'column', gap: 7, opacity: disabled ? .45 : 1, fontFamily: 'var(--font-text)' } },
    label && React.createElement('span', { style: { fontSize: 13, fontWeight: 'var(--fw-ui)', color: onDark ? 'var(--on-dark-soft)' : 'var(--body)' } }, label),
    el,
    (error || helper) && React.createElement('span', { style: { fontSize: 12.5, color: error ? (onDark ? '#E08A80' : 'var(--error)') : (onDark ? 'var(--on-dark-muted)' : 'var(--muted)') } }, error || helper)
  );
}
ns.PlateField = PlateField;
})();
})();
