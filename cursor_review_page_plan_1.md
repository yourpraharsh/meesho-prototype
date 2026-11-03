# Review Page — Cursor Implementation Plan (phased, gated)

**Context.** The existing prototype already has working PDPs with real product data. This plan extends the PDP **Buy Now** action into a Review-Order → Payment flow, then builds **four review-page variants** for manual A/B evaluation. Each variant reuses the same product/selection data coming from the PDP.

---

## ⛔️ How Cursor must run this

> **Implement ONE phase per instruction. When a phase is done:**
> 1. Summarise exactly what changed (files, components, routes).
> 2. Give me a **manual test checklist** to run.
> 3. **STOP and wait** for me to reply “proceed to Phase N+1”.
> **Do not begin the next phase on your own.** Do not refactor unrelated code. Do not touch existing PDP behaviour except the Buy Now → review navigation added in Phase 1.

---

## Global conventions (read once, apply to every phase)

**Variant switching.** All four variants must coexist and be **independently reachable** for manual testing — e.g. a route/query param (`/review?variant=1..4`) or a single `REVIEW_VARIANT` config constant. Only one is “live” at a time, but I need to open any of them on demand without code changes.

**Shared shell.** Build a common `ReviewShell` that owns the pieces every variant shares: header (title + `STEP x/2` pill + back), the **delivery-date band** (“Delivery by Monday, 10 Aug”), the **item card**, the **price block**, and the **discount chip**. Variants differ only in *which sections they show, in what order, and the CTA* — they should not each re-implement the item card.

**Single pricing function (critical — no hardcoded numbers).** All displayed amounts derive from one `computeOrder()` selector. Never write a second copy of a price anywhere in the UI.
```
MRP (strikethrough)                     e.g. 450
– product discount (15%)             → discounted price 390
± return-type adjustment             (“All easy returns” costs more than “wrong/defect only”)
– payment-method offer               (Pay Online / Pay Later / bank offer savings)
+ COD handling fee (if any)
= payable total  +  “you save ₹X”
```
The discount chip, price block, and any payment-method rows all read from this one source. `computeOrder()` takes the **real product data as input** (MRP, discount, return-type prices, payment-offer amounts) and contains **no hardcoded numbers** — every figure traces back to the prototype product data. This is the P0 fix (one savings number, never contradictory).

**Data source — use the prototype's real product data, do NOT invent or hardcode anything.** Every value on these screens must come from the existing prototype product data / PDP state that's already wired up. Specifically:
- **Product title, image, MRP, discounted price, discount % and amount, seller, return options, available sizes** → read from the same product data object the PDP already uses. `computeOrder()` consumes *these* fields; it does not contain any literal numbers.
- **Selected size** → carry forward the size the user selected on the PDP. Phase 1's sheet only appears when no size was selected there; if a size exists, use it and skip the sheet.
- **Discount / offer data** → use the product's real discount and any offer/coupon/payment-offer data present in the prototype. The ₹450/₹390/₹60/15% etc. shown in the mocks are **illustrative only** — bind to the actual product's values.
- **Prices per state** (return-type variants, COD vs Pay Online vs Pay Later, bank offers, `Save ₹X` amounts) → all already exist in the prototype product/offer data. Pull them from there; never type a number into a component.
- **Addresses** → use the prototype's existing saved-address data if present; only if none exists, use clearly-labelled distinct placeholders (Home/Work/Mom) and flag that as placeholder.
- **Design tokens / components** (buttons, chips, sheets, typography, colours) → reuse the existing PDP/prototype system; do not restyle from scratch.

If any field the plan references is missing from the product data, **stop and ask** rather than fabricating a value. Do not fork or duplicate the product data — read from the single existing source so the review page always matches its PDP.

**Copy rules baked in.** Calm discount chip (“₹60 discount applied” / “You’ll save ₹60” — **no confetti emoji, no “Yay!”**), no “Sold by” row, action-labelled CTAs (never bare “Continue”; COD-neutral wording).

---

## Phase 1 — Size/Return bottom sheet on Buy Now

**Goal.** On PDP **Buy Now**: if size is not yet selected, open a bottom sheet to pick size (and return type). If size is already selected, skip the sheet and go straight to the review page.

**Build.**
- `BuyNowSheet` bottom sheet triggered from the PDP Buy Now button.
- **Select Size** — chips from the **product's real available sizes** (from product data); out-of-stock sizes disabled/struck through; preselect the size chosen on the PDP if any.
- **Select Return Type** — two options from the product's real return options and their prices (e.g. *All issue easy returns* vs *Only wrong/defect returns* with its `Save ₹X` badge). Prices come from product data; selecting one updates the total via `computeOrder()`.
- Primary **Buy Now** inside the sheet → navigate to the review page, carrying `{product, size, returnType}` — the review page recomputes price from that state, it is not passed a literal amount.

**Manual test checklist.**
- [ ] Buy Now with no size → sheet opens.
- [ ] Size preselected if it was chosen on PDP.
- [ ] OOS sizes not selectable.
- [ ] Toggling return type changes the price live.
- [ ] Sheet’s Buy Now disabled until a size is chosen.
- [ ] Proceeding lands on the review page with size + return type + correct price carried over.
- [ ] Size chips, return options, and all prices come from product data (no hardcoded numbers).
- [ ] Existing PDP flow otherwise unchanged.

**STOP — wait for approval.**

---

## Phase 2 — Variant 1: Clarity baseline (“REVIEW ORDER”)

**Hypothesis.** Most repeat-asking dissolves with clarity alone (P0 hygiene only). This is the control-plus.

**Build (top → bottom, using `ReviewShell`).**
- Header: **REVIEW ORDER** · `STEP 1/2` · back.
- Delivery-date band (hero).
- Item card: image, title, price/MRP/discount %, and `Size: <carried-forward size> · <product's return line>` — **all fields from product data + carried PDP selection**, not the literal values in the mock.
- Price block: `Total Price +₹450`, `Total Discount −₹60`, `Order Total ₹390`.
- **Calm discount chip** (factual, no celebration styling).
- **Delivery Address** — labelled + pin, name/phone/address, `Add/Change Address` outline button.
- Primary CTA: **Confirm Order** (pinned bottom).
- Leave the lower band minimal — **no** payment cue or offers module here (those belong to V3/V4; keep the baseline clean so variants stay distinct).

**Manual test checklist.**
- [ ] Title, image, price, discount, size, and return line all reflect the actual product (matches its PDP) — nothing hardcoded.
- [ ] All amounts trace to `computeOrder()`; ₹60 shown once conceptually, never contradictory.
- [ ] Discount chip is calm (no 🎉 / “Yay!”).
- [ ] No “Sold by” row.
- [ ] Add/Change Address opens the address flow and returns with a **visible confirmation** (no silent bounce back).
- [ ] CTA labelled and functional.
- [ ] Reachable at the variant-1 route.

**STOP — wait for approval.**

---

## Phase 3 — Variant 2: Address-first (“CHECK ADDRESS”)

**Hypothesis.** Verifying destination up front cuts COD return-to-origin. Measured on RTO, not just conversion.

**Build.**
- Review state with **address given prominence** (title `CHECK ADDRESS`), item + price + delivery band still visible.
- **Address selection screen**: `Select Address` — saved addresses as **radio-select** rows, each with an `EDIT` link; `+ Add New Address`.
- **Pinned bottom CTA `Deliver to this address`, decoupled from the selected card** (one persistent bottom button acting on whatever is selected — not a button buried inside the highlighted card).
- Mock data: **distinct, labelled addresses** (Home / Work / Mom) with different PIN codes — not three identical dummy rows.
- **ETA re-derives on address change**: selecting a different address updates the delivery-date band (different PIN → different ETA). If not serviceable, show that state.

**Manual test checklist.**
- [ ] Address list shows distinct addresses with labels.
- [ ] Radio selection and per-row EDIT work.
- [ ] Bottom CTA is pinned and acts on the selected address (no premature commit mid-list).
- [ ] Changing address updates the delivery date.
- [ ] Add New returns to the flow with the new address selectable.
- [ ] Price stays consistent via `computeOrder()`.
- [ ] Reachable at the variant-2 route.

**STOP — wait for approval.**

---

## Phase 4 — Variant 3: Payment inline on review

**Hypothesis.** Choosing payment (incl. COD) on the review page — collapsing selection into one confident screen — beats a separate review for this cohort.

**Build.**
- Review page (`CHECK ADDRESS` / review) with a **`Select Payment Method` section inline**: Cash on Delivery, Pay Online (with `Extra discount with bank offers · View Offers`), Meesho Pay Later, Ask Friends to Pay (QR).
- Each method shows its **method-specific payable** from `computeOrder()` (e.g. COD ₹499 vs Pay Online ₹474 `Save ₹25`).
- **One** offers cue only (do not stack coupon + bank strip + progress bar).
- CTA adapts: **Place Order** when COD selected; **Proceed to Payment** when an online method needs a next step. COD-neutral wording — never force “Pay” on a COD user.

**Manual test checklist.**
- [ ] Selecting a method updates the payable amount and the CTA label.
- [ ] COD path uses non-“payment” CTA wording.
- [ ] Bank-offer `View Offers` opens the offers view.
- [ ] Only one offers module present.
- [ ] All method prices derive from `computeOrder()`.
- [ ] Reachable at the variant-3 route.

**STOP — wait for approval.**

---

## Phase 5 — Variant 4: Dedicated payment step (“SELECT PAYMENT METHOD”, step 2/2)

**Hypothesis.** A clean two-step (Review 1/2 → Payment 2/2) reads best for users who want to confirm, then pay.

**Build.**
- Review = `STEP 1/2` with `Proceed` → navigates to a dedicated **`SELECT PAYMENT METHOD`** screen = `STEP 2/2`.
- Payment screen: offer band (`₹99 OFF on this order`), **address summary with `Change`**, delivery band, then payment options: Cash on Delivery (₹510), Meesho Pay Later (₹395 `Save ₹115`, “Pay before 18th Jan”), Pay Online (₹410 `Save ₹99`, bank offers + `View Offers`), **Last Used** (Google Pay / Axis Card / PhonePe with per-method offers), plus `Pay by any UPI app` and `Debit/Credit Card` accordions.
- CTA: `Place Order` (COD) / `Proceed to Payment` (online), consistent with Phase 4 logic.

**Manual test checklist.**
- [ ] Review → Proceed navigates to the payment step; step pill reads `2/2`.
- [ ] Back returns to review with state intact.
- [ ] Selecting any method updates payable + CTA.
- [ ] Accordions expand; Last Used and bank offers render.
- [ ] Address `Change` works from the payment step.
- [ ] All amounts derive from `computeOrder()`.
- [ ] Reachable at the variant-4 route.

**STOP — wait for approval.**

---

## After Phase 5
All four variants live behind the variant switch, sharing one shell and one pricing function — ready for manual side-by-side and A/B routing. Any offers/payment logic should exist in exactly one place and be toggled per variant, so differences stay isolated and learnings stay clean.
