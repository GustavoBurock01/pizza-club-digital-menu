import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { LoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render with default size', () => {
    const { getByRole } = render(<LoadingSpinner />);
    const spinner = getByRole('status');
    expect(spinner).toBeInTheDocument();
  });

  it('should render with custom text', () => {
    const { getByText } = render(<LoadingSpinner text="Loading data..." />);
    expect(getByText('Loading data...')).toBeInTheDocument();
  });

  it('should render with different sizes', () => {
    const { rerender, getByRole } = render(<LoadingSpinner size="sm" />);
    expect(getByRole('status')).toBeInTheDocument();

    rerender(<LoadingSpinner size="lg" />);
    expect(getByRole('status')).toBeInTheDocument();
  });

  it('should have screen reader text', () => {
    const { getByText } = render(<LoadingSpinner />);
    expect(getByText('Carregando...')).toBeInTheDocument();
  });
});
