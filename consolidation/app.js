(function () {
  'use strict';
  var BASE = 'consolidation/data/';
  var VERDICT = { GAIN: 'GAIN（提高）', HARM: 'HARM（变差）', NO_GAIN_SHOWN: '未显示' };
  var state = { summary: null, data: {} };

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'text') node.textContent = attrs[k];
        else if (k === 'html') node.innerHTML = attrs[k];
        else node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) {
      if (c == null) return;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  }
  function pct(s, n) { return n ? (100 * s / n).toFixed(1) + ' %' : '—'; }
  function signed(x) { return (x > 0 ? '+' : x < 0 ? '−' : '') + Math.abs(x).toFixed(1); }
  function label(id) { return (state.summary.arm_labels || {})[id] || id; }
  function split(start, exp) { return exp.hasTrainStarts ? (start < 10 ? '训练起点' : '测试起点') : '测试'; }

  function counts(exp, filter) {
    var d = state.data[exp.id];
    var out = {};
    d.arms.forEach(function (a) { out[a] = [0, 0]; });
    d.rows.forEach(function (r) {
      if (filter && !filter(r)) return;
      var c = out[d.arms[r[3]]];
      c[0] += r[4]; c[1] += 1;
    });
    return out;
  }

  function armTable(exp) {
    var d = state.data[exp.id];
    var splits = exp.hasTrainStarts ? ['测试起点', '训练起点'] : [null];
    var head = [el('th', { text: '组别' })];
    splits.forEach(function (s) {
      head.push(el('th', { class: 'num', text: (s ? s + ' ' : '') + '成功 / 回合' }));
      head.push(el('th', { text: '成功率' }));
    });
    var body = d.arms.map(function (a) {
      var tds = [el('th', { scope: 'row', text: label(a) + ((exp.ref_arms || []).indexOf(a) >= 0 ? '（v2 参照）' : '') })];
      splits.forEach(function (s) {
        var c = counts(exp, s ? function (r) { return split(r[1], exp) === s; } : null)[a];
        var rate = c[1] ? c[0] / c[1] : 0;
        tds.push(el('td', { class: 'num', text: c[1] ? c[0] + ' / ' + c[1] : '—' }));
        var bar = el('span', { class: 'rate-bar' + ((exp.ref_arms || []).indexOf(a) >= 0 ? ' ref' : '') });
        bar.style.width = Math.round(rate * (splits.length > 1 ? 44 : 90)) + 'px';
        tds.push(el('td', { class: 'rate' }, [c[1] ? bar : null, c[1] ? pct(c[0], c[1]) : '']));
      });
      return el('tr', {}, tds);
    });
    return el('div', { class: 'table-wrap' }, [el('table', {}, [el('thead', {}, [el('tr', {}, head)]), el('tbody', {}, body)])]);
  }

  function compTable(exp) {
    var rows = exp.comparisons.map(function (c) {
      var deltaCls = c.delta > 0 ? 'delta pos' : c.delta < 0 ? 'delta neg' : 'delta';
      var ci = c.ci ? '[' + signed(c.ci[0]) + ', ' + signed(c.ci[1]) + ']' : '—';
      var paired = c.gained != null ? c.gained + ' / ' + c.lost : '—';
      return el('tr', {}, [
        el('th', { scope: 'row' }, [label(c.a) + ' − ' + label(c.b), c.role ? el('div', { class: 'role', text: c.role }) : null,
          c.note ? el('div', { class: 'role', text: c.note }) : null]),
        el('td', { class: 'num' }, [el('span', { class: deltaCls, text: signed(c.delta) + ' pp' })]),
        el('td', { class: 'num', text: ci }),
        el('td', {}, [c.verdict ? el('span', { class: 'badge ' + c.verdict, text: VERDICT[c.verdict] }) : el('span', { class: 'role', text: '描述' })]),
        el('td', { class: 'num', text: paired })
      ]);
    });
    return el('div', { class: 'table-wrap comp' }, [el('table', {}, [
      el('thead', {}, [el('tr', {}, [el('th', { text: '比较' }), el('th', { class: 'num', text: '差' }), el('th', { class: 'num', text: '95 % 区间' }),
        el('th', { text: '判定' }), el('th', { class: 'num', text: '配对' })])]),
      el('tbody', {}, rows)])]);
  }

  function renderCards() {
    var host = document.getElementById('result-cards');
    host.innerHTML = '';
    state.summary.experiments.forEach(function (exp) {
      var primary = exp.comparisons[0];
      var head = el('div', { class: 'card-head' }, [
        el('div', { class: 'card-title' }, [
          el('span', { class: 'id', text: exp.name }),
          el('h3', { text: exp.title }),
          el('span', { class: 'badge family-' + exp.family, text: exp.family === 'noise' ? '噪声路线' : '权重路线' }),
          primary.verdict ? el('span', { class: 'badge ' + primary.verdict, text: '主比较：' + VERDICT[primary.verdict] }) : null
        ]),
        el('p', { class: 'q', text: exp.question }),
        el('div', { class: 'meta' }, [
          el('span', {}, [el('b', { text: '规则写定 ' }), exp.fixed]),
          el('span', {}, [el('b', { text: '运行 ' }), exp.ran]),
          el('span', {}, [el('b', { text: '策略 ' }), exp.policy]),
          el('span', {}, [el('b', { text: '任务 ' }), String(exp.tasks)]),
          el('span', {}, [el('b', { text: '测试 ' }), exp.test])
        ])
      ]);
      var body = el('div', { class: 'card-body' }, [
        el('div', {}, [el('h4', { text: '各组成功次数' }), armTable(exp)]),
        el('div', {}, [el('h4', { text: '比较（事先写定的主比较在前）' }), compTable(exp)]),
        el('ul', { class: 'readings' }, exp.reading.map(function (t) { return el('li', { text: t }); })),
        el('div', { class: 'raw-link' }, [el('a', { href: BASE + exp.id + '.json', text: '逐回合原始记录（JSON）' }),
          ' · ', el('a', { href: '#episodes', 'data-jump': exp.id, text: '在下面逐回合看' })])
      ]);
      host.appendChild(el('article', { class: 'card', id: 'exp-' + exp.id }, [head, body]));
    });
    host.querySelectorAll('a[data-jump]').forEach(function (a) {
      a.addEventListener('click', function () {
        document.getElementById('ep-exp').value = a.getAttribute('data-jump');
        fillTaskSelect(); renderEpisodes();
      });
    });
  }

  var MATRIX_COLS = [
    ['原生', ['native', 'base']], ['平移 2 倍', ['shift2', 'r1']], ['平移约 3 / 4 倍', ['shift3', 'shift4', 'r1m']], ['第二轮方向', ['r2']], ['随机正交平移', ['ortho2']],
    ['最好的固定噪声', ['chosen']], ['自我模仿微调', ['distilled', 'unfiltered_control', 'dsmall_a', 'dsmall_b', 'dzero', 'dmem']],
    ['蒸馏进权重', ['d_succ', 'd_all']]
  ];
  function renderMatrix() {
    var head = el('tr', {}, [el('th', { scope: 'col', text: '实验' })].concat(MATRIX_COLS.map(function (c) { return el('th', { scope: 'col', text: c[0] }); }))
      .concat([el('th', { scope: 'col', text: '主比较' })]));
    var rows = state.summary.experiments.map(function (exp) {
      var arms = state.data[exp.id].arms;
      var p = exp.comparisons[0];
      var cells = MATRIX_COLS.map(function (c) {
        var has = c[1].some(function (a) { return arms.indexOf(a) >= 0; });
        return el('td', {}, [el('span', { class: has ? 'yes' : 'no', text: has ? '✓' : '—', 'aria-label': has ? '有' : '无' })]);
      });
      return el('tr', {}, [el('th', { scope: 'row' }, [el('a', { href: '#exp-' + exp.id, text: exp.name }), el('div', { class: 'role', text: exp.date + ' · ' + exp.tasks + ' 个任务' })])]
        .concat(cells).concat([el('td', { class: 'left' }, [label(p.a) + ' − ' + label(p.b) + ' ' + signed(p.delta) + ' pp ',
          p.verdict ? el('span', { class: 'badge ' + p.verdict, text: VERDICT[p.verdict] }) : ''])]));
    });
    var host = document.getElementById('matrix');
    host.innerHTML = '';
    host.appendChild(el('table', { class: 'matrix' }, [el('thead', {}, [head]), el('tbody', {}, rows)]));
  }

  function expById(id) { return state.summary.experiments.filter(function (e) { return e.id === id; })[0]; }

  function renderTasks() {
    var exp = expById(document.getElementById('task-exp').value);
    var d = state.data[exp.id];
    var scope = document.getElementById('task-scope').value;
    var filter = scope === 'all' ? null : function (r) { return split(r[1], exp) === scope; };
    document.getElementById('task-scope-wrap').hidden = !exp.hasTrainStarts;
    var tasks = {};
    d.rows.forEach(function (r) {
      if (filter && !filter(r)) return;
      var t = tasks[r[0]] = tasks[r[0]] || {};
      var c = t[r[3]] = t[r[3]] || [0, 0];
      c[0] += r[4]; c[1] += 1;
    });
    var ids = Object.keys(tasks).map(Number).sort(function (a, b) { return a - b; });
    var head = el('tr', {}, [el('th', { text: '任务' })].concat(d.arms.map(function (a) { return el('th', { class: 'num', text: label(a) }); })));
    var body = ids.map(function (t) {
      var cells = d.arms.map(function (a, i) {
        var c = tasks[t][i];
        return el('td', { class: 'num', text: c ? c[0] + ' / ' + c[1] : '—' });
      });
      return el('tr', {}, [el('th', { scope: 'row' }, ['t' + t + ' ', el('span', { class: 'role', text: state.summary.tasks[String(t)] || '' })])].concat(cells));
    });
    var host = document.getElementById('task-table');
    host.innerHTML = '';
    host.appendChild(el('table', {}, [el('thead', {}, [head]), el('tbody', {}, body)]));
  }

  function fillTaskSelect() {
    var exp = expById(document.getElementById('ep-exp').value);
    var d = state.data[exp.id];
    var sel = document.getElementById('ep-task');
    var keep = sel.value;
    var tasks = {};
    d.rows.forEach(function (r) { tasks[r[0]] = 1; });
    sel.innerHTML = '';
    Object.keys(tasks).map(Number).sort(function (a, b) { return a - b; }).forEach(function (t) {
      sel.appendChild(el('option', { value: String(t), text: 't' + t + ' · ' + (state.summary.tasks[String(t)] || '') }));
    });
    if (tasks[keep]) { sel.value = keep; return; }
    var best = null, bestDiff = -1, seen = {};
    d.rows.forEach(function (r) {
      var key = r[0] + '|' + r[1] + '|' + r[2];
      (seen[key] = seen[key] || []).push(r[4]);
    });
    var diffByTask = {};
    Object.keys(seen).forEach(function (k) {
      var v = seen[k], t = k.split('|')[0];
      if (v.some(function (x) { return x !== v[0]; })) diffByTask[t] = (diffByTask[t] || 0) + 1;
    });
    Object.keys(diffByTask).forEach(function (t) { if (diffByTask[t] > bestDiff) { bestDiff = diffByTask[t]; best = t; } });
    if (best) sel.value = best;
  }

  function renderEpisodes() {
    var exp = expById(document.getElementById('ep-exp').value);
    var d = state.data[exp.id];
    var task = Number(document.getElementById('ep-task').value);
    var onlyDiff = document.getElementById('ep-diff').checked;
    var cells = {};
    d.rows.forEach(function (r) {
      if (r[0] !== task) return;
      var key = r[1] + '|' + r[2];
      (cells[key] = cells[key] || {})[r[3]] = r;
    });
    var keys = Object.keys(cells).sort(function (a, b) {
      var x = a.split('|').map(Number), y = b.split('|').map(Number);
      return x[0] - y[0] || x[1] - y[1];
    });
    var shown = 0, differ = 0;
    var head = el('tr', {}, [el('th', { text: '起点' }), el('th', { text: '种子' })].concat(d.arms.map(function (a) { return el('th', { class: 'num', text: label(a) }); })));
    var body = [];
    keys.forEach(function (k) {
      var parts = k.split('|');
      var outcomes = d.arms.map(function (a, i) { return cells[k][i] ? cells[k][i][4] : null; }).filter(function (v) { return v !== null; });
      var isDiff = outcomes.some(function (v) { return v !== outcomes[0]; });
      if (isDiff) differ += 1;
      if (onlyDiff && !isDiff) return;
      shown += 1;
      body.push(el('tr', { class: 'ep-row' + (isDiff ? ' diff' : '') }, [el('td', { text: parts[0] + (exp.hasTrainStarts ? (Number(parts[0]) < 10 ? '（训练）' : '（测试）') : '') }), el('td', { text: parts[1] })].concat(d.arms.map(function (a, i) {
        var r = cells[k][i];
        if (!r) return el('td', { class: 'cell', text: '—' });
        return el('td', { class: 'cell' }, [el('span', { class: r[4] ? 'ok' : 'fail', title: r[5] + ' 步', text: (r[4] ? '成功 ' : '未成 ') + r[5] })]);
      }))));
    });
    document.getElementById('ep-summary').textContent = '任务 t' + task + '：' + keys.length + ' 个“起点 × 种子”，其中 ' + differ + ' 个各组结果不一致；当前显示 ' + shown + ' 行。格子里的数字是执行的控制步数（失败跑满 400 步）。';
    var host = document.getElementById('ep-table');
    host.innerHTML = '';
    host.appendChild(el('table', { class: 'ep' }, [el('thead', {}, [head]), el('tbody', {}, body)]));
  }

  function renderQueue() {
    var host = document.getElementById('queue');
    host.innerHTML = '';
    if (!state.summary.queue.length) { host.appendChild(el('p', { class: 'role', text: '暂无；下一个实验在设计中，规则写定后会列在这里。' })); return; }
    state.summary.queue.forEach(function (q) {
      host.appendChild(el('div', { class: 'queue-item' }, [el('strong', { text: q.name }), el('span', { class: 'state', text: q.state }),
        el('span', { text: q.what }), el('span', { class: 'role', text: '规则写定 ' + q.fixed })]));
    });
  }

  function renderContext() {
    var host = document.getElementById('context');
    host.innerHTML = '';
    var body = state.summary.context.map(function (c) {
      return el('tr', {}, [el('th', { scope: 'row', text: c.name }), el('td', { text: c.policy }), el('td', { text: c.what }), el('td', { text: c.n }), el('td', { text: c.result })]);
    });
    host.appendChild(el('table', {}, [el('thead', {}, [el('tr', {}, ['实验', '策略', '比较', '规模', '结果'].map(function (h) { return el('th', { text: h }); }))]),
      el('tbody', {}, body)]));
  }

  function init() {
    fetch(BASE + 'summary.json').then(function (r) { return r.json(); }).then(function (summary) {
      state.summary = summary;
      return Promise.all(summary.experiments.map(function (e) {
        return fetch(BASE + e.id + '.json').then(function (r) { return r.json(); }).then(function (d) {
          state.data[e.id] = d;
          e.hasTrainStarts = d.rows.some(function (r) { return r[1] < 10; });
        });
      }));
    }).then(function () {
      renderCards(); renderMatrix(); renderQueue(); renderContext();
      ['task-exp', 'ep-exp'].forEach(function (id) {
        var sel = document.getElementById(id);
        state.summary.experiments.forEach(function (e) { sel.appendChild(el('option', { value: e.id, text: e.name + ' · ' + e.title })); });
      });
      document.getElementById('task-exp').addEventListener('change', renderTasks);
      document.getElementById('task-scope').addEventListener('change', renderTasks);
      document.getElementById('ep-exp').addEventListener('change', function () { fillTaskSelect(); renderEpisodes(); });
      document.getElementById('ep-task').addEventListener('change', renderEpisodes);
      document.getElementById('ep-diff').addEventListener('change', renderEpisodes);
      renderTasks(); fillTaskSelect(); renderEpisodes();
    }).catch(function (err) {
      document.querySelectorAll('.loading').forEach(function (n) { n.textContent = '数据加载失败：' + err; });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
