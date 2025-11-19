#!/usr/bin/env node

/**
 * Lighthouse Performance Audit Script
 * 
 * Executa auditorias de performance nas principais páginas
 * e gera relatórios comparativos.
 * 
 * Uso: node scripts/lighthouse-audit.js
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

const ROUTES_TO_AUDIT = [
  { path: '/', name: 'Home' },
  { path: '/menu', name: 'Menu' },
  { path: '/plans', name: 'Plans' },
  { path: '/checkout', name: 'Checkout' },
  { path: '/auth', name: 'Auth' },
];

const BASE_URL = process.env.AUDIT_URL || 'http://localhost:8080';
const OUTPUT_DIR = path.join(process.cwd(), 'lighthouse-reports');

// Thresholds mínimos
const THRESHOLDS = {
  performance: 85,
  accessibility: 95,
  'best-practices': 90,
  seo: 90,
};

async function runAudit(url) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  
  const options = {
    logLevel: 'info',
    output: 'html',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    port: chrome.port,
  };

  const runnerResult = await lighthouse(url, options);
  
  await chrome.kill();
  
  return runnerResult;
}

async function auditAllRoutes() {
  console.log('🔍 Starting Lighthouse Audits...\n');
  console.log(`Base URL: ${BASE_URL}\n`);

  // Criar diretório de reports
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const results = [];
  let allPassed = true;

  for (const route of ROUTES_TO_AUDIT) {
    const url = `${BASE_URL}${route.path}`;
    console.log(`\n📊 Auditing: ${route.name} (${url})`);

    try {
      const result = await runAudit(url);
      const scores = result.lhr.categories;

      // Extrair scores
      const routeScores = {
        name: route.name,
        path: route.path,
        performance: Math.round(scores.performance.score * 100),
        accessibility: Math.round(scores.accessibility.score * 100),
        bestPractices: Math.round(scores['best-practices'].score * 100),
        seo: Math.round(scores.seo.score * 100),
      };

      results.push(routeScores);

      // Log resultados
      console.log('  Performance:', routeScores.performance);
      console.log('  Accessibility:', routeScores.accessibility);
      console.log('  Best Practices:', routeScores.bestPractices);
      console.log('  SEO:', routeScores.seo);

      // Verificar thresholds
      const failed = [];
      if (routeScores.performance < THRESHOLDS.performance) {
        failed.push('Performance');
        allPassed = false;
      }
      if (routeScores.accessibility < THRESHOLDS.accessibility) {
        failed.push('Accessibility');
        allPassed = false;
      }
      if (routeScores.bestPractices < THRESHOLDS['best-practices']) {
        failed.push('Best Practices');
        allPassed = false;
      }
      if (routeScores.seo < THRESHOLDS.seo) {
        failed.push('SEO');
        allPassed = false;
      }

      if (failed.length > 0) {
        console.log(`  ❌ Failed thresholds: ${failed.join(', ')}`);
      } else {
        console.log('  ✅ All thresholds passed');
      }

      // Salvar relatório HTML
      const reportPath = path.join(OUTPUT_DIR, `${route.name.toLowerCase()}.html`);
      fs.writeFileSync(reportPath, result.report);
      console.log(`  📄 Report saved: ${reportPath}`);

    } catch (error) {
      console.error(`  ❌ Error auditing ${route.name}:`, error.message);
      allPassed = false;
    }
  }

  // Gerar relatório JSON consolidado
  const summaryPath = path.join(OUTPUT_DIR, 'summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    thresholds: THRESHOLDS,
    results,
    passed: allPassed,
  }, null, 2));

  console.log(`\n📊 Summary saved: ${summaryPath}`);

  // Exibir tabela resumida
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.table(results);

  if (allPassed) {
    console.log('\n✅ All audits passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Some audits failed. Check reports for details.');
    process.exit(1);
  }
}

// Executar
auditAllRoutes().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
