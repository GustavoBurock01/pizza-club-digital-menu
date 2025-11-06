import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRole } from '../useRole';

vi.mock('@/services/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ 
        data: { user: { id: 'test-user-id' } }, 
        error: null 
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ 
        data: { role: 'customer' }, 
        error: null 
      }),
    })),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return loading state initially', () => {
    const { result } = renderHook(() => useRole(), { wrapper: createWrapper() });
    
    expect(result.current.loading).toBe(true);
  });

  it('should provide role checking functions', () => {
    const { result } = renderHook(() => useRole(), { wrapper: createWrapper() });

    expect(typeof result.current.isAdmin).toBe('boolean');
    expect(typeof result.current.isAttendant).toBe('boolean');
    expect(typeof result.current.isCustomer).toBe('boolean');
    expect(typeof result.current.hasRole).toBe('function');
    expect(typeof result.current.hasAnyRole).toBe('function');
  });

  it('should have role property', () => {
    const { result } = renderHook(() => useRole(), { wrapper: createWrapper() });

    expect(result.current).toHaveProperty('role');
  });

  it('hasRole should be a function', () => {
    const { result } = renderHook(() => useRole(), { wrapper: createWrapper() });

    expect(typeof result.current.hasRole).toBe('function');
  });

  it('hasAnyRole should be a function', () => {
    const { result } = renderHook(() => useRole(), { wrapper: createWrapper() });

    expect(typeof result.current.hasAnyRole).toBe('function');
  });
});
