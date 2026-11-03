/**
 * Prototype search: autocomplete suggestions and results for the search sheet / results page.
 * Results are honest where the catalogue allows (sarees, kurtis, shirts …): the products of
 * the matching category come first, each once; everything else follows so a search never
 * ends in an empty page, even for words the catalogue does not know.
 */

/* one entry per catalogue category: the words that mean it, and the phrases people type */
const CATALOG = [
  {
    label: 'Sarees',
    categoryIds: ['women_saree'],
    keywords: ['saree', 'sari', 'saaree', 'saree blouse'],
    suggestions: [
      'saree', 'sarees for women', 'silk saree', 'cotton saree', 'saree with blouse',
      'banarasi saree', 'georgette saree', 'party wear saree', 'printed saree', 'chiffon saree',
    ],
  },
  {
    label: 'Kurtis',
    categoryIds: ['women_kurti'],
    keywords: ['kurti', 'kurta', 'kurtie', 'anarkali'],
    titleWords: ['kurta', 'kurti'],
    suggestions: [
      'kurti', 'kurtis for women', 'kurta set with dupatta', 'cotton kurti', 'anarkali kurti',
      'kurti pant set', 'long kurti', 'rayon kurti', 'printed kurti', 'kurti for women party wear',
    ],
  },
  {
    label: 'Top & Bottom Sets',
    categoryIds: ['lod_top_bottom_sets'],
    keywords: ['co ord', 'coord', 'top and bottom', 'top bottom', 'night suit', 'nightsuit', 'western', 'dress', 'set', 'top'],
    suggestions: [
      'co ord set for women', 'top and bottom set', 'night suit for women', 'western dress for women',
      'tops for women', 'dress for women',
    ],
  },
  {
    label: 'Shirts',
    categoryIds: ['mens_shirts'],
    keywords: ['shirt', 't shirt', 'tshirt', 'mens shirt'],
    suggestions: [
      'shirts for men', 'cotton shirt for men', 'check shirt', 'formal shirt for men', 't shirt for men',
      'linen shirt',
    ],
  },
  {
    label: 'Shoes',
    categoryIds: ['mens_shoes'],
    keywords: ['shoe', 'sneaker', 'footwear', 'sandal', 'slipper', 'chappal', 'loafer'],
    suggestions: [
      'shoes for men', 'sports shoes', 'sneakers for men', 'casual shoes', 'loafers for men', 'sandals for men',
    ],
  },
  {
    label: 'Lipstick',
    categoryIds: ['beauty_lipstick'],
    keywords: ['lipstick', 'lip', 'makeup', 'beauty', 'matte'],
    suggestions: ['lipstick', 'matte lipstick', 'lipstick combo', 'liquid lipstick', 'makeup kit'],
  },
  {
    label: 'Bedsheets',
    categoryIds: ['home_bedsheets'],
    keywords: ['bedsheet', 'bed sheet', 'bedcover', 'double bed', 'pillow cover'],
    suggestions: ['bedsheet', 'double bedsheet', 'cotton bedsheet', 'king size bedsheet', 'bedsheet with pillow covers'],
  },
  {
    label: 'Water bottles',
    categoryIds: ['kitchen_water_bottle'],
    keywords: ['bottle', 'water bottle', 'flask', 'copper'],
    suggestions: ['water bottle', 'copper water bottle', 'steel water bottle', 'water bottle for kids'],
  },
  {
    label: 'Cookers',
    categoryIds: ['kitchen_cooker', 'kitchen_cooker_volume'],
    keywords: ['cooker', 'pressure cooker', 'cookware', 'kitchen'],
    suggestions: ['pressure cooker', 'pressure cooker 3 litre', 'kitchen items'],
  },
  {
    label: 'Diapers',
    categoryIds: ['baby_diaper'],
    keywords: ['diaper', 'pampers', 'baby'],
    suggestions: ['baby diapers', 'diaper pants', 'baby products'],
  },
]

/** Shown before anything is typed. */
export const POPULAR_SEARCHES = ['Sarees', 'Kurtis', 'Shirts for men', 'Co ord set', 'Shoes', 'Bedsheet', 'Lipstick', 'Water bottle']

const ALL_SUGGESTIONS = CATALOG.flatMap((c) => c.suggestions)

/** lowercase, punctuation to spaces ("co-ord" → "co ord"), single spaces */
export function normalize(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9₹\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/* "sarees" → "saree", "kurtis" → "kurti", "shoes" → "shoe" (keeps "dress") */
const singular = (word) => (word.length > 3 && word.endsWith('s') && !word.endsWith('ss') ? word.slice(0, -1) : word)

const words = (text) => normalize(text).split(' ').filter(Boolean).map(singular)

/** Up to `limit` completions for what has been typed so far (never empty once typing starts). */
export function getSuggestions(draft, limit = 8) {
  const q = normalize(draft)
  if (!q) return []
  const tokens = q.split(' ')
  const matchesAll = (phrase) => {
    const ws = phrase.split(' ')
    return tokens.every((t, i) => {
      const last = i === tokens.length - 1
      return ws.some((w) => (last ? w.startsWith(t) || singular(w).startsWith(singular(t)) : singular(w) === singular(t) || w.startsWith(t)))
    })
  }
  const prefix = ALL_SUGGESTIONS.filter((s) => s.startsWith(q))
  const rest = ALL_SUGGESTIONS.filter((s) => !s.startsWith(q) && matchesAll(s))
  const list = [...new Set([...prefix, ...rest])].slice(0, limit)
  return list.length ? list : [q]
}

/** The catalogue categories a query is about ("kurtis for women" → Kurtis). */
function categoriesFor(query) {
  const q = words(query).join(' ')
  if (!q) return []
  const qWords = q.split(' ')
  const hit = (keyword) => {
    const k = words(keyword).join(' ')
    if (k.includes(' ')) return ` ${q} `.includes(` ${k} `)
    return qWords.includes(k)
  }
  const exact = CATALOG.filter((c) => c.keywords.some(hit))
  if (exact.length) return exact
  /* half-typed words still land somewhere sensible ("kur" → Kurtis, "sar" → Sarees) */
  return CATALOG.filter((c) => c.keywords.some((k) => qWords.some((w) => w.length >= 3 && words(k).join(' ').startsWith(w))))
}

const uniqueById = (list) => {
  const seen = new Set()
  return list.filter((p) => (seen.has(p.product_id) ? false : (seen.add(p.product_id), true)))
}

/**
 * @param {object[]} catalogue every product (the order of `fallbackOrder` decides "others")
 * @param {string} query
 * @param {object[]} [fallbackOrder] usually Home's mixed feed
 * @returns {{ matches: object[], others: object[] }} matches first (each once), then the rest
 */
export function searchProducts(catalogue, query, fallbackOrder = catalogue) {
  const cats = categoriesFor(query)
  let matches = []
  if (cats.length) {
    const ids = new Set(cats.flatMap((c) => c.categoryIds))
    const titleWords = cats.flatMap((c) => c.titleWords ?? [])
    matches = catalogue.filter(
      (p) => ids.has(p.categoryId) || titleWords.some((w) => normalize(p.title).split(' ').includes(w)),
    )
  } else {
    const qWords = words(query).filter((w) => w.length >= 3)
    if (qWords.length) {
      matches = catalogue.filter((p) => {
        const hay = words(`${p.title} ${p.category ?? ''}`)
        return qWords.some((w) => hay.some((h) => h.startsWith(w)))
      })
    }
  }
  matches = uniqueById(matches)
  const matched = new Set(matches.map((p) => p.product_id))
  const others = uniqueById(fallbackOrder).filter((p) => !matched.has(p.product_id))
  return { matches, others }
}
