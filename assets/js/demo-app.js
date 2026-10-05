/* Try RightHire: page behavior. Parsing and scoring stay in the browser unless deep mode is on. */
(function () {
  'use strict';

  var engine = window.RightHireAnalyze;
  var samplePack = window.RightHireSamples;
  if (!engine || !samplePack) return;

  var PDF_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER;
  }

  var proxyUrl = String(window.RIGHTHIRE_PROXY_URL || '').trim();
  var form = document.getElementById('demo-form');
  var jdEl = document.getElementById('jd');
  var resumeEl = document.getElementById('resume');
  var fileEl = document.getElementById('file');
  var fileStatus = document.getElementById('file-status');
  var drop = document.getElementById('drop');
  var errorEl = document.getElementById('form-error');
  var analyzeBtn = document.getElementById('analyze-btn');
  var reportEl = document.getElementById('report');
  var privacyNote = document.getElementById('privacy-note');
  var modeField = document.getElementById('mode-field');
  var menuBtn = document.getElementById('sample-menu-btn');
  var menu = document.getElementById('sample-menu');
  var lastReport = null;
  var busy = false;

  if (proxyUrl) modeField.hidden = false;

  samplePack.samples.forEach(function (sample) {
    var li = document.createElement('li');
    li.setAttribute('role', 'none');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('role', 'menuitem');
    btn.dataset.sample = sample.id;
    var title = document.createElement('b');
    title.textContent = sample.label;
    var blurb = document.createElement('small');
    blurb.textContent = sample.blurb;
    btn.appendChild(title);
    btn.appendChild(blurb);
    btn.addEventListener('click', function () {
      closeMenu();
      runSample(sample.id);
    });
    li.appendChild(btn);
    menu.appendChild(li);
  });

  document.getElementById('sample-run').addEventListener('click', function () { runSample('strong'); });
  menuBtn.addEventListener('click', function () {
    var open = menu.hidden;
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  document.addEventListener('click', function (e) {
    if (!menu.hidden && !e.target.closest('.sample-wrap')) closeMenu();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });
  document.querySelectorAll('input[name="mode"]').forEach(function (input) {
    input.addEventListener('change', updatePrivacy);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    runAnalysis();
  });

  fileEl.addEventListener('change', function () {
    if (fileEl.files && fileEl.files[0]) loadFile(fileEl.files[0]);
  });
  ['dragenter', 'dragover'].forEach(function (name) {
    drop.addEventListener(name, function (e) {
      e.preventDefault();
      drop.classList.add('drag');
    });
  });
  ['dragleave', 'drop'].forEach(function (name) {
    drop.addEventListener(name, function (e) {
      e.preventDefault();
      drop.classList.remove('drag');
    });
  });
  drop.addEventListener('drop', function (e) {
    var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) loadFile(file);
  });

  function closeMenu() {
    menu.hidden = true;
    menuBtn.setAttribute('aria-expanded', 'false');
  }

  function updatePrivacy() {
    var deep = proxyUrl && document.getElementById('mode-deep').checked;
    privacyNote.textContent = deep
      ? 'Deep AI mode sends the job description and résumé text to the proxy URL configured on this page. The proxy calls a model. The API key stays on the server.'
      : 'Instant mode runs in this browser. The job description and résumé are not uploaded.';
  }

  function showError(message) {
    errorEl.hidden = !message;
    errorEl.textContent = message || '';
  }

  function setBusy(on, label) {
    busy = on;
    analyzeBtn.disabled = on;
    var span = analyzeBtn.querySelector('span');
    if (span) span.textContent = on ? (label || 'Analyzing…') : 'Analyze';
    reportEl.setAttribute('aria-busy', on ? 'true' : 'false');
  }

  function runSample(id) {
    var sample = null;
    samplePack.samples.forEach(function (item) { if (item.id === id) sample = item; });
    if (!sample) return;
    jdEl.value = sample.jd;
    resumeEl.value = sample.resume;
    fileEl.value = '';
    setFileStatus('Sample loaded: ' + sample.label + '.', true);
    showError('');
    runAnalysis();
  }

  function setFileStatus(text, ok) {
    fileStatus.textContent = text;
    fileStatus.classList.toggle('ok', !!ok);
    fileStatus.classList.toggle('bad', ok === false);
  }

  function loadFile(file) {
    showError('');
    setFileStatus('Reading ' + file.name + '…', true);
    readResumeFile(file).then(function (text) {
      var clean = String(text || '').replace(/\n{3,}/g, '\n\n').trim();
      if (clean.length < 40) {
        setFileStatus('We could not read enough text from ' + file.name + '. If it is a scan, paste the résumé instead.', false);
        return;
      }
      resumeEl.value = clean;
      setFileStatus('Loaded ' + file.name + ' (' + clean.length.toLocaleString() + ' characters). Review the text, then analyze.', true);
    }).catch(function (err) {
      setFileStatus(err && err.message ? err.message : 'Could not read that file.', false);
    });
  }

  function readResumeFile(file) {
    var name = file.name || '';
    var ext = (name.split('.').pop() || '').toLowerCase();
    if (file.size > 8 * 1024 * 1024) return Promise.reject(new Error('That file is over 8 MB. Paste the text instead.'));
    if (ext === 'doc') return Promise.reject(new Error('Old .doc files are not supported. Save as DOCX, or paste the text.'));
    if (ext === 'txt' || file.type === 'text/plain') return readAs(file, 'text');
    if (ext === 'pdf' || file.type === 'application/pdf') {
      if (!window.pdfjsLib) return Promise.reject(new Error('The PDF reader did not load. Check your connection, or paste the text.'));
      return readAs(file, 'buffer').then(parsePdf);
    }
    if (ext === 'docx' || /wordprocessingml/.test(file.type || '')) {
      if (!window.mammoth) return Promise.reject(new Error('The DOCX reader did not load. Check your connection, or paste the text.'));
      return readAs(file, 'buffer').then(parseDocx);
    }
    return Promise.reject(new Error('Use a PDF, DOCX, or TXT file.'));
  }

  function readAs(file, kind) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error('The file could not be read.')); };
      reader.onload = function () { resolve(reader.result); };
      if (kind === 'text') reader.readAsText(file);
      else reader.readAsArrayBuffer(file);
    });
  }

  function parsePdf(buffer) {
    var data = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;
    return window.pdfjsLib.getDocument({ data: data }).promise.then(function (pdf) {
      var chain = Promise.resolve('');
      for (var i = 1; i <= pdf.numPages; i++) {
        (function (n) {
          chain = chain.then(function (text) {
            return pdf.getPage(n).then(function (page) {
              return page.getTextContent().then(function (content) {
                return text + '\n' + itemsToText(content.items);
              });
            });
          });
        })(i);
      }
      return chain;
    });
  }

  function itemsToText(items) {
    var out = '';
    var lastY = null;
    (items || []).forEach(function (item) {
      var str = item.str || '';
      if (!str) return;
      var y = item.transform ? item.transform[5] : 0;
      if (lastY !== null && Math.abs(y - lastY) > 3) out += '\n';
      else if (out && !/\s$/.test(out) && str.charAt(0) !== ' ') out += ' ';
      out += str;
      lastY = y;
    });
    return out;
  }

  function parseDocx(buffer) {
    return window.mammoth.extractRawText({ arrayBuffer: buffer }).then(function (result) {
      return result.value || '';
    });
  }

  function useDeep() {
    return !!(proxyUrl && document.getElementById('mode-deep') && document.getElementById('mode-deep').checked);
  }

  function runAnalysis() {
    if (busy) return;
    var jd = jdEl.value.trim();
    var resume = resumeEl.value.trim();
    if (jd.length < 40 || resume.length < 40) {
      showError('Add a fuller job description and résumé. A line or two is not enough to score.');
      (jd.length < 40 ? jdEl : resumeEl).focus();
      return;
    }
    showError('');
    var deep = useDeep();
    setBusy(true, deep ? 'Asking the model…' : 'Analyzing…');
    var task = deep ? deepAnalyze(jd, resume) : Promise.resolve({ report: engine.analyze(jd, resume), fallback: '' });
    task.then(function (result) {
      if (result.report && result.report.error) {
        showError(result.report.error);
        return;
      }
      renderReport(result.report, result.fallback);
    }).catch(function (err) {
      showError(err && err.message ? err.message : 'The analysis failed.');
    }).then(function () {
      setBusy(false);
    });
  }

  function deepAnalyze(jd, resume) {
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, 45000);
    var endpoint = proxyUrl.replace(/\/$/, '') + '/analyze';
    return fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jd: jd, resume: resume }),
      signal: ctrl.signal
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (body) {
        if (!res.ok) throw new Error(body.error || 'The proxy returned an error.');
        return { report: normalizeDeep(body), fallback: '' };
      });
    }).catch(function (err) {
      var instant = engine.analyze(jd, resume);
      var reason = err && err.name === 'AbortError' ? 'The proxy took too long.' : (err && err.message ? err.message : 'Deep AI mode failed.');
      return { report: instant, fallback: reason + ' Showing the in-browser estimate instead.' };
    }).then(function (result) {
      clearTimeout(timer);
      return result;
    });
  }

  function normalizeDeep(data) {
    if (!data || typeof data !== 'object') throw new Error('The proxy returned an unexpected report.');
    var reqs = Array.isArray(data.requirements) ? data.requirements : [];
    if (!reqs.length && (Array.isArray(data.must) || Array.isArray(data.nice))) {
      (data.must || []).forEach(function (r) { r.priority = r.priority || 'must'; reqs.push(r); });
      (data.nice || []).forEach(function (r) { r.priority = r.priority || 'nice'; reqs.push(r); });
    }
    if (typeof data.fitScore !== 'number' || !reqs.length) throw new Error('The proxy returned an unexpected report.');
    var score = clamp(Math.round(data.fitScore), 0, 100);
    var verdict = data.verdict === 'Strong' || data.verdict === 'Possible' || data.verdict === 'Weak'
      ? data.verdict
      : (score >= 75 ? 'Strong' : score >= 45 ? 'Possible' : 'Weak');
    var ai = data.ai || {};
    return {
      mode: 'deep',
      fitScore: score,
      verdict: verdict,
      headline: data.headline || '',
      gapIntro: data.gapIntro || '',
      experience: data.experience || { summary: '' },
      requirements: reqs.map(function (r) {
        return {
          text: r.text || '',
          priority: r.priority === 'nice' ? 'nice' : 'must',
          status: r.status === 'matched' || r.status === 'partial' || r.status === 'missing' ? r.status : 'partial',
          listedOnly: !!r.listedOnly,
          points: typeof r.points === 'number' ? r.points : 0,
          evidence: r.evidence || '',
          note: r.note || ''
        };
      }),
      strengths: data.strengths || [],
      gaps: data.gaps || [],
      ai: {
        percent: clamp(Math.round(ai.percent || 0), 0, 100),
        disclaimer: ai.disclaimer || engine.disclaimer,
        signals: ai.signals || [],
        sections: ai.sections || [],
        highlights: ai.highlights || []
      },
      questions: data.questions || []
    };
  }

  function renderReport(report, fallback) {
    lastReport = report;
    reportEl.hidden = false;
    reportEl.textContent = '';
    if (fallback) {
      var banner = el('p', { class: 'report-banner' });
      banner.textContent = fallback;
      reportEl.appendChild(banner);
    }
    reportEl.appendChild(scoreBand(report));
    reportEl.appendChild(experienceCard(report.experience || {}));
    reportEl.appendChild(requirementsCard(report.requirements || []));
    reportEl.appendChild(splitCard(report));
    reportEl.appendChild(aiCard(report.ai || {}));
    reportEl.appendChild(questionsCard(report.questions || []));
    reportEl.appendChild(actions());
    var heading = reportEl.querySelector('h2');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus();
    }
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    reportEl.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  function scoreBand(report) {
    var band = el('section', { class: 'score-band', 'aria-label': 'Role fit' });
    band.appendChild(ring(report.fitScore, report.verdict));
    var copy = el('div', { class: 'score-copy' });
    var verdict = el('p', { class: 'verdict v-' + slug(report.verdict) });
    verdict.textContent = report.verdict + ' fit';
    var h = el('h2');
    h.textContent = report.fitScore + ' / 100';
    var p = el('p');
    p.textContent = report.headline || '';
    var chip = el('p', { class: 'mode-chip' });
    chip.textContent = report.mode === 'deep'
      ? 'Deep AI mode · model report via your proxy'
      : 'Instant mode · computed in this browser';
    copy.appendChild(verdict);
    copy.appendChild(h);
    copy.appendChild(p);
    copy.appendChild(chip);
    band.appendChild(copy);
    return band;
  }

  function ring(score, verdict) {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 120 120');
    svg.setAttribute('class', 'score-ring v-' + slug(verdict));
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', score + ' out of 100, ' + verdict + ' fit');
    var c = 2 * Math.PI * 46;
    var track = document.createElementNS(ns, 'circle');
    track.setAttribute('class', 'track');
    track.setAttribute('cx', '60');
    track.setAttribute('cy', '60');
    track.setAttribute('r', '46');
    var value = document.createElementNS(ns, 'circle');
    value.setAttribute('class', 'value');
    value.setAttribute('cx', '60');
    value.setAttribute('cy', '60');
    value.setAttribute('r', '46');
    value.setAttribute('stroke-dasharray', c.toFixed(2));
    value.setAttribute('stroke-dashoffset', (c * (1 - score / 100)).toFixed(2));
    var text = document.createElementNS(ns, 'text');
    text.setAttribute('class', 'score-num');
    text.setAttribute('x', '60');
    text.setAttribute('y', '66');
    text.setAttribute('text-anchor', 'middle');
    text.textContent = String(score);
    svg.appendChild(track);
    svg.appendChild(value);
    svg.appendChild(text);
    return svg;
  }

  function experienceCard(exp) {
    var card = el('section', { class: 'panel-card' });
    card.appendChild(el('p', { class: 'kicker-label', text: 'Experience-level fit' }));
    card.appendChild(el('h2', { text: 'Years and seniority' }));
    card.appendChild(el('p', { text: exp.summary || 'No clear years or seniority comparison.' }));
    var meta = el('div', { class: 'exp-meta' });
    if (exp.jdYears) meta.appendChild(el('span', { text: 'Role asks ' + exp.jdYears + '+ years' }));
    if (exp.resumeYears) meta.appendChild(el('span', { text: 'Résumé dates ≈ ' + exp.resumeYears + ' years' }));
    if (exp.jdLevel) meta.appendChild(el('span', { text: 'Role level: ' + exp.jdLevel }));
    if (exp.resumeLevel) meta.appendChild(el('span', { text: 'Résumé titles: ' + exp.resumeLevel }));
    if (meta.childNodes.length) card.appendChild(meta);
    return card;
  }

  function requirementsCard(reqs) {
    var card = el('section', { class: 'panel-card' });
    card.appendChild(el('p', { class: 'kicker-label', text: 'Requirements' }));
    card.appendChild(el('h2', { text: 'Must-haves and nice-to-haves' }));
    var legend = el('div', { class: 'legend' });
    legend.appendChild(el('span', { class: 'badge badge-matched', text: 'Matched · proof in the work' }));
    legend.appendChild(el('span', { class: 'badge badge-partial', text: 'Partial · thin proof' }));
    legend.appendChild(el('span', { class: 'badge badge-list', text: 'Listed only' }));
    legend.appendChild(el('span', { class: 'badge badge-missing', text: 'Missing' }));
    card.appendChild(legend);
    ['must', 'nice'].forEach(function (priority) {
      var group = reqs.filter(function (r) { return r.priority === priority; });
      if (!group.length) return;
      var h = el('h3', { text: priority === 'must' ? 'Must-have' : 'Nice to have' });
      h.style.marginTop = '8px';
      card.appendChild(h);
      var list = el('div', { class: 'req-list' });
      group.forEach(function (req) { list.appendChild(reqRow(req)); });
      card.appendChild(list);
    });
    if (!reqs.length) card.appendChild(el('p', { text: 'No requirements could be pulled from this job description.' }));
    return card;
  }

  function reqRow(req) {
    var row = el('article', { class: 'req req-' + (req.status || 'partial') });
    var head = el('header');
    var badge = el('span', { class: 'badge badge-' + (req.status || 'partial') });
    badge.textContent = cap(req.status || 'partial');
    head.appendChild(badge);
    if (req.listedOnly) head.appendChild(el('span', { class: 'badge badge-list', text: 'Listed only' }));
    head.appendChild(el('span', { class: 'pri', text: req.priority === 'nice' ? 'Nice to have' : 'Must-have' }));
    row.appendChild(head);
    row.appendChild(el('h3', { text: req.text || '' }));
    if (req.note) row.appendChild(el('p', { class: 'note', text: req.note }));
    var quote = el('blockquote');
    quote.appendChild(el('span', { class: 'q-label', text: 'Résumé evidence' }));
    quote.appendChild(document.createTextNode(req.evidence || 'No supporting line in the résumé.'));
    row.appendChild(quote);
    return row;
  }

  function splitCard(report) {
    var wrap = el('div', { class: 'split-2' });
    wrap.appendChild(listCard('Strengths', 'Top evidence', report.strengths || [], 'No strong matches to highlight.'));
    var gaps = listCard('Gaps and risks', 'What to watch', report.gaps || [], 'No gaps to flag.');
    if (report.gapIntro) gaps.insertBefore(el('p', { class: 'gap-intro', text: report.gapIntro }), gaps.querySelector('.point') || null);
    wrap.appendChild(gaps);
    return wrap;
  }

  function listCard(title, kicker, items, empty) {
    var card = el('section', { class: 'panel-card' });
    card.appendChild(el('p', { class: 'kicker-label', text: kicker }));
    card.appendChild(el('h2', { text: title }));
    if (!items.length) {
      card.appendChild(el('p', { text: empty }));
      return card;
    }
    items.forEach(function (item) {
      var block = el('div', { class: 'point' });
      block.appendChild(el('strong', { text: item.title || '' }));
      block.appendChild(el('p', { text: item.detail || '' }));
      card.appendChild(block);
    });
    return card;
  }

  function aiCard(ai) {
    var card = el('section', { class: 'panel-card' });
    card.appendChild(el('p', { class: 'kicker-label', text: 'AI-written content' }));
    card.appendChild(el('h2', { text: 'Likelihood, not proof' }));
    var top = el('div', { class: 'ai-top' });
    var pct = el('p', { class: 'ai-pct ' + aiBand(ai.percent) });
    pct.appendChild(document.createTextNode((ai.percent || 0) + '%'));
    pct.appendChild(el('small', { text: 'looks AI-written' }));
    var explain = el('div');
    explain.appendChild(el('p', { text: 'An estimate of how much of the résumé resembles common AI-generated résumé language. People can write this way without a tool, and careful human writing can still trip a signal.' }));
    top.appendChild(pct);
    top.appendChild(explain);
    card.appendChild(top);
    card.appendChild(el('p', { class: 'disclaimer', text: ai.disclaimer || engine.disclaimer }));
    (ai.signals || []).forEach(function (signal) {
      var row = el('div', { class: 'signal' });
      row.appendChild(el('b', { text: signal.label || '' }));
      var meter = el('span', { class: 'meter' + ((signal.score || 0) >= 60 ? ' hot' : '') });
      var bar = document.createElement('i');
      bar.style.setProperty('--w', clamp(signal.score || 0, 0, 100) + '%');
      if (signal.score == null) bar.style.setProperty('--w', '0%');
      meter.appendChild(bar);
      row.appendChild(meter);
      row.appendChild(el('p', { text: signal.detail || (signal.score == null ? 'Not enough text to score this signal.' : '') }));
      card.appendChild(row);
    });
    if ((ai.sections || []).length) {
      card.appendChild(el('h3', { text: 'By section' }));
      ai.sections.forEach(function (section) {
        var row = el('div', { class: 'section-row' });
        row.appendChild(el('span', { text: section.name || 'Section' }));
        row.appendChild(el('b', { text: section.percent == null ? '—' : section.percent + '%' }));
        card.appendChild(row);
        if (section.detail) card.appendChild(el('p', { class: 'gap-intro', text: section.detail }));
      });
    }
    card.appendChild(el('h3', { text: 'Most AI-like passages' }));
    if (!(ai.highlights || []).length) {
      card.appendChild(el('p', { text: 'No passage stood out as especially AI-like.' }));
    } else {
      ai.highlights.forEach(function (hl) {
        var box = el('div', { class: 'hl' });
        box.appendChild(el('p', { text: '“' + hl.text + '”' }));
        var chips = el('div', { class: 'chips' });
        (hl.signals || []).forEach(function (sig) { chips.appendChild(el('em', { text: sig })); });
        box.appendChild(chips);
        card.appendChild(box);
      });
    }
    return card;
  }

  function questionsCard(questions) {
    var card = el('section', { class: 'panel-card' });
    card.appendChild(el('p', { class: 'kicker-label', text: 'Interview' }));
    card.appendChild(el('h2', { text: 'Questions that probe the gaps' }));
    if (!questions.length) {
      card.appendChild(el('p', { text: 'No follow-up questions for this pair.' }));
      return card;
    }
    var list = el('ol', { class: 'questions' });
    questions.forEach(function (q) { list.appendChild(el('li', { text: q })); });
    card.appendChild(list);
    return card;
  }

  function actions() {
    var bar = el('div', { class: 'report-actions no-print' });
    var copyBtn = el('button', { class: 'btn btn-line', type: 'button' });
    copyBtn.textContent = 'Copy report';
    var note = el('p', { id: 'copy-note', text: 'Download as PDF opens the print dialog. Choose Save as PDF.' });
    var pdfBtn = el('button', { class: 'btn btn-primary', type: 'button', 'aria-describedby': 'copy-note' });
    pdfBtn.textContent = 'Download as PDF';
    copyBtn.addEventListener('click', function () { copyReport(copyBtn); });
    pdfBtn.addEventListener('click', function () { window.print(); });
    bar.appendChild(copyBtn);
    bar.appendChild(pdfBtn);
    bar.appendChild(note);
    return bar;
  }

  function copyReport(button) {
    var text = reportText(lastReport);
    var done = function () {
      var prev = button.textContent;
      button.textContent = 'Copied';
      button.classList.add('copied');
      setTimeout(function () {
        button.textContent = prev;
        button.classList.remove('copied');
      }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () { fallbackCopy(text, done); });
    } else fallbackCopy(text, done);
  }

  function fallbackCopy(text, done) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.left = '-999px';
    document.body.appendChild(area);
    area.select();
    try { document.execCommand('copy'); done(); } catch (e) { showError('Copy failed. Select the report and copy it manually.'); }
    document.body.removeChild(area);
  }

  function reportText(report) {
    if (!report) return '';
    var lines = [];
    lines.push('RightHire evidence report');
    lines.push(report.verdict + ' fit · ' + report.fitScore + ' / 100');
    lines.push(report.mode === 'deep' ? 'Deep AI mode' : 'Instant mode · computed in this browser');
    lines.push('');
    lines.push(report.headline || '');
    lines.push('');
    lines.push('Experience');
    lines.push((report.experience && report.experience.summary) || '');
    lines.push('');
    lines.push('Requirements');
    (report.requirements || []).forEach(function (r) {
      var flag = r.listedOnly ? ' · listed only' : '';
      lines.push('- [' + (r.priority === 'nice' ? 'Nice' : 'Must') + ' · ' + cap(r.status) + flag + '] ' + r.text);
      if (r.note) lines.push('  ' + r.note);
      lines.push('  Evidence: ' + (r.evidence || 'No supporting line.'));
    });
    lines.push('');
    lines.push('Strengths');
    (report.strengths || []).forEach(function (s) { lines.push('- ' + s.title + ' — ' + s.detail); });
    lines.push('');
    lines.push('Gaps and risks');
    if (report.gapIntro) lines.push(report.gapIntro);
    (report.gaps || []).forEach(function (g) { lines.push('- ' + g.title + ' — ' + g.detail); });
    lines.push('');
    lines.push('AI-written likelihood: ' + ((report.ai && report.ai.percent) || 0) + '%');
    lines.push((report.ai && report.ai.disclaimer) || '');
    (report.ai && report.ai.signals || []).forEach(function (s) {
      lines.push('- ' + s.label + (s.score == null ? '' : ' (' + s.score + ')') + ': ' + (s.detail || ''));
    });
    (report.ai && report.ai.sections || []).forEach(function (s) {
      lines.push('- Section ' + s.name + ': ' + (s.percent == null ? 'n/a' : s.percent + '%') + '. ' + (s.detail || ''));
    });
    (report.ai && report.ai.highlights || []).forEach(function (h) {
      lines.push('- Highlight: "' + h.text + '" [' + (h.signals || []).join(', ') + ']');
    });
    lines.push('');
    lines.push('Interview questions');
    (report.questions || []).forEach(function (q, i) { lines.push((i + 1) + '. ' + q); });
    return lines.join('\n');
  }

  function el(tag, attrs) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        if (key === 'class') node.className = attrs[key];
        else if (key === 'text') node.textContent = attrs[key];
        else if (attrs[key] != null) node.setAttribute(key, attrs[key]);
      });
    }
    return node;
  }

  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
  function slug(s) { return String(s || '').toLowerCase(); }
  function aiBand(n) { return n >= 60 ? 'high' : n >= 35 ? 'mid' : 'low'; }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
})();
