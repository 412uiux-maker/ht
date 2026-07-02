/**
 * Lightweight input validation middleware — no external deps.
 *
 * Usage:
 *   const { validate, body, param } = require('../middleware/validate')
 *   router.post('/path', validate([ body('name').required().string().maxLen(100) ]), handler)
 */

class FieldRule {
  constructor(source, name) {
    this._source = source // 'body' | 'params' | 'query'
    this._name = name
    this._rules = []
  }

  required() { this._rules.push(['required']); return this }
  string()   { this._rules.push(['string']);   return this }
  number()   { this._rules.push(['number']);   return this }
  int()      { this._rules.push(['int']);      return this }
  positive() { this._rules.push(['positive']); return this }
  minLen(n)  { this._rules.push(['minLen', n]); return this }
  maxLen(n)  { this._rules.push(['maxLen', n]); return this }
  min(n)     { this._rules.push(['min', n]);   return this }
  max(n)     { this._rules.push(['max', n]);   return this }
  email()    { this._rules.push(['email']);    return this }
  oneOf(arr) { this._rules.push(['oneOf', arr]); return this }
  match(re)  { this._rules.push(['match', re]); return this }

  _getValue(req) {
    if (this._source === 'body')   return req.body?.[this._name]
    if (this._source === 'params') return req.params?.[this._name]
    if (this._source === 'query')  return req.query?.[this._name]
  }

  _check(req) {
    const val = this._getValue(req)
    for (const [rule, arg] of this._rules) {
      if (rule === 'required') {
        if (val === undefined || val === null || val === '') return `${this._name} is required`
      } else {
        if (val === undefined || val === null || val === '') continue // optional missing — skip
        if (rule === 'string'  && typeof val !== 'string')  return `${this._name} must be a string`
        if (rule === 'number'  && isNaN(Number(val)))        return `${this._name} must be a number`
        if (rule === 'int'     && !Number.isInteger(Number(val))) return `${this._name} must be an integer`
        if (rule === 'positive' && Number(val) <= 0)        return `${this._name} must be positive`
        if (rule === 'minLen'  && String(val).length < arg) return `${this._name} must be at least ${arg} characters`
        if (rule === 'maxLen'  && String(val).length > arg) return `${this._name} must be at most ${arg} characters`
        if (rule === 'min'     && Number(val) < arg)        return `${this._name} must be ≥ ${arg}`
        if (rule === 'max'     && Number(val) > arg)        return `${this._name} must be ≤ ${arg}`
        if (rule === 'email'   && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val))) return `${this._name} must be a valid email`
        if (rule === 'oneOf'   && !arg.includes(val))       return `${this._name} must be one of: ${arg.join(', ')}`
        if (rule === 'match'   && !arg.test(String(val)))   return `${this._name} format is invalid`
      }
    }
    return null
  }
}

const body  = (name) => new FieldRule('body',   name)
const param = (name) => new FieldRule('params', name)
const query = (name) => new FieldRule('query',  name)

function validate(rules) {
  return (req, res, next) => {
    const errors = rules.map(r => r._check(req)).filter(Boolean)
    if (errors.length) return res.status(400).json({ error: errors[0] })
    next()
  }
}

module.exports = { validate, body, param, query }
