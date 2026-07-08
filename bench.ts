import { performance } from "perf_hooks";

const analyses = Array.from({ length: 100 }).map((_, i) => ({
  id: `id-${i}`,
  title: `Title ${i}`,
  sourceType: ["PDF", "DOCX", "TEXT"][i % 3],
  charCount: Math.floor(Math.random() * 10000),
  overallRisk: ["RENDAH", "SEDANG", "TINGGI"][i % 3],
  riskScore: Math.floor(Math.random() * 100),
  createdAt: new Date(),
  findings: Array.from({ length: Math.floor(Math.random() * 5) + 1 }).map((_, j) => ({
    category: `cat-${j % 5}`,
    categoryLabel: `Category ${j % 5}`,
    severity: ["LOW", "MEDIUM", "HIGH"][j % 3],
    actionType: ["INFO", "BUTUH_NASIHAT"][j % 2],
  }))
}));

function oldWay() {
  const total = analyses.length;
  const avgRiskScore = Math.round(
    analyses.reduce((s, a) => s + (a.riskScore || 0), 0) / total
  );

  const riskDistribution: Record<string, number> = {};
  const sourceTypeDistribution: Record<string, number> = {};
  const categoryCount: Record<string, { count: number; label: string }> = {};
  let needsActionCount = 0;

  for (const a of analyses) {
    riskDistribution[a.overallRisk || "SEDANG"] = (riskDistribution[a.overallRisk || "SEDANG"] || 0) + 1;
    sourceTypeDistribution[a.sourceType] = (sourceTypeDistribution[a.sourceType] || 0) + 1;
    for (const f of a.findings) {
      if (!categoryCount[f.category]) {
        categoryCount[f.category] = { count: 0, label: f.categoryLabel };
      }
      categoryCount[f.category].count += 1;
      if (f.actionType === "BUTUH_NASIHAT") needsActionCount += 1;
    }
  }

  const topRiskyCategories = Object.entries(categoryCount)
    .map(([category, { count, label }]) => ({ category, label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const recentTrend = [...analyses]
    .reverse()
    .slice(-8)
    .map((a) => ({
      id: a.id,
      title: a.title.slice(0, 30),
      riskScore: a.riskScore || 0,
      overallRisk: a.overallRisk,
      createdAt: a.createdAt.toISOString(),
    }));

  return { recentTrend, avgRiskScore };
}

function newWay() {
  const total = analyses.length;
  let riskScoreSum = 0;

  const riskDistribution: Record<string, number> = {};
  const sourceTypeDistribution: Record<string, number> = {};
  const categoryCount: Record<string, { count: number; label: string }> = {};
  let needsActionCount = 0;

  for (let i = 0; i < total; i++) {
    const a = analyses[i];
    riskScoreSum += a.riskScore || 0;

    const risk = a.overallRisk || "SEDANG";
    riskDistribution[risk] = (riskDistribution[risk] || 0) + 1;

    const srcType = a.sourceType;
    sourceTypeDistribution[srcType] = (sourceTypeDistribution[srcType] || 0) + 1;

    const findings = a.findings;
    const findingsLen = findings.length;
    for (let j = 0; j < findingsLen; j++) {
      const f = findings[j];
      const cat = f.category;
      if (!categoryCount[cat]) {
        categoryCount[cat] = { count: 1, label: f.categoryLabel };
      } else {
        categoryCount[cat].count += 1;
      }
      if (f.actionType === "BUTUH_NASIHAT") needsActionCount += 1;
    }
  }

  const avgRiskScore = Math.round(riskScoreSum / total);

  const topRiskyCategories = Object.entries(categoryCount)
    .map(([category, { count, label }]) => ({ category, label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const recentTrend = analyses
    .slice(0, 8)
    .reverse()
    .map((a) => ({
      id: a.id,
      title: a.title.slice(0, 30),
      riskScore: a.riskScore || 0,
      overallRisk: a.overallRisk,
      createdAt: a.createdAt.toISOString(),
    }));

  return { recentTrend, avgRiskScore };
}

// Warmup
for(let i=0; i<1000; i++) { oldWay(); newWay(); }

let start = performance.now();
for(let i=0; i<10000; i++) oldWay();
let oldTime = performance.now() - start;

start = performance.now();
for(let i=0; i<10000; i++) newWay();
let newTime = performance.now() - start;

console.log(`Old way: ${oldTime.toFixed(2)} ms`);
console.log(`New way: ${newTime.toFixed(2)} ms`);
console.log(`Improvement: ${((oldTime - newTime) / oldTime * 100).toFixed(2)}%`);
