
import { LoadingSpinner } from '@/components/LoadingSpinner';

const Loading = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" text="Processando..." />
        <p className="mt-4 text-lg text-muted-foreground">
          Aguarde enquanto processamos sua solicitação
        </p>
      </div>
    </div>
  );
};

export default Loading;
