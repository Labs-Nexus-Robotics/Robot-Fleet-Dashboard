/* ============================================================
   Páginas del shell: Flota · Mapa (parte 1)
   Contenido adaptado de los wireframes (screens2.js), sin chrome.
   shell-pages2.js añade Alertas · Historial · Config y el router.
   ============================================================ */
(function () {
  const SPico = (n) => (window.ICON && window.ICON[n]) || '';

  /* ---------- builders compartidos ---------- */
  function spHead(title, sub, right) {
    return `<div class="sp-head"><div style="min-width:0">
      <div class="sp-title">${title}</div>${sub ? `<div class="sp-sub">${sub}</div>` : ''}
    </div><div class="sp-actions">${right || ''}</div></div>`;
  }
  function spPanel(title, sub, right, body, style) {
    return `<div class="panel" style="${style || ''}">
      <div class="panel-head"><span class="panel-title">${title}${sub ? `<span class="sub">${sub}</span>` : ''}</span>${right ? `<span class="right">${right}</span>` : ''}</div>
      <div class="panel-body">${body}</div>
    </div>`;
  }
  function spStat(icon, tone, k, v, unit, sub) {
    return `<div class="scard">
      <div class="scard-top"><div class="scard-ico ${tone || ''}">${SPico(icon)}</div><div class="scard-k">${k}</div></div>
      <div class="scard-v mono">${v}${unit ? `<small> ${unit}</small>` : ''}</div>
      ${sub ? `<div class="scard-sub">${sub}</div>` : ''}
    </div>`;
  }

  /* ---------- estado compartido de páginas ---------- */
  const SP = {
    mapRobot: 'RBT-204',
    layers: { route: true, poi: true, fence: true, zone: false },
    resolved: {},          // alertas atendidas
    histRange: '24h',
  };
  window.SP_STATE = SP;
  window.SP_UI = { spHead, spPanel, spStat };

  /* ============================ FLOTA ============================ */
  const FLEET_SP = [
    ['RBT-204', 'ok',     78, 'Autónomo',  -62, '1.2', 'Ala A · Pasillo 3'],
    ['RBT-118', 'warn',   29, 'Autónomo',  -71, '0.9', 'Ala B · Muelle'],
    ['RBT-330', 'ok',     92, 'Manual',    -55, '0.4', 'Patio Norte'],
    ['RBT-076', 'danger', 12, 'Detenido',  -88, '0.0', 'Ala C · Carga'],
    ['RBT-455', 'ok',     64, 'Autónomo',  -60, '1.4', 'Ala A · Entrada'],
    ['RBT-512', 'ok',     81, 'En espera', -58, '0.0', 'Base 2'],
    ['RBT-289', 'warn',   44, 'Autónomo',  -74, '1.1', 'Ala B · Pasillo 7'],
    ['RBT-601', 'ok',     97, 'Cargando',  -52, '0.0', 'Estación 1'],
  ];
  window.FLEET_SP = FLEET_SP;

  function pgRobots() {
    const toneChip = (t) => t === 'ok' ? `<span class="chip ok"><span class="dot"></span>Operativo</span>`
      : t === 'warn' ? `<span class="chip warn"><span class="dot"></span>Atención</span>`
      : `<span class="chip danger"><span class="dot"></span>Fallo</span>`;
    const batTone = (b) => b < 20 ? 'danger' : b < 35 ? 'warn' : 'ok';
    const rows = FLEET_SP.map((r) => `<tr data-sp-robot="${r[0]}">
      <td class="robot-id">${r[0]}</td>
      <td>${toneChip(r[1])}</td>
      <td><div class="row" style="gap:8px"><div class="meter ${batTone(r[2])}" style="width:54px"><i style="width:${r[2]}%"></i></div><span class="t-xs mono muted">${r[2]}%</span></div></td>
      <td class="t-sm hide-sm">${r[3]}</td>
      <td class="t-sm mono muted hide-md">${r[4]} dBm</td>
      <td class="t-sm mono hide-md">${r[5]} m/s</td>
      <td class="t-sm muted hide-sm">${r[6]}</td>
      <td style="text-align:right;color:var(--ink-faint)">${SPico('chevR')}</td>
    </tr>`).join('');
    return `<div class="sp">
      ${spHead('Flota de robots', '12 robots · 10 operativos · 2 en carga',
        `<div class="wf-search">${SPico('search')}<input placeholder="Buscar robot…" data-sp-fsearch></div>
         <button class="wbtn ghost"><span style="width:16px">${SPico('filter')}</span>Filtrar</button>
         <button class="wbtn primary"><span style="width:16px">${SPico('plus')}</span>Añadir</button>`)}
      <div class="sp-grid-fleet">
        ${spStat('fleet', 'accent', 'Total', '12', '', 'Unidades registradas')}
        ${spStat('bot', 'ok', 'Operativos', '10', '', '83% de la flota')}
        ${spStat('battery', 'warn', 'En carga', '2', '', 'Estación 1 · Base 2')}
        ${spStat('alertTri', 'danger', 'Con fallo', '1', '', 'RBT-076 · detenido')}
      </div>
      ${spPanel('Unidades', '8 visibles', '', `<table class="tbl"><thead><tr>
        <th>ID</th><th>Estado</th><th>Batería</th><th class="hide-sm">Modo</th><th class="hide-md">Señal</th><th class="hide-md">Velocidad</th><th class="hide-sm">Ubicación</th><th></th>
      </tr></thead><tbody data-sp-fleetbody>${rows}</tbody></table>`, 'overflow:hidden; --pb:0').replace('panel-body">', 'panel-body" style="padding:0">')}
    </div>`;
  }

  /* ============================ MAPA ============================ */
  const MAP_BOTS = [
    ['RBT-204', 'ok',   'Ruta R-12', 80, 37],
    ['RBT-118', 'ok',   'Ruta R-13', 34, 62],
    ['RBT-330', 'ok',   'Ruta R-14', 56, 26],
    ['RBT-455', 'warn', 'Ruta R-15', 68, 70],
    ['RBT-289', 'ok',   'Ruta R-16', 22, 30],
  ];

  function mapBig() {
    const L = SP.layers;
    const pins = MAP_BOTS.map((b) => `<div class="map-pin" data-sp-pin="${b[0]}" title="${b[0]}"
      style="left:${b[3]}%;top:${b[4]}%;${b[0] === SP.mapRobot ? '' : 'opacity:.45;scale:.85'}"></div>`).join('');
    return `<div class="mapbox" style="height:460px">
      <div class="geofence" style="left:16%;top:14%;width:64%;height:66%;display:${L.fence ? '' : 'none'}"></div>
      <div style="position:absolute;left:64%;top:64%;width:26%;height:26%;border:1.5px dashed var(--danger);background:color-mix(in srgb,var(--danger) 6%,transparent);border-radius:14px;display:${L.zone ? '' : 'none'}"></div>
      <svg class="map-route" viewBox="0 0 800 460" preserveAspectRatio="none" style="display:${L.route ? '' : 'none'}">
        <path d="M120 380 C 230 300, 300 330, 420 230 S 600 120, 660 165" fill="none" stroke="var(--accent)" stroke-width="3" stroke-dasharray="2 8" stroke-linecap="round" opacity="0.75"/>
      </svg>
      <span style="display:${L.poi ? '' : 'none'}">
        <div class="map-poi" style="left:30%;top:42%"></div>
        <div class="map-poi" style="left:55%;top:30%"></div>
        <div class="map-poi" style="left:73%;top:58%"></div>
      </span>
      ${pins}
      <div class="map-controls"><button>+</button><button>−</button></div>
      <div class="map-scale">200 m</div>
    </div>`;
  }

  function pgMap() {
    const robotList = MAP_BOTS.map((b) => `<div class="lrow ${b[0] === SP.mapRobot ? 'sel' : ''}" style="padding:10px 12px" data-sp-mbot="${b[0]}">
      <span style="width:9px;height:9px;border-radius:50%;background:var(--${b[1]});flex-shrink:0"></span>
      <div style="flex:1;min-width:0"><div class="b6 t-sm robot-id">${b[0]}</div><div class="t-xs faint">${b[2]}</div></div>
      ${b[0] === SP.mapRobot ? `<span class="chip accent t-xs">Activo</span>` : ''}
    </div>`).join('');
    const LAYERS = [
      ['route', 'route',  'Ruta recorrida'],
      ['poi',   'pin',    'Puntos de interés'],
      ['fence', 'shield', 'Geocercas'],
      ['zone',  'layers', 'Zonas restringidas'],
    ];
    const layers = LAYERS.map((l) => `<div class="lrow" style="padding:9px 4px;border:none" data-sp-layer="${l[0]}">
      <div class="scard-ico" style="width:26px;height:26px">${SPico(l[1])}</div>
      <div style="flex:1" class="t-sm b6">${l[2]}</div>
      <div class="tgl ${SP.layers[l[0]] ? 'on' : ''}"></div></div>`).join('');
    return `<div class="sp">
      ${spHead('Mapa · GPS', 'Posición en vivo, rutas y geocercas',
        `<button class="wbtn ghost"><span style="width:16px">${SPico('layers')}</span>Capas</button>
         <button class="wbtn ghost"><span style="width:16px">${SPico('route')}</span>Ruta</button>`)}
      <div class="sp-grid-map">
        <div style="display:flex;flex-direction:column;gap:14px;min-width:0">
          ${spPanel('Robots en mapa', '5', '', robotList).replace('panel-body">', 'panel-body" style="padding:0">')}
          ${spPanel('Capas', '', '', layers)}
        </div>
        <span data-sp-maphost>${spPanel('Mapa interactivo', '',
          `<span class="chip"><span class="dot" style="background:var(--accent)"></span>${SP.mapRobot}</span><span class="chip">3 POIs</span>`,
          mapBig(), '').replace('panel-body">', 'panel-body" style="padding:12px">')}</span>
      </div>
    </div>`;
  }

  window.SP_PAGES = { robots: pgRobots, map: pgMap };
  window.SP_MAP = { refresh: (host) => { const el = host.querySelector('[data-sp-maphost]'); if (el) el.innerHTML = spPanel('Mapa interactivo', '', `<span class="chip"><span class="dot" style="background:var(--accent)"></span>${SP.mapRobot}</span><span class="chip">3 POIs</span>`, mapBig(), '').replace('panel-body">', 'panel-body" style="padding:12px">'); } };
})();
