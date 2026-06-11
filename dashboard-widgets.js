/* ============================================================
   Dashboard — widgets (mapa SVG + knob + gráficos en vivo)
   Depende de: window.ICON (icons.js/icons2.js)
   ============================================================ */
(function () {
  const ic = (n) => (window.ICON && window.ICON[n]) || '';

  /* funnel icon (mismo estilo de trazo del set) */
  if (window.ICON && !window.ICON.funnel) {
    window.ICON.funnel = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h18l-7 8v5l-4 2v-7L3 5Z"/></svg>';
  }

  const polar = (cx, cy, r, deg) => {
    const a = (deg - 90) * Math.PI / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };

  /* ---------------- MAPA ---------------- */
  const FLEET_DOTS = [
    { x: 150, y: 110, st: 'ok',     id: 'RBT-204' },
    { x: 320, y: 200, st: 'ok',     id: 'RBT-330' },
    { x: 415, y: 95,  st: 'warn',   id: 'RBT-118' },
    { x: 240, y: 280, st: 'danger', id: 'RBT-076' },
    { x: 500, y: 250, st: 'ok',     id: 'RBT-455' },
  ];
  const ST = { ok: 'var(--ok)', warn: 'var(--warn)', danger: 'var(--danger)' };

  function mapLayerBg(layer) {
    if (layer === 'satellite') {
      return `<rect width="600" height="372" fill="#2d3a2e"/>
        <rect x="40" y="30" width="180" height="120" rx="6" fill="#37463a"/>
        <rect x="260" y="60" width="140" height="90" rx="6" fill="#3a4434"/>
        <rect x="430" y="40" width="130" height="150" rx="6" fill="#33402f"/>
        <rect x="60" y="200" width="220" height="130" rx="6" fill="#364332"/>
        <rect x="330" y="210" width="230" height="120" rx="6" fill="#2f3d33"/>
        <path d="M0 180 H600 M240 0 V372 M410 150 V372" stroke="#465244" stroke-width="14" fill="none"/>
        <path d="M0 180 H600 M240 0 V372 M410 150 V372" stroke="#525e50" stroke-width="1.5" stroke-dasharray="8 8" fill="none"/>`;
    }
    if (layer === 'street') {
      return `<rect width="600" height="372" fill="var(--surface-2)"/>
        ${[60, 180, 300].map(y => `<path d="M0 ${y} H600" stroke="var(--fill-2)" stroke-width="18"/>`).join('')}
        ${[120, 240, 410, 520].map(x => `<path d="M${x} 0 V372" stroke="var(--fill-2)" stroke-width="14"/>`).join('')}
        ${[60, 180, 300].map(y => `<path d="M0 ${y} H600" stroke="var(--line)" stroke-width="1" stroke-dasharray="6 8"/>`).join('')}
        ${[120, 240, 410, 520].map(x => `<path d="M${x} 0 V372" stroke="var(--line)" stroke-width="1" stroke-dasharray="6 8"/>`).join('')}`;
    }
    /* técnico */
    let g = `<rect width="600" height="372" fill="var(--surface-2)"/>`;
    for (let x = 0; x <= 600; x += 30) g += `<line x1="${x}" y1="0" x2="${x}" y2="372" stroke="var(--bg-grid)" stroke-width="1"/>`;
    for (let y = 0; y <= 372; y += 30) g += `<line x1="0" y1="${y}" x2="600" y2="${y}" stroke="var(--bg-grid)" stroke-width="1"/>`;
    g += `<rect x="40" y="40" width="170" height="110" rx="4" fill="none" stroke="var(--line)" stroke-width="1.5"/>
          <rect x="430" y="50" width="120" height="90" rx="4" fill="none" stroke="var(--line)" stroke-width="1.5"/>
          <rect x="70" y="230" width="200" height="100" rx="4" fill="none" stroke="var(--line)" stroke-width="1.5"/>
          <text x="125" y="100" text-anchor="middle" font-size="10" font-weight="600" fill="var(--ink-faint)" font-family="var(--font-ui)">Almacén A</text>
          <text x="490" y="100" text-anchor="middle" font-size="10" font-weight="600" fill="var(--ink-faint)" font-family="var(--font-ui)">Muelle</text>
          <text x="170" y="285" text-anchor="middle" font-size="10" font-weight="600" fill="var(--ink-faint)" font-family="var(--font-ui)">Zona de carga</text>`;
    return g;
  }

  function mapRobotMode(sat) {
    const ink = sat ? '#e8eee6' : 'var(--ink-soft)';
    return `
      <!-- geocerca -->
      <path d="M90 60 L560 60 L560 330 L320 350 L70 310 Z" fill="rgba(249,115,22,0.07)" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="7 6" opacity=".85"/>
      <text x="100" y="80" font-size="9.5" font-weight="700" fill="var(--accent)" font-family="var(--font-ui)" letter-spacing="1">GEOCERCA G-1</text>
      <!-- ruta recorrida -->
      <path d="M120 300 C 180 280, 200 210, 265 195 S 350 160, 390 150" fill="none" stroke="var(--accent)" stroke-width="3.5" stroke-linecap="round"/>
      <!-- ruta planificada -->
      <path d="M390 150 C 430 140, 470 130, 505 105" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-dasharray="2 8" stroke-linecap="round"/>
      <!-- origen -->
      <circle cx="120" cy="300" r="5" fill="none" stroke="${ink}" stroke-width="2"/>
      <text x="132" y="304" font-size="9" font-weight="600" fill="${ink}" font-family="var(--font-ui)">Base</text>
      <!-- objetivos -->
      <g>
        <circle cx="505" cy="105" r="9" fill="none" stroke="var(--ok)" stroke-width="2"/>
        <circle cx="505" cy="105" r="3" fill="var(--ok)"/>
        <text x="505" y="88" text-anchor="middle" font-size="9" font-weight="700" fill="var(--ok)" font-family="var(--font-ui)">OBJ-2</text>
      </g>
      <g>
        <circle cx="265" cy="195" r="7" fill="none" stroke="var(--ok)" stroke-width="2" opacity=".55"/>
        <path d="M262 195 l2.4 2.4 4-4.6" stroke="var(--ok)" stroke-width="2" fill="none" opacity=".8"/>
        <text x="265" y="216" text-anchor="middle" font-size="9" font-weight="700" fill="var(--ok)" opacity=".75" font-family="var(--font-ui)">OBJ-1 ✓</text>
      </g>
      <!-- robot -->
      <g>
        <circle cx="390" cy="150" r="17" fill="var(--accent)" opacity=".18">
          <animate attributeName="r" values="14;24;14" dur="2.4s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values=".26;.05;.26" dur="2.4s" repeatCount="indefinite"/>
        </circle>
        <circle cx="390" cy="150" r="10" fill="var(--accent)" stroke="${sat ? '#fff' : 'var(--surface)'}" stroke-width="2.5"/>
        <path d="M390 144 l4.5 8 -4.5 -2.4 -4.5 2.4 Z" fill="${sat ? '#fff' : 'var(--surface)'}" transform="rotate(64 390 150)"/>
        <text x="390" y="132" text-anchor="middle" font-size="10" font-weight="700" fill="${sat ? '#fff' : 'var(--ink)'}" font-family="var(--font-ui)">RBT-204</text>
      </g>`;
  }

  function mapFleetMode(sat) {
    let out = `
      <path d="M90 60 L560 60 L560 330 L320 350 L70 310 Z" fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="7 6" opacity=".5"/>`;
    FLEET_DOTS.forEach(d => {
      const sel = d.id === 'RBT-204';
      out += `<g>
        ${sel ? `<circle cx="${d.x}" cy="${d.y}" r="16" fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="3 4"/>` : ''}
        <circle cx="${d.x}" cy="${d.y}" r="8" fill="${ST[d.st]}" stroke="${sat ? '#fff' : 'var(--surface)'}" stroke-width="2.5"/>
        <text x="${d.x}" y="${d.y - 14}" text-anchor="middle" font-size="9.5" font-weight="700" fill="${sat ? '#fff' : 'var(--ink)'}" font-family="var(--font-ui)">${d.id}</text>
      </g>`;
    });
    /* agrupación inteligente */
    out += `<g>
      <circle cx="520" cy="300" r="15" fill="var(--ink)" opacity=".85"/>
      <text x="520" y="304" text-anchor="middle" font-size="10.5" font-weight="700" fill="var(--surface)" font-family="var(--font-ui)">×3</text>
      <text x="520" y="328" text-anchor="middle" font-size="9" font-weight="600" fill="${sat ? '#cfd8cc' : 'var(--ink-faint)'}" font-family="var(--font-ui)">En carga</text>
    </g>`;
    return out;
  }

  function mapSVG(mode, layer) {
    const sat = layer === 'satellite';
    return `<svg viewBox="0 0 600 372" preserveAspectRatio="xMidYMid slice">
      ${mapLayerBg(layer)}
      ${mode === 'robot' ? mapRobotMode(sat) : mapFleetMode(sat)}
    </svg>`;
  }

  function mapLegend(mode) {
    if (mode === 'robot') {
      return `
        <span class="map-pill"><span class="sw" style="background:var(--accent)"></span>Ruta recorrida</span>
        <span class="map-pill"><span class="sw" style="background:repeating-linear-gradient(90deg,var(--accent) 0 3px,transparent 3px 6px)"></span>Planificada</span>
        <span class="map-pill"><span class="dotsw" style="background:var(--ok)"></span>Objetivo</span>`;
    }
    return `
      <span class="map-pill"><span class="dotsw" style="background:var(--ok)"></span>Operativo</span>
      <span class="map-pill"><span class="dotsw" style="background:var(--warn)"></span>Atención</span>
      <span class="map-pill"><span class="dotsw" style="background:var(--danger)"></span>Detenido</span>`;
  }

  /* ---------------- KNOB rotatorio ---------------- */
  const DB_MODES = {
    auto: { l: 'Autónomo',    s: 'Navegación por ruta', color: 'var(--ok)',     ang: -52, icon: 'cpu' },
    tele: { l: 'Teleoperado', s: 'Control por operador', color: 'var(--accent)', ang: 0,   icon: 'steer' },
    rc:   { l: 'Mando RC',    s: 'Radiocontrol local',   color: 'var(--blue)',   ang: 52,  icon: 'antenna' },
  };

  function knobSVG(mode, disabled) {
    const cx = 64, cy = 64, R = 48;
    const m = DB_MODES[mode];
    const [ax, ay] = polar(cx, cy, R, -52);
    const [bx, by] = polar(cx, cy, R, 52);
    let ticks = '';
    Object.keys(DB_MODES).forEach(k => {
      const md = DB_MODES[k];
      const [tx, ty] = polar(cx, cy, R, md.ang);
      const on = mode === k;
      ticks += `<circle data-knob-mode="${k}" cx="${tx}" cy="${ty}" r="${on ? 6 : 4.5}" fill="${on ? md.color : 'var(--ink-faint)'}" style="cursor:${disabled ? 'default' : 'pointer'}"/>`;
      const [lx, ly] = polar(cx, cy, R + 13, md.ang);
      ticks += `<text x="${lx}" y="${ly + 3}" text-anchor="middle" font-size="8" font-weight="700" fill="${on ? md.color : 'var(--ink-faint)'}" font-family="var(--font-ui)">${k === 'auto' ? 'AUTO' : k === 'tele' ? 'TELE' : 'RC'}</text>`;
    });
    return `<svg class="knob-svg2" viewBox="0 0 128 128" style="${disabled ? 'opacity:.4' : ''}">
      <path d="M${ax} ${ay} A${R} ${R} 0 0 1 ${bx} ${by}" fill="none" stroke="var(--fill)" stroke-width="6" stroke-linecap="round"/>
      <circle cx="${cx}" cy="${cy}" r="35" fill="var(--surface-2)" stroke="var(--line)" stroke-width="1.5"/>
      <circle data-knob-cycle="1" cx="${cx}" cy="${cy}" r="27" fill="var(--surface)" stroke="${m.color}" stroke-width="2.5" style="cursor:${disabled ? 'default' : 'pointer'}"/>
      <g class="knob-pointer2" style="transform:rotate(${m.ang}deg);transform-origin:${cx}px ${cy}px;pointer-events:none">
        <rect x="${cx - 2.5}" y="${cy - 27}" width="5" height="16" rx="2.5" fill="${m.color}"/>
      </g>
      <circle cx="${cx}" cy="${cy}" r="6" fill="${m.color}" style="pointer-events:none"/>
      ${ticks}
    </svg>`;
  }

  /* ---------------- GRÁFICOS en vivo ---------------- */
  function seriesPath(data, w, h, min, max, close) {
    const n = data.length;
    const pts = data.map((v, i) => {
      const x = (i / (n - 1)) * w;
      const y = h - ((v - min) / (max - min)) * (h - 8) - 4;
      return [x.toFixed(1), y.toFixed(1)];
    });
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < n; i++) d += ` L${pts[i][0]} ${pts[i][1]}`;
    if (close) d += ` L${w} ${h} L0 ${h} Z`;
    return d;
  }

  function chartGrid(w, h) {
    let g = '';
    for (let i = 1; i < 4; i++) {
      const y = (h / 4) * i;
      g += `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="var(--line)" stroke-width="1" stroke-dasharray="2 5" opacity=".6"/>`;
    }
    return g;
  }

  function velChart(lin, ang) {
    const w = 520, h = 110;
    return `<svg class="ch-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="height:110px">
      ${chartGrid(w, h)}
      <path d="${seriesPath(lin, w, h, 0, 2, true)}" fill="var(--blue-soft)"/>
      <path d="${seriesPath(lin, w, h, 0, 2, false)}" fill="none" stroke="var(--blue)" stroke-width="2" stroke-linejoin="round"/>
      <path d="${seriesPath(ang.map(v => v + 1), w, h, 0, 2, false)}" fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-dasharray="4 4" stroke-linejoin="round"/>
    </svg>`;
  }

  function energyChart(data) {
    const w = 520, h = 92;
    return `<svg class="ch-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="height:92px">
      ${chartGrid(w, h)}
      <path d="${seriesPath(data, w, h, 15, 60, true)}" fill="var(--ok-soft)"/>
      <path d="${seriesPath(data, w, h, 15, 60, false)}" fill="none" stroke="var(--ok)" stroke-width="2" stroke-linejoin="round"/>
    </svg>`;
  }

  window.DBW = { ic, mapSVG, mapLegend, knobSVG, velChart, energyChart, DB_MODES };
})();
