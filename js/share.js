/**
 * Soul Cosmos - 分享卡片生成器
 * Canvas 绘制精美灵魂画像卡片，支持下载和社交分享
 */
const ShareCard = (() => {
  const W = 1080, H = 1920;

  /**
   * 生成分享卡片并触发下载
   */
  async function generateCard(profile) {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // 1. 背景
    drawBackground(ctx);

    // 2. 顶部品牌
    drawHeader(ctx);

    // 3. 关键词
    const keywords = profile.soulKeywords || profile.keywords || [];
    drawKeywords(ctx, keywords);

    // 4. 画像描述
    const portrait = profile.oneSentencePortrait || profile.portrait || '';
    drawPortrait(ctx, portrait);

    // 5. 星座/MBTI 标签
    drawTags(ctx);

    // 6. 核心特质
    const traits = profile.coreTraits || [];
    drawTraits(ctx, traits);

    // 7. 阴影面
    const shadows = profile.shadows || [];
    drawShadows(ctx, shadows);

    // 8. 人生主题
    const theme = profile.lifeTheme || '';
    drawTheme(ctx, theme);

    // 9. 底部 CTA
    drawFooter(ctx);

    return canvas;
  }

  function drawBackground(ctx) {
    // 深色渐变背景
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#0a0a1a');
    grad.addColorStop(0.5, '#0f0f2e');
    grad.addColorStop(1, '#0a0a1a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // 星点装饰
    ctx.fillStyle = 'rgba(167,139,250,0.15)';
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const r = Math.random() * 2 + 0.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 顶部光晕
    const glow = ctx.createRadialGradient(W / 2, 200, 0, W / 2, 200, 500);
    glow.addColorStop(0, 'rgba(167,139,250,0.08)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, 500);
  }

  function drawHeader(ctx) {
    // 品牌名
    ctx.textAlign = 'center';
    ctx.fillStyle = '#a78bfa';
    ctx.font = '600 36px Inter, sans-serif';
    ctx.fillText('✦ Soul Cosmos', W / 2, 100);

    ctx.fillStyle = '#5a5a6a';
    ctx.font = '400 24px Inter, sans-serif';
    ctx.fillText('Multi-Dimensional Soul Profile', W / 2, 140);

    // 分割线
    ctx.strokeStyle = 'rgba(167,139,250,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(200, 170);
    ctx.lineTo(W - 200, 170);
    ctx.stroke();
  }

  function drawKeywords(ctx, keywords) {
    if (!keywords.length) return;
    ctx.textAlign = 'center';

    // 关键词渐变色
    const grad = ctx.createLinearGradient(200, 0, W - 200, 0);
    grad.addColorStop(0, '#a78bfa');
    grad.addColorStop(0.5, '#60a5fa');
    grad.addColorStop(1, '#22d3ee');

    ctx.fillStyle = grad;
    ctx.font = '700 52px Inter, sans-serif';
    ctx.fillText(keywords.join('  ·  '), W / 2, 260);
  }

  function drawPortrait(ctx, portrait) {
    if (!portrait) return;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '400 28px Inter, sans-serif';

    // 自动换行
    const maxWidth = W - 200;
    const lines = wrapText(ctx, portrait, maxWidth);
    lines.forEach((line, i) => {
      ctx.fillText(line, W / 2, 340 + i * 42);
    });
  }

  function drawTags(ctx) {
    const sunSign = window._lastNatalChart?.sun?.name || '';
    const moonSign = window._lastNatalChart?.moon?.name || '';
    const mbti = window.selectedMBTI || '';
    const ziwei = window._lastZiweiChart?.mainStar || '';

    const tags = [sunSign, moonSign, mbti, ziwei].filter(Boolean);
    if (!tags.length) return;

    const tagY = 460;
    const tagW = 160;
    const gap = 20;
    const totalW = tags.length * tagW + (tags.length - 1) * gap;
    let startX = (W - totalW) / 2;

    ctx.textAlign = 'center';
    tags.forEach((tag, i) => {
      const x = startX + i * (tagW + gap);
      // 背景框
      ctx.fillStyle = 'rgba(167,139,250,0.08)';
      roundRect(ctx, x, tagY, tagW, 48, 24);
      ctx.fill();
      ctx.strokeStyle = 'rgba(167,139,250,0.2)';
      ctx.lineWidth = 1;
      roundRect(ctx, x, tagY, tagW, 48, 24);
      ctx.stroke();
      // 文字
      ctx.fillStyle = '#a78bfa';
      ctx.font = '500 22px Inter, sans-serif';
      ctx.fillText(tag, x + tagW / 2, tagY + 32);
    });
  }

  function drawTraits(ctx, traits) {
    if (!traits.length) return;
    const startY = 560;
    ctx.textAlign = 'left';

    ctx.fillStyle = '#a78bfa';
    ctx.font = '600 28px Inter, sans-serif';
    ctx.fillText('✦ Core Traits', 80, startY);

    traits.slice(0, 3).forEach((t, i) => {
      const y = startY + 50 + i * 100;
      // 标题
      ctx.fillStyle = '#f8fafc';
      ctx.font = '600 24px Inter, sans-serif';
      ctx.fillText(t.trait || '', 80, y);
      // 描述（截断）
      ctx.fillStyle = '#94a3b8';
      ctx.font = '400 22px Inter, sans-serif';
      const desc = (t.description || '').slice(0, 80) + ((t.description || '').length > 80 ? '...' : '');
      const lines = wrapText(ctx, desc, W - 160);
      lines.slice(0, 2).forEach((line, li) => {
        ctx.fillText(line, 80, y + 32 + li * 32);
      });
    });
  }

  function drawShadows(ctx, shadows) {
    if (!shadows.length) return;
    const startY = 920;
    ctx.textAlign = 'left';

    ctx.fillStyle = '#fb7185';
    ctx.font = '600 28px Inter, sans-serif';
    ctx.fillText('◐ Shadow Side', 80, startY);

    shadows.slice(0, 2).forEach((s, i) => {
      const y = startY + 50 + i * 80;
      ctx.fillStyle = '#f8fafc';
      ctx.font = '600 24px Inter, sans-serif';
      ctx.fillText(s.challenge || '', 80, y);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '400 22px Inter, sans-serif';
      const desc = (s.description || '').slice(0, 80) + ((s.description || '').length > 80 ? '...' : '');
      const lines = wrapText(ctx, desc, W - 160);
      lines.slice(0, 2).forEach((line, li) => {
        ctx.fillText(line, 80, y + 32 + li * 32);
      });
    });
  }

  function drawTheme(ctx, theme) {
    if (!theme) return;
    const startY = 1180;
    ctx.textAlign = 'left';

    ctx.fillStyle = '#34d399';
    ctx.font = '600 28px Inter, sans-serif';
    ctx.fillText('✧ Life Theme', 80, startY);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '400 24px Inter, sans-serif';
    const lines = wrapText(ctx, theme.slice(0, 120), W - 160);
    lines.slice(0, 3).forEach((line, i) => {
      ctx.fillText(line, 80, startY + 45 + i * 36);
    });
  }

  function drawFooter(ctx) {
    const y = H - 180;

    // 分割线
    ctx.strokeStyle = 'rgba(167,139,250,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(200, y);
    ctx.lineTo(W - 200, y);
    ctx.stroke();

    // CTA
    ctx.textAlign = 'center';
    ctx.fillStyle = '#a78bfa';
    ctx.font = '600 28px Inter, sans-serif';
    ctx.fillText('Discover Your Soul Profile', W / 2, y + 50);

    ctx.fillStyle = '#5a5a6a';
    ctx.font = '400 22px Inter, sans-serif';
    ctx.fillText('soul-cosmos.app', W / 2, y + 90);

    // 免责声明
    ctx.fillStyle = '#3a3a4a';
    ctx.font = '400 16px Inter, sans-serif';
    ctx.fillText('For entertainment purposes only', W / 2, y + 130);
  }

  // 工具函数：圆角矩形
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // 工具函数：文本换行
  function wrapText(ctx, text, maxWidth) {
    const words = text.split('');
    const lines = [];
    let line = '';
    for (const char of words) {
      const test = line + char;
      if (ctx.measureText(test).width > maxWidth) {
        lines.push(line);
        line = char;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  /**
   * 下载卡片为 PNG
   */
  async function downloadCard(profile) {
    const canvas = await generateCard(profile);
    const link = document.createElement('a');
    link.download = 'soul-cosmos-profile.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  /**
   * 分享卡片（优先 Web Share API，降级下载）
   */
  async function shareCard(profile) {
    const canvas = await generateCard(profile);

    if (navigator.share && navigator.canShare) {
      canvas.toBlob(async (blob) => {
        const file = new File([blob], 'soul-cosmos-profile.png', { type: 'image/png' });
        try {
          await navigator.share({
            title: 'My Soul Profile — Soul Cosmos',
            text: 'Discover your multi-dimensional soul profile ✦',
            files: [file]
          });
        } catch {
          // 用户取消或不支持 file share，降级为下载
          downloadCard(profile);
        }
      }, 'image/png');
    } else {
      downloadCard(profile);
    }
  }

  return { generateCard, downloadCard, shareCard };
})();
