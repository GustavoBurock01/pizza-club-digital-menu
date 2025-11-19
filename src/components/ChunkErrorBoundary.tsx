import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { errorTracker } from '@/utils/errorTracking';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  retryCount: number;
}

export class ChunkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      retryCount: 0,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Detectar erros de chunk loading
    const isChunkError = error.message.includes('Failed to fetch dynamically imported module') ||
                        error.message.includes('Importing a module script failed') ||
                        error.message.includes('error loading dynamically imported module');

    if (isChunkError) {
      errorTracker.logChunkError('unknown-chunk', error);
      
      // Retry automático para erros de chunk (até 2 vezes)
      if (this.state.retryCount < 2) {
        setTimeout(() => {
          this.setState(state => ({
            hasError: false,
            retryCount: state.retryCount + 1,
          }));
        }, 1000 * (this.state.retryCount + 1));
        return;
      }
    }

    // Log de erro genérico
    errorTracker.logError({
      type: 'render',
      message: error.message,
      stack: error.stack,
      route: window.location.pathname,
      context: {
        componentStack: errorInfo.componentStack,
      },
    });

    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: 0,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="w-full max-w-md space-y-6 rounded-lg border border-destructive/20 bg-card p-6 shadow-lg">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="h-8 w-8" />
              <h2 className="text-2xl font-bold">Ops! Algo deu errado</h2>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                Ocorreu um erro ao carregar esta página. Isso pode acontecer por:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Conexão instável com a internet</li>
                <li>Atualização recente do sistema</li>
                <li>Cache desatualizado do navegador</li>
              </ul>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <div className="rounded bg-destructive/10 p-3 text-xs font-mono">
                <strong>Erro:</strong> {this.state.error.message}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={this.handleReload}
                className="flex-1"
                variant="default"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Recarregar Página
              </Button>
              <Button
                onClick={this.handleReset}
                variant="outline"
                className="flex-1"
              >
                Tentar Novamente
              </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Se o problema persistir, entre em contato com o suporte
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
