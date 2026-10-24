# Sanity Clean Content Studio

## Roam content model

The Studio models stays as `property` documents with typed location, category, capacity,
pricing, amenity, quiet-stay, and house-rule fields. Descriptive copy (`summary`,
`description`, `facts`, and `vibes`) stays on the property document so it can be embedded
without joining unrelated records. Stays reference reusable `host` and `policy` documents;
guest reviews are separate documents linked to a stay.

Date-based availability is intentionally not seeded. The typed price, cleaning fee, minimum
nights, and weekly discount fields support an estimate once dates are selected; a real
availability calendar needs a booking source.

From this directory:

```bash
npx sanity schema deploy
npx sanity deploy
npm run seed -- --dry-run
npm run seed
```

The seed uses your Sanity CLI login, matches stays/hosts/policies by slug and reviews by a
stable seed key, updates only seeded fields, and never deletes content. Re-running it does
not create duplicate documents. Seed photos use external Unsplash URLs.

Congratulations, you have now installed the Sanity Content Studio, an open-source real-time content editing environment connected to the Sanity backend.

Now you can do the following things:

- [Read “getting started” in the docs](https://www.sanity.io/docs/introduction/getting-started?utm_source=readme)
- [Join the Sanity community](https://www.sanity.io/community/join?utm_source=readme)
- [Extend and build plugins](https://www.sanity.io/docs/content-studio/extending?utm_source=readme)
