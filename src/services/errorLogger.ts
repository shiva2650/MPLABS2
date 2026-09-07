/**
 * Global Error Logging Service
 * 
 * Provides centralized error interception, early initialization failure detection,
 * Firebase configuration auditing, and diagnostics tracking across the application life-cycle.
 */

export type ErrorType = 'init' | 'runtime' | 'network' | 'firebase' | 'unhandled';

export interface LoggedError {
  id: string;
  timestamp: string;
  type: ErrorType;
  message: string;
  phase?: string;
  stack?: string;
  metadata?: Record<string, any>;
}

type ErrorListener = (error: LoggedError) => void;

class ErrorLoggingService {
  private errors: LoggedError[] = [];
  private listeners: Set<ErrorListener> = new Set();
  private isInitialized = false;
  private currentInitPhase: string = 'boot';

  constructor() {
    this.setupGlobalHandlers();
  }

  /**
   * Attach global window error and unhandled promise rejection listeners
   */
  public setupGlobalHandlers(): void {
    if (this.isInitialized || typeof window === 'undefined') {
      return;
    }

    // Capture unhandled JavaScript exceptions
    window.addEventListener('error', (event: ErrorEvent) => {
      this.logError('unhandled', event.message || 'Unknown window error', event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Capture unhandled asynchronous promise rejections
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message =
        reason instanceof Error
          ? reason.message
          : typeof reason === 'string'
          ? reason
          : 'Unhandled promise rejection';

      this.logError('unhandled', `Unhandled Promise Rejection: ${message}`, reason instanceof Error ? reason : undefined, {
        rawReason: typeof reason === 'object' ? JSON.stringify(reason) : String(reason),
      });
    });

    this.isInitialized = true;
  }

  /**
   * Set current initialization phase for contextual tracking
   */
  public setInitPhase(phase: string): void {
    this.currentInitPhase = phase;
  }

  /**
   * Record an early initialization failure in App.tsx or bootstrap
   */
  public logInitFailure(phase: string, error: unknown, metadata?: Record<string, any>): LoggedError {
    const errorObj = error instanceof Error ? error : new Error(String(error || 'Early initialization failed'));
    const logged = this.logError('init', `[Initialization Failure - ${phase}]: ${errorObj.message}`, errorObj, {
      ...metadata,
      phase,
    }, phase);

    console.error(
      `%c[ErrorLogger][InitFailure]%c (${phase}) ${errorObj.message}`,
      'color: #ffffff; background-color: #b91c1c; font-weight: bold; padding: 2px 6px; border-radius: 3px;',
      'color: #b91c1c; font-weight: bold;',
      {
        phase,
        error: errorObj,
        metadata,
      }
    );

    return logged;
  }

  /**
   * Record missing or invalid Firebase environment variables
   */
  public logFirebaseConfigError(missingFields: string[], details?: Record<string, any>): LoggedError {
    const message = `Firebase configuration error: Missing or unconfigured required fields: ${missingFields.join(', ')}`;
    const logged = this.logError('firebase', message, undefined, {
      missingFields,
      ...details,
    }, 'firebase_config_validation');

    console.error(
      `%c[ErrorLogger][FirebaseConfigError]%c ${message}`,
      'color: #ffffff; background-color: #ea580c; font-weight: bold; padding: 2px 6px; border-radius: 3px;',
      'color: #c2410c; font-weight: bold;',
      {
        missingFields,
        details,
        advice: 'Please ensure VITE_FIREBASE_* environment variables are defined in .env or your deployment environment.',
      }
    );

    return logged;
  }

  /**
   * Core logging method
   */
  public logError(
    type: ErrorType,
    message: string,
    error?: Error,
    metadata?: Record<string, any>,
    phase?: string
  ): LoggedError {
    const logged: LoggedError = {
      id: `err_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      timestamp: new Date().toISOString(),
      type,
      message,
      phase: phase || this.currentInitPhase,
      stack: error?.stack,
      metadata,
    };

    // Store in circular memory buffer (max 100 entries)
    this.errors.unshift(logged);
    if (this.errors.length > 100) {
      this.errors.pop();
    }

    // Notify active listeners (e.g., UI error badges, status bars)
    this.listeners.forEach((listener) => {
      try {
        listener(logged);
      } catch (err) {
        console.warn('Error in error logging listener:', err);
      }
    });

    return logged;
  }

  /**
   * Retrieve all recorded errors
   */
  public getErrors(): LoggedError[] {
    return [...this.errors];
  }

  /**
   * Retrieve errors filtered by type
   */
  public getErrorsByType(type: ErrorType): LoggedError[] {
    return this.errors.filter((e) => e.type === type);
  }

  /**
   * Check if any early initialization failures occurred
   */
  public hasInitFailures(): boolean {
    return this.errors.some((e) => e.type === 'init');
  }

  /**
   * Clear error buffer
   */
  public clearErrors(): void {
    this.errors = [];
  }

  /**
   * Subscribe to real-time logged error events
   */
  public subscribe(listener: ErrorListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

// Export singleton instance
export const errorLogger = new ErrorLoggingService();
