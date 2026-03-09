const express = require('express');
const cors = require('cors');
const sgMail = require('@sendgrid/mail');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const SUBSCRIBERS_FILE = path.join(__dirname, 'subscribers.json');

// ─── Config ───
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'info@svg.global';
const SENDER_NAME = process.env.SENDER_NAME || 'SVG Risikoreport';

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ─── Subscriber Storage ───
function loadSubscribers() {
  try {
    return JSON.parse(fs.readFileSync(SUBSCRIBERS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function saveSubscribers(subscribers) {
  fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2));
}

// ─── API: Subscribe ───
app.post('/api/newsletter/subscribe', (req, res) => {
  const { email } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'invalid_email' });
  }

  const subscribers = loadSubscribers();
  const normalized = email.toLowerCase().trim();

  if (subscribers.some(s => s.email === normalized)) {
    return res.status(409).json({ error: 'already_subscribed' });
  }

  subscribers.push({
    email: normalized,
    subscribedAt: new Date().toISOString(),
    active: true,
  });
  saveSubscribers(subscribers);

  // Send welcome email
  sendWelcomeEmail(normalized).catch(err =>
    console.error('Welcome email failed:', err.message)
  );

  res.json({ success: true });
});

// ─── API: Unsubscribe ───
app.get('/api/newsletter/unsubscribe', (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).send('Missing email');

  const subscribers = loadSubscribers();
  const updated = subscribers.map(s =>
    s.email === email.toLowerCase().trim() ? { ...s, active: false } : s
  );
  saveSubscribers(updated);

  const lang = (req.query.lang || 'de') === 'en' ? 'en' : 'de';
  const msg = lang === 'de'
    ? 'Sie wurden erfolgreich vom Newsletter abgemeldet.'
    : 'You have been successfully unsubscribed from the newsletter.';

  res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Inter,sans-serif;background:#0a0e14;color:#e8e8e8;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;}.box{background:#1a2332;border:1px solid #2a3444;border-radius:12px;padding:40px;text-align:center;max-width:500px;}.gold{color:#c8a84e;}</style></head><body><div class="box"><h2 class="gold">SVG Risikoreport</h2><p>${msg}</p></div></body></html>`);
});

// ─── API: Send daily report (triggered by cron/scheduler) ───
app.post('/api/newsletter/send-daily', async (req, res) => {
  const authHeader = req.headers['x-api-key'];
  if (authHeader !== process.env.NEWSLETTER_API_KEY) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  try {
    const result = await sendDailyReport();
    res.json(result);
  } catch (err) {
    console.error('Daily report send failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Welcome Email ───
async function sendWelcomeEmail(email) {
  const msg = {
    to: email,
    from: { email: SENDER_EMAIL, name: SENDER_NAME },
    subject: 'Willkommen beim SVG Risikoreport',
    html: buildWelcomeEmailHtml(),
  };
  await sgMail.send(msg);
  console.log(`Welcome email sent to ${email}`);
}

// ─── Daily Report Sender ───
async function sendDailyReport() {
  const subscribers = loadSubscribers().filter(s => s.active);
  if (subscribers.length === 0) {
    return { sent: 0, message: 'No active subscribers' };
  }

  let riskData;
  try {
    riskData = JSON.parse(fs.readFileSync(path.join(__dirname, 'risk-data.json'), 'utf-8'));
  } catch {
    throw new Error('risk-data.json not found or invalid');
  }

  const html = buildDailyReportHtml(riskData);
  const date = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  let sent = 0;
  let errors = 0;

  // SendGrid supports batch sending via personalizations (max 1000 per request)
  const batchSize = 1000;
  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize);
    const msg = {
      personalizations: batch.map(s => ({
        to: [{ email: s.email }],
        substitutions: { '%unsubscribe_url%': `${process.env.BASE_URL || 'http://localhost:3000'}/api/newsletter/unsubscribe?email=${encodeURIComponent(s.email)}` },
      })),
      from: { email: SENDER_EMAIL, name: SENDER_NAME },
      subject: `SVG Risikoreport — ${date} — Risikoindex: ${riskData.global_risk_index}/100`,
      html,
    };

    try {
      await sgMail.send(msg);
      sent += batch.length;
    } catch (err) {
      console.error(`Batch send error:`, err.message);
      errors += batch.length;
    }
  }

  console.log(`Daily report: ${sent} sent, ${errors} failed`);
  return { sent, errors, total: subscribers.length };
}

// ─── Email Templates ───
function buildWelcomeEmailHtml() {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0e14;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0e14;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#1a2332;border:1px solid #2a3444;border-radius:12px;overflow:hidden;">
  <tr><td style="background:linear-gradient(135deg,#c8a84e,#a08030);padding:30px 40px;text-align:center;">
    <h1 style="margin:0;color:#0a0e14;font-size:28px;font-weight:700;">SVG Risikoreport</h1>
    <p style="margin:8px 0 0;color:rgba(10,14,20,0.7);font-size:14px;">Sentinal Venguard Global</p>
  </td></tr>
  <tr><td style="padding:40px;">
    <h2 style="color:#e8e8e8;font-size:22px;margin:0 0 16px;">Willkommen beim täglichen Risikoreport!</h2>
    <p style="color:#9ca3af;font-size:15px;line-height:1.7;margin:0 0 24px;">
      Vielen Dank für Ihre Anmeldung. Ab morgen erhalten Sie täglich um <strong style="color:#c8a84e;">07:00 Uhr</strong> den aktuellen Globalen Lieferrisiko-Report direkt in Ihr Postfach.
    </p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <tr><td style="padding:12px 16px;background:#111827;border-radius:8px 8px 0 0;border-bottom:1px solid #2a3444;">
        <span style="color:#c8a84e;font-size:13px;">◆</span>
        <span style="color:#e8e8e8;font-size:14px;margin-left:8px;">Globaler Risikoindex mit Tagesvergleich</span>
      </td></tr>
      <tr><td style="padding:12px 16px;background:#111827;border-bottom:1px solid #2a3444;">
        <span style="color:#c8a84e;font-size:13px;">◆</span>
        <span style="color:#e8e8e8;font-size:14px;margin-left:8px;">Regionale Risikobewertungen für 8 Schlüsselregionen</span>
      </td></tr>
      <tr><td style="padding:12px 16px;background:#111827;border-bottom:1px solid #2a3444;">
        <span style="color:#c8a84e;font-size:13px;">◆</span>
        <span style="color:#e8e8e8;font-size:14px;margin-left:8px;">Aktuelle Risikomeldungen und Analysen</span>
      </td></tr>
      <tr><td style="padding:12px 16px;background:#111827;border-radius:0 0 8px 8px;">
        <span style="color:#c8a84e;font-size:13px;">◆</span>
        <span style="color:#e8e8e8;font-size:14px;margin-left:8px;">30-Tage-Trendentwicklung</span>
      </td></tr>
    </table>
    <p style="color:#6b7280;font-size:13px;line-height:1.6;">
      Sie können den Newsletter jederzeit über den Abmelde-Link am Ende jeder E-Mail kündigen.
    </p>
  </td></tr>
  <tr><td style="padding:20px 40px;background:#111827;border-top:1px solid #2a3444;text-align:center;">
    <p style="color:#6b7280;font-size:12px;margin:0;">&copy; 2026 Sentinal Venguard Global. Alle Rechte vorbehalten.</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function buildDailyReportHtml(data) {
  const date = new Date().toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const riskColor = data.global_risk_index >= 75 ? '#ef4444' : data.global_risk_index >= 55 ? '#f59e0b' : data.global_risk_index >= 35 ? '#3b82f6' : '#22c55e';
  const riskLabel = data.global_risk_index >= 75 ? 'Kritisch' : data.global_risk_index >= 55 ? 'Erhöht' : data.global_risk_index >= 35 ? 'Moderat' : 'Niedrig';
  const changeArrow = data.global_risk_change >= 0 ? '▲' : '▼';
  const changeColor = data.global_risk_change >= 0 ? '#ef4444' : '#22c55e';

  const regionRows = (data.regions || [])
    .sort((a, b) => b.score - a.score)
    .map(r => {
      const color = r.score >= 75 ? '#ef4444' : r.score >= 55 ? '#f59e0b' : r.score >= 35 ? '#3b82f6' : '#22c55e';
      return `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #2a3444;color:#e8e8e8;font-size:14px;">${r.flag} ${r.name_de}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #2a3444;text-align:center;">
          <span style="color:${color};font-weight:700;font-size:16px;">${r.score}</span>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #2a3444;color:${r.change >= 0 ? '#ef4444' : '#22c55e'};font-size:13px;text-align:center;">
          ${r.change >= 0 ? '▲' : '▼'} ${Math.abs(r.change)}
        </td>
      </tr>`;
    }).join('');

  const newsItems = (data.news || []).slice(0, 6).map(n => {
    const tagColor = n.risk_level === 'high' ? '#ef4444' : n.risk_level === 'medium' ? '#f59e0b' : '#22c55e';
    const tagBg = n.risk_level === 'high' ? 'rgba(239,68,68,0.15)' : n.risk_level === 'medium' ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)';
    const tagLabel = n.risk_level === 'high' ? 'Hoch' : n.risk_level === 'medium' ? 'Mittel' : 'Niedrig';
    return `<tr><td style="padding:12px 16px;background:#111827;border-bottom:1px solid #2a3444;">
      <p style="color:#e8e8e8;font-size:14px;margin:0 0 4px;font-weight:500;">${n.title_de}</p>
      <span style="color:#6b7280;font-size:12px;">${n.source}</span>
      <span style="display:inline-block;margin-left:8px;padding:2px 8px;border-radius:3px;font-size:10px;font-weight:600;background:${tagBg};color:${tagColor};">${tagLabel}</span>
    </td></tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0e14;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0e14;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#1a2332;border:1px solid #2a3444;border-radius:12px;overflow:hidden;">

  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#c8a84e,#a08030);padding:24px 40px;">
    <table width="100%"><tr>
      <td><h1 style="margin:0;color:#0a0e14;font-size:22px;font-weight:700;">SVG Risikoreport</h1></td>
      <td style="text-align:right;color:rgba(10,14,20,0.7);font-size:13px;">${date}</td>
    </tr></table>
  </td></tr>

  <!-- Global Risk Index -->
  <tr><td style="padding:32px 40px 24px;">
    <p style="color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">Globaler Risikoindex</p>
    <table width="100%"><tr>
      <td style="width:100px;">
        <div style="font-size:56px;font-weight:700;color:${riskColor};line-height:1;">${data.global_risk_index}</div>
      </td>
      <td style="vertical-align:middle;">
        <p style="margin:0 0 6px;color:#e8e8e8;font-size:16px;">${riskLabel}</p>
        <p style="margin:0;color:${changeColor};font-size:14px;">${changeArrow} ${Math.abs(data.global_risk_change)} Punkte vs. Vortag</p>
      </td>
    </tr></table>
    <!-- Risk Bar -->
    <div style="margin-top:16px;background:#0a0e14;border-radius:4px;height:8px;overflow:hidden;">
      <div style="width:${data.global_risk_index}%;height:100%;background:${riskColor};border-radius:4px;"></div>
    </div>
  </td></tr>

  <!-- Divider -->
  <tr><td style="padding:0 40px;"><div style="border-top:1px solid #2a3444;"></div></td></tr>

  <!-- Regional Risks -->
  <tr><td style="padding:24px 40px;">
    <p style="color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;">Regionale Risikolevel</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:8px;overflow:hidden;">
      <tr style="background:rgba(200,168,78,0.1);">
        <th style="padding:8px 12px;text-align:left;color:#c8a84e;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Region</th>
        <th style="padding:8px 12px;text-align:center;color:#c8a84e;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Score</th>
        <th style="padding:8px 12px;text-align:center;color:#c8a84e;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Trend</th>
      </tr>
      ${regionRows}
    </table>
  </td></tr>

  <!-- Divider -->
  <tr><td style="padding:0 40px;"><div style="border-top:1px solid #2a3444;"></div></td></tr>

  <!-- News -->
  <tr><td style="padding:24px 40px;">
    <p style="color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;">Aktuelle Risikomeldungen</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:8px;overflow:hidden;">
      ${newsItems}
    </table>
  </td></tr>

  <!-- CTA -->
  <tr><td style="padding:16px 40px 32px;text-align:center;">
    <a href="${process.env.BASE_URL || 'http://localhost:3000'}/#risk-dashboard" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#c8a84e,#a08030);color:#0a0e14;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Live-Dashboard ansehen</a>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:20px 40px;background:#111827;border-top:1px solid #2a3444;">
    <p style="color:#6b7280;font-size:12px;margin:0 0 8px;text-align:center;">&copy; 2026 Sentinal Venguard Global. Alle Rechte vorbehalten.</p>
    <p style="text-align:center;margin:0;">
      <a href="%unsubscribe_url%" style="color:#6b7280;font-size:12px;text-decoration:underline;">Newsletter abbestellen</a>
    </p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;
}

// ─── Start Server ───
app.listen(PORT, () => {
  console.log(`SVG Server running on port ${PORT}`);
  console.log(`SendGrid API Key: ${process.env.SENDGRID_API_KEY ? 'configured' : '⚠️  NOT SET — set SENDGRID_API_KEY env variable'}`);
});
