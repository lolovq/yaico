# 📋 VIBE CODE QUICK REFERENCE
## Copy-Paste Ready Commands for Yaico Development

---

## 🚀 INSTANT START COMMANDS

### Complete Project Setup (One Command)
```bash
vibe "Create a complete Next.js 14 TypeScript project setup for a financial SaaS called Yaico. Include: package.json with firebase, zod, stripe, @tanstack/react-query, tailwind dependencies. Create folder structure: src/app (with auth and app routes), src/components, src/lib, src/server. Add TypeScript config with strict mode and path aliases. Create .env.example with Firebase, Stripe, and Google Cloud variables. Add Tailwind config with custom Yaico mint color (#00CC99). Create firebase.json and firestore.rules for security. Make it production-ready."
```

---

## 📦 SESSION-BY-SESSION COMMANDS

### Session 1: Data Models (Copy & Paste)
```bash
vibe "Create Zod schemas in src/lib/types/schemas.ts for Dutch financial SaaS:

TransactionSchema:
- id: uuid, userId: uuid, amount: number (2 decimals), currency: EUR/USD/GBP
- description: string (3-500 chars), clientId: optional uuid  
- status: enum [draft, processing, pending_review, approved, reserved, error]
- aiAnalysis: {suggestedCategory, certaintyScore: 0-1, modelVersion, processingTimeMs}
- taxDetails: {vatRate, vatAmount, deductible: boolean}
- timestamps and audit fields

ClientSchema:
- Basic info, classification: b2b/b2c/unknown, countryCode
- vatNumber with Dutch format validation
- dbaTracking for concentration monitoring

SubscriptionSchema with Stripe fields and usage limits.
Export all types. Add IBAN and VAT validators."
```

### Session 2: Firebase Setup (Copy & Paste)
```bash
vibe "Set up Firebase for production app:
1. src/lib/firebase/client.ts - client SDK initialization with error handling
2. src/lib/firebase/admin.ts - admin SDK with service account
3. src/lib/firebase/converters.ts - Firestore converters for Zod schemas
4. firestore.rules - users own their data, rate limiting, subscription checks
5. Add connection state management and offline support"
```

### Session 3: Authentication (Copy & Paste)
```bash
vibe "Build complete auth system with Firebase Auth and Next.js 14:
1. AuthContext with useAuth hook, loading states, error handling
2. Sign-in/Sign-up pages with email and Google OAuth
3. Middleware.ts protecting /dashboard, /transactions routes
4. Server-side session validation in lib/auth/session.ts
5. Onboarding flow creating Firestore user document
Include remember me, password reset, email verification"
```

### Session 4: AI Categorization (Copy & Paste)
```bash
vibe "Create AI transaction categorization with Gemini:
1. Base gateway class with retry, circuit breaker, caching
2. AI gateway calling Gemini to categorize Dutch transactions
3. Return category, certainty score (0-1), alternatives
4. Human-in-the-loop UI for certainty < 0.9
5. Mock mode for testing without API
Dutch context: KPN=utilities, Albert Heijn=groceries"
```

### Session 5: Dashboard (Copy & Paste)
```bash
vibe "Build financial dashboard with real-time Firestore data:
1. Dashboard page with responsive grid layout
2. YTD income card (fetch from aggregated collection)
3. Tax reserve card in mint green (#00CC99)
4. DBA warning if client concentration >70%
5. Recent transactions with status badges
6. useRealtimeData hook for subscriptions
Add loading skeletons, error boundaries, responsive design"
```

### Session 6: Transactions UI (Copy & Paste)
```bash
vibe "Create transaction management interface:
1. Data table with filters (date, status, category, client)
2. Inline editing, sorting, search
3. Create/edit modal with VAT calculation
4. Bulk approve/reject/categorize
5. CSV import wizard
Use react-hook-form, tanstack-table, optimistic updates"
```

---

## 🔥 ADVANCED FEATURES

### DBA Compliance Monitor
```bash
vibe "Build DBA compliance system:
Calculate client revenue concentration with Herfindahl index.
Show risk levels: <50% green, 50-70% yellow, 70-85% orange, >85% red.
Create dashboard showing top clients, diversity score, recommendations.
Alert when crossing thresholds. Generate quarterly reports."
```

### VAT Calculator
```bash
vibe "Create EU VAT calculator:
Dutch domestic: 21%, EU B2B with VAT: 0% reverse charge,
EU B2C digital: destination country rate if >€10k/year,
Outside EU: 0%. Validate VAT numbers, support quarterly returns."
```

### Stripe Subscription
```bash
vibe "Integrate Stripe subscriptions:
Three tiers: Starter €29 (100 transactions), Pro €79 (1000), Enterprise €199 (unlimited).
Checkout, customer portal, webhook handling.
Show usage meters, upgrade prompts when near limits."
```

---

## 🧪 TESTING COMMANDS

### Unit Tests
```bash
vibe "Create Vitest unit tests:
Test Zod schemas validation, VAT calculations (NL 21%, DE B2B 0%),
DBA risk levels (50%, 70%, 85%), date utilities, formatters.
Aim for 80% coverage."
```

### Integration Tests
```bash
vibe "Create integration tests:
Test transaction flow from creation to AI categorization,
Test subscription gating, test aggregation updates,
Use MSW for API mocking, test error scenarios."
```

---

## 🚨 QUICK FIXES

### Fix TypeScript Errors
```bash
vibe "Fix all TypeScript errors in the project. Update type definitions, fix any type mismatches, ensure strict mode compliance."
```

### Add Missing Dependencies
```bash
vibe "Check imports and add any missing npm packages to package.json. Ensure all imports resolve correctly."
```

### Optimize Performance
```bash
vibe "Optimize React components: add memo where needed, lazy load routes, implement virtual scrolling for large lists, add Suspense boundaries."
```

---

## 🎨 UI COMPONENTS

### Data Table Component
```bash
vibe "Create reusable DataTable component with TypeScript generics, sorting, filtering, pagination, column visibility, export to CSV. Use tanstack-table."
```

### Form Components
```bash
vibe "Create form components: MoneyInput with currency symbol, VATNumberInput with validation, DateRangePicker, ClientSelector with search. Use react-hook-form."
```

### Chart Components
```bash
vibe "Create dashboard charts using Recharts: IncomeChart (line), CategoryBreakdown (pie), ClientDistribution (bar), CashFlow (area). Make responsive."
```

---

## 🔐 SECURITY COMMANDS

### Add Encryption
```bash
vibe "Add encryption service using crypto: encrypt sensitive data before storing, decrypt on retrieval. Use AES-256-GCM. Add key rotation support."
```

### Rate Limiting
```bash
vibe "Implement rate limiting: 100 requests/hour for basic, 1000 for pro. Use in-memory store, return 429 when exceeded, show remaining in headers."
```

### Input Sanitization
```bash
vibe "Add input sanitization: XSS prevention, SQL injection prevention (even though using Firestore), validate all user inputs with Zod."
```

---

## 📱 MOBILE OPTIMIZATION

### PWA Setup
```bash
vibe "Make app PWA: add manifest.json, service worker for offline, app icons, splash screens. Cache critical assets, show offline indicator."
```

### Mobile UI
```bash
vibe "Optimize for mobile: bottom navigation, swipe gestures, touch-friendly buttons (44px targets), responsive tables with horizontal scroll."
```

---

## 🛠️ UTILITY SCRIPTS

### Generate Types from Firestore
```bash
vibe "Create script to generate TypeScript types from Firestore data: scan collections, infer types, generate interfaces, update automatically."
```

### Seed Database
```bash
vibe "Create seed script: generate 100 sample transactions, 10 clients, various categories. Use realistic Dutch business data. Add npm script."
```

### Backup Script
```bash
vibe "Create Firestore backup script: export all collections to JSON, compress with timestamp, upload to cloud storage. Add restore function."
```

---

## 💡 PRO TIPS

1. **Always include context**: "for Dutch financial SaaS"
2. **Specify frameworks**: "using Next.js 14 app router"
3. **Include error handling**: "with try-catch and user-friendly errors"
4. **Request types**: "with full TypeScript types"
5. **Ask for tests**: "include unit tests"

---

## 🎯 COMPLETE FEATURES IN ONE COMMAND

### Complete Transaction System
```bash
vibe "Build complete transaction system: CRUD operations with server actions, Zod validation, AI categorization with Gemini, human review queue for low confidence, real-time aggregation updates, audit trail. Include UI with data table, create/edit modal, bulk operations, filters. Add tests."
```

### Complete Compliance System
```bash
vibe "Build Dutch compliance system: DBA monitoring with client concentration calculation, risk scoring with traffic light system, automated alerts at thresholds, VAT calculator for domestic/EU/international, quarterly tax reports. Include dashboard, email notifications, PDF report generation."
```

---

## 📝 DOCUMENTATION COMMANDS

### API Documentation
```bash
vibe "Generate API documentation: list all server actions, document parameters and return types, add usage examples, error codes, rate limits."
```

### Component Storybook
```bash
vibe "Set up Storybook: configure for Next.js, create stories for all UI components, add controls for props, document usage examples."
```

---

Keep this guide handy for rapid development with Vibe Code! 🚀
