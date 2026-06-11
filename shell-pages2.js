/* ============================================================
   Páginas del shell (parte 2): Alertas · Historial · Config
   + router/montaje (window.ShellPages)
   ============================================================ */
(function () {
  const SPico = (n) => (window.ICON && window.ICON[n]) || '';
  const { spHead, spPanel, spStat } = window.SP_UI;
  const SP = window.SP_STATE;

  /* ============================ ALERTAS ============================ */
  const ALERTS = [
    ['a1', 'danger', 'alertTri', 'Obstáculo detectado',   'RBT-204 · Sensor S2 · 0.4 m al frente',  '14:02:11', 'Crítica'],
    ['a2', 'danger', 'plug',     'Pérdida de conexión',    'RBT-076 · sin señal 3 min',              '13:47:20', 'Crítica'],
    ['a3', 'warn',   'batLow',   'Batería baja',           'RBT-118 · 29% · regresando a base',      '13:58:40', 'Media'],
    ['a4', 'warn',   'cpu',      'Fallo de sensor',        'RBT-289 · sensor S5 sin respuesta',      '13:30:05', 'Media'],
    ['a5', 'info',   'wifi',     'Red reconectada',        'RBT-204 · señal restaurada',             '13:51:09', 'Info'],
  ];

  function pgAlerts() {
    const pend = ALERTS.filter((a) => a[1] !== 'info' && !SP.resolved[a[0]]);
    const nCrit = pend.filter((a) => a[1] === 'danger').length;
    const nWarn = pend.filter((a) => a[1] === 'warn').length;
    const nRes = 18 + Object.keys(SP.resolved).length;
    const item = (a) => {
      const done = !!SP.resolved[a[0]];
      return `<div class="alert ${a[1]} ${done ? 'resolved' : ''}">
        <div class="alert-ico">${SPico(done ? 'shield' : a[2])}</div>
        <div style="flex:1;min-width:0"><div class="row" style="gap:8px;flex-wrap:wrap"><span class="b6 t-sm">${a[3]}</span>
          <span class="chip ${done ? 'ok' : a[1]} t-xs" style="padding:2px 7px">${done ? 'Resuelta' : a[6]}</span></div>
        <div class="t-xs faint" style="margin-top:2px">${a[4]}</div></div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px">
          <div class="t-xs faint mono">${a[5]}</div>
          ${a[1] !== 'info' && !done ? `<button class="wbtn ghost t-xs" style="padding:4px 9px" data-sp-resolve="${a[0]}">Atender</button>` : ''}
        </div></div>`;
    };
    return `<div class="sp">
      ${spHead('Alertas y eventos', `${nCrit} críticas · ${nWarn} medias · registro en vivo`,
        `<button class="wbtn ghost"><span style="width:16px">${SPico('filter')}</span>Todas</button>
         <button class="wbtn ghost"><span style="width:16px">${SPico('download')}</span>Exportar</button>`)}
      <div class="sp-grid-fleet">
        ${spStat('alertTri', 'danger', 'Críticas', String(nCrit), '', 'Requieren acción')}
        ${spStat('batLow', 'warn', 'Advertencias', String(nWarn), '', 'Monitoreando')}
        ${spStat('shield', 'ok', 'Resueltas hoy', String(nRes), '', 'Último: hace 4 min')}
        ${spStat('clock', 'accent', 'Tiempo medio', '4.2', 'min', 'De atención')}
      </div>
      ${spPanel('Registro en vivo', '', `<span class="live"><span class="dot"></span>En vivo</span>`,
        ALERTS.map(item).join(''), '').replace('panel-body">', 'panel-body" style="padding:0">')}
    </div>`;
  }

  /* ============================ HISTORIAL ============================ */
  const HIST = {
    '24h': { bat: [40, 62, 55, 78, 70, 90, 84, 60, 72, 88, 95, 80], dist: [30, 48, 40, 66, 90, 72, 58, 80, 64, 92, 70, 86], km: '12.4 km', pct: '↑ 78%' },
    '7d':  { bat: [70, 55, 82, 64, 91, 76, 88, 58, 73, 95, 67, 84], dist: [55, 70, 62, 88, 45, 76, 92, 60, 81, 50, 86, 72], km: '84.6 km', pct: '↑ 81%' },
    '30d': { bat: [60, 75, 68, 85, 72, 90, 65, 78, 88, 70, 82, 93], dist: [72, 58, 85, 66, 90, 75, 62, 88, 70, 94, 80, 68], km: '361 km',  pct: '↑ 80%' },
  };
  const spBars = (vals, color) => `<div class="sp-bars">${vals.map((v) => `<i style="height:${v}%;background:${color}"></i>`).join('')}</div>`;

  function pgHistory() {
    const d = HIST[SP.histRange];
    const logRows = [
      ['14:02:11', 'RBT-204', 'Obstáculo evitado',        'danger', 'Evento'],
      ['13:58:40', 'RBT-118', 'Inicio retorno a base',    'warn',   'Aviso'],
      ['13:51:09', 'RBT-204', 'Reconexión de red',        'info',   'Info'],
      ['13:30:05', 'RBT-289', 'Calibración de sensores',  'ok',     'OK'],
      ['13:12:44', 'RBT-330', 'Cambio a modo manual',     'info',   'Info'],
      ['12:55:00', 'RBT-601', 'Carga completada',         'ok',     'OK'],
    ].map((r) => `<tr><td class="t-sm mono faint">${r[0]}</td><td class="robot-id t-sm">${r[1]}</td><td class="t-sm">${r[2]}</td>
      <td><span class="chip ${r[3] === 'info' ? 'accent' : r[3]} t-xs"><span class="dot"></span>${r[4]}</span></td></tr>`).join('');
    const seg = ['24h', '7d', '30d'].map((k) => `<button class="${SP.histRange === k ? 'active' : ''}" data-sp-range="${k}">${k}</button>`).join('');
    return `<div class="sp">
      ${spHead('Historial', 'Eventos, recorridos y telemetría',
        `<div class="seg">${seg}</div>
         <button class="wbtn ghost"><span style="width:16px">${SPico('download')}</span>CSV</button>`)}
      <div class="sp-grid-2">
        ${spPanel(`Batería (${SP.histRange})`, '', `<span class="chip ok">${d.pct}</span>`, spBars(d.bat, 'var(--accent-line)'))}
        ${spPanel('Distancia recorrida', '', `<span class="chip accent">${d.km}</span>`, spBars(d.dist, 'var(--ok)'))}
      </div>
      ${spPanel('Registro de eventos', '', `<button class="wbtn ghost t-xs"><span style="width:14px">${SPico('filter')}</span>Filtrar</button>`,
        `<table class="tbl"><thead><tr><th>Hora</th><th>Robot</th><th>Evento</th><th>Tipo</th></tr></thead><tbody>${logRows}</tbody></table>`,
        'overflow:hidden').replace('panel-body">', 'panel-body" style="padding:0">')}
    </div>`;
  }

  /* ============================ CONFIGURACIÓN ============================ */
  function pgSettings() {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'Oscuro' : 'Claro';
    const field = (k, v) => `<div class="sp-field"><span class="fk">${k}</span><span class="fv">${v}</span></div>`;
    const tgl = (label, sub, on) => `<div class="lrow" data-sp-tgl>
      <div style="flex:1;min-width:0"><div class="b6 t-sm">${label}</div><div class="t-xs faint">${sub}</div></div>
      <div class="tgl ${on ? 'on' : ''}"></div></div>`;
    return `<div class="sp">
      ${spHead('Configuración', 'Sistema, conexión y umbrales',
        `<button class="wbtn ghost">Cancelar</button><button class="wbtn primary" data-sp-save>Guardar</button>`)}
      <div class="sp-grid-2">
        ${spPanel('General', '', '', `<div class="g2" style="margin-bottom:12px">${field('Idioma', 'Español')}${field('Unidades', 'm / m·s⁻¹')}</div>${field('Tema', theme)}`)}
        ${spPanel('Conexión en tiempo real', '', '',
          tgl('Telemetría en vivo', 'WebSocket · 10 Hz', true) +
          tgl('Reconexión automática', 'Reintenta cada 5 s', true) +
          tgl('Modo de bajo ancho de banda', 'Reduce frecuencia', false)).replace('panel-body">', 'panel-body" style="padding:4px 16px">')}
        ${spPanel('Umbrales de alerta', '', '', `<div class="g2" style="margin-bottom:12px">${field('Batería baja', '30 %')}${field('Distancia de peligro', '1.0 m')}</div><div class="g2">${field('Señal mínima', '−80 dBm')}${field('Velocidad máx.', '1.5 m/s')}</div>`)}
        ${spPanel('Geocercas', '', '',
          tgl('Activar geocercas', '3 zonas definidas', true) +
          tgl('Detener al salir', 'Parada de seguridad', true) +
          tgl('Notificar al supervisor', 'Email + push', false)).replace('panel-body">', 'panel-body" style="padding:4px 16px">')}
      </div>
    </div>`;
  }

  /* ============================ router ============================ */
  const PAGES = Object.assign({}, window.SP_PAGES, { alerts: pgAlerts, history: pgHistory, settings: pgSettings });

  let host = null;
  let section = null;

  function toast(msg, icon) {
    let el = document.querySelector('.toast');
    if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); }
    el.innerHTML = `${icon ? SPico(icon) : ''}<span>${msg}</span>`;
    requestAnimationFrame(() => el.classList.add('show'));
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('show'), 2400);
  }

  function render() { if (host && section) host.innerHTML = PAGES[section](); }

  function onClick(e) {
    /* flota: abrir robot en dashboard */
    const fr = e.target.closest('[data-sp-robot]');
    if (fr) {
      const id = fr.dataset.spRobot;
      if (window.Dashboard && window.Dashboard.setRobot) window.Dashboard.setRobot(id);
      else localStorage.setItem('db_robot', id);
      if (window.MC) window.MC.go('dashboard');
      return;
    }
    /* flota: búsqueda no funcional — evitar burbujeo raro */
    if (e.target.closest('[data-sp-fsearch]')) return;

    /* mapa: robot activo */
    const mb = e.target.closest('[data-sp-mbot]');
    if (mb) { SP.mapRobot = mb.dataset.spMbot; render(); return; }
    /* mapa: capas */
    const ly = e.target.closest('[data-sp-layer]');
    if (ly) { const k = ly.dataset.spLayer; SP.layers[k] = !SP.layers[k]; render(); return; }

    /* alertas: atender */
    const rs = e.target.closest('[data-sp-resolve]');
    if (rs) { SP.resolved[rs.dataset.spResolve] = true; render(); toast('Alerta atendida', 'shield'); return; }

    /* historial: rango */
    const rg = e.target.closest('[data-sp-range]');
    if (rg) { SP.histRange = rg.dataset.spRange; render(); return; }

    /* configuración */
    const tg = e.target.closest('[data-sp-tgl]');
    if (tg) { tg.querySelector('.tgl').classList.toggle('on'); return; }
    if (e.target.closest('[data-sp-save]')) { toast('Configuración guardada', 'gear'); return; }
  }

  function mount(h, sec) {
    host = h; section = sec;
    render();
    host.removeEventListener('click', onClick);
    host.addEventListener('click', onClick);
  }
  function unmount() {
    if (host) host.removeEventListener('click', onClick);
    host = null; section = null;
  }

  window.ShellPages = { mount, unmount, has: (s) => !!PAGES[s] };
})();
