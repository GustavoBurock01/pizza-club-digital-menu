# 🧪 Testing Guide

## Overview
Este projeto usa **Vitest** como framework de testes, com **Testing Library** para testes de componentes React.

## Executar Testes

### Todos os testes
```bash
npm run test
```

### Watch mode (desenvolvimento)
```bash
npm run test:watch
```

### Interface UI (recomendado)
```bash
npm run test:ui
```
Abre uma interface web interativa em `http://localhost:51204`

### Coverage
```bash
npm run test:coverage
```
Gera relatório de cobertura em `coverage/`

## Estrutura de Testes

```
src/
├── components/
│   └── __tests__/
│       └── LoadingSpinner.test.tsx
├── hooks/
│   └── __tests__/
│       └── (adicionar testes aqui)
└── utils/
    └── __tests__/
        ├── formatting.test.ts
        └── validation.test.ts
```

## Testes Existentes

### Utils (20 testes)
- ✅ `formatting.test.ts` - Formatação de currency, phone, CPF, CEP
- ✅ `validation.test.ts` - Validação de email, phone, CPF, CEP

### Components (4 testes)
- ✅ `LoadingSpinner.test.tsx` - Estados de loading

## Como Escrever Testes

### Teste de Utilidade
```typescript
import { describe, it, expect } from 'vitest';
import { formatCurrency } from '../formatting';

describe('formatCurrency', () => {
  it('should format number to BRL currency', () => {
    expect(formatCurrency(1000)).toBe('R$ 1.000,00');
  });
});
```

### Teste de Componente
```typescript
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('should render with text', () => {
    const { getByText } = render(<Button>Click me</Button>);
    expect(getByText('Click me')).toBeInTheDocument();
  });
});
```

### Teste de Hook
```typescript
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCounter } from '../useCounter';

describe('useCounter', () => {
  it('should increment counter', () => {
    const { result } = renderHook(() => useCounter());
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(1);
  });
});
```

## Configuração

### vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

### src/test/setup.ts
Setup global com mocks de:
- IntersectionObserver
- ResizeObserver
- matchMedia

## Mocking

### Mock de função
```typescript
import { vi } from 'vitest';

const mockFn = vi.fn();
mockFn.mockReturnValue('mocked value');
```

### Mock de módulo
```typescript
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '123', email: 'test@example.com' },
    loading: false,
  }),
}));
```

### Mock de Supabase
```typescript
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockData })),
        })),
      })),
    })),
  },
}));
```

## Best Practices

1. **Teste comportamento, não implementação**
   ```typescript
   // ❌ Bad
   expect(component.state.isOpen).toBe(true);
   
   // ✅ Good
   expect(getByRole('dialog')).toBeVisible();
   ```

2. **Use queries semânticas**
   ```typescript
   // Preferência de queries (melhor → pior)
   getByRole('button', { name: /submit/i })
   getByLabelText('Email')
   getByPlaceholderText('Enter email')
   getByText('Submit')
   getByTestId('submit-button') // último recurso
   ```

3. **Limpe após cada teste**
   ```typescript
   afterEach(() => {
     vi.clearAllMocks();
   });
   ```

4. **Use `describe` para agrupar**
   ```typescript
   describe('Authentication', () => {
     describe('Login', () => {
       it('should login with valid credentials', () => {});
       it('should show error with invalid credentials', () => {});
     });
   });
   ```

5. **Teste casos de erro**
   ```typescript
   it('should handle network errors', async () => {
     mockFetch.mockRejectedValueOnce(new Error('Network error'));
     
     const { getByText } = render(<Component />);
     
     await waitFor(() => {
       expect(getByText('Error loading data')).toBeInTheDocument();
     });
   });
   ```

## Cobertura Atual

- **Utils**: ~80% coverage
- **Components**: ~30% coverage
- **Hooks**: ~20% coverage
- **Overall**: ~40% coverage

## Meta de Cobertura

- 🎯 **Target**: 70% coverage
- 📊 **Prioritário**: Componentes core e hooks críticos
- ⚠️ **Mínimo**: 50% coverage antes de deploy

## Próximos Passos

1. Adicionar testes para hooks críticos:
   - [ ] useAuth
   - [ ] useSubscription
   - [ ] useCart

2. Adicionar testes para componentes principais:
   - [ ] MenuCard
   - [ ] ProductCustomizer
   - [ ] UnifiedCartSystem

3. Adicionar testes de integração:
   - [ ] Fluxo de checkout
   - [ ] Fluxo de autenticação
   - [ ] Fluxo de pedido

## Recursos

- [Vitest Docs](https://vitest.dev/)
- [Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
