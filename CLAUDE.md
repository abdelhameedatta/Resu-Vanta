# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # Install dependencies
npm run dev       # Start local dev server at http://localhost:3000
npm run build     # Production build (runs TypeScript type checking)
npm run lint      # Lint the codebase
```

## Architecture

This is a **Next.js 14** app deployed on **Vercel**. All pages are in a single file (`app/page.tsx`) using client-side React components with `useState`.

### Payment Flow
- `app/components/StripeWrapper.tsx` — Main payment UI. `CheckoutForm` is the actual form rendered inside Stripe `<Elements>`. Uses `payment_method_types: ['card']` on the PaymentIntent to disable Link.
- `app/api/create-checkout-session/route.ts` — Creates Stripe PaymentIntent server-side. Uses `STRIPE_SECRET_KEY` env var.
- `app/components/PaymentForm.tsx` — Unused legacy component, kept for reference.

### Key Notes
- The app has 3 services: `optimization` ($7.99), `builder` ($11.99), `linkedin` ($6.99)
- After payment, results are stored in `sessionStorage` (not persistent)
- PDF generation uses `window.open()` with inline HTML — no library needed
- Stripe publishable key is hardcoded in `StripeWrapper.tsx` (test key only)
- `STRIPE_SECRET_KEY` must be set in Vercel environment variables for production

### Styling
- Global styles in `app/globals.css` — uses plain CSS classes (no Tailwind in components, only in `PaymentForm.tsx`)
- Dark mode toggled via `.site.dark` class on root element
