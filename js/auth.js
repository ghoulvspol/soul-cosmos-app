/**
 * Soul Cosmos - 前端认证模块
 * 管理 JWT token、用户状态、登录/注册 UI
 */
const Auth = (() => {
  const TOKEN_KEY = 'soul_token';
  const USER_KEY = 'soul_user';

  let currentUser = null;

  // 初始化：从 localStorage 恢复登录状态
  function init() {
    const token = localStorage.getItem(TOKEN_KEY);
    const user = localStorage.getItem(USER_KEY);
    if (token && user) {
      try {
        currentUser = JSON.parse(user);
        updateUI();
        loadUserData();
      } catch {
        logout();
      }
    }
  }

  // 获取 token
  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  // 是否已登录
  function isLoggedIn() {
    return !!getToken() && !!currentUser;
  }

  // 获取当前用户
  function getUser() {
    return currentUser;
  }

  // 通用 fetch 封装（自动带 auth header）
  async function authFetch(url, options = {}) {
    const token = getToken();
    if (token) {
      options.headers = { ...options.headers, Authorization: `Bearer ${token}` };
    }
    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      options.headers = { 'Content-Type': 'application/json', ...options.headers };
      options.body = JSON.stringify(options.body);
    }
    return fetch(url, options);
  }

  // 注册
  async function register(email, password, nickname) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, nickname })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    saveSession(data.token, data.user);
    return data.user;
  }

  // 登录
  async function login(email, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    saveSession(data.token, data.user);
    return data.user;
  }

  // 登出
  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    currentUser = null;
    updateUI();
  }

  // 保存会话
  function saveSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    currentUser = user;
    updateUI();
    loadUserData();
    migrateLocalData();
  }

  // 更新 UI 状态
  function updateUI() {
    const loginBtn = document.getElementById('authLoginBtn');
    const userMenu = document.getElementById('authUserMenu');
    const userName = document.getElementById('authUserName');
    const profilesSection = document.getElementById('myProfilesSection');

    if (!loginBtn || !userMenu) return;

    if (isLoggedIn()) {
      loginBtn.style.display = 'none';
      userMenu.style.display = 'flex';
      if (userName) userName.textContent = currentUser.nickname || currentUser.email;
      if (profilesSection) profilesSection.style.display = '';
    } else {
      loginBtn.style.display = '';
      userMenu.style.display = 'none';
      if (profilesSection) profilesSection.style.display = 'none';
    }
  }

  // 登录后加载用户数据
  async function loadUserData() {
    if (!isLoggedIn()) return;
    try {
      // 加载圈子数据
      const circleRes = await authFetch('/api/user/circle');
      const circleData = await circleRes.json();
      if (circleData.success && circleData.members.length > 0) {
        // 合并服务端数据到 localStorage（服务端数据优先）
        const localCircle = JSON.parse(localStorage.getItem('soul_circle') || '[]');
        const serverIds = new Set(circleData.members.map(m => m.id));
        // 保留本地独有的，加上服务端的
        const merged = [
          ...circleData.members.map(m => ({
            id: m.id, name: m.name, relation: m.relation,
            birthDate: m.birth_date, mbti: m.mbti_type, zodiac: m.zodiac_data
          })),
          ...localCircle.filter(l => !l.id || !serverIds.has(l.id))
        ];
        localStorage.setItem('soul_circle', JSON.stringify(merged));
      }

      // 加载画像列表（存到 window 供首页使用）
      const profileRes = await authFetch('/api/user/profile');
      const profileData = await profileRes.json();
      if (profileData.success) {
        window._userProfiles = profileData.profiles;
        renderProfileHistory();
      }
    } catch (err) {
      console.warn('Failed to load user data:', err);
    }
  }

  // 迁移 localStorage 数据到服务端
  async function migrateLocalData() {
    if (!isLoggedIn()) return;
    const circle = JSON.parse(localStorage.getItem('soul_circle') || '[]');
    const feedback = JSON.parse(localStorage.getItem('soul_memory') || '{}');

    if (circle.length === 0 && (!feedback.feedback || feedback.feedback.length === 0)) return;

    try {
      await authFetch('/api/user/migrate', {
        method: 'POST',
        body: { circle, feedback }
      });
    } catch (err) {
      console.warn('Migration failed:', err);
    }
  }

  // 保存画像到服务端
  async function saveProfile(profileData) {
    if (!isLoggedIn()) return null;
    try {
      const res = await authFetch('/api/user/profile', {
        method: 'POST',
        body: profileData
      });
      const data = await res.json();
      return data.success ? data.id : null;
    } catch {
      return null;
    }
  }

  // 保存分析历史
  async function saveAnalysis(type, inputData, resultData, model) {
    if (!isLoggedIn()) return null;
    try {
      const res = await authFetch('/api/user/history', {
        method: 'POST',
        body: { type, input_data: inputData, result_data: resultData, model }
      });
      const data = await res.json();
      return data.success ? data.id : null;
    } catch {
      return null;
    }
  }

  // 保存反馈到服务端
  async function saveFeedback(feedbackType, insightType, content, analysisId) {
    if (!isLoggedIn()) return;
    try {
      await authFetch('/api/user/feedback', {
        method: 'POST',
        body: { feedback_type: feedbackType, insight_type: insightType, content, analysis_id: analysisId }
      });
    } catch (err) {
      console.warn('Failed to save feedback:', err);
    }
  }

  // 渲染历史画像列表
  function renderProfileHistory() {
    const container = document.getElementById('profileHistory');
    if (!container || !window._userProfiles) return;

    const profiles = window._userProfiles;
    if (profiles.length === 0) {
      container.innerHTML = '<p style="color:#5a5a6a;font-size:13px;text-align:center;padding:20px">暂无历史画像，生成你的第一份灵魂画像吧</p>';
      return;
    }

    container.innerHTML = profiles.map(p => `
      <div class="profile-card" onclick="Auth.viewProfile(${p.id})" style="cursor:pointer;padding:14px 16px;border:1px solid rgba(255,255,255,0.06);border-radius:10px;margin-bottom:8px;background:rgba(255,255,255,0.02);transition:all .2s">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <span style="color:#a78bfa;font-weight:600;font-size:13px">${p.mbti_type || '?'}</span>
            <span style="color:#5a5a6a;font-size:12px;margin-left:8px">${p.birth_date}</span>
            <span style="color:#5a5a6a;font-size:12px;margin-left:8px">${p.birth_city || ''}</span>
          </div>
          <span style="color:#5a5a6a;font-size:11px">${new Date(p.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    `).join('');
  }

  // 查看历史画像详情
  async function viewProfile(id) {
    try {
      const res = await authFetch(`/api/user/profile/${id}`);
      const data = await res.json();
      if (data.success && data.profile.soul_profile) {
        // 复用现有渲染逻辑 (renderResult expects: profile, natalChart, ziweiChart, model)
        if (typeof renderResult === 'function') {
          const p = data.profile;
          renderResult(
            p.soul_profile,
            p.natal_chart || null,
            p.ziwei_chart || null,
            'history'
          );
        }
      }
    } catch (err) {
      console.warn('Failed to load profile:', err);
    }
  }

  // ============ UI：登录/注册弹窗 ============

  function showAuthModal(mode = 'login') {
    let modal = document.getElementById('authModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'authModal';
      document.body.appendChild(modal);
    }

    const isLogin = mode === 'login';
    modal.innerHTML = `
      <div class="auth-overlay" onclick="Auth.closeModal()" style="position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);z-index:9999;display:flex;align-items:center;justify-content:center">
        <div onclick="event.stopPropagation()" style="background:#1a1a2e;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:32px;width:380px;max-width:90vw;position:relative">
          <button onclick="Auth.closeModal()" style="position:absolute;top:12px;right:14px;background:none;border:none;color:#5a5a6a;font-size:18px;cursor:pointer">&times;</button>
          <h3 style="color:#e2e8f0;font-size:18px;margin-bottom:4px">${isLogin ? '欢迎回来' : '创建账号'}</h3>
          <p style="color:#5a5a6a;font-size:13px;margin-bottom:20px">${isLogin ? '登录以保存你的灵魂画像' : '注册后自动保存画像和历史'}</p>
          <div id="authError" style="display:none;color:#f87171;font-size:12px;margin-bottom:12px;padding:8px;background:rgba(248,113,113,0.1);border-radius:8px"></div>
          ${!isLogin ? '<input id="authNickname" placeholder="昵称" style="width:100%;padding:10px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#e2e8f0;font-size:13px;margin-bottom:10px;outline:none">' : ''}
          <input id="authEmail" type="email" placeholder="邮箱" style="width:100%;padding:10px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#e2e8f0;font-size:13px;margin-bottom:10px;outline:none">
          <input id="authPassword" type="password" placeholder="密码（至少6位）" style="width:100%;padding:10px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#e2e8f0;font-size:13px;margin-bottom:16px;outline:none">
          <button id="authSubmitBtn" onclick="Auth.submitAuth('${mode}')" style="width:100%;padding:12px;background:linear-gradient(135deg,#a78bfa,#6366f1);border:none;border-radius:8px;color:white;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s">${isLogin ? '登录' : '注册'}</button>
          <p style="text-align:center;margin-top:14px;font-size:12px;color:#5a5a6a">
            ${isLogin ? '还没有账号？' : '已有账号？'}
            <a href="#" onclick="Auth.showAuthModal('${isLogin ? 'register' : 'login'}');return false" style="color:#a78bfa;text-decoration:none">${isLogin ? '立即注册' : '去登录'}</a>
          </p>
        </div>
      </div>
    `;
    // 回车提交
    setTimeout(() => {
      const pw = document.getElementById('authPassword');
      if (pw) pw.addEventListener('keydown', e => { if (e.key === 'Enter') Auth.submitAuth(mode); });
    }, 50);
  }

  function closeModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.innerHTML = '';
  }

  async function submitAuth(mode) {
    const email = document.getElementById('authEmail')?.value?.trim();
    const password = document.getElementById('authPassword')?.value;
    const nickname = document.getElementById('authNickname')?.value?.trim();
    const errorEl = document.getElementById('authError');
    const btn = document.getElementById('authSubmitBtn');

    if (!email || !password) {
      showAuthError('请填写邮箱和密码');
      return;
    }

    btn.disabled = true;
    btn.textContent = mode === 'login' ? '登录中...' : '注册中...';

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, nickname);
      }
      closeModal();
    } catch (err) {
      showAuthError(err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = mode === 'login' ? '登录' : '注册';
    }
  }

  function showAuthError(msg) {
    const el = document.getElementById('authError');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
  }

  // ============ 订阅管理 ============

  let _subscription = null;

  async function checkSubscription() {
    if (!isLoggedIn()) { _subscription = null; return; }
    try {
      const res = await authFetch('/api/stripe/status');
      const data = await res.json();
      if (data.success) {
        _subscription = data;
        updatePremiumUI();
      }
    } catch { /* ignore */ }
  }

  function isPremium() {
    return _subscription?.isPremium === true;
  }

  async function checkout(plan) {
    if (!isLoggedIn()) { showAuthModal('login'); return; }
    try {
      const res = await authFetch('/api/stripe/checkout', { method: 'POST', body: { plan } });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error || 'Checkout failed');
    } catch (err) { alert('Checkout error: ' + err.message); }
  }

  async function openPortal() {
    try {
      const res = await authFetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) { alert('Portal error: ' + err.message); }
  }

  function updatePremiumUI() {
    const badge = document.getElementById('premiumBadge');
    const unlockBtn = document.getElementById('unlockBtn');
    const manageBtn = document.getElementById('manageSubBtn');

    if (isPremium()) {
      if (badge) badge.style.display = 'inline-block';
      if (unlockBtn) unlockBtn.style.display = 'none';
      if (manageBtn) manageBtn.style.display = '';
    } else {
      if (badge) badge.style.display = 'none';
      if (unlockBtn) unlockBtn.style.display = '';
      if (manageBtn) manageBtn.style.display = 'none';
    }
  }

  // 页面加载时初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { init(); checkSubscription(); });
  } else {
    init(); checkSubscription();
  }

  return {
    init, getToken, isLoggedIn, getUser, authFetch,
    register, login, logout, saveProfile, saveAnalysis, saveFeedback,
    showAuthModal, closeModal, submitAuth, viewProfile, renderProfileHistory,
    loadUserData, updateUI,
    isPremium, checkout, openPortal, checkSubscription
  };
})();
