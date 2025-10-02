// Field Service Oracle - Búsqueda de Actividades por VIN

// Estado global de la aplicación
const AppState = {
  currentData: [],
  selectedActivity: null,
  searchCache: new Map(),
  isLoading: false
};

// Configuración de la aplicación
const Config = {
  API_ENDPOINT: 'https://dev-api-sie.encontrack.com/webhook/crm/searchWoByVin',
  MIN_VIN_LENGTH: 4,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutos
  REQUEST_TIMEOUT: 30000 // 30 segundos
};

// Utilidades
const Utils = {
  // Normalizar VIN para búsqueda
  normalizeVin: (vin) => {
    return vin.toString().trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  },

  // Formatear fecha
  formatDate: (dateString) => {
    if (!dateString) return 'No especificada';
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: '2-digit'
      });
    } catch {
      return dateString;
    }
  },

  // Formatear estado
  formatStatus: (status) => {
    const statusMap = {
      'pending': 'Pendiente',
      'started': 'Iniciada',
      'complete': 'Completada',
      'cancelled': 'Cancelada'
    };
    return statusMap[status?.toLowerCase()] || status || 'Sin estado';
  },

  // Obtener clase CSS para estado
  getStatusClass: (status) => {
    const statusClasses = {
      'pending': 'pending',
      'started': 'started',
      'complete': 'complete',
      'cancelled': 'cancelled'
    };
    return statusClasses[status?.toLowerCase()] || '';
  },

  // Debounce para optimizar búsquedas
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Validar VIN
  isValidVin: (vin) => {
    const normalized = Utils.normalizeVin(vin);
    return normalized.length >= Config.MIN_VIN_LENGTH;
  }
};

// Notificaciones
const NotificationManager = {
  show: (message, type = 'info', duration = 5000) => {
    const statusArea = document.getElementById('statusArea');
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <span>${NotificationManager.getIcon(type)}</span>
      <span>${message}</span>
    `;

    statusArea.appendChild(notification);

    // Auto-remover después del tiempo especificado
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.opacity = '0';
        setTimeout(() => {
          notification.remove();
        }, 300);
      }
    }, duration);
  },

  getIcon: (type) => {
    const icons = {
      'success': '✅',
      'warning': '⚠️',
      'danger': '❌',
      'info': 'ℹ️'
    };
    return icons[type] || 'ℹ️';
  },

  clear: () => {
    const statusArea = document.getElementById('statusArea');
    statusArea.innerHTML = '';
  }
};

// Gestión de componentes de UI
const UIComponents = {
  // Crear tarjeta de actividad
  createActivityCard: (activity, index) => {
    const card = document.createElement('div');
    card.className = 'contenedor-actividad';
    card.setAttribute('data-index', index);
    
    const isSelected = AppState.selectedActivity?.aid === activity.aid;
    
    card.innerHTML = `
      <div class="activity-card ${isSelected ? 'selected' : ''}" onclick="ActivityManager.selectActivity(${index})">
        <div class="activity-header">
          <div class="activity-number">#${activity.aid || 'N/A'}</div>
          <div class="activity-status ${Utils.getStatusClass(activity.astatus)}">
            ${Utils.formatStatus(activity.astatus)}
          </div>
        </div>
        
        <div class="activity-details">
          <div class="detail-item">
            <span class="detail-icon">🚗</span>
            <span class="detail-label">VIN:</span>
            <span class="vin-code">${activity.ainventory_model || 'No especificado'}</span>
          </div>
          
          <div class="detail-item">
            <span class="detail-icon">📍</span>
            <span class="detail-label">Cliente:</span>
            <span>${activity.cname || 'No especificado'}</span>
          </div>
          
          <div class="detail-item">
            <span class="detail-icon">📅</span>
            <span class="detail-label">Fecha programada:</span>
            <span>${Utils.formatDate(activity.ddate_from)}</span>
          </div>
          
          <div class="detail-item">
            <span class="detail-icon">⏰</span>
            <span class="detail-label">Hora:</span>
            <span>${activity.ttime_from || 'No especificada'}</span>
          </div>
          
          <div class="detail-item">
            <span class="detail-icon">🔧</span>
            <span class="detail-label">Tipo:</span>
            <span>${activity.atype || 'No especificado'}</span>
          </div>
          
          ${activity.alanguage ? `
          <div class="detail-item">
            <span class="detail-icon">🌐</span>
            <span class="detail-label">Idioma:</span>
            <span>${activity.alanguage}</span>
          </div>
          ` : ''}
        </div>
      </div>
    `;
    
    return card;
  },

  // Actualizar resumen de resultados
  updateResultsSummary: (count) => {
    const resultsHeader = document.getElementById('resultsHeader');
    const resultsSummary = document.getElementById('resultsSummary');
    
    if (count > 0) {
      resultsHeader.style.display = 'flex';
      resultsSummary.innerHTML = `
        <span class="results-count">${count} actividad${count !== 1 ? 'es' : ''} encontrada${count !== 1 ? 's' : ''}</span>
      `;
    } else {
      resultsHeader.style.display = 'none';
    }
  },

  // Mostrar detalles de selección
  showSelectionDetails: (activity) => {
    const selectionArea = document.getElementById('selectionArea');
    const selectedDetails = document.getElementById('selectedDetails');
    
    selectedDetails.innerHTML = `
      <div class="detail-grid">
        <div class="detail-group">
          <div class="detail-group-label">ID Actividad</div>
          <div class="detail-group-value">#${activity.aid || 'N/A'}</div>
        </div>
        
        <div class="detail-group">
          <div class="detail-group-label">Estado</div>
          <div class="detail-group-value">${Utils.formatStatus(activity.astatus)}</div>
        </div>
        
        <div class="detail-group">
          <div class="detail-group-label">VIN del Vehículo</div>
          <div class="detail-group-value">
            <span class="vin-code">${activity.ainventory_model || 'No especificado'}</span>
          </div>
        </div>
        
        <div class="detail-group">
          <div class="detail-group-label">Cliente</div>
          <div class="detail-group-value">${activity.cname || 'No especificado'}</div>
        </div>
        
        <div class="detail-group">
          <div class="detail-group-label">Fecha Programada</div>
          <div class="detail-group-value">${Utils.formatDate(activity.ddate_from)}</div>
        </div>
        
        <div class="detail-group">
          <div class="detail-group-label">Hora</div>
          <div class="detail-group-value">${activity.ttime_from || 'No especificada'}</div>
        </div>
        
        <div class="detail-group">
          <div class="detail-group-label">Tipo de Actividad</div>
          <div class="detail-group-value">${activity.atype || 'No especificado'}</div>
        </div>
        
        ${activity.alanguage ? `
        <div class="detail-group">
          <div class="detail-group-label">Idioma</div>
          <div class="detail-group-value">${activity.alanguage}</div>
        </div>
        ` : ''}
      </div>
    `;
    
    selectionArea.style.display = 'block';
    selectionArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  // Ocultar área de selección
  hideSelectionArea: () => {
    document.getElementById('selectionArea').style.display = 'none';
  },

  // Estados de carga
  showLoading: () => {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('main-content').style.display = 'none';
    document.getElementById('error').style.display = 'none';
  },

  hideLoading: () => {
    document.getElementById('loading').style.display = 'none';
  },

  showError: (message) => {
    const errorEl = document.getElementById('error');
    errorEl.innerHTML = `<p>❌ ${message}</p>`;
    errorEl.style.display = 'block';
    document.getElementById('main-content').style.display = 'none';
  },

  hideError: () => {
    document.getElementById('error').style.display = 'none';
  },

  // Actualizar estado del botón de búsqueda
  updateSearchButton: (isLoading) => {
    const searchBtn = document.getElementById('searchBtn');
    const searchText = document.getElementById('search-text');
    
    if (isLoading) {
      searchBtn.disabled = true;
      searchText.textContent = 'Buscando...';
      searchBtn.style.opacity = '0.7';
    } else {
      searchBtn.disabled = false;
      searchText.textContent = 'Buscar';
      searchBtn.style.opacity = '1';
    }
  }
};

// Gestión de actividades
const ActivityManager = {
  // Buscar actividades por VIN
  searchActivities: async (vinFragment) => {
    const normalizedVin = Utils.normalizeVin(vinFragment);
    
    // Validación
    if (!Utils.isValidVin(normalizedVin)) {
      NotificationManager.show(
        `El VIN debe tener al menos ${Config.MIN_VIN_LENGTH} caracteres`, 
        'warning'
      );
      return;
    }

    // Verificar caché
    const cacheKey = normalizedVin;
    const cachedResult = AppState.searchCache.get(cacheKey);
    if (cachedResult && (Date.now() - cachedResult.timestamp < Config.CACHE_DURATION)) {
      ActivityManager.displayResults(cachedResult.data);
      NotificationManager.show('Resultados obtenidos desde caché', 'info', 3000);
      return;
    }

    // Iniciar búsqueda
    AppState.isLoading = true;
    UIComponents.showLoading();
    UIComponents.hideError();
    UIComponents.updateSearchButton(true);
    NotificationManager.clear();

    try {
      const response = await fetch(Config.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa('admin:admin')}`
        },
        body: JSON.stringify({ vin: normalizedVin }),
        signal: AbortSignal.timeout(Config.REQUEST_TIMEOUT)
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Validar estructura de respuesta
      if (!data || !data.result || !Array.isArray(data.result.data)) {
        throw new Error('Formato de respuesta inválido del servidor');
      }

      const activities = data.result.data;
      
      // Guardar en caché
      AppState.searchCache.set(cacheKey, {
        data: activities,
        timestamp: Date.now()
      });
      
      // Limpiar caché antiguo
      ActivityManager.cleanCache();
      
      // Mostrar resultados
      ActivityManager.displayResults(activities);
      
      if (activities.length > 0) {
        NotificationManager.show(
          `✅ Se encontraron ${activities.length} actividad${activities.length !== 1 ? 'es' : ''}`, 
          'success'
        );
      }

    } catch (error) {
      console.error('Error en búsqueda:', error);
      
      let errorMessage = 'Error de conexión. Verifique su conexión a internet.';
      
      if (error.name === 'AbortError') {
        errorMessage = 'La búsqueda tardó demasiado tiempo. Intente nuevamente.';
      } else if (error.message.includes('404')) {
        errorMessage = 'Servicio no disponible. Contacte al administrador.';
      } else if (error.message.includes('500')) {
        errorMessage = 'Error interno del servidor. Intente más tarde.';
      }
      
      UIComponents.showError(errorMessage);
      NotificationManager.show(errorMessage, 'danger');
      
    } finally {
      AppState.isLoading = false;
      UIComponents.hideLoading();
      UIComponents.updateSearchButton(false);
    }
  },

  // Mostrar resultados
  displayResults: (activities) => {
    AppState.currentData = activities;
    AppState.selectedActivity = null;
    
    const resultsContainer = document.getElementById('results');
    const mainContent = document.getElementById('main-content');
    const noResults = document.getElementById('noResults');
    
    // Limpiar contenido previo
    resultsContainer.innerHTML = '';
    UIComponents.hideSelectionArea();
    
    if (activities.length === 0) {
      mainContent.style.display = 'block';
      noResults.style.display = 'block';
      UIComponents.updateResultsSummary(0);
      return;
    }

    // Mostrar actividades
    activities.forEach((activity, index) => {
      const card = UIComponents.createActivityCard(activity, index);
      resultsContainer.appendChild(card);
    });
    
    mainContent.style.display = 'block';
    noResults.style.display = 'none';
    UIComponents.updateResultsSummary(activities.length);
  },

  // Seleccionar actividad
  selectActivity: (index) => {
    const activity = AppState.currentData[index];
    if (!activity) return;

    // Actualizar estado
    AppState.selectedActivity = activity;
    
    // Actualizar UI - remover selección previa
    document.querySelectorAll('.activity-card').forEach(card => {
      card.classList.remove('selected');
    });
    
    // Marcar nueva selección
    const selectedCard = document.querySelector(`[data-index="${index}"] .activity-card`);
    if (selectedCard) {
      selectedCard.classList.add('selected');
    }
    
    // Mostrar detalles
    UIComponents.showSelectionDetails(activity);
    
    NotificationManager.show(
      `Actividad #${activity.aid} seleccionada`, 
      'success', 
      3000
    );
  },

  // Confirmar selección
  confirmSelection: () => {
    if (!AppState.selectedActivity) {
      NotificationManager.show('No hay actividad seleccionada', 'warning');
      return;
    }

    const activity = AppState.selectedActivity;
    
    // Guardar en sessionStorage para el plugin
    sessionStorage.setItem('selectedActivity', JSON.stringify({
      aid: activity.aid,
      vinNumber: activity.ainventory_model,
      customerName: activity.cname,
      status: activity.astatus,
      date: activity.ddate_from,
      time: activity.ttime_from,
      type: activity.atype,
      language: activity.alanguage
    }));

    NotificationManager.show(
      `✅ Actividad #${activity.aid} confirmada y guardada`, 
      'success'
    );

    // Intentar integración con plugin si está disponible
    if (typeof window.openMessage === 'function') {
      try {
        window.openMessage(activity);
      } catch (error) {
        console.log('Plugin no disponible, datos guardados en sessionStorage');
      }
    }
  },

  // Limpiar selección
  clearSelection: () => {
    AppState.selectedActivity = null;
    
    // Remover selección visual
    document.querySelectorAll('.activity-card').forEach(card => {
      card.classList.remove('selected');
    });
    
    UIComponents.hideSelectionArea();
    NotificationManager.show('Selección limpiada', 'info', 2000);
  },

  // Limpiar caché antiguo
  cleanCache: () => {
    const now = Date.now();
    for (const [key, value] of AppState.searchCache.entries()) {
      if (now - value.timestamp > Config.CACHE_DURATION) {
        AppState.searchCache.delete(key);
      }
    }
  }
};

// Gestión de eventos
const EventManager = {
  // Inicializar eventos
  init: () => {
    const vinInput = document.getElementById('vinInput');
    const searchBtn = document.getElementById('searchBtn');
    const confirmBtn = document.getElementById('confirmBtn');
    const clearSelection = document.getElementById('clearSelection');
    
    // Búsqueda con Enter
    vinInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !AppState.isLoading) {
        EventManager.handleSearch();
      }
    });
    
    // Búsqueda con botón
    searchBtn.addEventListener('click', EventManager.handleSearch);
    
    // Confirmación
    confirmBtn.addEventListener('click', ActivityManager.confirmSelection);
    
    // Limpiar selección
    clearSelection.addEventListener('click', ActivityManager.clearSelection);
    
    // Búsqueda en tiempo real con debounce
    const debouncedSearch = Utils.debounce((vinFragment) => {
      if (Utils.isValidVin(vinFragment)) {
        ActivityManager.searchActivities(vinFragment);
      }
    }, 1000);
    
    vinInput.addEventListener('input', (e) => {
      const value = e.target.value.trim();
      if (value.length >= Config.MIN_VIN_LENGTH) {
        debouncedSearch(value);
      } else if (value.length === 0) {
        // Limpiar resultados si se borra el input
        document.getElementById('main-content').style.display = 'none';
        UIComponents.hideSelectionArea();
      }
    });
    
    // Formateo automático del VIN
    vinInput.addEventListener('input', (e) => {
      const normalized = Utils.normalizeVin(e.target.value);
      if (normalized !== e.target.value) {
        const cursorPos = e.target.selectionStart;
        e.target.value = normalized;
        e.target.setSelectionRange(cursorPos, cursorPos);
      }
    });
  },
  
  // Manejar búsqueda
  handleSearch: () => {
    const vinInput = document.getElementById('vinInput');
    const vinFragment = vinInput.value.trim();
    
    if (!vinFragment) {
      NotificationManager.show('Por favor ingrese una fracción de VIN', 'warning');
      vinInput.focus();
      return;
    }
    
    ActivityManager.searchActivities(vinFragment);
  }
};

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚗 Field Service Oracle - Sistema iniciado');
  
  // Inicializar eventos
  EventManager.init();
  
  // Mensaje de bienvenida
  NotificationManager.show(
    '¡Bienvenido! Ingrese una fracción de VIN para buscar actividades', 
    'info', 
    4000
  );
  
  // Focus inicial
  document.getElementById('vinInput').focus();
  
  // Información de estado en consola
  console.log('📊 Configuración:', Config);
});

// Exportar para uso global si es necesario
window.FieldServiceOracle = {
  AppState,
  ActivityManager,
  NotificationManager,
  Utils
};