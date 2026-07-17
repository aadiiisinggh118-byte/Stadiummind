// Schemas mirror the tool declarations sent to Gemini in api/chat.js.
// Kept here as plain data so validation is a pure, unit-testable function
// rather than logic buried inside the API handler.
const TOOL_SCHEMAS = {
  recommend_entrance: {
    required: [],
    enums: {},
  },
  assess_crowd_risk: {
    required: [],
    enums: {},
  },
  plan_accessible_route: {
    required: [],
    enums: {},
  },
  lookup_venue_policy: {
    required: ['topic'],
    enums: { topic: ['bagPolicy', 'reEntry', 'openingTime', 'parking', 'wifi', 'smoking'] },
  },
  check_service_wait: {
    required: [],
    enums: { serviceId: ['concessions', 'restrooms', 'merch', 'accessible-seating'] },
  },
  recommend_transport: {
    required: [],
    enums: {},
  },
  remember_fact: {
    required: ['key', 'value'],
    enums: { key: ['seatBlock', 'accessibilityNeed', 'language'] },
  },
}

/**
 * Validates a tool call's arguments against its schema. This is what makes
 * the self-healing loop possible: instead of either crashing on a malformed
 * call or silently executing it with bad data, we can detect the problem
 * and give the model a precise, structured reason to correct itself.
 */
export function validateArgs(toolName, args = {}) {
  const schema = TOOL_SCHEMAS[toolName]
  if (!schema) return { valid: false, errors: [`Unknown tool "${toolName}"`] }

  const errors = []
  for (const field of schema.required) {
    if (args[field] === undefined || args[field] === null || args[field] === '') {
      errors.push(`Missing required field "${field}"`)
    }
  }
  for (const [field, allowed] of Object.entries(schema.enums)) {
    if (args[field] !== undefined && !allowed.includes(args[field])) {
      errors.push(`Field "${field}" was "${args[field]}", must be one of: ${allowed.join(', ')}`)
    }
  }
  return { valid: errors.length === 0, errors }
}
