---
name: LMS Production Readiness
overview: "Phased plan to bring SphereX LMS to production standard: close security holes, integrate real PayMongo payments, add email/password flows, harden operations, and replace mocked features with real data."
todos:
  - id: sec-payment-bypass
    content: Remove payment_confirmed client trust; paid courses require enroll_code until PayMongo
    status: pending
  - id: sec-uploads
    content: Add auth + enrollment gating to /api/uploads static files
    status: pending
  - id: sec-enroll-code-leak
    content: Return enroll_code only to admins/org owners in course detail
    status: pending
  - id: sec-rate-limit
    content: Add express-rate-limit to auth, join-code, and enrollment endpoints
    status: pending
  - id: sec-sample-creds
    content: Remove sample credentials quick-fill from login page
    status: pending
  - id: sec-middleware
    content: Protect student routes in Next middleware
    status: pending
  - id: pay-schema
    content: Add payments table to schema
    status: pending
  - id: pay-module
    content: Build PayMongo checkout + webhook + status endpoints
    status: pending
  - id: pay-client
    content: Replace simulated payment with PayMongo checkout redirect + result page
    status: pending
  - id: email-mailer
    content: Add mailer lib (Nodemailer, provider-agnostic)
    status: pending
  - id: email-reset
    content: "Password reset flow: tokens table, endpoints, client pages"
    status: pending
  - id: email-change-pw
    content: Change-password endpoint + settings UI
    status: pending
  - id: ops-migrations
    content: Adopt node-pg-migrate with baseline migration
    status: pending
  - id: ops-logging
    content: Structured logging with pino + request IDs
    status: pending
  - id: ops-error-pages
    content: Add error.tsx / not-found.tsx to client
    status: pending
  - id: ops-certificates
    content: Auto-issue certificates with PDF generation on completion
    status: pending
  - id: ops-tests
    content: Smoke tests for auth, enrollment policy, payment webhook
    status: pending
  - id: feat-training
    content: Wire student training page to real /api/training
    status: pending
  - id: feat-analytics
    content: Real admin analytics endpoint + wire client page
    status: pending
  - id: feat-landing
    content: Landing page featured courses from public API
    status: pending
  - id: feat-cleanup
    content: Remove Supabase remnants and dead mock code
    status: pending
isProject: false
---
 
# LMS Production Readiness Plan
 
Based on a full survey of both apps. Ordered by risk: security first, then payments, then account flows, then ops, then feature completion.
 
## Phase 1 — Close security holes (do first, small diffs)
 
1. **Kill the paid-enrollment bypass.** In [lms-server/src/lib/course-enrollment.ts](lms-server/src/lib/course-enrollment.ts), stop trusting client `payment_confirmed`. Until PayMongo lands (Phase 2), paid courses can only be entered via a valid `enroll_code`. Remove `payment_confirmed` from the schema in [lms-server/src/modules/enrollments/enrollments.routes.ts](lms-server/src/modules/enrollments/enrollments.routes.ts).
2. **Protect `/api/uploads`.** In [lms-server/src/app.ts](lms-server/src/app.ts) the static uploads dir is public. Add `attachUser` + auth check middleware in front; gate SCORM/video paths by enrollment or org-staff status (reuse `assertLearnAccess` from `org-course-access.ts`). Keep org logos public.
3. **Stop leaking `enroll_code`.** `GET /api/courses/:id` in [lms-server/src/modules/courses/courses.routes.ts](lms-server/src/modules/courses/courses.routes.ts) returns the raw code — return it only to platform admins / org owners.
4. **Rate limiting.** Add `express-rate-limit`: strict on `/api/auth/*` (login, register), moderate on join-code and enrollment endpoints, generous default elsewhere.
5. **Remove dev sample credentials** from [lms-client/app/(auth)/login/page.tsx](lms-client/app/(auth)/login/page.tsx) (quick-fill users like `admin@spherex.local`).
6. **Protect student routes.** Extend [lms-client/middleware.ts](lms-client/middleware.ts) matcher to `/dashboard`, `/courses`, `/settings`, `/achievements`, `/materials`, `/training` — redirect to `/login` when session cookie is absent.
 
## Phase 2 — Real payments with PayMongo
 
1. **DB:** new `payments` table (id, user_id, course_id, amount_cents, currency, status pending/paid/failed/expired, paymongo_checkout_id, paymongo_payment_id, created/updated). Add to [lms-server/src/db/schema.sql](lms-server/src/db/schema.sql).
2. **Server module** `src/modules/payments/`:
   - `POST /api/payments/checkout` — creates PayMongo Checkout Session (cards, GCash, Maya) for a course, stores pending payment, returns `checkout_url`.
   - `POST /api/payments/webhook` — verifies PayMongo signature, marks payment paid, **creates the enrollment server-side**. This becomes the only path to paid enrollment.
   - `GET /api/payments/:id` — status polling for the client return page.
3. **Client:** replace the simulated flow in [lms-client/components/course-detail-modal.tsx](lms-client/components/course-detail-modal.tsx) — "Pay & enroll" calls checkout and redirects to PayMongo; add `/courses/payment-result` return page that polls status and confirms enrollment.
4. **Env:** `PAYMONGO_SECRET_KEY`, `PAYMONGO_WEBHOOK_SECRET`; webhook route mounted before body-size limits with raw body for signature verification.
 
## Phase 3 — Email + account flows
 
1. **Mailer:** add a provider-agnostic mailer (Nodemailer SMTP, works with Resend/Brevo/SES) in `lms-server/src/lib/mailer.ts`.
2. **Password reset:** `password_reset_tokens` table; `POST /api/auth/forgot-password` (always 200, rate-limited) + `POST /api/auth/reset-password`. Client: `/forgot-password` and `/reset-password` pages; wire the dead "Forgot Password?" button in the login page.
3. **Change password:** `POST /api/auth/change-password` (verify current password) + section in [lms-client/components/settings/user-settings-page.tsx](lms-client/components/settings/user-settings-page.tsx).
4. **Transactional emails:** enrollment confirmation and payment receipt (hooks into Phase 2 webhook). Email verification optional/later.
 
## Phase 4 — Operational hardening
 
1. **Versioned migrations:** adopt `node-pg-migrate`; convert current `schema.sql` into a baseline migration; new changes as timestamped migration files (replaces re-applying [lms-server/src/db/schema.sql](lms-server/src/db/schema.sql)).
2. **Structured logging:** `pino` + `pino-http` with request IDs, replacing morgan/console in [lms-server/src/app.ts](lms-server/src/app.ts); error handler logs stack + request ID, returns ID in 500 responses.
3. **Error surfaces:** add root `error.tsx`, `not-found.tsx`, and `global-error.tsx` in [lms-client/app/](lms-client/app/) styled to match the design system.
4. **Certificate auto-issue:** on course completion (in `updateEnrollmentProgress` in `quiz-helpers.ts`), insert a certificate row and generate a simple PDF (pdfkit) with learner name, course, date, org branding; serve via authenticated download. Achievements page then always has a real download.
5. **Smoke tests:** minimal vitest + supertest suite for auth, enrollment policy (paid course blocked without payment), and payment webhook — the highest-risk flows.
 
## Phase 5 — Replace mocks with real features
 
1. **Training page:** wire [lms-client/app/training/page.tsx](lms-client/app/training/page.tsx) to the real `/api/training` endpoint (backend already exists); remove `mockTrainingSessions`.
2. **Admin analytics:** new `GET /api/admin/analytics` aggregating real enrollments/completions/quiz stats over time; replace hardcoded arrays in [lms-client/app/admin/analytics/page.tsx](lms-client/app/admin/analytics/page.tsx).
3. **Landing page courses:** fetch featured courses from the public API instead of hardcoded `lib/landing-categories.ts` data.
4. **Dead code cleanup:** remove Supabase remnants (`lib/supabase-client.ts`, unused `components/navigation/header.tsx`), unused mock exports, `lib/middlewareawd.txt`.
 
## Sequencing note
 
Phases 1 and 2 overlap in `course-enrollment.ts`: Phase 1 removes the bypass immediately (code-only enrollment for paid courses), Phase 2 restores card/GCash payment via the webhook path. Each phase is independently shippable.