// ============================================================
// Fire Damage charts — zero dependencies, inline SVG.
// Data: seeded facts from Supabase seed files (exact values).
// Live: NOAA/NWS alerts (no key). Census / NASA FIRMS / AirNow
// need FREE keys — paste them in site/assets/api-config.js;
// until then the page shows seeded values, never invented ones.
// Pure chart builders return SVG strings (testable in Node).
// ============================================================
(function (global) {
  'use strict';

  // ---------- seeded data (exact values from seed files) ----------
  var DATA = {
    // 20 services, national ranges from supabase/seed_services.sql
    costs: [
      { name: 'Board-Up Services', low: 300, high: 900 },
      { name: 'Roof Tarping', low: 500, high: 1500 },
      { name: 'Fire Water Extraction', low: 1000, high: 3500 },
      { name: 'Property Securing', low: 300, high: 800 },
      { name: 'Soot Removal', low: 1000, high: 4000 },
      { name: 'Wall & Ceiling Cleaning', low: 800, high: 3000 },
      { name: 'HVAC Duct Cleaning', low: 300, high: 700 },
      { name: 'Smoke Residue Removal', low: 1000, high: 3500 },
      { name: 'Thermal Fogging', low: 400, high: 1200 },
      { name: 'Ozone Treatment', low: 300, high: 900 },
      { name: 'Kitchen Fire Odor Removal', low: 500, high: 2000 },
      { name: 'Wildfire Smoke Odor Removal', low: 1000, high: 4000 },
      { name: 'Pack-Out & Storage', low: 1000, high: 5000 },
      { name: 'Electronics Cleaning', low: 200, high: 800 },
      { name: 'Clothing & Textile Cleaning', low: 300, high: 1500 },
      { name: 'Document Restoration', low: 500, high: 2500 },
      { name: 'Kitchen Fire Damage', low: 2000, high: 8000 },
      { name: 'Apartment Fire Damage', low: 1500, high: 6000 },
      { name: 'Commercial Fire Damage', low: 5000, high: 50000 },
      { name: 'Wildfire Damage', low: 5000, high: 30000 }
    ],
    // 18 Texas cities from supabase/seed_texas_cities.sql.
    // pop/spanish/era are 2020-census approximations (seed header says so).
    // risk: 'low' | 'moderate' | 'high' — exact seed values.
    cities: [
      { name: 'Houston', pop: 2304580, risk: 'low', spanish: 45, era: 1978 },
      { name: 'Dallas', pop: 1304379, risk: 'low', spanish: 42, era: 1976 },
      { name: 'Fort Worth', pop: 918915, risk: 'low', spanish: 35, era: 1982 },
      { name: 'San Antonio', pop: 1434625, risk: 'low', spanish: 64, era: 1974 },
      { name: 'Austin', pop: 961855, risk: 'high', spanish: 33, era: 1984 },
      { name: 'El Paso', pop: 678815, risk: 'moderate', spanish: 81, era: 1978 },
      { name: 'Arlington', pop: 394266, risk: 'low', spanish: 30, era: 1980 },
      { name: 'Plano', pop: 288253, risk: 'low', spanish: 17, era: 1990 },
      { name: 'Irving', pop: 256684, risk: 'low', spanish: 41, era: 1982 },
      { name: 'Corpus Christi', pop: 317863, risk: 'moderate', spanish: 62, era: 1976 },
      { name: 'Lubbock', pop: 257141, risk: 'moderate', spanish: 36, era: 1978 },
      { name: 'Amarillo', pop: 200393, risk: 'moderate', spanish: 33, era: 1972 },
      { name: 'Laredo', pop: 255205, risk: 'low', spanish: 95, era: 1980 },
      { name: 'Frisco', pop: 200509, risk: 'low', spanish: 13, era: 2008 },
      { name: 'McKinney', pop: 195308, risk: 'low', spanish: 19, era: 2002 },
      { name: 'Denton', pop: 139869, risk: 'low', spanish: 25, era: 1982 },
      { name: 'Waco', pop: 138486, risk: 'low', spanish: 28, era: 1970 },
      { name: 'Midland', pop: 132524, risk: 'moderate', spanish: 42, era: 1978 }
    ]
  };

  // ---------- helpers ----------
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function money(n) { return '$' + Number(n).toLocaleString('en-US'); }
  function num(n) { return Number(n).toLocaleString('en-US'); }
  function riskScore(r) { return r === 'high' ? 3 : r === 'moderate' ? 2 : 1; }
  function riskLabel(r) { return r === 'high' ? 'High' : r === 'moderate' ? 'Moderate' : 'Low'; }
  function riskColor(r) { return r === 'high' ? '#dc2626' : r === 'moderate' ? '#d97706' : '#16a34a'; }

  // ---------- horizontal range bars: low-high on a $ scale ----------
  // items: [{label, low, high}] — returns an SVG string.
  function rangeBarChart(items, max, title) {
    var W = 640, LABEL = 168, TRACK = 330, ROW = 30, TOP = 8;
    var H = TOP + items.length * ROW + 6;
    var x = function (v) { return LABEL + (v / max) * TRACK; };
    var out = ['<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="' + esc(title) + '" style="display:block">'];
    items.forEach(function (it, i) {
      var y = TOP + i * ROW;
      var x0 = x(it.low), x1 = x(it.high);
      if (x1 - x0 < 3) x1 = x0 + 3; // keep tiny ranges visible
      out.push('<text x="0" y="' + (y + 15) + '" font-size="12" fill="#1a1a1a">' + esc(it.label || it.name) + '</text>');
      out.push('<rect x="' + LABEL + '" y="' + (y + 4) + '" width="' + TRACK + '" height="12" rx="6" fill="#f3f4f6"/>');
      out.push('<rect x="' + x0.toFixed(1) + '" y="' + (y + 4) + '" width="' + (x1 - x0).toFixed(1) + '" height="12" rx="6" fill="#b91c1c"/>');
      out.push('<text x="' + (LABEL + TRACK + 10) + '" y="' + (y + 15) + '" font-size="12" font-weight="700" fill="#1a1a1a">' + money(it.low) + '–' + money(it.high) + '</text>');
    });
    out.push('</svg>');
    return out.join('');
  }

  // ---------- horizontal value bars: one bar per item ----------
  // items: [{label, value, max, color, note}] — returns an SVG string.
  function hBarChart(items, title) {
    var W = 640, LABEL = 118, TRACK = 330, ROW = 30, TOP = 8;
    var H = TOP + items.length * ROW + 6;
    var out = ['<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="' + esc(title) + '" style="display:block">'];
    items.forEach(function (it, i) {
      var y = TOP + i * ROW;
      var w = Math.max(4, (it.value / it.max) * TRACK);
      out.push('<text x="0" y="' + (y + 15) + '" font-size="12" fill="#1a1a1a">' + esc(it.label || it.name) + '</text>');
      out.push('<rect x="' + LABEL + '" y="' + (y + 4) + '" width="' + TRACK + '" height="12" rx="6" fill="#f3f4f6"/>');
      out.push('<rect x="' + LABEL + '" y="' + (y + 4) + '" width="' + w.toFixed(1) + '" height="12" rx="6" fill="' + it.color + '"/>');
      out.push('<text x="' + (LABEL + TRACK + 10) + '" y="' + (y + 15) + '" font-size="12" font-weight="700" fill="#1a1a1a">' + esc(it.note) + '</text>');
    });
    out.push('</svg>');
    return out.join('');
  }

  // ---------- city table (seeded values, labelled as such) ----------
  function cityTable(cities) {
    var rows = cities.map(function (c) {
      return '<tr><td style="padding:8px;border-bottom:1px solid #e5e7eb">' + esc(c.name) + '</td>' +
        '<td style="text-align:right;padding:8px;border-bottom:1px solid #e5e7eb">' + num(c.pop) + '</td>' +
        '<td style="text-align:center;padding:8px;border-bottom:1px solid #e5e7eb"><b style="color:' + riskColor(c.risk) + '">' + riskLabel(c.risk) + '</b></td>' +
        '<td style="text-align:right;padding:8px;border-bottom:1px solid #e5e7eb">' + c.era + '</td>' +
        '<td style="text-align:right;padding:8px;border-bottom:1px solid #e5e7eb">' + c.spanish + '%</td></tr>';
    }).join('');
    return '<table style="width:100%;border-collapse:collapse"><tr><th style="text-align:left;padding:8px;border-bottom:2px solid #b91c1c">City</th><th style="text-align:right;padding:8px;border-bottom:2px solid #b91c1c">Population</th><th style="text-align:center;padding:8px;border-bottom:2px solid #b91c1c">Wildfire risk</th><th style="text-align:right;padding:8px;border-bottom:2px solid #b91c1c">Median home era</th><th style="text-align:right;padding:8px;border-bottom:2px solid #b91c1c">Spanish-speaking</th></tr>' + rows + '</table>';
  }

  // ---------- live fetchers (null on failure or missing key) ----------
  var FIRE_EVENT = /fire|red flag|smoke/i;
  function fetchNWSFireAlerts(state) {
    // NOAA/NWS: free, no key. Returns {total, fire:[{event, areas, headline, ends}]} or null.
    return fetch('https://api.weather.gov/alerts/active?area=' + state + '&status=actual', {
      headers: { 'Accept': 'application/geo+json' }
    }).then(function (r) { return r.json(); }).then(function (j) {
      var feats = (j && j.features) || [];
      var fire = feats.filter(function (f) { return FIRE_EVENT.test(f.properties.event || ''); })
        .map(function (f) {
          return { event: f.properties.event, areas: f.properties.areaDesc || '', headline: f.properties.headline || '', ends: f.properties.ends || f.properties.expires || '' };
        });
      return { total: feats.length, fire: fire };
    }).catch(function () { return null; });
  }
  function fetchCensusPopulations(state, key) {
    // US Census API: FREE key required (api.census.gov/data/key_signup.html).
    // Without a key the API returns a "Missing Key" page — so we don't even call it.
    if (!key) return Promise.resolve(null);
    return fetch('https://api.census.gov/data/2022/acs/acs5?get=NAME,B01003_001E&for=place:*&in=state:' + state + '&key=' + encodeURIComponent(key))
      .then(function (r) { return r.json(); })
      .then(function (rows) {
        if (!Array.isArray(rows)) return null;
        var out = {};
        rows.slice(1).forEach(function (row) { out[row[0].replace(/ city, Texas$/, '')] = Number(row[1]); });
        return out;
      }).catch(function () { return null; });
  }
  function fetchFIRMSCount(state, key) {
    // NASA FIRMS: FREE MAP_KEY required (firms.modaps.eosdis.nasa.gov/api/area/).
    // Texas bbox approx: -106.6,25.8,-93.5,36.5. Counts VIIRS hotspots, last 24h.
    if (!key) return Promise.resolve(null);
    var url = 'https://firms.modaps.eosdis.nasa.gov/api/area/csv/' + encodeURIComponent(key) +
      '/VIIRS_SNPP_NRT/-106.6,25.8,-93.5,36.5/1';
    return fetch(url).then(function (r) { return r.text(); }).then(function (csv) {
      var lines = csv.trim().split('\n');
      return lines.length > 1 ? lines.length - 1 : 0; // minus header
    }).catch(function () { return null; });
  }
  function fetchAirNowHouston(key) {
    // AirNow API: FREE key required (airnowapi.org). Houston ZIP 77002 anchor.
    if (!key) return Promise.resolve(null);
    return fetch('https://www.airnowapi.org/aq/observation/zipCode/current/?format=application/json&zipCode=77002&distance=100&API_KEY=' + encodeURIComponent(key))
      .then(function (r) { return r.json(); })
      .then(function (arr) {
        if (!Array.isArray(arr) || !arr.length) return null;
        var pm = arr.filter(function (o) { return o.ParameterName === 'PM2.5'; })[0] || arr[0];
        return { aqi: pm.AQI, category: pm.Category && pm.Category.Name, param: pm.ParameterName, place: pm.ReportingArea };
      }).catch(function () { return null; });
  }

  // ---------- DOM helpers ----------
  function mount(id, html) {
    if (typeof document === 'undefined') return;
    var el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }
  function keys() {
    return (typeof window !== 'undefined' && window.FD_API_KEYS) || {};
  }

  // ---------- hub page wiring ----------
  function renderCostCharts() {
    var common = DATA.costs.filter(function (c) { return c.high <= 5000; })
      .sort(function (a, b) { return b.high - a.high; });
    var major = DATA.costs.filter(function (c) { return c.high > 5000; })
      .sort(function (a, b) { return b.high - a.high; });
    mount('chart-costs-common', rangeBarChart(common, 5000, 'Most common fire damage jobs, typical cost range'));
    mount('chart-costs-major', rangeBarChart(major, 50000, 'Major fire damage jobs, typical cost range'));
  }
  function renderRiskChart() {
    var sorted = DATA.cities.slice().sort(function (a, b) {
      return riskScore(b.risk) - riskScore(a.risk) || b.pop - a.pop;
    });
    mount('chart-risk', hBarChart(sorted.map(function (c) {
      return { label: c.name, value: riskScore(c.risk), max: 3, color: riskColor(c.risk), note: riskLabel(c.risk) + ' · pop ' + num(c.pop) };
    }), 'Texas city wildfire risk'));
    mount('table-cities', cityTable(sorted));
  }
  function renderLiveNWS(state) {
    mount('live-nws', '<p>Checking live alerts from NOAA…</p>');
    fetchNWSFireAlerts(state).then(function (res) {
      if (!res) { mount('live-nws', '<p><b>Live alerts unavailable right now.</b> Check <a href="https://www.weather.gov/" target="_blank" rel="noopener">weather.gov</a> directly.</p>'); return; }
      if (!res.fire.length) {
        mount('live-nws', '<p><b>No active fire-weather alerts in Texas right now.</b> Checked live from NOAA just now — ' + res.total + ' active weather alert(s) statewide, none fire-related.</p>');
        return;
      }
      var items = res.fire.map(function (a) {
        return '<li><b>' + esc(a.event) + '</b> — ' + esc(a.areas) + (a.ends ? ' <small>(until ' + esc(a.ends) + ')</small>' : '') + '</li>';
      }).join('');
      mount('live-nws', '<p><b>' + res.fire.length + ' active fire-weather alert(s) in Texas</b> (live from NOAA):</p><ul class="steps">' + items + '</ul>');
    });
  }
  function renderKeyPanels() {
    var k = keys();
    // Census: live populations if key present, else seeded table note.
    if (k.CENSUS_KEY) {
      fetchCensusPopulations('48', k.CENSUS_KEY).then(function (pops) {
        mount('census-note', pops
          ? '<p><b>Live Census data connected.</b> Populations below are from the 2022 ACS 5-year survey.</p>'
          : '<p><b>Census key did not return data.</b> Showing seeded 2020-census approximations instead.</p>');
      });
    } else {
      mount('census-note', '<p><small>Populations in the table above are seeded 2020-census approximations. Add a free Census key in <code>site/assets/api-config.js</code> for live values.</small></p>');
    }
    // FIRMS
    if (k.FIRMS_MAP_KEY) {
      fetchFIRMSCount('48', k.FIRMS_MAP_KEY).then(function (n) {
        mount('firms-panel', n === null
          ? '<p><b>FIRMS key did not return data.</b> Try again later or check the key.</p>'
          : '<p><b>' + n + ' active fire detection(s) in Texas in the last 24 hours</b> (NASA FIRMS, VIIRS satellite).</p>');
      });
    } else {
      mount('firms-panel', '<p>Live fire detections need a free NASA FIRMS key — see the box below. Until then, no number is shown here (we do not guess).</p>');
    }
    // AirNow
    if (k.AIRNOW_KEY) {
      fetchAirNowHouston(k.AIRNOW_KEY).then(function (aq) {
        mount('airnow-panel', aq
          ? '<p><b>Houston air now: AQI ' + aq.aqi + ' (' + esc(aq.category) + ')</b> — ' + esc(aq.param) + ', ' + esc(aq.place) + ' (AirNow, live).</p>'
          : '<p><b>AirNow key did not return data.</b> Try again later or check the key.</p>');
      });
    } else {
      mount('airnow-panel', '<p>Live smoke / air-quality data needs a free AirNow key — see the box below. Until then, no number is shown here (we do not guess).</p>');
    }
  }
  function initDataHub(state) {
    renderCostCharts();
    renderRiskChart();
    renderLiveNWS(state || 'TX');
    renderKeyPanels();
  }

  global.FDCharts = {
    DATA: DATA, esc: esc, money: money, num: num,
    riskScore: riskScore, riskLabel: riskLabel, riskColor: riskColor,
    rangeBarChart: rangeBarChart, hBarChart: hBarChart, cityTable: cityTable,
    fetchNWSFireAlerts: fetchNWSFireAlerts, fetchCensusPopulations: fetchCensusPopulations,
    fetchFIRMSCount: fetchFIRMSCount, fetchAirNowHouston: fetchAirNowHouston,
    mount: mount, initDataHub: initDataHub,
    renderCostCharts: renderCostCharts, renderRiskChart: renderRiskChart,
    renderLiveNWS: renderLiveNWS, renderKeyPanels: renderKeyPanels
  };
})(typeof window !== 'undefined' ? window : globalThis);
