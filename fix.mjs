import fs from "fs";

let content = fs.readFileSync("src/app/api/insights/route.ts", "utf8");

const startIndex = content.indexOf("    const total = analyses.length;");
const endIndex = content.indexOf("    return NextResponse.json({", startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const newCode = `    const total = analyses.length;
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

`;
  content = content.substring(0, startIndex) + newCode + content.substring(endIndex);
  fs.writeFileSync("src/app/api/insights/route.ts", content);
  console.log("Success");
} else {
  console.log("Not found", startIndex, endIndex);
}
