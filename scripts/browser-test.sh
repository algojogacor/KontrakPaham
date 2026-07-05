#!/bin/bash
# Robust browser verification with hydration waits + per-step verification.
set -u
cd /home/z/my-project
ts(){ date +%H:%M:%S; }

pkill -f "next dev" 2>/dev/null; sleep 1
node_modules/.bin/next dev -p 3000 > /tmp/kp-next.log 2>&1 &
SRV=$!
for i in $(seq 1 40); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null || echo 000)
  [ "$code" = "200" ] && { echo "$(ts) server ready"; break; }
  sleep 1
done

agent-browser close --all >/dev/null 2>&1
echo "$(ts) open + wait for hydration"
timeout 30 agent-browser open http://localhost:3000/ >/dev/null 2>&1
# wait for network idle + extra for React hydration
timeout 20 agent-browser wait --load networkidle >/dev/null 2>&1
sleep 3

# Go to signin: click the nav "Masuk" button, then VERIFY we're on signin
echo "$(ts) click Masuk"
REF=$(timeout 25 agent-browser snapshot 2>/dev/null | grep 'button "Masuk"' | grep -o 'ref=e[0-9]*' | head -1)
timeout 20 agent-browser click @$REF >/dev/null 2>&1
sleep 3
# verify signin form present
echo "$(ts) verify signin form"
timeout 25 agent-browser snapshot 2>/dev/null | grep -q 'Buat akun\|Masuk ke akun\|Username atau email' && echo "$(ts) on auth view" || echo "$(ts) NOT on auth view"

# Fill signin: re-snapshot to get fresh refs
SNAP=$(timeout 25 agent-browser snapshot 2>/dev/null)
IDR=$(echo "$SNAP" | grep 'textbox' | grep -o 'ref=e[0-9]*' | head -1)
PWR=$(echo "$SNAP" | grep 'textbox' | grep -o 'ref=e[0-9]*' | sed -n '2p')
echo "$(ts) id=$IDR pw=$PWR"
timeout 20 agent-browser fill @$IDR "tester02" >/dev/null 2>&1
timeout 20 agent-browser fill @$PWR "Test1234pass" >/dev/null 2>&1
sleep 1
# submit: the button labeled "Masuk" inside the form (re-snapshot for fresh ref)
SUB=$(timeout 25 agent-browser snapshot 2>/dev/null | grep 'button "Masuk"' | grep -o 'ref=e[0-9]*' | tail -1)
echo "$(ts) submit ref=$SUB"
timeout 20 agent-browser click @$SUB >/dev/null 2>&1
sleep 5

# verify dashboard
echo "$(ts) verify dashboard"
DASH=$(timeout 25 agent-browser snapshot 2>/dev/null | grep -o 'Halo, [a-z0-9]*' | head -1)
echo "$(ts) dashboard: $DASH"

# If not on dashboard, try clicking the hero "Mulai Gratis" alternative... but we need login.
# Go to analyze
AB=$(timeout 25 agent-browser snapshot 2>/dev/null | grep 'button "Analisis Kontrak Baru"' | grep -o 'ref=e[0-9]*' | head -1)
echo "$(ts) analyze-btn ref=$AB"
if [ -n "$AB" ]; then
  timeout 20 agent-browser click @$AB >/dev/null 2>&1
  sleep 3
  TAR=$(timeout 25 agent-browser snapshot 2>/dev/null | grep 'Tempel teks kontrak' | grep -o 'ref=e[0-9]*' | head -1)
  echo "$(ts) textarea ref=$TAR"
  timeout 25 agent-browser fill @$TAR "$(cat /tmp/contract.txt)" >/dev/null 2>&1
  sleep 1
  SB=$(timeout 25 agent-browser snapshot 2>/dev/null | grep 'button "Mulai Analisis"' | grep -o 'ref=e[0-9]*' | head -1)
  echo "$(ts) start-btn ref=$SB"
  timeout 20 agent-browser click @$SB >/dev/null 2>&1

  echo "$(ts) polling for result..."
  FOUND=""
  for i in $(seq 1 30); do
    sleep 3
    SNAP=$(timeout 20 agent-browser snapshot 2>/dev/null)
    if echo "$SNAP" | grep -q "Temuan Klausul"; then
      echo "$(ts) RESULT after ~$((i*3))s"; FOUND="yes"; break
    fi
    if echo "$SNAP" | grep -q "Permintaan gagal"; then
      echo "$(ts) ERROR after ~$((i*3))s"; break
    fi
  done

  if [ -n "$FOUND" ]; then
    echo "=== RESULT SNAPSHOT ==="
    timeout 25 agent-browser snapshot 2>/dev/null | sed -n '1,60p'
    timeout 25 agent-browser screenshot /tmp/kp-result.png 2>&1 | tail -1
  fi
else
  echo "$(ts) not on dashboard, skipping analyze"
  timeout 25 agent-browser snapshot 2>/dev/null | sed -n '1,20p'
fi

echo "=== server log: analyze POST? ==="
tail -30 /tmp/kp-next.log | grep -E "POST /api/(auth|analyze)|error|⨯" | head -10
kill $SRV 2>/dev/null
echo "$(ts) DONE"
