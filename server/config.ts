/**
 * MPLADS Enterprise System Configuration & Feature Flags
 */

export interface SystemFeatureFlags {
  enableAiAssistant: boolean;
  enableStrictAbac: boolean;
  enableUnifiedIntegrity: boolean;
  enableRiskEngineV2: boolean;
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'mplads-enterprise-super-secret-key-256bit-entropy',
  tokenExpiryHours: 8,
  dbPath: process.env.DB_PATH || './data/mplads_store.json',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  featureFlags: {
    enableAiAssistant: process.env.FEATURE_AI_ASSISTANT !== 'false',
    enableStrictAbac: process.env.FEATURE_STRICT_ABAC !== 'false',
    enableUnifiedIntegrity: process.env.FEATURE_UNIFIED_INTEGRITY !== 'false',
    enableRiskEngineV2: process.env.FEATURE_RISK_ENGINE_V2 !== 'false'
  } as SystemFeatureFlags
};
