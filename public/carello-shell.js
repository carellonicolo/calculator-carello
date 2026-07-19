/* ============================================================
   CARELLO SHELL — top bar unificata + launcher a griglia (waffle)
   ------------------------------------------------------------
   FONTE UNICA DELLE APP = il database D1 "prof-carello" del Carello
   Hub, letto tramite la sua Pages Function pubblica POST /api/db.
   Il launcher la interroga a runtime: ogni app che aggiungi/togli/
   riordini dall'Hub compare qui automaticamente. Nessuna lista da
   aggiornare a mano.

   - Icone: stesse icone Lucide scelte nell'Hub (campo icon_name).
   - Link:  campo href.
   - Colore: campo color (stringa hsl(...) salvata dall'Hub).
   - Ordine: campo position.
   - Cache: l'ultima lista valida è in localStorage, così il launcher
     è istantaneo e funziona anche offline; si aggiorna in background.

   USO:
     <carello-shell
        app-name="Quiz CCNA 1"
        app-icon="Network"               // nome icona Lucide
        accent="#1E73E8"
        user="NC"
        data-hub-url="https://nicolocarello.it">  // origine del Hub
     </carello-shell>

   Se data-hub-url è assente, usa la lista statica di fallback.

   ⚠️ CORS: le app girano su sottodomini diversi dall'Hub
   (es. ccna1.nicolocarello.it -> nicolocarello.it), quindi la
   richiesta è cross-origin. La Pages Function /api/db del Hub deve
   rispondere con gli header CORS per *.nicolocarello.it. Vedi la
   patch in HANDOFF.md (Passo 2, sezione CORS). È una piccola
   aggiunta SOLO in lettura, non cambia le scritture (restano admin).
   ============================================================ */
(function () {
  // Fallback statico (solo se manca data-hub-url o la rete non risponde)
  const FALLBACK = [
    { name: 'Hub',             icon_name: 'LayoutDashboard', color: '#E0662B', href: 'https://nicolocarello.it' },
    { name: 'Quiz CCNA 1',     icon_name: 'ListChecks',      color: '#1E73E8', href: 'https://ccna1.nicolocarello.it' },
    { name: 'Verifica VLSM',   icon_name: 'Network',         color: '#0E8FB0', href: 'https://vlsm.nicolocarello.it' },
  ];

  const LS_KEY = 'carello-launcher-cache-v2';
  const ICON_BASE = 'https://unpkg.com/lucide-static@latest/icons/';

  // PascalCase Lucide (es. "FileText") -> kebab per i file SVG ("file-text")
  function kebab(name) {
    return String(name || '')
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
      .replace(/([a-zA-Z])([0-9])/g, '$1-$2')
      .toLowerCase();
  }

  const svgCache = {};
  async function loadIcon(iconName) {
    const key = kebab(iconName);
    if (!key) return null;
    if (svgCache[key] !== undefined) return svgCache[key];
    try {
      const res = await fetch(ICON_BASE + key + '.svg');
      if (!res.ok) throw new Error('404');
      let svg = await res.text();
      // forza colore bianco e dimensione coerente
      svg = svg.replace('<svg', '<svg width="22" height="22" stroke="white"');
      svgCache[key] = svg;
      return svg;
    } catch (e) {
      svgCache[key] = null; // userà le iniziali
      return null;
    }
  }

  function initials(name) {
    const w = String(name || '?').trim().split(/\s+/);
    return ((w[0] || '')[0] || '') + ((w[1] || '')[0] || '');
  }

  // Tema: replica ESATTA della logica dell'app (hook useTheme + bootstrap in
  // index.html). Sorgente di verità = attributo data-theme su <html>, classe
  // .dark e chiave localStorage 'calc_theme'. Così il pulsante tema della
  // shell sostituisce il vecchio ThemeToggle senza toccare la logica React.
  const THEME_KEY = 'calc_theme';
  function readTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }
  function applyTheme(theme) {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.classList.toggle('dark', theme === 'dark');
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
  }

  // Profilo: il nome utente arriva dal cookie companion 'nc_profile' (settato
  // dall'IdP, leggibile da JS perché NON-HttpOnly, solo dati di display). Così
  // l'avatar mostra le iniziali reali su tutte le app, senza alcuna fetch/D1.
  function readProfile() {
    const m = document.cookie.match(/(?:^|;\s*)nc_profile=([^;]+)/);
    if (!m) return null;
    try {
      return JSON.parse(decodeURIComponent(m[1]));
    } catch (e) {
      return null;
    }
  }
  function readProfileName() {
    const obj = readProfile();
    return obj && typeof obj.n === 'string' && obj.n.trim() ? obj.n.trim() : null;
  }
  // URL avatar (campo 'a' del cookie nc_profile). Se assente, la shell usa le iniziali.
  function readProfileAvatar() {
    const obj = readProfile();
    return obj && typeof obj.a === 'string' && obj.a.trim() ? obj.a.trim() : null;
  }

  async function fetchHub(hubUrl) {
    const endpoint = hubUrl.replace(/\/$/, '') + '/api/db';
    // niente credentials: la lettura è pubblica, evita complicazioni CORS
    async function q(spec) {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(spec),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const body = await res.json();
      if (body.error) throw new Error(body.error.message || 'errore api');
      return Array.isArray(body.data) ? body.data : [];
    }
    // Due letture pubbliche: le app (con appartenenza alle cartelle) e le
    // cartelle. Entrambe ordinate per `position`, come nell'Hub, così l'ordine
    // e l'interlacciamento cartelle/app coincidono con la dashboard.
    const [apps, folders] = await Promise.all([
      q({
        table: 'apps',
        action: 'select',
        columns: 'name,icon_name,href,color,position,folder_id,position_in_folder',
        filters: [],
        order: [{ column: 'position', ascending: true }],
      }),
      q({
        table: 'folders',
        action: 'select',
        columns: 'id,name,color,position',
        filters: [],
        order: [{ column: 'position', ascending: true }],
      }),
    ]);
    return { apps, folders };
  }

  class CarelloShell extends HTMLElement {
    async connectedCallback() {
      const appName = this.getAttribute('app-name') || 'App';
      const appIcon = this.getAttribute('app-icon') || 'AppWindow';
      const accent  = this.getAttribute('accent') || '#E0662B';
      const profileName = readProfileName();
      const avatarUrl = readProfileAvatar();
      const user    = (profileName ? (initials(profileName) || '').toUpperCase() : '') || this.getAttribute('user') || 'NC';
      const sbUrl   = this.getAttribute('data-hub-url') || '';
      const authUrl = this.getAttribute('data-auth-url') || '';
      // Voce opzionale del dropdown account verso una pagina dell'app (es. la
      // dashboard personale). Compare solo se l'app la fornisce: le altre app
      // del Hub restano invariate.
      const dashUrl   = this.getAttribute('data-dash-url') || '';
      const dashLabel = this.getAttribute('data-dash-label') || 'Dashboard';
      // Alcune app (es. l'IdP AUTH) non hanno tema chiaro/scuro: nascondi il pulsante.
      const hideTheme = this.hasAttribute('data-hide-theme');

      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = this.template(appName, appIcon, accent, user);

      // Propaga il tema dentro lo Shadow DOM: la classe 'dark-shell' sull'host
      // attiva le variabili scure (lo Shadow DOM isola gli stili, quindi il
      // .dark globale su <html> non raggiungerebbe l'interno della shell).
      const syncShellTheme = () => this.classList.toggle('dark-shell', readTheme() === 'dark');
      syncShellTheme();
      this._syncShellTheme = syncShellTheme;
      // Resta allineata se il tema cambia altrove (altri toggle, bootstrap).
      this._themeObserver = new MutationObserver(syncShellTheme);
      this._themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

      // icona del breadcrumb
      loadIcon(appIcon).then((svg) => {
        const slot = this.shadowRoot.getElementById('crumbIcon');
        if (svg && slot) { slot.innerHTML = svg.replace('stroke="white"', 'stroke="' + accent + '"'); }
      });

      const btn = this.shadowRoot.getElementById('waffle');
      const pop = this.shadowRoot.getElementById('pop');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const willOpen = !pop.classList.contains('open');
        pop.classList.toggle('open');
        // Riapre sempre dal livello principale (cartelle + app top-level).
        if (willOpen) this.renderTop();
      });
      // I click DENTRO il popup non lo devono chiudere (serve per aprire una
      // cartella e usare "indietro"); i link-app navigano comunque via.
      pop.addEventListener('click', (e) => e.stopPropagation());
      document.addEventListener('click', () => pop.classList.remove('open'));
      // Click su una tessera-cartella: entra e mostra le app contenute.
      const gridEl = this.shadowRoot.getElementById('grid');
      gridEl.addEventListener('click', (e) => {
        const folderBtn = e.target.closest('.tile.folder');
        if (folderBtn) {
          e.preventDefault();
          this.renderFolder(folderBtn.getAttribute('data-folder'));
        }
      });
      // Pulsante "indietro": torna al livello principale.
      const backBtn = this.shadowRoot.getElementById('popback');
      if (backBtn) backBtn.addEventListener('click', (e) => { e.stopPropagation(); this.renderTop(); });

      // Avatar: dropdown con Profilo (app AUTH) e Logout (SSO globale).
      // Logout replica esattamente redirectToLogout() dell'app: naviga
      // all'IdP /api/logout con redirect alla home di questa app. Profilo
      // apre la dashboard dell'app AUTH (cookie SSO condiviso).
      const avatarBtn = this.shadowRoot.getElementById('avatarBtn');
      const accMenu = this.shadowRoot.getElementById('accMenu');
      if (avatarBtn && profileName) avatarBtn.title = profileName;
      // Stato avatar (priorità): foto > iniziali (loggato) > sagoma (nessuno loggato).
      // Senza cookie nc_profile NON c'è sessione: mostriamo una sagoma generica,
      // così le iniziali di fallback (es. "NC") non fanno credere di essere loggati.
      const SILHOUETTE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2.2c-4.2 0-7.6 2.2-7.6 5v.8h15.2v-.8c0-2.8-3.4-5-7.6-5z"/></svg>';
      if (avatarBtn && avatarUrl) {
        // Avatar-foto: se il cookie contiene un URL, mostra l'immagine.
        // onerror = ripiega sulle iniziali (es. immagine assente).
        const img = document.createElement('img');
        img.src = avatarUrl;
        img.alt = '';
        img.onerror = () => { avatarBtn.textContent = user; };
        avatarBtn.textContent = '';
        avatarBtn.appendChild(img);
      } else if (avatarBtn && !profileName) {
        avatarBtn.classList.add('avatar-empty');
        avatarBtn.innerHTML = SILHOUETTE;
        avatarBtn.title = 'Nessun utente connesso';
      }
      if (authUrl && avatarBtn && accMenu) {
        const base = authUrl.replace(/\/$/, '');
        const profileLink = this.shadowRoot.getElementById('profileLink');
        const logoutLink = this.shadowRoot.getElementById('logoutLink');
        // Loggato? Lo deduciamo dalla presenza del cookie nc_profile (= profileName).
        // Non loggato: la voce "Profilo" diventa "Login" e punta al login centrale
        // con redirect alla pagina CORRENTE (così dopo l'auth si torna qui, non si
        // resta sulla dashboard dell'IdP); inoltre nascondiamo "Logout" (e la
        // Dashboard app), che non avrebbero senso senza sessione.
        const loggedIn = !!profileName;
        if (profileLink) {
          profileLink.href = loggedIn
            ? base + '/'
            : base + '/login?redirect=' + encodeURIComponent(window.location.href);
        }
        const profileLabelEl = this.shadowRoot.getElementById('profileLabel');
        if (profileLabelEl) profileLabelEl.textContent = loggedIn ? 'Profilo' : 'Login';
        if (logoutLink) {
          logoutLink.href = base + '/api/logout?redirect=' + encodeURIComponent(window.location.origin);
          logoutLink.style.display = loggedIn ? '' : 'none';
        }
        const dashLink = this.shadowRoot.getElementById('dashLink');
        if (dashLink && dashUrl && loggedIn) {
          dashLink.href = dashUrl;
          const dashLabelEl = this.shadowRoot.getElementById('dashLabel');
          if (dashLabelEl) dashLabelEl.textContent = dashLabel;
          dashLink.style.display = '';
        }
        avatarBtn.addEventListener('click', (e) => { e.stopPropagation(); accMenu.classList.toggle('open'); });
        document.addEventListener('click', () => accMenu.classList.remove('open'));
      } else if (avatarBtn) {
        // Senza data-auth-url l'avatar resta decorativo (nessun menu).
        avatarBtn.style.cursor = 'default';
      }

      // Pulsante tema: cambia il tema dell'app (light/dark).
      const themeBtn = this.shadowRoot.getElementById('themeBtn');
      if (themeBtn && hideTheme) {
        themeBtn.remove();
      } else if (themeBtn) {
        // Icona dinamica: in tema chiaro mostra la LUNA (clic → passa a scuro),
        // in tema scuro mostra il SOLE (clic → passa a chiaro). Così l'icona
        // indica sempre la modalità verso cui si commuta.
        const MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/></svg>';
        const SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';
        const syncThemeBtn = () => {
          const dark = readTheme() === 'dark';
          themeBtn.title = dark ? 'Passa al tema chiaro' : 'Passa al tema scuro';
          themeBtn.innerHTML = dark ? SUN : MOON;
        };
        syncThemeBtn();
        themeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          applyTheme(readTheme() === 'dark' ? 'light' : 'dark');
          syncThemeBtn();
          syncShellTheme();
        });
        // Mantiene l'icona allineata anche se il tema cambia da fuori la shell.
        this._themeBtnObserver = new MutationObserver(syncThemeBtn);
        this._themeBtnObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
      }

      // 1) mostra subito la cache (o il fallback statico)
      let cached = null;
      try { cached = JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch (e) {}
      if (cached && Array.isArray(cached.apps) && cached.apps.length) {
        this.setData(cached.apps, cached.folders || []);
      } else {
        this.setData(FALLBACK, []);
      }

      // 2) aggiorna dal Hub (D1) in background: app + cartelle
      if (sbUrl) {
        try {
          const { apps, folders } = await fetchHub(sbUrl);
          if (Array.isArray(apps) && apps.length) {
            localStorage.setItem(LS_KEY, JSON.stringify({ apps, folders: folders || [] }));
            this.setData(apps, folders || []);
          }
        } catch (e) {
          console.warn('[carello-shell] uso cache/fallback:', e.message);
        }
      }
    }

    disconnectedCallback() {
      if (this._themeObserver) this._themeObserver.disconnect();
    }

    // Salva i dati (app + cartelle) e mostra il livello principale.
    setData(apps, folders) {
      this._apps = Array.isArray(apps) ? apps : [];
      this._folders = Array.isArray(folders) ? folders : [];
      this.renderTop();
    }

    // Livello principale: cartelle + app SENZA cartella, interlacciate per la
    // `position` condivisa. È la STESSA logica dell'Hub (serverGridItems in
    // Index.tsx), così l'ordine e la posizione delle cartelle coincidono.
    topLevelItems() {
      const folders = (this._folders || []).map((f) => ({ type: 'folder', data: f, pos: Number(f.position) || 0 }));
      const looseApps = (this._apps || [])
        .filter((a) => !a.folder_id)
        .map((a) => ({ type: 'app', data: a, pos: Number(a.position) || 0 }));
      return [...folders, ...looseApps].sort((a, b) => a.pos - b.pos);
    }

    // App contenute in una cartella, ordinate per `position_in_folder` (come l'Hub).
    appsInFolder(folderId) {
      return (this._apps || [])
        .filter((a) => a.folder_id === folderId)
        .sort((a, b) => (Number(a.position_in_folder) || 0) - (Number(b.position_in_folder) || 0));
    }

    // HTML di una tessera-app (link che naviga all'app).
    appTileHTML(a, idx) {
      return `
        <a class="tile" href="${a.href}" data-i="${idx}">
          <span class="ico" style="background:${a.color || '#E0662B'}">
            <span class="iconslot">${initials(a.name)}</span>
          </span>
          <span class="lbl">${a.name}</span>
        </a>`;
    }

    // Carica in async le icone Lucide delle app renderizzate, sostituendo le iniziali.
    loadTileIcons(grid, apps) {
      apps.forEach((a, idx) => {
        loadIcon(a.icon_name).then((svg) => {
          if (!svg) return;
          const slot = grid.querySelector('.tile[data-i="' + idx + '"] .iconslot');
          if (slot) slot.innerHTML = svg;
        });
      });
    }

    renderTop() {
      const grid = this.shadowRoot.getElementById('grid');
      const badge = this.shadowRoot.getElementById('count');
      const title = this.shadowRoot.getElementById('poptitle');
      const back = this.shadowRoot.getElementById('popback');
      if (!grid) return;
      const items = this.topLevelItems();
      if (title) title.textContent = 'Le mie app';
      if (back) back.style.display = 'none';
      if (badge) badge.textContent = items.length;
      // Le tessere-app hanno bisogno di un indice progressivo (data-i) per il
      // caricamento async delle icone; le cartelle no.
      const apps = [];
      grid.innerHTML = items.map((it) => {
        if (it.type === 'folder') {
          const f = it.data;
          const inner = this.appsInFolder(f.id).slice(0, 4)
            .map((a) => `<i style="background:${a.color || '#E0662B'}"></i>`).join('');
          return `
            <button class="tile folder" data-folder="${f.id}" title="${f.name}">
              <span class="ico folderico" style="background:${f.color || '#1E73E8'}">
                <span class="mini">${inner}</span>
              </span>
              <span class="lbl">${f.name}</span>
            </button>`;
        }
        const idx = apps.length;
        apps.push(it.data);
        return this.appTileHTML(it.data, idx);
      }).join('');
      this.loadTileIcons(grid, apps);
    }

    renderFolder(folderId) {
      const grid = this.shadowRoot.getElementById('grid');
      const badge = this.shadowRoot.getElementById('count');
      const title = this.shadowRoot.getElementById('poptitle');
      const back = this.shadowRoot.getElementById('popback');
      const folder = (this._folders || []).find((f) => f.id === folderId);
      if (!grid || !folder) return;
      const apps = this.appsInFolder(folderId);
      if (title) title.textContent = folder.name;
      if (back) back.style.display = '';
      if (badge) badge.textContent = apps.length;
      grid.innerHTML = apps.map((a, idx) => this.appTileHTML(a, idx)).join('');
      this.loadTileIcons(grid, apps);
    }

    template(appName, appIcon, accent, user) {
      return `
      <style>
        /* Palette: variabili con default chiari; il blocco :host(.dark-shell)
           sotto le ridefinisce per il tema scuro. La classe dark-shell è
           messa/tolta dal JS in sync col tema dell'app (data-theme su <html>).
           Lo Shadow DOM isola gli stili, quindi il .dark globale non basta:
           serve propagare il tema qui dentro con questa classe. */
        :host{
          display:block; font-family:'Lexend',system-ui,sans-serif;
          --c-bar-bg:#fff; --c-bar-bd:#F0E9E0; --c-ink:#23201c; --c-sep:#D9CFC2;
          --c-icon:#8a7f70; --c-hover:#F4EEE6; --c-waffle-bg:#FCE6DA; --c-crumb-hover:#FCE6DA;
          --c-pop-bg:#fff; --c-pop-bd:#F2EBE2; --c-pop-shadow:0 24px 64px rgba(60,40,20,.26);
          --c-menu-shadow:0 18px 48px rgba(60,40,20,.22);
          --c-mitem:#23201c; --c-mitem-hover:#F7F1EA; --c-danger:#c0392b; --c-danger-hover:#fbe7e4;
          --c-badge-bg:#F4EEE6; --c-badge-fg:#9a8f80; --c-tile-hover:#F7F1EA; --c-lbl:#4a443c;
        }
        :host(.dark-shell){
          --c-bar-bg:#211c18; --c-bar-bd:#322a23; --c-ink:#f0e9e0; --c-sep:#5a4f44;
          --c-icon:#b8ab9a; --c-hover:#2c2620; --c-waffle-bg:#3a2a20; --c-crumb-hover:#3a2a20;
          --c-pop-bg:#241f1a; --c-pop-bd:#352d25; --c-pop-shadow:0 24px 64px rgba(0,0,0,.5);
          --c-menu-shadow:0 18px 48px rgba(0,0,0,.5);
          --c-mitem:#ece4da; --c-mitem-hover:#2f2822; --c-danger:#f08a7a; --c-danger-hover:#3a221d;
          --c-badge-bg:#2c2620; --c-badge-fg:#b0a596; --c-tile-hover:#2f2822; --c-lbl:#c5bcb0;
        }
        .bar{ height:60px; background:var(--c-bar-bg); border-bottom:1px solid var(--c-bar-bd);
              display:flex; align-items:center; gap:16px; padding:0 20px; }
        .brand{ display:flex; align-items:center; gap:10px; min-width:0; }
        .logo{ width:34px; height:34px; border-radius:11px; background:linear-gradient(135deg,#ff8a4c,#e0662b);
               display:flex; align-items:center; justify-content:center; box-shadow:0 4px 11px rgba(224,102,43,.38); flex-shrink:0; }
        .name{ font-size:15px; font-weight:700; letter-spacing:-.01em; color:var(--c-ink); white-space:nowrap; }
        .sep{ color:var(--c-sep); }
        .crumb{ display:inline-flex; align-items:center; gap:6px; font-size:13.5px; font-weight:600; white-space:nowrap; color:${accent}; text-decoration:none; cursor:pointer; border-radius:8px; padding:3px 7px; transition:background .15s; }
        .crumb:hover{ background:var(--c-crumb-hover); }
        #crumbIcon{ display:inline-flex; width:18px; height:18px; }
        #crumbIcon svg{ width:18px; height:18px; }
        .spacer{ flex:1; }
        .actions{ display:flex; align-items:center; gap:4px; flex-shrink:0; }
        .icbtn{ width:38px; height:38px; border-radius:999px; display:flex; align-items:center; justify-content:center;
                color:var(--c-icon); background:transparent; border:none; cursor:pointer; }
        .icbtn:hover{ background:var(--c-hover); }
        .icbtn svg{ width:21px; height:21px; }
        .waffle{ color:#E0662B; background:var(--c-waffle-bg); }
        .avatar{ width:34px; height:34px; border-radius:999px; background:linear-gradient(135deg,#ff9a5c,#e0662b);
                 color:#fff; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; margin-left:4px;
                 border:none; cursor:pointer; font-family:inherit; overflow:hidden; padding:0; }
        .avatar img{ width:100%; height:100%; border-radius:999px; object-fit:cover; display:block; }
        .avatar svg{ width:20px; height:20px; }
        /* Nessun utente connesso: slot neutro (no gradiente arancio), sagoma grigia. */
        .avatar.avatar-empty{ background:var(--c-hover); color:var(--c-icon); border:1px solid var(--c-bar-bd); }
        .menu{ position:absolute; top:46px; right:0; width:184px; background:var(--c-pop-bg); border:1px solid var(--c-pop-bd);
               border-radius:14px; box-shadow:var(--c-menu-shadow); padding:6px; z-index:1000;
               opacity:0; transform:translateY(-6px) scale(.98); pointer-events:none; transition:.16s ease; }
        .menu.open{ opacity:1; transform:none; pointer-events:auto; }
        .mitem{ display:flex; align-items:center; gap:9px; padding:9px 11px; border-radius:9px; text-decoration:none;
                color:var(--c-mitem); font-size:13px; font-weight:500; cursor:pointer; }
        .mitem:hover{ background:var(--c-mitem-hover); }
        .mitem svg{ width:16px; height:16px; stroke:currentColor; }
        .mitem.danger{ color:var(--c-danger); }
        .mitem.danger:hover{ background:var(--c-danger-hover); }
        .wrap{ position:relative; }
        .pop{ position:absolute; top:46px; right:0; width:330px; background:var(--c-pop-bg); border:1px solid var(--c-pop-bd);
              border-radius:20px; box-shadow:var(--c-pop-shadow); padding:16px 14px 10px; z-index:1000;
              opacity:0; transform:translateY(-6px) scale(.98); pointer-events:none; transition:.16s ease; max-height:70vh; overflow:auto; }
        .pop.open{ opacity:1; transform:none; pointer-events:auto; }
        .pophead{ display:flex; align-items:center; justify-content:flex-start; gap:8px; padding:0 6px 12px; }
        .pophead b{ font-size:14px; color:var(--c-ink); }
        .popback{ display:flex; align-items:center; justify-content:center; width:26px; height:26px; flex-shrink:0;
                  border:none; background:transparent; color:var(--c-icon); cursor:pointer; border-radius:8px; }
        .popback:hover{ background:var(--c-hover); }
        .popback svg{ width:18px; height:18px; }
        .badge{ margin-left:auto; font-size:11px; color:var(--c-badge-fg); background:var(--c-badge-bg); padding:4px 10px; border-radius:999px; font-weight:600; }
        #grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:4px; }
        .tile{ display:flex; flex-direction:column; align-items:center; gap:7px; padding:9px 3px; border-radius:14px; text-decoration:none; }
        .tile:hover{ background:var(--c-tile-hover); }
        .ico{ width:46px; height:46px; border-radius:14px; display:flex; align-items:center; justify-content:center; }
        .iconslot{ display:flex; align-items:center; justify-content:center; color:#fff; font-size:14px; font-weight:700; }
        .iconslot svg{ width:22px; height:22px; stroke:#fff; }
        .lbl{ font-size:10px; font-weight:600; color:var(--c-lbl); text-align:center; line-height:1.15; }
        /* Tessera-cartella: <button> con lo stesso look delle app; l'icona è
           un mini-mosaico (fino a 4) dei colori delle app contenute. */
        .tile.folder{ background:none; border:none; cursor:pointer; font-family:inherit; padding:9px 3px; }
        .folderico{ padding:8px; box-sizing:border-box; }
        .mini{ display:grid; grid-template-columns:1fr 1fr; grid-auto-rows:1fr; gap:3px; width:100%; height:100%; }
        .mini i{ display:block; border-radius:4px; min-height:0; }
        /* Mobile: la barra non ha spazio per "Prof. Carello / Nome app" + azioni.
           Nascondiamo il nome-brand (resta il logo) e stringiamo le spaziature, così
           logo + nome-app + controlli stanno senza sovrapporsi. Il breadcrumb non
           deborda più (min-width:0 + overflow:hidden). */
        @media (max-width:560px){
          .bar{ gap:8px; padding:0 12px; }
          .name, .sep{ display:none; }
          .brand{ overflow:hidden; }
          .crumb{ min-width:0; overflow:hidden; }
        }
      </style>
      <div class="bar">
        <div class="brand">
          <span class="logo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
          </span>
          <span class="name">Prof. Carello</span>
          <span class="sep">/</span>
          <a class="crumb" href="/" title="Torna alla home"><span id="crumbIcon"></span>${appName}</a>
        </div>
        <div class="spacer"></div>
        <div class="actions">
          <button class="icbtn" id="themeBtn" title="Tema">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/></svg>
          </button>
          <div class="wrap">
            <button class="icbtn waffle" id="waffle" title="Le mie app">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
            </button>
            <div class="pop" id="pop">
              <div class="pophead">
                <button class="popback" id="popback" title="Indietro" aria-label="Indietro" style="display:none">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                <b id="poptitle">Le mie app</b>
                <span class="badge" id="count">—</span>
              </div>
              <div id="grid"></div>
            </div>
          </div>
          <div class="wrap">
            <button class="avatar" id="avatarBtn" title="Account">${user}</button>
            <div class="menu" id="accMenu">
              <a class="mitem" id="dashLink" href="#" target="_top" style="display:none">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
                <span id="dashLabel">Dashboard</span>
              </a>
              <a class="mitem" id="profileLink" href="#" target="_top">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span id="profileLabel">Profilo</span>
              </a>
              <a class="mitem danger" id="logoutLink" href="#" target="_top">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Logout
              </a>
            </div>
          </div>
        </div>
      </div>`;
    }
  }

  if (!customElements.get('carello-shell')) {
    customElements.define('carello-shell', CarelloShell);
  }
})();
