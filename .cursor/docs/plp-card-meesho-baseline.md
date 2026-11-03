# Meesho PLP product card — design baseline

**Source (BrowseX Playground 2026):**
- [Card grid / flavour board — node 88:24861](https://www.figma.com/design/MsMSb7AuabSGLQ2PlCDmks/BrowseX-Playground-2026?node-id=88-24861)
- [Card states & overlays — node 88:25214](https://www.figma.com/design/MsMSb7AuabSGLQ2PlCDmks/BrowseX-Playground-2026?node-id=88-25214)

**Sandbox implementation today:** `ProductCard` + `Home.css` (Standard / `normal` variant). Stagger variants (V01–V03) only change image height + masonry columns.

---

## Anatomy (common)

| Zone | Elements |
|------|----------|
| **Image** | ~4:5 portrait in Figma; sandbox uses 1:1. Full-bleed `object-fit: cover`. |
| **Image overlays** | Wishlist heart (top-right). Optional: corner ribbons (SALE, ₹ OFF), bottom timer bar, Mall / SUPER SAVER / COMBO / Gold on image, video play + floating price pill. |
| **Body** | Title → price row → secondary price / offers → trust & delivery → rating. |

---

## Typography & colour (from tokens + Figma)

- **Font:** DM Sans (`--font-mier`) — weights 400 / 500 / 600 / 700.
- **Title:** ~13px semibold/bold, single line truncate (Figma also allows 2-line in some cards).
- **Price:** Large bold `₹` amount; MRP struck through, smaller grey.
- **Discount:** Green (`--green-base`) — `% off` or flat amount.
- **Secondary price:** e.g. `₹X with COD` / `with 3 Offers` — smaller, often green or grey.
- **Rating:** Green pill, white star + value; review count in grey parentheses.
- **Accents:** Jamun/purple (Mall), red (sale/urgency/OOS), orange (timer), yellow (Get ₹X), blue (UPI badge).

---

## Flavours seen in Figma (88:24861)

1. **Default retail** — title, price + MRP + % off, UPI chip, COD line, rating, optional Mall on image.
2. **Deal / urgency** — countdown on image; stock text (“3 items left”); COMBO / Gold badges.
3. **Corner promo** — SALE or `₹57 OFF` ribbon on image.
4. **Mall / saver** — Mall check badge + SUPER SAVER on image.
5. **Delivery callout** — “FAST 2 Day Free Delivery” logo block in body.
6. **Affiliate / resale** — commission or RESALE OFFER pills in body.

## States & special layouts (88:25214)

1. **Video / reel** — play icon; bottom overlay pill (thumb + price + rating on image).
2. **Rich offers** — “₹50 with 3 Offers”, delivery fee line, affiliate commission.
3. **GST / price drop** — red down arrow + “GST price drop”.
4. **Trusted** — Trusted + Meesho mark near rating.
5. **OOS** — “Out of stock” + notify copy + **Notify Me** button (extra height).
6. **Flash sale** — timer on image + COD + Trusted.

---

## Sandbox vs Figma gaps (Standard card)

| Figma | Sandbox today |
|-------|----------------|
| UPI chip | Missing |
| COD / offers lines | `offerText` only (e.g. CASH) |
| Image badges (Mall, SALE, timer) | Missing |
| 4:5 image | 1:1 |
| Card shadow / radius | Grid borders, square cells |
| 2-line title | 1-line ellipsis |
| OOS / Notify | Not on PLP card |
| Delivery lines | Removed from PLP |

---

## Lab variant map

| ID | Variant | Figma |
|----|---------|-------|
| V01–V03 | Stagger (gentle / strong / refresh) | Layout experiment |
| V04 | Just floor (control) | [88:32110](https://www.figma.com/design/MsMSb7AuabSGLQ2PlCDmks/BrowseX-Playground-2026?node-id=88-32110) |
| V05 | Floor + deals row | [88:38412](https://www.figma.com/design/MsMSb7AuabSGLQ2PlCDmks/BrowseX-Playground-2026?node-id=88-38412) |
| V06 | Floor + quality & tags | [92:19175](https://www.figma.com/design/MsMSb7AuabSGLQ2PlCDmks/BrowseX-Playground-2026?node-id=92-19175) |
| V07 | Tile floor | Same content as V04 on tile body; image has no overlays |

---

## V05 / V06 / V07 card body framework (canonical)

All info **on the tile (card body)**, not on the image.

| Variant | Image | Tile body |
|---------|--------|-----------|
| V04 | Price + rating on image floor | — |
| V05 | Image + wishlist only | Price / deals layer only |
| V06 | Image + wishlist (+ optional timer) | Price layer + quality layer (trusted, gold) |
| V07 | Image + wishlist only (no overlays) | Price + rating on tile (same as V04 floor) |

### Row 1 — Price layer

**Rule: price floor + one extra slot** — floor always shows together; only one extra at a time.

| Part | Fields | Always? |
|------|--------|---------|
| **Floor** | Final price · MRP (struck) · % discount | Yes (when data exists) |
| **Extra (pick one)** | Combo offer · UPI tag · GST price drop | One only — never combo + GST together |

Figma chip refs: [combo 92:21005](https://www.figma.com/design/MsMSb7AuabSGLQ2PlCDmks/BrowseX-Playground-2026?node-id=92-21005) · [m-Trusted 88:25566](https://www.figma.com/design/MsMSb7AuabSGLQ2PlCDmks/BrowseX-Playground-2026?node-id=88-25566) · [UPI gradient 88:25316](https://www.figma.com/design/MsMSb7AuabSGLQ2PlCDmks/BrowseX-Playground-2026?node-id=88-25316) · [Gold pill 88:24923](https://www.figma.com/design/MsMSb7AuabSGLQ2PlCDmks/BrowseX-Playground-2026?node-id=88-24923)

Each row is **one horizontal line** (no wrap): floor group left, extra chip right.

Demo extra rotation: `globalIndex % 3` → combo → UPI → GST.

### Row 2 — Quality layer (V06 only)

**Rule: rating floor + one quality marker** — rating pill + count always together; one marker only. Not shown on V05 (deals-only).

| Part | Fields | Always? |
|------|--------|---------|
| **Floor** | Rating pill · rating count | Yes |
| **Extra (pick one)** | m-Trusted · Gold | One only — never both |

Demo marker rotation: `globalIndex % 2` → trusted → gold.

**Code:** `getPriceLayer()` / `getQualityLayer()` in `src/utils/plpCardFlavour.js` · `PriceLayerRow` / `QualityLayerRow` in `ProductCard.jsx`.
