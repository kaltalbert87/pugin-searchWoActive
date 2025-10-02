/**
 * Search Plugin - Modern Architecture
 * Implementa el patrón de diseño Component-Based con Design System
 * Mantiene toda la funcionalidad original
 */
"use strict";

// ===== CONFIGURACIÓN Y ESTADO =====
const AppConfig = {
  baseUrl: 'https://dev-api-sie.encontrack.com/webhook/crm/searchWoByVin',
  timeout: 30000,
  auth: 'Basic aW50ZWdyYXRvckZTTTozMGVhODc5OC0zNGFkLTQwZTgtODY4MC1hNGU2Nzc1ODYwM2E='
};

const AppState = {
  selectedActivity: null,
  searchResults: [],
  isLoading: false
};

// ===== ELEMENTOS DEL DOM =====
const Elements = {
  searchBtn: document.getElementById('searchBtn'),
  vinInput: document.getElementById('vinInput'),
  resultsEl: document.getElementById('results'),
  statusArea: document.getElementById('statusArea'),
  selectionArea: document.getElementById('selectionArea'),
  selectedDetails: document.getElementById('selectedDetails'),
  confirmBtn: document.getElementById('confirmBtn'),
  clearSelection: document.getElementById('clearSelection'),
  spinnerArea: document.getElementById('spinnerArea'),
  resultsHeader: document.getElementById('resultsHeader'),
  resultsSummary: document.getElementById('resultsSummary'),
  noResults: document.getElementById('noResults')
};

// ===== COMPONENTES UI REUTILIZABLES =====
const UIComponents = {
  /**
   * Crea una notificación moderna
   */
  createNotification(type, message) {
    const typeConfig = {
      success: { icon: 'fa-check-circle', class: 'alert-success' },
      warning: { icon: 'fa-exclamation-triangle', class: 'alert-warning' },
      danger: { icon: 'fa-times-circle', class: 'alert-danger' },
      info: { icon: 'fa-info-circle', class: 'alert-info' }
    };

    const config = typeConfig[type] || typeConfig.info;
    
    return `
      <div class="alert ${config.class} border-0 shadow-sm mb-3" style="border-radius: var(--radius-md); font-weight: 500;">
        <div class="d-flex align-items-center">
          <i class="fa-solid ${config.icon} me-2"></i>
          <span>${message}</span>
        </div>
      </div>
    `;
  },

  /**
   * Crea una tarjeta de actividad moderna
   */
  createActivityCard(activity, index) {
    const statusBadge = this.getStatusBadge(activity.woaStatus);
    
    return `
      <div class="contenedor-actividad" data-activity-id="${activity.woaNumber || ''}">
        <div class="item-row" onclick="ActivityManager.selectActivity(this, ${index})">
          <div class="item-meta">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <strong class="text-primary" style="font-size: 1rem;">${activity.woaNumber || 'N/A'}</strong>
              ${statusBadge}
            </div>
            <div class="small text-secondary mb-1">
              <i class="fa-solid fa-car me-1"></i> 
              <strong>VIN:</strong> ${this.formatVin(activity.woaVin)}
            </div>
            <div class="small text-secondary mb-1">
              <i class="fa-solid fa-building me-1"></i> 
              <strong>Cliente:</strong> ${activity.woaAccount || 'N/A'}
            </div>
            <div class="small text-secondary mb-1">
              <i class="fa-solid fa-calendar me-1"></i> 
              <strong>Fecha:</strong> ${this.formatDate(activity.woaRequestedDate)}
            </div>
            <div class="small text-secondary">
              <i class="fa-solid fa-user me-1"></i> 
              <strong>Agente:</strong> ${activity.woaAssignedAgent || 'No asignado'}
            </div>
          </div>
          <div class="text-end">
            <i class="fa-solid fa-chevron-right text-muted"></i>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Obtiene el badge de estado estilizado
   */
  getStatusBadge(status) {
    const statusConfig = {
      'pending': { text: 'Pendiente', class: 'badge-warning' },
      'started': { text: 'Iniciada', class: 'badge-info' },
      'complete': { text: 'Completada', class: 'badge-success' },
      'cancelled': { text: 'Cancelada', class: 'badge-danger' },
      'assigned': { text: 'Asignada', class: 'badge-primary' }
    };

    const config = statusConfig[status?.toLowerCase()] || { text: status || 'Sin estado', class: 'badge-secondary' };
    
    return `<span class="badge badge-pill ${config.class}">${config.text}</span>`;
  },

  /**
   * Formatea un VIN para mostrar
   */
  formatVin(vin) {
    return vin ? vin.toUpperCase() : 'N/A';
  },

  /**
   * Formatea una fecha
   */
  formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  },

  /**
   * Muestra el spinner de carga
   */
  showLoading() {
    Elements.spinnerArea.style.display = 'block';
    AppState.isLoading = true;
  },

  /**
   * Oculta el spinner de carga
   */
  hideLoading() {
    Elements.spinnerArea.style.display = 'none';
    AppState.isLoading = false;
  }
};

// ===== GESTOR DE ACTIVIDADES =====
const ActivityManager = {
  /**
   * Busca actividades por VIN
   */
  searchActivities(vinFragment) {
    if (!vinFragment || vinFragment.trim().length < 1) {
      this.showStatus('warning', 'Ingresa al menos una fracción de VIN');
      return;
    }

    UIComponents.showLoading();
    this.clearResults();
    this.clearSelection();
    
    this.showStatus('info', 'Buscando actividades...');

    const uri = `${AppConfig.baseUrl}?vin=${encodeURIComponent(vinFragment)}`;

    const xhttp = new XMLHttpRequest();
    xhttp.open('GET', uri, true);
    xhttp.setRequestHeader('Content-Type', 'application/json');
    xhttp.setRequestHeader('Authorization', AppConfig.auth);
    xhttp.timeout = AppConfig.timeout;

    xhttp.onreadystatechange = () => {
      if (xhttp.readyState !== 4) return;
      
      UIComponents.hideLoading();

      if (xhttp.status >= 200 && xhttp.status < 300) {
        let data;
        try {
          data = JSON.parse(xhttp.responseText);
        } catch (e) {
          console.error('Error parsing JSON:', e);
          this.showStatus('danger', 'Error al procesar la respuesta del servidor');
          return;
        }

        const results = Array.isArray(data) ? data : [];
        AppState.searchResults = results;
        
        if (results.length === 0) {
          this.showNoResults();
          this.showStatus('info', 'No se encontraron actividades para este VIN');
        } else {
          this.displayResults(results);
          this.showStatus('success', `Se encontraron ${results.length} actividad(es)`);
        }
      } else {
        console.error('HTTP Error:', xhttp.status, xhttp.statusText);
        this.showStatus('danger', 'Error al buscar actividades. Intenta nuevamente.');
      }
    };

    xhttp.onerror = () => {
      UIComponents.hideLoading();
      console.error('Network error');
      this.showStatus('danger', 'Error de conexión. Verifica tu conexión a internet.');
    };

    xhttp.ontimeout = () => {
      UIComponents.hideLoading();
      console.error('Request timeout');
      this.showStatus('warning', 'Tiempo de espera agotado. Intenta nuevamente.');
    };

    xhttp.send();
  },

  /**
   * Muestra los resultados de búsqueda
   */
  displayResults(results) {
    Elements.resultsEl.innerHTML = '';
    
    // Mostrar resumen
    Elements.resultsSummary.innerHTML = `
      <div class="d-flex align-items-center">
        <span class="badge-count">${results.length}</span>
        <span class="ms-2 text-secondary">${results.length === 1 ? 'actividad encontrada' : 'actividades encontradas'}</span>
      </div>
    `;
    
    // Crear tarjetas de actividades
    results.forEach((activity, index) => {
      const cardHtml = UIComponents.createActivityCard(activity, index);
      Elements.resultsEl.insertAdjacentHTML('beforeend', cardHtml);
    });
    
    Elements.resultsHeader.style.display = 'flex';
    Elements.noResults.style.display = 'none';
  },

  /**
   * Muestra mensaje de sin resultados
   */
  showNoResults() {
    Elements.resultsEl.innerHTML = '';
    Elements.resultsHeader.style.display = 'none';
    Elements.noResults.style.display = 'block';
  },

  /**
   * Limpia los resultados
   */
  clearResults() {
    Elements.resultsEl.innerHTML = '';
    Elements.resultsHeader.style.display = 'none';
    Elements.noResults.style.display = 'none';
  },

  /**
   * Selecciona una actividad
   */
  selectActivity(element, activityIndex) {
    if (!AppState.searchResults[activityIndex]) return;
    
    // Limpiar selección anterior
    document.querySelectorAll('.item-row').forEach(row => {
      row.classList.remove('selected');
    });
    
    // Marcar como seleccionado
    element.classList.add('selected');
    AppState.selectedActivity = AppState.searchResults[activityIndex];
    
    // Mostrar detalles de selección
    this.showSelectionDetails(AppState.selectedActivity);
  },

  /**
   * Muestra los detalles de la actividad seleccionada
   */
  showSelectionDetails(activity) {
    Elements.selectedDetails.innerHTML = `
      <div class="row">
        <div class="col-md-6">
          <div class="detail-item mb-3">
            <small class="text-muted d-block mb-1">Número de Orden</small>
            <strong class="text-primary">${activity.woaNumber || 'N/A'}</strong>
          </div>
          <div class="detail-item mb-3">
            <small class="text-muted d-block mb-1">VIN</small>
            <code class="text-dark bg-light px-2 py-1 rounded">${UIComponents.formatVin(activity.woaVin)}</code>
          </div>
          <div class="detail-item mb-3">
            <small class="text-muted d-block mb-1">Estado</small>
            ${UIComponents.getStatusBadge(activity.woaStatus)}
          </div>
        </div>
        <div class="col-md-6">
          <div class="detail-item mb-3">
            <small class="text-muted d-block mb-1">Cliente</small>
            <strong>${activity.woaAccount || 'N/A'}</strong>
          </div>
          <div class="detail-item mb-3">
            <small class="text-muted d-block mb-1">Fecha Solicitada</small>
            <strong>${UIComponents.formatDate(activity.woaRequestedDate)}</strong>
          </div>
          <div class="detail-item mb-3">
            <small class="text-muted d-block mb-1">Agente Asignado</small>
            <strong>${activity.woaAssignedAgent || 'No asignado'}</strong>
          </div>
        </div>
      </div>
    `;
    
    Elements.selectionArea.style.display = 'block';
    
    // Scroll suave hacia la selección
    Elements.selectionArea.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'nearest' 
    });
  },

  /**
   * Confirma la selección
   */
  confirmSelection() {
    if (!AppState.selectedActivity) {
      this.showStatus('warning', 'No hay ninguna actividad seleccionada');
      return;
    }
    
    // Log para debugging
    console.log('Actividad confirmada:', AppState.selectedActivity);
    
    this.showStatus('success', `Actividad ${AppState.selectedActivity.woaNumber} confirmada exitosamente`);
    
    // Aquí se puede agregar lógica adicional como:
    // - Enviar datos al plugin padre
    // - Cerrar la ventana
    // - Redirigir a otra página
  },

  /**
   * Limpia la selección
   */
  clearSelection() {
    document.querySelectorAll('.item-row').forEach(row => {
      row.classList.remove('selected');
    });
    
    Elements.selectionArea.style.display = 'none';
    AppState.selectedActivity = null;
  },

  /**
   * Muestra un mensaje de estado
   */
  showStatus(type, message) {
    Elements.statusArea.innerHTML = UIComponents.createNotification(type, message);
    
    // Auto-hide después de 5 segundos para mensajes de éxito
    if (type === 'success') {
      setTimeout(() => {
        const notification = Elements.statusArea.querySelector('.alert');
        if (notification) {
          notification.style.transition = 'opacity 0.5s ease';
          notification.style.opacity = '0';
          setTimeout(() => {
            if (notification.parentNode) {
              notification.remove();
            }
          }, 500);
        }
      }, 5000);
    }
  }
};

// ===== INICIALIZACIÓN Y EVENTOS =====
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Search Plugin iniciado con patrón moderno');
  
  // Configurar eventos principales
  Elements.searchBtn.addEventListener('click', () => {
    const vinFragment = Elements.vinInput.value.trim();
    ActivityManager.searchActivities(vinFragment);
  });
  
  // Buscar al presionar Enter
  Elements.vinInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const vinFragment = Elements.vinInput.value.trim();
      ActivityManager.searchActivities(vinFragment);
    }
  });
  
  // Evento de confirmación
  Elements.confirmBtn.addEventListener('click', () => {
    ActivityManager.confirmSelection();
  });
  
  // Evento de limpiar selección
  Elements.clearSelection.addEventListener('click', () => {
    ActivityManager.clearSelection();
  });
  
  // Limpiar estado inicial
  ActivityManager.clearResults();
  ActivityManager.clearSelection();
  
  console.log('✅ Eventos configurados exitosamente');
});

// ===== FUNCIONES GLOBALES PARA COMPATIBILIDAD =====
// Mantener compatibilidad con llamadas desde HTML onclick
window.ActivityManager = ActivityManager;

// Funciones legacy para compatibilidad con código existente
function doSearch() {
  const vinFragment = Elements.vinInput.value.trim();
  ActivityManager.searchActivities(vinFragment);
}

function selectItem(index) {
  const rows = document.querySelectorAll('.item-row');
  if (rows[index]) {
    ActivityManager.selectActivity(rows[index], index);
  }
}

function setStatus(msg, type = 'info') {
  ActivityManager.showStatus(type, msg);
}

// Variables legacy para compatibilidad
let lastResults = [];
let currentSelection = null;

// Mantener sincronización con el estado moderno
Object.defineProperty(window, 'lastResults', {
  get: () => AppState.searchResults,
  set: (value) => { AppState.searchResults = value; }
});

Object.defineProperty(window, 'currentSelection', {
  get: () => AppState.selectedActivity,
  set: (value) => { AppState.selectedActivity = value; }
});