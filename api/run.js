import Anthropic from '@anthropic-ai/sdk';

/*
 * One stage of one use-case pipeline per request.
 *
 * The client calls this once per stage and feeds each result into the next, so
 * the sequence on screen is a real chain of model calls rather than one
 * response revealed slowly. Every stage is schema-constrained via
 * output_config.format, which is the point being demonstrated: the value is
 * not "it talks", it is "it returns something downstream code can rely on".
 *
 * Public and unauthenticated, so every stage is capped and rate limited.
 */

const MODEL = process.env.DEMO_MODEL || 'claude-opus-5';
const MAX_INPUT = 1200;        // characters of user text accepted
const MAX_TOKENS = 1024;       // ceiling per stage
const WINDOW_MS = 60_000;
const MAX_STAGE_CALLS_PER_WINDOW = 24; // ~6 full pipelines per IP per minute

/* Best effort only: serverless instances are per-region and recycled, so this
   throttles casual abuse, not a determined attacker. A durable store (Vercel
   KV, Upstash) is the real fix if this ever gets traffic. */
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
  return rec.n > MAX_STAGE_CALLS_PER_WINDOW;
}

const str = (d) => ({ type: 'string', description: d });
const nullable = (d) => ({ type: ['string', 'null'], description: d });

/* Stage ids are the contract with the client, which renders the same labels. */
const USE_CASES = {
  'restaurant-voice': {
    name: 'Restaurant voice agent',
    stages: [
      {
        id: 'understand',
        label: 'Understand the call',
        system:
          'You interpret phone calls to a restaurant. Judge only from the transcript. ' +
          'Never invent details the caller did not say.',
        prompt: (input) => `Caller transcript:\n\n${input}`,
        schema: {
          type: 'object', additionalProperties: false,
          required: ['request', 'party_size', 'caller_name', 'special_request'],
          properties: {
            request: { type: 'string', enum: ['new_booking', 'change_booking', 'cancel_booking', 'opening_hours', 'takeaway_order', 'other'] },
            party_size: { type: ['integer', 'null'] },
            caller_name: nullable('Null unless stated.'),
            special_request: nullable('Seating, access or dietary note, else null.')
          }
        }
      },
      {
        id: 'slot',
        label: 'Resolve the slot',
        system:
          'You turn a vague spoken time into a concrete booking slot. ' +
          'If the caller was ambiguous, say so rather than guessing a precise time.',
        prompt: (input, prior) =>
          `Transcript:\n\n${input}\n\nUnderstood: ${JSON.stringify(prior.understand)}\n\nResolve the slot.`,
        schema: {
          type: 'object', additionalProperties: false,
          required: ['day', 'time_window', 'is_ambiguous', 'needs_confirming'],
          properties: {
            day: nullable('e.g. Friday'),
            time_window: nullable('e.g. 19:00-19:30'),
            is_ambiguous: { type: 'boolean' },
            needs_confirming: str('What to read back to the caller, one sentence.')
          }
        }
      },
      {
        id: 'check',
        label: 'Check and decide',
        system:
          'You decide whether a booking can be taken. Policy: parties of 7 or more, ' +
          'and anything in the last hour before close, need a manager. Be honest about confidence.',
        prompt: (input, prior) =>
          `Understood: ${JSON.stringify(prior.understand)}\nSlot: ${JSON.stringify(prior.slot)}\n\nDecide.`,
        schema: {
          type: 'object', additionalProperties: false,
          required: ['action', 'hand_to_human', 'confidence', 'reason'],
          properties: {
            action: { type: 'string', enum: ['confirm', 'offer_alternative', 'take_waitlist', 'hand_off'] },
            hand_to_human: { type: 'boolean' },
            confidence: { type: 'number', minimum: 0, maximum: 1 },
            reason: str('One sentence, max 25 words.')
          }
        }
      },
      {
        id: 'speak',
        label: 'Speak the reply',
        system:
          'You write what a voice agent says next. Spoken English, short sentences, ' +
          'no lists, no markdown. Read back the booking to confirm. Under 45 words.',
        prompt: (input, prior) =>
          `Understood: ${JSON.stringify(prior.understand)}\nSlot: ${JSON.stringify(prior.slot)}\n` +
          `Decision: ${JSON.stringify(prior.check)}\n\nWhat does the agent say?`,
        schema: {
          type: 'object', additionalProperties: false,
          required: ['say', 'then'],
          properties: {
            say: str('The spoken line.'),
            then: { type: 'string', enum: ['await_confirmation', 'end_call', 'transfer_to_staff'] }
          }
        }
      }
    ]
  },

  'support-triage': {
    name: 'Support triage',
    stages: [
      {
        id: 'classify',
        label: 'Classify intent',
        system: 'You triage inbound support tickets. Be decisive and terse. Judge only from the text.',
        prompt: (input) => `Triage this ticket:\n\n${input}`,
        schema: {
          type: 'object', additionalProperties: false,
          required: ['intent', 'urgency', 'sentiment', 'reasoning'],
          properties: {
            intent: { type: 'string', enum: ['billing', 'cancellation', 'technical', 'account_access', 'feature_request', 'other'] },
            urgency: { type: 'string', enum: ['low', 'normal', 'high', 'critical'] },
            sentiment: { type: 'string', enum: ['angry', 'frustrated', 'neutral', 'positive'] },
            reasoning: str('One sentence, max 20 words.')
          }
        }
      },
      {
        id: 'extract',
        label: 'Extract entities',
        system: 'You extract structured fields for downstream systems. Use null for anything not stated.',
        prompt: (input, prior) => `Ticket:\n\n${input}\n\nTriage: ${JSON.stringify(prior.classify)}\n\nExtract.`,
        schema: {
          type: 'object', additionalProperties: false,
          required: ['customer_name', 'order_id', 'amount', 'deadline_mentioned'],
          properties: {
            customer_name: nullable(), order_id: nullable(),
            amount: nullable(), deadline_mentioned: nullable()
          }
        }
      },
      {
        id: 'decide',
        label: 'Route and gate',
        system:
          'You decide handling. Policy: refunds over $200, anything legal or safety related, ' +
          'and any angry cancellation go to a human. Low confidence must escalate.',
        prompt: (input, prior) =>
          `Ticket:\n\n${input}\n\nTriage: ${JSON.stringify(prior.classify)}\nFields: ${JSON.stringify(prior.extract)}\n\nDecide.`,
        schema: {
          type: 'object', additionalProperties: false,
          required: ['action', 'escalate_to_human', 'confidence', 'policy_basis'],
          properties: {
            action: { type: 'string', enum: ['auto_resolve', 'issue_refund', 'offer_retention', 'escalate', 'request_more_info'] },
            escalate_to_human: { type: 'boolean' },
            confidence: { type: 'number', minimum: 0, maximum: 1 },
            policy_basis: str('One sentence, max 25 words.')
          }
        }
      },
      {
        id: 'draft',
        label: 'Draft reply',
        system:
          'You write support replies. Warm, plain, specific. No corporate filler. ' +
          'Never promise what the decision did not authorise. Under 90 words.',
        prompt: (input, prior) =>
          `Ticket:\n\n${input}\n\nDecision: ${JSON.stringify(prior.decide)}\n\nWrite the reply.`,
        schema: {
          type: 'object', additionalProperties: false,
          required: ['reply', 'tone'],
          properties: {
            reply: str(), tone: { type: 'string', enum: ['apologetic', 'neutral', 'reassuring', 'firm'] }
          }
        }
      }
    ]
  },

  'lead-qualify': {
    name: 'Lead qualification',
    stages: [
      {
        id: 'read',
        label: 'Read the enquiry',
        system: 'You read inbound sales enquiries. Extract only what is stated.',
        prompt: (input) => `Enquiry:\n\n${input}`,
        schema: {
          type: 'object', additionalProperties: false,
          required: ['company', 'need', 'timeline', 'budget_signal'],
          properties: {
            company: nullable(), need: str('One sentence.'),
            timeline: nullable(), budget_signal: nullable()
          }
        }
      },
      {
        id: 'score',
        label: 'Score the fit',
        system:
          'You score lead fit for an AI systems consultancy. Good fit: a real production ' +
          'problem, a named timeline, and someone who can authorise spend. Be sceptical.',
        prompt: (input, prior) => `Enquiry:\n\n${input}\n\nRead: ${JSON.stringify(prior.read)}\n\nScore it.`,
        schema: {
          type: 'object', additionalProperties: false,
          required: ['score', 'tier', 'missing', 'rationale'],
          properties: {
            score: { type: 'number', minimum: 0, maximum: 100 },
            tier: { type: 'string', enum: ['hot', 'warm', 'cold', 'not_a_fit'] },
            missing: str('What is still unknown, one sentence.'),
            rationale: str('One sentence, max 25 words.')
          }
        }
      },
      {
        id: 'next',
        label: 'Pick next action',
        system: 'You choose the next action on a lead. Do not propose a call for a cold or unqualified lead.',
        prompt: (input, prior) => `Read: ${JSON.stringify(prior.read)}\nScore: ${JSON.stringify(prior.score)}\n\nNext action?`,
        schema: {
          type: 'object', additionalProperties: false,
          required: ['action', 'question_to_ask', 'priority'],
          properties: {
            action: { type: 'string', enum: ['book_call', 'ask_qualifying_question', 'send_resources', 'decline'] },
            question_to_ask: nullable('The single best question, else null.'),
            priority: { type: 'string', enum: ['now', 'this_week', 'backlog'] }
          }
        }
      }
    ]
  },

  'doc-extract': {
    name: 'Invoice extraction',
    stages: [
      {
        id: 'parse',
        label: 'Parse the document',
        system: 'You read invoice text and extract fields exactly. Never infer a number that is not present.',
        prompt: (input) => `Invoice text:\n\n${input}`,
        schema: {
          type: 'object', additionalProperties: false,
          required: ['supplier', 'invoice_number', 'total', 'currency', 'due_date'],
          properties: {
            supplier: nullable(), invoice_number: nullable(),
            total: nullable(), currency: nullable(), due_date: nullable()
          }
        }
      },
      {
        id: 'validate',
        label: 'Validate and flag',
        system:
          'You check extracted invoice data for problems before it reaches finance. ' +
          'Flag missing required fields, impossible dates, and totals that do not parse as money.',
        prompt: (input, prior) => `Text:\n\n${input}\n\nExtracted: ${JSON.stringify(prior.parse)}\n\nValidate.`,
        schema: {
          type: 'object', additionalProperties: false,
          required: ['is_valid', 'problems', 'needs_human'],
          properties: {
            is_valid: { type: 'boolean' },
            problems: { type: 'array', items: { type: 'string' } },
            needs_human: { type: 'boolean' }
          }
        }
      },
      {
        id: 'route',
        label: 'Route for approval',
        system: 'You route validated invoices. Anything invalid, or over 5000, needs an approver.',
        prompt: (input, prior) =>
          `Extracted: ${JSON.stringify(prior.parse)}\nValidation: ${JSON.stringify(prior.validate)}\n\nRoute it.`,
        schema: {
          type: 'object', additionalProperties: false,
          required: ['destination', 'approver_required', 'note'],
          properties: {
            destination: { type: 'string', enum: ['auto_post', 'approval_queue', 'exceptions_queue'] },
            approver_required: { type: 'boolean' },
            note: str('One sentence for the finance team.')
          }
        }
      }
    ]
  }
};

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  if (!process.env.ANTHROPIC_API_KEY) {
    /* Distinct code so the UI can say "not configured" instead of "failed". */
    return res.status(503).json({ error: 'not_configured' });
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) return res.status(429).json({ error: 'rate_limited' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'bad_json' }); }
  }
  const { useCase, stage, input, prior } = body || {};

  const uc = USE_CASES[useCase];
  if (!uc) return res.status(400).json({ error: 'unknown_use_case' });
  const def = uc.stages.find((s) => s.id === stage);
  if (!def) return res.status(400).json({ error: 'unknown_stage' });
  if (typeof input !== 'string' || !input.trim()) return res.status(400).json({ error: 'empty_input' });

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
      return res.status(502).json({ error: 'unparsed', stop_reason: response.stop_reason || null });
    }

    return res.status(200).json({
      useCase, stage: def.id, label: def.label,
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
