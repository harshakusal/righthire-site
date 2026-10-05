/**
 * RightHire demo proxy.
 *
 * The browser never sees an API key. Instant mode on the static site does not
 * call this worker at all. Deep AI mode POSTs { jd, resume } to /analyze.
 *
 * Secrets (set with `wrangler secret put`, never committed):
 *   LLM_API_KEY
 *
 * Vars (wrangler.toml):
 *   LLM_BASE_URL   default https://api.openai.com/v1
 *   LLM_MODEL      default gpt-4o-mini
 *   LLM_JSON_MODE  set to "off" for providers that reject response_format
 *   ALLOWED_ORIGIN comma-separated origins, or * 
 */

var MAX_JD = 20000;
var MAX_RESUME = 30000;

var SYSTEM = [
  'You are RightHire, an evidence-first résumé reviewer.',
  'Score the résumé against the job description. Real work beats a keyword.',
  'A skill that appears only on a skills list is partial at best, and listedOnly must be true.',
  'A bare keyword inside a generic sentence is partial, not matched.',
  'Matched means the résumé shows the skill in described work: a system, an action, and ideally a number or outcome.',
  'If the résumé denies a skill ("have not shipped", "no experience with"), mark it missing.',
  'Quote the résumé line that is the evidence, or an empty string when there is none.',
  'The AI-written percentage is a likelihood, not proof. People can write this way without a tool.',
  'Signals to weigh: stock phrases (spearheaded, leveraged, dynamic, results-driven, proven track record), uniform sentence length, template bullets, lack of concrete numbers and named systems, and stacked buzzwords.',
  'Return JSON only, matching the schema in the user message. No markdown.'
].join(' ');

export default {
  async fetch(request, env) {
    var origin = request.headers.get('Origin') || '';
    if (request.method === 'OPTIONS') {
      if (origin && !originAllowed(origin, env)) {
        return json({ error: 'Origin not allowed.' }, 403, origin, env);
      }
      return new Response(null, { status: 204, headers: corsHeaders(origin, env) });
    }

    var url = new URL(request.url);
    var path = url.pathname.replace(/\/$/, '') || '/';

    if (request.method === 'GET' && (path === '/' || path === '/health')) {
      return json({ ok: true, service: 'righthire-demo-proxy' }, 200, origin, env);
    }

    if (request.method !== 'POST' || (path !== '/' && path !== '/analyze')) {
      return json({ error: 'POST /analyze with { jd, resume }.' }, 404, origin, env);
    }

    if (origin && !originAllowed(origin, env)) {
      return json({ error: 'Origin not allowed.' }, 403, origin, env);
    }

    if (!env.LLM_API_KEY) {
      return json({ error: 'The proxy has no LLM_API_KEY secret.' }, 500, origin, env);
    }

    var body;
    try {
      body = await request.json();
    } catch (err) {
      return json({ error: 'Send JSON: { jd, resume }.' }, 400, origin, env);
    }

    var jd = clip(body && body.jd, MAX_JD);
    var resume = clip(body && body.resume, MAX_RESUME);
    if (jd.length < 40 || resume.length < 40) {
      return json({ error: 'The job description and résumé are too short to score.' }, 400, origin, env);
    }

    var base = String(env.LLM_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
    var model = env.LLM_MODEL || 'gpt-4o-mini';
    var payload = {
      model: model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: userPrompt(jd, resume) }
      ]
    };
    if (String(env.LLM_JSON_MODE || '').toLowerCase() !== 'off') {
      payload.response_format = { type: 'json_object' };
    }

    var upstream;
    try {
      upstream = await fetch(base + '/chat/completions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer ' + env.LLM_API_KEY
        },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      return json({ error: 'The model request failed.' }, 502, origin, env);
    }

    var raw = await upstream.text();
    if (!upstream.ok) {
      return json({ error: 'The model returned an error.' }, 502, origin, env);
    }

    var content = '';
    try {
      var parsed = JSON.parse(raw);
      content = parsed.choices && parsed.choices[0] && parsed.choices[0].message
        ? parsed.choices[0].message.content
        : '';
    } catch (err) {
      return json({ error: 'The model response was not JSON.' }, 502, origin, env);
    }

    var report;
    try {
      report = normalizeReport(JSON.parse(stripFences(content)));
    } catch (err) {
      return json({ error: 'The model did not return a usable report.' }, 502, origin, env);
    }

    return json(report, 200, origin, env);
  }
};

function userPrompt(jd, resume) {
  return [
    'Job description:',
    jd,
    '',
    'Résumé:',
    resume,
    '',
    'Return one JSON object with this shape:',
    '{',
    '  "fitScore": 0-100,',
    '  "verdict": "Strong" | "Possible" | "Weak",',
    '  "headline": "one or two sentences",',
    '  "experience": { "summary": "years and seniority compared with the JD", "jdYears": number|null, "resumeYears": number|null, "jdLevel": string|null, "resumeLevel": string|null },',
    '  "requirements": [{ "text": "", "priority": "must"|"nice", "status": "matched"|"partial"|"missing", "listedOnly": false, "points": 0-100, "evidence": "quoted résumé line or empty", "note": "why this status" }],',
    '  "strengths": [{ "title": "", "detail": "" }],',
    '  "gaps": [{ "title": "", "detail": "" }],',
    '  "gapIntro": "",',
    '  "ai": {',
    '    "percent": 0-100,',
    '    "disclaimer": "This is an estimate of how much the writing resembles common AI-generated résumé language. It is not proof that a person or a tool wrote it.",',
    '    "signals": [{ "id": "phrases|uniformity|template|specifics|stacks", "label": "", "score": 0-100, "detail": "" }],',
    '    "sections": [{ "name": "", "percent": 0-100, "detail": "" }],',
    '    "highlights": [{ "text": "the passage", "signals": ["why it looks AI-like"] }]',
    '  },',
    '  "questions": ["interview questions that probe gaps and AI-heavy claims"]',
    '}',
    'Include every must-have and nice-to-have you can pull from the job description. strengths and gaps: up to 3 each. questions: 3 to 6.'
  ].join('\n');
}

function normalizeReport(data) {
  if (!data || typeof data !== 'object') throw new Error('empty');
  var reqs = Array.isArray(data.requirements) ? data.requirements : [];
  if (!reqs.length) throw new Error('requirements');
  var fit = clamp(Math.round(Number(data.fitScore)), 0, 100);
  if (!isFinite(fit)) throw new Error('score');
  var verdict = data.verdict === 'Strong' || data.verdict === 'Possible' || data.verdict === 'Weak'
    ? data.verdict
    : (fit >= 75 ? 'Strong' : fit >= 45 ? 'Possible' : 'Weak');
  var ai = data.ai && typeof data.ai === 'object' ? data.ai : {};
  return {
    fitScore: fit,
    verdict: verdict,
    headline: String(data.headline || ''),
    gapIntro: String(data.gapIntro || ''),
    experience: data.experience && typeof data.experience === 'object' ? data.experience : { summary: '' },
    requirements: reqs.slice(0, 14).map(function (r) {
      var status = r.status === 'matched' || r.status === 'partial' || r.status === 'missing' ? r.status : 'partial';
      return {
        text: String(r.text || ''),
        priority: r.priority === 'nice' ? 'nice' : 'must',
        status: status,
        listedOnly: !!r.listedOnly,
        points: clamp(Math.round(Number(r.points) || 0), 0, 100),
        evidence: String(r.evidence || ''),
        note: String(r.note || '')
      };
    }),
    strengths: asPoints(data.strengths),
    gaps: asPoints(data.gaps),
    ai: {
      percent: clamp(Math.round(Number(ai.percent) || 0), 0, 100),
      disclaimer: String(ai.disclaimer || 'This is an estimate of how much the writing resembles common AI-generated résumé language. It is not proof that a person or a tool wrote it.'),
      signals: Array.isArray(ai.signals) ? ai.signals.slice(0, 8).map(function (s) {
        return {
          id: String(s.id || ''),
          label: String(s.label || ''),
          score: s.score == null ? null : clamp(Math.round(Number(s.score) || 0), 0, 100),
          detail: String(s.detail || '')
        };
      }) : [],
      sections: Array.isArray(ai.sections) ? ai.sections.slice(0, 8).map(function (s) {
        return {
          name: String(s.name || ''),
          percent: s.percent == null ? null : clamp(Math.round(Number(s.percent) || 0), 0, 100),
          detail: String(s.detail || '')
        };
      }) : [],
      highlights: Array.isArray(ai.highlights) ? ai.highlights.slice(0, 5).map(function (h) {
        return {
          text: String(h.text || ''),
          signals: Array.isArray(h.signals) ? h.signals.map(String).slice(0, 6) : []
        };
      }) : []
    },
    questions: Array.isArray(data.questions) ? data.questions.map(function (q) { return String(q || ''); }).filter(Boolean).slice(0, 8) : []
  };
}

function asPoints(list) {
  if (!Array.isArray(list)) return [];
  return list.slice(0, 3).map(function (item) {
    return { title: String(item.title || ''), detail: String(item.detail || '') };
  });
}

function stripFences(text) {
  var t = String(text || '').trim();
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  return t.trim();
}

function clip(value, max) {
  return String(value || '').trim().slice(0, max);
}

function clamp(n, lo, hi) {
  if (n < lo) return lo;
  if (n > hi) return hi;
  return n;
}

function originAllowed(origin, env) {
  var raw = String((env && env.ALLOWED_ORIGIN) || '*').trim();
  if (!raw || raw === '*') return true;
  return raw.split(',').map(function (s) { return s.trim(); }).indexOf(origin) !== -1;
}

function corsHeaders(origin, env) {
  var allow = '*';
  var raw = String((env && env.ALLOWED_ORIGIN) || '*').trim();
  if (raw && raw !== '*') {
    allow = origin && originAllowed(origin, env) ? origin : raw.split(',')[0].trim();
  }
  var headers = {
    'access-control-allow-origin': allow,
    'access-control-allow-methods': 'POST, GET, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400'
  };
  if (allow !== '*') headers['vary'] = 'Origin';
  return headers;
}

function json(data, status, origin, env) {
  var headers = corsHeaders(origin, env);
  headers['content-type'] = 'application/json; charset=utf-8';
  headers['cache-control'] = 'no-store';
  return new Response(JSON.stringify(data), { status: status || 200, headers: headers });
}

export { normalizeReport, stripFences, originAllowed };
