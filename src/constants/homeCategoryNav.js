import { publicUrl } from '../utils/publicUrl'
/**
 * Home category icon nav — legacy browse chips + user-test cohort mapping.
 * Cohorts reuse the same home-cat-item visual; legacy rows kept for quick search jumps.
 */

export const CATEGORY_FALLBACK_IMG = publicUrl('/categories/Categories.png')

/** Shirt hero for Shirts cohort nav (Men.png not in public/). */
export const SEARCH_SHIRT_REFERENCE_IMG =
  'https://images.meesho.com/images/products/16896398/d92cd.jpg'

export const categoryImage = (filename) => publicUrl(`/categories/${encodeURIComponent(filename)}`)

/** Original two-row category nav (search by term). Preserved for browse shortcuts. */
export const LEGACY_CATEGORIES_ROW1 = [
  { label: 'Categories', slug: 'categories', searchTerm: '', image: categoryImage('Categories.png') },
  { label: 'Kurtis', slug: 'kurtis', searchTerm: 'kurti', image: categoryImage('Kurti.png') },
  { label: 'Western...', slug: 'western', searchTerm: 'western', image: categoryImage('Western.png') },
  { label: 'Sarees', slug: 'sarees', searchTerm: 'saree', image: categoryImage('Saree.png') },
  { label: 'Men', slug: 'men', searchTerm: 'shirts', image: SEARCH_SHIRT_REFERENCE_IMG },
  { label: 'Home Dec..', slug: 'home-decor', searchTerm: 'water bottle', image: categoryImage('Home Tex.png') },
  { label: 'Cookers', slug: 'cookers', searchTerm: 'cooker', image: categoryImage('Home Tex.png') },
]

export const LEGACY_CATEGORIES_ROW2 = [
  { label: 'Home Tex..', slug: 'home-tex', searchTerm: 'bedsheets', image: categoryImage('Home Tex.png') },
  { label: 'Jewellery', slug: 'jewellery', searchTerm: 'jewellery', image: categoryImage('Jewellery.png') },
  { label: 'Beauty', slug: 'beauty', searchTerm: 'lipstick', image: categoryImage('Beauty.png') },
  { label: 'Footwear', slug: 'footwear', searchTerm: 'shoes', image: categoryImage('Footwear.png') },
  { label: 'Accessor..', slug: 'accessory', searchTerm: 'accessory', image: categoryImage('Accessories.png') },
  { label: 'Sports', slug: 'sports', searchTerm: 'diaper', image: categoryImage('SPorts.png') },
]

/** Six user-test cohorts — same icon nav shell, drives ?cohort= feed grouping. */
export const COHORT_NAV_ITEMS = [
  {
    cohortId: 'fashion-kurti',
    label: 'Kurtis',
    image: categoryImage('Kurti.png'),
  },
  {
    cohortId: 'fashion-shirts',
    label: 'Shirts',
    image: SEARCH_SHIRT_REFERENCE_IMG,
  },
  {
    cohortId: 'western-tags',
    label: 'Western...',
    image: categoryImage('Western.png'),
  },
  {
    cohortId: 'shoes-tags',
    label: 'Footwear',
    image: categoryImage('Footwear.png'),
  },
  {
    cohortId: 'fmcg-mall',
    label: 'Beauty',
    image: categoryImage('Beauty.png'),
  },
  {
    cohortId: 'home-decor',
    label: 'Home Dec..',
    image: categoryImage('Home Tex.png'),
  },
]
