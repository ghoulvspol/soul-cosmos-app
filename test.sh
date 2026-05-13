#!/bin/bash
# Soul Cosmos - 全量 API 测试
BASE="http://localhost:8066"
PASS=0; FAIL=0; TOTAL=0

assert() {
  TOTAL=$((TOTAL+1))
  local desc="$1" actual="$2" expected="$3"
  if echo "$actual" | grep -q "$expected"; then
    PASS=$((PASS+1)); echo "  ✅ $desc"
  else
    FAIL=$((FAIL+1)); echo "  ❌ $desc (expected: $expected)"
    echo "     got: $(echo "$actual" | head -c 120)"
  fi
}

echo "========================================="
echo "  Soul Cosmos 全量 API 测试"
echo "========================================="
echo ""

# ===== 1. Health =====
echo "── 1. Health Check ──"
RES=$(curl -s $BASE/api/health)
assert "GET /api/health" "$RES" '"status":"ok"'

# ===== 2. Auth =====
echo ""
echo "── 2. Auth 认证 ──"

# Register
RES=$(curl -s -X POST $BASE/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@test.com","password":"test123","nickname":"TestUser"}')
assert "POST /api/auth/register" "$RES" '"success":true'
TOKEN=$(echo "$RES" | node -p "JSON.parse(require('fs').readFileSync('/dev/stdin','utf-8')).token" 2>/dev/null)
assert "Register returns token" "$TOKEN" "eyJ"

# Duplicate register
RES=$(curl -s -X POST $BASE/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@test.com","password":"test123"}')
assert "Duplicate register rejected" "$RES" 'already registered'

# Login
RES=$(curl -s -X POST $BASE/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@test.com","password":"test123"}')
assert "POST /api/auth/login" "$RES" '"success":true'
TOKEN=$(echo "$RES" | node -p "JSON.parse(require('fs').readFileSync('/dev/stdin','utf-8')).token" 2>/dev/null)

# Wrong password
RES=$(curl -s -X POST $BASE/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@test.com","password":"wrong"}')
assert "Wrong password rejected" "$RES" 'Invalid email or password'

# Get me
RES=$(curl -s $BASE/api/auth/me -H "Authorization: Bearer $TOKEN")
assert "GET /api/auth/me" "$RES" '"email":"test@test.com"'

# No auth
RES=$(curl -s $BASE/api/auth/me)
assert "GET /api/auth/me without token" "$RES" '"Login required"'

# ===== 3. Profile =====
echo ""
echo "── 3. User Profile 画像 ──"

# Save profile
RES=$(curl -s -X POST $BASE/api/user/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"birth_date":"1995-06-15","birth_time":"14:30","birth_city":"new_york","gender":"female","mbti_type":"INFJ","natal_chart":{"sun":{"name":"Gemini"},"moon":{"name":"Scorpio"}},"soul_profile":{"soulKeywords":["Intense","Perceptive"],"oneSentencePortrait":"Test portrait"}}')
assert "POST /api/user/profile" "$RES" '"success":true'
PROFILE_ID=$(echo "$RES" | node -p "JSON.parse(require('fs').readFileSync('/dev/stdin','utf-8')).id" 2>/dev/null)

# List profiles
RES=$(curl -s $BASE/api/user/profile -H "Authorization: Bearer $TOKEN")
assert "GET /api/user/profile" "$RES" '"success":true'
assert "Profile has data" "$RES" '1995-06-15'

# Get single profile
RES=$(curl -s $BASE/api/user/profile/$PROFILE_ID -H "Authorization: Bearer $TOKEN")
assert "GET /api/user/profile/:id" "$RES" '"success":true'

# No auth
RES=$(curl -s $BASE/api/user/profile)
assert "Profile without auth returns empty" "$RES" '"profiles":\[\]'

# ===== 4. Analysis History =====
echo ""
echo "── 4. Analysis History 分析历史 ──"

# Save analysis
RES=$(curl -s -X POST $BASE/api/user/history \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"type":"profile","input_data":{"mbti":"INFJ"},"result_data":{"keywords":["test"]},"model":"mimo"}')
assert "POST /api/user/history" "$RES" '"success":true'
HIST_ID=$(echo "$RES" | node -p "JSON.parse(require('fs').readFileSync('/dev/stdin','utf-8')).id" 2>/dev/null)

# List history
RES=$(curl -s "$BASE/api/user/history?limit=10" -H "Authorization: Bearer $TOKEN")
assert "GET /api/user/history" "$RES" '"success":true'

# Get single history
RES=$(curl -s $BASE/api/user/history/$HIST_ID -H "Authorization: Bearer $TOKEN")
assert "GET /api/user/history/:id" "$RES" '"success":true'

# ===== 5. Feedback + KEPA =====
echo ""
echo "── 5. Feedback + KEPA 反馈飞轮 ──"

# Save accurate feedback
RES=$(curl -s -X POST $BASE/api/user/feedback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"feedback_type":"accurate","insight_type":"career","content":"Career analysis was spot on"}')
assert "POST /api/user/feedback (accurate)" "$RES" '"success":true'

# Save inaccurate feedback
RES=$(curl -s -X POST $BASE/api/user/feedback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"feedback_type":"inaccurate","insight_type":"marriage","content":"Marriage prediction was off"}')
assert "POST /api/user/feedback (inaccurate)" "$RES" '"success":true'

# Get feedback
RES=$(curl -s $BASE/api/user/feedback -H "Authorization: Bearer $TOKEN")
assert "GET /api/user/feedback" "$RES" '"success":true'

# KEPA status
RES=$(curl -s $BASE/api/user/kepa -H "Authorization: Bearer $TOKEN")
assert "GET /api/user/kepa" "$RES" '"success":true'
assert "KEPA has weights" "$RES" '"agent_name"'

# Manual KEPA review
RES=$(curl -s -X POST $BASE/api/user/kepa/review -H "Authorization: Bearer $TOKEN")
assert "POST /api/user/kepa/review" "$RES" '"success":true'

# ===== 6. Circle =====
echo ""
echo "── 6. Circle 圈子 ──"

# Add member
RES=$(curl -s -X POST $BASE/api/user/circle \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Sarah","relation":"friend","birth_date":"1996-03-20","mbti_type":"ENFP","zodiac_data":{"name":"Pisces","element":"Water"}}')
assert "POST /api/user/circle" "$RES" '"success":true'
CIRCLE_ID=$(echo "$RES" | node -p "JSON.parse(require('fs').readFileSync('/dev/stdin','utf-8')).id" 2>/dev/null)

# List members
RES=$(curl -s $BASE/api/user/circle -H "Authorization: Bearer $TOKEN")
assert "GET /api/user/circle" "$RES" '"success":true'
assert "Circle has Sarah" "$RES" 'Sarah'

# Delete member
RES=$(curl -s -X DELETE $BASE/api/user/circle/$CIRCLE_ID -H "Authorization: Bearer $TOKEN")
assert "DELETE /api/user/circle/:id" "$RES" '"success":true'

# ===== 7. Daily Fortune =====
echo ""
echo "── 7. Daily Fortune 每日运势 ──"

RES=$(curl -s $BASE/api/daily/today)
assert "GET /api/daily/today" "$RES" '"success":true'
assert "Has dayGanZhi" "$RES" '"dayGanZhi"'
assert "Has yi items" "$RES" '"yi"'
assert "Has ji items" "$RES" '"ji"'
assert "Has luckyHours" "$RES" '"luckyHours"'

RES=$(curl -s $BASE/api/daily/2026-01-01)
assert "GET /api/daily/:date" "$RES" '"success":true'

RES=$(curl -s $BASE/api/daily/invalid)
assert "Invalid date format rejected" "$RES" '"Invalid date format"'

# ===== 8. Stripe =====
echo ""
echo "── 8. Stripe 订阅 ──"

RES=$(curl -s $BASE/api/stripe/status -H "Authorization: Bearer $TOKEN")
assert "GET /api/stripe/status" "$RES" '"success":true'
assert "Default plan is free" "$RES" '"plan":"free"'

RES=$(curl -s -X POST $BASE/api/stripe/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"plan":"monthly"}')
assert "POST /api/stripe/checkout" "$RES" 'Stripe not configured'

# ===== 9. Hardware =====
echo ""
echo "── 9. Hardware 硬件接口 ──"

RES=$(curl -s $BASE/api/hardware/alarm)
assert "GET /api/hardware/alarm (no auth)" "$RES" '"success":true'

RES=$(curl -s $BASE/api/hardware/alarm?lang=zh -H "Authorization: Bearer $TOKEN")
assert "GET /api/hardware/alarm (with auth)" "$RES" '"success":true'
assert "Alarm has text" "$RES" '"text"'

RES=$(curl -s -X POST $BASE/api/hardware/voice \
  -H "Content-Type: application/json" \
  -d '{"query":"今天适合面试吗","lang":"zh"}')
assert "POST /api/hardware/voice (no auth)" "$RES" '"success":true'

# ===== 10. Harness =====
echo ""
echo "── 10. Multi-Agent Harness ──"

RES=$(curl -s -X POST $BASE/api/harness-profile \
  -H "Content-Type: application/json" \
  -d '{"natalChart":{"sun":{"name":"Gemini","element":"Air","quality":"Mutable"},"moon":{"name":"Scorpio","element":"Water"},"rising":{"name":"Leo","element":"Fire"},"dominantElement":"Air"},"mbtiType":"INFJ","ziweiChart":{"mainStar":"紫微","lifePalace":"命宫","careerPalace":"官禄"},"iching":{"number":1,"name":"乾","english":"The Creative","judgment":"元亨利贞","upperTrigram":"乾","lowerTrigram":"乾","keywords":["创造","领导"]},"lang":"en","gender":"female","birthDate":"1995-06-15","birthTime":"14:30"}')
assert "POST /api/harness-profile" "$RES" '"success":true'

# ===== 11. Migration =====
echo ""
echo "── 11. Data Migration 数据迁移 ──"

RES=$(curl -s -X POST $BASE/api/user/migrate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"circle":[{"name":"Mom","relation":"family","birthDate":"1965-01-01","mbti":"ISFJ","zodiac":{"name":"Capricorn"}}],"feedback":{"feedback":[{"rating":"accurate","content":"test feedback","timestamp":"2026-01-01"}]}}')
assert "POST /api/user/migrate" "$RES" '"success":true'
assert "Migrated circle" "$RES" '"circle":1'

# ===== Summary =====
echo ""
echo "========================================="
echo "  结果: $PASS/$TOTAL 通过, $FAIL 失败"
echo "========================================="
