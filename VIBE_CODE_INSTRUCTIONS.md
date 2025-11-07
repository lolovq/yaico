# 🚀 YAICO - VIBE CODE IMPLEMENTATION GUIDE
## Complete Production-Ready Financial SaaS Platform

This guide contains everything needed to build Yaico with Claude Code (Vibe Code) in structured, manageable sessions.

---

## 📋 PREREQUISITES CHECKLIST

Before starting, ensure you have:

### Local Environment
- [ ] Node.js 18+ installed
- [ ] Git configured
- [ ] VS Code with Claude Code extension
- [ ] Terminal access

### Cloud Accounts (Can be created during setup)
- [ ] Google Cloud account (with billing enabled)
- [ ] Firebase project created
- [ ] Stripe account (test mode is fine)
- [ ] Vercel account (optional, for deployment)

### API Keys Ready
```bash
# You'll need these during Session 1
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
FIREBASE_ADMIN_SDK_KEY=
GEMINI_API_KEY=
STRIPE_SECRET_KEY=
PLAID_CLIENT_ID=
```

---

## 🎯 VIBE CODE SESSION PLAN

### SESSION 0: Project Initialization (10 minutes)
**Goal**: Create the base Next.js project with all dependencies

```bash
vibe "Create a new Next.js 14 project with TypeScript, Tailwind CSS, and app router. Project name: yaico. Add these dependencies: firebase, firebase-admin, zod, @tanstack/react-query, lucide-react, react-hook-form, @hookform/resolvers, date-fns, clsx, tailwind-merge. Add dev dependencies: vitest, @testing-library/react, @testing-library/jest-dom, msw, @types/node. Create a clean folder structure with src/app, src/components, src/lib, src/server directories."
```

### SESSION 1: Core Data Models & Validation (20 minutes)
**Goal**: Set up Zod schemas and TypeScript types

```bash
vibe "Create comprehensive Zod schemas for a financial SaaS platform in src/lib/types/schemas.ts. Include: 1) TransactionSchema with fields: id (uuid), userId (uuid), amount (number with 2 decimals max), currency (EUR/USD/GBP), description (string 3-500 chars), status (draft/processing/pending_review/approved/reserved/error), source (manual/bank_import/invoice_scan/api), clientId (optional uuid), aiAnalysis object (suggestedCategory, certaintyScore 0-1, modelVersion, processingTimeMs), taxDetails object (vatRate, vatAmount, deductible boolean, taxYear, quarter), and audit fields. 2) ClientSchema with DBA monitoring fields including classification (b2b/b2c/unknown), countryCode, vatNumber with Dutch IBAN regex validation. 3) SubscriptionSchema with Stripe integration fields and usage tracking. 4) AggregatedSummarySchema for performance optimization. Export all types. Add Dutch-specific validators."
```

### SESSION 2: Firebase Setup & Security Rules (25 minutes)
**Goal**: Configure Firebase with proper security and data structure

```bash
vibe "Set up Firebase configuration for a financial SaaS. Create: 1) src/lib/firebase/config.ts with client initialization. 2) src/lib/firebase/admin.ts with admin SDK setup using service account. 3) firestore.rules with security rules: users can only read/write their own data, transactions require authenticated userId match, implement rate limiting rules, add admin role checks. 4) src/lib/firebase/converters.ts with Firestore converters for all Zod schemas from previous session. 5) storage.rules for document uploads. Include proper error handling and connection state management."
```

### SESSION 3: Authentication System (30 minutes)
**Goal**: Complete auth with protected routes and session management

```bash
vibe "Build a complete authentication system using Firebase Auth and Next.js 14 app router. Create: 1) src/lib/auth/AuthContext.tsx with React context for auth state. 2) src/app/(auth)/sign-in/page.tsx and sign-up/page.tsx with email/password and Google OAuth. 3) src/middleware.ts to protect routes (redirect to sign-in if not authenticated). 4) src/lib/auth/session.ts for server-side session validation. 5) src/components/auth/AuthGuard.tsx wrapper component. 6) User onboarding flow that creates user document in Firestore with subscription tier. Include loading states, error handling, and remember me functionality."
```

### SESSION 4: Server Actions & API Layer (30 minutes)
**Goal**: Build the server action layer with proper error handling

```bash
vibe "Create Next.js 14 server actions with enterprise-grade error handling. Build: 1) src/server/actions/lib/action-wrapper.ts with try-catch, Zod validation, auth checks, and rate limiting. 2) src/server/actions/transaction.actions.ts with createTransaction (triggers AI categorization), updateTransaction, approveTransaction, and getTransactions with pagination. 3) src/server/actions/client.actions.ts for CRUD operations. 4) src/server/actions/subscription.actions.ts with checkSubscriptionLimit and upgradeSubscription. All actions must: validate inputs with Zod, check user auth, verify subscription tier permissions, return standardized success/error responses, include telemetry logging."
```

### SESSION 5: AI Integration & Gateways (35 minutes)
**Goal**: Implement AI categorization with Human-in-the-Loop

```bash
vibe "Build AI transaction categorization system with Google Gemini. Create: 1) src/server/gateways/base.gateway.ts with retry logic, circuit breaker, caching, and error handling. 2) src/server/gateways/ai.gateway.ts extending base, implementing suggestCategory method that calls Gemini API, returns category with certainty score, includes alternative suggestions. Use historical transactions for context. 3) src/lib/ai/prompts.ts with optimized prompts for Dutch financial categorization. 4) src/app/api/webhooks/ai-process/route.ts webhook endpoint that processes transactions asynchronously. 5) src/components/transactions/ReviewQueue.tsx for manual review when AI certainty < 0.9. Include mock mode for testing without API."
```

### SESSION 6: Dashboard & Data Visualization (30 minutes)
**Goal**: Build the main dashboard with real-time updates

```bash
vibe "Create a financial dashboard with real-time data. Build: 1) src/app/(app)/dashboard/page.tsx with grid layout showing KPIs. 2) src/components/dashboard/IncomeCard.tsx showing YTD income (number must be fetched from aggregated collection, not calculated). 3) src/components/dashboard/TaxReserveCard.tsx showing reserved tax amount in mint green (#00CC99). 4) src/components/dashboard/DBAWarningBanner.tsx that shows when client concentration >70%. 5) src/components/dashboard/RecentTransactions.tsx with status badges. 6) src/hooks/useRealtimeData.ts for Firestore subscriptions. Use Tailwind CSS, ensure responsive design, add loading skeletons, implement error boundaries."
```

### SESSION 7: Transaction Management UI (35 minutes)
**Goal**: Complete transaction CRUD with filters and bulk operations

```bash
vibe "Build comprehensive transaction management interface. Create: 1) src/app/(app)/transactions/page.tsx with data table, filters (date range, status, category, client), search, and bulk operations. 2) src/components/transactions/TransactionTable.tsx with sorting, inline editing, status indicators. 3) src/components/transactions/TransactionForm.tsx modal for creating/editing with client dropdown, amount input with currency, VAT calculator integration. 4) src/components/transactions/BulkActions.tsx for approve/reject/categorize multiple items. 5) src/components/transactions/ImportWizard.tsx for CSV/bank import. Use react-hook-form for forms, tanstack-table for the data table, implement optimistic updates."
```

### SESSION 8: Payment Integration (30 minutes)
**Goal**: Integrate Stripe for subscriptions

```bash
vibe "Integrate Stripe for subscription management. Create: 1) src/server/gateways/stripe.gateway.ts with methods: createCheckoutSession, createPortalSession, handleWebhook. 2) src/app/api/stripe/webhook/route.ts to handle Stripe events (subscription created/updated/cancelled). 3) src/app/(app)/settings/billing/page.tsx showing current plan, usage, upgrade options. 4) src/components/billing/PricingTable.tsx with three tiers (Starter €29, Professional €79, Enterprise €199). 5) src/components/billing/UsageMeters.tsx showing API calls, storage, transactions count vs limits. Include test mode detection, proper webhook signature verification."
```

### SESSION 9: Compliance & Tax Features (40 minutes)
**Goal**: Build DBA monitoring and VAT calculation

```bash
vibe "Implement Dutch compliance features. Create: 1) src/lib/tax/vat-calculator.ts with EU VAT rules: domestic 21%, reverse charge for EU B2B, OSS for B2C, validate VAT numbers. 2) src/lib/compliance/dba-monitor.ts calculating client concentration using Herfindahl index. 3) src/app/(app)/compliance/page.tsx dashboard showing DBA risk score, client diversity chart, VAT obligations. 4) src/components/compliance/DBAAlert.tsx warning component when concentration >70%. 5) src/server/actions/compliance.actions.ts with generateDBAReport and calculateVATReturn. Include tooltips explaining Dutch tax rules, support for quarterly VAT returns."
```

### SESSION 10: Cloud Functions (35 minutes)
**Goal**: Set up Firebase Cloud Functions for background processing

```bash
vibe "Create Firebase Cloud Functions for async processing. In firebase/functions directory create: 1) src/triggers/onTransactionCreate.ts that triggers AI categorization when status='processing'. 2) src/triggers/onTransactionApproved.ts updating aggregated summaries using FieldValue.increment. 3) src/scheduled/weeklyDBACheck.ts running every Monday to check client concentration. 4) src/scheduled/monthlyVATReport.ts generating VAT reports. 5) src/lib/aggregation.ts with updateDailySummary, updateMonthlySummary, updateYearlySummary functions. Include error handling, retry logic, dead letter queue for failures."
```

### SESSION 11: Testing Infrastructure (30 minutes)
**Goal**: Comprehensive test coverage

```bash
vibe "Set up testing infrastructure with Vitest. Create: 1) vitest.config.ts with proper setup for Next.js. 2) src/test/setup.ts with testing-library configuration. 3) src/__tests__/schemas.test.ts testing all Zod schemas with valid/invalid data. 4) src/__tests__/vat-calculator.test.ts with test cases: Dutch B2C (21%), Dutch B2B (21%), German B2B (0% reverse charge), US export (0%). 5) src/__tests__/dba-monitor.test.ts testing risk levels at 50%, 70%, 85% concentration. 6) src/test/factories.ts with factory functions for creating test data. Include MSW for API mocking."
```

### SESSION 12: Performance & Monitoring (25 minutes)
**Goal**: Add observability and performance monitoring

```bash
vibe "Implement monitoring and performance optimization. Create: 1) src/lib/monitoring/logger.ts with structured logging using winston. 2) src/lib/monitoring/metrics.ts collecting custom metrics (AI decisions, API latency, error rates). 3) src/lib/performance/cache.ts implementing Redis-like in-memory cache with TTL. 4) src/middleware/rateLimit.ts rate limiting middleware (100/hour basic, 1000/hour pro). 5) src/components/common/ErrorBoundary.tsx with error reporting. 6) Implement React.lazy() for code splitting in main routes."
```

### SESSION 13: Mobile Responsive & PWA (20 minutes)
**Goal**: Ensure mobile experience and offline capability

```bash
vibe "Make the app mobile responsive and PWA-ready. Update: 1) All dashboard components to be mobile-first with responsive grid. 2) Create src/app/manifest.json with app configuration. 3) Implement service worker in public/sw.js for offline caching. 4) Add src/components/mobile/BottomNav.tsx for mobile navigation. 5) Create src/components/mobile/TransactionQuickAdd.tsx floating action button. 6) Update all tables to be horizontally scrollable on mobile. Use container queries where appropriate."
```

### SESSION 14: Deployment Configuration (15 minutes)
**Goal**: Prepare for production deployment

```bash
vibe "Set up production deployment configuration. Create: 1) .env.example with all required environment variables documented. 2) docker-compose.yml for local development with Firebase emulators. 3) .github/workflows/ci.yml running tests, linting, type checking on PR. 4) .github/workflows/deploy.yml for automatic deployment to Vercel. 5) scripts/backup-firestore.ts for database backups. 6) next.config.js with security headers, image optimization, bundle analyzer. Include staging and production environment configurations."
```

---

## 🔧 POST-IMPLEMENTATION TASKS

After completing all sessions:

### 1. Security Audit
```bash
npm audit fix
npm run test:security
```

### 2. Performance Testing
```bash
npm run lighthouse
npm run bundle-analyze
```

### 3. Documentation
```bash
vibe "Generate comprehensive README.md with setup instructions, architecture overview, and API documentation"
```

### 4. Legal Compliance
```bash
vibe "Create GDPR-compliant privacy policy and terms of service pages for Dutch market"
```

---

## 💡 TIPS FOR SUCCESS

1. **Run sessions in order** - Each builds on the previous
2. **Test after each session** - Ensure everything works before moving on
3. **Commit frequently** - After each successful session
4. **Use development branch** - Don't work directly on main
5. **Keep sessions focused** - Don't try to do too much at once

---

## 🚨 TROUBLESHOOTING

### Common Issues and Solutions

**Firebase permissions error**
```bash
firebase login
firebase use --add
```

**Type errors after schema changes**
```bash
npm run generate:types
```

**Vercel deployment fails**
```bash
vercel env pull
vercel build --debug
```

---

## 📞 SUPPORT

- Check logs in: `logs/vibe-code-sessions.log`
- Firebase Console: https://console.firebase.google.com
- Stripe Dashboard: https://dashboard.stripe.com/test

---

## ✅ LAUNCH CHECKLIST

Before going live:

- [ ] All tests passing (>80% coverage)
- [ ] Security headers configured
- [ ] SSL certificate active
- [ ] Backup strategy in place
- [ ] Monitoring alerts configured
- [ ] GDPR compliance verified
- [ ] Load testing completed
- [ ] Payment flow tested end-to-end
- [ ] Dutch tax calculations verified by accountant
- [ ] Terms of Service and Privacy Policy published
