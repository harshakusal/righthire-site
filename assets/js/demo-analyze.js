/* RightHire instant analysis. Runs entirely in the browser.
   Fit: requirements from the JD, matched against résumé evidence.
   AI writing: phrase, rhythm, template, and specificity signals.
   The score is a likelihood, not proof. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.RightHireAnalyze = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var DISCLAIMER = 'This is an estimate of how much the writing resembles common AI-generated résumé language. It is not proof that a person or a tool wrote it.';

  var AI_WEIGHTS = {
    phrases: 0.34,
    uniformity: 0.18,
    template: 0.16,
    specifics: 0.22,
    stacks: 0.10
  };

  function skill(id, label, aliases, extra) {
    return { id: id, label: label, aliases: aliases, related: (extra && extra.related) || [], loose: !!(extra && extra.loose) };
  }

  var SKILLS = [
    skill('javascript', 'JavaScript', ['javascript', 'ecmascript', 'js']),
    skill('typescript', 'TypeScript', ['typescript', 'ts']),
    skill('python', 'Python', ['python']),
    skill('java', 'Java', ['java']),
    skill('go', 'Go', ['golang', 'go']),
    skill('rust', 'Rust', ['rust', 'rustlang']),
    skill('cpp', 'C++', ['c++', 'cpp', 'c plus plus']),
    skill('csharp', 'C#', ['c#', 'csharp', 'c sharp']),
    skill('ruby', 'Ruby', ['ruby on rails', 'rails', 'ruby']),
    skill('php', 'PHP', ['php', 'laravel']),
    skill('kotlin', 'Kotlin', ['kotlin']),
    skill('swift', 'Swift', ['swift']),
    skill('scala', 'Scala', ['scala']),
    skill('sql', 'SQL', ['structured query language', 'sql']),
    skill('rlang', 'R', ['r language', 'rstudio', 'tidyverse']),
    skill('bash', 'Bash / shell', ['bash', 'shell scripting', 'powershell']),
    skill('html', 'HTML', ['html']),
    skill('css', 'CSS', ['css', 'sass', 'scss']),
    skill('react', 'React', ['react.js', 'reactjs', 'react']),
    skill('vue', 'Vue', ['vue.js', 'vuejs', 'vue']),
    skill('angular', 'Angular', ['angularjs', 'angular']),
    skill('nextjs', 'Next.js', ['next.js', 'nextjs']),
    skill('svelte', 'Svelte', ['svelte']),
    skill('redux', 'Redux', ['redux']),
    skill('tailwind', 'Tailwind', ['tailwind']),
    skill('node', 'Node.js', ['node.js', 'nodejs', 'node']),
    skill('express', 'Express', ['express.js', 'expressjs', 'express']),
    skill('nestjs', 'NestJS', ['nest.js', 'nestjs']),
    skill('django', 'Django', ['django']),
    skill('flask', 'Flask', ['flask']),
    skill('fastapi', 'FastAPI', ['fastapi', 'fast api']),
    skill('spring', 'Spring', ['spring boot', 'spring framework']),
    skill('dotnet', '.NET', ['.net', 'dotnet', 'asp.net']),
    skill('graphql', 'GraphQL', ['graphql']),
    skill('rest', 'REST APIs', ['restful', 'rest api', 'rest apis']),
    skill('grpc', 'gRPC', ['grpc', 'g-rpc', 'protocol buffers', 'protobuf']),
    skill('postgres', 'PostgreSQL', ['postgresql', 'postgres', 'psql'], { related: ['sql'] }),
    skill('mysql', 'MySQL', ['mysql', 'mariadb']),
    skill('mongodb', 'MongoDB', ['mongodb', 'mongo']),
    skill('redis', 'Redis', ['redis']),
    skill('elasticsearch', 'Elasticsearch', ['elasticsearch', 'elastic search', 'opensearch']),
    skill('kafka', 'Kafka', ['apache kafka', 'kafka'], { related: ['rabbitmq'] }),
    skill('rabbitmq', 'RabbitMQ', ['rabbitmq', 'rabbit mq']),
    skill('spark', 'Spark', ['apache spark', 'pyspark', 'spark']),
    skill('airflow', 'Airflow', ['airflow']),
    skill('dbt', 'dbt', ['dbt']),
    skill('snowflake', 'Snowflake', ['snowflake']),
    skill('bigquery', 'BigQuery', ['bigquery', 'big query']),
    skill('tableau', 'Tableau', ['tableau']),
    skill('powerbi', 'Power BI', ['power bi', 'powerbi']),
    skill('excel', 'Excel', ['microsoft excel', 'excel', 'spreadsheets']),
    skill('looker', 'Looker', ['looker']),
    skill('aws', 'AWS', ['amazon web services', 'aws', 'eks', 'rds', 'msk', 'ec2', 'lambda', 's3']),
    skill('gcp', 'GCP', ['google cloud', 'gcp', 'bigquery']),
    skill('azure', 'Azure', ['azure']),
    skill('docker', 'Docker', ['docker']),
    skill('kubernetes', 'Kubernetes', ['kubernetes', 'k8s', 'kubectl'], { related: ['docker', 'helm'] }),
    skill('terraform', 'Terraform', ['terraform']),
    skill('ansible', 'Ansible', ['ansible']),
    skill('cicd', 'CI/CD', ['ci/cd', 'continuous integration', 'github actions', 'gitlab ci', 'jenkins']),
    skill('linux', 'Linux', ['linux', 'unix']),
    skill('prometheus', 'Prometheus', ['prometheus']),
    skill('grafana', 'Grafana', ['grafana']),
    skill('ml', 'Machine learning', ['machine learning', 'deep learning', 'ml']),
    skill('pytorch', 'PyTorch', ['pytorch', 'torch']),
    skill('tensorflow', 'TensorFlow', ['tensorflow']),
    skill('sklearn', 'scikit-learn', ['scikit-learn', 'sklearn']),
    skill('nlp', 'NLP', ['natural language processing', 'nlp']),
    skill('llm', 'LLMs', ['large language model', 'llm', 'rag', 'langchain']),
    skill('mlops', 'MLOps', ['mlops']),
    skill('pandas', 'Pandas', ['pandas']),
    skill('reactnative', 'React Native', ['react native']),
    skill('flutter', 'Flutter', ['flutter']),
    skill('ios', 'iOS', ['ios', 'swiftui', 'uikit']),
    skill('android', 'Android', ['android']),
    skill('systemdesign', 'System design', ['system design', 'distributed systems']),
    skill('microservices', 'Microservices', ['microservices', 'microservice']),
    skill('testing', 'Testing', ['unit testing', 'integration testing', 'jest', 'pytest', 'junit', 'cypress', 'playwright', 'selenium']),
    skill('agile', 'Agile', ['scrum', 'agile'], { loose: true }),
    skill('security', 'Application security', ['application security', 'appsec', 'owasp']),
    skill('oauth', 'OAuth', ['oauth', 'openid']),
    skill('observability', 'Observability', ['observability', 'on-call', 'oncall']),
    skill('incidents', 'a postmortem or incident review', ['postmortem', 'post-mortem', 'post mortem', 'production incident', 'incidents', 'incident', 'on-call', 'oncall', 'root cause', 'blameless']),
    skill('payments', 'Payments', ['reconciliation', 'payments', 'payment', 'payouts', 'payout', 'ledger', 'billing', 'fintech']),
    skill('publicwork', 'Open source or public writing', ['open source', 'open-source', 'blog post', 'engineering blog', 'tech talk']),
    skill('product', 'Product management', ['product management', 'product manager', 'product owner']),
    skill('roadmap', 'Roadmapping', ['roadmap', 'roadmaps']),
    skill('userresearch', 'User research', ['user research', 'user interviews', 'discovery research']),
    skill('abtest', 'A/B testing', ['a/b test', 'a/b tests', 'ab test', 'experimentation']),
    skill('okrs', 'OKRs', ['okrs', 'okr']),
    skill('jira', 'Jira', ['jira']),
    skill('prd', 'PRDs', ['prd', 'prds', 'product requirements']),
    skill('figma', 'Figma', ['figma']),
    skill('sketch', 'Sketch', ['sketch']),
    skill('prototyping', 'Prototyping', ['prototyping', 'prototype']),
    skill('designsystems', 'Design systems', ['design system', 'design systems']),
    skill('usability', 'Usability', ['usability', 'usability testing']),
    skill('salesforce', 'Salesforce', ['salesforce', 'sfdc']),
    skill('hubspot', 'HubSpot', ['hubspot']),
    skill('quota', 'Quota', ['quota']),
    skill('b2b', 'B2B sales', ['b2b']),
    skill('negotiation', 'Negotiation', ['negotiation', 'negotiating']),
    skill('crm', 'CRM', ['crm']),
    skill('seo', 'SEO', ['seo', 'search engine optimization']),
    skill('sem', 'Paid search', ['sem', 'ppc', 'google ads', 'paid search']),
    skill('content', 'Content marketing', ['content marketing', 'content strategy']),
    skill('copywriting', 'Copywriting', ['copywriting', 'copywriter']),
    skill('emailmarketing', 'Email marketing', ['email marketing', 'mailchimp']),
    skill('customersuccess', 'Customer success', ['customer success', 'customer onboarding']),
    skill('retention', 'Retention', ['retention', 'churn']),
    skill('nps', 'NPS', ['nps', 'net promoter']),
    skill('modeling', 'Financial modeling', ['financial modeling', 'financial model']),
    skill('accounting', 'Accounting', ['accounting', 'gaap', 'ifrs']),
    skill('forecasting', 'Forecasting', ['forecasting', 'forecast']),
    skill('budgeting', 'Budgeting', ['budgeting', 'budgets']),
    skill('recruiting', 'Recruiting', ['recruiting', 'recruiter', 'talent acquisition', 'sourcing']),
    skill('booleansearch', 'Boolean search', ['boolean search', 'boolean strings']),
    skill('ats', 'ATS', ['applicant tracking', 'ats']),
    skill('stakeholder', 'Stakeholder management', ['stakeholder management', 'stakeholders']),
    skill('people', 'People management', ['people management', 'line management', 'hiring manager']),
    skill('mentoring', 'Mentoring', ['mentoring', 'mentored', 'coach']),
    skill('projectmgmt', 'Project management', ['project management', 'program management']),
    skill('vendor', 'Vendor management', ['vendor management', 'vendors']),
    skill('process', 'Process improvement', ['process improvement', 'sop', 'lean']),
    skill('supply', 'Supply chain', ['supply chain', 'logistics']),
    skill('zendesk', 'Support tools', ['zendesk', 'intercom']),
    skill('techwriting', 'Technical writing', ['technical writing', 'documentation']),
    skill('ux', 'UX', ['user experience', 'ux'])
  ];

  var COMPILED = SKILLS.map(function (item) {
    var aliases = item.aliases.slice().sort(function (a, b) { return b.length - a.length; });
    return {
      skill: item,
      regs: aliases.map(function (alias) { return { alias: alias, re: aliasToRegExp(alias) }; })
    };
  });

  var BY_ID = {};
  SKILLS.forEach(function (item) { BY_ID[item.id] = item; });

  var MONTHS = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
  };

  var STOP = new Set([
    'this', 'that', 'with', 'from', 'your', 'their', 'have', 'will', 'about', 'into', 'over',
    'under', 'after', 'before', 'while', 'where', 'which', 'what', 'when', 'been', 'being',
    'they', 'them', 'than', 'then', 'also', 'such', 'using', 'used', 'use', 'our', 'are',
    'was', 'were', 'for', 'and', 'the', 'you', 'who', 'not', 'but', 'can', 'all', 'any',
    'its', 'his', 'her', 'she', 'him', 'how', 'why', 'per', 'via', 'across', 'within',
    'without', 'between', 'including', 'include', 'includes', 'able', 'ability'
  ]);

  var GENERIC_TERMS = new Set([
    'experience', 'strong', 'hands', 'working', 'knowledge', 'understanding', 'familiar',
    'preferred', 'required', 'years', 'plus', 'must', 'have', 'team', 'teams', 'work',
    'role', 'looking', 'should', 'well', 'good', 'great', 'solid', 'proven', 'excellent',
    'skills', 'skill', 'ability', 'environment', 'professional', 'relevant', 'minimum',
    'qualifications', 'requirements', 'building', 'writing', 'short', 'large', 'similar',
    'something', 'fails', 'reading', 'design', 'services', 'service', 'systems', 'system'
  ]);

  var CONCRETE_RE = /\b(built|shipped|wrote|write|designed|migrated|tuned|debugged|owned|own|launched|deployed|implemented|refactored|reduced|increased|cut|grew|led|mentored|replaced|rewrote|indexed|partitioned|scaled|fixed|diagnosed|measured|tested|automated|integrated|maintained|operated|handled|processed|served|published|reviewed|paused|drained|rolled|added|moved|expired|rebuilt|paginated|disabled|pair|pairing|caught|stopped|merge|merged|ran|conducted|interviewed)\b/i;
  var GENERIC_VERB_RE = /\b(spearheaded|spearhead|leveraged|leverage|leveraging|utilized|utilize|utilised|utilise|orchestrated|orchestrate|facilitated|facilitate|fostered|foster|fostering|empowered|empower|streamlined|streamline|optimized|optimize|optimised|enhanced|enhance|synergized)\b/i;
  var TECH_DETAIL_RE = /\b(production|prod|latency|p99|p95|qps|rps|throughput|schema|index|indexes|indices|query|queries|migration|rollback|consumer|partition|replica|deadlock|transaction|on-?call|post-?mortem|postmortem|incident|outage|shard|cache|queue|sentry|grafana|slo|sla|customers|users|requests|million|billion|thousand|service|pipeline|api|ledger|payout|reconcil|deployments?|readiness|canary|idempoten|topic|broker|lag|sequential|scan|rows|merchants|stars|repo|library|blog)\b/i;
  var OUTCOME_RE = /\b(\d+(\.\d+)?\s*%|\d+\s*x\b|reduced|increased|cut|grew|from\s+\d|saved|downtime|went from|brought it)\b/i;

  var LLM_PHRASES = [
    ['proven track record', 3],
    ['track record of', 2.4],
    ['results-driven', 3],
    ['result-driven', 3],
    ['results driven', 3],
    ['results-oriented', 2.6],
    ['dynamic and', 2.2],
    ['passionate about', 2.4],
    ['adept at', 3],
    ['proven ability', 3],
    ['cutting-edge', 2.6],
    ['cutting edge', 2.6],
    ['best-in-class', 3],
    ['best in class', 3],
    ['world-class', 2.6],
    ['world class', 2.6],
    ['thought leadership', 2.6],
    ['thought leader', 2.4],
    ['robust and scalable', 3],
    ['scalable solutions', 2.4],
    ['drive impact', 2.4],
    ['driving impact', 2.4],
    ['drive measurable', 2.2],
    ['foster a culture', 2.6],
    ['cross-functional', 1.8],
    ['fast-paced environment', 2.6],
    ['fast paced environment', 2.6],
    ['pivotal role', 3],
    ['instrumental in', 2.4],
    ['innovative solutions', 3],
    ['seamless outcomes', 2.4],
    ['seamless', 1.6],
    ['holistic', 1.8],
    ['actionable insights', 2.4],
    ['excellent communication skills', 2.6],
    ['strong communication skills', 2.2],
    ['organizational effectiveness', 2.6],
    ['evolving customer needs', 2.4],
    ['technical excellence', 2],
    ['continuous improvement', 1.4],
    ['operational efficiency', 1.8],
    ['key business objectives', 2],
    ['business objectives', 1.2],
    ['strategic goals', 1.1],
    ['ambiguous situations', 2],
    ['highly motivated', 2.2],
    ['detail-oriented', 1.6],
    ['self-starter', 2],
    ['team player', 1.6],
    ['go-getter', 2.2],
    ['synergy', 2.6],
    ['synergies', 2.6],
    ['move the needle', 2],
    ['low-hanging fruit', 1.8],
    ['hit the ground running', 2],
    ['circle back', 1.2],
    ['deep dive', 1],
    ['value add', 1.6],
    ['value-add', 1.6],
    ['best practices', 0.6],
    ['data-driven', 1],
    ['stakeholders', 0.7],
    ['empower', 1.2],
    ['spearheaded', 3],
    ['spearhead', 2.6],
    ['leveraged', 2.6],
    ['leveraging', 2.4],
    ['leverage', 1.8],
    ['utilized', 2],
    ['utilize', 1.6],
    ['utilised', 2],
    ['orchestrated', 2.4],
    ['orchestrate', 2],
    ['facilitated', 1.8],
    ['facilitate', 1.4],
    ['foster', 1.4],
    ['fostering', 1.4],
    ['streamline', 1.3],
    ['streamlined', 1.5],
    ['delve', 2],
    ['robust', 0.8],
    ['innovative', 0.7],
    ['dynamic', 0.8],
    ['passionate', 1]
  ];

  var STACK_RES = [
    [/dynamic and results[- ]driven/i, 'dynamic and results-driven'],
    [/proven track record/i, 'proven track record'],
    [/proven ability/i, 'proven ability'],
    [/passionate about leveraging/i, 'passionate about leveraging'],
    [/robust and scalable/i, 'robust and scalable'],
    [/fast-paced environment/i, 'fast-paced environment'],
    [/cross-functional (team|stakeholder|collaboration|services)/i, 'cross-functional'],
    [/cutting-edge/i, 'cutting-edge'],
    [/best-in-class/i, 'best-in-class'],
    [/world-class/i, 'world-class'],
    [/foster(ing|ed)? (a culture|seamless|cross-functional)/i, 'foster'],
    [/innovative solutions/i, 'innovative solutions'],
    [/excellent communication skills/i, 'excellent communication skills'],
    [/thought leadership/i, 'thought leadership'],
    [/adept at spearheading/i, 'adept at spearheading'],
    [/drive impact/i, 'drive impact'],
    [/seamless outcomes/i, 'seamless outcomes'],
    [/evolving customer needs/i, 'evolving customer needs'],
    [/organizational effectiveness/i, 'organizational effectiveness'],
    [/results-driven outcomes/i, 'results-driven outcomes'],
    [/ambiguous situations/i, 'ambiguous situations'],
    [/strategic goals/i, 'strategic goals'],
    [/technical excellence/i, 'technical excellence']
  ];

  var GENERIC_OPEN_RE = /^(spearheaded|leveraged|orchestrated|facilitated|utilized|utilised|fostered|partnered|demonstrated|streamlined|enhanced|optimized|optimised|empowered)\b/i;

  var TRACKS = [
    ['backend', /\b(backend|back-end|back end)\b/i],
    ['frontend', /\b(frontend|front-end|front end|web developer)\b/i],
    ['mobile', /\b(ios|android|mobile)\b/i],
    ['data', /\b(data engineer|data scientist|analytics|machine learning|ml engineer)\b/i],
    ['product', /\b(product manager|product owner)\b/i],
    ['design', /\b(product designer|ux designer|ui designer)\b/i],
    ['recruiting', /\b(recruiter|talent acquisition)\b/i]
  ];

  var LEVELS = [
    { id: 'director', label: 'Director', rank: 5, re: /\b(director|head of)\b/i },
    { id: 'staff', label: 'Staff / Principal', rank: 5, re: /\b(staff|principal)\b/i },
    { id: 'lead', label: 'Lead', rank: 4, re: /\b(tech lead|team lead|\blead\b)\b/i },
    { id: 'senior', label: 'Senior', rank: 3, re: /\b(senior|sr\.?)\b/i },
    { id: 'mid', label: 'Mid-level', rank: 2, re: /\b(mid[- ]level|intermediate)\b/i },
    { id: 'junior', label: 'Junior', rank: 1, re: /\b(junior|jr\.?|entry[- ]level)\b/i },
    { id: 'intern', label: 'Intern', rank: 0, re: /\bintern(ship)?\b/i }
  ];

  function analyze(jdText, resumeText, now) {
    var jd = normalize(jdText);
    var resumeRaw = normalize(resumeText);
    if (wordCount(jd) < 8 || wordCount(resumeRaw) < 8) {
      return { error: 'Paste a fuller job description and résumé. A few words is not enough to score.', mode: 'instant' };
    }
    var clock = now || new Date();
    var resume = parseResume(resumeRaw, clock);
    var reqs = extractRequirements(jd);
    var scored = reqs.map(function (req) { return scoreRequirement(req, resume, clock); });
    var must = scored.filter(function (r) { return r.priority === 'must'; });
    var nice = scored.filter(function (r) { return r.priority === 'nice'; });
    var experience = experienceFit(jd, resume);
    var reqScore = must.length
      ? (nice.length ? (0.78 * avg(must.map(pointsOf)) + 0.22 * avg(nice.map(pointsOf))) : avg(must.map(pointsOf)))
      : (nice.length ? avg(nice.map(pointsOf)) : 0);
    var fitScore = clamp(Math.round(0.82 * reqScore + 0.18 * experience.score), 0, 100);
    var verdict = fitScore >= 75 ? 'Strong' : (fitScore >= 45 ? 'Possible' : 'Weak');
    var ai = aiEstimate(resume);
    var strengths = pickStrengths(scored);
    var gapPack = pickGaps(scored, experience);
    var gaps = gapPack.items;
    var questions = buildQuestions(scored, gaps, ai, experience);
    return {
      mode: 'instant',
      fitScore: fitScore,
      verdict: verdict,
      headline: headline(verdict, must, nice),
      experience: experience,
      requirements: scored,
      strengths: strengths,
      gaps: gaps,
      gapIntro: gapPack.intro,
      ai: ai,
      questions: questions,
      debug: {
        reqScore: Math.round(reqScore),
        resumeYears: resume.years,
        titles: resume.titles,
        requirementCount: scored.length
      }
    };
  }

  function pointsOf(r) { return r.points; }

  function headline(verdict, must) {
    var matched = must.filter(function (r) { return r.status === 'matched'; }).length;
    var listed = must.filter(function (r) { return r.listedOnly; }).length;
    var partial = must.filter(function (r) { return r.status === 'partial' && !r.listedOnly; }).length;
    var missing = must.filter(function (r) { return r.status === 'missing'; }).length;
    var total = must.length;
    if (!total) {
      return 'The job description did not yield a clear requirements list, so this score is a best-effort read of the skills it names.';
    }
    var base = matched + ' of ' + total + ' must-haves are backed by project evidence.';
    if (verdict === 'Strong') {
      return base + ' The work described lines up with what the role is hiring for.';
    }
    var bits = [];
    if (listed) bits.push(listed + (listed === 1 ? ' only appears' : ' only appear') + ' on a skills list');
    if (partial) bits.push(partial + (partial === 1 ? ' is' : ' are') + ' partial, with the keyword and little proof of the work');
    if (missing) bits.push(missing + (missing === 1 ? ' is' : ' are') + ' missing');
    if (!bits.length) return base + ' Several matches are thin.';
    return base + ' ' + joinAnd(bits) + '.';
  }

  function joinAnd(bits) {
    if (bits.length === 1) return bits[0];
    if (bits.length === 2) return bits[0] + ', and ' + bits[1];
    return bits.slice(0, -1).join(', ') + ', and ' + bits[bits.length - 1];
  }

  function extractRequirements(jd) {
    var lines = explodeLines(jd);
    var section = 'overview';
    var items = [];
    var order = 0;
    lines.forEach(function (line) {
      var header = jdHeader(line);
      if (header) { section = header; return; }
      if (section === 'ignore' || section === 'overview' || section === 'resp') return;
      var text = stripBullet(line);
      if (wordCount(text) < 3) return;
      if (/^(location|experience|notice|salary|compensation)\s*:/i.test(text) && wordCount(text) < 8) return;
      var priority = section === 'nice' ? 'nice' : 'must';
      if (/\b(nice to have|preferred|a plus|bonus|optional)\b/i.test(text)) priority = 'nice';
      if (/\b(must|required|essential)\b/i.test(text)) priority = section === 'nice' ? 'nice' : 'must';
      splitRequirement(text).forEach(function (part) {
        items.push(makeReq(part, priority, order++));
      });
    });
    if (items.length < 3) {
      var looseSection = 'overview';
      explodeLines(jd).forEach(function (line) {
        var header = jdHeader(line);
        if (header) { looseSection = header; return; }
        if (looseSection === 'ignore') return;
        splitJdSentences(stripBullet(line)).forEach(function (sentence) {
          var skills = findSkills(sentence).filter(function (s) { return !s.loose; });
          if (wordCount(sentence) < 2) return;
          if (!skills.length) return;
          var niceLine = looseSection === 'nice' || /\b(a plus|preferred|bonus|optional|nice to have)\b/i.test(sentence);
          var priority = niceLine ? 'nice' : 'must';
          var listLike = skills.length >= 2 && wordCount(sentence) <= skills.length * 5 + 8;
          if (listLike) {
            skills.forEach(function (s) {
              if (items.some(function (it) { return it.skills.indexOf(s.id) !== -1; })) return;
              items.push(makeReq(s.label, priority, order++, [s.id]));
            });
            return;
          }
          if (items.some(function (it) { return it.skills.length && skills.every(function (s) { return it.skills.indexOf(s.id) !== -1; }); })) return;
          items.push(makeReq(sentence, priority, order++));
        });
      });
    }
    var seen = {};
    var deduped = [];
    items.forEach(function (item) {
      var key = item.skills.length === 1 ? item.priority + ':' + item.skills[0] : item.priority + ':' + item.text.toLowerCase();
      if (seen[key]) {
        if (item.text.length > seen[key].text.length) {
          deduped[deduped.indexOf(seen[key])] = item;
          seen[key] = item;
        }
        return;
      }
      seen[key] = item;
      deduped.push(item);
    });
    var must = deduped.filter(function (r) { return r.priority === 'must'; }).slice(0, 8);
    var nice = deduped.filter(function (r) { return r.priority === 'nice'; }).slice(0, 6);
    return must.concat(nice);
  }

  function makeReq(text, priority, order, presetSkills) {
    var skills = presetSkills || findSkills(text).map(function (s) { return s.id; });
    return {
      text: text.replace(/\s+/g, ' ').trim(),
      priority: priority,
      skills: skills,
      order: order
    };
  }

  function splitRequirement(text) {
    var found = findSkills(text);
    if (found.length < 2) return [text];
    var commas = (text.match(/,/g) || []).length;
    if (commas < 1) return [text];
    if (wordCount(text) > found.length * 6 + 8) return [text];
    if (/\b(years|production|because|when|where|schema|index|deploy|incident|postmortem)\b/i.test(text)) return [text];
    var parts = text.split(/,|\band\b|&/i).map(function (p) { return p.replace(/^[\s:;.-]+|[\s.;]+$/g, ''); }).filter(Boolean);
    var kept = [];
    parts.forEach(function (part) {
      if (findSkills(part).length) kept.push(part);
    });
    return kept.length >= 2 ? kept : [text];
  }

  function jdHeader(line) {
    var t = line.replace(/[:.]+$/g, '').trim();
    if (!t || wordCount(t) > 8) return null;
    if (/^nice[- ]to[- ]haves?$/i.test(t) || /^preferred\b/i.test(t) || /^bonus\b/i.test(t) || /^good to have$/i.test(t) || /^pluses$/i.test(t)) return 'nice';
    if (/^must[- ]haves?/i.test(t) || /^requirements?$/i.test(t) || /^required\b/i.test(t) || /^(minimum |basic )?qualifications$/i.test(t) || /^what you('ll| will) need$/i.test(t) || /^what we('re| are) looking for$/i.test(t)) return 'must';
    if (/^what you('ll| will) do$/i.test(t) || /^responsibilities$/i.test(t) || /^about the role$/i.test(t) || /^the role$/i.test(t) || /^duties$/i.test(t)) return 'resp';
    if (/^how we work$/i.test(t) || /^about (us|the company|the team)$/i.test(t) || /^benefits$/i.test(t) || /^what we offer$/i.test(t) || /^perks$/i.test(t) || /^compensation$/i.test(t) || /^how to apply$/i.test(t)) return 'ignore';
    return null;
  }

  function scoreRequirement(req, resume) {
    var skillObjs = req.skills.map(function (id) { return BY_ID[id]; }).filter(Boolean);
    var result;
    if (!skillObjs.length) result = scoreByTerms(req, resume);
    else if (skillObjs.length === 1) result = scoreSkill(skillObjs[0], resume, req);
    else {
      var parts = skillObjs.map(function (s) { return scoreSkill(s, resume, req); });
      var points = avg(parts.map(pointsOf));
      var best = parts.slice().sort(function (a, b) { return b.points - a.points; })[0];
      var listedOnly = parts.every(function (p) { return p.listedOnly || p.status === 'missing'; }) && parts.some(function (p) { return p.listedOnly; });
      result = {
        points: Math.round(points),
        listedOnly: listedOnly,
        evidence: best.evidence,
        note: parts.map(function (p) { return p.note; }).filter(Boolean)[0] || best.note
      };
    }
    var ask = skillYearAsk(req.text, skillObjs);
    result.note = result.note || '';
    if (ask && skillObjs.length) {
      var got = evidencedYears(ask.skill || skillObjs[0], resume);
      if (got + 0.15 >= ask.years && result.points >= 48) {
        result.points = Math.max(result.points, 90);
        result.note += ' Dated roles that describe this skill cover about ' + round1(got) + ' years. The role asks for ' + ask.years + '.';
      } else if (got > 0.4 && got + 0.15 < ask.years) {
        result.points = Math.min(result.points, 68);
        result.note += ' Dated hands-on work looks closer to ' + round1(got) + ' years than the ' + ask.years + ' asked for.';
      } else if (got <= 0.4) {
        result.points = Math.min(result.points, result.points >= 75 ? result.points : 36);
        result.note += ' Nothing dated shows ' + ask.years + ' years of hands-on use.';
      }
    }
    applyStatus(result);
    return {
      text: req.text,
      priority: req.priority,
      status: result.status,
      listedOnly: !!result.listedOnly,
      points: clamp(Math.round(result.points), 0, 100),
      evidence: result.evidence || '',
      note: tidy(result.note)
    };
  }

  function applyStatus(result) {
    if (result.listedOnly && result.points < 75) result.status = 'partial';
    else if (result.points >= 75) result.status = 'matched';
    else if (result.points >= 18) result.status = 'partial';
    else result.status = 'missing';
  }

  function scoreSkill(skillObj, resume, req) {
    var best = null;
    var negated = null;
    resume.units.forEach(function (unit) {
      var hit = mention(unit.text, skillObj);
      if (!hit) return;
      if (hit.negated) {
        if (!negated) negated = unit.text;
        return;
      }
      var cls = classifyUnit(unit);
      var candidate = {
        points: cls.points,
        listedOnly: cls.listedOnly,
        evidence: clip(unit.text, 320),
        note: cls.note,
        rel: req ? termOverlap(unit.text, req.text) : 0,
        details: techDetailCount(unit.text),
        rich: richness(unit.text)
      };
      if (betterEvidence(candidate, best)) best = candidate;
    });
    var related = relatedHit(skillObj, resume);
    if (related && (!best || related.points > best.points)) best = related;
    if (!best && negated) {
      return {
        points: 0,
        listedOnly: false,
        evidence: clip(negated, 320),
        note: 'The résumé mentions ' + skillObj.label + ' only to say it is not part of the work.'
      };
    }
    if (!best) {
      return {
        points: 0,
        listedOnly: false,
        evidence: '',
        note: 'Nothing in the résumé describes ' + skillObj.label + '.'
      };
    }
    if (req && best.points < 90 && focusMiss(req.text, best.evidence) && best.points > 70 && !best.listedOnly) {
      best.points = 62;
      best.note = 'The tool is in the work history. The résumé does not show the extra bar the JD sets (' + focusPhrase(req.text) + ').';
    }
    return best;
  }

  function relatedHit(skillObj, resume) {
    if (!skillObj.related || !skillObj.related.length) return null;
    var best = null;
    resume.units.forEach(function (unit) {
      if (unit.list) return;
      var term = null;
      var lower = unit.text.toLowerCase();
      for (var i = 0; i < skillObj.related.length; i++) {
        var rel = skillObj.related[i];
        var re = aliasToRegExp(rel);
        re.lastIndex = 0;
        var m = re.exec(unit.text);
        if (m && !negatedAt(unit.text, m.index)) { term = rel; break; }
      }
      if (!term) return;
      if (mention(unit.text, skillObj) && !mention(unit.text, skillObj).negated) return;
      var cls = classifyUnit(unit);
      var points = Math.min(42, Math.max(30, cls.points > 20 ? 40 : 28));
      if (!best || points > best.points) {
        best = {
          points: points,
          listedOnly: false,
          evidence: clip(unit.text, 320),
          note: 'The résumé does not name ' + skillObj.label + ' in the work itself. Nearby experience mentions ' + term.toUpperCase() + '.'
        };
      }
      void lower;
    });
    return best;
  }

  function scoreByTerms(req, resume) {
    var terms = significantTerms(req.text);
    if (!terms.length) {
      return { points: 0, listedOnly: false, evidence: '', note: 'This requirement is too vague to match against a résumé.' };
    }
    var distinctive = { postmortem: 1, incident: 1, incidents: 1, oncall: 1, reconciliation: 1, idempotency: 1, kubernetes: 1, rollback: 1 };
    var best = null;
    resume.units.forEach(function (unit) {
      if (unit.list) return;
      var low = unit.text.toLowerCase().replace(/-/g, ' ');
      var hitTerms = [];
      terms.forEach(function (term) {
        if (low.indexOf(term) !== -1) hitTerms.push(term);
      });
      if (!hitTerms.length) return;
      var rare = hitTerms.some(function (t) { return distinctive[t.replace(/\s+/g, '')] || distinctive[t]; });
      if (hitTerms.length < 2 && !rare) return;
      var cls = classifyUnit(unit);
      var coverage = hitTerms.length / Math.min(terms.length, 4);
      var points = Math.round(cls.points * (0.5 + 0.5 * Math.min(1, coverage)));
      if (!best || points > best.points) {
        best = {
          points: points,
          listedOnly: false,
          evidence: clip(unit.text, 320),
          note: cls.note
        };
      }
    });
    if (!best) {
      return { points: 0, listedOnly: false, evidence: '', note: 'No résumé line covers this requirement.' };
    }
    return best;
  }

  function classifyUnit(unit) {
    var s = unit.text;
    if (unit.list) {
      return {
        status: 'partial',
        listedOnly: true,
        points: 16,
        note: 'It appears on a skills list. The experience section does not show it in use.'
      };
    }
    var number = hasMeaningfulNumber(s);
    var outcome = OUTCOME_RE.test(s);
    var concrete = CONCRETE_RE.test(s);
    var generic = GENERIC_VERB_RE.test(s);
    var details = techDetailCount(s);
    if ((concrete || details >= 1) && (number || outcome) && (details >= 1 || outcome)) {
      return { listedOnly: false, points: 100, note: 'The résumé ties this to a specific system, action, or result.' };
    }
    if ((concrete || details >= 1) && (number || outcome)) {
      return { listedOnly: false, points: 92, note: 'There is a concrete result or a number next to this requirement.' };
    }
    if (concrete && details >= 1 && !generic) {
      return { listedOnly: false, points: 84, note: 'It shows up in described work, with technical context.' };
    }
    if (details >= 2 && !generic && wordCount(s) >= 8) {
      return { listedOnly: false, points: 80, note: 'It names where this was used. A measured outcome is not in the line.' };
    }
    if (concrete && details >= 1 && generic) {
      return { listedOnly: false, points: 55, note: 'The tool sits beside a task, and the line stays generic.' };
    }
    if (concrete && !generic) {
      return { listedOnly: false, points: 48, note: 'It is mentioned with work the person did, without a clear outcome.' };
    }
    if (generic && !number && details === 0) {
      return { listedOnly: false, points: 26, note: 'The keyword sits in a generic line, with no project, metric, or outcome.' };
    }
    if (number || details >= 1) {
      return { listedOnly: false, points: 44, note: 'There is some context, and not enough to show depth.' };
    }
    return { listedOnly: false, points: 22, note: 'It is mentioned, with no project or outcome behind it.' };
  }

  function focusMiss(reqText, evidence) {
    var wants = [];
    if (/\bin production\b/i.test(reqText)) wants.push(/production|prod\b|eks|deploy/i);
    if (/\bpost-?mortem|incident/i.test(reqText)) wants.push(/post-?mortem|incident|on-?call|outage/i);
    if (/\brollback/i.test(reqText)) wants.push(/rollback|rolled back|canary/i);
    if (/\bindex/i.test(reqText)) wants.push(/index|query|scan|schema/i);
    if (!wants.length || !evidence) return false;
    return wants.some(function (re) { return !re.test(evidence); });
  }

  function focusPhrase(reqText) {
    if (/\bpost-?mortem|incident/i.test(reqText)) return 'a real incident or postmortem';
    if (/\brollback/i.test(reqText)) return 'a deploy or a rollback';
    if (/\bin production\b/i.test(reqText)) return 'production use';
    if (/\bindex/i.test(reqText)) return 'schema or query work';
    return 'the specific bar in the JD';
  }

  function skillYearAsk(text, skillObjs) {
    if (!skillObjs.length) return null;
    var re = /(\d+)\s*\+?\s*years?/gi;
    var m;
    while ((m = re.exec(text))) {
      var after = text.slice(m.index, m.index + m[0].length + 42);
      var before = text.slice(Math.max(0, m.index - 24), m.index);
      for (var i = 0; i < skillObjs.length; i++) {
        if (mention(after, skillObjs[i]) || mention(before, skillObjs[i])) {
          return { years: parseInt(m[1], 10), skill: skillObjs[i] };
        }
      }
    }
    return null;
  }

  function evidencedYears(skillObj, resume) {
    var total = 0;
    resume.jobs.forEach(function (job) {
      var best = 0;
      var saw = false;
      job.units.forEach(function (unit) {
        var hit = mention(unit.text, skillObj);
        if (!hit || hit.negated || unit.list) return;
        saw = true;
        var cls = classifyUnit(unit);
        if (cls.points > best) best = cls.points;
      });
      var titleHit = job.title ? mention(job.title, skillObj) : null;
      if (saw && best >= 48) total += job.years;
      else if (titleHit && !titleHit.negated) total += job.years;
    });
    return total;
  }

  function experienceFit(jd, resume) {
    var years = jdOverallYears(jd);
    var jdLevel = levelIn(jd.slice(0, 500));
    var resumeLevel = levelIn(resume.titles.join(' \n '));
    var jdTrack = trackIn(jd.slice(0, 280));
    var resumeTrack = trackIn(resume.titles.join(' \n '));
    var score = 72;
    var bits = [];
    if (years && resume.years) {
      var ratio = resume.years / years;
      if (ratio >= 1) score = 100;
      else if (ratio >= 0.85) score = 84;
      else if (ratio >= 0.65) score = 62;
      else if (ratio >= 0.45) score = 42;
      else score = 24;
      bits.push('The role asks for ' + years + '+ years. The dates on the résumé add up to about ' + round1(resume.years) + ' years.');
    } else if (years) {
      score = 58;
      bits.push('The role asks for ' + years + '+ years. The résumé has no date ranges to add up.');
    } else {
      bits.push('The job description does not state a clear years requirement.');
    }
    if (jdLevel && resumeLevel) {
      var gap = resumeLevel.rank - jdLevel.rank;
      if (gap <= -2) score = Math.min(score, 40);
      else if (gap === -1) score = Math.min(score, 70);
      bits.push('The role is pitched at ' + jdLevel.label.toLowerCase() + '. The résumé titles read as ' + resumeLevel.label.toLowerCase() + '.');
    } else if (jdLevel) {
      bits.push('The role is pitched at ' + jdLevel.label.toLowerCase() + '. The résumé titles do not state a level.');
      if (jdLevel.rank >= 3 && resume.years && resume.years < 4) score = Math.min(score, 46);
    }
    if (jdTrack && resumeTrack && jdTrack !== resumeTrack) {
      score = Math.min(score, 46);
      bits.push('The role is ' + jdTrack + '. The titles on the résumé are ' + resumeTrack + '.');
    }
    return {
      score: score,
      summary: bits.join(' '),
      jdYears: years,
      resumeYears: resume.years,
      jdLevel: jdLevel ? jdLevel.label : null,
      resumeLevel: resumeLevel ? resumeLevel.label : null
    };
  }

  function jdOverallYears(text) {
    var cleaned = text.replace(/(\d+)\s*\+?\s*years?\s+(?:of\s+)?(go|golang|java|python|react|kafka|sql|aws|kubernetes|node|ruby)\b/gi, ' ');
    var m = cleaned.match(/(\d+)\s*\+\s*years?\b/i)
      || cleaned.match(/(\d+)\s*-\s*\d+\s*years?\b/i)
      || cleaned.match(/(\d+)\s+years?\s+of\s+(?:experience|relevant|professional)/i)
      || cleaned.match(/experience\s*:\s*(\d+)/i);
    return m ? parseInt(m[1], 10) : null;
  }

  function levelIn(text) {
    for (var i = 0; i < LEVELS.length; i++) {
      if (LEVELS[i].re.test(text)) return LEVELS[i];
    }
    return null;
  }

  function trackIn(text) {
    for (var i = 0; i < TRACKS.length; i++) {
      if (TRACKS[i][1].test(text)) return TRACKS[i][0];
    }
    return null;
  }

  function pickStrengths(reqs) {
    var matched = reqs.filter(function (r) { return r.status === 'matched'; })
      .sort(function (a, b) {
        if (a.priority !== b.priority) return a.priority === 'must' ? -1 : 1;
        return b.points - a.points;
      });
    return matched.slice(0, 3).map(function (r) {
      return {
        title: clip(r.text, 110),
        detail: r.evidence || r.note
      };
    });
  }

  function pickGaps(reqs, experience) {
    var ranked = reqs.slice().sort(function (a, b) { return gapRank(a) - gapRank(b); });
    var gaps = [];
    ranked.forEach(function (r) {
      if (gaps.length >= 3) return;
      if (r.status === 'matched' && r.points >= 90 && !r.listedOnly) return;
      gaps.push(gapFromReq(r));
    });
    if (experience && experience.jdYears && experience.resumeYears && experience.resumeYears + 0.2 < experience.jdYears) {
      gaps.push({
        title: 'Years look short of the ask',
        detail: experience.summary
      });
    }
    var hardMust = reqs.some(function (r) {
      return r.priority === 'must' && (r.status !== 'matched' || r.listedOnly);
    });
    if (!hardMust && gaps.length < 3) {
      var richest = reqs.filter(function (r) { return r.status === 'matched' && r.evidence; })
        .sort(function (a, b) { return b.points - a.points || b.evidence.length - a.evidence.length; })[0];
      gaps.push({
        title: 'Re-tell the strongest claim',
        detail: richest
          ? 'The must-haves are covered in writing. Ask them to restate this without the résumé: “' + clip(richest.evidence, 180) + '”'
          : 'The must-haves are covered in writing. Ask for one result from memory: the system, their part, and the number that moved.'
      });
    }
    if (gaps.length < 3) {
      gaps.push({
        title: 'Ask who else was involved',
        detail: 'Strong lines still hide the split of work. Ask what they did themselves, what they reviewed, and what they would change.'
      });
    }
    return {
      items: gaps.slice(0, 3),
      intro: hardMust
        ? ''
        : 'No must-have is missing. These are the thinnest spots, and the claims worth confirming out loud.'
    };
  }

  function gapRank(r) {
    var tier = 5;
    if (r.priority === 'must' && r.status === 'missing') tier = 0;
    else if (r.priority === 'must' && r.listedOnly) tier = 1;
    else if (r.priority === 'must' && r.status === 'partial') tier = 2;
    else if (r.priority === 'nice' && r.status === 'missing') tier = 3;
    else if (r.priority === 'nice' && (r.listedOnly || r.status === 'partial')) tier = 4;
    return tier * 100 + r.points;
  }

  function gapFromReq(r) {
    var title;
    if (r.status === 'missing') title = 'Missing: ' + clip(r.text, 90);
    else if (r.listedOnly) title = 'Listed only: ' + clip(r.text, 90);
    else if (r.status === 'partial' || r.points < 90) title = 'Thin evidence: ' + clip(r.text, 90);
    else title = 'Confirm in the interview: ' + clip(r.text, 80);
    var detail = r.note || '';
    if (r.evidence) detail += ' “' + clip(r.evidence, 180) + '”';
    return { title: title, detail: tidy(detail) };
  }

  function buildQuestions(reqs, gaps, ai, experience) {
    var questions = [];
    reqs.filter(function (r) { return r.priority === 'must' && r.status === 'missing'; }).forEach(function (r) {
      questions.push('The role needs this, and the résumé does not show it: “' + clip(r.text, 140) + '”. Have you done it? Walk through one case: what you built, the constraint, and what changed.');
    });
    reqs.filter(function (r) { return r.listedOnly; }).forEach(function (r) {
      questions.push(clip(r.text, 80) + ' appears on the skills list and not in a project. What did you ship with it, and what would break if it were removed?');
    });
    reqs.filter(function (r) { return r.priority === 'must' && r.status === 'partial' && !r.listedOnly; }).forEach(function (r) {
      var quote = r.evidence ? ' The line we have is: “' + clip(r.evidence, 160) + '”.' : '';
      questions.push('This must-have is only partly supported: “' + clip(r.text, 120) + '”.' + quote + ' What was the system, what was your part, and what number moved?');
    });
    if (ai && ai.highlights) {
      ai.highlights.slice(0, 2).forEach(function (h) {
        questions.push('This passage reads like stock résumé language: “' + clip(h.text, 180) + '”. Ask them to retell it with the system name, their own actions, and one measurement.');
      });
    }
    if (experience && experience.resumeYears && experience.jdYears && experience.resumeYears + 0.2 < experience.jdYears) {
      questions.push('The role asks for ' + experience.jdYears + '+ years and the dates add up to about ' + round1(experience.resumeYears) + '. Which of those years were hands-on with the core stack?');
    }
    reqs.filter(function (r) { return r.points < 90; }).slice(0, 2).forEach(function (r) {
      questions.push('“' + clip(r.text, 110) + '” is the thin spot. Ask for one concrete episode: their decision, the constraint, and what changed afterwards.');
    });
    var probes = reqs.filter(function (r) { return r.status === 'matched' && r.priority === 'must' && r.evidence; }).slice(0, 2);
    probes.forEach(function (r) {
      questions.push('Confirm the claim on “' + clip(r.text, 90) + '” without the résumé open. A usable answer names the system and one measurement. The line was: “' + clip(r.evidence, 140) + '”');
    });
    if (questions.length < 3) {
      questions.push('Pick the project they are proudest of. What was broken when they arrived, what did they change, and which number moved?');
    }
    var seen = {};
    var out = [];
    questions.forEach(function (q) {
      var key = q.slice(0, 80);
      if (seen[key]) return;
      seen[key] = true;
      out.push(q);
    });
    return out.slice(0, 6);
  }

  function aiEstimate(resume) {
    var proseUnits = resume.units.filter(isProseUnit);
    var proseText = proseUnits.map(function (u) { return u.text; }).join('\n');
    var sentences = splitSentences(proseText);
    var bullets = proseUnits.filter(function (u) { return u.bullet || /^(spearheaded|leveraged|built|wrote|owned|developed|implemented)/i.test(u.text); })
      .map(function (u) { return u.text; });
    if (bullets.length < 4) {
      bullets = resume.units.filter(function (u) { return u.bullet; }).map(function (u) { return u.text; });
    }
    var phrases = phraseSignal(proseText);
    var uniform = uniformitySignal(sentences);
    var template = templateSignal(bullets);
    var specifics = specificsSignal(sentences);
    var stacks = stackSignal(proseText);
    var percent = Math.round(combineAi([
      { score: phrases.score, weight: AI_WEIGHTS.phrases },
      { score: uniform.score, weight: AI_WEIGHTS.uniformity },
      { score: template.score, weight: AI_WEIGHTS.template },
      { score: specifics.score, weight: AI_WEIGHTS.specifics },
      { score: stacks.score, weight: AI_WEIGHTS.stacks }
    ]));
    percent = clamp(percent, 0, 100);
    var sections = sectionScores(resume);
    var highlights = pickHighlights(sentences);
    return {
      percent: percent,
      disclaimer: DISCLAIMER,
      signals: [
        { id: 'phrases', label: 'Stock phrases', score: Math.round(phrases.score), detail: phrases.detail },
        { id: 'uniformity', label: 'Sentence length', score: uniform.score == null ? null : Math.round(uniform.score), detail: uniform.detail },
        { id: 'template', label: 'Template structure', score: template.score == null ? null : Math.round(template.score), detail: template.detail },
        { id: 'specifics', label: 'Concrete specifics', score: Math.round(specifics.score), detail: specifics.detail },
        { id: 'stacks', label: 'Buzzword stacks', score: Math.round(stacks.score), detail: stacks.detail }
      ],
      sections: sections,
      highlights: highlights
    };
  }

  function combineAi(parts) {
    var w = 0;
    var s = 0;
    parts.forEach(function (p) {
      if (p.score == null || isNaN(p.score)) return;
      w += p.weight;
      s += p.weight * p.score;
    });
    if (!w) return 0;
    return s / w;
  }

  function phraseSignal(text) {
    var found = findWeightedPhrases(text);
    var words = Math.max(1, wordCount(text));
    var weight = 0;
    found.forEach(function (f) { weight += f.weight * Math.min(f.count, 2); });
    var density = (weight / words) * 100;
    var score = density <= 0.35 ? (density / 0.35) * 8 : 8 + ((density - 0.35) / 6) * 92;
    score = clamp(score, 0, 100);
    var names = found.slice(0, 4).map(function (f) { return f.phrase; });
    var detail = names.length
      ? 'Found ' + found.length + ' stock phrase' + (found.length === 1 ? '' : 's') + ', including “' + names.join('”, “') + '”.'
      : 'No stock LLM phrases stood out.';
    return { score: score, detail: detail, found: found };
  }

  function findWeightedPhrases(text) {
    var masked = ' ' + text.toLowerCase() + ' ';
    var found = [];
    LLM_PHRASES.forEach(function (pair) {
      var phrase = pair[0];
      var re = new RegExp('\\b' + escapeRegExp(phrase) + '\\b', 'g');
      var matches = masked.match(re);
      if (matches && matches.length) {
        found.push({ phrase: phrase, weight: pair[1], count: matches.length });
        masked = masked.replace(re, ' ');
      }
    });
    found.sort(function (a, b) { return b.weight - a.weight; });
    return found;
  }

  function uniformitySignal(sentences) {
    var lens = sentences.map(wordCount).filter(function (n) { return n >= 8; });
    if (lens.length < 4) {
      return { score: null, detail: 'Not enough prose to judge how much sentence length varies.' };
    }
    var mean = avg(lens);
    var sd = stdev(lens);
    var cv = mean ? sd / mean : 0;
    var score = mapUniformity(cv);
    var min = Math.min.apply(null, lens);
    var max = Math.max.apply(null, lens);
    var detail = score >= 70
      ? 'Low variation. Most sentences sit in a narrow band (about ' + min + '–' + max + ' words).'
      : (score >= 40
        ? 'Sentence length is somewhat even (about ' + min + '–' + max + ' words).'
        : 'Sentence length varies (about ' + min + ' to ' + max + ' words).');
    return { score: score, detail: detail, cv: cv };
  }

  function templateSignal(bullets) {
    var items = (bullets || []).filter(function (b) { return wordCount(b) >= 8; });
    if (items.length < 4) return { score: null, detail: 'Not enough bullet points to judge a template.' };
    var generic = items.filter(function (b) { return GENERIC_OPEN_RE.test(b.replace(/^[-*•]\s*/, '')); });
    var rate = generic.length / items.length;
    var lens = items.map(wordCount);
    var cv = stdev(lens) / (avg(lens) || 1);
    var score = clamp(rate * 100 * 0.82 + (cv < 0.16 && rate > 0.6 ? 18 : 0), 0, 100);
    var detail = rate >= 0.45
      ? generic.length + ' of ' + items.length + ' bullets open with a stock verb such as “leveraged” or “spearheaded”.'
      : 'Bullets do not follow one repeated template.';
    return { score: score, detail: detail };
  }

  function specificsSignal(sentences) {
    var usable = sentences.filter(function (s) { return wordCount(s) >= 8 && !isDateLine(s); });
    if (usable.length < 3) return { score: 35, detail: 'Too little prose to judge specifics.' };
    var specific = usable.filter(isSpecificSentence);
    var ratio = specific.length / usable.length;
    var score = clamp(((0.48 - ratio) / 0.48) * 100, 0, 100);
    var detail = ratio >= 0.4
      ? specific.length + ' of ' + usable.length + ' sentences include a number, a named system, or a concrete result.'
      : specific.length + ' of ' + usable.length + ' sentences include a number or a named system. The rest stay general.';
    return { score: score, detail: detail, ratio: ratio };
  }

  function isSpecificSentence(s) {
    if (hasMeaningfulNumber(s)) return true;
    if (/\b(payouts-api|ledger_entries|klassboard|oncekey)\b/i.test(s)) return true;
    if (techDetailCount(s) >= 2) return true;
    return false;
  }

  function mapUniformity(cv) {
    if (cv >= 0.4) return clamp(((0.62 - cv) / 0.22) * 22, 0, 22);
    if (cv >= 0.2) return 22 + ((0.4 - cv) / 0.2) * 36;
    return clamp(58 + ((0.2 - cv) / 0.2) * 42, 0, 100);
  }

  function termOverlap(text, reqText) {
    var low = String(text || '').toLowerCase();
    var n = 0;
    significantTerms(reqText).forEach(function (term) {
      if (low.indexOf(term) !== -1) n += 2;
      else if (term.length > 5 && low.indexOf(term.slice(0, 5)) !== -1) n += 1;
    });
    return n;
  }

  function betterEvidence(next, best) {
    if (!best) return true;
    if (next.points > best.points + 6) return true;
    if (best.points > next.points + 6) return false;
    if (Math.abs((next.rich || 0) - (best.rich || 0)) >= 2) return (next.rich || 0) > (best.rich || 0);
    if (next.rel !== best.rel) return next.rel > best.rel;
    if (next.details !== best.details) return next.details > best.details;
    return (next.evidence || '').length > (best.evidence || '').length;
  }

  function richness(text) {
    var stripped = String(text || '').replace(/\b(19|20)\d{2}\b/g, ' ');
    var digits = (stripped.match(/\d/g) || []).length;
    return techDetailCount(text) * 2 + digits;
  }

  function stackSignal(text) {
    var names = [];
    STACK_RES.forEach(function (pair) {
      if (pair[0].test(text) && names.indexOf(pair[1]) === -1) names.push(pair[1]);
    });
    var score = clamp(names.length * 18, 0, 100);
    var detail = names.length
      ? names.length + ' stacked buzzword phrase' + (names.length === 1 ? '' : 's') + ', including “' + names.slice(0, 3).join('”, “') + '”.'
      : 'No stacked buzzword phrases.';
    return { score: score, detail: detail, names: names };
  }

  function sectionScores(resume) {
    var out = [];
    resume.sections.forEach(function (section) {
      if (section.id === 'education' || section.id === 'certs') return;
      var text = section.lines.join('\n');
      if (wordCount(text) < 12) return;
      var listLike = section.id === 'skills' || section.lines.every(function (line) { return isListLine(line, section.id); });
      if (listLike) {
        var phraseOnly = phraseSignal(text);
        out.push({
          name: section.name,
          percent: clamp(Math.round(phraseOnly.score * 0.35), 0, 40),
          detail: 'This is a tool list, so sentence rhythm is not scored. ' + phraseOnly.detail
        });
        return;
      }
      var sentences = splitSentences(text);
      var bullets = section.lines.filter(function (line) { return /^[-*•]/.test(line) || wordCount(line) >= 8; });
      var percent = Math.round(combineAi([
        { score: phraseSignal(text).score, weight: AI_WEIGHTS.phrases },
        { score: uniformitySignal(sentences).score, weight: AI_WEIGHTS.uniformity },
        { score: templateSignal(bullets).score, weight: AI_WEIGHTS.template },
        { score: specificsSignal(sentences).score, weight: AI_WEIGHTS.specifics },
        { score: stackSignal(text).score, weight: AI_WEIGHTS.stacks }
      ]));
      var lead = phraseSignal(text);
      out.push({
        name: section.name,
        percent: clamp(percent, 0, 100),
        detail: lead.detail
      });
    });
    return out;
  }

  function pickHighlights(sentences) {
    var ranked = sentences.map(function (s) {
      var signals = [];
      var score = 0;
      if (findWeightedPhrases(s).length) { score += 46; signals.push('Stock phrase'); }
      if (GENERIC_OPEN_RE.test(s.replace(/^[-*•]\s*/, ''))) { score += 22; signals.push('Template opener'); }
      if (stackSignal(s).names.length) { score += 18; signals.push('Buzzword stack'); }
      var wc = wordCount(s);
      if (!hasMeaningfulNumber(s) && wc >= 12 && wc <= 28) { score += 12; signals.push('No concrete number'); }
      if (hasMeaningfulNumber(s) || techDetailCount(s) >= 2) score -= 40;
      return { text: clip(s, 320), score: score, signals: signals };
    }).filter(function (h) {
      return h.score >= 45 && h.signals.some(function (sig) { return sig !== 'No concrete number'; });
    }).sort(function (a, b) { return b.score - a.score; });
    var out = [];
    ranked.forEach(function (h) {
      if (out.length >= 3) return;
      if (out.some(function (x) { return x.text === h.text; })) return;
      out.push({ text: h.text, signals: h.signals });
    });
    return out;
  }

  function isProseUnit(unit) {
    if (!unit || unit.list) return false;
    if (unit.section === 'skills' || unit.section === 'education' || unit.section === 'certs') return false;
    if (wordCount(unit.text) < 8) return false;
    if (isDateLine(unit.text)) return false;
    if (/@/.test(unit.text) && wordCount(unit.text) < 8) return false;
    return true;
  }

  function parseResume(text, now) {
    var lines = joinWraps(explodeLines(text));
    var sections = [];
    var current = { id: 'overview', name: 'Overview', lines: [] };
    lines.forEach(function (line) {
      var heading = resumeHeading(line);
      if (heading) {
        if (current.lines.length) sections.push(current);
        current = { id: heading.id, name: heading.name, lines: [] };
      } else {
        current.lines.push(line);
      }
    });
    if (current.lines.length) sections.push(current);
    if (!sections.length) sections.push(current);

    var units = [];
    sections.forEach(function (section) {
      section.lines.forEach(function (line) {
        var clean = stripBullet(line);
        if (wordCount(clean) < 2) return;
        units.push({
          text: clean,
          section: section.id,
          sectionName: section.name,
          list: isListLine(line, section.id),
          bullet: /^[-*•]/.test(line) || /^([-*•]|\d+[.)])\s/.test(line)
        });
      });
    });

    var jobs = parseJobs(sections, now);
    var years = null;
    if (jobs.length) {
      years = mergeYears(jobs.map(function (job) { return job.range; }), now);
    }
    if (!years) {
      var loose = [];
      sections.forEach(function (section) {
        if (section.id === 'education') return;
        section.lines.forEach(function (line) {
          var range = findRange(line);
          if (range) loose.push(range);
        });
      });
      years = mergeYears(loose, now);
    }
    var titles = [];
    jobs.forEach(function (job) {
      if (job.title && titles.indexOf(job.title) === -1) titles.push(job.title);
    });
    if (!titles.length) {
      lines.slice(0, 6).forEach(function (line) {
        if (/\b(engineer|developer|manager|designer|analyst|recruiter)\b/i.test(line) && wordCount(line) <= 12) titles.push(line);
      });
    }
    return { text: text, sections: sections, units: units, jobs: jobs, years: years, titles: titles };
  }

  function parseJobs(sections, now) {
    var source = sections.filter(function (s) { return s.id === 'experience' || s.id === 'projects'; });
    if (!source.length) source = sections.filter(function (s) { return s.id !== 'education' && s.id !== 'skills' && s.id !== 'certs'; });
    var jobs = [];
    var buf = [];
    source.forEach(function (section) {
      section.lines.forEach(function (line) {
        var range = findRange(line);
        if (range) {
          var title = line;
          for (var b = buf.length - 1; b >= 0; b--) {
            if (looksLikeTitle(buf[b])) { title = stripBullet(buf[b]); break; }
          }
          jobs.push({
            title: title,
            range: range,
            years: rangeYears(range, now),
            lines: [],
            units: []
          });
          buf = [];
        } else if (jobs.length && (isBullet(line) || wordCount(line) > 8 || /[.!]$/.test(line))) {
          var clean = stripBullet(line);
          jobs[jobs.length - 1].lines.push(clean);
          jobs[jobs.length - 1].units.push({
            text: clean,
            section: section.id,
            list: isListLine(line, section.id),
            bullet: isBullet(line)
          });
        } else {
          buf.push(line);
        }
      });
    });
    return jobs;
  }

  function looksLikeTitle(line) {
    return /\b(engineer|developer|manager|designer|scientist|analyst|recruiter|lead|intern|consultant|architect|founder|director|writer|specialist|associate|officer|researcher)\b/i.test(line);
  }

  function resumeHeading(line) {
    var t = line.replace(/[:.]+$/g, '').trim();
    if (!t || wordCount(t) > 5 || t.length > 42) return null;
    if (/^(professional\s+summary|summary|profile|objective|about(\s+me)?|overview)$/i.test(t)) return { id: 'summary', name: 'Summary' };
    if (/^(technical\s+)?skills|core\s+competenc|technologies|tech\s+stack|expertise$/i.test(t)) return { id: 'skills', name: 'Skills' };
    if (/^(work\s+|professional\s+)?experience|employment(\s+history)?|work\s+history|career\s+history$/i.test(t)) return { id: 'experience', name: 'Experience' };
    if (/^(selected\s+|personal\s+|key\s+)?projects$/i.test(t)) return { id: 'projects', name: 'Projects' };
    if (/^education|academic$/i.test(t)) return { id: 'education', name: 'Education' };
    if (/^certifications?|licenses|courses$/i.test(t)) return { id: 'certs', name: 'Certifications' };
    if (/^(other|additional|activities|publications|writing|open\s+source|awards)$/i.test(t)) return { id: 'other', name: 'Other' };
    return null;
  }

  function isListLine(line, sectionId) {
    var clean = stripBullet(line);
    if (sectionId === 'skills' || sectionId === 'certs') {
      if (wordCount(clean) > 24 && /\b(built|owned|shipped|designed|wrote)\b/i.test(clean)) return false;
      return true;
    }
    var commas = (clean.match(/,/g) || []).length;
    if (commas >= 3 && wordCount(clean) <= 22 && !/\b(built|owned|shipped|because|when|after|before|wrote|designed)\b/i.test(clean)) return true;
    return false;
  }

  function findRange(line) {
    var month = '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
    var year = '((?:19|20)\\d{2})';
    var present = '(present|current|now|ongoing)';
    var sep = '(?:-|to|until|through)';
    var re1 = new RegExp('\\b' + month + '\\.?\\s+' + year + '\\s*' + sep + '\\s*(?:' + month + '\\.?\\s+' + year + '|' + present + ')\\b', 'i');
    var m = line.match(re1);
    if (m) {
      return {
        start: dateFrom(m[1], m[2]),
        end: m[5] ? null : dateFrom(m[3], m[4])
      };
    }
    var re2 = new RegExp('\\b(0?[1-9]|1[0-2])\\/((?:19|20)\\d{2})\\s*' + sep + '\\s*(?:((?:0?[1-9]|1[0-2])\\/((?:19|20)\\d{2}))|' + present + ')\\b', 'i');
    m = line.match(re2);
    if (m) {
      var end = null;
      if (m[3] && m[3].indexOf('/') !== -1) {
        var parts = m[3].split('/');
        end = new Date(Date.UTC(parseInt(parts[1], 10), parseInt(parts[0], 10) - 1, 1));
      }
      return { start: new Date(Date.UTC(parseInt(m[2], 10), parseInt(m[1], 10) - 1, 1)), end: end };
    }
    var re3 = new RegExp('\\b' + year + '\\s*' + sep + '\\s*(?:' + year + '|' + present + ')\\b', 'i');
    m = line.match(re3);
    if (m) {
      return {
        start: new Date(Date.UTC(parseInt(m[1], 10), 0, 1)),
        end: m[3] ? null : new Date(Date.UTC(parseInt(m[2], 10), 11, 31))
      };
    }
    return null;
  }

  function dateFrom(monthName, year) {
    var key = String(monthName || '').toLowerCase().slice(0, 3);
    return new Date(Date.UTC(parseInt(year, 10), MONTHS[key], 1));
  }

  function rangeYears(range, now) {
    if (!range || !range.start) return 0;
    var end = range.end || now;
    var months = (end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
    if (months < 0) return 0;
    return months / 12;
  }

  function mergeYears(ranges, now) {
    var intervals = [];
    ranges.forEach(function (range) {
      if (!range || !range.start) return;
      var start = range.start.getTime();
      var end = (range.end || now).getTime();
      if (end <= start) return;
      if (end - start > 1000 * 60 * 60 * 24 * 365 * 45) return;
      intervals.push({ start: start, end: end });
    });
    if (!intervals.length) return null;
    intervals.sort(function (a, b) { return a.start - b.start; });
    var merged = [intervals[0]];
    for (var i = 1; i < intervals.length; i++) {
      var last = merged[merged.length - 1];
      if (intervals[i].start > last.end) merged.push(intervals[i]);
      else last.end = Math.max(last.end, intervals[i].end);
    }
    var ms = merged.reduce(function (sum, r) { return sum + (r.end - r.start); }, 0);
    return Math.round((ms / (1000 * 60 * 60 * 24 * 30.44) / 12) * 10) / 10;
  }

  function mention(text, skillObj) {
    if (!text || !skillObj) return null;
    var compiled = null;
    for (var i = 0; i < COMPILED.length; i++) {
      if (COMPILED[i].skill.id === skillObj.id) { compiled = COMPILED[i]; break; }
    }
    if (!compiled) return null;
    var negated = null;
    var live = null;
    for (var r = 0; r < compiled.regs.length; r++) {
      var re = compiled.regs[r].re;
      re.lastIndex = 0;
      var m;
      while ((m = re.exec(text))) {
        if (skillObj.id === 'go' && goFalsePositive(text, m.index)) {
          if (m.index === re.lastIndex) re.lastIndex++;
          continue;
        }
        if (negatedAt(text, m.index)) negated = { negated: true, index: m.index };
        else {
          live = { negated: false, index: m.index };
          break;
        }
        if (m.index === re.lastIndex) re.lastIndex++;
      }
      if (live) break;
    }
    return live || negated;
  }

  function findSkills(text) {
    var found = [];
    COMPILED.forEach(function (entry) {
      var hit = mention(text, entry.skill);
      if (hit && !hit.negated) found.push({ id: entry.skill.id, label: entry.skill.label, index: hit.index, loose: entry.skill.loose });
    });
    found.sort(function (a, b) { return a.index - b.index; });
    return found;
  }

  function goFalsePositive(text, index) {
    var after = text.slice(index).toLowerCase();
    if (/^go(?:ing|es|ne|al|als|ogle)\b/.test(after)) return true;
    if (/^go[\s-]+(to|for|into|ahead|deeper|through|beyond|live|from|back|out|on|over|forward|further|home|wrong|well|get|getter)\b/.test(after)) return true;
    var before = text.slice(Math.max(0, index - 16), index).toLowerCase();
    if (/\b(let|to)\s+$/.test(before)) return true;
    return false;
  }

  function negatedAt(text, index) {
    var before = text.slice(Math.max(0, index - 110), index);
    if (/\bnot only\b/i.test(before)) return false;
    var neg = before.search(/\b(no|not|never|without|haven'?t|hasn'?t|didn'?t|don'?t|lacked|lack|wasn'?t|weren'?t)\b/i);
    if (neg === -1) return false;
    var between = before.slice(neg);
    if (/\b(but|however|although|except|later|then|after that)\b/i.test(between)) return false;
    return true;
  }

  function aliasToRegExp(alias) {
    var trimmed = String(alias).trim().toLowerCase();
    var body = escapeRegExp(trimmed).replace(/\s+/g, '\\s+');
    if (trimmed === 'java') body += '(?!script)';
    if (trimmed === 'c++') return /c\+\+/gi;
    if (trimmed === 'c#') return /c#/gi;
    if (trimmed === '.net') return /\.net\b/gi;
    var start = /^[a-z0-9]/i.test(trimmed) ? '\\b' : '';
    var end = /[a-z0-9]$/i.test(trimmed) ? '\\b' : '';
    return new RegExp(start + body + end, 'gi');
  }

  function significantTerms(text) {
    var norm = text.toLowerCase().replace(/-/g, ' ');
    var raw = norm.match(/[a-z][a-z+]{3,}/g) || [];
    var out = [];
    raw.forEach(function (word) {
      if (STOP.has(word) || GENERIC_TERMS.has(word)) return;
      if (out.indexOf(word) === -1) out.push(word);
    });
    ['open source', 'event driven', 'query tuning', 'schema design', 'on call', 'post mortem', 'production incident'].forEach(function (phrase) {
      if (norm.indexOf(phrase) !== -1 && out.indexOf(phrase) === -1) out.push(phrase);
    });
    return out.slice(0, 8);
  }

  function hasMeaningfulNumber(s) {
    var stripped = String(s).replace(/\b(19|20)\d{2}\b/g, ' ');
    if (/\d/.test(stripped)) return true;
    if (/\b(hundred|thousand|million|billion)\b/i.test(s)) return true;
    return false;
  }

  function techDetailCount(s) {
    var m = String(s).match(TECH_DETAIL_RE);
    return m ? m.length : 0;
  }

  function splitJdSentences(line) {
    var parts = String(line || '').split(/(?<=[.!?])\s+/);
    return parts.map(function (part) { return part.trim(); }).filter(Boolean);
  }

  function splitSentences(text) {
    return String(text || '').split(/\n+/).reduce(function (acc, line) {
      line.split(/(?<=[.!?])\s+(?=[A-Z0-9"“])/).forEach(function (part) {
        var t = part.trim();
        if (wordCount(t) >= 6) acc.push(t);
      });
      return acc;
    }, []);
  }

  function isDateLine(s) {
    return !!findRange(s) && wordCount(s) <= 8;
  }

  function explodeLines(text) {
    var out = [];
    String(text || '').split(/\n/).forEach(function (raw) {
      raw.split(/\s*[•●]\s+/).forEach(function (part) {
        var line = part.trim();
        if (line) out.push(line);
      });
    });
    return out;
  }

  function joinWraps(lines) {
    var out = [];
    lines.forEach(function (line) {
      if (!out.length) { out.push(line); return; }
      var prev = out[out.length - 1];
      var thisHeader = !!resumeHeading(line) || !!jdHeader(line);
      var thisBullet = isBullet(line);
      if (!thisBullet && !thisHeader && !/[.!?:]$/.test(prev) && wordCount(line) < 14 && /[a-z,]$/.test(prev) && /^[a-z("]/.test(line)) {
        out[out.length - 1] = prev + ' ' + line;
      } else out.push(line);
    });
    return out;
  }

  function isBullet(line) {
    return /^\s*(?:[-*•–]|\d+[.)])\s+\S/.test(line);
  }

  function stripBullet(line) {
    return String(line || '').replace(/^\s*(?:[-*•–]|\d+[.)])\s+/, '').trim();
  }

  function normalize(text) {
    return String(text || '')
      .replace(/\u0000/g, '')
      .replace(/[\u2018\u2019\u2032]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014\u2212]/g, '-')
      .replace(/\u00a0/g, ' ')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function words(s) {
    return String(s || '').match(/[A-Za-z0-9][A-Za-z0-9+.#/-]*/g) || [];
  }

  function wordCount(s) { return words(s).length; }

  function avg(nums) {
    if (!nums.length) return 0;
    return nums.reduce(function (a, b) { return a + b; }, 0) / nums.length;
  }

  function stdev(nums) {
    if (nums.length < 2) return 0;
    var mean = avg(nums);
    var v = avg(nums.map(function (n) { return (n - mean) * (n - mean); }));
    return Math.sqrt(v);
  }

  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function round1(n) { return Math.round(n * 10) / 10; }

  function clip(text, n) {
    var t = String(text || '').replace(/\s+/g, ' ').trim();
    if (t.length <= n) return t;
    var cut = t.slice(0, n);
    var sp = cut.lastIndexOf(' ');
    if (sp > n * 0.6) cut = cut.slice(0, sp);
    return cut + '…';
  }

  function tidy(text) {
    return String(text || '').replace(/\s+/g, ' ').replace(/\s+\./g, '.').trim();
  }

  function escapeRegExp(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  return {
    analyze: analyze,
    disclaimer: DISCLAIMER,
    findSkills: findSkills
  };
});
