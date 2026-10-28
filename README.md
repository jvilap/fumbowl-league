This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Data updates

The sync discovers tournaments in FUMBBL group 13713 and runs daily at 04:00 UTC via the Vercel cron in `vercel.json`. New seasons are created from tournament start dates, new played matches are imported, participating teams in ongoing tournaments are refreshed, and coach Elo is recalculated. A tournament without a start date cannot be assigned to a season until that date is available. Abandoned tournament 65140 is excluded from match imports.

Set `POSTGRES_URL` and `CRON_SECRET` in the deployment environment. Vercel sends the cron secret as a bearer token; the same endpoint can be triggered manually:

```bash
curl -X POST https://YOUR_DOMAIN/api/sync -H "Authorization: Bearer $CRON_SECRET"
```

The schedule takes effect after deployment, and sync results and errors are recorded in the `sync_log` table. The route is configured for a 300-second maximum duration, which requires a compatible Vercel plan and function configuration.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
