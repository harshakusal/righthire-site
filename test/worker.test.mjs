import assert from 'node:assert/strict';
import { normalizeReport, stripFences, originAllowed } from '../worker/src/index.js';

var fenced = stripFences('```json\n{"fitScore": 81}\n```');
assert.equal(fenced, '{"fitScore": 81}');

var report = normalizeReport({
  fitScore: 81.4,
  verdict: 'Strong',
  headline: 'Evidence lines up.',
  experience: { summary: 'Years match.', jdYears: 5, resumeYears: 6 },
  requirements: [
    { text: 'Go in production', priority: 'must', status: 'matched', points: 92, evidence: 'Shipped payouts-api in Go.', note: 'Named system.' },
    { text: 'Figma', priority: 'nice', status: 'partial', listedOnly: true, points: 16, evidence: 'Skills: Figma', note: 'List only.' }
  ],
  strengths: [{ title: 'Go', detail: 'payouts-api' }],
  gaps: [{ title: 'Thin', detail: 'No metric' }],
  ai: {
    percent: 12,
    signals: [{ id: 'phrases', label: 'Stock phrases', score: 8, detail: 'Few.' }],
    sections: [{ name: 'Experience', percent: 10, detail: 'Specific.' }],
    highlights: [{ text: 'Leveraged synergies.', signals: ['Stock phrase'] }]
  },
  questions: ['Walk through the payout path.']
});

assert.equal(report.fitScore, 81);
assert.equal(report.verdict, 'Strong');
assert.equal(report.requirements[1].listedOnly, true);
assert.equal(report.ai.disclaimer.includes('not proof'), true);
assert.equal(report.questions.length, 1);

assert.throws(function () { normalizeReport({ fitScore: 10, requirements: [] }); });
assert.equal(originAllowed('https://harshakusal.github.io', { ALLOWED_ORIGIN: 'https://harshakusal.github.io' }), true);
assert.equal(originAllowed('https://evil.example', { ALLOWED_ORIGIN: 'https://harshakusal.github.io' }), false);
assert.equal(originAllowed('https://anywhere.example', { ALLOWED_ORIGIN: '*' }), true);

console.log('worker checks passed');
