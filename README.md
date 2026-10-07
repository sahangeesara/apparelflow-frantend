# ApparelFlow Frontend

Next.js frontend for the ApparelFlow cutting, verification, and sewing
workflow.

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

## Backend configuration

The frontend calls the Render backend:

`https://apparelflow-bacend.onrender.com`

To use a local or different backend, set `BACKEND_URL` before starting or
building the app:

```powershell
$env:BACKEND_URL = "http://localhost:4000"
npm run dev
```

For Netlify, add the same variable in **Site configuration → Environment
variables**, then redeploy:

```text
BACKEND_URL=https://apparelflow-bacend.onrender.com
```

The frontend API client sends `credentials: include`, so login cookies can be
used for subsequent API requests. The backend must allow the exact frontend
origin through its `FRONTEND_ORIGIN` environment variable.

Production frontend:

```text
https://apparelflow-frantend.netlify.app
```

## Workflow

The frontend uses separate API operations for each workflow stage:

1. Cutting supervisor submits an order to `POST /api/orders`; it is stored in
   `cutting_orders`.
2. Verifier submits component counts to
   `POST /api/orders/:id/counts`; they are stored in `verification_items`.
3. Approve/reject actions write the decision to `verification_logs` and update
   the cutting order status.
4. Rejected orders can be resubmitted; their old verification items are
   cleared before verification starts again.

Do not submit verification data to `/api/orders`; that endpoint creates a new
cutting order. Use `/api/orders/:id/counts` for verification counts.

## Demo Login Credentials

| Role | Email | Password |
| --- | --- | --- |
| Cutting Supervisor | `supervisor@apparelflow.test` | `Supervisor@123` |
| Cutting Verifier | `verifier@apparelflow.test` | `Verifier@123` |
| Sewing Supervisor | `sewing@apparelflow.test` | `Sewing@123` |

You can start editing the page by modifying `app/page.tsx`. The page
auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
