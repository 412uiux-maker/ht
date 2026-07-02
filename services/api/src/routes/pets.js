const { serverError } = require('../helpers/respond');
const express = require('express');
const pool = require('../db');
const { logHealthEvent } = require('../helpers/healthEvents');
const router = express.Router();

const VALID_SPECIES  = ['cat','dog','rabbit','parrot','hamster','fish','other'];
const VALID_SEX      = ['male','female','unknown'];
const VALID_P_TYPES  = ['eu','intl','none'];
const VALID_DOC_KINDS = ['passport_page','vaccination','other'];
const VALID_VACC_TYPES = ['rabies','dhppi','other'];
const CHIP_RE = /^\d{15}$/;

// Ownership helper — returns the pet row or writes 404/403 and returns null
async function assertOwner(petId, ownerId, res) {
  const { rows: [pet] } = await pool.query('SELECT owner_id FROM pets WHERE id=$1', [petId]);
  if (!pet) { res.status(404).json({ error: 'Not found' }); return null; }
  if (pet.owner_id !== ownerId) { res.status(403).json({ error: 'Forbidden' }); return null; }
  return pet;
}

// ─── Pets CRUD ────────────────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  const { owner_id } = req.query;
  if (!owner_id) return res.status(400).json({ error: 'owner_id required' });
  try {
    const { rows } = await pool.query(
      'SELECT * FROM pets WHERE owner_id = $1 ORDER BY created_at DESC',
      [owner_id]
    );
    res.json(rows);
  } catch (e) {
    serverError(res, e);
  }
});

router.post('/', async (req, res) => {
  const {
    owner_id, species, name, breed, sex, birth_date, weight_kg, notes, avatar_emoji,
    color, sterilized, microchip_number, passport_number, passport_type,
  } = req.body;
  if (!owner_id || !name) return res.status(400).json({ error: 'owner_id and name are required' });
  if (species && !VALID_SPECIES.includes(species)) return res.status(400).json({ error: 'invalid species' });
  if (sex     && !VALID_SEX.includes(sex))         return res.status(400).json({ error: 'invalid sex' });
  if (passport_type && !VALID_P_TYPES.includes(passport_type)) return res.status(400).json({ error: 'invalid passport_type' });
  if (microchip_number && !CHIP_RE.test(microchip_number)) {
    return res.status(422).json({ error: 'chip_format', message: 'Номер чипа — ровно 15 цифр' });
  }
  try {
    const { rows: [pet] } = await pool.query(
      `INSERT INTO pets
         (owner_id, species, name, breed, sex, birth_date, weight_kg, notes, avatar_emoji,
          color, sterilized, microchip_number, passport_number, passport_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [
        owner_id, species || 'other', name, breed || null, sex || 'unknown',
        birth_date || null, weight_kg || null, notes || null, avatar_emoji || '🐾',
        color || null,
        sterilized !== undefined ? sterilized : null,
        microchip_number || null,
        passport_number || null,
        passport_type || 'none',
      ]
    );
    res.status(201).json(pet);
  } catch (e) {
    if (e.constraint === 'pets_microchip_uidx') {
      return res.status(422).json({ error: 'chip_duplicate', message: 'Этот чип уже зарегистрирован' });
    }
    serverError(res, e);
  }
});

router.get('/:id', async (req, res) => {
  const { owner_id } = req.query;
  try {
    const { rows: [pet] } = await pool.query('SELECT * FROM pets WHERE id = $1', [req.params.id]);
    if (!pet) return res.status(404).json({ error: 'Not found' });
    if (owner_id && pet.owner_id !== owner_id) return res.status(403).json({ error: 'Forbidden' });
    res.json(pet);
  } catch (e) {
    serverError(res, e);
  }
});

router.put('/:id', async (req, res) => {
  const {
    owner_id, species, name, breed, sex, birth_date, weight_kg, notes, avatar_emoji,
    color, sterilized, microchip_number, passport_number, passport_type,
  } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  if (species && !VALID_SPECIES.includes(species)) return res.status(400).json({ error: 'invalid species' });
  if (sex     && !VALID_SEX.includes(sex))         return res.status(400).json({ error: 'invalid sex' });
  if (passport_type && !VALID_P_TYPES.includes(passport_type)) return res.status(400).json({ error: 'invalid passport_type' });
  if (microchip_number && !CHIP_RE.test(microchip_number)) {
    return res.status(422).json({ error: 'chip_format', message: 'Номер чипа — ровно 15 цифр' });
  }
  try {
    if (owner_id && !await assertOwner(req.params.id, owner_id, res)) return;
    const { rows: [pet] } = await pool.query(
      `UPDATE pets SET
         species=$1, name=$2, breed=$3, sex=$4, birth_date=$5,
         weight_kg=$6, notes=$7, avatar_emoji=$8,
         color=$9, sterilized=$10, microchip_number=$11,
         passport_number=$12, passport_type=$13, updated_at=NOW()
       WHERE id=$14 RETURNING *`,
      [
        species || 'other', name, breed || null, sex || 'unknown',
        birth_date || null, weight_kg || null, notes || null, avatar_emoji || '🐾',
        color || null,
        sterilized !== undefined ? sterilized : null,
        microchip_number || null,
        passport_number || null,
        passport_type || 'none',
        req.params.id,
      ]
    );
    if (!pet) return res.status(404).json({ error: 'Not found' });
    res.json(pet);
  } catch (e) {
    if (e.constraint === 'pets_microchip_uidx') {
      return res.status(422).json({ error: 'chip_duplicate', message: 'Этот чип уже зарегистрирован' });
    }
    serverError(res, e);
  }
});

router.delete('/:id', async (req, res) => {
  const { owner_id } = req.query;
  try {
    if (owner_id && !await assertOwner(req.params.id, owner_id, res)) return;
    const { rowCount } = await pool.query('DELETE FROM pets WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (e) {
    serverError(res, e);
  }
});

// ─── Consultation history ──────────────────────────────────────────────────────

router.get('/:id/consultations', async (req, res) => {
  const { owner_id } = req.query;
  try {
    if (owner_id && !await assertOwner(req.params.id, owner_id, res)) return;
    const { rows } = await pool.query(
      `SELECT c.id, c.created_at, c.status, c.report, c.summary, c.duration_min, c.call_started_at,
              v.name AS vet_name, v.specialty, v.avatar_emoji
       FROM consultations c
       JOIN vets v ON v.id = c.vet_id
       WHERE c.pet_id = $1 AND c.report IS NOT NULL
       ORDER BY c.created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (e) {
    serverError(res, e);
  }
});

// ─── Documents ────────────────────────────────────────────────────────────────

router.get('/:id/documents', async (req, res) => {
  const { owner_id } = req.query;
  if (!owner_id) return res.status(400).json({ error: 'owner_id required' });
  try {
    if (!await assertOwner(req.params.id, owner_id, res)) return;
    const { rows } = await pool.query(
      'SELECT * FROM pet_documents WHERE pet_id=$1 ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json(rows);
  } catch (e) {
    serverError(res, e);
  }
});

router.post('/:id/documents', async (req, res) => {
  const { owner_id, kind, file_url, caption } = req.body;
  if (!owner_id) return res.status(400).json({ error: 'owner_id required' });
  if (!file_url) return res.status(400).json({ error: 'file_url required' });
  if (kind && !VALID_DOC_KINDS.includes(kind)) return res.status(400).json({ error: 'invalid kind' });
  try {
    if (!await assertOwner(req.params.id, owner_id, res)) return;
    const { rows: [doc] } = await pool.query(
      `INSERT INTO pet_documents (pet_id, kind, file_url, caption)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.params.id, kind || 'passport_page', file_url, caption || null]
    );
    res.status(201).json(doc);
  } catch (e) {
    serverError(res, e);
  }
});

router.delete('/:id/documents/:docId', async (req, res) => {
  const { owner_id } = req.query;
  if (!owner_id) return res.status(400).json({ error: 'owner_id required' });
  try {
    if (!await assertOwner(req.params.id, owner_id, res)) return;
    const { rowCount } = await pool.query(
      'DELETE FROM pet_documents WHERE id=$1 AND pet_id=$2',
      [req.params.docId, req.params.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (e) {
    serverError(res, e);
  }
});

// ─── Vaccinations ─────────────────────────────────────────────────────────────

router.get('/:id/vaccinations', async (req, res) => {
  const { owner_id } = req.query;
  if (!owner_id) return res.status(400).json({ error: 'owner_id required' });
  try {
    if (!await assertOwner(req.params.id, owner_id, res)) return;
    const { rows } = await pool.query(
      'SELECT * FROM vaccinations WHERE pet_id=$1 ORDER BY date_administered DESC',
      [req.params.id]
    );
    res.json(rows);
  } catch (e) {
    serverError(res, e);
  }
});

router.post('/:id/vaccinations', async (req, res) => {
  const { owner_id, type, name, date_administered, valid_until, vet_name, document_id, verified_by } = req.body;
  if (!owner_id) return res.status(400).json({ error: 'owner_id required' });
  if (!type || !VALID_VACC_TYPES.includes(type)) return res.status(400).json({ error: 'invalid type' });
  if (!date_administered) return res.status(400).json({ error: 'date_administered required' });
  try {
    if (!await assertOwner(req.params.id, owner_id, res)) return;
    const { rows: [vacc] } = await pool.query(
      `INSERT INTO vaccinations
         (pet_id, type, name, date_administered, valid_until, vet_name, document_id, verified_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        req.params.id, type, name || null, date_administered,
        valid_until || null, vet_name || null,
        document_id || null, verified_by || null,
      ]
    );
    const vaccTitle = name
      ? `💉 ${name}${valid_until ? ` · до ${valid_until}` : ''}`
      : `💉 Вакцинация (${type})${valid_until ? ` · до ${valid_until}` : ''}`;
    await logHealthEvent(req.params.id, {
      type: 'vaccination', source: vet_name ? 'vet' : 'owner',
      refTable: 'vaccinations', refId: vacc.id,
      title: vaccTitle, occurredAt: new Date(date_administered),
    });
    res.status(201).json(vacc);
  } catch (e) {
    serverError(res, e);
  }
});

router.delete('/:id/vaccinations/:vId', async (req, res) => {
  const { owner_id } = req.query;
  if (!owner_id) return res.status(400).json({ error: 'owner_id required' });
  try {
    if (!await assertOwner(req.params.id, owner_id, res)) return;
    const { rowCount } = await pool.query(
      'DELETE FROM vaccinations WHERE id=$1 AND pet_id=$2',
      [req.params.vId, req.params.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (e) {
    serverError(res, e);
  }
});

// ─── Health event timeline ────────────────────────────────────────────────────

const VALID_EVENT_TYPES = ['vaccination','weight','consultation','prescription','reminder','note'];
const MANUAL_EVENT_TYPES = ['note','weight']; // owner can only POST these manually

router.get('/:id/events', async (req, res) => {
  const { owner_id, type, limit = 50, before } = req.query;
  if (!owner_id) return res.status(400).json({ error: 'owner_id required' });
  try {
    if (!await assertOwner(req.params.id, owner_id, res)) return;
    const conditions = ['pet_id = $1'];
    const params = [req.params.id];
    let idx = 2;
    if (type && VALID_EVENT_TYPES.includes(type)) {
      conditions.push(`type = $${idx++}`); params.push(type);
    }
    if (before) {
      conditions.push(`occurred_at < $${idx++}`); params.push(before);
    }
    params.push(Math.min(Number(limit) || 50, 100));
    const { rows } = await pool.query(
      `SELECT * FROM health_events WHERE ${conditions.join(' AND ')}
       ORDER BY occurred_at DESC LIMIT $${idx}`,
      params
    );
    res.json(rows);
  } catch (e) { serverError(res, e); }
});

router.post('/:id/events', async (req, res) => {
  const { owner_id, type, title, note, occurred_at } = req.body;
  if (!owner_id) return res.status(400).json({ error: 'owner_id required' });
  if (!type || !MANUAL_EVENT_TYPES.includes(type)) {
    return res.status(400).json({ error: `type must be one of: ${MANUAL_EVENT_TYPES.join(',')}` });
  }
  if (!title?.trim()) return res.status(400).json({ error: 'title required' });
  try {
    if (!await assertOwner(req.params.id, owner_id, res)) return;
    const { rows: [event] } = await pool.query(
      `INSERT INTO health_events (pet_id, type, source, title, note, occurred_at)
       VALUES ($1,$2,'owner',$3,$4,$5) RETURNING *`,
      [req.params.id, type, title.trim(), note?.trim() ?? null, occurred_at ?? new Date()]
    );
    res.status(201).json(event);
  } catch (e) { serverError(res, e); }
});

// ─── Weight update (updates pets.weight_kg + logs event) ─────────────────────

router.post('/:id/weight', async (req, res) => {
  const { owner_id, value, measured_at } = req.body;
  if (!owner_id) return res.status(400).json({ error: 'owner_id required' });
  const kg = parseFloat(value);
  if (!kg || kg <= 0 || kg > 999) return res.status(400).json({ error: 'valid value required' });
  try {
    if (!await assertOwner(req.params.id, owner_id, res)) return;
    const { rows: [pet] } = await pool.query(
      `UPDATE pets SET weight_kg=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
      [kg, req.params.id]
    );
    if (!pet) return res.status(404).json({ error: 'Not found' });
    const { rows: [event] } = await pool.query(
      `INSERT INTO health_events (pet_id, type, source, title, occurred_at)
       VALUES ($1,'weight','owner',$2,$3) RETURNING *`,
      [req.params.id, `⚖️ ${kg} кг`, measured_at ?? new Date()]
    );
    res.status(201).json({ pet, event });
  } catch (e) { serverError(res, e); }
});

module.exports = router;
