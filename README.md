This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

## Git Pull Troubleshooting (MR preview route conflict)

If `git pull` fails with:

`The following untracked working tree files would be overwritten by merge`

for MR preview pages like:

- `src/app/(officer)/(ais-officer)/reimbursement/medical/[mrId]/advance/[advId]/preview/page.tsx`
- `src/app/(officer)/(ais-officer)/reimbursement/medical/[mrId]/final/preview/page.tsx`

it means those files exist locally as **untracked** files while the incoming branch now tracks them.

Use one of these safe options before pulling:

```bash
# Option A: keep a backup, then pull
mkdir -p /tmp/mr-backup
mv "src/app/(officer)/(ais-officer)/reimbursement/medical/[mrId]/advance/[advId]/preview/page.tsx" /tmp/mr-backup/
mv "src/app/(officer)/(ais-officer)/reimbursement/medical/[mrId]/final/preview/page.tsx" /tmp/mr-backup/
git pull
```

```bash
# Option B: if you do not need local untracked files
git clean -fd
git pull
```

```bash
# Option C: stash including untracked files, then pull
git stash push -u -m "temp-untracked-before-pull"
git pull
git stash pop
```

Recommended: Option A if you want to compare your local files with repository versions.
