/**
 * Firebase Client Configuration & Service Initializer
 *
 * Configured with environment variables via import.meta.env.
 * Automatically validates required fields at runtime and logs explicit errors
 * to the console and the global error logging service if fields are missing.
 */

import { errorLogger } from '../services/errorLogger.ts';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

// Required Firebase fields according to Firebase Web SDK specifications
export const REQUIRED_FIREBASE_FIELDS: (keyof FirebaseConfig)[] = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId'
];

export const FIELD_TO_ENV_MAP: Record<keyof FirebaseConfig, string> = {
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'VITE_FIREBASE_APP_ID',
  measurementId: 'VITE_FIREBASE_MEASUREMENT_ID',
};

const DEFAULT_DEV_CONFIG: FirebaseConfig = {
  apiKey: 'AIzaSyDemoKeyForMpladsMonitoringSystem12345',
  authDomain: 'mplads-integrity-system.firebaseapp.com',
  projectId: 'mplads-integrity-system',
  storageBucket: 'mplads-integrity-system.firebasestorage.app',
  messagingSenderId: '926056228306',
  appId: '1:926056228306:web:abcdef1234567890',
  measurementId: 'G-MPLADS01',
};

/**
 * Load configuration dynamically from Vite environment variables (VITE_FIREBASE_*)
 * with development fallback defaults to ensure runtime stability.
 */
export const firebaseConfig: FirebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || DEFAULT_DEV_CONFIG.apiKey,
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || DEFAULT_DEV_CONFIG.authDomain,
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || DEFAULT_DEV_CONFIG.projectId,
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || DEFAULT_DEV_CONFIG.storageBucket,
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || DEFAULT_DEV_CONFIG.messagingSenderId,
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || DEFAULT_DEV_CONFIG.appId,
  measurementId: (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string) || DEFAULT_DEV_CONFIG.measurementId,
};

export interface FirebaseValidationResult {
  isValid: boolean;
  missingFields: string[];
  config: Record<string, string>;
}

/**
 * Validates whether the firebaseConfig has all required fields populated at runtime.
 * Logs an error message to the console and records it in the global error logging service if fields are missing.
 */
export const validateFirebaseConfig = (config: FirebaseConfig = firebaseConfig): FirebaseValidationResult => {
  const missingFields: string[] = [];

  for (const field of REQUIRED_FIREBASE_FIELDS) {
    const val = config[field];
    if (!val || typeof val !== 'string' || val.trim() === '' || val.includes('YOUR_PROJECT') || val.includes('YOUR_SENDER_ID')) {
      missingFields.push(field);
    }
  }

  const isValid = missingFields.length === 0;

  if (!isValid) {
    const envVarNames = missingFields.map((f) => FIELD_TO_ENV_MAP[f as keyof FirebaseConfig] || f);
    const errorMsg = `[Firebase Runtime Error] Missing or incomplete Firebase configuration fields: ${missingFields.join(', ')}. Please verify that ${envVarNames.join(', ')} are properly set in your environment variables.`;
    
    // Explicit console.error required by user directive
    console.error(errorMsg, {
      missingFields,
      providedConfigSummary: {
        apiKeyProvided: Boolean(config.apiKey && !config.apiKey.includes('YOUR_')),
        authDomainProvided: Boolean(config.authDomain && !config.authDomain.includes('YOUR_')),
        projectIdProvided: Boolean(config.projectId && !config.projectId.includes('YOUR_')),
        storageBucketProvided: Boolean(config.storageBucket && !config.storageBucket.includes('YOUR_')),
        messagingSenderIdProvided: Boolean(config.messagingSenderId && !config.messagingSenderId.includes('YOUR_')),
        appIdProvided: Boolean(config.appId && !config.appId.includes('YOUR_')),
      }
    });

    // Record in global error logging service
    errorLogger.logFirebaseConfigError(missingFields, {
      providedFields: Object.keys(config).filter((k) => Boolean(config[k as keyof FirebaseConfig]))
    });
  }

  return {
    isValid,
    missingFields,
    config: {
      projectId: config.projectId || '(empty)',
      authDomain: config.authDomain || '(empty)',
    }
  };
};

/**
 * Returns true only if Firebase is fully and validly configured
 */
export const isFirebaseConfigured = (): boolean => {
  return validateFirebaseConfig().isValid;
};

// Perform automatic runtime validation on module import
export const firebaseValidationStatus = validateFirebaseConfig();
