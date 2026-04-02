/**
 * Test Report Generator
 * 
 * Generates a comprehensive test report from all test results.
 */

import fs from 'fs';
import path from 'path';

interface TestResult {
  title: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
}

interface Report {
  timestamp: string;
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    passRate: number;
  };
  results: TestResult[];
}

async function generateReport() {
  console.log('📊 Generating test report...');
  
  const resultsPath = path.join(__dirname, '../e2e/test-results/results.json');
  
  if (!fs.existsSync(resultsPath)) {
    console.log('⚠️  No test results found');
    return;
  }
  
  const data = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
  
  const report: Report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: data.stats?.tests || 0,
      passed: data.stats?.passed || 0,
      failed: data.stats?.failed || 0,
      skipped: data.stats?.skipped || 0,
      passRate: ((data.stats?.passed || 0) / (data.stats?.tests || 1)) * 100
    },
    results: (data.tests || []).map((test: any) => ({
      title: test.title,
      status: test.status,
      duration: test.duration,
      error: test.error
    }))
  };
  
  // Generate markdown report
  const mdReport = generateMarkdownReport(report);
  const mdPath = path.join(__dirname, '../e2e/TEST_REPORT.md');
  fs.writeFileSync(mdPath, mdReport);
  
  console.log(`✅ Report saved to: ${mdPath}`);
}

function generateMarkdownReport(report: Report): string {
  return `# Sub2API Test Report

## Summary

| Metric | Value |
|--------|-------|
| Total Tests | ${report.summary.total} |
| Passed | ${report.summary.passed} ✅ |
| Failed | ${report.summary.failed} ❌ |
| Skipped | ${report.summary.skipped} ⏭️ |
| Pass Rate | ${report.summary.passRate.toFixed(1)}% |

## Timestamp

${report.timestamp}

## Failed Tests

${report.results.filter(r => r.status === 'failed').map(r => `### ${r.title}

\`\`\`
${r.error}
\`\`\`
`).join('\n')}

---
*Report generated at ${new Date().toISOString()}*
`;
}

generateReport().catch(console.error);
