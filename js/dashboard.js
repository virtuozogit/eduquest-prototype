/* =====================================================================
   dashboard.js — teacher + parent dashboards (data + Chart.js charts)
   ---------------------------------------------------------------------
   Chart instances are stored in the plain `Charts` object below, NOT in
   Alpine state, because Alpine's reactive proxies break Chart.js.
   ===================================================================== */

const Charts = {};

// Create (or re-create) a chart on <canvas id="...">
function drawChart(id, config) {
  const el = document.getElementById(id);
  if (!el || !window.Chart) return;
  if (Charts[id]) Charts[id].destroy();
  Charts[id] = new Chart(el, config);
}

// Shared, quiet chart styling (thin grid, rounded bar ends, readable ticks)
const CHART_INK = '#475569';
const CHART_GRID = '#E2E8F0';
function baseBarOptions(extra = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: '#1E1B4B', padding: 10, cornerRadius: 8 }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: CHART_INK, font: { family: 'Nunito', weight: '700' } } },
      y: { beginAtZero: true, grid: { color: CHART_GRID }, border: { display: false }, ticks: { color: CHART_INK } }
    },
    ...extra
  };
}

/* Value labels: a tiny Chart.js plugin that writes each value ON the chart
   so it can be read at a glance (no extra library).
   Add `plugins: [ValueLabels]` to a chart config, then set options in
   options.plugins.valueLabels:
     format(value, total, index) → text to draw ('' = skip)
     colors: [..]  text color per slice (doughnut only; bars use dark ink)
     minShare: 0.06 → skip doughnut slices smaller than 6%
     center: { big, small } → text in the middle of a doughnut          */
const ValueLabels = {
  id: 'valueLabels',
  afterDatasetsDraw(chart, args, opts) {
    const ds = chart.data.datasets[0];
    const meta = chart.getDatasetMeta(0);
    if (!ds || !meta) return;
    const { ctx } = chart;
    const total = ds.data.reduce((s, v) => s + (Number(v) || 0), 0);
    const isRing = chart.config.type === 'doughnut';
    ctx.save();
    ctx.textAlign = 'center';
    meta.data.forEach((el, i) => {
      const v = ds.data[i];
      if (v == null) return;
      if (isRing && (!total || v / total < (opts.minShare ?? 0.06))) return;
      const text = opts.format ? opts.format(v, total, i) : String(v);
      if (!text) return;
      ctx.font = '800 13px Nunito, sans-serif';
      if (isRing) {
        const p = el.tooltipPosition();
        ctx.fillStyle = (opts.colors && opts.colors[i]) || '#fff';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, p.x, p.y);
      } else {
        ctx.fillStyle = '#1E293B';
        ctx.textBaseline = 'bottom';
        ctx.fillText(text, el.x, el.y - 4);
      }
    });
    if (isRing && opts.center) {
      const a = chart.chartArea;
      const cx = (a.left + a.right) / 2, cy = (a.top + a.bottom) / 2;
      ctx.fillStyle = '#1E293B';
      ctx.textBaseline = 'middle';
      ctx.font = '700 26px Fredoka, Nunito, sans-serif';
      ctx.fillText(opts.center.big, cx, cy - 8);
      ctx.fillStyle = '#64748B';
      ctx.font = '700 12px Nunito, sans-serif';
      ctx.fillText(opts.center.small, cx, cy + 15);
    }
    ctx.restore();
  }
};

// Mastery bands used by the heatmap, roster, and parent view
const MASTERY = {
  band(v) {
    if (v == null) return 'none';
    if (v >= 80) return 'high';
    if (v >= 50) return 'mid';
    return 'low';
  },
  label: { high: 'Mastered', mid: 'Developing', low: 'Needs help', none: 'Not started' }
};

function dashboardMixin() {
  return {
    rosterSort: 'nickname',
    rosterDir: 1,
    masterySubject: 'all',   // subject filter for the "Mastery levels" chart

    allQuests() { return EQ_DATA.subjects.flatMap(s => s.quests.map(q => ({ ...q, subjectId: s.id, subject: s }))); },

    /* ---------------- Teacher: class data ---------------- */

    // Classmates + the demo student ("you"), all in one shape
    classRoster() {
      const me = {
        id: 'me', nickname: this.student.nickname + ' (demo student)', avatar: this.student.avatar, isMe: true,
        mastery: {}, attempts: {},
        improvement: this.myImprovement(),
        minutesThisWeek: Math.round(this.weekMinutes().reduce((s, d) => s + d.minutes, 0)),
        lastActiveDaysAgo: 0
      };
      this.allQuests().forEach(q => {
        const p = this.student.quests[q.id];
        me.mastery[q.id] = p ? p.bestAccuracy : null;
        me.attempts[q.id] = p ? p.attempts : 0;
      });
      return [me, ...EQ_DATA.classmates];
    },

    // Add the computed columns shown in the roster table
    rosterRows() {
      const quests = this.allQuests();
      const rows = this.classRoster().map(st => {
        const tried = quests.filter(q => st.mastery[q.id] != null);
        const weakest = tried.slice().sort((a, b) => st.mastery[a.id] - st.mastery[b.id])[0];
        return {
          ...st,
          completedPct: Math.round((100 * tried.length) / quests.length),
          avgScore: tried.length ? Math.round(Util.avg(tried.map(q => st.mastery[q.id]))) : null,
          weakest: weakest ? { short: weakest.short, score: st.mastery[weakest.id] } : null,
          challenges: Object.values(st.attempts).reduce((s, n) => s + n, 0)
        };
      });
      const key = this.rosterSort, dir = this.rosterDir;
      return rows.sort((a, b) => {
        const va = a[key] ?? -1, vb = b[key] ?? -1;
        return (typeof va === 'string' ? va.localeCompare(vb) : va - vb) * dir;
      });
    },

    sortRoster(key) {
      if (this.rosterSort === key) this.rosterDir *= -1;
      else { this.rosterSort = key; this.rosterDir = key === 'nickname' ? 1 : -1; }
    },

    // Lean Canvas "Key Metrics" for the summary cards
    classStats() {
      const rows = this.rosterRows();
      const scored = rows.filter(r => r.avgScore != null);
      const improvers = rows.filter(r => r.improvement > 0);
      return {
        students: rows.length,
        weeklyActive: rows.filter(r => r.lastActiveDaysAgo <= 7).length,
        avgCompleted: Math.round(Util.avg(rows.map(r => r.completedPct))),
        classAvg: Math.round(Util.avg(scored.map(r => r.avgScore))),
        challengesPerStudent: (rows.reduce((s, r) => s + r.challenges, 0) / rows.length).toFixed(1),
        improvement: Math.round(Util.avg(improvers.map(r => r.improvement)))
      };
    },

    // Average mastery per competency (column averages of the heatmap)
    competencyAverages() {
      const roster = this.classRoster();
      return this.allQuests().map(q => {
        const vals = roster.map(st => st.mastery[q.id]).filter(v => v != null);
        return { ...q, avg: vals.length ? Math.round(Util.avg(vals)) : null, tried: vals.length };
      });
    },

    weakestCompetency() {
      return this.competencyAverages().filter(c => c.avg != null).sort((a, b) => a.avg - b.avg)[0];
    },

    subjectAverages() {
      const comps = this.competencyAverages();
      return EQ_DATA.subjects.map(s => {
        const vals = comps.filter(c => c.subjectId === s.id && c.avg != null).map(c => c.avg);
        return { subject: s, avg: Math.round(Util.avg(vals)) };
      });
    },

    masteryBand(v) { return MASTERY.band(v); },
    masteryLabel(v) { return MASTERY.label[MASTERY.band(v)]; },

    drawTeacherCharts() {
      const subj = this.subjectAverages();
      drawChart('chart-subjects', {
        type: 'bar',
        data: {
          labels: subj.map(s => s.subject.name),
          datasets: [{
            label: 'Class average (%)',
            data: subj.map(s => s.avg),
            backgroundColor: subj.map(s => s.subject.color),
            borderRadius: 4, borderSkipped: 'start', maxBarThickness: 56
          }]
        },
        plugins: [ValueLabels],
        options: baseBarOptions({
          layout: { padding: { top: 22 } },   // room for the % above a full bar
          scales: {
            x: { grid: { display: false }, ticks: { color: CHART_INK, font: { family: 'Nunito', weight: '700' } } },
            y: { min: 0, max: 100, grid: { color: CHART_GRID }, border: { display: false }, ticks: { color: CHART_INK, callback: v => v + '%' } }
          },
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: c => ' Class average: ' + c.raw + '%' } },
            valueLabels: { format: v => v + '%' }
          }
        })
      });

      this.drawMasteryChart();
    },

    // How many QUEST RESULTS fall into each mastery band, for all subjects or
    // just one (masterySubject). One result = one student's best score on one
    // quest, so the totals are bigger than the number of students.
    // Also returns: total results, and how many students have any result.
    masteryCounts() {
      const counts = { high: 0, mid: 0, low: 0, total: 0, students: 0 };
      const quests = this.allQuests().filter(q => this.masterySubject === 'all' || q.subjectId === this.masterySubject);
      this.classRoster().forEach(st => {
        let tried = false;
        quests.forEach(q => {
          const b = MASTERY.band(st.mastery[q.id]);
          if (b !== 'none') { counts[b]++; counts.total++; tried = true; }
        });
        if (tried) counts.students++;
      });
      return counts;
    },

    setMasterySubject(id) {
      this.masterySubject = id;
      this.drawMasteryChart();
    },

    drawMasteryChart() {
      const counts = this.masteryCounts();
      const total = counts.total;
      drawChart('chart-mastery', {
        type: 'doughnut',
        data: {
          labels: ['Mastered (80%+)', 'Developing (50–79%)', 'Needs help (<50%)'],
          datasets: [{ data: [counts.high, counts.mid, counts.low], backgroundColor: ['#16A34A', '#F59E0B', '#E11D48'], borderColor: '#fff', borderWidth: 2 }]
        },
        plugins: [ValueLabels],
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '58%',
          plugins: {
            // The colored breakdown list under the chart (teacher.html) is the legend
            legend: { display: false },
            tooltip: { callbacks: { label: c => ' ' + c.raw + ' results' } },
            // % of results inside each slice (dark text on amber for contrast),
            // and the share that is Mastered in the middle
            valueLabels: {
              format: (v, total) => Math.round((100 * v) / total) + '%',
              colors: ['#FFFFFF', '#3B2A00', '#FFFFFF'],
              center: { big: total ? Math.round((100 * counts.high) / total) + '%' : '–', small: 'mastered' }
            }
          }
        }
      });
    },

    /* ---------------- Parent: child data ---------------- */

    // Minutes per day for the last 7 days (from the screen-time tracker)
    weekMinutes() {
      const days = [];
      for (let i = -6; i <= 0; i++) {
        const key = Util.dayKey(i);
        days.push({ key, label: i === 0 ? 'Today' : Util.weekday(key), minutes: Math.round(((this.student.time || {})[key] || 0) / 60) });
      }
      return days;
    },

    myImprovement() {
      const repeated = Object.values(this.student.quests).filter(p => p.attempts > 1);
      return repeated.length ? Math.round(Util.avg(repeated.map(p => p.bestAccuracy - p.firstAccuracy))) : 0;
    },

    // "Improving" vs "Needs help" per subject for the parent view
    childSubjectStatus() {
      return EQ_DATA.subjects.map(s => {
        const played = s.quests.map(q => ({ q, p: this.student.quests[q.id] })).filter(x => x.p);
        if (!played.length) return { subject: s, status: 'none', label: 'Not started yet', avg: null, tip: 'Try the first quest together: ' + s.quests[0].title + '.' };
        const avg = Math.round(Util.avg(played.map(x => x.p.bestAccuracy)));
        const weakest = played.slice().sort((a, b) => a.p.bestAccuracy - b.p.bestAccuracy)[0];
        const improving = played.some(x => x.p.lastAccuracy > x.p.firstAccuracy);
        if (avg < 60) return { subject: s, status: 'help', label: 'Needs a little help', avg, tip: 'Read the “' + weakest.q.title + '” lesson together, then retry the challenge.' };
        if (improving || avg >= 80) return { subject: s, status: 'up', label: 'Improving', avg, tip: 'Great progress! Celebrate it together. 🎉' };
        return { subject: s, status: 'ok', label: 'On track', avg, tip: 'Keep a steady routine — a short quest a day helps.' };
      });
    },

    drawParentCharts() {
      const days = this.weekMinutes();
      const limit = this.settings.limitMin;
      drawChart('chart-week', {
        type: 'bar',
        data: {
          labels: days.map(d => d.label),
          datasets: [{
            label: 'Minutes learning',
            data: days.map(d => d.minutes),
            backgroundColor: days.map((d, i) => (i === 6 ? '#5B3FD9' : '#A99BF0')),
            borderRadius: 4, borderSkipped: 'start', maxBarThickness: 36
          }]
        },
        plugins: [ValueLabels],
        options: baseBarOptions({
          layout: { padding: { top: 22 } },
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: c => ' ' + c.raw + ' min' + (limit ? ' (limit ' + limit + ' min)' : '') } },
            valueLabels: { format: v => v + 'm' }
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: CHART_INK, font: { family: 'Nunito', weight: '700' } } },
            y: { beginAtZero: true, grid: { color: CHART_GRID }, border: { display: false }, ticks: { color: CHART_INK, callback: v => v + 'm' } }
          }
        })
      });
    }
  };
}
