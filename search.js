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
const resultsHeader = document.getElementById('resultsHeader');
const resultsSummary = document.getElementById('resultsSummary');
const noResults = document.getElementById('noResults');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const mainContent = document.getElementById('main-content');

let lastResults = [];
let currentSelection = null;

searchBtn.addEventListener('click', doSearch);
vinInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });
clearSelection.addEventListener('click', () => { 
  currentSelection = null; 
  selectionArea.style.display = 'none';
  document.querySelectorAll('.activity-card.selected').forEach(card => {
    card.classList.remove('selected');
  });
});

confirmBtn.addEventListener('click', () => {
  if (!currentSelection) return setStatus('No hay selección activa', 'warning');
  
  // Guardar en sessionStorage para compatibilidad con plugin
  sessionStorage.setItem('selectedActivity', JSON.stringify({
    srNumber: currentSelection.srNumber,
    vin: currentSelection.vin,
    brand: currentSelection.brand,
    subBrand: currentSelection.subBrand,
    model: currentSelection.model,
    account: currentSelection.account,
    woaNumber: currentSelection.woaNumber,
    woNumber: currentSelection.woNumber,
    deviceType: currentSelection.deviceType,
    activity: currentSelection.activity
  }));
  
  console.log('Registro confirmado:', currentSelection);
  setStatus('Registro confirmado: ' + (currentSelection.woaNumber || currentSelection.srNumber), 'success');
  
  // Intentar integración con plugin si está disponible
  if (typeof window.openMessage === 'function') {
    try {
      window.openMessage(currentSelection);
    } catch (error) {
      console.log('Plugin no disponible, datos guardados en sessionStorage');
    }
  }
});

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚗 Field Service Oracle - Sistema iniciado');
  vinInput.focus();
  setStatus('¡Bienvenido! Ingrese una fracción de VIN para buscar actividades', 'info');
});

function setStatus(msg, type = 'info') {
  const icons = {
    'success': '✅',
    'warning': '⚠️',
    'danger': '❌',
    'info': 'ℹ️'
  };
  
  const colors = {
    'success': '#155724',
    'warning': '#856404', 
    'danger': '#721c24',
    'info': '#0c5460'
  };
  
  const backgrounds = {
    'success': 'linear-gradient(135deg, #d4edda, #c3e6cb)',
    'warning': 'linear-gradient(135deg, #fff3cd, #fce589)',
    'danger': 'linear-gradient(135deg, #f8d7da, #f1b0b7)',
    'info': 'linear-gradient(135deg, #d1ecf1, #bee5eb)'
  };
  
  statusArea.innerHTML = `
    <div class="notification ${type}" style="
      background: ${backgrounds[type] || backgrounds.info};
      color: ${colors[type] || colors.info};
      padding: var(--spacing-md);
      border-radius: var(--radius-md);
      margin-bottom: var(--spacing-md);
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    ">
      <span>${icons[type] || icons.info}</span>
      <span>${msg}</span>
    </div>
  `;
}

function doSearch() {
  const vin = (vinInput.value || '').trim();
  if (!vin) return setStatus('Ingresa al menos una fracción de VIN', 'warning');

  setStatus('Buscando actividades...', 'info');
  resultsEl.innerHTML = '';
  selectionArea.style.display = 'none';
  loading.style.display = 'block';
  error.style.display = 'none';
  mainContent.style.display = 'none';
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
    
    loading.style.display = 'none';
    
    if (this.status >= 200 && this.status < 300) {
      let data;
      try { data = JSON.parse(this.responseText); }
      catch (e) { 
        setStatus('Respuesta inválida del servidor', 'danger'); 
        console.error(e); 
        return; 
      }

      lastResults = Array.isArray(data) ? data : [];
      if (lastResults.length === 0) { 
        mainContent.style.display = 'block';
        noResults.style.display = 'block';
        setStatus('No se encontraron resultados', 'warning'); 
        return; 
      }

      // Agrupar por srNumber, vin, brand, subBrand, model
      const grouped = {};
      lastResults.forEach(item => {
        const key = `${item.srNumber || '-'}|${item.vin || '-'}|${item.brand || '-'}|${item.subBrand || '-'}|${item.model || '-'}`;
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
        grouped[key].entries.push({ 
          woaNumber: item.woaNumber || '-', 
          deviceType: item.deviceType || '-', 
          activity: item.activity || '-', 
          woNumber: item.woNumber || '-' 
        });
      });

      renderGroups(grouped);
      
      mainContent.style.display = 'block';
      noResults.style.display = 'none';
      resultsHeader.style.display = 'flex';
      resultsSummary.innerHTML = `
        <span class="results-count">${lastResults.length} registros en ${Object.keys(grouped).length} agrupaciones</span>
      `;
      setStatus('Encontrados ' + lastResults.length + ' registros en ' + Object.keys(grouped).length + ' agrupaciones', 'success');

    } else {
      setStatus('Error en la petición: ' + this.status, 'danger');
      console.error('Error', this.status, this.responseText);
    }
  };

  xhttp.onerror = function () { 
    loading.style.display = 'none';
    setStatus('Error de red al realizar la búsqueda', 'danger'); 
  };
  
  xhttp.ontimeout = function () {
    loading.style.display = 'none';
    setStatus('Tiempo de espera agotado. Intenta nuevamente.', 'warning');
  };
  
  xhttp.timeout = 30000;
  xhttp.send();
}

function renderGroups(grouped) {
  resultsEl.innerHTML = '';
  // ensure results are inside a scrollable wrapper
  let wrapper = document.querySelector('.results-scroll');
  if (!wrapper) {
    wrapper = document.createElement('div');
    wrapper.className = 'results-scroll';
    resultsEl.appendChild(wrapper);
  } else {
    wrapper.innerHTML = '';
  }

  Object.values(grouped).forEach((group, index) => {
    const container = document.createElement('div');
    container.className = 'contenedor-actividad';
    container.setAttribute('data-activity-id', group.meta.srNumber);
    
    container.innerHTML = `
      <div class="corner-dot" title="estado"></div>
      <div class="activity-card" onclick="selectGroup(this, ${index}, ${JSON.stringify(group).replace(/"/g, '&quot;')})">
        <div class="activity-header">
          <div class="activity-number">${group.entries && group.entries[0] && group.entries[0].woNumber ? group.entries[0].woNumber : group.meta.srNumber} <span class="header-vin"> - ${group.meta.vin}</span></div>
          <div class="activity-status complete">
            ${group.entries.length} orden${group.entries.length !== 1 ? 'es' : ''}
          </div>
        </div>
        
        <div class="activity-details">

          
          <div class="detail-item">
            <span class="detail-icon">🏢</span>
            <span class="detail-label">Cliente:</span>
            <span>${group.meta.account}</span>
          </div>
          
          <div class="detail-item">
            <div class="mini-cards">
              <div class="mini-card card l-bg-blue-dark">
                <span class="icon">🚗</span>
                <div>
                  <div class="label">Marca</div>
                  <div class="value">${group.meta.brand} ${group.meta.subBrand}</div>
                </div>
              </div>

              <div class="mini-card card l-bg-green">
                <span class="icon">📅</span>
                <div>
                  <div class="label">Modelo</div>
                  <div class="value">${group.meta.model}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="detail-item">
            <span class="detail-icon">📋</span>
            <span class="detail-label">Actividades:</span>
            <span>${group.entries.map(e => e.woaNumber).join(', ')}</span>
          </div>
        </div>
      </div>
    `;
    
    wrapper.appendChild(container);
  });
}

function selectGroup(element, groupIndex, groupDataStr) {
  // Limpiar selección anterior en contenedores
  document.querySelectorAll('.contenedor-actividad').forEach(c => {
    c.classList.remove('selected');
    const card = c.querySelector('.activity-card'); if (card) card.classList.remove('selected');
  });

  // Marcar como seleccionado (tanto contenedor como card interno)
  const container = element.closest('.contenedor-actividad');
  if (container) container.classList.add('selected');
  element.classList.add('selected');
  
  // Convertir string JSON de vuelta a objeto
  const group = JSON.parse(groupDataStr.replace(/&quot;/g, '"'));
  
  // Seleccionar la primera entrada como ejemplo
  const firstEntry = group.entries[0] || {};
  
  currentSelection = Object.assign({}, group.meta, firstEntry);
  
  // Mostrar detalles de selección
  selectedDetails.innerHTML = `
    <div class="detail-grid">
      <div class="detail-group">
        <div class="detail-group-label">SR Number</div>
        <div class="detail-group-value">#${group.meta.srNumber}</div>
      </div>
      
      <div class="detail-group">
        <div class="detail-group-label">VIN del Vehículo</div>
        <div class="detail-group-value">
          <span class="vin-code">${group.meta.vin}</span>
        </div>
      </div>
      
      <div class="detail-group">
        <div class="detail-group-label">Cliente</div>
        <div class="detail-group-value">${group.meta.account}</div>
      </div>
      
      <div class="detail-group">
        <div class="detail-group-label">Marca</div>
        <div class="detail-group-value">${group.meta.brand} ${group.meta.subBrand}</div>
      </div>
      
      <div class="detail-group">
        <div class="detail-group-label">Modelo</div>
        <div class="detail-group-value">${group.meta.model}</div>
      </div>
      
      <div class="detail-group">
        <div class="detail-group-label">Órdenes de Trabajo</div>
        <div class="detail-group-value">${group.entries.length} orden(es)</div>
      </div>
    </div>
    
    ${group.entries.length > 0 ? `
      <div style="margin-top: 1rem;">
        <h6 style="color: var(--text-primary); margin-bottom: 0.5rem;">Detalles de Órdenes:</h6>
        ${group.entries.map(entry => `
          <div style="background: var(--bg-secondary); padding: 0.5rem; margin-bottom: 0.25rem; border-radius: 4px; font-size: 0.8rem;">
            <strong>WOA:</strong> ${entry.woaNumber} | 
            <strong>WO:</strong> ${entry.woNumber} | 
            <strong>Dispositivo:</strong> ${entry.deviceType} | 
            <strong>Actividad:</strong> ${entry.activity}
          </div>
        `).join('')}
      </div>
    ` : ''}
  `;
  
  selectionArea.style.display = 'block';
  selectionArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  
  setStatus(`Actividad ${firstEntry.woNumber ? '#'+firstEntry.woNumber : '#'+group.meta.srNumber} seleccionada`, 'success');
}
