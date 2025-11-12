import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Download, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { useSubscriptionMonitoring, CacheItem } from '@/hooks/admin/useSubscriptionMonitoring';

interface LocalCacheViewerProps {
  monitoring: ReturnType<typeof useSubscriptionMonitoring>;
}

const LocalCacheViewer = ({ monitoring }: LocalCacheViewerProps) => {
  const [caches, setCaches] = useState<CacheItem[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const loadCaches = () => {
    const items = monitoring.listLocalCaches();
    setCaches(items);
  };

  useEffect(() => {
    loadCaches();
  }, [monitoring]);

  const toggleExpand = (key: string) => {
    const newExpanded = new Set(expandedKeys);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedKeys(newExpanded);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatValue = (value: any) => {
    if (typeof value === 'string') return value;
    return JSON.stringify(value, null, 2);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Cache Local (localStorage)</CardTitle>
            <CardDescription>
              Items relacionados a assinatura armazenados no navegador
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadCaches}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={monitoring.exportCache}
              disabled={caches.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                monitoring.clearLocalCache();
                loadCaches();
              }}
              disabled={caches.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Cache
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {caches.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum cache encontrado
          </div>
        ) : (
          <div className="space-y-3">
            {caches.map((cache) => (
              <div
                key={cache.key}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(cache.key)}
                      className="p-0 h-6 w-6"
                    >
                      {expandedKeys.has(cache.key) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    <div className="font-mono text-sm font-medium break-all">
                      {cache.key}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {cache.timestamp && (
                      <Badge variant="outline" className="text-xs">
                        {new Date(cache.timestamp).toLocaleTimeString('pt-BR')}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      {formatSize(cache.size)}
                    </Badge>
                  </div>
                </div>
                
                {expandedKeys.has(cache.key) && (
                  <div className="mt-3 pl-8">
                    <pre className="bg-muted p-3 rounded text-xs overflow-x-auto max-h-60 overflow-y-auto">
                      {formatValue(cache.value)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-muted-foreground">
          <span>Total: {caches.length} item(ns)</span>
          <span>Tamanho total: {formatSize(caches.reduce((sum, c) => sum + c.size, 0))}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default LocalCacheViewer;
