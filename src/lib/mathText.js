const SUPERSCRIPT_MAP = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '-': '⁻',
  '+': '⁺',
}

function toSuperscript(exp) {
  return exp
    .split('')
    .map((ch) => SUPERSCRIPT_MAP[ch] ?? ch)
    .join('')
}

// AI가 그대로 "^2", "x^(-1)" 같은 caret 표기를 써도 화면에는 실제 위첨자로 보이게 변환한다.
export function formatMathText(text) {
  if (!text) return text
  return text
    .replace(/\^\((-?\d+)\)/g, (_, exp) => toSuperscript(exp))
    .replace(/\^(-?\d+)/g, (_, exp) => toSuperscript(exp))
}
