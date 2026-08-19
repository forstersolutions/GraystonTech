# Grayston Technologies

Production website for `graystontechnologies.com`.

## Experience

- Responsive static frontend across home, services, products, security, about, contact, privacy, terms, and 404 routes
- Real product interfaces for VerityForge, MyPokerMaps, FeltOS, QrystalDrop, and CUOPeration
- Scroll-led product storytelling, interactive capability and security consoles, pointer depth, and reduced-motion support
- Search, social, structured-data, sitemap, robots, manifest, security disclosure, and `llms.txt` metadata
- Vercel Function contact delivery through Resend

## Local Preview

```bash
npm run serve
```

The site is available at `http://localhost:4173`.

## Deployment

The repository is connected to Vercel. Production deploys from the configured
Git branch and the apex domain redirects to
`https://www.graystontechnologies.com`.

## Contact Form

The form posts JSON to `/api/contact` and routes inquiries to
`jforster@graystontechnologies.com`.

Required Vercel environment variable:

```bash
RESEND_API_KEY=<resend-api-key>
```

Optional overrides:

```bash
CONTACT_TO_EMAIL=jforster@graystontechnologies.com
CONTACT_FROM_EMAIL="Grayston Technologies <hello@graystontechnologies.com>"
```

The sending domain must be verified in Resend before a
`graystontechnologies.com` sender address can be used.
