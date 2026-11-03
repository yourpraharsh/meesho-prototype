/**
 * Merges LOD feed CSV (sscat, prices, ratings, titles) into assets/products.cursor.json.
 *
 * Usage: node scripts/merge-lod-feed.mjs [path-to-csv]
 * Default CSV: parallel feeds lod feed data  - pf_user_lod_feed_pdp_female_tops_combos.csv
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const CATALOG_PATH = resolve(ROOT, 'assets/products.cursor.json')
const DEFAULT_CSV = resolve(
  ROOT,
  'parallel feeds lod feed data  - pf_user_lod_feed_pdp_female_tops_combos.csv',
)

const CATEGORY_ID = 'women_top_bottom_sets'

function parseLodRow(line) {
  const urlMatch = line.match(/,(https?:\/\/\S+)\s*$/)
  if (!urlMatch) return null
  const catalog_image_1 = urlMatch[1]
  const beforeUrl = line.slice(0, line.length - urlMatch[0].length)
  const parts = beforeUrl.split(',')
  if (parts.length < 10) return null

  const mrp = Number(parts[6])
  const prepaid = Number(parts[8])
  const discountPercent =
    mrp > 0 && Number.isFinite(prepaid) ? Math.round((1 - prepaid / mrp) * 100) : null

  return {
    user_gender: parts[0],
    catalog_id: parts[1],
    sscat: parts[2],
    super_portfolio: parts[3],
    avg_rating: Number(parts[4]),
    rating_count: Number(parts[5]),
    mrp_price: mrp,
    cod_price: Number(parts[7]),
    prepaid_price: prepaid,
    catalog_name: parts.slice(9).join(',').trim(),
    catalog_image_1,
    discountPercent,
  }
}

function slugifySscat(sscat) {
  return String(sscat ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

function rowToProduct(row, rank) {
  const categoryId = row.sscat ? `lod_${slugifySscat(row.sscat)}` : CATEGORY_ID
  return {
    id: row.catalog_id,
    categoryId,
    rank,
    title: row.catalog_name,
    sscat: row.sscat,
    superPortfolio: row.super_portfolio,
    userGender: row.user_gender,
    images: {
      hero: row.catalog_image_1,
      gallery: [],
    },
    price_summary: {
      price: row.prepaid_price,
      mrp: row.mrp_price,
      discountPercent: row.discountPercent,
    },
    rating: {
      value: Math.round(row.avg_rating * 10) / 10,
      count: row.rating_count,
    },
    delivery: 'Free Delivery',
    offerText: `₹${row.cod_price} with COD`,
    highlights: [],
    vsku: { visual: [], functional: [] },
  }
}

function upsertCategory(categories, categoryId, label, bucket) {
  const existing = categories.find((c) => c.id === categoryId)
  if (existing) {
    existing.label = label
    existing.bucket = bucket
    return
  }
  categories.push({ id: categoryId, label, bucket })
}

function main() {
  const csvPath = resolve(ROOT, process.argv[2] ?? DEFAULT_CSV)
  const csvText = readFileSync(csvPath, 'utf8')
  const lines = csvText.trim().split(/\r?\n/).slice(1)
  const rows = lines.map(parseLodRow).filter(Boolean)

  if (!rows.length) {
    console.error('No rows parsed from', csvPath)
    process.exit(1)
  }

  const catalog = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'))
  catalog.productsById ??= {}
  catalog.categoryIndex ??= {}
  catalog.categories ??= []

  const sscatLabels = new Map()
  const categoryBuckets = new Map()

  for (const row of rows) {
    const categoryId = row.sscat ? `lod_${slugifySscat(row.sscat)}` : CATEGORY_ID
    sscatLabels.set(categoryId, row.sscat)
    categoryBuckets.set(categoryId, row.super_portfolio === 'WWW' ? 'women' : 'other')
  }

  for (const [categoryId, label] of sscatLabels) {
    upsertCategory(catalog.categories, categoryId, label, categoryBuckets.get(categoryId) ?? 'women')
  }

  const idsByCategory = new Map()
  rows.forEach((row, index) => {
    const product = rowToProduct(row, index + 1)
    catalog.productsById[product.id] = product
    if (!idsByCategory.has(product.categoryId)) idsByCategory.set(product.categoryId, [])
    idsByCategory.get(product.categoryId).push(product.id)
  })

  for (const [categoryId, ids] of idsByCategory) {
    catalog.categoryIndex[categoryId] = ids
  }

  writeFileSync(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`)
  console.log(`Merged ${rows.length} LOD feed products from ${csvPath}`)
  console.log(`Categories added/updated: ${[...sscatLabels.keys()].join(', ')}`)
}

main()
