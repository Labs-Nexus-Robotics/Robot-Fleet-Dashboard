/* ============================================================
   Dashboard — página "Vista general del robot"
   Depende de: dashboard-widgets.js (window.DBW)
   ============================================================ */
(function () {
  const W = window.DBW;
  const ic = (n) => W.ic(n);
  const $ = (s, r = document) => r.querySelector(s);

  /* ---- estado ---- */
  const DB = {
    robot: localStorage.getItem('db_robot') || 'RBT-204',
    power: localStorage.getItem('db_power') !== 'off',
    mode: localStorage.getItem('db_mode') || 'auto',
    mapMode: 'robot',
    mapLayer: 'tech',
    confirm: false,
  };
  const ROBOT_OPTS = [
    ['RBT-204', 'ok'], ['RBT-118', 'warn'], ['RBT-330', 'ok'], ['RBT-076', 'danger'], ['RBT-455', 'ok'],
  ];
  const LEDC = { ok: 'var(--ok)', warn: 'var(--warn)', danger: 'var(--danger)' };

  /* ---- datos en vivo ---- */
  const N = 42;
  const rnd = (b, a) => b + (Math.random() - 0.5) * a;
  let linData = Array.from({ length: N }, (_, i) => 1.0 + Math.sin(i / 5) * 0.3 + rnd(0, 0.18));
  let angData = Array.from({ length: N }, (_, i) => Math.sin(i / 3.2) * 0.35 + rnd(0, 0.12));
  let nrgData = Array.from({ length: N }, (_, i) => 36 + Math.sin(i / 4) * 9 + rnd(0, 7));
  let latency = 42;
  let timer = null;

  const ALERTS = [
    { sev: 'crit', t: 'Pérdida de señal momentánea', d: 'Reconexión automática tras 3.2 s en pasillo B', time: '14:32', icon: 'wifi' },
    { sev: 'alta', t: 'Obstáculo detectado', d: 'Persona en trayectoria · robot detenido 4 s', time: '14:21', icon: 'alertTri' },
    { sev: 'media', t: 'Batería bajo el 80 %', d: 'Retorno a base estimado en 4 h 20 min', time: '13:58', icon: 'battery' },
    { sev: 'media', t: 'Desvío de ruta', d: 'Recalculada por zona de carga ocupada', time: '13:40', icon: 'map' },
    { sev: 'baja', t: 'Objetivo OBJ-1 completado', d: 'Entrega confirmada en Almacén A', time: '13:12', icon: 'target' },
  ];
  const SEV = {
    crit:  { l: 'Crítica', c: 'var(--danger)', bg: 'var(--danger-soft)' },
    alta:  { l: 'Alta',    c: 'var(--accent)', bg: 'var(--accent-soft)' },
    media: { l: 'Media',   c: 'var(--warn)',   bg: 'var(--warn-soft)' },
    baja:  { l: 'Baja',    c: 'var(--blue)',   bg: 'var(--blue-soft)' },
  };

  /* ============================ render ============================ */

  function kpiCard(icon, tint, bg, label, valueHTML, subHTML, barPct, barColor) {
    return `<div class="db-card kpi">
      <div class="kpi-top">
        <span class="kpi-ico" style="background:${bg};color:${tint}">${ic(icon)}</span>
        <span class="kpi-label">${label}</span>
      </div>
      <div class="kpi-val">${valueHTML}</div>
      <div class="kpi-sub">${subHTML}</div>
      ${barPct != null ? `<div class="kpi-bar"><i style="width:${barPct}%;background:${barColor}"></i></div>` : ''}
    </div>`;
  }

  function kpisHTML() {
    const m = W.DB_MODES[DB.mode];
    const on = DB.power;
    return `
      ${kpiCard('battery', 'var(--ok)', 'var(--ok-soft)', 'Batería',
        `78<small>%</small>`, `${ic('clock')} 4 h 20 min restantes`, 78, 'var(--ok)')}
      ${kpiCard('wifi', 'var(--accent)', 'var(--accent-soft)', 'Conexión',
        on ? 'Online' : 'Offline',
        `Latencia <b id="kpiLat" style="color:var(--ink-soft)">${latency} ms</b>`, null)}
      ${kpiCard('gauge', 'var(--accent)', 'var(--accent-soft)', 'Velocidad',
        `<span id="kpiVel">${on ? linData[N - 1].toFixed(1) : '0.0'}</span><small>m/s</small>`,
        'Límite 1.5 m/s', on ? Math.min(100, linData[N - 1] / 1.5 * 100) : 0, 'var(--accent)')}
      ${kpiCard(m.icon, m.color, 'var(--fill)', 'Modo',
        `<span style="font-size:23px">${on ? m.l : 'Apagado'}</span>`,
        on ? 'Ruta R-12 asignada' : 'Sistema sin energía', null)}
      ${kpiCard('signal', 'var(--warn)', 'var(--warn-soft)', 'Señal',
        `-62<small>dBm</small>`, 'Buena · 4/5', 80, 'var(--warn)')}
    `;
  }

  function mapCardHTML() {
    return `<div class="db-card">
      <div class="card-head">
        <span class="db-card-k">Mapa</span>
        <div class="db-seg" id="mapModeSeg">
          <button data-mapmode="robot" class="${DB.mapMode === 'robot' ? 'on accent' : ''}">Robot</button>
          <button data-mapmode="fleet" class="${DB.mapMode === 'fleet' ? 'on accent' : ''}">Flota</button>
        </div>
        <span class="sp"></span>
        <div class="db-seg" id="mapLayerSeg">
          <button data-maplayer="satellite" class="${DB.mapLayer === 'satellite' ? 'on' : ''}">Satélite</button>
          <button data-maplayer="street" class="${DB.mapLayer === 'street' ? 'on' : ''}">Callejero</button>
          <button data-maplayer="tech" class="${DB.mapLayer === 'tech' ? 'on' : ''}">Técnico</button>
        </div>
      </div>
      <div class="map-stage">
        <span id="mapHost">${W.mapSVG(DB.mapMode, DB.mapLayer)}</span>
        <div class="map-legend" id="mapLegend">${W.mapLegend(DB.mapMode)}</div>
      </div>
    </div>`;
  }

  function controlCardHTML() {
    const on = DB.power;
    const m = W.DB_MODES[DB.mode];
    return `<div class="db-card" id="ctrlCard">
      <div class="card-head">
        <span class="db-card-k">Control</span>
        <span class="sp"></span>
        <span class="pw-state"><span class="dot" style="background:${on ? 'var(--ok)' : 'var(--danger)'}"></span>${on ? 'Sistema operativo' : 'Sistema apagado'}</span>
      </div>
      <div class="ctrl-body">
        <div class="pw-col">
          <button class="pw-btn on" id="btnOn" ${on ? 'disabled' : ''}>${ic('power')}Encender robot</button>
          <button class="pw-btn off" id="btnOff" ${!on ? 'disabled' : ''}>${ic('power')}Apagar robot</button>
        </div>
        <div class="ctrl-knob">
          <div class="knob-wrap2" id="knobHost">${W.knobSVG(DB.mode, !on)}</div>
          <div class="knob-readout">
            <span class="db-card-k" style="font-size:10px">Modo</span>
            <span class="knob-mode-l" id="knobL" style="color:${on ? m.color : 'var(--ink-faint)'}">${on ? m.l : '—'}</span>
            <span class="knob-mode-s" id="knobS">${on ? m.s : 'Knob deshabilitado'}</span>
            <div class="knob-dots" id="knobDots">
              ${Object.keys(W.DB_MODES).map(k => `<span style="${k === DB.mode && on ? `background:${W.DB_MODES[k].color}` : ''}"></span>`).join('')}
            </div>
          </div>
        </div>
      </div>
      <div class="ctrl-foot">
        <button class="ctrl-more" id="btnMore">Más ${ic('arrowR')}</button>
      </div>
      ${DB.confirm ? `
      <div class="ctrl-confirm">
        <span class="cc-t">¿Apagar el robot?</span>
        <span class="cc-s">RBT-204 detendrá su misión actual y cortará la alimentación de los motores.</span>
        <div class="cc-row">
          <button class="cc-btn" id="ccCancel">Cancelar</button>
          <button class="cc-btn danger" id="ccConfirm">Sí, apagar</button>
        </div>
      </div>` : ''}
    </div>`;
  }

  function alertsCardHTML() {
    return `<div class="db-card">
      <div class="card-head">
        <span class="db-card-k">Alertas y eventos</span>
        <span class="sp"></span>
        <span class="pw-state">${ALERTS.length} recientes · 1 crítica</span>
      </div>
      <div class="al-list">
        ${ALERTS.map(a => {
          const s = SEV[a.sev];
          return `<div class="al-row">
            <span class="al-sev" style="color:${s.c};border-color:${s.c};background:${s.bg}">${s.l}</span>
            <div class="al-main">
              <div class="al-t">${ic(a.icon)}${a.t}</div>
              <div class="al-d">${a.d}</div>
            </div>
            <span class="al-time">${a.time}</span>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }

  function chartsCardHTML() {
    return `<div class="db-card">
      <div class="card-head">
        <span class="db-card-k">Gráficos</span>
        <span class="sp"></span>
        <span class="pw-state"><span class="dot" style="background:var(--ok)"></span>Telemetría en vivo</span>
      </div>
      <div class="ch-block">
        <div class="ch-title">Velocidad
          <span class="ch-leg"><span class="sw" style="background:var(--blue)"></span>Lineal (m/s)</span>
          <span class="ch-leg"><span class="sw" style="background:repeating-linear-gradient(90deg,var(--accent) 0 4px,transparent 4px 8px)"></span>Angular (rad/s)</span>
          <span class="ch-now" id="chVelNow"></span>
        </div>
        <span id="chVel">${W.velChart(linData, angData)}</span>
      </div>
      <div class="ch-divider"></div>
      <div class="ch-block">
        <div class="ch-title">Consumo energético
          <span class="ch-leg"><span class="sw" style="background:var(--ok)"></span>Wh</span>
          <span class="ch-now" id="chNrgNow"></span>
        </div>
        <span id="chNrg">${W.energyChart(nrgData)}</span>
      </div>
    </div>`;
  }

  function pageHTML() {
    return `<div class="db">
      <div class="db-head">
        <div class="db-head-t">
          <h1>Vista general del robot</h1>
          <p>Monitoreo en tiempo real · <b style="color:var(--ink-soft)">${DB.robot}</b> seleccionado</p>
        </div>
        <span class="db-head-sp"></span>
        <div class="db-robot-sel" id="robotSel" tabindex="0" role="button" aria-label="Selector de robot">
          ${ic('bot')} ${DB.robot} <span class="chev">${ic('chevDown')}</span>
          <div class="db-robot-menu" id="robotMenu">
            ${ROBOT_OPTS.map(([id, st]) => `
              <button data-robot="${id}" class="${id === DB.robot ? 'sel' : ''}">
                <span class="led" style="background:${LEDC[st]}"></span>${id}
              </button>`).join('')}
          </div>
        </div>
        <button class="db-filter" id="btnFilters">${ic('funnel')}Filtros</button>
      </div>

      <div class="kpi-row" id="kpiRow">${kpisHTML()}</div>

      <div class="db-grid">
        <div class="db-col">
          <span id="mapCard">${mapCardHTML()}</span>
          ${alertsCardHTML()}
        </div>
        <div class="db-col">
          <span id="ctrlHost">${controlCardHTML()}</span>
          ${chartsCardHTML()}
        </div>
      </div>
    </div>`;
  }

  /* ============================ updates ============================ */

  function tick() {
    if (!document.getElementById('chVel')) return;
    if (DB.power) {
      linData.push(Math.max(0, Math.min(1.9, linData[N - 1] + rnd(0, 0.3))));
      angData.push(Math.max(-0.9, Math.min(0.9, angData[N - 1] + rnd(0, 0.22))));
      nrgData.push(Math.max(16, Math.min(58, nrgData[N - 1] + rnd(0, 6))));
    } else {
      linData.push(0); angData.push(0); nrgData.push(Math.max(16, nrgData[N - 1] * 0.9));
    }
    linData.shift(); angData.shift(); nrgData.shift();
    latency = Math.max(18, Math.min(120, Math.round(latency + rnd(0, 14))));

    $('#chVel').innerHTML = W.velChart(linData, angData);
    $('#chNrg').innerHTML = W.energyChart(nrgData);
    $('#chVelNow').textContent = `${linData[N - 1].toFixed(2)} m/s · ${angData[N - 1].toFixed(2)} rad/s`;
    $('#chNrgNow').textContent = `${nrgData[N - 1].toFixed(0)} Wh`;
    const lat = $('#kpiLat'); if (lat) lat.textContent = `${latency} ms`;
    const vel = $('#kpiVel'); if (vel) vel.textContent = DB.power ? linData[N - 1].toFixed(1) : '0.0';
  }

  function refreshMap() {
    $('#mapCard').innerHTML = mapCardHTML();
  }
  function refreshCtrl() {
    $('#ctrlHost').innerHTML = controlCardHTML();
  }
  function refreshKpis() {
    $('#kpiRow').innerHTML = kpisHTML();
  }

  /* ============================ events ============================ */

  function onClick(e) {
    const mm = e.target.closest('[data-mapmode]');
    if (mm) { DB.mapMode = mm.dataset.mapmode; refreshMap(); return; }
    const ml = e.target.closest('[data-maplayer]');
    if (ml) { DB.mapLayer = ml.dataset.maplayer; refreshMap(); return; }

    if (e.target.closest('#btnOn')) {
      DB.power = true; localStorage.setItem('db_power', 'on');
      refreshCtrl(); refreshKpis(); return;
    }
    if (e.target.closest('#btnOff')) { DB.confirm = true; refreshCtrl(); return; }
    if (e.target.closest('#ccCancel')) { DB.confirm = false; refreshCtrl(); return; }
    if (e.target.closest('#ccConfirm')) {
      DB.power = false; DB.confirm = false; localStorage.setItem('db_power', 'off');
      refreshCtrl(); refreshKpis(); return;
    }

    const km = e.target.closest('[data-knob-mode]');
    if (km && DB.power) { setMode(km.dataset.knobMode); return; }
    if (e.target.closest('[data-knob-cycle]') && DB.power) {
      const order = ['auto', 'tele', 'rc'];
      setMode(order[(order.indexOf(DB.mode) + 1) % order.length]);
      return;
    }

    if (e.target.closest('#btnMore')) {
      if (window.MC && window.MC.go) window.MC.go('control');
      return;
    }

    const rs = e.target.closest('#robotSel');
    const rPick = e.target.closest('[data-robot]');
    if (rPick) {
      DB.robot = rPick.dataset.robot; localStorage.setItem('db_robot', DB.robot);
      if (window.MC && window.MC.setRobot) window.MC.setRobot(DB.robot);
      mount(currentHost); return;
    }
    if (rs) { rs.classList.toggle('open'); return; }
    const openSel = $('#robotSel.open'); if (openSel) openSel.classList.remove('open');
  }

  function setMode(k) {
    DB.mode = k; localStorage.setItem('db_mode', k);
    const m = W.DB_MODES[k];
    $('#knobHost').innerHTML = W.knobSVG(k, false);
    $('#knobL').textContent = m.l; $('#knobL').style.color = m.color;
    $('#knobS').textContent = m.s;
    $('#knobDots').innerHTML = Object.keys(W.DB_MODES).map(x =>
      `<span style="${x === k ? `background:${W.DB_MODES[x].color}` : ''}"></span>`).join('');
    refreshKpis();
  }

  /* ============================ mount ============================ */
  let currentHost = null;
  function mount(host) {
    currentHost = host;
    host.innerHTML = pageHTML();
    host.removeEventListener('click', onClick);
    host.addEventListener('click', onClick);
    if (timer) clearInterval(timer);
    timer = setInterval(tick, 1000);
  }
  function unmount() {
    if (timer) { clearInterval(timer); timer = null; }
    currentHost = null;
  }

  function setRobot(id) {
    DB.robot = id; localStorage.setItem('db_robot', id);
    if (window.MC && window.MC.setRobot) window.MC.setRobot(id);
    if (currentHost) mount(currentHost);
  }
  window.Dashboard = { mount, unmount, setRobot };
})();
