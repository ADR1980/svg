const https = require('https');
const fs = require('fs');
const path = require('path');

// ─── Config ───
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'info@svg.global';
const SENDER_NAME = process.env.SENDER_NAME || 'SVG Risikoreport';
const BASE_URL = process.env.BASE_URL || 'https://adr1980.github.io/svg';
const SUBSCRIBERS_FILE = path.join(__dirname, 'subscribers.json');

function sendViaSendGrid(payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = https.request({
      hostname: 'api.sendgrid.com',
      path: '/v3/mail/send',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.statusCode);
        } else {
          reject(new Error(`SendGrid ${res.statusCode}: ${body}`));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  if (!SENDGRID_API_KEY) {
    console.error('SENDGRID_API_KEY is not set');
    process.exit(1);
  }

  // Load subscribers
  let subscribers;
  try {
    subscribers = JSON.parse(fs.readFileSync(SUBSCRIBERS_FILE, 'utf-8')).filter(s => s.active);
  } catch {
    console.log('No subscribers.json found or empty — nothing to send.');
    process.exit(0);
  }

  if (subscribers.length === 0) {
    console.log('No active subscribers — nothing to send.');
    process.exit(0);
  }

  // Load risk data
  let riskData;
  try {
    riskData = JSON.parse(fs.readFileSync(path.join(__dirname, 'risk-data.json'), 'utf-8'));
  } catch (err) {
    console.error('Failed to read risk-data.json:', err.message);
    process.exit(1);
  }

  const html = buildDailyReportHtml(riskData);
  const date = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // Send in batches of 1000 (SendGrid limit)
  let sent = 0;
  let errors = 0;
  const batchSize = 1000;

  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize);
    const payload = {
      personalizations: batch.map(s => ({
        to: [{ email: s.email }],
        substitutions: {
          '%unsubscribe_url%': `${BASE_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(s.email)}`,
        },
      })),
      from: { email: SENDER_EMAIL, name: SENDER_NAME },
      subject: `SVG Risikoreport — ${date} — Risikoindex: ${riskData.global_risk_index}/100`,
      content: [{ type: 'text/html', value: html }],
    };

    try {
      await sendViaSendGrid(payload);
      sent += batch.length;
      console.log(`Batch sent: ${batch.length} emails`);
    } catch (err) {
      console.error('Batch send error:', err.message);
      errors += batch.length;
    }
  }

  console.log(`Done: ${sent} sent, ${errors} failed, ${subscribers.length} total`);
  if (errors > 0) process.exit(1);
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
    <div style="margin-top:16px;background:#0a0e14;border-radius:4px;height:8px;overflow:hidden;">
      <div style="width:${data.global_risk_index}%;height:100%;background:${riskColor};border-radius:4px;"></div>
    </div>
  </td></tr>

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
    <a href="${BASE_URL}/#risk-dashboard" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#c8a84e,#a08030);color:#0a0e14;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Live-Dashboard ansehen</a>
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

main();
