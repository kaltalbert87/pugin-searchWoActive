// search.js - lógica para buscar actividades por VIN
"use strict";

const searchBtn = document.getElementById('searchBtn');
const vinInput = document.getElementById('vinInput');
const authInput = document.getElementById('authInput');
const resultsEl = document.getElementById('results');
const statusArea = document.getElementById('statusArea');
const useSessionAuth = document.getElementById('useSessionAuth');
const selectionArea = document.getElementById('selectionArea');
const selectedDetails = document.getElementById('selectedDetails');
const confirmBtn = document.getElementById('confirmBtn');
const clearSelection = document.getElementById('clearSelection');

let lastResults = [];
let currentSelection = null;

useSessionAuth.addEventListener('click', () => {
  const a = sessionStorage.getItem('Autorizacion') || sessionStorage.getItem('AutorizationFSM');
  if (a) {
    authInput.value = a;
    setStatus('Usando autorización desde sessionStorage', 'info');
  } else {
    setStatus('No se encontró autorización en sessionStorage', 'warning');
  }
});

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
  selectionArea.style.display = 'none';
  currentSelection = null;

  const base = 'https://dev-api-sie.encontrack.com/webhook/crm/searchWoByVin';
  const uri = `${base}?vin=${encodeURIComponent(vin)}`;

  const xhttp = new XMLHttpRequest();
  xhttp.open('GET', uri, true);
  xhttp.setRequestHeader('Content-Type', 'application/json');

  // Authorization: prefer input, fallback to sessionStorage Autorizacion
  const auth = "Basic aW50ZWdyYXRvckZTTTozMGVhODc5OC0zNGFkLTQwZTgtODY4MC1hNGU2Nzc1ODYwM2E=";
  if (auth) xhttp.setRequestHeader('Authorization', auth);

  xhttp.onreadystatechange = function () {
    if (this.readyState !== 4) return;
    if (this.status >= 200 && this.status < 300) {
      let data;
      try { data = JSON.parse(this.responseText); }
      catch (e) { setStatus('Respuesta inválida del servidor', 'warning'); console.error(e); return; }

      lastResults = Array.isArray(data) ? data : [];
      if (lastResults.length === 0) { setStatus('No se encontraron resultados', 'warning'); return; }

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
      setStatus('Encontrados ' + lastResults.length + ' registros en ' + Object.keys(grouped).length + ' agrupaciones', 'success');

    } else {
      setStatus('Error en la petición: ' + this.status, 'warning');
      console.error('Error', this.status, this.responseText);
    }
  };

  xhttp.onerror = function () { setStatus('Error de red al realizar la búsqueda', 'warning'); };
  xhttp.send();
}

function renderGroups(grouped) {
  resultsEl.innerHTML = '';
  Object.values(grouped).forEach(group => {
    const g = document.createElement('div');
    g.className = 'contenedor-actividad mb-2';
    const header = document.createElement('div');
    header.className = 'card-header custom';
    header.textContent = `${group.meta.brand || '-'} ${group.meta.subBrand || ''} (${group.meta.model || ''}) — SR: ${group.meta.srNumber || '-'} — VIN: ${group.meta.vin || '-'} `;
    g.appendChild(header);

    const body = document.createElement('div');
    body.className = 'panel-body';

    // Mostrar account
    const acc = document.createElement('p');
    acc.innerHTML = `<strong>Cuenta:</strong> ${group.meta.account || '-'}`;
    body.appendChild(acc);

    // Lista de entradas que varían
    group.entries.forEach((entry, idx) => {
      const row = document.createElement('div');
      row.className = 'item-row';
      const meta = document.createElement('div');
      meta.className = 'item-meta';
      meta.innerHTML = `<div><strong>${entry.woaNumber}</strong> <span class="small-muted">(${entry.woNumber})</span></div>
                        <div class="small-muted">Device: ${entry.deviceType || '-'} — Activity: ${entry.activity || '-'}</div>`;
      row.appendChild(meta);

      const btn = document.createElement('button');
      btn.className = 'btn btn-sm btn-outline-primary';
      btn.textContent = 'Seleccionar';
      btn.addEventListener('click', () => selectEntry(group.meta, entry));
      row.appendChild(btn);

      body.appendChild(row);
    });

    g.appendChild(body);
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
