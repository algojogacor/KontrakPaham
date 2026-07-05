#!/bin/bash
set -u
cd /home/z/my-project

echo "=== [1] Start server ==="
pkill -f "next dev" 2>/dev/null; sleep 1
node_modules/.bin/next dev -p 3000 > /tmp/kp-next.log 2>&1 &
SRV=$!
for i in $(seq 1 40); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null || echo 000)
  [ "$code" = "200" ] && { echo "ready ${i}s"; break; }
  sleep 1
done

echo "=== [2] Signup tester02 (gets session cookie) ==="
curl -s -c /tmp/kp-cookies.txt -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"tester02","email":"tester02@example.com","password":"Test1234pass"}' \
  | head -c 300
echo ""

echo "=== [3] Call /api/analyze with contract text ==="
# Build JSON with the contract text via node (safe escaping)
node -e '
const fs = require("fs");
const text = fs.readFileSync("/tmp/contract.txt","utf8");
process.stdout.write(JSON.stringify({ text }));
' > /tmp/kp-analyze-body.json
echo "body bytes: $(wc -c < /tmp/kp-analyze-body.json)"

START=$(date +%s)
RESP=$(curl -s -b /tmp/kp-cookies.txt -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  --data-binary @/tmp/kp-analyze-body.json \
  --max-time 200)
END=$(date +%s)
echo "analyze took $((END-START))s"

echo "=== [4] Parse & show result ==="
echo "$RESP" | node -e '
let d=""; process.stdin.on("data",c=>d+=c); process.stdin.on("end",()=>{
  try {
    const j = JSON.parse(d);
    if (j.error) { console.log("API ERROR:", j.error); process.exit(0); }
    const a = j.analysis;
    if (!a) { console.log("NO analysis field. Raw:", d.slice(0,400)); process.exit(0); }
    console.log("title:", a.title);
    console.log("overallRisk:", a.overallRisk, " riskScore:", a.riskScore);
    console.log("findings:", a.findings.length);
    console.log("summary:", (a.summary||"").slice(0,200));
    console.log("--- first 3 findings ---");
    a.findings.slice(0,3).forEach((f,i)=>{
      console.log(`#${i+1} [${f.severity}] ${f.categoryLabel} (conf ${f.confidence}, ${f.actionType})`);
      console.log("  asli:", f.originalClause.slice(0,80));
      console.log("  awam:", f.plainTranslation.slice(0,80));
    });
    if (j.warnings && j.warnings.length) console.log("warnings:", j.warnings);
    if (j.notes && j.notes.length) console.log("notes:", j.notes);
  } catch(e) { console.log("PARSE FAIL:", e.message); console.log("raw:", d.slice(0,400)); }
});
'

echo "=== [5] Server log errors ==="
tail -20 /tmp/kp-next.log | grep -iE "error|⨯|POST /api/analyze|native binding" | head -10

kill $SRV 2>/dev/null
echo "DONE"
