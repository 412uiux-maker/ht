const pool = require('../db');

/**
 * Write a single event to health_events.
 * Silent on error — never lets a log failure break the calling request.
 */
async function logHealthEvent(petId, { type, source = 'owner', refTable, refId, title, note, occurredAt }) {
  try {
    await pool.query(
      `INSERT INTO health_events
         (pet_id, type, source, ref_table, ref_id, title, note, occurred_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        petId, type, source,
        refTable ?? null, refId ?? null,
        title, note ?? null,
        occurredAt ?? new Date(),
      ]
    );
  } catch (e) {
    console.error('[healthEvents] log failed:', e.message);
  }
}

module.exports = { logHealthEvent };
