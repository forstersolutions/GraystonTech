# Grayston Technologies

Static frontend for `graystontechnologies.com`.

## Files

- `index.html` - homepage markup and SEO metadata
- `styles.css` - responsive styling, animations, product visuals, and layout
- `script.js` - mobile navigation, sticky header state, and reveal animations
- `assets/grayston-hero.png` - generated hero image
- `assets/grayston-mark.svg` - favicon/brand mark

## Preview

Open `index.html` in a browser or run:

```bash
npm run serve
```

## Deploy

This repository is intended for Vercel Git integration. Pushes to the production
branch should deploy the static site directly from the repo root.

After the Vercel project is connected, point the Square-purchased domain DNS
records to Vercel using the values shown in Vercel's domain setup screen.

## Contact Form

The contact form posts to `/api/contact` and routes messages to
`jmaxforster@gmail.com`.

Required Vercel environment variable for email delivery:

```bash
RESEND_API_KEY=<resend-api-key>
```

Optional environment variables:

```bash
CONTACT_TO_EMAIL=jmaxforster@gmail.com
CONTACT_FROM_EMAIL="Grayston Technologies <hello@graystontechnologies.com>"
```

If `CONTACT_FROM_EMAIL` uses `graystontechnologies.com`, verify that domain in
Resend and add the required DNS records before sending from it.

## Image Prompt

Generated with the built-in image generation tool:

> Create a cinematic, premium technology studio hero image for Grayston Technologies, a company named after two sons. No text. Dark refined engineering workspace at night with glass, brushed metal, code-like interface reflections, secure cloud architecture diagrams, and two clean intersecting light paths. Photorealistic, high contrast, premium but restrained, no people, no logos, no readable text.
