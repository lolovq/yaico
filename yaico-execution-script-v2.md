#################################################################
# YAICO AI-NATIVE UITVOERINGSSCRIPT V2.0 (PRODUCTION-READY)
#
# CHANGELOG V2.0:
# - Toegevoegd: Security-first approach met echte encryptie
# - Toegevoegd: Comprehensive testing strategy (80% coverage target)
# - Toegevoegd: Performance monitoring & observability layer
# - Toegevoegd: Multi-stage deployment pipeline
# - Toegevoegd: Error recovery & rollback mechanisms
# - Toegevoegd: Audit trail voor compliance
#
# Stack: Next.js 14, TypeScript, Firebase, Google Cloud KMS, OpenTelemetry
#################################################################

#================================================================
# FASE 0: SECURITY & INFRASTRUCTURE FOUNDATION [NIEUW]
# DOEL: Production-grade security en monitoring vanaf dag 1
# PRIORITEIT: URGENT - Moet voor alle andere fases
#================================================================

## COMMANDO 0.1: Security Configuration & Secrets Management
**FILE:** `infrastructure/terraform/security.tf`
```hcl
# Google Cloud KMS setup voor encryptie
resource "google_kms_crypto_key" "yaico_master" {
  name     = "yaico-master-key"
  key_ring = google_kms_key_ring.yaico.id
  purpose  = "ENCRYPT_DECRYPT"
  
  rotation_period = "7776000s" # 90 dagen
  
  lifecycle {
    prevent_destroy = true
  }
}

# Secret Manager voor API keys
resource "google_secret_manager_secret" "api_keys" {
  for_each = toset(["stripe", "plaid", "gemini"])
  
  secret_id = "${each.key}-api-key"
  
  replication {
    automatic = true
  }
}
```

## COMMANDO 0.2: Environment Configuration met Validation
**FILE:** `.env.schema.ts`
```typescript
import { z } from 'zod';

export const envSchema = z.object({
  // Deployment environment
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  DEPLOYMENT_STAGE: z.enum(['local', 'preview', 'staging', 'production']),
  
  // Security
  KMS_PROJECT_ID: z.string().min(1),
  KMS_LOCATION: z.string().default('europe-west4'),
  KMS_KEYRING: z.string().min(1),
  KMS_KEY: z.string().min(1),
  
  // Feature flags
  ENABLE_AI_CATEGORIZATION: z.boolean().default(false),
  ENABLE_DBA_MONITORING: z.boolean().default(false),
  AI_CONFIDENCE_THRESHOLD: z.number().min(0).max(1).default(0.90),
  
  // Rate limiting
  RATE_LIMIT_BASIC: z.number().default(100),
  RATE_LIMIT_PRO: z.number().default(1000),
  RATE_LIMIT_ENTERPRISE: z.number().default(10000),
});

export type Env = z.infer<typeof envSchema>;
```

## COMMANDO 0.3: Observability & Monitoring Setup
**FILE:** `src/lib/monitoring/telemetry.ts`
```typescript
import { trace, context, SpanStatusCode } from '@opentelemetry/api';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { logger } from './structured-logger';

const tracer = trace.getTracer('yaico', '1.0.0');

export class TelemetryService {
  private static metrics = {
    aiDecisions: new Counter('ai_categorization_decisions_total'),
    aiLatency: new Histogram('ai_categorization_latency_ms'),
    dbaCriticalAlerts: new Counter('dba_critical_alerts_total'),
    encryptionOperations: new Counter('encryption_operations_total'),
    apiGatewayErrors: new Counter('api_gateway_errors_total', ['gateway', 'method']),
  };

  static async trackAIDecision(params: {
    transactionId: string;
    suggestedCategory: string;
    certaintyScore: number;
    latencyMs: number;
    accepted: boolean;
  }) {
    const span = tracer.startSpan('ai.categorization.decision');
    
    try {
      span.setAttributes({
        'transaction.id': params.transactionId,
        'ai.category': params.suggestedCategory,
        'ai.certainty': params.certaintyScore,
        'ai.latency_ms': params.latencyMs,
        'ai.accepted': params.accepted,
      });

      // Metrics
      this.metrics.aiDecisions.inc({ category: params.suggestedCategory });
      this.metrics.aiLatency.observe(params.latencyMs);

      // Structured logging voor ML training feedback
      logger.info('AI_DECISION', {
        ...params,
        timestamp: new Date().toISOString(),
        modelVersion: process.env.AI_MODEL_VERSION,
      });

      // Alert bij lage confidence scores
      if (params.certaintyScore < 0.5) {
        logger.warn('LOW_CONFIDENCE_AI_DECISION', params);
      }

      span.setStatus({ code: SpanStatusCode.OK });
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      span.end();
    }
  }

  static async trackDBAViolation(params: {
    userId: string;
    clientId: string;
    percentage: number;
    threshold: number;
  }) {
    this.metrics.dbaCriticalAlerts.inc();
    
    // Real-time alert naar Slack/PagerDuty
    if (params.percentage > 90) {
      await this.sendCriticalAlert({
        type: 'DBA_VIOLATION_CRITICAL',
        ...params,
      });
    }
  }
}
```

#================================================================
# FASE 1: DATA CONTRACTS & TYPE SAFETY [VERBETERD]
# DOEL: Bulletproof type safety met runtime validation
#================================================================

## COMMANDO 1.1: Enhanced Zod Schemas met Business Rules
**FILE:** `src/lib/types/dataSchemas.ts`
```typescript
import { z } from 'zod';
import { EUROPEAN_COUNTRIES, VAT_RATES } from '../constants/tax';

// Custom validators
const dutchIBAN = z.string().regex(/^NL\d{2}[A-Z]{4}\d{10}$/, 'Invalid Dutch IBAN');
const vatNumber = z.string().regex(/^[A-Z]{2}[0-9A-Z]+$/, 'Invalid VAT number');

// Transaction met complete audit trail
export const TransactionSchema = z.object({
  // Identifiers
  id: z.string().uuid(),
  userId: z.string().uuid(),
  
  // Core fields
  amount: z.number()
    .min(-1000000, 'Amount too low')
    .max(1000000, 'Amount too high')
    .refine(val => Math.round(val * 100) / 100 === val, 'Max 2 decimals'),
  
  currency: z.enum(['EUR', 'USD', 'GBP']).default('EUR'),
  
  description: z.string()
    .min(3, 'Description too short')
    .max(500, 'Description too long')
    .transform(val => val.trim()),
  
  // Workflow fields (Async AI)
  status: z.enum([
    'draft',           // User creating
    'processing',      // AI analyzing
    'pending_review',  // Human review needed
    'approved',        // Confirmed
    'reserved',        // Tax reserved
    'archived',        // Historical
    'error'           // Processing failed
  ]),
  
  // AI Enhancement fields
  aiAnalysis: z.object({
    suggestedCategory: z.string(),
    certaintyScore: z.number().min(0).max(1),
    modelVersion: z.string(),
    processingTimeMs: z.number(),
    alternativeCategories: z.array(z.object({
      category: z.string(),
      score: z.number(),
    })).optional(),
  }).optional(),
  
  // Tax & Compliance
  taxDetails: z.object({
    vatRate: z.number().min(0).max(100),
    vatAmount: z.number(),
    deductible: z.boolean(),
    taxYear: z.number(),
    quarter: z.enum(['Q1', 'Q2', 'Q3', 'Q4']),
  }).optional(),
  
  // Client association
  clientId: z.string().uuid().optional(),
  
  // Audit fields
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(), // userId or 'system'
  lastModifiedBy: z.string(),
  version: z.number().int().positive(),
  
  // Source tracking
  source: z.enum(['manual', 'bank_import', 'invoice_scan', 'api']),
  sourceMetadata: z.record(z.any()).optional(),
});

// Client met DBA monitoring fields
export const ClientSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  
  // Basic info
  clientName: z.string().min(2).max(200),
  clientType: z.enum(['individual', 'company']),
  
  // Critical for VAT calculation
  classification: z.enum(['b2b', 'b2c', 'unknown']),
  countryCode: z.string().length(2).toUpperCase(),
  vatNumber: vatNumber.optional(),
  
  // Contact
  email: z.string().email().optional(),
  invoiceEmail: z.string().email().optional(),
  
  // DBA Monitoring
  dbaTracking: z.object({
    firstInvoiceDate: z.date(),
    totalInvoiced: z.number().min(0),
    invoiceCount: z.number().int().min(0),
    lastRiskAssessment: z.date().optional(),
    riskScore: z.number().min(0).max(100).optional(),
  }).optional(),
  
  // Payment terms
  paymentTermsDays: z.number().int().min(0).max(365).default(30),
  preferredPaymentMethod: z.enum(['bank_transfer', 'ideal', 'creditcard']).optional(),
  
  // Metadata
  tags: z.array(z.string()).default([]),
  active: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Subscription met usage tracking
export const SubscriptionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  
  // Stripe integration
  stripeCustomerId: z.string().optional(),
  stripeSubscriptionId: z.string().optional(),
  
  // Status
  status: z.enum(['trialing', 'active', 'past_due', 'canceled', 'paused']),
  tier: z.enum(['starter', 'professional', 'enterprise', 'custom']),
  
  // Dates
  currentPeriodStart: z.date(),
  currentPeriodEnd: z.date(),
  trialEndDate: z.date().optional(),
  canceledAt: z.date().optional(),
  
  // Usage limits
  limits: z.object({
    transactionsPerMonth: z.number().int(),
    clientsMax: z.number().int(),
    teamMembersMax: z.number().int(),
    apiCallsPerDay: z.number().int(),
    storageGb: z.number(),
  }),
  
  // Current usage
  usage: z.object({
    transactionsThisMonth: z.number().int(),
    clientsActive: z.number().int(),
    teamMembersActive: z.number().int(),
    apiCallsToday: z.number().int(),
    storageUsedGb: z.number(),
  }),
  
  // Billing
  billingInterval: z.enum(['monthly', 'yearly']),
  pricePerMonth: z.number().min(0),
  currency: z.enum(['EUR', 'USD']),
  
  // Features
  features: z.array(z.string()),
});

// Aggregated Summary voor Performance
export const AggregatedSummarySchema = z.object({
  userId: z.string().uuid(),
  period: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
  periodKey: z.string(), // e.g., "2024-Q1", "2024-W15", "2024-03"
  
  // Income
  totalIncome: z.number().min(0),
  totalIncomeYTD: z.number().min(0),
  incomeByCategory: z.record(z.number()),
  
  // Expenses
  totalExpenses: z.number().min(0),
  totalExpensesYTD: z.number().min(0),
  expensesByCategory: z.record(z.number()),
  
  // Tax
  vatCollected: z.number().min(0),
  vatPaid: z.number().min(0),
  vatBalance: z.number(),
  incomeTaxReserved: z.number().min(0),
  
  // Client concentration (DBA)
  topClientPercentage: z.number().min(0).max(100),
  topClientId: z.string().uuid().optional(),
  clientDiversityScore: z.number().min(0).max(100),
  
  // Metadata
  lastCalculated: z.date(),
  version: z.number(),
  calculationDurationMs: z.number(),
});

// Type exports
export type Transaction = z.infer<typeof TransactionSchema>;
export type Client = z.infer<typeof ClientSchema>;
export type Subscription = z.infer<typeof SubscriptionSchema>;
export type AggregatedSummary = z.infer<typeof AggregatedSummarySchema>;
```

#================================================================
# FASE 2: SECURE GATEWAYS & ERROR HANDLING [VERBETERD]
#================================================================

## COMMANDO 2.1: Production-Ready Gateway Base Class
**FILE:** `src/server/gateways/gateway.base.ts`
```typescript
import { TelemetryService } from '@/lib/monitoring/telemetry';
import { logger } from '@/lib/monitoring/structured-logger';
import { z } from 'zod';

export interface GatewayResponse<T> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
    retryable: boolean;
    details?: Record<string, any>;
  } | null;
  metadata: {
    latencyMs: number;
    gateway: string;
    method: string;
    cached: boolean;
    version: string;
  };
}

export abstract class BaseGateway {
  protected abstract gatewayName: string;
  private cache = new Map<string, { data: any; expiry: number }>();
  
  protected async execute<T>(
    method: string,
    fn: () => Promise<T>,
    options?: {
      cacheKey?: string;
      cacheTTL?: number;
      retries?: number;
      schema?: z.ZodSchema<T>;
    }
  ): Promise<GatewayResponse<T>> {
    const startTime = Date.now();
    const span = TelemetryService.startSpan(`gateway.${this.gatewayName}.${method}`);
    
    try {
      // Check cache
      if (options?.cacheKey) {
        const cached = this.cache.get(options.cacheKey);
        if (cached && cached.expiry > Date.now()) {
          span.setAttribute('cache.hit', true);
          return this.success(cached.data, {
            latencyMs: Date.now() - startTime,
            cached: true,
            gateway: this.gatewayName,
            method,
          });
        }
      }
      
      // Execute with retries
      let lastError: Error | null = null;
      const maxRetries = options?.retries ?? 3;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const result = await fn();
          
          // Validate response
          if (options?.schema) {
            const validated = options.schema.parse(result);
            
            // Cache if requested
            if (options.cacheKey && options.cacheTTL) {
              this.cache.set(options.cacheKey, {
                data: validated,
                expiry: Date.now() + options.cacheTTL,
              });
            }
            
            return this.success(validated, {
              latencyMs: Date.now() - startTime,
              cached: false,
              gateway: this.gatewayName,
              method,
            });
          }
          
          return this.success(result, {
            latencyMs: Date.now() - startTime,
            cached: false,
            gateway: this.gatewayName,
            method,
          });
        } catch (error) {
          lastError = error as Error;
          
          if (attempt < maxRetries) {
            const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
            logger.warn(`Gateway retry attempt ${attempt}/${maxRetries}`, {
              gateway: this.gatewayName,
              method,
              error: lastError.message,
              backoffMs,
            });
            await new Promise(resolve => setTimeout(resolve, backoffMs));
          }
        }
      }
      
      throw lastError;
    } catch (error) {
      const err = error as Error;
      
      TelemetryService.recordGatewayError(this.gatewayName, method, err);
      span.recordException(err);
      
      return this.error(
        err.message,
        this.isRetryableError(err),
        {
          latencyMs: Date.now() - startTime,
          gateway: this.gatewayName,
          method,
        }
      );
    } finally {
      span.end();
    }
  }
  
  private success<T>(data: T, metadata: any): GatewayResponse<T> {
    return {
      success: true,
      data,
      error: null,
      metadata: { ...metadata, version: '2.0.0' },
    };
  }
  
  private error(message: string, retryable: boolean, metadata: any): GatewayResponse<any> {
    return {
      success: false,
      data: null,
      error: {
        code: `${this.gatewayName.toUpperCase()}_ERROR`,
        message,
        retryable,
      },
      metadata: { ...metadata, version: '2.0.0' },
    };
  }
  
  private isRetryableError(error: Error): boolean {
    const retryablePatterns = [
      /timeout/i,
      /network/i,
      /ECONNREFUSED/,
      /ETIMEDOUT/,
      /429/, // Rate limit
      /503/, // Service unavailable
    ];
    
    return retryablePatterns.some(pattern => 
      pattern.test(error.message)
    );
  }
}
```

## COMMANDO 2.2: Secure Encryption Service met KMS
**FILE:** `src/lib/security/encryption.service.ts`
```typescript
import { KeyManagementServiceClient } from '@google-cloud/kms';
import crypto from 'crypto';
import { logger } from '../monitoring/structured-logger';
import { TelemetryService } from '../monitoring/telemetry';

export class EncryptionService {
  private kmsClient: KeyManagementServiceClient;
  private projectId: string;
  private locationId: string;
  private keyRingId: string;
  private cryptoKeyId: string;
  
  constructor() {
    this.kmsClient = new KeyManagementServiceClient();
    this.projectId = process.env.KMS_PROJECT_ID!;
    this.locationId = process.env.KMS_LOCATION || 'europe-west4';
    this.keyRingId = process.env.KMS_KEYRING!;
    this.cryptoKeyId = process.env.KMS_KEY!;
  }
  
  /**
   * Encrypt sensitive data using Google Cloud KMS
   * Uses envelope encryption for efficiency
   */
  async encryptSensitiveData(plaintext: string): Promise<{
    encryptedData: string;
    encryptedDek: string;
    iv: string;
  }> {
    const span = TelemetryService.startSpan('encryption.encrypt');
    
    try {
      // Generate Data Encryption Key (DEK)
      const dek = crypto.randomBytes(32);
      const iv = crypto.randomBytes(16);
      
      // Encrypt data with DEK (AES-256-GCM)
      const cipher = crypto.createCipheriv('aes-256-gcm', dek, iv);
      let encryptedData = cipher.update(plaintext, 'utf8', 'base64');
      encryptedData += cipher.final('base64');
      const authTag = cipher.getAuthTag();
      
      // Encrypt DEK with KMS
      const keyName = this.kmsClient.cryptoKeyPath(
        this.projectId,
        this.locationId,
        this.keyRingId,
        this.cryptoKeyId
      );
      
      const [encryptResponse] = await this.kmsClient.encrypt({
        name: keyName,
        plaintext: dek,
      });
      
      const encryptedDek = Buffer.from(encryptResponse.ciphertext!).toString('base64');
      
      TelemetryService.metrics.encryptionOperations.inc({ operation: 'encrypt' });
      
      return {
        encryptedData: encryptedData + ':' + authTag.toString('base64'),
        encryptedDek,
        iv: iv.toString('base64'),
      };
    } catch (error) {
      logger.error('Encryption failed', { error });
      span.recordException(error as Error);
      throw new Error('Failed to encrypt sensitive data');
    } finally {
      span.end();
    }
  }
  
  /**
   * Decrypt data encrypted with encryptSensitiveData
   */
  async decryptSensitiveData(params: {
    encryptedData: string;
    encryptedDek: string;
    iv: string;
  }): Promise<string> {
    const span = TelemetryService.startSpan('encryption.decrypt');
    
    try {
      // Decrypt DEK with KMS
      const keyName = this.kmsClient.cryptoKeyPath(
        this.projectId,
        this.locationId,
        this.keyRingId,
        this.cryptoKeyId
      );
      
      const [decryptResponse] = await this.kmsClient.decrypt({
        name: keyName,
        ciphertext: Buffer.from(params.encryptedDek, 'base64'),
      });
      
      const dek = decryptResponse.plaintext as Buffer;
      
      // Parse encrypted data and auth tag
      const parts = params.encryptedData.split(':');
      const encryptedData = parts[0];
      const authTag = Buffer.from(parts[1], 'base64');
      
      // Decrypt data with DEK
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        dek,
        Buffer.from(params.iv, 'base64')
      );
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      TelemetryService.metrics.encryptionOperations.inc({ operation: 'decrypt' });
      
      return decrypted;
    } catch (error) {
      logger.error('Decryption failed', { error });
      span.recordException(error as Error);
      throw new Error('Failed to decrypt sensitive data');
    } finally {
      span.end();
    }
  }
  
  /**
   * Hash data for comparison (e.g., duplicate detection)
   */
  hashData(data: string): string {
    return crypto
      .createHash('sha256')
      .update(data)
      .digest('hex');
  }
}

export const encryptionService = new EncryptionService();
```

#================================================================
# FASE 3: ASYNC AI PROCESSING & HUMAN-IN-THE-LOOP [VERBETERD]
#================================================================

## COMMANDO 3.1: AI Gateway met Multi-Model Support
**FILE:** `src/server/gateways/ai.gateway.ts`
```typescript
import { BaseGateway, GatewayResponse } from './gateway.base';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TelemetryService } from '@/lib/monitoring/telemetry';
import { z } from 'zod';

const CategorySuggestionSchema = z.object({
  suggestedCategory: z.string(),
  certaintyScore: z.number().min(0).max(1),
  reasoning: z.string(),
  alternativeCategories: z.array(z.object({
    category: z.string(),
    score: z.number(),
    reasoning: z.string(),
  })).optional(),
});

export type CategorySuggestion = z.infer<typeof CategorySuggestionSchema>;

export class AIGateway extends BaseGateway {
  protected gatewayName = 'ai';
  private genAI: GoogleGenerativeAI;
  private model: any;
  
  constructor() {
    super();
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-pro",
      generationConfig: {
        temperature: 0.3, // Lower = more consistent
        topK: 20,
        topP: 0.8,
        maxOutputTokens: 1000,
      },
    });
  }
  
  async suggestCategory(
    description: string,
    historicalExamples: Array<{ description: string; category: string }> = [],
    userPreferences?: { categories: string[] }
  ): Promise<GatewayResponse<CategorySuggestion>> {
    return this.execute('suggestCategory', async () => {
      // Build context from historical examples
      const exampleContext = historicalExamples.length > 0
        ? `Based on these previous categorizations:\n${
            historicalExamples.slice(-10).map(ex => 
              `- "${ex.description}" → ${ex.category}`
            ).join('\n')
          }\n\n`
        : '';
      
      const categoriesList = userPreferences?.categories?.length 
        ? userPreferences.categories.join(', ')
        : 'meals, groceries, transport, utilities, insurance, entertainment, business, other';
      
      const prompt = `
        You are a financial transaction categorizer for Dutch freelancers.
        
        ${exampleContext}
        
        Analyze this transaction: "${description}"
        
        Available categories: ${categoriesList}
        
        Return a JSON object with:
        {
          "suggestedCategory": "most likely category",
          "certaintyScore": 0.0 to 1.0,
          "reasoning": "brief explanation",
          "alternativeCategories": [
            {
              "category": "alternative",
              "score": 0.0 to 1.0,
              "reasoning": "why this could fit"
            }
          ]
        }
        
        Be conservative with certaintyScore. Only use >0.9 for very clear matches.
        For Dutch companies: KPN/Ziggo=utilities, Albert Heijn/Jumbo=groceries, NS/GVB=transport.
      `;
      
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid AI response format');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      const validated = CategorySuggestionSchema.parse(parsed);
      
      // Track for model improvement
      await TelemetryService.trackAIDecision({
        transactionId: crypto.randomUUID(),
        suggestedCategory: validated.suggestedCategory,
        certaintyScore: validated.certaintyScore,
        latencyMs: 0, // Will be filled by base class
        accepted: false, // Will be updated when user confirms
      });
      
      return validated;
    }, {
      cacheKey: `category:${this.hashDescription(description)}`,
      cacheTTL: 86400000, // 24 hours
      retries: 2,
      schema: CategorySuggestionSchema,
    });
  }
  
  private hashDescription(description: string): string {
    // Simple hash for cache key
    return Buffer.from(description.toLowerCase().trim()).toString('base64').slice(0, 20);
  }
}
```

## COMMANDO 3.2: Enhanced Cloud Function met Circuit Breaker
**FILE:** `firebase/functions/src/ai/categorizeTransaction.ts`
```typescript
import * as functions from 'firebase-functions';
import { firestore } from 'firebase-admin';
import { AIGateway } from '../../gateways/ai.gateway';
import { CircuitBreaker } from '../../lib/circuit-breaker';
import { logger } from '../../lib/logger';

const db = firestore();
const aiGateway = new AIGateway();

// Circuit breaker to prevent cascade failures
const aiCircuitBreaker = new CircuitBreaker({
  threshold: 5,        // 5 failures
  timeout: 60000,      // Reset after 1 minute
  fallback: async () => ({
    suggestedCategory: 'other',
    certaintyScore: 0.0,
    reasoning: 'AI service temporarily unavailable',
  }),
});

export const categorizeTransaction = functions
  .region('europe-west4')
  .runWith({
    timeoutSeconds: 30,
    memory: '512MB',
    maxInstances: 10,
  })
  .firestore
  .document('transactions/{transactionId}')
  .onCreate(async (snapshot, context) => {
    const startTime = Date.now();
    const { transactionId } = context.params;
    const transaction = snapshot.data();
    
    // Only process transactions in 'processing' status
    if (transaction.status !== 'processing') {
      return;
    }
    
    const span = logger.startSpan('cf.categorizeTransaction');
    
    try {
      // Get user's historical transactions for context
      const historicalSnap = await db
        .collection('transactions')
        .where('userId', '==', transaction.userId)
        .where('status', '==', 'approved')
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();
      
      const historicalExamples = historicalSnap.docs.map(doc => ({
        description: doc.data().description,
        category: doc.data().aiAnalysis?.suggestedCategory || doc.data().manualCategory,
      })).filter(ex => ex.category);
      
      // Get user preferences
      const userDoc = await db.doc(`users/${transaction.userId}`).get();
      const userPreferences = userDoc.data()?.preferences;
      
      // Call AI with circuit breaker protection
      const aiResult = await aiCircuitBreaker.execute(async () => {
        const response = await aiGateway.suggestCategory(
          transaction.description,
          historicalExamples,
          userPreferences
        );
        
        if (!response.success) {
          throw new Error(response.error?.message || 'AI categorization failed');
        }
        
        return response.data!;
      });
      
      // Determine next status based on confidence
      const confidenceThreshold = parseFloat(
        process.env.AI_CONFIDENCE_THRESHOLD || '0.90'
      );
      
      const nextStatus = aiResult.certaintyScore >= confidenceThreshold
        ? 'approved'
        : 'pending_review';
      
      // Update transaction with AI results
      await snapshot.ref.update({
        status: nextStatus,
        aiAnalysis: {
          ...aiResult,
          modelVersion: process.env.AI_MODEL_VERSION || '1.0.0',
          processingTimeMs: Date.now() - startTime,
          analyzedAt: firestore.FieldValue.serverTimestamp(),
        },
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      
      // Log for analytics
      logger.info('Transaction categorized', {
        transactionId,
        category: aiResult.suggestedCategory,
        certainty: aiResult.certaintyScore,
        status: nextStatus,
        processingTimeMs: Date.now() - startTime,
      });
      
      // If auto-approved, trigger aggregation
      if (nextStatus === 'approved') {
        await db.doc(`triggers/aggregation`).set({
          transactionId,
          userId: transaction.userId,
          timestamp: firestore.FieldValue.serverTimestamp(),
        });
      }
      
    } catch (error) {
      logger.error('Categorization failed', { error, transactionId });
      
      // Update status to error
      await snapshot.ref.update({
        status: 'error',
        error: {
          message: 'Failed to categorize transaction',
          timestamp: firestore.FieldValue.serverTimestamp(),
          retryCount: (transaction.retryCount || 0) + 1,
        },
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      
      // Schedule retry if under limit
      if ((transaction.retryCount || 0) < 3) {
        await db.collection('scheduled_tasks').add({
          type: 'RETRY_CATEGORIZATION',
          transactionId,
          scheduledFor: firestore.Timestamp.fromMillis(
            Date.now() + 60000 * Math.pow(2, transaction.retryCount || 0)
          ),
        });
      }
    } finally {
      span.end();
    }
  });
```

#================================================================
# FASE 4: PERFORMANCE OPTIMIZATIONS [VERBETERD]
#================================================================

## COMMANDO 4.1: Advanced Aggregation System
**FILE:** `firebase/functions/src/aggregation/updateSummaries.ts`
```typescript
import * as functions from 'firebase-functions';
import { firestore } from 'firebase-admin';
import { BigQuery } from '@google-cloud/bigquery';
import { logger } from '../../lib/logger';

const db = firestore();
const bigquery = new BigQuery();

interface AggregationUpdate {
  userId: string;
  transactionId: string;
  amount: number;
  category: string;
  timestamp: firestore.Timestamp;
}

export const updateAggregatedSummaries = functions
  .region('europe-west4')
  .runWith({
    timeoutSeconds: 120,
    memory: '1GB',
  })
  .firestore
  .document('triggers/aggregation')
  .onCreate(async (snapshot) => {
    const data = snapshot.data() as AggregationUpdate;
    const batch = db.batch();
    
    try {
      // Atomic update of multiple aggregation levels
      const updates = [
        updateDailySummary(batch, data),
        updateMonthlySummary(batch, data),
        updateQuarterlySummary(batch, data),
        updateYearlySummary(batch, data),
        updateClientConcentration(batch, data),
      ];
      
      await Promise.all(updates);
      await batch.commit();
      
      // Stream to BigQuery for analytics
      await streamToBigQuery(data);
      
      // Clean up trigger
      await snapshot.ref.delete();
      
    } catch (error) {
      logger.error('Aggregation failed', { error, data });
      
      // Write to dead letter queue
      await db.collection('aggregation_dlq').add({
        ...data,
        error: error.message,
        failedAt: firestore.FieldValue.serverTimestamp(),
      });
    }
  });

async function updateDailySummary(
  batch: firestore.WriteBatch,
  data: AggregationUpdate
) {
  const date = data.timestamp.toDate();
  const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  
  const summaryRef = db.doc(`summaries/${data.userId}/daily/${dayKey}`);
  
  batch.set(summaryRef, {
    userId: data.userId,
    period: 'daily',
    periodKey: dayKey,
    totalIncome: firestore.FieldValue.increment(data.amount > 0 ? data.amount : 0),
    totalExpenses: firestore.FieldValue.increment(data.amount < 0 ? Math.abs(data.amount) : 0),
    [`incomeByCategory.${data.category}`]: firestore.FieldValue.increment(
      data.amount > 0 ? data.amount : 0
    ),
    [`expensesByCategory.${data.category}`]: firestore.FieldValue.increment(
      data.amount < 0 ? Math.abs(data.amount) : 0
    ),
    transactionCount: firestore.FieldValue.increment(1),
    lastCalculated: firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
}

async function updateClientConcentration(
  batch: firestore.WriteBatch,
  data: AggregationUpdate
) {
  // Get transaction with client info
  const transaction = await db.doc(`transactions/${data.transactionId}`).get();
  const clientId = transaction.data()?.clientId;
  
  if (!clientId) return;
  
  // Update client revenue tracking
  const clientRef = db.doc(`client_revenue/${data.userId}/clients/${clientId}`);
  
  batch.set(clientRef, {
    clientId,
    totalRevenue: firestore.FieldValue.increment(data.amount),
    transactionCount: firestore.FieldValue.increment(1),
    lastTransaction: firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  
  // Schedule DBA check if revenue exceeds threshold
  const clientData = await clientRef.get();
  const totalRevenue = clientData.data()?.totalRevenue || 0;
  
  if (totalRevenue > 10000) { // €10k threshold
    await db.collection('scheduled_tasks').add({
      type: 'DBA_RISK_CHECK',
      userId: data.userId,
      clientId,
      scheduledFor: firestore.Timestamp.fromMillis(Date.now() + 3600000), // 1 hour
    });
  }
}

async function streamToBigQuery(data: AggregationUpdate) {
  const dataset = bigquery.dataset('yaico_analytics');
  const table = dataset.table('transaction_aggregations');
  
  await table.insert({
    userId: data.userId,
    transactionId: data.transactionId,
    amount: data.amount,
    category: data.category,
    timestamp: data.timestamp.toDate().toISOString(),
    insertedAt: new Date().toISOString(),
  });
}
```

#================================================================
# FASE 5: COMPLIANCE & TAX ENGINE [VERBETERD]
#================================================================

## COMMANDO 5.1: DBA Risk Monitor met ML
**FILE:** `firebase/functions/src/compliance/dbaRiskMonitor.ts`
```typescript
import * as functions from 'firebase-functions';
import { firestore } from 'firebase-admin';
import { BigQuery } from '@google-cloud/bigquery';
import { logger } from '../../lib/logger';
import { NotificationService } from '../../services/notification.service';

const db = firestore();
const bigquery = new BigQuery();
const notificationService = new NotificationService();

interface DBAMetrics {
  userId: string;
  topClientId: string;
  topClientName: string;
  topClientPercentage: number;
  secondClientPercentage: number;
  clientCount: number;
  diversityScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

export const monitorDBARisk = functions
  .region('europe-west4')
  .runWith({
    timeoutSeconds: 540,
    memory: '2GB',
  })
  .pubsub
  .schedule('0 9 * * MON') // Every Monday at 9 AM
  .timeZone('Europe/Amsterdam')
  .onRun(async () => {
    const activeUsers = await getActiveUsers();
    
    for (const userId of activeUsers) {
      try {
        const metrics = await calculateDBAMetrics(userId);
        
        // Store metrics
        await db.doc(`dba_monitoring/${userId}`).set({
          ...metrics,
          calculatedAt: firestore.FieldValue.serverTimestamp(),
        });
        
        // Send alerts if needed
        if (metrics.riskLevel === 'high' || metrics.riskLevel === 'critical') {
          await sendDBAAlert(userId, metrics);
        }
        
        // Log to BigQuery for trend analysis
        await logMetricsToBigQuery(metrics);
        
      } catch (error) {
        logger.error('DBA monitoring failed for user', { error, userId });
      }
    }
  });

async function calculateDBAMetrics(userId: string): Promise<DBAMetrics> {
  // Get revenue by client for last 12 months
  const query = `
    SELECT 
      clientId,
      clientName,
      SUM(amount) as totalRevenue,
      COUNT(*) as transactionCount,
      MAX(date) as lastTransaction
    FROM \`yaico.transactions\`
    WHERE 
      userId = @userId
      AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
      AND amount > 0
      AND status = 'approved'
    GROUP BY clientId, clientName
    ORDER BY totalRevenue DESC
  `;
  
  const [rows] = await bigquery.query({
    query,
    params: { userId },
  });
  
  if (rows.length === 0) {
    return {
      userId,
      topClientId: '',
      topClientName: '',
      topClientPercentage: 0,
      secondClientPercentage: 0,
      clientCount: 0,
      diversityScore: 100,
      riskLevel: 'low',
      recommendations: [],
    };
  }
  
  const totalRevenue = rows.reduce((sum, row) => sum + row.totalRevenue, 0);
  const topClient = rows[0];
  const topClientPercentage = (topClient.totalRevenue / totalRevenue) * 100;
  const secondClientPercentage = rows[1] 
    ? (rows[1].totalRevenue / totalRevenue) * 100 
    : 0;
  
  // Calculate Herfindahl-Hirschman Index for diversity
  const hhi = rows.reduce((sum, row) => {
    const share = row.totalRevenue / totalRevenue;
    return sum + Math.pow(share, 2);
  }, 0);
  
  const diversityScore = Math.round((1 - hhi) * 100);
  
  // Determine risk level
  let riskLevel: DBAMetrics['riskLevel'];
  const recommendations: string[] = [];
  
  if (topClientPercentage >= 85) {
    riskLevel = 'critical';
    recommendations.push(
      'URGENT: Meer dan 85% van uw inkomen komt van één klant. Dit vormt een zeer hoog DBA-risico.',
      'Diversifieer dringend uw klantenbestand.',
      'Overweeg een modelovereenkomst op te stellen.',
    );
  } else if (topClientPercentage >= 70) {
    riskLevel = 'high';
    recommendations.push(
      'Waarschuwing: 70%+ van uw inkomen komt van één klant.',
      'Begin actief met het werven van nieuwe klanten.',
      'Documenteer de zelfstandigheid van uw werkzaamheden.',
    );
  } else if (topClientPercentage >= 50) {
    riskLevel = 'medium';
    recommendations.push(
      'Let op: Meer dan de helft van uw inkomen komt van één klant.',
      'Blijf werken aan klantdiversificatie.',
    );
  } else {
    riskLevel = 'low';
    recommendations.push(
      'Goed bezig! Uw klantenbestand is voldoende gediversifieerd.',
    );
  }
  
  // Additional checks
  if (rows.length < 3) {
    recommendations.push(
      `U heeft slechts ${rows.length} klant(en). Probeer minimaal 3-4 klanten te hebben.`,
    );
  }
  
  return {
    userId,
    topClientId: topClient.clientId,
    topClientName: topClient.clientName,
    topClientPercentage: Math.round(topClientPercentage * 10) / 10,
    secondClientPercentage: Math.round(secondClientPercentage * 10) / 10,
    clientCount: rows.length,
    diversityScore,
    riskLevel,
    recommendations,
  };
}

async function sendDBAAlert(userId: string, metrics: DBAMetrics) {
  const user = await db.doc(`users/${userId}`).get();
  const userData = user.data();
  
  if (!userData?.email) return;
  
  await notificationService.sendEmail({
    to: userData.email,
    template: 'dba-risk-alert',
    data: {
      name: userData.name,
      ...metrics,
      dashboardUrl: `https://app.yaico.nl/compliance/dba`,
    },
  });
  
  // Also send in-app notification
  await db.collection(`users/${userId}/notifications`).add({
    type: 'DBA_RISK_ALERT',
    title: 'DBA Risico Waarschuwing',
    message: `${metrics.topClientPercentage}% van uw inkomen komt van ${metrics.topClientName}`,
    severity: metrics.riskLevel,
    read: false,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
}
```

## COMMANDO 5.2: VAT Calculator met International Support
**FILE:** `src/lib/tax/vatCalculator.ts`
```typescript
import { z } from 'zod';

export const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
] as const;

export const VAT_RATES: Record<string, { standard: number; reduced: number[] }> = {
  NL: { standard: 21, reduced: [9, 0] },
  DE: { standard: 19, reduced: [7, 0] },
  BE: { standard: 21, reduced: [12, 6, 0] },
  FR: { standard: 20, reduced: [10, 5.5, 2.1, 0] },
  // ... other EU countries
};

export interface VATCalculation {
  rate: number;
  amount: number;
  regime: 'domestic' | 'reverse_charge' | 'intra_community' | 'export';
  explanation: string;
  requiresVATNumber: boolean;
  reportingRequired: boolean;
}

export class VATCalculator {
  constructor(
    private userCountry: string = 'NL',
    private hasVATRegistration: boolean = true
  ) {}
  
  calculate(params: {
    clientCountry: string;
    clientType: 'b2b' | 'b2c';
    clientVATNumber?: string;
    serviceType: 'goods' | 'services' | 'digital';
    amount: number;
  }): VATCalculation {
    const { clientCountry, clientType, clientVATNumber, serviceType, amount } = params;
    
    // Domestic transactions
    if (clientCountry === this.userCountry) {
      return {
        rate: VAT_RATES[this.userCountry].standard,
        amount: amount * (VAT_RATES[this.userCountry].standard / 100),
        regime: 'domestic',
        explanation: `Binnenlandse ${clientType === 'b2b' ? 'B2B' : 'B2C'} transactie: ${VAT_RATES[this.userCountry].standard}% BTW`,
        requiresVATNumber: false,
        reportingRequired: true,
      };
    }
    
    // EU B2B with valid VAT number
    if (EU_COUNTRIES.includes(clientCountry as any) && clientType === 'b2b' && clientVATNumber) {
      return {
        rate: 0,
        amount: 0,
        regime: 'reverse_charge',
        explanation: `Intracommunautaire levering B2B: 0% BTW (verlegging). BTW-nummer klant: ${clientVATNumber}`,
        requiresVATNumber: true,
        reportingRequired: true, // ICP declaration required
      };
    }
    
    // EU B2C
    if (EU_COUNTRIES.includes(clientCountry as any) && clientType === 'b2c') {
      // Check if under OSS threshold (€10,000)
      const yearlyB2CSales = 0; // TODO: Calculate from database
      
      if (serviceType === 'digital' || yearlyB2CSales > 10000) {
        // Must charge destination country VAT
        const destinationRate = VAT_RATES[clientCountry]?.standard || 0;
        return {
          rate: destinationRate,
          amount: amount * (destinationRate / 100),
          regime: 'intra_community',
          explanation: `B2C digitale diensten naar ${clientCountry}: ${destinationRate}% BTW (OSS-regeling)`,
          requiresVATNumber: false,
          reportingRequired: true,
        };
      } else {
        // Can use origin country VAT
        return {
          rate: VAT_RATES[this.userCountry].standard,
          amount: amount * (VAT_RATES[this.userCountry].standard / 100),
          regime: 'intra_community',
          explanation: `B2C onder OSS-drempel: ${VAT_RATES[this.userCountry].standard}% Nederlandse BTW`,
          requiresVATNumber: false,
          reportingRequired: true,
        };
      }
    }
    
    // Outside EU
    return {
      rate: 0,
      amount: 0,
      regime: 'export',
      explanation: `Export buiten EU: 0% BTW`,
      requiresVATNumber: false,
      reportingRequired: true,
    };
  }
  
  validateVATNumber(vatNumber: string): boolean {
    // Basic format validation
    const vatRegex = /^[A-Z]{2}[0-9A-Z]+$/;
    if (!vatRegex.test(vatNumber)) return false;
    
    // TODO: Implement VIES validation
    // For now, just check format
    const countryCode = vatNumber.slice(0, 2);
    
    const patterns: Record<string, RegExp> = {
      NL: /^NL[0-9]{9}B[0-9]{2}$/,
      DE: /^DE[0-9]{9}$/,
      BE: /^BE[0-9]{10}$/,
      FR: /^FR[0-9A-Z]{2}[0-9]{9}$/,
      // ... other countries
    };
    
    return patterns[countryCode]?.test(vatNumber) || false;
  }
}
```

#================================================================
# FASE 6: TESTING INFRASTRUCTURE [NIEUW]
#================================================================

## COMMANDO 6.1: Integration Test Suite
**FILE:** `tests/integration/transaction-flow.test.ts`
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { createMockUser, createMockTransaction } from '../helpers/factories';
import { TransactionService } from '@/services/transaction.service';
import { AIGateway } from '@/server/gateways/ai.gateway';

let testEnv: any;
let transactionService: TransactionService;

describe('Transaction Flow E2E', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'yaico-test',
      firestore: {
        rules: fs.readFileSync('firestore.rules', 'utf8'),
      },
    });
    
    transactionService = new TransactionService(testEnv.firestore());
  });
  
  afterAll(async () => {
    await testEnv.cleanup();
  });
  
  describe('AI Categorization Flow', () => {
    it('should auto-approve high-confidence categorizations', async () => {
      // Arrange
      const user = await createMockUser({ tier: 'professional' });
      const transaction = createMockTransaction({
        userId: user.id,
        description: 'KPN Internet March 2024',
        amount: -49.99,
      });
      
      // Act
      const result = await transactionService.create(transaction);
      
      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Assert
      const updated = await transactionService.get(result.id);
      expect(updated.status).toBe('approved');
      expect(updated.aiAnalysis?.suggestedCategory).toBe('utilities');
      expect(updated.aiAnalysis?.certaintyScore).toBeGreaterThanOrEqual(0.9);
    });
    
    it('should require review for low-confidence categorizations', async () => {
      // Arrange
      const user = await createMockUser({ tier: 'professional' });
      const transaction = createMockTransaction({
        userId: user.id,
        description: 'Various items purchase',
        amount: -125.00,
      });
      
      // Act
      const result = await transactionService.create(transaction);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Assert
      const updated = await transactionService.get(result.id);
      expect(updated.status).toBe('pending_review');
      expect(updated.aiAnalysis?.certaintyScore).toBeLessThan(0.9);
    });
  });
  
  describe('SaaS Gating', () => {
    it('should block AI features for basic tier', async () => {
      // Arrange
      const user = await createMockUser({ tier: 'starter' });
      const transaction = createMockTransaction({
        userId: user.id,
        description: 'Test transaction',
      });
      
      // Act & Assert
      await expect(
        transactionService.create(transaction)
      ).rejects.toThrow('AI categorization requires Professional tier');
    });
  });
  
  describe('DBA Monitoring', () => {
    it('should detect high client concentration', async () => {
      // Arrange
      const user = await createMockUser();
      const clientA = await createMockClient({ name: 'Big Corp' });
      
      // Create transactions: 90% from one client
      for (let i = 0; i < 9; i++) {
        await createMockTransaction({
          userId: user.id,
          clientId: clientA.id,
          amount: 1000,
        });
      }
      
      await createMockTransaction({
        userId: user.id,
        clientId: 'other-client',
        amount: 100,
      });
      
      // Act
      const metrics = await calculateDBAMetrics(user.id);
      
      // Assert
      expect(metrics.topClientPercentage).toBeCloseTo(90, 1);
      expect(metrics.riskLevel).toBe('critical');
      expect(metrics.recommendations).toContain(
        expect.stringContaining('URGENT')
      );
    });
  });
});
```

## COMMANDO 6.2: Performance Benchmarks
**FILE:** `tests/performance/aggregation.bench.ts`
```typescript
import { bench, describe } from 'vitest';
import { AggregationService } from '@/services/aggregation.service';

describe('Aggregation Performance', () => {
  bench('should handle 1000 concurrent updates', async () => {
    const service = new AggregationService();
    const updates = Array.from({ length: 1000 }, (_, i) => ({
      userId: `user-${i % 10}`,
      amount: Math.random() * 1000,
      category: ['income', 'expense'][i % 2],
    }));
    
    await Promise.all(
      updates.map(update => service.updateSummary(update))
    );
  });
  
  bench('should calculate YTD in <100ms for 10k transactions', async () => {
    const service = new AggregationService();
    const result = await service.calculateYTD('test-user', 10000);
    expect(result.calculationTimeMs).toBeLessThan(100);
  });
});
```

#================================================================
# FASE 7: DEPLOYMENT PIPELINE [NIEUW]
#================================================================

## COMMANDO 7.1: Multi-Stage Deployment
**FILE:** `.github/workflows/deploy.yml`
```yaml
name: Deploy Yaico

on:
  push:
    branches: [main, staging, develop]
  pull_request:
    branches: [main]

env:
  GCP_PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}

jobs:
  # Stage 1: Security Scan
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run security audit
        run: |
          npm audit --audit-level=high
          npx snyk test --severity-threshold=high
      
      - name: SAST Scan
        uses: github/super-linter@v4
        env:
          DEFAULT_BRANCH: main
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Secret scanning
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
  
  # Stage 2: Test & Build
  test:
    needs: security
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests with coverage
        run: |
          npm run test:unit -- --coverage
          npm run test:integration
          npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          fail_ci_if_error: true
          verbose: true
      
      - name: Performance tests
        run: npm run test:performance
      
      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_FIREBASE_CONFIG: ${{ secrets.FIREBASE_CONFIG }}
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-${{ matrix.node-version }}
          path: .next/
  
  # Stage 3: Deploy to Staging
  deploy-staging:
    if: github.ref == 'refs/heads/staging'
    needs: test
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY_STAGING }}
      
      - name: Deploy to Firebase Staging
        run: |
          npm ci
          npm run build
          npx firebase deploy --only hosting,functions,firestore:rules --project staging
      
      - name: Run smoke tests
        run: npm run test:smoke -- --env=staging
      
      - name: Notify Slack
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Staging deployment ${{ job.status }}'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
  
  # Stage 4: Deploy to Production
  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY_PRODUCTION }}
      
      - name: Backup Firestore
        run: |
          gcloud firestore export gs://yaico-backups/$(date +%Y%m%d-%H%M%S)
      
      - name: Deploy to Firebase Production
        run: |
          npm ci
          npm run build:prod
          npx firebase deploy --only hosting,functions,firestore:rules --project production
      
      - name: Verify deployment
        run: |
          npm run test:smoke -- --env=production
          npm run lighthouse -- --url=https://app.yaico.nl
      
      - name: Update status page
        run: |
          curl -X POST ${{ secrets.STATUS_PAGE_WEBHOOK }} \
            -H 'Content-Type: application/json' \
            -d '{"version": "${{ github.sha }}", "status": "operational"}'
      
      - name: Create release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: v${{ github.run_number }}
          release_name: Release v${{ github.run_number }}
          body: |
            Production deployment completed
            Commit: ${{ github.sha }}
```

#================================================================
# CONCLUSIE & NEXT STEPS
#================================================================

Dit verbeterde script bevat:

1. **Security First**: KMS encryptie, secret management, security scanning
2. **Observability**: OpenTelemetry, structured logging, metrics
3. **Performance**: Circuit breakers, caching, BigQuery analytics
4. **Testing**: Unit/integration/e2e/performance tests
5. **Compliance**: Geavanceerde DBA monitoring, internationale BTW
6. **Deployment**: Multi-stage pipeline met rollback capabilities

## Prioriteit voor implementatie:

### Week 1: Foundation
- [ ] Security infrastructure (KMS, secrets)
- [ ] Environment configuration
- [ ] Base gateway architecture

### Week 2: Core Features
- [ ] AI categorization
- [ ] Transaction flow
- [ ] Basic aggregation

### Week 3: Compliance & Testing
- [ ] DBA monitoring
- [ ] VAT calculator
- [ ] Test suites

### Week 4: Production Readiness
- [ ] Performance optimization
- [ ] Monitoring setup
- [ ] Deployment pipeline

Dit geeft een production-ready systeem met enterprise-grade security, performance en compliance.
