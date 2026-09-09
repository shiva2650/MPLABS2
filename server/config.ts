/**
 * MPLADS Enterprise System Configuration & Feature Flags
 */

export interface SystemFeatureFlags {
  enableAiAssistant: boolean;
  enableStrictAbac: boolean;
  enableUnifiedIntegrity: boolean;
  enableRiskEngineV2: boolean;
}

import crypto from 'crypto';

const environment = process.env.NODE_ENV || 'development';
const configuredJwtSecret = process.env.JWT_SECRET || '';
if (environment === 'production' && configuredJwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be set to a high-entropy value (at least 32 characters) in production.');
}

export const config = {
  env: environment,
  // Development gets an ephemeral secret; production requires an explicit secret.
  jwtSecret: configuredJwtSecret || crypto.randomBytes(32).toString('hex'),
  tokenExpiryHours: 8,
  port: Number(process.env.PORT || 3000),
  dbPath: process.env.DB_PATH || './data/mplads_store.json',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  featureFlags: {
    enableAiAssistant: process.env.FEATURE_AI_ASSISTANT !== 'false',
    enableStrictAbac: process.env.FEATURE_STRICT_ABAC !== 'false',
    enableUnifiedIntegrity: process.env.FEATURE_UNIFIED_INTEGRITY !== 'false',
    enableRiskEngineV2: process.env.FEATURE_RISK_ENGINE_V2 !== 'false'
  } as SystemFeatureFlags
};
