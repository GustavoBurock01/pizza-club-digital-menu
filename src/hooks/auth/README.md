# Auth Hooks Documentation

## Overview
Sistema de autenticação modular e otimizado para Supabase Auth.

## Architecture

```
useAuth (Main Hook)
├── useAuthState (State Management)
│   ├── session
│   ├── user
│   ├── loading
│   └── initialized
└── useAuthActions (Actions)
    ├── signIn
    ├── signUp
    ├── signOut
    ├── updateProfile
    └── resetPassword
```

## Hooks

### useAuth
**Main hook** que combina state e actions.

```typescript
const { 
  user,           // Current user object
  session,        // Current session
  loading,        // Loading state
  initialized,    // Auth initialized flag
  signIn,         // Sign in function
  signUp,         // Sign up function
  signOut,        // Sign out function
  updateProfile,  // Update profile function
  resetPassword   // Reset password function
} = useAuth();
```

### useAuthState
Gerencia apenas o estado da autenticação. Usa React Query para cache.

**Features:**
- ✅ Cache automático (React Query)
- ✅ Revalidação em foco da janela
- ✅ Retry automático em falhas
- ✅ State persistence

**Query Keys:**
- `['auth', 'session']` - Session data

### useAuthActions
Contém todas as actions de autenticação.

**Methods:**

#### signIn(email, password)
```typescript
await signIn('user@example.com', 'password123');
```

#### signUp(email, password, metadata?)
```typescript
await signUp('user@example.com', 'password123', {
  name: 'John Doe',
  phone: '11999999999'
});
```

#### signOut()
```typescript
await signOut();
```

#### updateProfile(updates)
```typescript
await updateProfile({
  name: 'New Name',
  phone: '11888888888'
});
```

#### resetPassword(email)
```typescript
await resetPassword('user@example.com');
```

## Error Handling

Todos os métodos retornam objetos com:
```typescript
{
  data?: T,
  error?: PostgrestError
}
```

**Example:**
```typescript
const { data, error } = await signIn(email, password);

if (error) {
  toast.error('Erro ao fazer login', error.message);
  return;
}

// Success!
navigate('/dashboard');
```

## Real-time Updates

O hook escuta mudanças de auth state automaticamente via Supabase Realtime:
- ✅ Login/Logout
- ✅ Token refresh
- ✅ Session expiration

## Best Practices

1. **Use useAuth no topo da árvore de componentes**
   ```typescript
   // ✅ Good
   function App() {
     const { user, loading } = useAuth();
     if (loading) return <LoadingSpinner />;
     return user ? <Dashboard /> : <Login />;
   }
   ```

2. **Não chame hooks condicionalmente**
   ```typescript
   // ❌ Bad
   if (condition) {
     const { user } = useAuth();
   }

   // ✅ Good
   const { user } = useAuth();
   if (condition && user) {
     // do something
   }
   ```

3. **Use React Query DevTools para debug**
   ```typescript
   import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
   
   <ReactQueryDevtools initialIsOpen={false} />
   ```

## Performance

- **Bundle size**: ~8KB (minified)
- **Cache TTL**: 5 minutes (stale time)
- **Refetch on window focus**: Enabled
- **Retry failed requests**: 1x

## Security

- ✅ RLS policies enforced
- ✅ Tokens stored in httpOnly cookies
- ✅ CSRF protection enabled
- ✅ Rate limiting on auth endpoints (via Supabase)
