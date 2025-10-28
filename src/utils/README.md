# Utils Documentation

## Overview
Coleção de utilitários reutilizáveis para formatação, validação, performance e segurança.

## Categories

### 📝 Formatting (`formatting.ts`)
Formatação de dados para exibição.

**Functions:**
```typescript
// Currency
formatCurrency(1000) // "R$ 1.000,00"

// Dates
formatDate('2024-01-15') // "15/01/2024"
formatDateTime('2024-01-15T10:30') // "15/01/2024 10:30"
formatTime('2024-01-15T10:30') // "10:30"

// Phone
formatPhone('11987654321') // "(11) 98765-4321"

// CPF
formatCPF('12345678900') // "123.456.789-00"

// CEP
formatCEP('01310100') // "01310-100"

// Dynamic (para inputs)
formatPhoneDynamic('1198') // "(11) 98"
formatCPFDynamic('12345') // "123.45"
formatCEPDynamic('01310') // "01310"
```

### ✅ Validation (`validation.ts`)
Validação de dados de entrada.

**Functions:**
```typescript
// Email
validateEmail('test@example.com') // true

// Phone (10 ou 11 dígitos)
validatePhone('11987654321') // true
validatePhone('1133334444') // true

// CPF (com verificação de dígitos)
validateCPF('123.456.789-00') // true/false

// CEP
validateCEP('01310-100') // true

// Password
const result = validatePassword('MyPass123');
// { isValid: true, errors: [] }
```

### 🚀 Performance (`performanceMonitor.ts`)
Monitoramento e otimização de performance.

**Usage:**
```typescript
import { performanceMonitor } from '@/utils/performanceMonitor';

// Measure operation
performanceMonitor.measure('fetchProducts', async () => {
  const products = await getProducts();
  return products;
});

// Get report
const report = performanceMonitor.getReport();
console.log(report);
// {
//   fetchProducts: {
//     count: 10,
//     avgTime: 245,
//     minTime: 180,
//     maxTime: 450,
//     totalTime: 2450
//   }
// }

// Clear old metrics
performanceMonitor.clearOldMetrics();
```

### 🔐 Security (`rateLimiting.ts`)
Rate limiting para proteção contra abuso.

**Client-side:**
```typescript
import { clientRateLimiter } from '@/utils/rateLimiting';

const canProceed = clientRateLimiter.checkLimit(
  'submit-form',
  5,  // max requests
  60  // window in seconds
);

if (!canProceed) {
  toast.error('Muitas tentativas. Aguarde um momento.');
  return;
}

// Proceed with action
await submitForm();
```

**Edge Function:**
```typescript
import { RateLimiter } from '../_shared/rate-limiter.ts';

const rateLimiter = new RateLimiter(supabaseClient);

const allowed = await rateLimiter.checkLimit(
  userId,
  'create-order',
  10,   // max requests
  3600  // 1 hour window
);

if (!allowed) {
  return new Response('Rate limit exceeded', { status: 429 });
}
```

### 🔒 Data Encryption (`dataEncryption.ts`)
Criptografia de dados sensíveis (client-side).

**Functions:**
```typescript
// Encrypt
const encrypted = await encryptData('sensitive info', 'secret-key');

// Decrypt
const decrypted = await decryptData(encrypted, 'secret-key');

// Hash (one-way)
const hashed = await hashData('password');
```

### 📊 Analytics (`advancedAnalytics.ts`)
Tracking de eventos e análises.

**Usage:**
```typescript
import { analytics } from '@/utils/advancedAnalytics';

// Track event
analytics.track('product_view', {
  productId: '123',
  category: 'pizza',
  price: 45.90
});

// Track page view
analytics.pageView('/menu');

// Set user
analytics.identify(userId, {
  name: 'John Doe',
  email: 'john@example.com'
});
```

### 💾 Cache Management (`cacheManager.ts`)
Gerenciamento de cache multi-layer.

**Usage:**
```typescript
import { cacheManager } from '@/utils/cacheManager';

// Set cache
cacheManager.set('products', productsData, 5 * 60 * 1000); // 5min

// Get cache
const cached = cacheManager.get('products');

// Clear cache
cacheManager.clear('products');

// Clear all
cacheManager.clearAll();
```

### 🔄 Retry Manager (`retryManager.ts`)
Sistema de retry para operações falhadas.

**Usage:**
```typescript
import { retryWithBackoff } from '@/utils/retryManager';

const result = await retryWithBackoff(
  async () => {
    return await fetchFromAPI();
  },
  {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2
  }
);
```

### 🎨 Toast Helpers (`toastHelpers.ts`)
Notificações padronizadas.

**Usage:**
```typescript
import { 
  toastSuccess, 
  toastError, 
  toastWarning,
  toastPromise 
} from '@/utils/toastHelpers';

// Simple toasts
toastSuccess('Pedido criado com sucesso!');
toastError('Erro ao processar pagamento');
toastWarning('Estoque baixo');

// Promise toast
await toastPromise(
  createOrder(),
  {
    loading: 'Criando pedido...',
    success: 'Pedido criado!',
    error: 'Erro ao criar pedido'
  }
);
```

## Best Practices

1. **Import only what you need**
   ```typescript
   // ✅ Good
   import { formatCurrency } from '@/utils/formatting';
   
   // ❌ Bad
   import * as utils from '@/utils/formatting';
   ```

2. **Handle errors gracefully**
   ```typescript
   try {
     const result = formatCurrency(value);
   } catch (error) {
     console.error('Format error:', error);
     return 'R$ 0,00'; // fallback
   }
   ```

3. **Use TypeScript types**
   ```typescript
   import { validateEmail } from '@/utils/validation';
   
   const email: string = input.value;
   const isValid: boolean = validateEmail(email);
   ```

4. **Cache expensive operations**
   ```typescript
   const getCachedProducts = () => {
     const cached = cacheManager.get('products');
     if (cached) return cached;
     
     const products = expensiveFetch();
     cacheManager.set('products', products);
     return products;
   };
   ```

## Testing

All utils have test coverage. Run tests with:
```bash
npm run test
```

See test files in `src/utils/__tests__/` for examples.
