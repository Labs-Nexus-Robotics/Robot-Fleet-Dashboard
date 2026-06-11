/* ============================================================
   Página "Control del robot" — módulo para el shell
   Reusa builders globales de console-widgets.js:
   RC, MODES, US_SENSORS, usZone, rotaryCard, rotaryKnob,
   brakeWidget, doorWidget, usPolar, usNumeric, ico()
   ============================================================ */
(function () {
  /* los widgets compartidos usan T(es,en); en el shell forzamos español */
  window.T = function (es) { return es; };

  const q = (s, r) => (r || document).querySelector(s);

  /* guiñadores con tri-estado: false | 'on' | 'blink' (migra legado true) */
  ['sigL', 'sigR'].forEach(k => { if (RC.lights[k] === true) RC.lights[k] = 'blink'; });
  const lightState = (k) => RC.lights[k] || false;

  let host = null;
  let timer = null;

  /* ---------------- builders ---------------- */

  function cardX(icon, title, right, body) {
    return `<div class="card">
      <div class="card-h"><span class="ic">${ico(icon)}</span><span class="card-t">${title}</span>${right ? `<div class="right">${right}</div>` : ''}</div>
      <div class="card-b">${body}</div>
    </div>`;
  }

  function cpHeader() {
    const m = MODES[RC.mode];
    const soft = RC.mode === 'auto' ? 'var(--ok-soft)' : RC.mode === 'tele' ? 'var(--accent-soft)' : 'var(--blue-soft)';
    const kpi = (icon, tone, k, vHTML, vColor, id) => `<div class="card cp-kpi">
      <div class="cp-kpi-top"><span class="stat-ico ${tone}">${ico(icon)}</span><span class="k">${k}</span></div>
      <div class="v" ${id ? `id="${id}"` : ''} style="${vColor ? `color:${vColor}` : ''}">${vHTML}</div>
    </div>`;
    return `<div class="cp-head">
      <div class="card cp-id-card"><div class="idcard">
        <image-slot id="robotPhoto" shape="rounded" radius="12" placeholder="Foto del robot"></image-slot>
        <div style="min-width:0">
          <div class="id-name">RBT-204 · Delivery</div>
          <div class="id-meta">Modelo XR-2 · Ala A · Pasillo 3</div>
          <div class="id-tags">
            <span class="chip ${RC.power ? 'ok' : 'danger'}" id="cpPowChip"><span class="dot"></span>${RC.power ? 'Operativo' : 'Apagado'}</span>
            <span class="chip" id="cpModeChip" style="background:${soft};color:${m.color};border-color:transparent">${ico(m.icon)} ${m.es}</span>
          </div>
        </div>
      </div></div>
      ${kpi('battery', 'ok', 'Batería', `78<small>%</small>`, 'var(--ok)')}
      ${kpi('gauge', 'accent', 'Velocidad', `${RC.power ? '1.2' : '0.0'}<small> m/s</small>`, null, 'cpKpiVel')}
      ${kpi('signal', 'warn', 'Señal', `-62<small> dBm</small>`, 'var(--warn)')}
      ${kpi('mode', '', 'Temp.', `41<small>°C</small>`)}
    </div>`;
  }

  function cpControl() {
    return cardX('joystick', 'Control principal',
      `<span class="pw-state"><span class="dot" style="background:${RC.power ? 'var(--ok)' : 'var(--danger)'}"></span>${RC.power ? 'Sistema operativo' : 'Sistema apagado'}</span>`,
      `<div class="pwr-row">
        <button class="pwr ${RC.power ? 'on-active' : ''}" data-cp-power="on">${ico('power')}<span class="pwr-l">Encender robot</span><span class="pwr-s">${RC.power ? 'Activo' : 'En espera'}</span></button>
        <button class="pwr ${!RC.power ? 'off-active' : ''}" data-cp-power="off">${ico('power')}<span class="pwr-l">Apagar robot</span><span class="pwr-s">${!RC.power ? 'Apagado' : 'Disponible'}</span></button>
      </div>
      <div style="height:14px"></div>${rotaryCard()}`);
  }

  function cpMap() {
    const robotMode = RC.mapMode === 'robot';
    const fleetPins = robotMode ? '' : `
      <div class="map-pin" style="left:34%;top:54%;rotate:45deg"></div>
      <div class="map-pin" style="left:58%;top:30%;rotate:45deg;filter:hue-rotate(40deg)"></div>
      <div class="map-poi" style="left:46%;top:68%"></div>
      <div style="position:absolute;left:72%;top:60%;transform:translate(-50%,-50%);width:34px;height:34px;border-radius:50%;background:var(--accent);color:#fff;display:grid;place-items:center;font-weight:700;font-size:13px;box-shadow:0 4px 12px var(--accent-line)">7</div>`;
    return `<div class="card">
      <div class="card-h">
        <span class="ic">${ico('map')}</span><span class="card-t">Mapa</span>
        <div class="right">
          <div class="map-mode-seg">
            <button class="${robotMode ? 'active' : ''}" data-cp-mapmode="robot">${ico('bot')}Robot</button>
            <button class="${!robotMode ? 'active' : ''}" data-cp-mapmode="fleet">${ico('fleet')}Flota</button>
          </div>
          <div class="map-view-seg">
            <button class="${RC.mapView === 'satellite' ? 'active' : ''}" data-cp-mapview="satellite" title="Satélite">${ico('satellite')}</button>
            <button class="${RC.mapView === 'street' ? 'active' : ''}" data-cp-mapview="street" title="Calle">${ico('road')}</button>
            <button class="${RC.mapView === 'tech' ? 'active' : ''}" data-cp-mapview="tech" title="Técnica">${ico('layers')}</button>
          </div>
        </div>
      </div>
      <div class="card-b" style="padding:12px">
        <div class="mapbox map-full">
          <div class="geofence" style="left:14%;top:16%;width:62%;height:64%"></div>
          <svg class="map-route" viewBox="0 0 800 380" preserveAspectRatio="none">
            <path d="M120 300 C 200 230, 260 250, 340 180 S 520 110, 620 150" fill="none" stroke="var(--accent)" stroke-width="3" stroke-dasharray="2 8" stroke-linecap="round" opacity="0.8"/>
          </svg>
          ${robotMode ? `<div class="map-poi" style="left:42%;top:47%"></div><div class="map-poi" style="left:77%;top:39%"></div>
            <div style="position:absolute;left:77%;top:39%;transform:translate(-50%,-150%)" class="chip accent">${ico('target')}Objetivo</div>` : ''}
          ${fleetPins}
          <div class="map-pin" style="left:${robotMode ? '78' : '34'}%;top:${robotMode ? '39' : '54'}%"></div>
          <div class="map-controls"><button data-cp-zoom="in">+</button><button data-cp-zoom="out">−</button></div>
          <div class="map-scale">200 m · ${({ satellite: 'Satélite', street: 'Calle', tech: 'Técnica' })[RC.mapView]}</div>
        </div>
      </div>
    </div>`;
  }

  function cpCamera() {
    return `<div class="card">
      <div class="card-h"><span class="ic">${ico('camera')}</span><span class="card-t">Cámara en vivo</span>
        <div class="right">
          <span class="chip danger"><span class="dot"></span>REC</span>
          <span class="chip ok"><span class="dot"></span><span id="cpLat">42</span>&nbsp;ms</span>
        </div></div>
      <div class="cam-frame">
        <image-slot id="camFeed" shape="rect" fit="cover" placeholder="Transmisión en vivo · 16:9"></image-slot>
        <div class="cam-tag" style="left:12px;bottom:12px"><span class="cam-chip">${ico('cast')} Frontal · 1080p</span></div>
        <div class="cam-tag" style="right:12px;top:12px"><span class="cam-chip">24 fps</span></div>
      </div>
    </div>`;
  }

  function cpLighting() {
    const btn = (key, icon, label) => {
      const st = lightState(key);
      const lab = st === false ? 'Apagado' : st === 'blink' ? 'Intermitente' : 'Encendido';
      return `<button class="lbtn ${st ? 'on' : ''} ${st === 'blink' ? 'blink' : ''}" data-cp-light="${key}">
        ${ico(icon)}<span class="lb-l">${label}</span><span class="lb-s">${lab}</span></button>`;
    };
    return `<div class="light-grid4">
      ${btn('sigL', 'arrowL', 'Guiñador izquierdo')}
      ${btn('sigR', 'arrowR', 'Guiñador derecho')}
      ${btn('front', 'lights', 'Luz frontal')}
      ${btn('brake', 'brake', 'Luz de freno')}
    </div>`;
  }

  /* vista superior con tri-estado de guiñadores */
  function cpTopDown() {
    const L = RC.lights;
    let pulses = '';
    US_SENSORS.forEach((s) => {
      const c = usZone(s.d);
      [0, .66, 1.33].forEach((delay) => {
        pulses += `<circle class="us-pulse" cx="${s.cx}" cy="${s.cy}" r="10" fill="none" stroke="${c}" stroke-width="2.5" style="transform-origin:${s.cx}px ${s.cy}px;animation-delay:${delay}s;transform:translate(${s.dx * 8}px,${s.dy * 8}px)"/>`;
      });
      pulses += `<circle cx="${s.cx + s.dx * 6}" cy="${s.cy + s.dy * 6}" r="4" fill="${c}" data-td-dot="${s.id}"/>`;
    });
    const door = RC.door === 'open' || RC.door === 'opening';
    const stL = lightState('sigL'), stR = lightState('sigR');
    return `<div class="topdown"><svg viewBox="0 0 280 220">
      ${pulses}
      <rect x="96" y="46" width="88" height="128" rx="16" fill="var(--surface-2)" stroke="var(--ink-faint)" stroke-width="2"/>
      <rect x="118" y="78" width="44" height="40" rx="6" fill="var(--fill-2)"/>
      <text x="140" y="103" text-anchor="middle" font-size="9" font-weight="700" fill="var(--ink-faint)" font-family="var(--font-ui)">RBT-204</text>
      <rect class="td-light" x="131" y="44" width="18" height="6" rx="3" fill="${L.front ? '#fde68a' : 'var(--fill-2)'}" stroke="${L.front ? 'var(--accent)' : 'none'}" stroke-width="${L.front ? 1.5 : 0}"/>
      <circle class="td-light ${stL === 'blink' ? 'td-blink' : ''}" cx="104" cy="52" r="5" fill="${stL ? 'var(--accent)' : 'var(--fill-2)'}"/>
      <circle class="td-light ${stR === 'blink' ? 'td-blink' : ''}" cx="176" cy="52" r="5" fill="${stR ? 'var(--accent)' : 'var(--fill-2)'}"/>
      <rect class="td-light" x="112" y="168" width="56" height="7" rx="3.5" fill="${L.brake ? '#ef4444' : 'var(--fill-2)'}"/>
      <g class="td-door" style="--dorig:184px 70px;transform:rotate(${door ? -72 : 0}deg)">
        <rect x="184" y="68" width="6" height="46" rx="2" fill="${door ? 'var(--ok)' : 'var(--ink-faint)'}"/>
      </g>
      <path d="M190 68 A 46 46 0 0 1 226 96" fill="none" stroke="var(--ok)" stroke-width="1.3" stroke-dasharray="2 4" opacity="${door ? 0.8 : 0}"/>
      ${US_SENSORS.map(s => `<text data-td-label="${s.id}" x="${s.cx + s.dx * 16}" y="${s.cy + s.dy * 16 + (s.dy < 0 ? -2 : 8)}" text-anchor="middle" font-size="8" font-weight="700" fill="${usZone(s.d)}" font-family="var(--font-ui)">${Math.round(s.d * 300)}</text>`).join('')}
    </svg></div>`;
  }

  function cpSensors() {
    const legend = `<div class="cp-us-legend">
      <span class="chip ok"><span class="dot"></span>Seguro</span>
      <span class="chip warn"><span class="dot"></span>Precaución</span>
      <span class="chip danger"><span class="dot"></span>Obstáculo</span>
    </div>`;
    return cardX('radar', 'Sensores ultrasónicos', '',
      `${legend}<span id="cpUsBars">${usNumeric()}</span>
       <div class="us-divider"></div>
       <span id="cpUsRadar">${usPolar()}</span>`);
  }

  function pageHTML() {
    return `<div class="cp">
      ${cpHeader()}
      <div class="cp-grid">
        <div class="cp-col">
          ${cpControl()}
          <span id="cpMapHost">${cpMap()}</span>
          ${cpCamera()}
        </div>
        <div class="cp-col">
          ${cardX('lights', 'Iluminación', '', `<span id="cpLightHost">${cpLighting()}</span>`)}
          ${cardX('brake', 'Sistema de frenado', '', `<span id="cpBrakeHost">${brakeWidget()}</span>`)}
          <div class="cp-duo">
            ${cardX('eye', 'Vista superior', '', `<span id="tdHost">${cpTopDown()}</span>`)}
            ${cardX('door', 'Puerta', '', `<span id="cpDoorHost">${doorWidget()}</span>`)}
          </div>
          ${cpSensors()}
        </div>
      </div>
    </div>`;
  }

  /* ---------------- refresh helpers ---------------- */
  const rf = (id, html) => { const el = host && q('#' + id, host); if (el) el.innerHTML = html; };
  const refreshTd = () => rf('tdHost', cpTopDown());
  const refreshDoor = () => rf('cpDoorHost', doorWidget());

  /* ---------------- confirm + toast ---------------- */
  function confirmDlg(opts) {
    const back = document.createElement('div');
    back.className = 'confirm-back';
    back.innerHTML = `<div class="confirm">
      <div class="confirm-ic" style="background:${opts.soft};color:${opts.color}">${ico(opts.icon)}</div>
      <h3>${opts.title}</h3><p>${opts.body}</p>
      <div class="confirm-actions">
        <button class="wbtn ghost" data-cancel>Cancelar</button>
        <button class="wbtn" style="background:${opts.color};color:#fff;border-color:transparent" data-ok>${opts.ok}</button>
      </div></div>`;
    document.body.appendChild(back);
    requestAnimationFrame(() => back.classList.add('show'));
    const close = () => { back.classList.remove('show'); setTimeout(() => back.remove(), 200); };
    back.addEventListener('click', e => {
      if (e.target === back || e.target.closest('[data-cancel]')) close();
      if (e.target.closest('[data-ok]')) { close(); opts.onOk && opts.onOk(); }
    });
  }
  let toastTimer;
  function toast(msg, icon) {
    let el = document.querySelector('.toast');
    if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); }
    el.innerHTML = `${icon ? ico(icon) : ''}<span>${msg}</span>`;
    requestAnimationFrame(() => el.classList.add('show'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
  }

  /* ---------------- acciones ---------------- */
  function setMode(m) {
    if (m === RC.mode) return;
    RC.mode = m; localStorage.setItem('rc_mode', m);
    rf('knobHost', rotaryKnob());
    host.querySelectorAll('.mode-opt').forEach(o => o.classList.toggle('sel', o.dataset.mode === m));
    const md = MODES[m];
    const chip = q('#cpModeChip', host);
    if (chip) {
      chip.style.background = m === 'auto' ? 'var(--ok-soft)' : m === 'tele' ? 'var(--accent-soft)' : 'var(--blue-soft)';
      chip.style.color = md.color;
      chip.innerHTML = `${ico(md.icon)} ${md.es}`;
    }
    toast('Modo: ' + md.es, md.icon);
  }

  function setPower(on) {
    RC.power = on; localStorage.setItem('rc_power', on ? 'on' : 'off');
    render();
    toast(on ? 'Robot encendido' : 'Robot apagado', 'power');
  }

  function setDoor(open) {
    RC.door = open ? 'opening' : 'closing';
    refreshDoor(); refreshTd();
    setTimeout(() => {
      RC.door = open ? 'open' : 'closed';
      localStorage.setItem('rc_door', RC.door);
      refreshDoor(); refreshTd();
      toast(open ? 'Puerta abierta' : 'Puerta cerrada', 'door');
    }, 1150);
  }

  /* ---------------- eventos ---------------- */
  function onClick(e) {
    const pw = e.target.closest('[data-cp-power]');
    if (pw) {
      const on = pw.dataset.cpPower === 'on';
      if (on === RC.power) return;
      if (on) { setPower(true); return; }
      confirmDlg({
        icon: 'power', color: 'var(--danger)', soft: 'var(--danger-soft)',
        title: 'Apagar robot',
        body: 'RBT-204 detendrá toda operación y cortará la alimentación de los motores. ¿Continuar?',
        ok: 'Sí, apagar', onOk: () => setPower(false),
      });
      return;
    }

    const mo = e.target.closest('[data-setmode]');
    if (mo) { setMode(mo.dataset.setmode); return; }
    const tick = e.target.closest('.knob-tick');
    if (tick && tick.dataset.mode) { setMode(tick.dataset.mode); return; }

    const lt = e.target.closest('[data-cp-light]');
    if (lt) {
      const k = lt.dataset.cpLight;
      const tri = k === 'sigL' || k === 'sigR';
      const st = lightState(k);
      RC.lights[k] = tri ? (st === false ? 'on' : st === 'on' ? 'blink' : false) : (st ? false : 'on');
      rf('cpLightHost', cpLighting());
      refreshTd();
      return;
    }

    if (e.target.closest('[data-brake-toggle]')) {
      RC.brakeOn = !RC.brakeOn;
      rf('cpBrakeHost', brakeWidget());
      toast(RC.brakeOn ? 'Freno aplicado' : 'Freno liberado', 'brake');
      return;
    }

    if (e.target.closest('[data-door-toggle]')) {
      setDoor(!(RC.door === 'open' || RC.door === 'opening'));
      return;
    }

    const mm = e.target.closest('[data-cp-mapmode]');
    if (mm) { RC.mapMode = mm.dataset.cpMapmode; rf('cpMapHost', cpMap()); return; }
    const mv = e.target.closest('[data-cp-mapview]');
    if (mv) { RC.mapView = mv.dataset.cpMapview; rf('cpMapHost', cpMap()); return; }
    if (e.target.closest('[data-cp-zoom]')) { toast('Zoom (demo)', 'map'); return; }
  }

  /* ---------------- telemetría dinámica ---------------- */
  function tick() {
    if (!host || !q('#cpUsBars', host)) return;
    US_SENSORS.forEach(s => {
      s.d = Math.max(0.14, Math.min(0.95, s.d + (Math.random() - 0.5) * 0.10));
    });
    rf('cpUsBars', usNumeric());
    rf('cpUsRadar', usPolar());
    /* vista superior: solo etiquetas y puntos (sin reiniciar pulsos) */
    US_SENSORS.forEach(s => {
      const lab = host.querySelector(`[data-td-label="${s.id}"]`);
      if (lab) { lab.textContent = Math.round(s.d * 300); lab.setAttribute('fill', usZone(s.d)); }
      const dot = host.querySelector(`[data-td-dot="${s.id}"]`);
      if (dot) dot.setAttribute('fill', usZone(s.d));
    });
    const lat = q('#cpLat', host);
    if (lat) lat.textContent = Math.max(18, Math.min(110, Math.round(42 + (Math.random() - 0.5) * 30)));
    const vel = q('#cpKpiVel', host);
    if (vel) vel.innerHTML = `${RC.power ? (1.1 + (Math.random() - 0.5) * 0.4).toFixed(1) : '0.0'}<small> m/s</small>`;
  }

  /* ---------------- mount ---------------- */
  function render() { if (host) host.innerHTML = pageHTML(); }
  function mount(h) {
    host = h;
    render();
    host.removeEventListener('click', onClick);
    host.addEventListener('click', onClick);
    if (timer) clearInterval(timer);
    timer = setInterval(tick, 2200);
  }
  function unmount() {
    if (timer) { clearInterval(timer); timer = null; }
    if (host) host.removeEventListener('click', onClick);
    host = null;
  }

  window.ControlPage = { mount, unmount };
})();
