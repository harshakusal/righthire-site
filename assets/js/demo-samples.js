/* Built-in demo résumés. Fictional people, shared job description. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.RightHireSamples = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var JD = [
    'Senior Backend Engineer — Payments',
    'Location: Bengaluru or remote (India)',
    'Experience: 5+ years',
    '',
    'About the role',
    'We are hiring a senior backend engineer to own our payouts and reconciliation services. You will design event-driven systems, work with product and finance, and be the person who answers when money movement misbehaves.',
    '',
    "What you'll do",
    '- Own the payouts service: design it, build it, and run it in production',
    '- Design event-driven flows for payment state changes',
    '- Mentor two mid-level engineers',
    '',
    'Must-have requirements',
    '- 5+ years building backend services, with at least 3 years of Go in production',
    '- Strong PostgreSQL: schema design, indexing, and query tuning on large tables',
    '- Hands-on Kafka (or a similar log) for event-driven services you have shipped',
    '- Kubernetes in production: deployments, rollbacks, and reading logs when something fails',
    '- Experience debugging production incidents and writing a short postmortem',
    '',
    'Nice to have',
    '- Payments, ledger, or reconciliation domain experience',
    '- Experience with gRPC',
    '- AWS (EKS, RDS, or MSK)',
    '- Open-source contributions or public writing about systems you have built',
    '',
    'How we work',
    'We care more about what you have shipped than a keyword list. Please do not send a résumé that only names tools.'
  ].join('\n');

  var STRONG = [
    'Anika Rao',
    'Senior Backend Engineer',
    'Bengaluru',
    'anika.rao@example.com',
    'github.com/anika-rao',
    '',
    'Summary',
    'I build payment systems that have to stay correct when they are slow, and fast when they are busy. Lately that means Go services around payouts and ledger state. I like being on call for the thing I shipped.',
    '',
    'Experience',
    '',
    'Senior Backend Engineer, Payloop',
    'Bengaluru',
    'March 2021 - Present',
    'Payloop moves payouts for about 1,200 merchants. I own the payouts service.',
    '- Replaced a Python cron (nightly merchant payouts) with a Go service called payouts-api, fed by Kafka. Terminal status now lands in under 30 seconds. Peak is about 2,000 payout messages a minute.',
    '- The old batch double-paid merchants twice in 2020. I put an idempotency key on (merchant, instruction id) in PostgreSQL, plus a unique index. Duplicate payouts in the last year: zero. That is 18 million instructions.',
    '- Kafka consumer for topic payouts.v3. In Aug 2024 a broker blip stuck lag at 1.2 million. I paused the consumer group, pulled a poison message, and drained the lag in 40 minutes. Wrote the postmortem the next morning: the retry loop had no cap.',
    '- PostgreSQL. Reconciliation on ledger_entries (about 40 million rows) was a sequential scan, 18 seconds. A partial index on (merchant_id, status) where status is not settled brought it to about 2 seconds.',
    '- On Kubernetes (EKS). I rolled back a bad canary from my laptop at 11pm, then added a readiness check that actually hits the database. Bad releases used to sit there for about 15 minutes.',
    '- gRPC sits between payouts-api and the ledger service. The merchant dashboard still uses REST.',
    '- Two mid-level engineers report to me. I read their migration plans before they touch the schema. That habit blocked two bad alters this year.',
    '',
    'Software Engineer, Fieldnote',
    'Hyderabad',
    'June 2018 - February 2021',
    'Notes app. API team. Mostly Python. One Go service.',
    '- Moved thumbnailing off the request path and onto a Redis queue. Upload API p95 went from 1.4s to 220ms.',
    '- Wrote a small Go service that expired stale share links. First Go I ran in production. About 40 requests a second, and it did not page me.',
    '- The queue was Redis, not Kafka.',
    '- Mentored an intern for a summer. She shipped export-to-zip.',
    '',
    'Education',
    'B.Tech, Computer Science, NIT Warangal, 2018',
    '',
    'Other',
    'Blog post on the company eng blog, 2025: "The unique index that stopped our double payouts".',
    'Small open-source Go helper for idempotency keys, github.com/anika-rao/oncekey. A few hundred stars. I still merge fixes.'
  ].join('\n');

  var AI = [
    'Rohan Mehta',
    'Senior Backend Engineer',
    'Bengaluru',
    'rohan.mehta@example.com',
    '',
    'Professional Summary',
    'Dynamic and results-driven backend engineer with a proven track record of delivering robust and scalable solutions in fast-paced environments. Passionate about leveraging cutting-edge technologies to drive impact and foster cross-functional collaboration. Adept at spearheading innovative solutions that streamline operations, empower teams, and deliver seamless outcomes aligned with strategic goals.',
    '',
    'Skills',
    'Go, PostgreSQL, Kafka, Kubernetes, gRPC, AWS, Docker, Microservices, REST APIs, CI/CD, System Design, Agile, Leadership, Communication',
    '',
    'Experience',
    '',
    'Senior Backend Engineer | Apex Digital | Bengaluru',
    'January 2021 - Present',
    '- Spearheaded the development of robust and scalable Go microservices to support key business objectives and drive measurable results.',
    '- Leveraged PostgreSQL to optimize data workflows, enhance operational efficiency, and deliver best-in-class reliability for stakeholders.',
    '- Utilized Kafka to foster seamless event-driven communication between cross-functional services and strategic stakeholder groups.',
    '- Orchestrated Kubernetes deployments to streamline infrastructure processes and ensure innovative world-class outcomes for the platform.',
    '- Collaborated with cross-functional stakeholders to deliver cutting-edge solutions in a fast-paced environment with proven results.',
    '- Facilitated alignment between engineering and product teams to empower continuous improvement and lasting technical excellence.',
    '',
    'Backend Engineer | Northstar Labs | Pune',
    'July 2018 - December 2020',
    '- Developed high-quality backend solutions that improved organizational effectiveness and supported evolving customer needs each quarter.',
    '- Leveraged modern technologies including gRPC and AWS to build dynamic applications aligned with core business requirements.',
    '- Partnered with diverse teams to foster a culture of continuous improvement and thought leadership across the wider organization.',
    '- Implemented scalable architectures that empowered the business to meet strategic goals and deliver results under pressure.',
    '- Demonstrated a proven ability to thrive in ambiguous situations and deliver results-driven outcomes with excellent communication skills.',
    '',
    'Education',
    'Bachelor of Technology, Computer Science, 2018',
    '',
    'Certifications',
    'AWS Certified Cloud Practitioner',
    'Agile and Scrum fundamentals'
  ].join('\n');

  var PARTIAL = [
    'Dev Sharma',
    'Frontend Engineer',
    'Pune',
    'dev.sharma@example.com',
    '',
    'Summary',
    'I work on React apps for a school-admin product called Klassboard. I am looking at backend roles because I keep fixing bugs next to our Node services, and I want to go deeper on the server. I have not shipped Go or Kafka.',
    '',
    'Experience',
    '',
    'Frontend Engineer, Klassboard',
    'Pune',
    'August 2022 - Present',
    'Klassboard is used by about 300 schools. I own the attendance screens and the fees screens.',
    '- Rebuilt the fees page in React and TypeScript. Staff used to wait on a 4 MB payload. I paginated it, and the screen now loads in about 1 second on a school-office connection.',
    '- The fees form posted twice if you double-clicked. I disabled the button and sent an idempotency token the API already accepted. Duplicate fee rows went from about 30 a month to 1 or 2.',
    '- I pair with one backend engineer when the Node API returns the wrong total. I can read the Express handler and the SQL. I do not design the schema. Last month the bug was a join that double-counted siblings.',
    '- Playwright tests cover the attendance flow. They caught a timezone bug the week before term start.',
    '',
    'Web Developer, Studio North',
    'Pune',
    'January 2020 - July 2022',
    '- Marketing sites in HTML, CSS, and a little React. Lighthouse was the job. One hotel site went from 46 to 91 after I stopped loading three slider libraries.',
    '- No on-call. No payments. The most production-shaped thing I did was a contact form that emailed the studio.',
    '',
    'Education',
    'B.Sc. Computer Science, Pune University, 2019',
    '',
    'Skills',
    'React, TypeScript, JavaScript, HTML, CSS, Node.js, Express, PostgreSQL (basic queries), Playwright, Git'
  ].join('\n');

  var SAMPLES = [
    {
      id: 'strong',
      label: 'Strong fit, human-written',
      blurb: 'Backend engineer with payouts, Kafka, Postgres, and Kubernetes stories.',
      jd: JD,
      resume: STRONG
    },
    {
      id: 'ai',
      label: 'AI-heavy résumé, same role',
      blurb: 'Every keyword from the JD, written in stock AI phrasing and no numbers.',
      jd: JD,
      resume: AI
    },
    {
      id: 'partial',
      label: 'Honest résumé, partial fit',
      blurb: 'A specific frontend engineer. Wrong track, and they say so.',
      jd: JD,
      resume: PARTIAL
    }
  ];

  return {
    jd: JD,
    strong: STRONG,
    ai: AI,
    partial: PARTIAL,
    samples: SAMPLES
  };
});
