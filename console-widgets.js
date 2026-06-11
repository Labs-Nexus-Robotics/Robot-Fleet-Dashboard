/* ============================================================
   Console widgets (SVG + HTML builders)
   Relies on: T() (util.js), ICON/ico() (icons.js+icons2.js)
   ============================================================ */

/* icon helper (icons.js/icons2.js populate window.ICON) */
function ico(name) { return (window.ICON && window.ICON[name]) || ''; }

/* console live state */
const RC = {
  mode: localStorage.getItem('rc_mode') || 'auto',   // auto|tele|rc
  power: localStorage.getItem('rc_power') !== 'off',
  estop: false,
  door: localStorage.getItem('rc_door') || 'closed',  // closed|open|opening|closing
  brakeOn: true, brakePct: 70,
  usView: 'graphic',  // graphic|numeric
  mapMode: 'robot',   // robot|fleet
  mapView: 'tech',    // satellite|street|tech
  lights: { front: false, sigL: false, sigR: true, brake: true },
};

const MODES = {
  auto: { es: 'Autónomo', en: 'Autonomous', color: 'var(--ok)', ang: -52, icon: 'cpu' },
  tele: { es: 'Teleoperado', en: 'Teleoperated', color: 'var(--accent)', ang: 0, icon: 'steer' },
  rc:   { es: 'Mando RC', en: 'RC Control', color: 'var(--blue)', ang: 52, icon: 'antenna' },
};

function kpolar(cx, cy, r, deg) {
  const a = (deg - 90) * Math.PI / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

/* ---------- Rotary mode switch ---------- */
function rotaryKnob() {
  const cx = 66, cy = 66, R = 50;
  const m = MODES[RC.mode];
  // colored arc across the 3 positions
  const [ax, ay] = kpolar(cx, cy, R, -52);
  const [bx, by] = kpolar(cx, cy, R, 52);
  let ticks = '';
  ['auto','tele','rc'].forEach(k => {
    const md = MODES[k];
    const [tx, ty] = kpolar(cx, cy, R, md.ang);
    const on = RC.mode === k;
    ticks += `<circle class="knob-tick" data-mode="${k}" cx="${tx}" cy="${ty}" r="${on?5.5:4}" fill="${on?md.color:'var(--ink-faint)'}" style="cursor:pointer"/>`;
  });
  return `<div class="knob-wrap">
    <svg class="knob-svg" viewBox="0 0 132 132">
      <path d="M${ax} ${ay} A${R} ${R} 0 0 1 ${bx} ${by}" fill="none" stroke="var(--line)" stroke-width="6" stroke-linecap="round"/>
      <circle cx="${cx}" cy="${cy}" r="38" fill="var(--surface-2)" stroke="var(--line)" stroke-width="1.5"/>
      <circle cx="${cx}" cy="${cy}" r="30" fill="var(--surface)" stroke="${m.color}" stroke-width="2.5"/>
      <g class="knob-pointer" style="transform:rotate(${m.ang}deg);transform-origin:${cx}px ${cy}px">
        <rect x="${cx-2.5}" y="${cy-30}" width="5" height="18" rx="2.5" fill="${m.color}"/>
      </g>
      <circle cx="${cx}" cy="${cy}" r="7" fill="${m.color}"/>
      ${ticks}
    </svg>
  </div>`;
}
function rotaryCard() {
  const opts = ['auto','tele','rc'].map(k => {
    const md = MODES[k];
    return `<button class="mode-opt ${RC.mode===k?'sel':''}" data-setmode="${k}" data-mode="${k}">
      <span class="mo-dot" style="background:${md.color}"></span>
      <span class="mo-l">${T(md.es, md.en)}</span>
      <span class="mo-i">${ico(md.icon)}</span>
    </button>`;
  }).join('');
  return `<div class="rotary"><span id="knobHost">${rotaryKnob()}</span><div class="knob-modes">${opts}</div></div>`;
}

/* ---------- Gauges (semicircle) ---------- */
function gauge(value, min, max, unit, label, fmt) {
  const cx = 75, cy = 72, R = 56;
  const frac = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const ang = -90 + frac * 180;
  // zone arc
  const [sx, sy] = kpolar(cx, cy, R, -90);
  const [ex, ey] = kpolar(cx, cy, R, 90);
  const [vx, vy] = kpolar(cx, cy, R, ang);
  const large = frac > 0.5 ? 1 : 0;
  const [nx, ny] = kpolar(cx, cy, R - 6, ang);
  return `<div class="gauge"><svg viewBox="0 0 150 96">
    <path d="M${sx} ${sy} A${R} ${R} 0 0 1 ${ex} ${ey}" fill="none" stroke="var(--fill)" stroke-width="9" stroke-linecap="round"/>
    <path d="M${sx} ${sy} A${R} ${R} 0 ${large} 1 ${vx} ${vy}" fill="none" stroke="var(--accent)" stroke-width="9" stroke-linecap="round"/>
    <line x1="${cx}" y1="${cy}" x2="${nx}" y2="${ny}" stroke="var(--ink)" stroke-width="3" stroke-linecap="round"/>
    <circle cx="${cx}" cy="${cy}" r="5" fill="var(--ink)"/>
  </svg>
  <div class="gauge-v">${fmt ? fmt(value) : value}<small> ${unit}</small></div>
  <div class="gauge-k">${label}</div></div>`;
}
function telemetryGauges() {
  return `<div class="gauges">
    ${gauge(1.2, 0, 2, 'm/s', T('Velocidad lineal','Linear speed'), v=>v.toFixed(1))}
    ${gauge(0.35, -1, 1, 'rad/s', T('Velocidad angular','Angular speed'), v=>v.toFixed(2))}
  </div>`;
}

/* ---------- Battery ---------- */
function batteryWidget() {
  const pct = 78;
  const tone = pct < 20 ? 'var(--danger)' : pct < 35 ? 'var(--warn)' : 'var(--ok)';
  return `<div class="bat-big">
    <div class="bat-shell"><div class="bat-fill" style="width:${pct}%;background:${tone}"></div></div>
    <div class="bat-info"><div class="bi-pct" style="color:${tone}">${pct}<small style="font-size:16px">%</small></div>
    <div class="bi-sub">${T('≈ 4 h 20 min restantes','≈ 4 h 20 min left')}</div>
    <div class="bi-sub" style="margin-top:2px">${T('Descargando · 38 W','Discharging · 38 W')}</div></div>
  </div>`;
}

/* ---------- Lighting controls ---------- */
function lightingControls() {
  const b = (key, icon, label) => {
    const on = RC.lights[key];
    const blink = (key === 'sigL' || key === 'sigR') && on;
    return `<button class="lbtn ${on?'on':''} ${blink?'blink':''}" data-light="${key}">
      ${ico(icon)}<span class="lb-l">${label}</span><span class="lb-s">${on?T('Encendido','On'):T('Apagado','Off')}</span></button>`;
  };
  return `<div class="light-grid">
    ${b('sigL','arrowL', T('Guiñador Izq','Signal L'))}
    ${b('front','lights', T('Luz frontal','Front light'))}
    ${b('sigR','arrowR', T('Guiñador Der','Signal R'))}
  </div>`;
}

/* ---------- Brake ---------- */
function brakeWidget() {
  const on = RC.brakeOn;
  return `<div>
    <div class="brake-row">
      <span class="brake-state"><span class="chip ${on?'danger':''}"><span class="dot"></span>${on?T('Activado','Engaged'):T('Liberado','Released')}</span></span>
      <span style="margin-left:auto" class="t-xs faint">${T('Freno de servicio','Service brake')}</span>
      <button class="wbtn ghost t-xs" data-brake-toggle style="padding:5px 11px">${on?T('Liberar','Release'):T('Aplicar','Apply')}</button>
    </div>
    <div class="row" style="gap:10px">
      <span class="t-xs faint" style="width:60px">${T('Fuerza','Force')}</span>
      <div class="brake-bar"><i style="width:${on?RC.brakePct:0}%"></i></div>
      <span class="brake-pct" style="color:${on?'var(--danger)':'var(--ink-faint)'}">${on?RC.brakePct:0}%</span>
    </div>
  </div>`;
}

/* ---------- Door control ---------- */
const DOOR_LABEL = {
  closed: ['Cerrada','Closed'], open: ['Abierta','Open'],
  opening: ['Abriéndose…','Opening…'], closing: ['Cerrándose…','Closing…'],
};
function doorAngle() { return RC.door === 'open' ? -78 : RC.door === 'opening' ? -78 : RC.door === 'closing' ? 0 : 0; }
function doorWidget() {
  const st = RC.door;
  const lab = DOOR_LABEL[st];
  const isOpenish = st === 'open' || st === 'opening';
  const ang = (st === 'open' || st === 'opening') ? -82 : 0;
  const tone = isOpenish ? 'var(--ok)' : (st === 'closing') ? 'var(--danger)' : 'var(--ink-soft)';
  return `<div class="door-ctrl">
    <svg class="door-anim" viewBox="0 0 84 84">
      <line x1="4" y1="6" x2="4" y2="78" stroke="var(--line-strong)" stroke-width="3" stroke-linecap="round"/>
      <line x1="4" y1="78" x2="74" y2="78" stroke="var(--line)" stroke-width="2" stroke-dasharray="3 4"/>
      <g class="door-leaf" style="transform:rotate(${ang}deg)">
        <rect x="2" y="4" width="58" height="7" rx="3" fill="${tone}"/>
        <circle cx="54" cy="7.5" r="2.4" fill="var(--surface)"/>
      </g>
      <path d="M16 78 A 60 60 0 0 1 34 36" fill="none" stroke="var(--ink-faint)" stroke-width="1.5" stroke-dasharray="2 4" opacity="${isOpenish?0.7:0.25}"/>
    </svg>
    <div class="door-info" style="min-width:120px">
      <div class="door-state-l" id="doorLabel" style="color:${tone}">${T(lab[0],lab[1])}</div>
      <div class="door-state-s">${T('Puerta lateral de carga','Side cargo door')}</div>
      <div class="door-toggle">
        <div class="tgl-lg ${isOpenish?'open':''}" data-door-toggle></div>
        <span class="dt-l">${isOpenish?T('ON · Abrir','ON · Open'):T('OFF · Cerrar','OFF · Close')}</span>
      </div>
    </div>
  </div>`;
}

/* ---------- Top-down robot view ---------- */
const US_SENSORS = [
  { id: 'S1', dir: ['Frontal Izq','Front L'], d: 0.85, cx: 96, cy: 56, dx: -1, dy: -1 },
  { id: 'S2', dir: ['Frontal Der','Front R'], d: 0.30, cx: 184, cy: 56, dx: 1, dy: -1 },
  { id: 'S3', dir: ['Trasera Izq','Rear L'], d: 0.92, cx: 96, cy: 164, dx: -1, dy: 1 },
  { id: 'S4', dir: ['Trasera Der','Rear R'], d: 0.74, cx: 184, cy: 164, dx: 1, dy: 1 },
];
function usZone(d) { return d < 0.34 ? 'var(--danger)' : d < 0.62 ? 'var(--warn)' : 'var(--ok)'; }
function topDownRobot() {
  const L = RC.lights;
  let pulses = '';
  US_SENSORS.forEach((s, i) => {
    const c = usZone(s.d);
    const ang = Math.atan2(s.dy, s.dx) * 180 / Math.PI;
    [0, .66, 1.33].forEach((delay, j) => {
      pulses += `<circle class="us-pulse" cx="${s.cx}" cy="${s.cy}" r="${10 + j*0}" fill="none" stroke="${c}" stroke-width="2.5" style="transform-origin:${s.cx}px ${s.cy}px;animation-delay:${delay}s;transform:translate(${s.dx*8}px,${s.dy*8}px)"/>`;
    });
    pulses += `<circle cx="${s.cx + s.dx*6}" cy="${s.cy + s.dy*6}" r="4" fill="${c}"/>`;
  });
  const door = RC.door === 'open' || RC.door === 'opening';
  const headOn = L.front, sigL = L.sigL, sigR = L.sigR, brake = L.brake;
  return `<div class="topdown"><svg viewBox="0 0 280 220">
    ${pulses}
    <!-- body -->
    <rect x="96" y="46" width="88" height="128" rx="16" fill="var(--surface-2)" stroke="var(--ink-faint)" stroke-width="2"/>
    <rect x="118" y="78" width="44" height="40" rx="6" fill="var(--fill-2)"/>
    <text x="140" y="103" text-anchor="middle" font-size="9" font-weight="700" fill="var(--ink-faint)" font-family="var(--font-ui)">RBT-204</text>
    <!-- front headlight -->
    <rect class="td-light" x="131" y="44" width="18" height="6" rx="3" fill="${headOn?'#fde68a':'var(--fill-2)'}" stroke="${headOn?'var(--accent)':'none'}" stroke-width="${headOn?1.5:0}"/>
    <!-- front turn signals -->
    <circle class="td-light ${sigL?'td-blink':''}" cx="104" cy="52" r="5" fill="${sigL?'var(--accent)':'var(--fill-2)'}"/>
    <circle class="td-light ${sigR?'td-blink':''}" cx="176" cy="52" r="5" fill="${sigR?'var(--accent)':'var(--fill-2)'}"/>
    <!-- rear brake light -->
    <rect class="td-light" x="112" y="168" width="56" height="7" rx="3.5" fill="${brake?'#ef4444':'var(--fill-2)'}"/>
    <!-- door (right side) -->
    <g class="td-door" style="--dorig:184px 70px;transform:rotate(${door?-72:0}deg)">
      <rect x="184" y="68" width="6" height="46" rx="2" fill="${door?'var(--ok)':'var(--ink-faint)'}"/>
    </g>
    <path d="M190 68 A 46 46 0 0 1 226 96" fill="none" stroke="var(--ok)" stroke-width="1.3" stroke-dasharray="2 4" opacity="${door?0.8:0}"/>
    <!-- labels -->
    ${US_SENSORS.map(s=>`<text x="${s.cx + s.dx*16}" y="${s.cy + s.dy*16 + (s.dy<0?-2:8)}" text-anchor="middle" font-size="8" font-weight="700" fill="${usZone(s.d)}" font-family="var(--font-ui)">${Math.round(s.d*300)}</text>`).join('')}
  </svg></div>`;
}

/* ---------- Ultrasonic analytics (radar polar + numeric) ---------- */
function usPolar() {
  const cx = 130, cy = 120, R = 96;
  let rings = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="rgba(77,158,106,0.06)"/>
    <circle cx="${cx}" cy="${cy}" r="${R*0.62}" fill="rgba(201,138,43,0.08)"/>
    <circle cx="${cx}" cy="${cy}" r="${R*0.34}" fill="rgba(194,85,63,0.10)"/>`;
  [0.34,0.62,1].forEach(f=> rings += `<circle cx="${cx}" cy="${cy}" r="${R*f}" fill="none" stroke="var(--line)" stroke-width="1"/>`);
  // 4 sensors at diagonal angles
  const angs = { S1: 135, S2: 45, S3: 225, S4: 315 };
  let blips = '';
  US_SENSORS.forEach(s => {
    const a = angs[s.id];
    const [ex, ey] = kpolar(cx, cy, R, a);
    blips += `<line x1="${cx}" y1="${cy}" x2="${ex}" y2="${ey}" stroke="var(--line)" stroke-width="1" stroke-dasharray="2 4"/>`;
    const [bx, by] = kpolar(cx, cy, R * s.d, a);
    const c = usZone(s.d);
    blips += `<line x1="${cx}" y1="${cy}" x2="${bx}" y2="${by}" stroke="${c}" stroke-width="2.5"/>`;
    blips += `<circle cx="${bx}" cy="${by}" r="6" fill="${c}"/><circle cx="${bx}" cy="${by}" r="11" fill="none" stroke="${c}" stroke-opacity=".4" stroke-width="1.5"/>`;
    blips += `<text x="${kpolar(cx,cy,R+12,a)[0]}" y="${kpolar(cx,cy,R+12,a)[1]+3}" text-anchor="middle" font-size="9" font-weight="700" fill="var(--ink-faint)">${s.id}</text>`;
  });
  return `<div style="display:grid;place-items:center"><svg viewBox="0 0 260 230" style="width:100%;max-width:240px">
    ${rings}${blips}
    <rect x="${cx-9}" y="${cy-9}" width="18" height="18" rx="4" fill="var(--ink)"/>
  </svg></div>`;
}
function usNumeric() {
  return `<div class="us-num">` + US_SENSORS.map(s => {
    const c = usZone(s.d), cm = Math.round(s.d*300);
    return `<div class="us-num-row">
      <span class="n-id">${s.id}</span>
      <span class="n-dir">${T(s.dir[0], s.dir[1])}</span>
      <span class="n-bar"><i style="width:${s.d*100}%;background:${c}"></i></span>
      <span class="n-val" style="color:${c}">${cm} cm</span></div>`;
  }).join('') + `</div>`;
}
function usLegendRow() {
  return `<div class="row" style="gap:10px;flex-wrap:wrap;margin-top:12px">
    <span class="chip ok"><span class="dot"></span>${T('Seguro','Safe')}</span>
    <span class="chip warn"><span class="dot"></span>${T('Precaución','Caution')}</span>
    <span class="chip danger"><span class="dot"></span>${T('Obstáculo','Obstacle')}</span>
  </div>`;
}
