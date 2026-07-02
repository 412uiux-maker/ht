const { serverError } = require('../helpers/respond');
const express = require('express');
const pool = require('../db');
const router = express.Router();

const VALID_SPECIES     = ['cat','dog','rabbit','parrot','hamster','fish','other'];
const VALID_STAGES      = ['kitten','adult','senior'];
const VALID_WEIGHT      = ['light','medium','large'];
const VALID_BUDGET      = ['economy','mid','premium'];
const VALID_HEALTH_TAGS = ['digestion','skin','joints','weight_control','dental','urinary'];

// GET /api/foods — full catalogue (optional ?species= filter)
router.get('/', async (req, res) => {
  try {
    const { species } = req.query;
    const { rows } = species
      ? await pool.query('SELECT * FROM foods WHERE $1 = ANY(species) AND is_active ORDER BY rating DESC', [species])
      : await pool.query('SELECT * FROM foods WHERE is_active ORDER BY rating DESC');
    res.json(rows);
  } catch (e) {
    serverError(res, e);
  }
});

// POST /api/foods/quiz — score & rank recommendations
router.post('/quiz', async (req, res) => {
  const { species, life_stage, weight_class, health_tags = [], budget_tier } = req.body;

  if (!species || !VALID_SPECIES.includes(species))
    return res.status(400).json({ error: 'valid species required' });
  if (!life_stage || !VALID_STAGES.includes(life_stage))
    return res.status(400).json({ error: 'valid life_stage required (kitten|adult|senior)' });
  if (budget_tier && !VALID_BUDGET.includes(budget_tier))
    return res.status(400).json({ error: 'invalid budget_tier' });
  const invalidTags = health_tags.filter(t => !VALID_HEALTH_TAGS.includes(t));
  if (invalidTags.length)
    return res.status(400).json({ error: `invalid health_tags: ${invalidTags.join(', ')}` });

  try {
    const { rows: foods } = await pool.query(
      'SELECT * FROM foods WHERE $1 = ANY(species) AND is_active',
      [species]
    );

    const scored = foods.map(f => {
      let score = 0;

      // Life stage match (required weight: 35)
      if (f.life_stages.includes(life_stage)) score += 35;

      // Budget tier (20 — exact match bonus, neighbours get partial)
      if (budget_tier) {
        const tiers = ['economy', 'mid', 'premium'];
        const diff  = Math.abs(tiers.indexOf(budget_tier) - tiers.indexOf(f.budget_tier));
        if (diff === 0) score += 20;
        else if (diff === 1) score += 8;
      }

      // Weight class (15)
      if (weight_class && f.weight_class && f.weight_class.includes(weight_class)) score += 15;

      // Health tag overlap (12 per tag, max 36)
      if (health_tags.length && f.health_tags) {
        const overlap = health_tags.filter(t => f.health_tags.includes(t)).length;
        score += Math.min(overlap * 12, 36);
      }

      // Rating bonus (up to 10)
      score += parseFloat(f.rating) * 2;

      const maxScore = 35 + 20 + 15 + 36 + 10;
      const match = Math.round((score / maxScore) * 100);

      return { ...f, score, match };
    });

    // Only include foods with at least life_stage match; sort by score desc
    const results = scored
      .filter(f => f.score >= 35)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    res.json(results);
  } catch (e) {
    serverError(res, e);
  }
});

module.exports = router;
