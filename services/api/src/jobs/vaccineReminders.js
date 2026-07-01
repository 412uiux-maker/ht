const pool = require('../db');
const { logHealthEvent } = require('../helpers/healthEvents');
const { sendTelegramMessage } = require('../notifications');

const WARN_DAYS  = 30;  // window: create reminder if expires within 30 days
const DEDUP_DAYS = 25;  // skip if a reminder for this vaccination was already sent within 25 days

async function runVaccineReminders() {
  try {
    // All vaccinations expiring within WARN_DAYS days (or already expired)
    const { rows: vaccinations } = await pool.query(
      `SELECT v.id, v.pet_id, v.name, v.type, v.valid_until,
              p.owner_id, p.name AS pet_name,
              EXTRACT(DAY FROM (v.valid_until::timestamptz - NOW())) AS days_left
       FROM vaccinations v
       JOIN pets p ON p.id = v.pet_id
       WHERE v.valid_until IS NOT NULL
         AND v.valid_until::timestamptz <= NOW() + ($1 * INTERVAL '1 day')`,
      [WARN_DAYS]
    );

    let created = 0;
    for (const vacc of vaccinations) {
      // Idempotency: skip if a system reminder for this vacc was already created recently
      const { rows: existing } = await pool.query(
        `SELECT id FROM health_events
         WHERE ref_table = 'vaccinations'
           AND ref_id    = $1
           AND type      = 'reminder'
           AND source    = 'system'
           AND created_at >= NOW() - ($2 * INTERVAL '1 day')`,
        [vacc.id, DEDUP_DAYS]
      );
      if (existing.length > 0) continue;

      const daysLeft  = Math.round(Number(vacc.days_left));
      const isExpired = daysLeft < 0;
      const vaccName  = vacc.name || `Вакцина (${vacc.type})`;

      const title = isExpired
        ? `⏰ Прививка просрочена: ${vaccName} (${Math.abs(daysLeft)} дн. назад)`
        : `⏰ Прививка скоро: ${vaccName} — через ${daysLeft} дн.`;

      await logHealthEvent(vacc.pet_id, {
        type: 'reminder', source: 'system',
        refTable: 'vaccinations', refId: vacc.id,
        title, occurredAt: new Date(),
      });
      created++;

      // Telegram push to owner (silent on failure)
      try {
        const { rows: [user] } = await pool.query(
          `SELECT telegram_id FROM users WHERE id::text = $1`,
          [vacc.owner_id]
        );
        if (user?.telegram_id) {
          const emoji = isExpired ? '🚨' : '⏰';
          const msg = isExpired
            ? `${emoji} <b>Прививка просрочена!</b>\n🐾 <b>${vacc.pet_name}</b>: ${vaccName}\nСрок истёк ${Math.abs(daysLeft)} дн. назад. Обратитесь к ветеринару.`
            : `${emoji} <b>Прививка скоро!</b>\n🐾 <b>${vacc.pet_name}</b>: ${vaccName}\nОсталось ${daysLeft} дн. Не забудьте записаться к врачу.`;
          await sendTelegramMessage(user.telegram_id, msg);
        }
      } catch {}
    }

    if (created > 0 || vaccinations.length > 0) {
      console.log(`[vaccineReminders] scanned ${vaccinations.length}, created ${created} reminders`);
    }
  } catch (e) {
    console.error('[vaccineReminders] error:', e.message);
  }
}

const INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 hours

function startVaccineReminders() {
  runVaccineReminders(); // immediate run on startup
  setInterval(runVaccineReminders, INTERVAL_MS);
}

module.exports = { startVaccineReminders };
