# Meesho Prototype

React + Vite prototype: Meesho-like home feed and product detail page (PDP) with **VSKU** (variant SKU) layers—color, size, volume, etc.

---

## For agents and future maintainers

This section explains the codebase so any agent or developer can reason about structure, data flow, and behavior without guessing.

### Tech stack and entry points

- **React 18** + **Vite 5**; **react-router-dom** for routes.
- **Entry:** `index.html` → `src/main.jsx` → `src/App.jsx`.
- **Routes:** `/` = Home, `/product/:id` = ProductDetails (PDP). Route param `:id` is `product_id` (e.g. `WB-10291`).

### Repository layout (source only)

```
src/
  App.jsx                 # Routes + WishlistProvider
  main.jsx
  index.css               # Global styles
  context/
    WishlistContext.jsx    # Wishlist state (has, toggle)
  pages/
    Home.jsx               # Home grid, categories, search; product list interleaved by category
    Home.css
    ProductDetails.jsx     # PDP: hero, VSKU blocks, price/OOS, sticky CTA, reviews, “Also viewed”
    ProductDetails.css
  data/
    products.js            # Re-exports product API (getProductById, getProductsForGrid, getProductsByCategory)
    productsFromCursor.js  # Main product pipeline: reads assets/products.cursor.json → app product shape + VSKU
    productsData.js        # Alternate small mock catalog (not used if productsFromCursor is the export source)
    categoryProductImages.js / .json
    curatedProductImages.js / .json
    svgAssets.js           # Inline SVG asset refs for PDP (swatches, heroes)
assets/
  products.cursor.json     # Source catalog (from CSV transformer); consumed by productsFromCursor.js
  Products.csv             # Optional CSV source for regenerating products.cursor.json
parallel feeds lod feed data  - pf_user_lod_feed_pdp_female_tops_combos.csv
                           # LOD feed with sscat, prices, ratings — merged via npm run merge:lod-feed
scripts/
  merge-lod-feed.mjs       # Merges LOD feed CSV into assets/products.cursor.json
public/
  categories/              # Category icons (PNG)
  favicon.svg
```

Product API used by the app is **`src/data/products.js`**, which re-exports from **`src/data/productsFromCursor.js`**. That file imports **`assets/products.cursor.json`** and builds the app product shape (title, price, rating, **vsku.layers**, outOfStock, etc.).

---

### VSKU (variant SKU) model

Products can have **layers** of options. Each layer has:

- **`layer_type`:** `VISUAL` (e.g. color), `FUNCTIONAL` (e.g. size, volume), or `VALUE` (e.g. pack of 2).
- **`axis_id`** / **`axis_label`:** e.g. `color` / `Color`, `volume` / `Volume`.
- **`options`:** array of `{ option_id, label, delta?, image?, ... }`.  
  **`delta`** can include `price`, `mrp` (and `sku_suffix`, `image` etc.). If present, that option’s selection affects displayed price/MRP or hero image.

**Price resolution (PDP):**

- Base comes from **`product.price_summary.price`** (and `.mrp`).
- **`resolveDisplayPrice(product, selectedOptions)`** / **`resolveDisplayMrp`** walk `vsku.layers` and apply each selected option’s `delta.price` / `delta.mrp` (FUNCTIONAL/VALUE layers override base).
- **`getOptionPrice(product, selectedOptions, layer, option)`** returns the price to show for one option (e.g. a size pill); uses `option.delta.price` when set.

**Out-of-stock (OOS):**

- **`product.outOfStock`** shape: `{ [visualAxisId]: { [visualOptionId]: [functionalOptionId, ...] } }`  
  Example: `{ color: { color_xyz: [volume_0] } }` = for color `color_xyz`, volume option `volume_0` is OOS.
- **`getOutOfStockFunctionalOptionIds(product, selectedOptions)`** returns the set of functional (e.g. size/volume) option IDs that are OOS for the *current* visual selection (e.g. selected color).

PDP behavior built on this:

- **Context retention:** When the user changes **color** (VISUAL), the previously selected **size/volume** (FUNCTIONAL) is *kept*; it is not cleared even if that size is OOS in the new color.
- **OOS options selectable:** OOS pills are not disabled; user can select them. When the *selected* option is OOS in the current color:
  - The **sticky CTA** replaces “Add to Cart” / “Buy at ₹…” with a single line: “{label} is Out Of Stock in this color” + **Notify Me** (secondary button).
  - The inline OOS row under the VSKU block is hidden when this sticky OOS bar is shown (no duplicate).
- **Sticky OOS:** `stickyOosOption` is derived from the first FUNCTIONAL layer whose *selected* option is in `getOutOfStockFunctionalOptionIds`; the sticky bar shows that option’s label and Notify Me.

---

### Home page: product list and categories

- **Data:** `getProductsForGrid()` returns all products (from the same pipeline as PDP).
- **Order:** Products are **interleaved by category** so the same category does not sit next to itself: `interleaveByCategory(allProducts)` groups by `product.category`, shuffles each group, then round-robins (1st from each category, then 2nd, etc.). So grid order is randomized within category but no two adjacent cards share a category.
- **Search:** Filters the *interleaved* list by `searchQuery` (title and category string match). Toolbar “Sort / Category / Price / Filters” are UI only (no logic yet).
- **Categories:** Two rows of category buttons; clicking sets `searchQuery` to that category’s `searchTerm` (e.g. “kurti”, “shoes”). No separate category route; same grid with filter.

---

### Product data pipeline (productsFromCursor.js)

- **Input:** `assets/products.cursor.json` (from CSV transformer: `INPUT=assets/Products.csv`, `OUTPUT=assets/products.cursor.json`). LOD feed CSV rows (sscat, super portfolio, prices, ratings) merge in via `npm run merge:lod-feed`. Structure: `productsById`, `categoryIndex`, `categories`.
- **Per product:** `toAppProduct(p)` builds:
  - `product_id`, `title`, `category`, `price_summary`, `rating`, `delivery`, `offerText`
  - `base_media`, `hero_image_url`, `gallery`
  - **`vsku.layers`** via `buildVskuLayersForCategory(categoryId, p)` (VISUAL color/shade + FUNCTIONAL size/volume/quantity per category).
  - **`outOfStock`** (optional): e.g. for `kitchen_water_bottle`, second color can mark first volume as OOS.
- **Pricing on options:** After building layers, every **FUNCTIONAL** layer gets **progressive pricing**: option index `i` gets `delta.price` / `delta.mrp` = base × (1 + i × 0.10), so larger size/volume/quantity is costlier (Flipkart/Amazon style).
- **Exports:** `getProductById(id)`, `getProductsForGrid()`, `getProductsByCategory(categoryId)` (used for “Also viewed” etc.).

---

### PDP: sections and behavior (ProductDetails.jsx)

- **Hero:** Image carousel; hero image is resolved from selected VISUAL/VALUE (e.g. color) and product/variant media.
- **Color / visual section:** VISUAL layers (e.g. color) with thumbnails; `setOption(layer.axis_id, opt.option_id, layers)` updates selection; **no** clearing of FUNCTIONAL selection on color change (context retention).
- **VSKU blocks:** One block per FUNCTIONAL/VALUE layer (Volume, Size, etc.). Each option shows price via `getOptionPrice`. OOS options are **selectable**; OOS styling is CSS only (no `disabled`). Inline “{label} is Out Of Stock in this color” + Notify Me is shown only when that layer’s selected option is OOS **and** sticky bar is not already showing OOS (to avoid duplicate).
- **Sticky CTA:** If `stickyOosOption` is set (selected option is OOS in current color), CTA shows OOS message + Notify Me only. Otherwise shows Add to Cart + Buy at ₹{price}.
- **Bottomsheet:** “Select Size/Volume” opens when user clicks Buy and a required FUNCTIONAL option is missing; OOS options in the sheet are also selectable.
- **Reviews / Also viewed:** Static or derived from product/category data; “Also viewed” uses `getProductsByCategory` or similar.

---

### Styling and assets

- **Global:** `src/index.css`; page-specific: `Home.css`, `ProductDetails.css`. No CSS modules; plain class names (e.g. `.pdp-vsku-block`, `.pdp-cta-wrap`, `.pdp-vsku-oos-row`).
- **Icons:** Inline SVG components in each page file (BackIcon, CartIcon, HeartIcon, etc.).
- **Images:** Product images from `product.base_media.hero_image`, `hero_image_url`, `gallery`, or `getHeroImageForProduct(product)` (categoryProductImages). Category icons from `public/categories/*.png`. SVGs for swatches/heroes referenced via `svgAssets.js` and asset refs in option `image` / `swatch`.

---

### How to run and build

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run preview  # serve dist
```

- **Home:** `/` — product grid (interleaved by category) and category chips.
- **PDP:** `/product/<product_id>` — e.g. `/product/WB-10291`.

---

### Extending the codebase

- **New category / new VSKU axes:** In `productsFromCursor.js`, extend `VSKU_COLORS`, `VSKU_FUNCTIONAL`, and optionally `buildVskuLayersForCategory` (or add a category-specific builder like lipstick/saree). Regenerate or patch `products.cursor.json` if you need new raw products.
- **New OOS rules:** Set `product.outOfStock` in `toAppProduct` (same shape: visual axis → visual option id → list of functional option ids).
- **Price logic:** Change `resolveDisplayPrice` / `getOptionPrice` if you need different rules; FUNCTIONAL option prices are set in `productsFromCursor.js` after `buildVskuLayersForCategory`.
- **Home order:** Change `interleaveByCategory` or replace with another ordering (e.g. sort by price); keep using `interleaved` before search filter so search results stay consistent.

---

### Quick reference: key files for common tasks

| Task                     | Primary file(s) |
|--------------------------|-----------------|
| Product catalog shape    | `src/data/productsFromCursor.js` |
| PDP price / OOS logic    | `src/pages/ProductDetails.jsx` (resolveDisplayPrice, getOutOfStockFunctionalOptionIds, stickyOosOption) |
| Home grid order / search | `src/pages/Home.jsx` (interleaveByCategory, list) |
| Routes / app shell       | `src/App.jsx` |
| Product API surface     | `src/data/products.js` (re-exports) |
| Styling PDP / CTA / OOS  | `src/pages/ProductDetails.css` |

This README is intended for AI agents and future developers to understand and modify the project without reverse‑engineering the whole codebase.
