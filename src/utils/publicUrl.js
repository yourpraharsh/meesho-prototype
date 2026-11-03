/**
 * A file from public/ by its root path ('/badges/x.svg'), under the app's base path — '/' on
 * Netlify and locally, '/<repo>/' on GitHub Pages (vite.config.js reads BASE_PATH).
 */
export const publicUrl = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`
