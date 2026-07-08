#!/bin/bash
# Full end-to-end verification in one process-lifetime.
set -u
cd /home/z/my-project

echo "=== [1] Start dev server (background, this shell keeps it alive) ==="
pkill -f "next dev" 2>/dev/null
sleep 1
node_modules/.bin/next dev -p 3000 > /tmp/kp-next.log 2>&1 &
SRV=$!
echo "server pid $SRV"

echo "=== [2] Wait for server ready ==="
for i in $(seq 1 40); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null || echo 000)
  if [ "$code" = "200" ]; then echo "ready after ${i}s"; break; fi
  sleep 1
done

echo "=== [3] Open landing page ==="
agent-browser close --all >/dev/null 2>&1
agent-browser open http://localhost:3000/ 2>&1 | tail -1
sleep 2

echo "=== [4] Go to signin ==="
agent-browser open http://localhost:3000/ >/dev/null 2>&1
SIGNIN_BTN=$(agent-browser snapshot 2>/dev/null | grep -A1 'button "Masuk"' | grep -o 'ref=e[0-9]*' | head -1)
echo "signin btn ref: $SIGNIN_BTN"
[ -n "$SIGNIN_BTN" ] && agent-browser click @$SIGNIN_BTN >/dev/null 2>&1
sleep 2

echo "=== [5] Fill signin form (tester01 / Test1234pass) ==="
SNAP=$(agent-browser snapshot 2>/dev/null)
ID_REF=$(echo "$SNAP" | grep 'textbox.*Username atau email\|textbox.*identifier' | grep -o 'ref=e[0-9]*' | head -1)
[ -z "$ID_REF" ] && ID_REF=$(echo "$SNAP" | grep -A2 'LabelText' | grep 'textbox' | grep -o 'ref=e[0-9]*' | head -1)
PW_REF=$(echo "$SNAP" | grep 'textbox.*Password' | grep -o 'ref=e[0-9]*' | head -1)
[ -z "$PW_REF" ] && PW_REF=$(echo "$SNAP" | grep -A2 'Password' | grep 'textbox' | grep -o 'ref=e[0-9]*' | head -1)
echo "id ref: $ID_REF  pw ref: $PW_REF"
agent-browser fill @$ID_REF "tester01" >/dev/null 2>&1
agent-browser fill @$PW_REF "Test1234pass" >/dev/null 2>&1
SUBMIT=$(agent-browser snapshot 2>/dev/null | grep 'button "Masuk"' | grep -o 'ref=e[0-9]*' | head -1)
echo "submit ref: $SUBMIT"
agent-browser click @$SUBMIT >/dev/null 2>&1
sleep 4

echo "=== [6] Verify dashboard ==="
agent-browser snapshot 2>/dev/null | grep -o 'Halo, [a-z0-9]*' | head -1
agent-browser snapshot 2>/dev/null | grep -i 'analisis tersisa\|Analisis Kontrak Baru' | head -2

echo "=== [7] Go to analyze ==="
ANALYZE_BTN=$(agent-browser snapshot 2>/dev/null | grep 'button "Analisis Kontrak Baru"' | grep -o 'ref=e[0-9]*' | head -1)
[ -n "$ANALYZE_BTN" ] && agent-browser click @$ANALYZE_BTN >/dev/null 2>&1
sleep 2

echo "=== [8] Fill contract text ==="
TA=$(agent-browser snapshot 2>/dev/null | grep 'Tempel teks kontrak' | grep -o 'ref=e[0-9]*' | head -1)
echo "textarea ref: $TA"
agent-browser fill @$TA "$(cat /tmp/contract.txt)" >/dev/null 2>&1

echo "=== [9] Start analysis ==="
START_BTN=$(agent-browser snapshot 2>/dev/null | grep 'button "Mulai Analisis"' | grep -o 'ref=e[0-9]*' | head -1)
echo "start btn ref: $START_BTN"
agent-browser click @$START_BTN >/dev/null 2>&1

echo "=== [10] Wait for result (up to 150s) ==="
for i in $(seq 1 50); do
  sleep 3
  SNAP=$(agent-browser snapshot 2>/dev/null)
  if echo "$SNAP" | grep -q "Temuan Klausul"; then
    echo "RESULT appeared after ~$((i*3))s"
    break
  fi
  if echo "$SNAP" | grep -q "Permintaan gagal"; then
    echo "ERROR appeared after ~$((i*3))s"
    break
  fi
done

echo "=== [11] Snapshot result ==="
agent-browser snapshot 2>/dev/null | sed -n '1,60p'

echo "=== [12] Dev log tail (errors?) ==="
tail -25 /tmp/kp-next.log | grep -iE "error|fail|⨯|POST /api/analyze" | head -15

echo "=== [13] Kill server ==="
kill $SRV 2>/dev/null
echo "DONE"
