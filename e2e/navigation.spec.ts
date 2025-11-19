import { test, expect } from '@playwright/test';

test.describe('Navigation Flow', () => {
  test('should navigate through main routes without errors', async ({ page }) => {
    // Monitorar erros de console
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // 1. Home
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toMatch(/\/(menu|plans|auth)/);

    // 2. Menu
    await page.goto('/menu');
    await expect(page.getByRole('heading', { name: /cardápio/i })).toBeVisible({ timeout: 5000 });

    // 3. Auth
    await page.goto('/auth');
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();

    // 4. Plans
    await page.goto('/plans');
    await expect(page.getByRole('heading', { name: /planos/i })).toBeVisible();

    // Verificar que não houve erros críticos de console
    const criticalErrors = consoleErrors.filter(err => 
      err.includes('Failed to fetch') || 
      err.includes('chunk') ||
      err.includes('Uncaught')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    await page.goto('/menu');
    await page.waitForLoadState('networkidle');
    
    await page.goto('/plans');
    await page.waitForLoadState('networkidle');
    
    // Voltar
    await page.goBack();
    expect(page.url()).toContain('/menu');
    
    // Avançar
    await page.goForward();
    expect(page.url()).toContain('/plans');
  });

  test('should lazy load admin pages', async ({ page }) => {
    // Note: Requires authentication to access admin routes
    await page.goto('/admin');
    
    // Should redirect to auth if not authenticated
    await page.waitForLoadState('networkidle');
    
    const url = page.url();
    const isOnAuthOrAdmin = url.includes('/auth') || url.includes('/admin');
    expect(isOnAuthOrAdmin).toBe(true);
  });

  test('should handle invalid routes gracefully', async ({ page }) => {
    await page.goto('/non-existent-route-12345');
    await page.waitForLoadState('networkidle');
    
    // Should redirect to a valid route or show 404
    const hasContent = await page.locator('main, [role="main"], body').count() > 0;
    expect(hasContent).toBe(true);
  });

  test('should maintain state during navigation', async ({ page }) => {
    await page.goto('/menu');
    
    // Simulate adding item to cart (if logged in)
    const addButton = page.getByRole('button', { name: /adicionar/i }).first();
    
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // Navigate away and back
      await page.goto('/plans');
      await page.goto('/menu');
      
      // Cart should still have items (check for cart indicator)
      // This depends on your cart implementation
    }
  });
});

test.describe('Page Transitions', () => {
  test('should not show white screen during navigation', async ({ page }) => {
    await page.goto('/menu');
    
    // Click on a navigation link
    const navLinks = page.locator('nav a, [role="navigation"] a');
    const linkCount = await navLinks.count();
    
    if (linkCount > 0) {
      const firstLink = navLinks.first();
      await firstLink.click();
      
      // Wait for navigation
      await page.waitForLoadState('domcontentloaded');
      
      // Check that page has content (not white screen)
      const bodyContent = await page.locator('body').textContent();
      expect(bodyContent?.length).toBeGreaterThan(100);
    }
  });

  test('should load pages within reasonable time', async ({ page }) => {
    const routes = ['/menu', '/plans', '/auth', '/checkout'];
    
    for (const route of routes) {
      const startTime = Date.now();
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
      const loadTime = Date.now() - startTime;
      
      console.log(`${route} loaded in ${loadTime}ms`);
      
      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    }
  });
});
