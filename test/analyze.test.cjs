const assert = require('assert');
const { analyze } = require('../assets/js/demo-analyze.js');
const samples = require('../assets/js/demo-samples.js');

const now = new Date(Date.UTC(2026, 9, 5));

function show(name, report) {
  console.log('\n== ' + name + ' ==');
  console.log('fit', report.fitScore, report.verdict, 'exp', report.experience && report.experience.score, 'years', report.experience && report.experience.resumeYears);
  console.log(report.headline);
  console.log(report.experience && report.experience.summary);
  (report.requirements || []).forEach(function (r) {
    console.log(' ', r.priority, r.status, r.listedOnly ? 'LISTED' : '', r.points, '::', r.text.slice(0, 70));
    console.log('   ', (r.note || '').slice(0, 160));
    if (r.evidence) console.log('    “' + r.evidence.slice(0, 140) + '”');
  });
  console.log('AI', report.ai && report.ai.percent);
  (report.ai && report.ai.signals || []).forEach(function (s) {
    console.log('  ', s.label, s.score, '—', s.detail);
  });
  console.log(' sections', (report.ai && report.ai.sections || []).map(function (s) { return s.name + ':' + s.percent; }).join(', '));
  console.log(' highlights', (report.ai && report.ai.highlights || []).length);
  console.log(' gaps', (report.gaps || []).map(function (g) { return g.title; }).join(' | '));
  console.log(' questions', (report.questions || []).length);
}

const strong = analyze(samples.jd, samples.strong, now);
const ai = analyze(samples.jd, samples.ai, now);
const partial = analyze(samples.jd, samples.partial, now);
show('strong', strong);
show('ai', ai);
show('partial', partial);

assert.strictEqual(strong.error, undefined);
assert.ok(strong.fitScore >= 75, 'strong fit ' + strong.fitScore);
assert.strictEqual(strong.verdict, 'Strong');
assert.ok(strong.ai.percent <= 32, 'strong AI ' + strong.ai.percent);
assert.ok(ai.ai.percent >= 68, 'ai writing ' + ai.ai.percent);
assert.ok(ai.ai.percent >= strong.ai.percent + 40, 'gap ' + ai.ai.percent + ' vs ' + strong.ai.percent);
assert.ok(ai.fitScore <= 55, 'ai fit should not look strong ' + ai.fitScore);
assert.notStrictEqual(ai.verdict, 'Strong');
assert.ok(partial.fitScore < 50, 'partial fit ' + partial.fitScore);
assert.notStrictEqual(partial.verdict, 'Strong');
assert.ok(partial.ai.percent <= 35, 'partial AI ' + partial.ai.percent);
assert.ok(partial.ai.percent + 30 <= ai.ai.percent, 'partial vs ai writing');

const mustStrong = strong.requirements.filter(function (r) { return r.priority === 'must'; });
const matched = mustStrong.filter(function (r) { return r.status === 'matched'; });
assert.ok(matched.length >= 4, 'strong matched musts ' + matched.length + '/' + mustStrong.length);

const aiMust = ai.requirements.filter(function (r) { return r.priority === 'must'; });
const aiMatched = aiMust.filter(function (r) { return r.status === 'matched'; });
assert.ok(aiMatched.length <= 1, 'ai resume should not match musts on keywords alone ' + aiMatched.length);

assert.ok(strong.questions.length >= 3);
assert.ok(ai.questions.length >= 3);
assert.ok(ai.ai.highlights.length >= 1);
assert.strictEqual(typeof ai.ai.disclaimer, 'string');
assert.ok(/not proof/i.test(ai.ai.disclaimer));

const listed = analyze(samples.jd, [
  'Skills',
  'Go, PostgreSQL, Kafka, Kubernetes, gRPC, AWS',
  '',
  'Experience',
  'Software Engineer, Example Co',
  '2019 - 2025',
  '- Helped the team with various backend tasks and attended planning meetings every week.'
].join('\n'), now);
show('listed-only', listed);
assert.ok(listed.fitScore < 60, 'listed fit ' + listed.fitScore);
const listedGo = listed.requirements.filter(function (r) { return /go/i.test(r.text); })[0];
assert.ok(listedGo, 'go requirement exists');
assert.ok(listedGo.listedOnly || listedGo.status !== 'matched', 'go should not count as matched evidence');

const proseJd = 'We need a product manager with 4+ years of product management experience. You have owned a roadmap and run user research. SQL is required. Figma is a plus.';
const proseResume = [
  'Mina Cole',
  'Product Manager',
  'Summary',
  'I have been a product manager on a billing tool since 2021.',
  'Experience',
  'Product Manager, Northwind',
  'March 2021 - Present',
  '- Owned the roadmap for the billing rewrite. We shipped usage-based pricing to 400 accounts and churn on that plan fell from 8% to 3%.',
  '- Ran 14 user interviews before the rewrite and turned them into a PRD the engineers actually used.',
  '- Wrote the SQL for the weekly revenue check myself. It is one query on invoices, about 2 million rows.',
  'Skills',
  'Figma, Jira, SQL'
].join('\n');
const pm = analyze(proseJd, proseResume, now);
show('pm', pm);
assert.ok(pm.fitScore >= 55, 'pm fit ' + pm.fitScore);
assert.ok(pm.ai.percent < 45, 'pm ai ' + pm.ai.percent);

const empty = analyze('hi', 'hello there friend', now);
assert.ok(empty.error);

console.log('\nAll analyzer checks passed.');
