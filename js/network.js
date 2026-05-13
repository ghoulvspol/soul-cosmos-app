/**
 * Soul Cosmos - 关系网图谱可视化
 * Canvas 绘制多人关系图，展示元素互动和配对分数
 */
const RelationshipNetwork = (() => {
  let canvas, ctx, nodes = [], edges = [], animId;
  let hoveredNode = null;

  const COLORS = {
    '火': '#ef4444', '土': '#eab308', '金': '#a78bfa',
    '水': '#3b82f6', '木': '#22c55e', 'default': '#94a3b8',
  };

  /**
   * 初始化图谱
   */
  function init(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    canvas = document.createElement('canvas');
    canvas.width = container.clientWidth || 600;
    canvas.height = 400;
    canvas.style.cursor = 'pointer';
    container.appendChild(canvas);
    ctx = canvas.getContext('2d');

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('click', onClick);

    render();
  }

  /**
   * 设置节点和边
   */
  function setData(circleMembers, userProfile) {
    nodes = [];
    edges = [];

    // 中心节点：用户自己
    if (userProfile) {
      nodes.push({
        id: 'self', x: canvas.width / 2, y: canvas.height / 2,
        r: 35, label: '我', element: userProfile.element || 'default',
        isCenter: true, data: userProfile,
      });
    }

    // 圈子成员节点（环形排列）
    const cx = canvas.width / 2, cy = canvas.height / 2;
    const radius = Math.min(cx, cy) - 60;
    const count = circleMembers.length;

    circleMembers.forEach((member, i) => {
      const angle = (2 * Math.PI * i / count) - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      const element = member.zodiac?.element || 'default';

      nodes.push({
        id: member.id || i, x, y, r: 25,
        label: member.name?.slice(0, 4) || '?',
        element, data: member, isCenter: false,
      });

      // 与中心连线
      edges.push({
        from: 'self', to: member.id || i,
        score: member.compatibilityScore || null,
        element,
      });
    });
  }

  /**
   * 渲染图谱
   */
  function render() {
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;

    // 清空
    ctx.clearRect(0, 0, w, h);

    // 背景
    ctx.fillStyle = 'rgba(10,10,26,0.95)';
    ctx.fillRect(0, 0, w, h);

    // 绘制边
    edges.forEach(edge => {
      const from = nodes.find(n => n.id === edge.from);
      const to = nodes.find(n => n.id === edge.to);
      if (!from || !to) return;

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = edge.score
        ? (edge.score > 70 ? 'rgba(52,211,153,0.3)' : edge.score > 40 ? 'rgba(251,191,36,0.3)' : 'rgba(248,113,113,0.3)')
        : 'rgba(148,163,184,0.15)';
      ctx.lineWidth = edge.score ? 2 : 1;
      ctx.stroke();

      // 配对分数标签
      if (edge.score) {
        const mx = (from.x + to.x) / 2, my = (from.y + to.y) / 2;
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '500 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${edge.score}%`, mx, my - 6);
      }
    });

    // 绘制节点
    nodes.forEach(node => {
      const color = COLORS[node.element] || COLORS.default;
      const isHovered = hoveredNode === node;

      // 光晕
      if (isHovered || node.isCenter) {
        const glow = ctx.createRadialGradient(node.x, node.y, node.r, node.x, node.y, node.r * 2);
        glow.addColorStop(0, color + '30');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r * 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // 节点圆
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
      ctx.fillStyle = color + '20';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = isHovered ? 3 : 2;
      ctx.stroke();

      // 标签
      ctx.fillStyle = '#e2e8f0';
      ctx.font = `${node.isCenter ? '600 14px' : '500 12px'} Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.label, node.x, node.y);
    });

    // 图例
    drawLegend();
  }

  function drawLegend() {
    const elements = ['火', '土', '金', '水', '木'];
    ctx.font = '400 10px Inter, sans-serif';
    ctx.textAlign = 'left';
    elements.forEach((el, i) => {
      const x = 12, y = 18 + i * 18;
      ctx.fillStyle = COLORS[el];
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(el, x + 12, y + 3);
    });
  }

  function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    hoveredNode = nodes.find(n => Math.hypot(n.x - mx, n.y - my) < n.r + 5) || null;
    canvas.style.cursor = hoveredNode ? 'pointer' : 'default';
    render();

    // Tooltip
    if (hoveredNode && !hoveredNode.isCenter) {
      const d = hoveredNode.data;
      canvas.title = `${d.name} (${d.relation || ''})\n${d.birthDate || ''} ${d.mbti || ''}`;
    }
  }

  function onClick() {
    if (hoveredNode && !hoveredNode.isCenter) {
      // 点击节点显示详情
      const d = hoveredNode.data;
      showNodeDetail(d);
    }
  }

  function showNodeDetail(member) {
    // 复用现有的详情展示逻辑
    const detail = document.getElementById('networkDetail');
    if (!detail) return;

    detail.innerHTML = `
      <div style="padding:16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;margin-top:12px">
        <h4 style="color:#a78bfa;margin-bottom:8px">${member.name}</h4>
        <p style="color:#94a3b8;font-size:12px">关系: ${member.relation || '—'} · 生日: ${member.birthDate || '—'} · MBTI: ${member.mbti || '—'}</p>
        ${member.zodiac ? `<p style="color:#60a5fa;font-size:12px;margin-top:4px">${member.zodiac.symbol || ''} ${member.zodiac.name || ''} · ${member.zodiac.element || ''}</p>` : ''}
      </div>`;
  }

  return { init, setData, render };
})();
