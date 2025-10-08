// search.js - encapsulado como plugin similar a fieldservice.js
"use strict";

let urln8n;
let Autorizacion;

class SearchPlugin {
  constructor() {
    this.lastResults = [];
    this.currentSelection = null;
    this.elements = {};
    // Determine if running embedded in a host or local
    this.isLocal = !document.location.ancestorOrigins || document.location.ancestorOrigins.length === 0;

    // Inicializar cuando se cargue el DOM
    document.addEventListener('DOMContentLoaded', () => this.init());
  }

  /**
   * openMessage: process an 'open' payload from the host (Field Service)
   * Mirrors important behavior from FieldServicePlugin.openMessage:
   * - Do nothing in local mode
   * - Extract activity payload and common fields (vin, XA_LIST, photo fields)
   * - Prefill VIN input and trigger a search when appropriate
   */
  openMessage(data) {
    // Do not run openMessage in local mode
    if (this.isLocal) {
      console.log('openMessage bloqueado - modo local activo');
      return;
    }

    //const activity = data.activity || data.activityData || data.payload || null;

    urln8n = data.securedData.n8nUrl;
    Autorizacion = data.securedData.Authorization;

    console.log('openMessage recibido:', data);


    // Map common fields to global variables that other parts of the app (or FieldService flow) may expect
    try {

      // VIN and account
      //window.vin = activity.xa_car_vin || activity.vin || activity.Vin_c || window.vin || '';
      //window.accountName = activity.xa_wo_cuenta || activity.account || window.accountName || '';

      console.log('OpenMessage');

    } catch (e) {
      console.error('Error proccesando openMessage payload:', e);
    }

  }

  init() {
    // Referencias al DOM
    this.elements.searchBtn = document.getElementById('searchBtn');
    this.elements.vinInput = document.getElementById('vinInput');
    this.elements.resultsEl = document.getElementById('results');
    this.elements.statusArea = document.getElementById('statusArea');
    this.elements.selectionArea = document.getElementById('selectionArea');
    this.elements.selectedDetails = document.getElementById('selectedDetails');
    this.elements.confirmBtn = document.getElementById('confirmBtn');
    this.elements.clearSelection = document.getElementById('clearSelection');
    this.elements.resultsHeader = document.getElementById('resultsHeader');
    this.elements.resultsSummary = document.getElementById('resultsSummary');
    this.elements.noResults = document.getElementById('noResults');
    this.elements.loading = document.getElementById('loading');
    this.elements.error = document.getElementById('error');
    this.elements.mainContent = document.getElementById('main-content');

    // Bind events
    if (this.elements.searchBtn) this.elements.searchBtn.addEventListener('click', () => this.doSearch());
    if (this.elements.vinInput) this.elements.vinInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.doSearch(); });
    if (this.elements.clearSelection) this.elements.clearSelection.addEventListener('click', () => this.clearSelection());
  if (this.elements.confirmBtn) this.elements.confirmBtn.addEventListener('click', () => this.confirmSelection());

  // Ensure confirm button is disabled by default; it will be enabled only when the user
  // explicitly clicks the "Asignar" button which calls assignResource().
  if (this.elements.confirmBtn) this.elements.confirmBtn.disabled = true;

  // Listen for messages from host using a dedicated handler (mirrors fieldservice.js)
  window.addEventListener('message', this.getWebMessage.bind(this), false);

    // Initial UI
    console.log('🚗 Search Plugin iniciado');
    if (this.elements.vinInput) this.elements.vinInput.focus();
    this.setStatus('¡Bienvenido! Ingrese una fracción de VIN para buscar actividades', 'info');

    // Handshake ready
    try {
      this.sendWebMessage({ apiVersion: 1, method: 'ready' });
      console.log('Ready message sent to host');
    } catch (e) {
      console.warn('No host detected for ready handshake');
    }
  }

  /* Modal helpers: dynamically create a modal in the document and return a promise that resolves with true/false */
  _ensureModal() {
    if (this._modalEl) return this._modalEl;
    const backdrop = document.createElement('div');
    backdrop.className = 'fs-modal-backdrop';
    backdrop.innerHTML = `
      <div class="fs-modal" role="dialog" aria-modal="true">
        <div class="fs-modal-header">
          <div class="fs-modal-title">Confirmación</div>
        </div>
        <div class="fs-modal-body" id="fs-modal-body">Mensaje</div>
        <div class="fs-modal-actions">
          <button class="btn-primary" id="fs-confirm">Aceptar</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    this._modalEl = backdrop;
  const confirmBtn = backdrop.querySelector('#fs-confirm');
  const bodyEl = backdrop.querySelector('#fs-modal-body');

    // Wire events
    confirmBtn.addEventListener('click', () => {
      this._resolveModal && this._resolveModal(true);
      this.hideModal();
    });

    // Do not close when clicking backdrop; require explicit accept
    // (if desired in future, we can enable click-outside-to-cancel)

    return this._modalEl;
  }

  showModal(options = {}) {
    const el = this._ensureModal();
    const bodyEl = el.querySelector('#fs-modal-body');
  const confirmBtn = el.querySelector('#fs-confirm');
  bodyEl.textContent = options.message || '¿Confirmar?';
  confirmBtn.textContent = options.confirmText || 'Aceptar';

    el.classList.add('show');
    // return promise that resolves when user chooses
    return new Promise((resolve) => { this._resolveModal = resolve; });
  }

  hideModal() {
    if (!this._modalEl) return;
    this._modalEl.classList.remove('show');
    // small cleanup: remove from DOM after animation
    setTimeout(() => { try { if (this._modalEl && this._modalEl.parentNode) this._modalEl.parentNode.removeChild(this._modalEl); } catch(e){} this._modalEl = null; }, 220);
  }

  // status helper
  setStatus(msg, type = 'info') {
    const icons = { 'success':'✅','warning':'⚠️','danger':'❌','info':'ℹ️' };
    const colors = { 'success':'#155724','warning':'#856404','danger':'#721c24','info':'#0c5460' };
    const backgrounds = {
      'success':'linear-gradient(135deg, #d4edda, #c3e6cb)',
      'warning':'linear-gradient(135deg, #fff3cd, #fce589)',
      'danger':'linear-gradient(135deg, #f8d7da, #f1b0b7)',
      'info':'linear-gradient(135deg, #d1ecf1, #bee5eb)'
    };

    if (!this.elements.statusArea) return;
    this.elements.statusArea.innerHTML = `\n      <div class="notification ${type}" style="\n        background: ${backgrounds[type] || backgrounds.info};\n        color: ${colors[type] || colors.info};\n        padding: var(--spacing-md);\n        border-radius: var(--radius-md);\n        margin-bottom: var(--spacing-md);\n        font-weight: 500;\n        display: flex;\n        align-items: center;\n        gap: var(--spacing-sm);\n      ">\n        <span>${icons[type] || icons.info}</span>\n        <span>${msg}</span>\n      </div>\n    `;
  }

  // messaging helpers
  isJson(str) { if (typeof str !== 'string') return false; try { JSON.parse(str); return true; } catch(e) { return false; } }

  sendWebMessage(data) {
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    try {
      if (window.parent && window.parent !== window && typeof window.parent.postMessage === 'function') {
        window.parent.postMessage(payload, '*');
        console.log('Mensaje enviado al host:', payload);
        return true;
      } else {
        console.log('No se detectó host (parent). Mensaje preparado:', payload);
urln8n='https://dev-api-sie.encontrack.com/webhook/';
Autorizacion='Basic aW50ZWdyYXRvckZTTTozMGVhODc5OC0zNGFkLTQwZTgtODY4MC1hNGU2Nzc1ODYwM2E=';


        return false;
      }
    } catch (err) { console.error('Error enviando mensaje al host:', err); return false; }
  }

  handleMessage(event) {
    let data = event.data;
    if (typeof data === 'string' && this.isJson(data)) {
      try { data = JSON.parse(data); } catch(e) { return; }
    }

    if (!data || !data.method) return;
    console.log('Mensaje recibido del host:', data);

    if (data.method === 'ready') {
      this.setStatus('Host ready: comunicación establecida', 'info');
      return;
    }

    if (data.method === 'open' || data.method === 'openMessage') {
      // Delegate to a dedicated openMessage handler (mirrors FieldServicePlugin.openMessage)
      try {
        this.openMessage(data);
      } catch (e) {
        console.error('Error ejecutando openMessage:', e);
      }
      return;
    }

    if (data.method === 'init') {
      // simple init acknowledgement
      this.setStatus('Init recibido desde host', 'info');
      return;
    }
  }

  /**
   * getWebMessage: entry point for raw postMessage events
   * Mirrors fieldservice.js: validates JSON, respects local mode and delegates to handleMessage
   */
  getWebMessage(event) {
    console.log('getWebMessage raw event:', event.data);

    // If running local, ignore unrelated messages (allow close/update)
    if (this.isLocal && (!event.data || (typeof event.data === 'string' && !event.data.includes('close') && !event.data.includes('update')))) {
      console.log('Mensaje ignorado - modo local activo');
      return false;
    }

    if (typeof event.data === 'undefined') return false;
    if (typeof event.data === 'string' && !this.isJson(event.data)) return false;

    // Delegate to handleMessage which already supports parsed objects
    try {
      this.handleMessage(event);
    } catch (e) {
      console.error('Error procesando mensaje en handleMessage:', e);
    }

    return true;
  }

  // selection helpers
  clearSelection() {
    this.currentSelection = null;
    // Clear any previously assigned resource and disable confirm button
    this.selectedResource = null;
    if (this.elements.confirmBtn) this.elements.confirmBtn.disabled = true;
    if (this.elements.selectionArea) this.elements.selectionArea.style.display = 'none';
    // Restore results list visibility so user can pick another
    if (this.elements.resultsEl) this.elements.resultsEl.style.display = '';
    if (this.elements.resultsHeader) this.elements.resultsHeader.style.display = '';

    // Remove selection highlight
    document.querySelectorAll('.activity-card.selected').forEach(card => card.classList.remove('selected'));

    // Remove delegated entry click handler if present to avoid duplicates
    if (this._entriesDelegatedHandler && this.elements.selectedDetails) {
      try { this.elements.selectedDetails.removeEventListener('click', this._entriesDelegatedHandler); } catch (e) { /* ignore */ }
      this._entriesDelegatedHandler = null;
    }
  }

  async confirmSelection() {
    console.log('confirmSelection() invoked - currentSelection:', this.currentSelection);

    if (!this.currentSelection) return this.setStatus('No hay selección activa', 'warning');

    // Prevent double submissions
    if (this._confirming) {
      console.log('confirmSelection: already confirming, aborting');
      return this.setStatus('Asignación en proceso, espera...', 'info');
    }
    this._confirming = true;
    console.log('confirmSelection: starting confirmation flow');

    // If the user selected a technician in the select but did not click "Asignar", pick it up automatically
    // NOTE: We intentionally DO NOT auto-assign from the select here. The UX requirement
    // is that the Confirm button only becomes active after the user clicks "Asignar".
    // Therefore confirmSelection() will abort if no explicit assigned resource exists.

    // Ensure a resource has been selected
    const resourceId = this.selectedResource ? this.selectedResource.resourceId : null;
    console.log('confirmSelection: selectedResource after auto-assign attempt:', this.selectedResource);
    if (!resourceId) {
      this._confirming = false;
      console.log('confirmSelection: no resource selected, aborting');
      return this.setStatus('No hay técnico asignado. Asigna un técnico antes de confirmar.', 'warning');
    }

    // Show a spinner while processing the assignment. Reuse the existing loading element if available
    let prevLoadingHtml = null;
    if (this.elements.loading) {
      prevLoadingHtml = this.elements.loading.innerHTML;
      this.elements.loading.innerHTML = '<p>Procesando asignación...</p>';
      this.elements.loading.style.display = 'block';
    } else {
      const spinnerArea = document.getElementById('spinnerArea');
      if (spinnerArea) {
        spinnerArea.dataset.prev = spinnerArea.innerHTML || '';
        spinnerArea.innerHTML = '<div id="confirm-spinner">Procesando asignación...</div>';
      }
    }

    // Disable confirm button while request is in flight
    if (this.elements.confirmBtn) {
      this.elements.confirmBtn.disabled = true;
      this.elements.confirmBtn.dataset.prevText = this.elements.confirmBtn.textContent || '';
      this.elements.confirmBtn.textContent = 'Procesando...';
    }

    // Build PATCH request payload
    const base = urln8n + 'crm/SelfAssigned';
    const uri = base;
    const payload = {
      resourceid: String(resourceId),
      woNumber: this.currentSelection.woNumber || this.currentSelection.srNumber || this.currentSelection.woaNumber || ''
    };
    console.log('confirmSelection: prepared payload, url=', uri, 'payload=', payload);

    const xhttp = new XMLHttpRequest();
    xhttp.open('PATCH', uri, true);
    xhttp.setRequestHeader('Content-Type', 'application/json');
    if (Autorizacion) {
      xhttp.setRequestHeader('Authorization', Autorizacion);
      console.log('confirmSelection: set Authorization header');
    } else {
      console.log('confirmSelection: no Authorization header available');
    }

  xhttp.onreadystatechange = async () => {
      console.log('confirmSelection: XHR readyState=', xhttp.readyState, 'status=', xhttp.status);
      if (xhttp.readyState !== 4) return;
      console.log('confirmSelection: XHR completed, responseText=', xhttp.responseText);

      // done - restore UI
      this._confirming = false;
      if (this.elements.loading) {
        this.elements.loading.style.display = 'none';
        this.elements.loading.innerHTML = prevLoadingHtml || '<p>Buscando actividades...</p>';
      } else {
        const spinnerArea = document.getElementById('spinnerArea'); if (spinnerArea) spinnerArea.innerHTML = spinnerArea.dataset.prev || '';
      }
      if (this.elements.confirmBtn) {
        this.elements.confirmBtn.disabled = false;
        if (this.elements.confirmBtn.dataset.prevText) { this.elements.confirmBtn.textContent = this.elements.confirmBtn.dataset.prevText; delete this.elements.confirmBtn.dataset.prevText; }
      }

      if (xhttp.status >= 200 && xhttp.status < 300) {
        let data;
        try { data = JSON.parse(xhttp.responseText); } catch (e) { this.setStatus('Respuesta inválida del servidor (asignación)', 'danger'); console.error('confirmSelection: JSON parse error', e); return; }

        console.log('confirmSelection: parsed response data=', data);
        const arr = Array.isArray(data) ? data : [];
        const first = arr[0] || {};
        if (first.result === 'success') {
          console.log('confirmSelection: API returned success');
          // Attach selected resource and persist selection
          if (this.selectedResource) this.currentSelection.assignedResource = this.selectedResource;
          sessionStorage.setItem('selectedActivity', JSON.stringify(this.currentSelection));
          this.setStatus('Técnico asignado con éxito y selección confirmada', 'success');

          // Ask the user before navigating back / closing the view using a styled modal
          try {
            const userConfirmed = await this.showModal({
              message: 'Asignación enviada correctamente.',
              confirmText: 'Aceptar'
            });
            if (userConfirmed) {
              try {
                // Enviar el payload de cierre solicitado por OFS
                const messageData = {
                  apiVersion: 1,
                  method: 'close',
                  backScreen: 'mobility',
                  wakeupNeeded: false
                };
                console.log('confirmSelection: enviando messageData de cierre al host', messageData);
                this.sendWebMessage(messageData);
                // Como medida de seguridad, intentar volver atrás localmente si el parent no cierra
                setTimeout(() => { try { history.back(); } catch (e) { console.warn('confirmSelection: history.back() falló', e); this.clearSelection(); } }, 600);
              } catch (e) {
                console.warn('confirmSelection: error enviando messageData, intentando history.back()', e);
                try { history.back(); } catch (err) { this.clearSelection(); }
              }
            } else {
              console.log('confirmSelection: user chose to remain on the page after successful assignment');
            }
          } catch (e) { console.warn('confirmSelection: error during user-confirm handling', e); }
        } else {
          const msg = first.message || 'Error desconocido en asignación';
          console.log('confirmSelection: API returned error result', first);
          this.setStatus('Error al asignar técnico: ' + msg, 'danger');
        }
      } else {
        this.setStatus('Error en la petición de asignación: ' + xhttp.status, 'danger');
        console.error('confirmSelection: Asignación error', xhttp.status, xhttp.responseText);
      }
    };

    xhttp.onerror = () => {
      this._confirming = false;
      console.error('confirmSelection: XHR onerror fired');
      if (this.elements.loading) { this.elements.loading.style.display = 'none'; this.elements.loading.innerHTML = prevLoadingHtml || '<p>Buscando actividades...</p>'; }
      if (this.elements.confirmBtn) { this.elements.confirmBtn.disabled = false; if (this.elements.confirmBtn.dataset.prevText) { this.elements.confirmBtn.textContent = this.elements.confirmBtn.dataset.prevText; delete this.elements.confirmBtn.dataset.prevText; } }
      this.setStatus('Error de red al asignar técnico', 'danger');
    };

    xhttp.ontimeout = () => {
      this._confirming = false;
      console.warn('confirmSelection: XHR ontimeout fired');
      if (this.elements.loading) { this.elements.loading.style.display = 'none'; this.elements.loading.innerHTML = prevLoadingHtml || '<p>Buscando actividades...</p>'; }
      if (this.elements.confirmBtn) { this.elements.confirmBtn.disabled = false; if (this.elements.confirmBtn.dataset.prevText) { this.elements.confirmBtn.textContent = this.elements.confirmBtn.dataset.prevText; delete this.elements.confirmBtn.dataset.prevText; } }
      this.setStatus('Tiempo de espera agotado al asignar técnico', 'warning');
    };

    xhttp.timeout = 30000;
    console.log('confirmSelection: sending XHR...', uri);
    xhttp.send(JSON.stringify(payload));
    console.log('confirmSelection: XHR.send called');
  }

  /**
   * Render a selector UI with available resources and handle selection
   */
  renderResourceSelector() {
    if (!this.elements.selectedDetails) return;

    // Create container for resource selector
    let container = document.getElementById('resource-selector');
    if (!container) {
      container = document.createElement('div');
      container.id = 'resource-selector';
      container.style.marginTop = '1rem';
      // organization select + technician select + assign button on the same line
      container.innerHTML = `
        <div style="display:flex; gap:0.5rem; align-items:end; margin-top:0.25rem;">
          <div style="flex:0 0 36%; display:flex; flex-direction:column;">
            <label for="orgSelect" style="font-size:0.82rem; margin-bottom:0.25rem;">Organización</label>
            <select id="orgSelect" style="width:100%; padding:0.42rem; border-radius:6px; border:1px solid #ccc"></select>
          </div>
          <div style="flex:1; display:flex; flex-direction:column;">
            <label for="resourceSelect" style="font-size:0.82rem; margin-bottom:0.25rem;">Técnico</label>
            <select id="resourceSelect" style="width:100%; padding:0.42rem; border-radius:6px; border:1px solid #ccc"></select>
          </div>
          <div style="flex:0 0 auto; display:flex; align-items:flex-end;">
            <button id="assignResourceBtn" class="btn small" style="height:40px;">Asignar</button>
          </div>
        </div>
        <div id="resourceNote" style="margin-top:0.5rem; font-size:0.85rem; color:var(--text-muted);"></div>
      `;
      this.elements.selectedDetails.appendChild(container);

      document.getElementById('assignResourceBtn').addEventListener('click', () => this.assignResource());
      // when organization changes, filter technicians
      document.getElementById('orgSelect').addEventListener('change', (e) => {
        const org = e.target.value;
        this._populateTechsForOrg(org);
      });
    }

    const select = document.getElementById('resourceSelect');
    select.innerHTML = '';
    // Add a default empty option
    const emptyOpt = document.createElement('option');
    emptyOpt.value = '';
    emptyOpt.textContent = '-- Selecciona un técnico --';
    select.appendChild(emptyOpt);

    // Populate orgSelect with unique organizations
    const orgSelect = document.getElementById('orgSelect');
    if (orgSelect) {
      const orgs = Array.from(new Set(this.resources.map(r => r.organization || ''))).filter(Boolean).sort();
      orgSelect.innerHTML = '';
      const emptyOrgOpt = document.createElement('option'); emptyOrgOpt.value = ''; emptyOrgOpt.textContent = '-- Selecciona organización --'; orgSelect.appendChild(emptyOrgOpt);
      orgs.forEach(org => {
        const o = document.createElement('option'); o.value = org; o.textContent = org; orgSelect.appendChild(o);
      });

      // If previously assigned resource exists, preselect its organization
      if (this.selectedResource && this.selectedResource.organization) {
        orgSelect.value = this.selectedResource.organization;
      } else if (orgs.length > 0) {
        orgSelect.value = orgs[0];
      }
    }

    // helper to populate technicians for an organization
    this._populateTechsForOrg = (org) => {
      const techSelect = document.getElementById('resourceSelect');
      techSelect.innerHTML = '';
      const emptyOpt2 = document.createElement('option'); emptyOpt2.value = ''; emptyOpt2.textContent = '-- Selecciona un técnico --'; techSelect.appendChild(emptyOpt2);
      const filtered = this.resources.filter(r => (org ? (r.organization === org) : true));
      filtered.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.resourceId || r.resourceId;
        opt.textContent = `${r.name}`;
        opt.dataset.email = r.email || '';
        opt.dataset.phone = r.phone || '';
        opt.dataset.organization = r.organization || '';
        techSelect.appendChild(opt);
      });

      // Preselect previously assigned resource if it matches
      if (this.selectedResource && this.selectedResource.resourceId) {
        techSelect.value = this.selectedResource.resourceId;
        const note = document.getElementById('resourceNote'); if (note) note.textContent = `Asignado: ${this.selectedResource.name} (${this.selectedResource.resourceId})`;
      }
    };

    // initially populate technicians based on current orgSelect value
    if (typeof orgSelect !== 'undefined' && orgSelect) {
      this._populateTechsForOrg(orgSelect.value);
    }

    // Preselect if previously assigned
    // (handled by org->tech population above)
  }

  /**
   * Assign the selected resource from the selector to `this.selectedResource`
   */
  assignResource() {
    const select = document.getElementById('resourceSelect');
    if (!select) return this.setStatus('Selector de recursos no disponible', 'warning');
    const val = select.value;
    if (!val) return this.setStatus('Selecciona un técnico antes de asignar', 'warning');

    const opt = select.options[select.selectedIndex];
    const assigned = {
      resourceId: opt.value,
      name: opt.textContent,
      email: opt.dataset.email,
      phone: opt.dataset.phone,
      organization: opt.dataset.organization || ''
    };

    this.selectedResource = assigned;
    const note = document.getElementById('resourceNote');
    if (note) note.textContent = `Asignado: (${assigned.resourceId}) ${assigned.name} `;
    this.setStatus(`Técnico asignado: ${assigned.name}`, 'success');
    // Enable the confirm button now that a resource has been explicitly assigned
    if (this.elements.confirmBtn) this.elements.confirmBtn.disabled = false;
  }

  // main search flow
  doSearch() {
    const vin = (this.elements.vinInput?.value || '').trim();
    if (!vin) return this.setStatus('Ingresa al menos una fracción de VIN', 'warning');

    this.setStatus('Buscando actividades...', 'info');
    this.elements.resultsEl.innerHTML = '';
    if (this.elements.selectionArea) this.elements.selectionArea.style.display = 'none';
    if (this.elements.loading) this.elements.loading.style.display = 'block';
    if (this.elements.error) this.elements.error.style.display = 'none';
    if (this.elements.mainContent) this.elements.mainContent.style.display = 'none';
    this.currentSelection = null;

    const base = urln8n + 'crm/searchWoByVin';
    const uri = `${base}?vin=${encodeURIComponent(vin)}`;

    const xhttp = new XMLHttpRequest();
    xhttp.open('GET', uri, true);
    xhttp.setRequestHeader('Content-Type', 'application/json');

    const auth = Autorizacion;
    if (auth) xhttp.setRequestHeader('Authorization', auth);

    xhttp.onreadystatechange = () => {
      if (xhttp.readyState !== 4) return;
      if (this.elements.loading) this.elements.loading.style.display = 'none';

      if (xhttp.status >= 200 && xhttp.status < 300) {
        let data;
        try { data = JSON.parse(xhttp.responseText); } catch (e) { this.setStatus('Respuesta inválida del servidor', 'danger'); console.error(e); return; }

        this.lastResults = Array.isArray(data) ? data : [];
        if (this.lastResults.length === 0) {
          if (this.elements.mainContent) this.elements.mainContent.style.display = 'block';
          if (this.elements.noResults) this.elements.noResults.style.display = 'block';
          this.setStatus('No se encontraron resultados', 'warning');
          return;
        }

        // Agrupar
        const grouped = {};
        this.lastResults.forEach(item => {
          const key = `${item.srNumber || '-'}|${item.vin || '-'}|${item.brand || '-'}|${item.subBrand || '-'}|${item.model || '-'}`;
          if (!grouped[key]) grouped[key] = { meta: { srNumber: item.srNumber||'-', woNumber: item.woNumber||'-', vin: item.vin||'-', brand: item.brand||'-', subBrand: item.subBrand||'-', model: item.model||'-', account: item.account||'-' }, entries: [] };
          grouped[key].entries.push({ woaNumber: item.woaNumber||'-', deviceType: item.deviceType||'-', activity: item.activity||'-', woNumber: item.woNumber||'-' });
        });

  this.renderGroups(grouped);

  // Ensure results area is visible after a search (in case it was hidden by selection)
  if (this.elements.resultsEl) this.elements.resultsEl.style.display = '';
  if (this.elements.mainContent) this.elements.mainContent.style.display = 'block';
  if (this.elements.noResults) this.elements.noResults.style.display = 'none';
  if (this.elements.resultsHeader) this.elements.resultsHeader.style.display = 'flex';
        this.setStatus(this.lastResults.length + ' registros encontrados', 'success');

        // Preload resources so they are ready when the user selects a record
        if (!this.resources || !Array.isArray(this.resources) || this.resources.length === 0) {
          console.log('Recursos no cargados aún: iniciando fetchResources() de forma automática');
          this.fetchResources();
        }

      } else {
        this.setStatus('Error en la petición: ' + xhttp.status, 'danger');
        console.error('Error', xhttp.status, xhttp.responseText);
      }
    };

    xhttp.onerror = () => { if (this.elements.loading) this.elements.loading.style.display = 'none'; this.setStatus('Error de red al realizar la búsqueda', 'danger'); };
    xhttp.ontimeout = () => { if (this.elements.loading) this.elements.loading.style.display = 'none'; this.setStatus('Tiempo de espera agotado. Intenta nuevamente.', 'warning'); };
    xhttp.timeout = 30000;
    xhttp.send();
  }

  // fetch resources flow (same structure as doSearch)
  fetchResources() {
    // Prevent concurrent fetches
    if (this._fetchingResources) {
      console.log('fetchResources: ya se está obteniendo la lista de recursos');
      return;
    }
    this._fetchingResources = true;

    // Do not clear the activities/results UI while loading resources.
    // Show a small loader appended after the results (end of cards) so we don't overwrite main status.
    let resourcesStatus = document.getElementById('resources-status');
    if (!resourcesStatus) {
      resourcesStatus = document.createElement('div');
      resourcesStatus.id = 'resources-status';
      resourcesStatus.style.marginTop = '0.5rem';
      resourcesStatus.style.fontSize = '0.9rem';
      resourcesStatus.style.color = 'var(--text-muted)';
      if (this.elements.resultsEl) this.elements.resultsEl.appendChild(resourcesStatus);
      else document.body.appendChild(resourcesStatus);
    }
    resourcesStatus.textContent = 'Buscando recursos...';

    const base = urln8n + 'fsm/resources';
    const uri = base;

    const xhttp = new XMLHttpRequest();
    xhttp.open('GET', uri, true);
    xhttp.setRequestHeader('Content-Type', 'application/json');

    // Prefer Authorization provided via openMessage (Autorizacion), otherwise fallback to the same Basic used elsewhere
    const authHeader = Autorizacion;
    if (authHeader) xhttp.setRequestHeader('Authorization', Autorizacion);

    xhttp.onreadystatechange = () => {
      if (xhttp.readyState !== 4) return;
      // done
      this._fetchingResources = false;
      if (resourcesStatus) resourcesStatus.textContent = '';

      if (xhttp.status >= 200 && xhttp.status < 300) {
        let data;
        try { data = JSON.parse(xhttp.responseText); } catch (e) { console.error('Respuesta inválida del servidor (resources)', e); if (resourcesStatus) resourcesStatus.textContent = 'Error: respuesta inválida al obtener recursos'; return; }

        // Expecting an array
        const parsed = Array.isArray(data) ? data : [];
        console.log('Recursos raw recibidos (count):', parsed.length);

        // Dedupe by resourceId to avoid duplicates
        const map = new Map();
        parsed.forEach(r => {
          const id = r.resourceId || r.resourceId || r.id || r.resourceId;
          if (id && !map.has(id)) map.set(id, r);
        });
        this.resources = Array.from(map.values());
        console.log('Recursos dedupeados (count):', this.resources.length);

        if (this.resources.length === 0) {
          if (resourcesStatus) resourcesStatus.textContent = 'No se encontraron técnicos';
        } else {
          if (resourcesStatus) resourcesStatus.textContent = `${this.resources.length} técnicos cargados`;
        }

        // If a selection is active, render the resource selector so the user can assign immediately
        if (this.currentSelection) {
          this.renderResourceSelector();
        }

      } else {
        console.error('Error resources', xhttp.status, xhttp.responseText);
        if (resourcesStatus) resourcesStatus.textContent = 'Error al obtener técnicos';
      }
    };

    xhttp.onerror = () => {
      this._fetchingResources = false;
      if (resourcesStatus) resourcesStatus.textContent = 'Error de red al obtener técnicos';
    };

    xhttp.ontimeout = () => {
      this._fetchingResources = false;
      if (resourcesStatus) resourcesStatus.textContent = 'Tiempo de espera agotado al obtener técnicos';
    };

    xhttp.timeout = 30000;
    xhttp.send();
  }

  renderGroups(grouped) {
  if (!this.elements.resultsEl) return;
  this.elements.resultsEl.innerHTML = '';
  // scope wrapper to the results element to avoid picking an old container elsewhere in the DOM
  let wrapper = this.elements.resultsEl.querySelector('.results-scroll');
  if (!wrapper) { wrapper = document.createElement('div'); wrapper.className = 'results-scroll'; this.elements.resultsEl.appendChild(wrapper); }
  else wrapper.innerHTML = '';

    Object.values(grouped).forEach((group, index) => {
      const container = document.createElement('div');
      container.className = 'contenedor-actividad';
      container.setAttribute('data-activity-id', group.meta.srNumber);

      container.innerHTML = `\n        <div class="corner-dot" title="estado"></div>\n        <div class="activity-card" onclick="selectGroup(this, ${index}, ${JSON.stringify(group).replace(/\"/g, '&quot;')})">\n          <div class="activity-header">\n            <div class="activity-number">${group.entries && group.entries[0] && group.entries[0].woNumber ? group.entries[0].woNumber : group.meta.srNumber} <span class="header-vin"> - ${group.meta.vin}</span></div>\n\n          </div>\n          \n          <div class="activity-details">\n            <div class="detail-item">\n              <div class="mini-cards">\n                <div class="mini-card card l-bg-cyan client">\n                  <span class="icon">🏢</span>\n                  <div>\n                    <div class="label">Cliente</div>\n                    <div class="value">${group.meta.account}</div>\n                  </div>\n                </div>\n\n                <div class="mini-card card l-bg-blue-dark">\n                  <span class="icon">🚗</span>\n                  <div>\n                    <div class="label">Marca</div>\n                    <div class="value">${group.meta.brand} ${group.meta.subBrand}</div>\n                  </div>\n                </div>\n\n                <div class="mini-card card l-bg-green">\n                  <span class="icon">📅</span>\n                  <div>\n                    <div class="label">Modelo</div>\n                    <div class="value">${group.meta.model}</div>\n                  </div>\n                </div>\n              </div>\n            </div>\n            \n            <div class="detail-item">\n              <span class="detail-icon">📋</span>\n              <span class="detail-label">Actividades:</span>\n              <span>${group.entries.map(e => (e.activity || '-') + ' (' + (e.deviceType || '-') + ')').join(', ')}</span>\n            </div>\n          </div>\n        </div>\n      `;

      wrapper.appendChild(container);
    });
  }

  selectGroup(element, groupIndex, groupDataStr) {
    // Reset selection visuals
    document.querySelectorAll('.contenedor-actividad').forEach(c => { c.classList.remove('selected'); const card = c.querySelector('.activity-card'); if (card) card.classList.remove('selected'); });
    const container = element.closest('.contenedor-actividad'); if (container) container.classList.add('selected'); element.classList.add('selected');

    // Parse and store the whole group so we can pick individual entries
    let group;
    try {
      if (typeof groupDataStr === 'string') {
        group = JSON.parse(groupDataStr.replace(/&quot;/g, '"'));
      } else if (typeof groupDataStr === 'object' && groupDataStr !== null) {
        // sometimes the inline onclick passes a real object instead of a string
        group = groupDataStr;
      } else {
        // fallback: attempt JSON.parse on the string conversion
        group = JSON.parse(String(groupDataStr));
      }
    } catch (e) {
      console.warn('selectGroup: failed to parse groupDataStr, attempting to use as-is', e, groupDataStr);
      group = groupDataStr;
    }
    console.log('selectGroup: group type:', typeof groupDataStr, 'parsed group entries:', (group && group.entries ? group.entries.length : 0));
    this.currentGroup = group;
    // Default selection is the first entry
    const firstEntry = group.entries[0] || {};
    this.currentSelection = Object.assign({}, group.meta, firstEntry);

    if (!this.elements.selectedDetails) return;

    // Header meta
    let html = `\n      <div class="detail-grid">\n        <div class="detail-group">\n          <div class="detail-group-label">Orden de Trabajo</div>\n          <div class="detail-group-value">${group.meta.woNumber}</div>\n        </div>\n        \n        <div class="detail-group">\n          <div class="detail-group-label">VIN del Vehículo</div>\n          <div class="detail-group-value">\n            <span class="vin-code">${group.meta.vin}</span>\n          </div>\n        </div>\n        \n        <div class="detail-group">\n          <div class="detail-group-label">Cliente</div>\n          <div class="detail-group-value">${group.meta.account}</div>\n        </div>\n        \n        <div class="detail-group">\n          <div class="detail-group-label">Marca</div>\n          <div class="detail-group-value">${group.meta.brand} ${group.meta.subBrand}</div>\n        </div>\n        \n        <div class="detail-group">\n          <div class="detail-group-label">Modelo</div>\n          <div class="detail-group-value">${group.meta.model}</div>\n        </div>\n        \n        <div class="detail-group">\n          <div class="detail-group-label">Actividades</div>\n          <div class="detail-group-value">${group.entries.length} actividad(es)</div>\n        </div>\n      </div>\n    `;

    // Entries list - make each entry clickable so user can pick a specific WO
    if (group.entries.length > 0) {
      html += `\n        <div style="margin-top: 1rem;">\n          <h4 style="color: var(--text-primary); margin-bottom: 0.5rem;">Detalles de Actividades:</h4>\n          <div id="entries-list" class="entries-list">`;

      group.entries.forEach((entry, idx) => {
        html += `\n            <div class="entry-item" data-entry-index="${idx}" style="background: var(--bg-secondary); padding: 0.5rem; margin-bottom: 0.25rem; border-radius: 4px; font-size: 0.9rem; cursor:pointer;">\n              <strong>WOA:</strong> ${entry.woaNumber} &nbsp;|&nbsp; <strong>Actividad:</strong> ${(entry.activity || '-') + ' (' + (entry.deviceType || '-') + ')'}\n            </div>`;
      });

      html += `\n          </div>\n        </div>`;
    }

    this.elements.selectedDetails.innerHTML = html;

    // Use delegated click handler for entry-items (more robust than per-item listeners)
    // Remove any previous delegated handler to avoid duplicates
    if (this._entriesDelegatedHandler) this.elements.selectedDetails.removeEventListener('click', this._entriesDelegatedHandler);
    this._entriesDelegatedHandler = (ev) => {
      const el = ev.target.closest && ev.target.closest('.entry-item');
      if (!el) return;
      const idx = parseInt(el.getAttribute('data-entry-index'), 10);
      console.log('entry clicked index=', idx);
      this.selectEntry(idx);
    };
    this.elements.selectedDetails.addEventListener('click', this._entriesDelegatedHandler);

    // mark the first entry as selected visually by default
    const firstItem = this.elements.selectedDetails.querySelector('.entry-item[data-entry-index="0"]');
    if (firstItem) firstItem.classList.add('selected');

  if (this.elements.selectionArea) { this.elements.selectionArea.style.display = 'block'; this.elements.selectionArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  // Hide the main results so the user focuses on the selected activity
  if (this.elements.resultsEl) this.elements.resultsEl.style.display = 'none';
  if (this.elements.resultsHeader) this.elements.resultsHeader.style.display = 'none';
    this.setStatus(`Actividad ${firstEntry.woNumber ? '#' + firstEntry.woNumber : '#' + group.meta.srNumber} seleccionada`, 'success');

    // After selecting a group, ensure resources are available and render selector
    if (this.resources && Array.isArray(this.resources) && this.resources.length > 0) {
      this.renderResourceSelector();
    } else {
      this.fetchResources();
    }

    // Add a back button inside selectedDetails so user can return to the list
    try {
      const backBtnId = 'selected-back-btn';
      let backBtn = this.elements.selectedDetails.querySelector('#' + backBtnId);
      if (!backBtn) {
        backBtn = document.createElement('button');
        backBtn.id = backBtnId;
        backBtn.className = 'btn small';
        backBtn.style.marginTop = '0.6rem';
        backBtn.textContent = '← Regresar a resultados';
        backBtn.addEventListener('click', () => this.clearSelection());
        this.elements.selectedDetails.insertBefore(backBtn, this.elements.selectedDetails.firstChild);
      }
    } catch (e) { console.warn('No se pudo insertar botón regresar', e); }
  }

  /**
   * selectEntry: choose a specific entry index from the last selected group
   */
  selectEntry(index) {
    if (!this.currentGroup || !Array.isArray(this.currentGroup.entries)) return;
    const entry = this.currentGroup.entries[index];
    if (!entry) return;

    // Update currentSelection with meta + picked entry
    this.currentSelection = Object.assign({}, this.currentGroup.meta, entry);

    // Debug
    console.log('selectEntry called with index=', index, 'entry=', entry);

    // Highlight UI selection - find by data-entry-index attribute to avoid relying on NodeList ordering
    const items = this.elements.selectedDetails.querySelectorAll('.entry-item');
    items.forEach((el) => {
      const elIdx = parseInt(el.getAttribute('data-entry-index'), 10);
      if (elIdx === index) el.classList.add('selected'); else el.classList.remove('selected');
    });

    this.setStatus(`Orden seleccionada: ${entry.woNumber || entry.woaNumber || this.currentGroup.meta.srNumber}`, 'info');

    // When selecting a different entry, clear any explicit assigned resource and require
    // the user to click "Asignar" again before enabling Confirm.
    this.selectedResource = null;
    if (this.elements.confirmBtn) this.elements.confirmBtn.disabled = true;

    // Render resource selector so user can assign to this specific entry
    if (this.resources && this.resources.length > 0) this.renderResourceSelector();
  }

  // Expose some useful getters
  getPluginData() { return { lastResults: this.lastResults, currentSelection: this.currentSelection }; }
}

// Crear instancia global
const searchPlugin = new SearchPlugin();

// Compatibilidad: wrappers globales que algunas plantillas HTML pueden usar
function doSearch() { return searchPlugin.doSearch(); }
function selectGroup(element, groupIndex, groupDataStr) { return searchPlugin.selectGroup(element, groupIndex, groupDataStr); }
function getPluginData() { return searchPlugin.getPluginData(); }

