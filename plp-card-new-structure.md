# Meesho PLP Card — New Structure Spec (for Cursor)

> **Goal:** We already have a working PLP card prototype in Cursor built on the *existing* design. This document describes the **new card structure**. Restructure the existing card to match this spec. **Reuse the existing design tokens, colors, fonts, chip/pill styles, and icons** already in the prototype — this is a re-layout + new conditional logic task, not a re-skin.

---

## 1. What changed vs. the existing card (migration checklist)

Use this as the diff against the current prototype:

1. **Mall tag moved into the title/comprehension layer.** It is no longer a standalone badge above the title; it is now a chip inside the comprehension row (see §4.2).
2. **Deal-timer pill moved into the price section.** It is no longer in the comprehension/title area; it now renders as its own row inside the price block (see §4.3).
3. **Added a "New Arrival" consideration tag at the top of the card**, anchored to the image (see §4.1).
4. **Static title string replaced with attribute chips** (SSCAT name + Pack + product attributes). A plain text title is now a legacy fallback only.
5. **UPI tag is removed for `prepaid_activated` and `prepaid_preferred` users.** (Still shown for COD users.)
6. **COD / BNPL secondary price line removed** (the old `₹260 with BNPL` line is gone from the PLP card).
7. **Fast / delivery tag moved below the rating pill** (it now sits under the quality block, not under the price block).
8. **Added a "Buy Now" CTA action row** at the very bottom of the card.

---

## 2. Global rules

- **Information priority order:** `Price > Selection (comprehension) > Quality/Trust`. When trade-offs are needed, preserve this order of importance.
- **Consideration tags:** maximum **1** consideration tag for launch. Build the architecture so it can extend to **2** later (treat it as an array capped at 1 for now).
- **No empty rows.** Any row/zone with no content collapses (no reserved blank space).

---

## 3. Card anatomy (top → bottom)

```
┌─────────────────────────────┐
│  [Image]            ♡        │  ← 1. Media block (image + wishlist + consideration overlay)
│  New Arrival                 │
├─────────────────────────────┤
│  Ad  Mall  SSCAT  Pack  …    │  ← 2. Comprehension block (max 2 rows)
│  Cotton  1000ml              │
├─────────────────────────────┤
│  ₹420  ₹450  15% off   UPI   │  ← 3. Price block
│  ⏱ 2h:21m:23s                │     (row 1 = price + primary tag, row 2 = timer / price-consideration)
├─────────────────────────────┤
│  5★ (190)            Trusted │  ← 4. Quality block (rating + ONE trust/social tag)
├─────────────────────────────┤
│  FAST 2 Day Delivery         │  ← 5. Fast / delivery block (always a new line below rating)
├─────────────────────────────┤
│  [        Buy Now        ]   │  ← 6. Action row (bottom)
└─────────────────────────────┘
```

---

## 4. Zone-by-zone spec

### 4.1 Media block
- Product image, rounded top corners (keep existing aspect ratio).
- **Wishlist (♡) icon** overlaid top-right.
- **Consideration tag** (e.g. `New Arrival`) rendered as the topmost element of the card, anchored to the **bottom-left of the image** (design intent: "on top of image"). It is the first row of the comprehension stack visually.
- Max 1 consideration tag for now.

### 4.2 Comprehension block
Replaces the old static title. Renders a left-to-right sequence of chips that **wraps to a maximum of 2 rows**.

**Render order (left → right) = hierarchy:**
```
Ad  >  Mall/Brand  >  SSCAT chip  >  Pack chip  >  Product attribute chips
```

Rules:
- **Max 2 rows total.** If content exceeds 2 rows, **drop from the lowest priority first** (drop attributes → then pack → then SSCAT, etc.). Never drop a higher-priority chip to keep a lower one.
- `Ad` chip shows only when the listing is an ad.
- `Mall` chip shows only for Mall/branded listings (carries the shield-check icon). For non-Mall branded items, the brand name takes this slot.
- **Legacy fallback:** if no chips are available, a plain text **Title** string may be rendered instead (single line, truncate with ellipsis).
- **Optional experimental variant — "Ad new position":** support a flag to render the `Ad` chip down near the price row instead of at the top of comprehension. Default OFF.

**Example combinations** (from the design board):
| Variant | Chips rendered |
|---|---|
| No Title | _(none — image + price + rating only)_ |
| SSCAT Chip | `Shampoo` |
| SSCAT + Consideration | `New Arrival` + `Shampoo` |
| Title (legacy) | `Intense Repair Shampoo` (plain string) |
| Ad tag | `Ad` |
| Mall + SSCAT | `Mall` `Shampoo` |
| Mall + Title | `Mall` `Intense Repair Sham…` |
| Mall + SSCAT + Ad | `Ad` `Mall` `Shampoo` |
| Mall + SSCAT + Pack | `Mall` `Shampoo` `Pack of 2` |
| Mall + SSCAT + Pack + Attribute | `Mall` `Hair Oil` `Pack of 2` `Hair Growth` |
| Mall + SSCAT + Pack + Attribute + Ad | `Ad` `Mall` `Shampoo` `Intense Repair` `1000ml` |
| + New Arrival | `New Arrival` (top) + `Ad` `Dove` `Shampoo` `Intense Repair` `1000ml` |

### 4.3 Price block

**Row 1 — price line (always present):**
```
₹<price>   ₹<mrp strikethrough>   <discount>% off        <PRIMARY TAG>
```
- Primary tag is **at most one** of: `UPI` | `Sale` | `Combo offer`.
- **Primary-tag hierarchy (COD users):** `Sale > Combo offer > UPI`. Show only the highest-priority applicable tag.
- **`UPI` tag is hidden** for `prepaid_activated` and `prepaid_preferred` users. (If UPI would have been the only primary tag, row 1 has no primary tag.)
- For Sale, show `₹<amount> off` + `SALE` (with flame). For Combo, show `COMBO OFFER`.

**Row 2 — timer / price-consideration line (conditional):**
- **Deal timer always takes its own new row.** If a deal timer is present, render `⏱ 2h:21m:23s` here.
- If **no** deal timer is present **but** a price-related consideration tag exists, show that tag in this row instead. Options: `Price Drop` / `₹24 Less today` / `Lowest price in 30 days`.
- If neither exists, row 2 collapses.

> Removed: the old secondary `₹xxx with BNPL` / COD price line — do **not** render it.

**Price examples** (from the design board):
| Variant | Row 1 | Row 2 |
|---|---|---|
| Base price | `₹420` | — |
| Price + discount (prepaid) | `₹390 ₹450 15% off` | — |
| Price + UPI (COD) | `₹420 ₹499 15% off  UPI` | — |
| Price + Sale | `₹420 ₹499 ₹46 off SALE` | — |
| Price + Combo | `₹260 ₹317 20% off COMBO OFFER` | — |
| Price + Daily timer | `₹420 ₹499 15% off` | `⏱ 2h:21m:23s` |
| Sale + Deal timer | `₹420 ₹499 ₹46 off SALE` | `⏱ 2h:21m:23s` |
| Combo + Deal timer | `₹260 ₹317 20% off COMBO OFFER` | `⏱ 2h:21m:23s` |
| UPI + price-consideration | `₹390 ₹450 15% off  UPI` | `₹24 Less today` |
| Price drop | `₹390 ₹450 15% off  UPI` | `Price Drop` |
| Lowest price | `₹390 ₹450 15% off` | `Lowest price in 30 days` |

### 4.4 Quality block
```
<rating>★ (<count>)                         <ONE quality/trust tag>
```
- Rating pill: green badge `5 ★` + count `(190)` / `(19K)` next to it.
- **Exactly one slot** for a quality / trust / social-proof tag.
- **Hierarchy:** `Gold > m-trusted > consideration (Less Returned / Top Rated)`. Show only the highest-priority applicable tag.

| Variant | Trust tag |
|---|---|
| Base | _(none)_ |
| Gold | `+ Gold` |
| m-trusted | `m Trusted` |
| Less Returned | `Less Returned` |
| Top Rated | `Top Rated` |

### 4.5 Fast / delivery block
- Fast/delivery tag **always takes a new line below the rating pill** (its own row).
- Format: `FAST` logo + `2 Day Delivery`.
- Collapses if the listing has no fast/delivery info.

### 4.6 Action row
- `Buy Now` CTA, outlined button, pinned at the **bottom of the card**.
- Render only when `showBuyNow` is true; otherwise collapse.

---

## 5. Suggested data model

```ts
type PaymentMode = 'cod' | 'prepaid_activated' | 'prepaid_preferred';

interface PLPCard {
  // Media
  image: string;
  isWishlisted: boolean;
  considerationTags: ('new_arrival')[]; // cap at 1 for now; allow up to 2 later

  // Comprehension (render order = hierarchy)
  isAd: boolean;
  isMall: boolean;
  brand?: string;          // used in Mall slot for non-Mall branded items
  sscat?: string;          // category chip, e.g. "Shampoo"
  pack?: string;           // e.g. "Pack of 2"
  attributes?: string[];   // e.g. ["Intense Repair", "1000ml"]
  title?: string;          // legacy fallback only (used when no chips)
  adPositionBottom?: boolean; // experimental "Ad new position" variant, default false

  // Price
  price: number;
  mrp?: number;
  discountPct?: number;
  primaryPriceTag?: 'upi' | 'sale' | 'combo_offer'; // at most one renders
  saleAmountOff?: number;       // for SALE tag
  dealTimer?: string;           // "2h:21m:23s" — always its own row
  priceConsiderationTag?: 'price_drop' | 'less_today' | 'lowest_price_30d';
  lessTodayAmount?: number;     // for "₹24 Less today"
  lowestPriceDays?: number;     // for "Lowest price in 30 days"

  // User context (drives price logic)
  paymentMode: PaymentMode;

  // Quality
  rating: number;
  ratingCount: string;          // "190", "19K"
  qualityTag?: 'gold' | 'm_trusted' | 'less_returned' | 'top_rated';

  // Fast + Action
  fastDelivery?: string;        // "2 Day Delivery"
  showBuyNow?: boolean;
}
```

### Rendering logic (pseudocode)

```ts
// Comprehension: build ordered chip list, then trim to 2 rows worst→first
const chips = [
  card.isAd && !card.adPositionBottom && chip('Ad'),
  card.isMall ? chip('Mall', {icon: 'shield-check'}) : card.brand && chip(card.brand),
  card.sscat && chip(card.sscat),
  card.pack && chip(card.pack),
  ...(card.attributes ?? []).map(a => chip(a)),
].filter(Boolean);
// fallback to plain title if no chips
// then drop from the END until it fits in 2 rows

// Price primary tag (only one)
let primaryTag = card.primaryPriceTag;
if (primaryTag === 'upi' && card.paymentMode !== 'cod') primaryTag = undefined; // hide UPI for prepaid
// COD hierarchy already encoded upstream as sale > combo_offer > upi

// Price row 2
const priceRow2 = card.dealTimer
  ? timerPill(card.dealTimer)
  : card.priceConsiderationTag && considerationPill(card.priceConsiderationTag);

// Quality tag (only one, by hierarchy)
const qualityTag = pickByHierarchy(card.qualityTag, ['gold','m_trusted','less_returned','top_rated']);
```

---

## 6. Edge-case summary
- Comprehension never exceeds **2 rows**; trim lowest-priority chips first.
- Only **one** primary price tag, **one** quality tag, and (for now) **one** consideration tag.
- Deal timer **always** forces its own price row; it pre-empts the price-consideration tag for that slot.
- UPI tag suppressed for prepaid users.
- No BNPL/COD secondary price line.
- Every zone collapses cleanly when empty.
