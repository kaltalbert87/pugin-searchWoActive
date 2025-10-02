// search.js - lógica para buscar actividades por VIN
"use strict";

const searchBtn = document.getElementById('searchBtn');
const vinInput = document.getElementById('vinInput');
const resultsEl = document.getElementById('results');
const statusArea = document.getElementById('statusArea');
const selectionArea = document.getElementById('selectionArea');
const selectedDetails = document.getElementById('selectedDetails');
const confirmBtn = document.getElementById('confirmBtn');
const clearSelection = document.getElementById('clearSelection');
const spinnerArea = document.getElementById('spinnerArea');
const resultsHeader = document.getElementById('resultsHeader');
const resultsSummary = document.getElementById('resultsSummary');
const noResults = document.getElementById('noResults');

let lastResults = [];
let currentSelection = null;

// Usaremos exclusivamente la autorización que provee el plugin en sessionStorage

searchBtn.addEventListener('click', doSearch);
vinInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });
clearSelection.addEventListener('click', () => { currentSelection = null; selectionArea.style.display = 'none'; });

confirmBtn.addEventListener('click', () => {
  if (!currentSelection) return setStatus('No hay selección activa', 'warning');
  // Acción simple: mostrar en consola y en UI
  console.log('Registro confirmado:', currentSelection);
  setStatus('Registro confirmado: ' + currentSelection.woaNumber, 'success');
});

function setStatus(msg, type = 'info') {
  const color = type === 'success' ? 'green' : type === 'warning' ? 'orange' : '#333';
  statusArea.innerHTML = `<div style="color:${color}">${msg}</div>`;
}

function doSearch() {
  const vin = (vinInput.value || '').trim();
  if (!vin) return setStatus('Ingresa al menos una fracción de VIN', 'warning');
  setStatus('Buscando...');
  resultsEl.innerHTML = '';
  resultsHeader.style.display = 'none';
  noResults.style.display = 'none';
  selectionArea.style.display = 'none';
  currentSelection = null;
  spinnerArea.style.display = 'block';

  const base = 'https://dev-api-sie.encontrack.com/webhook/crm/searchWoByVin';
  const uri = `${base}?vin=${encodeURIComponent(vin)}`;

  const xhttp = new XMLHttpRequest();
  xhttp.open('GET', uri, true);
  xhttp.setRequestHeader('Content-Type', 'application/json');

  // Authorization: usar sessionStorage (como en plugin.js)
  const auth = 'Basic aW50ZWdyYXRvckZTTTozMGVhODc5OC0zNGFkLTQwZTgtODY4MC1hNGU2Nzc1ODYwM2E=';
  if (!auth) {
    setStatus('Atención: no se encontró autorización en sessionStorage.', 'warning');
  }
  if (auth) xhttp.setRequestHeader('Authorization', auth);

  xhttp.onreadystatechange = function () {
    if (this.readyState !== 4) return;
    spinnerArea.style.display = 'none';
    if (this.status >= 200 && this.status < 300) {
      let data;
      try { data = JSON.parse(this.responseText); }
      catch (e) { setStatus('Respuesta inválida del servidor', 'warning'); console.error(e); return; }

      lastResults = Array.isArray(data) ? data : [];
      if (lastResults.length === 0) { setStatus('No se encontraron resultados', 'warning'); noResults.style.display = 'block'; return; }

      // Agrupar por srNumber, vin, brand, subBrand, model
      const grouped = {};
      lastResults.forEach(item => {
        const key = `${item.srNumber || '-'}|${item.vin || '-'}|${item.brand || '-'}|${item.subBrand || '-'}|${item.model || '-'} `;
        if (!grouped[key]) {
          grouped[key] = {
            meta: {
              srNumber: item.srNumber || '-',
              vin: item.vin || '-',
              brand: item.brand || '-',
              subBrand: item.subBrand || '-',
              model: item.model || '-',
              account: item.account || '-'
            },
            entries: []
          };
        }
        grouped[key].entries.push({ woaNumber: item.woaNumber || '-', deviceType: item.deviceType || '-', activity: item.activity || '-', woNumber: item.woNumber || '-' });
      });

      renderGroups(grouped);
      resultsHeader.style.display = 'flex';
      resultsSummary.innerHTML = `<strong>Encontrados:</strong> ${lastResults.length} registros — <span class="small-muted">${Object.keys(grouped).length} agrupaciones</span>`;
      setStatus('Resultados cargados', 'success');

    } else {
      spinnerArea.style.display = 'none';
      setStatus('Error en la petición: ' + this.status, 'warning');
      console.error('Error', this.status, this.responseText);
    }
  };

  xhttp.onerror = function () { spinnerArea.style.display = 'none'; setStatus('Error de red al realizar la búsqueda', 'warning'); };
  xhttp.send();
}

function renderGroups(grouped) {
  resultsEl.innerHTML = '';
  Object.values(grouped).forEach(group => {
    const g = document.createElement('div');
    g.className = 'contenedor-actividad mb-2';

    const details = document.createElement('details');
    details.open = true;

    const summary = document.createElement('summary');
    summary.className = 'card-header custom d-flex justify-content-between align-items-center';
    summary.innerHTML = `<div><strong>${group.meta.brand || '-'} ${group.meta.subBrand || ''}</strong> <span class="small-muted">(${group.meta.model || ''})</span><div class="small-muted">SR: ${group.meta.srNumber || '-'} — VIN: ${group.meta.vin || '-'}</div></div><div><span class="badge-count">${group.entries.length}</span></div>`;

    const body = document.createElement('div');
    body.className = 'panel-body';
    body.style.paddingTop = '10px';

    // Mostrar account
    const acc = document.createElement('p');
    acc.innerHTML = `<strong>Cuenta:</strong> ${group.meta.account || '-'}`;
    body.appendChild(acc);

    // Lista de entradas que varían
    group.entries.forEach((entry, idx) => {
      const row = document.createElement('div');
      row.className = 'item-row';
      row.dataset.woa = entry.woaNumber || '';

      const meta = document.createElement('div');
      meta.className = 'item-meta';
      meta.innerHTML = `<div><strong>${entry.woaNumber}</strong> <span class="small-muted">(${entry.woNumber})</span></div>
                        <div class="small-muted">Device: ${entry.deviceType || '-'} — Activity: ${entry.activity || '-'}</div>`;
      row.appendChild(meta);

      const btn = document.createElement('button');
      btn.className = 'btn btn-sm btn-outline-primary';
      btn.innerHTML = '<i class="fa-solid fa-check"></i> Seleccionar';
      btn.addEventListener('click', () => { selectEntry(group.meta, entry); highlightRow(row); });
      row.appendChild(btn);

      body.appendChild(row);
    });

    details.appendChild(summary);
    details.appendChild(body);
    g.appendChild(details);
    resultsEl.appendChild(g);
  });
}

function selectEntry(meta, entry) {
  currentSelection = Object.assign({}, meta, entry);
  selectionArea.style.display = 'block';
  selectedDetails.innerHTML = `
    <p><strong>SR:</strong> ${meta.srNumber || '-'} — <strong>VIN:</strong> ${meta.vin || '-'}</p>
    <p><strong>Marca/Submarca/Modelo:</strong> ${meta.brand || '-'} / ${meta.subBrand || '-'} / ${meta.model || '-'}</p>
    <p><strong>Cuenta:</strong> ${meta.account || '-'}</p>
    <p><strong>WOA:</strong> ${entry.woaNumber} — <strong>WO:</strong> ${entry.woNumber}</p>
    <p><strong>Device:</strong> ${entry.deviceType} — <strong>Actividad:</strong> ${entry.activity}</p>
  `;
}

function highlightRow(row) {
  // remover highlight previo
  document.querySelectorAll('.item-row.selected').forEach(r => r.classList.remove('selected'));
  row.classList.add('selected');
  // scroll suave
  row.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
