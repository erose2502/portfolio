import Anthropic from '@anthropic-ai/sdk';

/*
 * One stage of a support pipeline per request.
 *
 * The client calls this once per stage and feeds each result into the next,
 * so the sequence on screen is a real chain of model calls rather than one
 * response revealed slowly. Each stage is schema-constrained via
 * output_config.format, which is the point being demonstrated: the value is
 * not "it talks", it is "it returns something downstream code can rely on".
 *
 * Public and unauthenticated, so every stage is capped and rate limited.
 */

const MODEL = process.env.DEMO_MODEL || 'claude-opus-5';
const MAX_INPUT = 1200;        // characters of user text accepted
const MAX_TOKENS = 1024;       // ceiling per stage
const WINDOW_MS = 60_000;
const MAX_RUNS_PER_WINDOW = 6; // full pipelines per IP per minute

/* Best effort only: serverless instances are per-region and recycled, so this
   throttles casual abuse, not a determined attacker. A durable store (Upstash,
   Vercel KV) is the real fix if this ever gets traffic. */
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now - rec.start > WINDOW_MS) {
    hits.set(ip, { start: now, n: 1 });
    if (hits.size > 5000) hits.clear();
    return false;
  }
  rec.n += 1;
  return rec.n > MAX_RUNS_PER_WINDOW * STAGES.length;
}

const STAGES = [
  {
    id: 'classify',
    label: 'Classify intent',
    system:
      'You triage inbound customer support tickets. Be decisive and terse. ' +
      'Judge only from the ticket text; never invent account details.',
    prompt: (input) => `Triage this ticket:\n\n${input}`,
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['intent', 'urgency', 'sentiment', 'reasoning'],
      properties: {
        intent: {
          type: 'string',
          enum: ['billing', 'cancellation', 'technical', 'account_access', 'feature_request', 'other']
        },
        urgency: { type: 'string', enum: ['low', 'normal', 'high', 'critical'] },
        sentiment: { type: 'string', enum: ['angry', 'frustrated', 'neutral', 'positive'] },
        reasoning: { type: 'string', description: 'One sentence, max 20 words.' }
      }
    }
  },
  {
    id: 'extract',
    label: 'Extract entities',
    system:
      'You extract structured fields from support tickets for downstream systems. ' +
      'Use null for anything not stated in the text. Never guess a value.',
    prompt: (input, prior) =>
      `Ticket:\n\n${input}\n\nTriage: ${JSON.stringify(prior.classify)}\n\nExtract the fields.`,
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['customer_name', 'order_id', 'amount', 'product', 'deadline_mentioned'],
      properties: {
        customer_name: { type: ['string', 'null'] },
        order_id: { type: ['string', 'null'] },
        amount: { type: ['string', 'null'] },
        product: { type: ['string', 'null'] },
        deadline_mentioned: { type: ['string', 'null'] }
      }
    }
  },
  {
    id: 'decide',
    label: 'Route and gate',
    system:
      'You decide how a support ticket is handled. Policy: refunds over $200, ' +
      'anything legal or safety related, and any angry cancellation go to a human. ' +
      'Set confidence honestly; low confidence must escalate.',
    prompt: (input, prior) =>
      `Ticket:\n\n${input}\n\nTriage: ${JSON.stringify(prior.classify)}\n` +
      `Fields: ${JSON.stringify(prior.extract)}\n\nDecide the action.`,
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['action', 'escalate_to_human', 'confidence', 'policy_basis'],
      properties: {
        action: {
          type: 'string',
          enum: ['auto_resolve', 'issue_refund', 'offer_retention', 'escalate', 'request_more_info']
        },
        escalate_to_human: { type: 'boolean' },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        policy_basis: { type: 'string', description: 'One sentence, max 25 words.' }
      }
    }
  },
  {
    id: 'draft',
    label: 'Draft reply',
    system:
      'You write support replies. Warm, plain, specific. No corporate filler. ' +
      'Never promise anything the decision did not authorise. Under 90 words.',
    prompt: (input, prior) =>
      `Ticket:\n\n${input}\n\nDecision: ${JSON.stringify(prior.decide)}\n` +
      `Fields: ${JSON.stringify(prior.extract)}\n\nWrite the reply.`,
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['reply', 'tone'],
      properties: {
        reply: { type: 'string' },
        tone: { type: 'string', enum: ['apologetic', 'neutral', 'reassuring', 'firm'] }
      }
    }
  }
];

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    /* Distinct code so the UI can say "not configured" instead of "failed". */
    return res.status(503).json({ error: 'not_configured' });
  }

  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) {
    return res.status(429).json({ error: 'rate_limited' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'bad_json' }); }
  }
  const { stage, input, prior } = body || {};

  const def = STAGES.find((s) => s.id === stage);
  if (!def) return res.status(400).json({ error: 'unknown_stage' });
  if (typeof input !== 'string' || !input.trim()) {
    return res.status(400).json({ error: 'empty_input' });
  }

  const text = input.slice(0, MAX_INPUT);
  const started = Date.now();

  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: def.system,
      messages: [{ role: 'user', content: def.prompt(text, prior || {}) }],
      output_config: { format: { type: 'json_schema', schema: def.schema } }
    });

    /* A schema-constrained response can still come back unparsed (refusal, or
       max_tokens mid-object). Treat that as a stage failure, not a crash. */
    const parsed = response.parsed_output;
    if (!parsed) {
      return res.status(502).json({
        error: 'unparsed',
        stop_reason: response.stop_reason || null
      });
    }

    return res.status(200).json({
      stage: def.id,
      label: def.label,
      output: parsed,
      ms: Date.now() - started,
      usage: {
        input: response.usage?.input_tokens ?? null,
        output: response.usage?.output_tokens ?? null
      }
    });
  } catch (err) {
    const status = err?.status;
    if (status === 429) return res.status(429).json({ error: 'upstream_rate_limited' });
    if (status === 401) return res.status(503).json({ error: 'not_configured' });
    return res.status(500).json({ error: 'stage_failed' });
  }
}

export const config = { runtime: 'nodejs' };
