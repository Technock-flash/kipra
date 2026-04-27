# Fix Next.js babel/font loader conflict

## Plan
- [x] Edit `frontend/app/layout.tsx` - Remove next/font import and usage
- [x] Edit `frontend/app/globals.css` - Add Inter font import and font-family
- [x] Edit `frontend/tailwind.config.ts` - Add fontFamily extension with Inter
- [x] Edit `frontend/next.config.js` - Change swcMinify to true
- [x] Clear `.next` cache directory
- [x] Verify fix by restarting dev server

## Status
Completed

## Summary of Changes

### 1. frontend/app/layout.tsx
- Removed: `import { Inter } from 'next/font/google'`
- Removed: `const inter = Inter({ subsets: ['latin'] })`
- Changed: `className={inter.className}` → `className="font-sans"`

### 2. frontend/app/globals.css
- Added Google Fonts `@import` for Inter font at the top
- Added `font-family: 'Inter', ui-sans-serif, system-ui, sans-serif` to body styles

### 3. frontend/tailwind.config.ts
- Added `fontFamily` extension with Inter as the default sans font

### 4. frontend/next.config.js
- Changed `swcMinify: false` → `swcMinify: true`

### 5. Cache Clear
- Deleted `frontend/.next` directory to clear cached babel configuration

## Result
The `next/font` + Babel conflict has been resolved by replacing `next/font/google` with standard CSS font loading via Google Fonts CDN. The Inter font is now loaded through CSS and configured as the default sans font in Tailwind CSS.
