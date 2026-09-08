import webpush from 'web-push';
import { QUESTIONS, questionById } from './questions.js';

const WEEKDAY_TIMES = ['07:00', '09:35', '12:42', '15:30', '21:00'];
const WEEKEND_TIMES = ['12:00', '14:00', '16:00', '18:00'];
const DEFAULT_LEARNED = ['print','variables','strings','numbers','input','comparisons','if'];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
}

function localClock(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year:'numeric', month:'2-digit', day:'2-digit', weekday:'short',
    hour:'2-digit', minute:'2-digit', hourCycle:'h23'
  }).formatToParts(date);
  const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    weekday: p.weekday,
    hhmm: `${p.hour}:${p.minute}`
  };
}

function isWeekend(weekday) { return weekday === 'Sat' || weekday === 'Sun'; }
function scheduleFor(weekday) { return isWeekend(weekday) ? WEEKEND_TIMES : WEEKDAY_TIMES; }

function stableHash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function parseJSON(text, fallback) {
  try { return JSON.parse(text); } catch { return fallback; }
}

function tierForMastery(value = 0) {
  if (value >= 65) return 3;
  if (value >= 30) return 2;
  return 1;
}

function chooseQuestion(row, localDate, slot) {
  const learned = parseJSON(row.learned_concepts, DEFAULT_LEARNED);
  const mastery = parseJSON(row.mastery, {});
  const usableConcepts = learned.length ? learned : DEFAULT_LEARNED;

  // Favor the weakest learned concepts, then increase tier as mastery grows.
  const ordered = [...usableConcepts].sort((a,b) => (mastery[a] || 0) - (mastery[b] || 0));
  const weakestSlice = ordered.slice(0, Math.max(1, Math.ceil(ordered.length / 2)));
  const concept = weakestSlice[stableHash(`${row.client_id}:${localDate}:${slot}:concept`) % weakestSlice.length];
  const targetTier = tierForMastery(mastery[concept] || 0);
  let pool = QUESTIONS.filter(q => q.concept === concept && q.tier === targetTier);
  if (!pool.length) pool = QUESTIONS.filter(q => q.concept === concept);
  if (!pool.length) pool = QUESTIONS.filter(q => q.tier === 1);
  return pool[stableHash(`${row.client_id}:${localDate}:${slot}:question`) % pool.length];
}

async function sendScheduled(env, now = new Date()) {
  const zone = env.TIME_ZONE || 'America/New_York';
  const local = localClock(now, zone);
  const schedule = scheduleFor(local.weekday);
  const slot = schedule.indexOf(local.hhmm);
  if (slot < 0) return;

  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY || !env.VAPID_SUBJECT) {
    console.error('VAPID configuration missing; skipping push delivery.');
    return;
  }
  webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);

  const { results = [] } = await env.DB.prepare('SELECT * FROM subscriptions').all();
  for (const row of results) {
    const already = await env.DB.prepare(
      'SELECT 1 FROM delivery_log WHERE endpoint = ? AND local_date = ? AND slot = ? LIMIT 1'
    ).bind(row.endpoint, local.date, slot).first();
    if (already) continue;

    const question = chooseQuestion(row, local.date, slot);
    const payload = JSON.stringify({
      title: `PyRecall • ${slot + 1}/${schedule.length}`,
      body: question.prompt,
      navigate: `/?scheduled=1&q=${encodeURIComponent(question.id)}&slot=${slot}`
    });

    const subscription = {
      endpoint: row.endpoint,
      keys: { p256dh: row.p256dh, auth: row.auth }
    };

    try {
      await webpush.sendNotification(subscription, payload, { TTL: 3600 });
      await env.DB.prepare(
        'INSERT OR IGNORE INTO delivery_log(endpoint, local_date, slot, question_id) VALUES (?, ?, ?, ?)'
      ).bind(row.endpoint, local.date, slot, question.id).run();
    } catch (err) {
      const status = err?.statusCode || err?.status;
      console.error('Push failed', status, err?.message || err);
      if (status === 404 || status === 410) {
        await env.DB.prepare('DELETE FROM subscriptions WHERE endpoint = ?').bind(row.endpoint).run();
      }
    }
  }
}

async function handleApi(request, env, url) {
  if (url.pathname === '/api/config' && request.method === 'GET') {
    return json({
      vapidPublicKey: env.VAPID_PUBLIC_KEY || '',
      timeZone: env.TIME_ZONE || 'America/New_York',
      weekdayTimes: WEEKDAY_TIMES,
      weekendTimes: WEEKEND_TIMES
    });
  }

  if (url.pathname === '/api/question' && request.method === 'GET') {
    const q = questionById(url.searchParams.get('id'));
    if (!q) return json({ error:'Unknown question' }, 404);
    return json(q);
  }

  if (url.pathname === '/api/subscribe' && request.method === 'POST') {
    const body = await request.json();
    if (!body?.clientId || !body?.subscription?.endpoint || !body?.subscription?.keys?.p256dh || !body?.subscription?.keys?.auth) {
      return json({ error:'Invalid subscription' }, 400);
    }
    const learned = Array.isArray(body.learnedConcepts) && body.learnedConcepts.length ? body.learnedConcepts : DEFAULT_LEARNED;
    const mastery = body.mastery && typeof body.mastery === 'object' ? body.mastery : {};
    await env.DB.prepare(`
      INSERT INTO subscriptions(client_id, endpoint, p256dh, auth, learned_concepts, mastery, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(endpoint) DO UPDATE SET
        client_id=excluded.client_id,
        p256dh=excluded.p256dh,
        auth=excluded.auth,
        learned_concepts=excluded.learned_concepts,
        mastery=excluded.mastery,
        updated_at=CURRENT_TIMESTAMP
    `).bind(
      body.clientId,
      body.subscription.endpoint,
      body.subscription.keys.p256dh,
      body.subscription.keys.auth,
      JSON.stringify(learned),
      JSON.stringify(mastery)
    ).run();
    return json({ ok:true });
  }

  if (url.pathname === '/api/profile' && request.method === 'POST') {
    const body = await request.json();
    if (!body?.clientId) return json({ error:'Missing clientId' }, 400);
    const learned = Array.isArray(body.learnedConcepts) ? body.learnedConcepts : DEFAULT_LEARNED;
    const mastery = body.mastery && typeof body.mastery === 'object' ? body.mastery : {};
    await env.DB.prepare(
      'UPDATE subscriptions SET learned_concepts=?, mastery=?, updated_at=CURRENT_TIMESTAMP WHERE client_id=?'
    ).bind(JSON.stringify(learned), JSON.stringify(mastery), body.clientId).run();
    return json({ ok:true });
  }

  if (url.pathname === '/api/unsubscribe' && request.method === 'POST') {
    const body = await request.json();
    if (body?.endpoint) await env.DB.prepare('DELETE FROM subscriptions WHERE endpoint=?').bind(body.endpoint).run();
    return json({ ok:true });
  }

  if (url.pathname === '/api/test-push' && request.method === 'POST') {
    const body = await request.json();
    if (!body?.clientId) return json({ error:'Missing clientId' }, 400);
    const row = await env.DB.prepare('SELECT * FROM subscriptions WHERE client_id=? ORDER BY updated_at DESC LIMIT 1').bind(body.clientId).first();
    if (!row) return json({ error:'No subscription found' }, 404);
    webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
    const q = chooseQuestion(row, localClock(new Date(), env.TIME_ZONE || 'America/New_York').date, 0);
    await webpush.sendNotification({ endpoint:row.endpoint, keys:{p256dh:row.p256dh, auth:row.auth} }, JSON.stringify({
      title:'PyRecall test',
      body:q.prompt,
      navigate:`/?scheduled=1&q=${encodeURIComponent(q.id)}`
    }));
    return json({ ok:true, question:q.id });
  }

  return null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      const response = await handleApi(request, env, url);
      if (response) return response;
      return json({ error:'Not found' }, 404);
    }
    return env.ASSETS.fetch(request);
  },

  async scheduled(controller, env, ctx) {
    ctx.waitUntil(sendScheduled(env, new Date(controller.scheduledTime)));
  }
};
