   # AI Optimization Report

   ## Supabase setup, RLS, and CRUD read flow

   The application uses Supabase/PostgreSQL as the data store behind the Express
   API. Row Level Security (RLS) is enabled on the application tables so that
   direct browser access cannot read or modify records without an approved
   database policy. The frontend does not connect to Supabase directly.

   The CRUD read flow is:

   1. The frontend requests `/api/admin/tables` to discover available tables and
      their column metadata.
   2. After an administrator selects a table, the frontend requests
      `/api/admin/:table`.
   3. The Express API authenticates the session and reads the table through the
      server-side Supabase service client.
   4. The API returns the table columns and rows to the frontend.
   5. The admin UI renders the records, formats dates and timestamps, resolves
      user UUIDs to profile names, and provides table-specific actions.

   Generated audit fields such as `created_by`, `verifier_id`, timestamps, and
   `order_no` are not manually entered from the CRUD form. Verification items are
   created by the verification flow, while verification logs remain
   view-only because they are immutable audit records.

   ## Express `service.ts`

   The Express service layer is the backend boundary for authentication,
   authorization, Supabase access, and business workflows. Keeping database
   queries and workflow rules in the service layer prevents the frontend from
   accessing Supabase credentials or bypassing validation.

   The service layer is responsible for:

   - Reading and writing Supabase records through the server-side client.
   - Forwarding the authenticated session user UUID to user-owned operations.
   - Applying role checks before admin, supervisor, verifier, and sewing actions.
   - Creating cutting orders with generated order numbers and audit ownership.
   - Recording verification component counts in `verification_items`.
   - Recording approve/reject decisions in `verification_logs`.
   - Returning joined, frontend-friendly data such as recipe names, user names,
   order status, and verification details.

   ## Frontend architecture

   The frontend is a Next.js application. Browser requests use the same-origin
   `/api` path, which is proxied to the deployed Express backend. Server-rendered
   pages use the same backend URL while forwarding the session cookie.

   The frontend architecture includes:

   - Server pages for authenticated route protection and initial data loading.
   - Client components for forms, validation, CRUD interactions, and alerts.
   - Shared API and authentication helpers in `lib/api.ts` and `lib/auth.ts`.
   - Typed domain models in `lib/types.ts`.
   - Role-based routes for supervisor, verifier, sewing, and admin workflows.
   - Table-specific admin views for cutting orders, recipe components, and
   verification records.
   - Native date/time inputs, image upload previews, friendly user labels,
   verification status indicators, and JSON variance popups.

