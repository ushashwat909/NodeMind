import { BadRequestError } from '../utils/errors.js'

/**
 * Validates a single field against a rule set
 */
function validateField(value, fieldName, rules) {
  const errors = []

  // Check required
  if (rules.required && (value === undefined || value === null || value === '')) {
    errors.push(`${fieldName} is required`)
    return errors
  }

  // If value is not provided and not required, skip further checks
  if (value === undefined || value === null) {
    return errors
  }

  // Check type
  if (rules.type) {
    if (rules.type === 'array') {
      if (!Array.isArray(value)) {
        errors.push(`${fieldName} must be an array`)
      }
    } else if (rules.type === 'integer') {
      if (!Number.isInteger(Number(value))) {
        errors.push(`${fieldName} must be an integer`)
      }
    } else if (typeof value !== rules.type) {
      errors.push(`${fieldName} must be of type ${rules.type}`)
    }
  }

  // Check string lengths
  if (typeof value === 'string') {
    if (rules.minLength && value.length < rules.minLength) {
      errors.push(`${fieldName} must be at least ${rules.minLength} characters`)
    }
    if (rules.maxLength && value.length > rules.maxLength) {
      errors.push(`${fieldName} must be at most ${rules.maxLength} characters`)
    }
  }

  // Check numeric bounds
  if (typeof value === 'number' || (rules.type === 'integer' && !isNaN(Number(value)))) {
    const num = Number(value)
    if (rules.min !== undefined && num < rules.min) {
      errors.push(`${fieldName} must be >= ${rules.min}`)
    }
    if (rules.max !== undefined && num > rules.max) {
      errors.push(`${fieldName} must be <= ${rules.max}`)
    }
  }

  // Check enums
  if (rules.enum && !rules.enum.includes(value)) {
    errors.push(`${fieldName} must be one of: ${rules.enum.join(', ')}`)
  }

  // Check regex
  if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
    errors.push(rules.patternMessage || `${fieldName} format is invalid`)
  }

  return errors
}

/**
 * Reusable schema validator middleware generator
 * @param {object} schema
 * @param {object} [schema.body]
 * @param {object} [schema.query]
 * @param {object} [schema.params]
 */
export function validate(schema = {}) {
  return (req, res, next) => {
    const validationErrors = []

    for (const source of ['body', 'query', 'params']) {
      if (!schema[source]) continue

      const target = req[source] || {}
      for (const [field, rules] of Object.entries(schema[source])) {
        const fieldErrors = validateField(target[field], field, rules)
        for (const err of fieldErrors) {
          validationErrors.push({
            field,
            source,
            message: err,
          })
        }
      }
    }

    if (validationErrors.length > 0) {
      return next(new BadRequestError('Validation failed for request parameters', validationErrors))
    }

    next()
  }
}
