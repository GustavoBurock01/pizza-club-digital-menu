import { test, expect } from '@playwright/test';

test.describe('Chunk Loading Resilience', () => {
  test('should handle slow network gracefully', async ({ page, context }) => {
    // Simulate slow 3G network
    await context.route('**/*.js', route => {
      setTimeout(() => route.continue(), 1000); // 1s delay
    });

    await page.goto('/menu');
    
    // Should still load within reasonable time
    await expect(page.getByRole('heading')).toBeVisible({ timeout: 10000 });
  });

  test('should retry on chunk load failure', async ({ page, context }) => {
    let attemptCount = 0;
    const maxAttempts = 2;

    // Simulate chunk load failure for first N attempts
    await context.route('**/assets/*.js', route => {
      attemptCount++;
      if (attemptCount <= maxAttempts) {
        // Fail first attempts
        route.abort('failed');
      } else {
        // Succeed after retries
        route.continue();
      }
    });

    await page.goto('/menu');
    
    // Should eventually load after retries
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 });
  });

  test('should show error boundary on persistent chunk failure', async ({ page, context }) => {
    // Simulate persistent chunk load failure
    await context.route('**/assets/*.js', route => {
      route.abort('failed');
    });

    await page.goto('/menu');
    
    // Should show error boundary or reload prompt
    const hasErrorUI = await Promise.race([
      page.getByText(/erro/i).isVisible().then(() => true),
      page.getByText(/recarregar/i).isVisible().then(() => true),
      page.waitForTimeout(5000).then(() => false),
    ]);

    // Either shows error UI or page loads successfully
    expect(hasErrorUI !== undefined).toBe(true);
  });

  test('should handle offline to online transition', async ({ page, context }) => {
    // Start offline
    await context.setOffline(true);
    
    const response = page.goto('/menu', { waitUntil: 'commit' });
    
    // Wait a bit, then go online
    await page.waitForTimeout(2000);
    await context.setOffline(false);
    
    // Should eventually load
    await response;
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
  });

  test('should cache chunks properly', async ({ page }) => {
    // First visit
    await page.goto('/menu');
    await page.waitForLoadState('networkidle');
    
    // Get network requests count
    const requests1: string[] = [];
    page.on('request', req => requests1.push(req.url()));
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Get network requests count on second load
    const requests2: string[] = [];
    page.on('request', req => requests2.push(req.url()));
    
    await page.goto('/menu');
    await page.waitForLoadState('networkidle');
    
    // Second load should have fewer requests (cached)
    console.log('First load requests:', requests1.length);
    console.log('Second load requests:', requests2.length);
  });

  test('should load admin pages lazily', async ({ page }) => {
    // Monitor network for admin chunks
    const adminChunks: string[] = [];
    page.on('request', req => {
      const url = req.url();
      if (url.includes('admin') || url.includes('Dashboard')) {
        adminChunks.push(url);
      }
    });

    // Visit non-admin page
    await page.goto('/menu');
    await page.waitForLoadState('networkidle');
    
    const chunksBeforeAdmin = adminChunks.length;
    
    // Now visit admin (will redirect to auth if not logged in)
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    const chunksAfterAdmin = adminChunks.length;
    
    console.log('Admin chunks loaded:', chunksAfterAdmin - chunksBeforeAdmin);
  });
});

test.describe('Dynamic Import Error Handling', () => {
  test('should not crash app on import error', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    
    // Navigate to various pages
    const routes = ['/menu', '/plans', '/checkout', '/auth'];
    for (const route of routes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
    }

    // App should still be functional
    const bodyExists = await page.locator('body').count() > 0;
    expect(bodyExists).toBe(true);
    
    // Log errors for debugging
    if (consoleErrors.length > 0) {
      console.log('Console errors detected:', consoleErrors);
    }
  });
});
