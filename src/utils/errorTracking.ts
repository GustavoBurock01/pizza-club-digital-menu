// Sistema centralizado de rastreamento de erros

interface ErrorLog {
  timestamp: string;
  type: 'chunk_load' | 'runtime' | 'network' | 'render';
  message: string;
  stack?: string;
  route?: string;
  userId?: string;
  userAgent?: string;
  context?: Record<string, any>;
}

class ErrorTracker {
  private static instance: ErrorTracker;
  private maxLogs = 50;
  private storageKey = 'app_error_logs';

  private constructor() {
    this.setupGlobalErrorHandlers();
  }

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  private setupGlobalErrorHandlers() {
    // Capturar erros não tratados
    window.addEventListener('error', (event) => {
      this.logError({
        type: 'runtime',
        message: event.message,
        stack: event.error?.stack,
        route: window.location.pathname,
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    // Capturar promessas rejeitadas
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        type: 'runtime',
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        route: window.location.pathname,
      });
    });
  }

  logError(error: Omit<ErrorLog, 'timestamp' | 'userAgent'>) {
    const errorLog: ErrorLog = {
      ...error,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };

    // Log no console em desenvolvimento
    if (import.meta.env.DEV) {
      console.error('[ErrorTracker]', errorLog);
    }

    // Persistir no localStorage
    this.persistError(errorLog);

    // Enviar para analytics (se configurado)
    this.sendToAnalytics(errorLog);
  }

  private persistError(errorLog: ErrorLog) {
    try {
      const logs = this.getLogs();
      logs.unshift(errorLog);
      
      // Manter apenas os últimos N logs
      const trimmedLogs = logs.slice(0, this.maxLogs);
      
      localStorage.setItem(this.storageKey, JSON.stringify(trimmedLogs));
    } catch (e) {
      console.warn('Failed to persist error log:', e);
    }
  }

  private sendToAnalytics(errorLog: ErrorLog) {
    // Integração com sistema de analytics (se existir)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: errorLog.message,
        fatal: errorLog.type === 'chunk_load',
      });
    }
  }

  getLogs(): ErrorLog[] {
    try {
      const logs = localStorage.getItem(this.storageKey);
      return logs ? JSON.parse(logs) : [];
    } catch (e) {
      return [];
    }
  }

  clearLogs() {
    localStorage.removeItem(this.storageKey);
  }

  // Helper para erros de chunk loading
  logChunkError(chunkName: string, error: Error) {
    this.logError({
      type: 'chunk_load',
      message: `Failed to load chunk: ${chunkName}`,
      stack: error.stack,
      route: window.location.pathname,
      context: { chunkName },
    });
  }

  // Helper para erros de rede
  logNetworkError(url: string, status: number, message: string) {
    this.logError({
      type: 'network',
      message: `Network error: ${message}`,
      route: window.location.pathname,
      context: { url, status },
    });
  }
}

export const errorTracker = ErrorTracker.getInstance();

// Helper para retry de imports dinâmicos
export async function retryDynamicImport<T>(
  importFn: () => Promise<T>,
  chunkName: string,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await importFn();
    } catch (error) {
      console.warn(`Chunk load failed (attempt ${attempt}/${maxRetries}):`, chunkName);
      
      if (attempt === maxRetries) {
        errorTracker.logChunkError(chunkName, error as Error);
        
        // Última tentativa: recarregar a página
        if (confirm('Ocorreu um erro ao carregar a página. Deseja recarregar?')) {
          window.location.reload();
        }
        throw error;
      }
      
      // Aguardar antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, attempt * 1000));
    }
  }
  
  throw new Error('Max retries reached');
}
