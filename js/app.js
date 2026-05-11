/**
 * Soul Cosmos - 主应用逻辑
 */

// ========== 星空背景 ==========
function initStarfield() {
  const canvas = document.getElementById('starfield');
  const ctx = canvas.getContext('2d');
  let stars = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createStars() {
    stars = [];
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.8 + 0.2,
        speed: Math.random() * 0.02 + 0.005,
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(s => {
      s.alpha += Math.sin(Date.now() * s.speed) * 0.01;
      s.alpha = Math.max(0.1, Math.min(1, s.alpha));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  resize();
  createStars();
  draw();
  window.addEventListener('resize', () => { resize(); createStars(); });
}

// ========== 页面滚动 ==========
function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

// ========== 导航滚动效果 ==========
window.addEventListener('scroll', () => {
  const nav = document.getElementById('nav');
  if (window.scrollY > 50) {
    nav.style.background = 'rgba(10,10,26,0.95)';
  } else {
    nav.style.background = 'rgba(10,10,26,0.8)';
  }
});

// ========== MBTI 选择 ==========
let selectedMBTI = null;

document.querySelectorAll('.mbti-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mbti-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedMBTI = btn.dataset.type;
    const nextBtn = document.getElementById('mbtiNextBtn');
    nextBtn.disabled = false;
    nextBtn.textContent = `Generate Soul Profile →`;
  });
});

// ========== 步骤切换 ==========
function showStep(num) {
  document.querySelectorAll('.try-step').forEach(s => s.classList.remove('active'));
  document.getElementById('step' + num)?.classList.add('active');
}

function nextStep(num) {
  showStep(num);
}

function prevStep(num) {
  showStep(num);
}

// ========== 生成灵魂画像 ==========
function generateProfile() {
  if (!selectedMBTI) return;

  showStep(3);

  // 模拟加载过程
  const loadingBar = document.getElementById('loadingBar');
  const loadingSteps = document.querySelectorAll('.ls-item');
  let progress = 0;

  const interval = setInterval(() => {
    progress += Math.random() * 15 + 5;
    if (progress > 100) progress = 100;
    loadingBar.style.width = progress + '%';

    // 激活加载步骤
    const stepIndex = Math.floor((progress / 100) * loadingSteps.length);
    loadingSteps.forEach((s, i) => {
      s.classList.toggle('active', i <= stepIndex);
    });

    if (progress >= 100) {
      clearInterval(interval);
      setTimeout(showResult, 500);
    }
  }, 300);
}

function showResult() {
  const birthDate = document.getElementById('birthDate').value;
  const birthTime = document.getElementById('birthTime').value;
  const birthCity = document.getElementById('birthCity').value;

  // 计算星盘
  const natalChart = Astrology.getNatalChart(birthDate, birthTime, birthCity);

  // 计算紫微斗数
  const ziweiChart = Astrology.getZiweiChart(birthDate);

  // 生成灵魂画像
  const profile = ProfileEngine.generate(natalChart, selectedMBTI, ziweiChart);

  // 渲染结果
  document.getElementById('loadingState').classList.add('hidden');
  document.getElementById('resultState').classList.remove('hidden');

  // 关键词
  document.getElementById('resultKeywords').textContent = profile.keywords.join(' · ');

  // 画像描述
  document.getElementById('resultPortrait').textContent = profile.portrait;

  // 星座标签
  const zodiacEl = document.getElementById('resultZodiac');
  zodiacEl.innerHTML = [
    `☀ ${natalChart.sun.symbol} ${natalChart.sun.name} Sun`,
    `☽ ${natalChart.moon.symbol} ${natalChart.moon.name} Moon`,
    `↑ ${natalChart.rising.symbol} ${natalChart.rising.name} Rising`,
    `🧠 ${selectedMBTI}`,
    `☯ ${ziweiChart.mainStar}`,
  ].map(t => `<span class="zodiac-tag">${t}</span>`).join('');

  // 核心特质
  const traitsEl = document.getElementById('resultTraits');
  traitsEl.innerHTML = profile.traits.map(t =>
    `<div class="trait-item"><strong>${t.trait}</strong> — ${t.desc}</div>`
  ).join('');

  // 阴影面
  const shadowsEl = document.getElementById('resultShadows');
  shadowsEl.innerHTML = profile.shadows.map(s =>
    `<div class="shadow-item"><strong>${s.challenge}</strong> — ${s.desc}</div>`
  ).join('');

  // 人生主题
  document.getElementById('resultTheme').textContent = profile.lifeTheme;

  // 每日洞察
  document.getElementById('resultDaily').textContent = profile.dailyInsight;
}

// ========== 重置 ==========
function resetProfile() {
  selectedMBTI = null;
  document.querySelectorAll('.mbti-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById('mbtiNextBtn').disabled = true;
  document.getElementById('mbtiNextBtn').textContent = 'Select your type to continue';
  document.getElementById('loadingState').classList.remove('hidden');
  document.getElementById('resultState').classList.add('hidden');
  document.getElementById('loadingBar').style.width = '0%';
  document.querySelectorAll('.ls-item').forEach(s => s.classList.remove('active'));
  showStep(1);
}

// ========== 分享 ==========
function shareProfile() {
  const keywords = document.getElementById('resultKeywords').textContent;
  const text = `✦ My Soul Profile: ${keywords}\n\nDiscover yours at Soul Cosmos ✦`;

  if (navigator.share) {
    navigator.share({ title: 'My Soul Profile', text });
  } else {
    navigator.clipboard.writeText(text).then(() => {
      alert('Soul Profile copied to clipboard! Share it with your friends ✦');
    });
  }
}

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
  initStarfield();
});
