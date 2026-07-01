const express = require('express');
const { Router } = express;
const crypto = require('crypto');
const pool = require('../db');
const notify = require('../notifications');

const router = Router();
const DEV = process.env.NODE_ENV !== 'production';

// ── HELPERS ───────────────────────────────────────────────────────────────────

async function getOrder(orderId) {
  const { rows: [o] } = await pool.query('SELECT * FROM orders WHERE id=$1', [orderId]);
  return o;
}

// ── CHECKOUT ──────────────────────────────────────────────────────────────────
// POST /api/payments/checkout  { order_id, provider }
// Returns { payment_id, checkout_url, amount_uzs, provider }
router.post('/checkout', async (req, res) => {
  const { order_id, provider } = req.body;
  if (!order_id || !provider) return res.status(400).json({ error: 'order_id and provider required' });
  if (!['click', 'payme', 'uzum'].includes(provider))
    return res.status(400).json({ error: 'Invalid provider. Use click, payme, or uzum' });

  try {
    const order = await getOrder(order_id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'created') return res.status(400).json({ error: `Order status is '${order.status}', expected 'created'` });

    // Return existing pending payment if one already exists
    const { rows: [existing] } = await pool.query(
      `SELECT * FROM payments WHERE order_id=$1 AND status='pending' AND provider=$2`,
      [order_id, provider]
    );
    if (existing) {
      return res.json({ payment_id: existing.id, checkout_url: existing.checkout_url, amount_uzs: existing.amount_uzs, provider });
    }

    let checkoutUrl;
    if (provider === 'payme') {
      const merchantId = process.env.PAYME_MERCHANT_ID;
      if (!merchantId) return res.status(503).json({ error: 'Payme not configured (missing PAYME_MERCHANT_ID)' });
      // Payme amount is in tiyin (1 UZS = 100 tiyin)
      const params = `m=${merchantId};ac.order_id=${order_id};a=${order.price_uzs * 100}`;
      checkoutUrl = `https://checkout.paycom.uz/${Buffer.from(params).toString('base64')}`;
    } else if (provider === 'click') {
      const serviceId = process.env.CLICK_SERVICE_ID;
      const merchantId = process.env.CLICK_MERCHANT_ID;
      if (!serviceId || !merchantId)
        return res.status(503).json({ error: 'Click not configured (missing CLICK_SERVICE_ID / CLICK_MERCHANT_ID)' });
      const returnUrl = encodeURIComponent(`${process.env.APP_URL || 'https://app.happytails.uz'}/payment/result`);
      checkoutUrl = `https://my.click.uz/services/pay?service_id=${serviceId}&merchant_id=${merchantId}&amount=${order.price_uzs}&transaction_param=${order_id}&return_url=${returnUrl}`;
    } else if (provider === 'uzum') {
      const merchantId = process.env.UZUM_MERCHANT_ID;
      if (!merchantId) return res.status(503).json({ error: 'Uzum not configured (missing UZUM_MERCHANT_ID)' });
      checkoutUrl = `https://pay.uzum.uz/checkout?merchant_id=${merchantId}&order_id=${order_id}&amount=${order.price_uzs}`;
    }

    const { rows: [payment] } = await pool.query(
      `INSERT INTO payments (order_id, provider, amount_uzs, status, checkout_url)
       VALUES ($1, $2, $3, 'pending', $4) RETURNING *`,
      [order_id, provider, order.price_uzs, checkoutUrl]
    );

    res.json({ payment_id: payment.id, checkout_url: checkoutUrl, amount_uzs: order.price_uzs, provider });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── PAYME WEBHOOK (JSON-RPC 2.0) ──────────────────────────────────────────────
// Payme calls this endpoint to check/create/perform/cancel transactions.
// Auth: Authorization: Basic base64("Paycom:{PAYME_SECRET_KEY}")
router.post('/webhook/payme', async (req, res) => {
  const secretKey = process.env.PAYME_SECRET_KEY;
  if (secretKey) {
    const auth = req.headers['authorization'] ?? '';
    const expected = `Basic ${Buffer.from(`Paycom:${secretKey}`).toString('base64')}`;
    if (auth !== expected) return res.json(paymeErr(-32504, 'Authentication failed', req.body.id));
  }

  const { method, params, id: rpcId } = req.body ?? {};

  try {
    switch (method) {

      case 'CheckPerformTransaction': {
        const orderId = params?.account?.order_id;
        if (!orderId) return res.json(paymeErr(-31099, 'Order not found', rpcId));
        const order = await getOrder(orderId);
        if (!order) return res.json(paymeErr(-31099, 'Order not found', rpcId));
        if (order.status !== 'created') return res.json(paymeErr(-31008, 'Order already paid', rpcId));
        if (order.price_uzs * 100 !== params.amount) return res.json(paymeErr(-31001, 'Incorrect amount', rpcId));
        return res.json({ result: { allow: true }, id: rpcId });
      }

      case 'CreateTransaction': {
        const orderId = params?.account?.order_id;
        const extRef = params?.id;
        if (!orderId) return res.json(paymeErr(-31099, 'Order not found', rpcId));

        const { rows: [existing] } = await pool.query(
          `SELECT * FROM payments WHERE external_ref=$1 AND provider='payme'`, [extRef]
        );
        if (existing) {
          if (existing.status === 'failed') return res.json(paymeErr(-31008, 'Transaction cancelled', rpcId));
          return res.json({
            result: { create_time: +new Date(existing.created_at), transaction: existing.id, state: 1 },
            id: rpcId,
          });
        }

        const order = await getOrder(orderId);
        if (!order) return res.json(paymeErr(-31099, 'Order not found', rpcId));
        if (order.status !== 'created') return res.json(paymeErr(-31008, 'Order not payable', rpcId));
        if (order.price_uzs * 100 !== params.amount) return res.json(paymeErr(-31001, 'Incorrect amount', rpcId));

        const { rows: [payment] } = await pool.query(
          `INSERT INTO payments (order_id, provider, amount_uzs, status, external_ref)
           VALUES ($1, 'payme', $2, 'pending', $3) RETURNING *`,
          [orderId, order.price_uzs, extRef]
        );
        return res.json({
          result: { create_time: +new Date(payment.created_at), transaction: payment.id, state: 1 },
          id: rpcId,
        });
      }

      case 'PerformTransaction': {
        const extRef = params?.id;
        const { rows: [payment] } = await pool.query(
          `SELECT * FROM payments WHERE external_ref=$1 AND provider='payme'`, [extRef]
        );
        if (!payment) return res.json(paymeErr(-31003, 'Transaction not found', rpcId));
        if (payment.status === 'paid') {
          return res.json({
            result: { transaction: payment.id, perform_time: +new Date(payment.paid_at), state: 2 },
            id: rpcId,
          });
        }
        if (payment.status !== 'pending') return res.json(paymeErr(-31008, 'Transaction cannot be performed', rpcId));

        await pool.query(`UPDATE payments SET status='paid', paid_at=NOW() WHERE id=$1`, [payment.id]);
        await pool.query(`UPDATE orders SET status='paid' WHERE id=$1 AND status='created'`, [payment.order_id]);
        notify.notifyVetNewOrder(payment.order_id);
        return res.json({ result: { transaction: payment.id, perform_time: Date.now(), state: 2 }, id: rpcId });
      }

      case 'CancelTransaction': {
        const extRef = params?.id;
        const { rows: [payment] } = await pool.query(
          `SELECT * FROM payments WHERE external_ref=$1 AND provider='payme'`, [extRef]
        );
        if (!payment) return res.json(paymeErr(-31003, 'Transaction not found', rpcId));
        if (payment.status === 'refunded') {
          return res.json({
            result: { transaction: payment.id, cancel_time: +new Date(payment.refunded_at), state: -2 },
            id: rpcId,
          });
        }
        const state = payment.status === 'paid' ? -2 : -1;
        await pool.query(`UPDATE payments SET status='refunded', refunded_at=NOW() WHERE id=$1`, [payment.id]);
        if (payment.status === 'paid') {
          await pool.query(`UPDATE orders SET status='refunded' WHERE id=$1 AND status IN ('paid','accepted')`, [payment.order_id]);
        } else {
          await pool.query(`UPDATE orders SET status='cancelled' WHERE id=$1 AND status='created'`, [payment.order_id]);
        }
        return res.json({ result: { transaction: payment.id, cancel_time: Date.now(), state }, id: rpcId });
      }

      case 'CheckTransaction': {
        const extRef = params?.id;
        const { rows: [payment] } = await pool.query(
          `SELECT * FROM payments WHERE external_ref=$1 AND provider='payme'`, [extRef]
        );
        if (!payment) return res.json(paymeErr(-31003, 'Transaction not found', rpcId));
        const stateMap = { pending: 1, paid: 2, refunded: -2, failed: -1 };
        return res.json({
          result: {
            create_time:  +new Date(payment.created_at),
            perform_time: payment.paid_at     ? +new Date(payment.paid_at)     : 0,
            cancel_time:  payment.refunded_at ? +new Date(payment.refunded_at) : 0,
            transaction:  payment.id,
            state:        stateMap[payment.status] ?? 0,
            reason:       null,
          },
          id: rpcId,
        });
      }

      default:
        return res.json(paymeErr(-32601, 'Method not found', rpcId));
    }
  } catch (e) {
    return res.json(paymeErr(-31008, e.message, rpcId));
  }
});

function paymeErr(code, message, id) {
  return { error: { code, message: { ru: message, en: message, uz: message } }, id };
}

// ── CLICK WEBHOOK ─────────────────────────────────────────────────────────────
// Click sends form-urlencoded POST twice: prepare (action=0) then complete (action=1).
router.post('/webhook/click', express.urlencoded({ extended: false }), async (req, res) => {
  const {
    click_trans_id, service_id, merchant_trans_id, amount,
    action, sign_time, sign_string, error: clickError,
  } = req.body;

  const secretKey = process.env.CLICK_SECRET_KEY;
  if (secretKey) {
    const base = `${click_trans_id}${service_id}${secretKey}${merchant_trans_id}${amount}${action}${sign_time}`;
    const expected = crypto.createHash('md5').update(base).digest('hex');
    if (sign_string !== expected) return res.json({ error: -1, error_note: 'Sign check failed' });
  }

  const orderId = merchant_trans_id;

  try {
    if (action === '0') {
      const order = await getOrder(orderId);
      if (!order) return res.json({ error: -5, error_note: 'Order not found' });
      if (order.status !== 'created') return res.json({ error: -4, error_note: 'Order already paid' });
      if (Math.abs(parseFloat(amount) - order.price_uzs) > 0.5)
        return res.json({ error: -2, error_note: 'Incorrect amount' });

      const { rows: [payment] } = await pool.query(
        `INSERT INTO payments (order_id, provider, amount_uzs, status, external_ref)
         VALUES ($1, 'click', $2, 'pending', $3)
         ON CONFLICT DO NOTHING RETURNING *`,
        [orderId, order.price_uzs, click_trans_id]
      );
      return res.json({
        click_trans_id,
        merchant_trans_id: orderId,
        merchant_prepare_id: payment?.id ?? '',
        error: 0,
        error_note: 'Success',
      });
    }

    if (action === '1') {
      if (parseInt(clickError) < 0) {
        await pool.query(
          `UPDATE payments SET status='failed' WHERE external_ref=$1 AND provider='click'`,
          [click_trans_id]
        );
        return res.json({ click_trans_id, merchant_trans_id: orderId, error: 0, error_note: 'Success' });
      }
      const { rows: [payment] } = await pool.query(
        `SELECT * FROM payments WHERE external_ref=$1 AND provider='click'`, [click_trans_id]
      );
      if (!payment) return res.json({ error: -6, error_note: 'Transaction not found' });

      await pool.query(`UPDATE payments SET status='paid', paid_at=NOW() WHERE id=$1`, [payment.id]);
      await pool.query(`UPDATE orders SET status='paid' WHERE id=$1 AND status='created'`, [payment.order_id]);
      notify.notifyVetNewOrder(payment.order_id);
      return res.json({
        click_trans_id,
        merchant_trans_id: orderId,
        merchant_confirm_id: payment.id,
        error: 0,
        error_note: 'Success',
      });
    }

    return res.json({ error: -8, error_note: 'Invalid action' });
  } catch (e) {
    return res.json({ error: -8, error_note: e.message });
  }
});

// ── UZUM PAY WEBHOOK ─────────────────────────────────────────────────────────
// Uzum sends a signed JSON POST. Auth via X-Uzum-Signature: HMAC-SHA256 over body.
// Supported event types: payment.success, payment.cancelled, payment.failed.
// https://developers.uzum.uz/docs/payment-gateway
router.post('/webhook/uzum', express.json(), async (req, res) => {
  const secretKey = process.env.UZUM_SECRET_KEY;
  if (secretKey) {
    const sig = req.headers['x-uzum-signature'];
    const expected = crypto
      .createHmac('sha256', secretKey)
      .update(JSON.stringify(req.body))
      .digest('hex');
    if (sig !== expected) return res.status(401).json({ error: 'Signature mismatch' });
  }

  const { event, transaction_id, order_id: orderId, amount, status } = req.body ?? {};
  if (!event || !orderId) return res.status(400).json({ error: 'Invalid payload' });

  try {
    if (event === 'payment.success') {
      const { rows: [payment] } = await pool.query(
        `INSERT INTO payments (order_id, provider, amount_uzs, status, external_ref, paid_at)
         VALUES ($1, 'uzum', $2, 'paid', $3, NOW())
         ON CONFLICT (external_ref) DO UPDATE SET status='paid', paid_at=NOW()
         RETURNING *`,
        [orderId, amount || 0, transaction_id]
      );
      await pool.query(
        `UPDATE orders SET status='paid' WHERE id=$1 AND status='created'`,
        [orderId]
      );
      if (payment) notify.notifyVetNewOrder(orderId).catch(() => {});
      return res.json({ success: true });
    }

    if (event === 'payment.cancelled' || event === 'payment.failed') {
      await pool.query(
        `UPDATE payments SET status='failed' WHERE external_ref=$1 AND provider='uzum'`,
        [transaction_id]
      );
      return res.json({ success: true });
    }

    // Unknown event — acknowledge silently
    return res.json({ received: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── DEV SIMULATE ──────────────────────────────────────────────────────────────
// POST /api/payments/simulate — dev/staging only
router.post('/simulate', async (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(404).json({ error: 'Not found' });

  const { consultation_id, provider, amount_uzs, owner_id, order_id } = req.body;
  if (!provider || (!consultation_id && !order_id))
    return res.status(400).json({ error: 'provider and (consultation_id or order_id) required' });
  if (!['click', 'payme', 'uzum'].includes(provider))
    return res.status(400).json({ error: 'Invalid provider' });

  try {
    let targetOrderId = order_id;

    if (!targetOrderId && consultation_id) {
      const { rows: [c] } = await pool.query('SELECT vet_id FROM consultations WHERE id=$1', [consultation_id]);
      if (!c) return res.status(404).json({ error: 'Consultation not found' });
      const { rows: [o] } = await pool.query(
        `INSERT INTO orders (owner_id, vet_id, service_type, consultation_id, status, price_uzs, provider)
         VALUES ($1, $2, 'vet_online', $3, 'created', $4, $5) RETURNING id`,
        [owner_id || 'anonymous', c.vet_id, consultation_id, amount_uzs, provider]
      );
      targetOrderId = o.id;
    }

    const extRef = `DEMO-${provider.toUpperCase()}-${Date.now()}`;
    const { rows: [payment] } = await pool.query(
      `INSERT INTO payments (order_id, provider, amount_uzs, status, external_ref, paid_at)
       VALUES ($1, $2, $3, 'paid', $4, NOW()) RETURNING *`,
      [targetOrderId, provider, amount_uzs || 0, extRef]
    );
    await pool.query(`UPDATE orders SET status='paid' WHERE id=$1 AND status='created'`, [targetOrderId]);
    notify.notifyVetNewOrder(targetOrderId).catch(() => {});

    res.json({
      success: true,
      order_id: targetOrderId,
      payment_id: payment.id,
      ref: extRef,
      amount_uzs: payment.amount_uzs,
      provider,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
