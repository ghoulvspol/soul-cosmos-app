/**
 * Soul Cosmos - Stripe 订阅路由
 * POST /api/stripe/checkout   创建 Checkout Session
 * POST /api/stripe/webhook    Stripe Webhook
 * GET  /api/stripe/status     查询订阅状态
 * POST /api/stripe/portal     客户门户
 */
const express = require('express');
const db = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();

// Stripe 初始化（延迟加载，无 key 时降级）
let stripe = null;
function getStripe() {
  if (stripe) return stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  stripe = require('stripe')(key);
  return stripe;
}

// 价格 ID（需要在 Stripe Dashboard 创建后填入）
const PLANS = {
  monthly: { priceId: process.env.STRIPE_PRICE_MONTHLY || 'price_monthly_placeholder', name: '场景订阅', amount: '$3.99/月' },
  yearly: { priceId: process.env.STRIPE_PRICE_YEARLY || 'price_yearly_placeholder', name: '年度订阅', amount: '$29.99/年' },
};

// 创建 Checkout Session
router.post('/checkout', requireAuth, async (req, res) => {
  const s = getStripe();
  if (!s) return res.status(503).json({ success: false, error: 'Stripe not configured' });

  const { plan } = req.body;
  const planConfig = PLANS[plan];
  if (!planConfig) return res.status(400).json({ success: false, error: 'Invalid plan' });

  try {
    // 获取或创建 Stripe Customer
    let sub = db.prepare('SELECT stripe_customer_id FROM subscriptions WHERE user_id = ?').get(req.user.id);
    let customerId = sub?.stripe_customer_id;

    if (!customerId) {
      const user = db.prepare('SELECT email, nickname FROM users WHERE id = ?').get(req.user.id);
      const customer = await s.customers.create({
        email: user.email,
        name: user.nickname,
        metadata: { userId: String(req.user.id) }
      });
      customerId = customer.id;
      db.prepare(
        'INSERT INTO subscriptions (user_id, stripe_customer_id, plan, status) VALUES (?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET stripe_customer_id = ?'
      ).run(req.user.id, customerId, 'free', 'active', customerId);
    }

    const session = await s.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      success_url: `${req.headers.origin || 'http://localhost:8066'}?checkout=success`,
      cancel_url: `${req.headers.origin || 'http://localhost:8066'}?checkout=cancel`,
      metadata: { userId: String(req.user.id), plan }
    });

    res.json({ success: true, url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Webhook idempotency cache
const processedWebhooks = new Map();

// Stripe Webhook
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const s = getStripe();
  if (!s) return res.status(503).send('Stripe not configured');

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return res.status(503).send('Webhook secret not configured');
  }

  let event;
  try {
    event = s.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Idempotency check — skip already-processed webhooks
  if (processedWebhooks.has(event.id)) {
    return res.json({ received: true, cached: true });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = parseInt(session.metadata.userId, 10);
      if (!Number.isInteger(userId) || userId <= 0) {
        console.error('Invalid userId in webhook:', session.metadata.userId);
        return res.status(400).json({ error: 'Invalid userId' });
      }
      const plan = session.metadata.plan;
      db.prepare(`
        INSERT INTO subscriptions (user_id, stripe_customer_id, stripe_subscription_id, plan, status)
        VALUES (?, ?, ?, ?, 'active')
        ON CONFLICT(user_id) DO UPDATE SET stripe_subscription_id = ?, plan = ?, status = 'active', current_period_end = NULL
      `).run(userId, session.customer, session.subscription, plan, session.subscription, plan);
      break;
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object;
      const customerId = sub.customer;
      const status = sub.status === 'active' ? 'active' : sub.status === 'past_due' ? 'past_due' : 'expired';
      const periodEnd = new Date(sub.current_period_end * 1000).toISOString();
      db.prepare('UPDATE subscriptions SET status = ?, current_period_end = ? WHERE stripe_customer_id = ?')
        .run(status, periodEnd, customerId);
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      db.prepare('UPDATE subscriptions SET status = ?, plan = ? WHERE stripe_customer_id = ?')
        .run('expired', 'free', sub.customer);
      break;
    }
  }

  // Mark webhook as processed (idempotency)
  processedWebhooks.set(event.id, Date.now());
  // Cleanup old entries (>24h)
  if (processedWebhooks.size > 1000) {
    const cutoff = Date.now() - 86400000;
    for (const [id, ts] of processedWebhooks) {
      if (ts < cutoff) processedWebhooks.delete(id);
    }
  }

  res.json({ received: true });
});

// 查询订阅状态
router.get('/status', requireAuth, (req, res) => {
  const sub = db.prepare('SELECT plan, status, current_period_end FROM subscriptions WHERE user_id = ?').get(req.user.id);
  const plan = sub?.plan || 'free';
  const isPremium = plan !== 'free' && sub?.status === 'active';
  res.json({
    success: true,
    plan,
    isPremium,
    status: sub?.status || 'none',
    current_period_end: sub?.current_period_end
  });
});

// 客户门户（管理订阅、取消等）
router.post('/portal', requireAuth, async (req, res) => {
  const s = getStripe();
  if (!s) return res.status(503).json({ success: false, error: 'Stripe not configured' });

  const sub = db.prepare('SELECT stripe_customer_id FROM subscriptions WHERE user_id = ?').get(req.user.id);
  if (!sub?.stripe_customer_id) return res.status(400).json({ success: false, error: 'No subscription found' });

  try {
    const session = await s.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${req.headers.origin || 'http://localhost:8066'}`,
    });
    res.json({ success: true, url: session.url });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
