/**
 * Field Service Oracle Plugin
 * Plugin para manejo de actividades de Field Service
 * Actividad: Instalación
 */
var Autorizacion;
var ulogin;
var uname;
var apptNumber;
var resourceId;
var resourceName;
var timeSlot;
var deviceType;
var activityType = null; // Inicializado como null para evitar problemas con el primer elemento
var activityStatus;
var accountName;
var vin;
var productName;
var state;
var deviceId;
var statusActivity;
var latitudeCliente;
var longitudeCliente;
var latitudeTecnico;
var longitudeTecnico;
var personaAtiendeCancelacion;
var motivoCancelacion;
var obsCancelacion;
var contactabilityNotes = '';
var activityNotes = ''
var originUrl;
var requestedDate;
var agentCai
var deviceType;
var suntech;

// Variables globales para campos de fotos
var xa_end_device;
var xa_label;
var xa_frontal;
var xa_right_side;
var xa_left_side;
var xa_local_device;
var xa_plastic_tarpaulin;
var xa_panel1;
var xa_panel2;
var xa_panel3;
var xa_odometer;
var xa_plate;
var xa_open_door_ld;
var xa_open_door_li;
var xa_spare_wheel;
var xa_back;
var xa_serie;
var xa_circulation_card;
var maxtrack;
var isGuard = false;
var cancellationStatus;
var activityId;
var visitType;
var arrivalTimeGuard = null;
var guardSchedule = null; // Variable para almacenar el horario de guardia
var resources;
var returnIni;
let tabledata




class FieldServicePlugin {
    constructor() {
        this.data = null;
        this.isLoaded = false;
        this.isLocal = !document.location.ancestorOrigins || document.location.ancestorOrigins.length === 0;
        this.isVinValidated = false;
        this.originalVin = '';
        this.currentScreen = 'main';
        this.verificationData = {};
        this.photoData = {};
        this.photoCount = 0;
        this.activityTypes = {
            'INSTALACION': 'Instalación',
            'REVISION': 'Revisión',
            'CAMBIO': 'Cambio',
            'MANTENIMIENTO': 'Mantenimiento'
        };

        console.log(`Modo detectado: ${this.isLocal ? 'Local' : 'Field Service'}`);
        this.init();
    }

    /**
     * Inicializa el plugin
     */
    init() {
        console.log('Inicializando Field Service Plugin...');
        document.addEventListener('DOMContentLoaded', () => {
            this.setupFieldService();
        });
    }

    setupFieldService() {
        if (this.isLocal) {
            console.log('Modo local detectado - cargando datos mock');
            // Cargar datos mock directamente en modo local
            this.loadData();
        } else {
            console.log('Modo Field Service detectado - inicializando plugin');
            // Usar la función initPlugin como en el archivo de referencia
            this.initPlugin();

            // Mostrar mensaje de espera
            this.showLoading(true);
            document.getElementById('main-content').style.display = 'none';
        }
    }

    initPlugin() {
        console.log('function initPlugin');
        window.addEventListener('message', this.getWebMessage.bind(this), false);

        const messageData = {
            apiVersion: 1,
            method: 'ready'
        };

        this.sendWebMessage(messageData);
    }


    showLoading(show = true) {
        let loadingDiv = document.getElementById('loading-message');

        if (show) {
            if (!loadingDiv) {
                loadingDiv = document.createElement('div');
                loadingDiv.id = 'loading-message';
                loadingDiv.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #0066cc;">
                        <div style="font-size: 18px; margin-bottom: 10px;">🔄</div>
                        <div>${this.isLocal ? 'Cargando datos...' : 'Esperando datos de Field Service...'}</div>
                    </div>
                `;
                document.body.appendChild(loadingDiv);
            }
            loadingDiv.style.display = 'block';
        } else {
            if (loadingDiv) {
                loadingDiv.style.display = 'none';
            }
        }
    }

    getOriginURL(url) {
        if (url != '') {
            if (url.indexOf("://") > -1) {
                return 'https://' + url.split('/')[2];
            } else {
                return 'https://' + url.split('/')[0];
            }
        }
        return '';
    }

    getWebMessage(event) {
        console.log('function getWebMessage:', event.data);

        // Permitir procesamiento interno de updateXA_LIST incluso en modo local
        if (this.isLocal && (!event.data || (typeof event.data === 'string' && !event.data.includes('close') && !event.data.includes('update')))) {
            console.log('Mensaje ignorado - modo local activo');
            return false;
        }

        if (typeof event.data === 'undefined') {
            return false;
        }

        if (!this._isJson(event.data)) {
            return false;
        }

        var data = JSON.parse(event.data);

        if (!data.method) {
            return false;
        }

        switch (data.method) {
            case 'open':
                this.openMessage(data);
                break;
            case 'init':
                this.initMessage(data);
                break;
            case 'close':
                console.log('Procesando cierre con datos actualizados:', data);
                // Procesar el cierre y enviar a initMessage
                this.initMessage(data);
                break;
            case 'error':
                console.log('Error recibido:', data);
                break;
            default:
                console.log('Método no reconocido:', data.method);
                break;
        }

        return true;
    }

    _isJson(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }

    openMessage(data) {
        // No ejecutar openMessage en modo local
        if (this.isLocal) {
            console.log('openMessage bloqueado - modo local activo');
            return;
        }

        console.log('Abriendo plugin con datos:', data);
        // Aquí procesarías los datos reales de Field Service
        console.log(data);


        //Autorizacion = data.securedData.Autorization;

        activityId = data.activity.aid || '';


        apptNumber = data.activity.appt_number;
        resourceId = data.resource.external_id;
        resourceName = data.resource.pname;
        timeSlot = data.activity["time_slot_label"];
        vin = data.activity["xa_car_vin"];
        accountName = data.activity.xa_wo_cuenta;
        requestedDate = data.activity.date;
        agentCai = data.activity.xa_agente_cai || '';
        returnIni = data.activity.xa_return_ini || '';

        // Poblar variables globales de fotos desde Field Service
        xa_end_device = data.activity.xa_end_device || null;
        xa_label = data.activity.xa_label || null;
        xa_frontal = data.activity.xa_frontal || null;
        xa_right_side = data.activity.xa_right_side || null;
        xa_left_side = data.activity.xa_left_side || null;
        xa_local_device = data.activity.xa_local_device || null;
        xa_plastic_tarpaulin = data.activity.xa_plastic_tarpaulin || null;
        xa_panel1 = data.activity.xa_panel1 || null;
        xa_panel2 = data.activity.xa_panel2 || null;
        xa_panel3 = data.activity.xa_panel3 || null;
        xa_odometer = data.activity.xa_odometer || null;
        xa_plate = data.activity.xa_plate || null;
        xa_open_door_ld = data.activity.xa_open_door_ld || null;
        xa_open_door_li = data.activity.xa_open_door_li || null;
        xa_spare_wheel = data.activity.xa_spare_wheel || null;
        xa_back = data.activity.xa_back || null;
        xa_serie = data.activity.xa_serie || null;
        xa_circulation_card = data.activity.xa_circulation_card || null;

        console.log('📸 Variables de fotos inicializadas desde Field Service:');
        console.log('xa_end_device:', xa_end_device);
        console.log('xa_label:', xa_label);
        console.log('xa_frontal:', xa_frontal);
        // ... (logging para debugging)

        if (data.activity.astatus === 'pending') {
            statusActivity = 'Pendiente';
        } else if (data.activity.astatus === 'started') {
            statusActivity = 'Iniciada';
        } else if (data.activity.astatus === 'complete') {
            statusActivity = 'Finalizada';
        } else if (data.activity.astatus === 'cancelled' || data.activity.astatus === 'notdone') {
            statusActivity = 'Cancelada';
        }


        if (data.activity.aworktype === 'SRV') {
            visitType = 'Unitario';
        } else if (data.activity.aworktype === 'AP') {
            visitType = 'Flotilla';
        } else if (data.activity.aworktype === 'OnCallVisit') {
            visitType = 'Guardia';
            isGuard = true;
        }


        state = data.activity.cstate || '';


        ulogin = data.user.ulogin;
        uname = data.user.uname;

        // sessionStorage.setItem('AutorizationFSM', data.securedData.AutorizationFSM);
        // sessionStorage.setItem('userFSM', ulogin);
        // sessionStorage.setItem('Autorizacion', Autorizacion);
        // sessionStorage.setItem('urlWoTracking', urlWoTracking);

        if (data.activity.xa_contactability != null) {
            this.photoCount++;
            contactabilityNotes = data.activity.xa_contactability.replace(/(\r\n|\r|\n)+/g, ', ').trim() || '';
        }

        if (data.activity.xa_note != null) {
            this.photoCount++;
            activityNotes = data.activity.xa_note.replace(/(\r\n|\r|\n)+/g, ', ').trim() || '';
        }


        if (data.activity.xa_end_device != null) {
            this.photoCount++;
            xa_end_device = data.activity.xa_end_device;
        }

        if (data.activity.xa_label != null) {
            this.photoCount++;
            xa_label = data.activity.xa_label;
        }

        if (data.activity.xa_frontal != null) {
            this.photoCount++;
            xa_frontal = data.activity.xa_frontal;
        }

        if (data.activity.xa_right_side != null) {
            this.photoCount++;
            xa_right_side = data.activity.xa_right_side;
        }

        if (data.activity.xa_left_side != null) {
            this.photoCount++;  
            xa_left_side = data.activity.xa_left_side;
        }

        if (data.activity.xa_local_device != null) {
            this.photoCount++;
            xa_local_device = data.activity.xa_local_device;
        }

        if (data.activity.xa_plastic_tarpaulin != null) {
            this.photoCount++;
            xa_plastic_tarpaulin = data.activity.xa_plastic_tarpaulin;
        }

        if (data.activity.xa_panel1 != null) {
            this.photoCount++;
            xa_panel1 = data.activity.xa_panel1;
        }

        if (data.activity.xa_panel2 != null) {
            this.photoCount++;
            xa_panel2 = data.activity.xa_panel2;
        }

        if (data.activity.xa_panel3 != null) {
            this.photoCount++;
            xa_panel3 = data.activity.xa_panel3;
        }

        if (data.activity.xa_odometer != null) {
            this.photoCount++;
            xa_odometer = data.activity.xa_odometer;
        }

        if (data.activity.xa_plate != null) {
            this.photoCount++;
            xa_plate = data.activity.xa_plate;
        }

        if (data.activity.xa_open_door_ld != null) {
            this.photoCount++;
            xa_open_door_ld = data.activity.xa_open_door_ld;
        }

        if (data.activity.xa_open_door_li != null) {
            this.photoCount++;
            xa_open_door_li = data.activity.xa_open_door_li;
        }

        if (data.activity.xa_spare_wheel != null) {
            this.photoCount++;
            xa_spare_wheel = data.activity.xa_spare_wheel;
        }

        if (data.activity.xa_back != null) {
            this.photoCount++;
            xa_back = data.activity.xa_back;
        }

        if (data.activity.xa_serie != null) {
            this.photoCount++;
            xa_serie = data.activity.xa_serie;
        }

        if (data.activity.xa_circulation_card != null) {
            
            this.photoCount++;
            xa_circulation_card = data.activity.xa_circulation_card;
        }



        if (data.activity["XA_LIST"]) {
            try {
                tabledata = JSON.parse(data.activity["XA_LIST"]);
                productName = tabledata[0]?.serviceHistory?.[0]?.Producto_c || '-';
            } catch (error) {
                console.error("Error parsing XA_LIST:", error);
                productName = '-';
            }
        } else {
            console.log("XA_LIST is null or undefined.");
            productName = '-';
        }

        latitudeCliente = data.activity.acoord_y; //latitud es positivo
        longitudeCliente = data.activity.acoord_x; // longitud es negativo

        latitudeTecnico = data.activity.latitudeTecnico;
        longitudeTecnico = data.activity.longitudeTecnico;



        obsCancelacion = data.activity.xa_observacion_cancel || '';


        // Por ahora, cargar datos mock para testing
        this.loadData();
    }

    initMessage(data) {
        console.log('function initMessage:', data);

        let messageData;
        if (data.method === 'close') {
            // Si es un cierre con datos actualizados, reenviar tal como está
            messageData = data;
            console.log('Reenviando mensaje de cierre con datos actualizados:', messageData);
        } else {
            // Mensaje de inicialización normal
            messageData = {
                apiVersion: 1,
                method: 'initEnd'
            };
        }

        // Usar la función sendWebMessage como en el archivo de referencia
        this.sendWebMessage(messageData);
    }


    sendWebMessage(data) {
        console.log("=== FUNCIÓN sendWebMessage INICIADA ===");
        console.log("data a enviar:", data);

        var originUrl = document.referrer || (document.location.ancestorOrigins && document.location.ancestorOrigins[0]) || '';
        console.log("originUrl detectado:", originUrl);

        if (originUrl) {
            var targetOrigin = this.getOriginURL(originUrl);
            console.log("targetOrigin calculado:", targetOrigin);
            console.log("=== ENVIANDO MENSAJE AL PARENT ===");
            console.log("parent.postMessage(data, targetOrigin)");

            parent.postMessage(data, targetOrigin);

            console.log("=== MENSAJE ENVIADO AL PARENT ===");
        } else {
            console.error("=== NO SE PUDO OBTENER originUrl ===");
            console.error("document.referrer:", document.referrer);
            console.error("document.location.ancestorOrigins:", document.location.ancestorOrigins);
        }
    }

    closePlugin(activityData) {
        console.log('=== FUNCIÓN closePlugin INICIADA ===');
        console.log('activityData recibido:', activityData);

        // Agregar aid automáticamente si no está presente
        if (!activityData.aid && typeof activityId !== 'undefined') {
            activityData.aid = activityId;
            console.log('aid agregado automáticamente:', activityId);
        }

        var messageData = {
            "apiVersion": 1,
            "method": "close",
            "activity": activityData,
            "backScreen": "plugin_by_label",
            "wakeupNeeded": false,
            "backPluginLabel": "wrsat"
        };

        console.log("=== ENVIANDO MENSAJE DE CIERRE A FIELD SERVICE ===");
        console.log("messageData completo:", JSON.stringify(messageData, undefined, 4));
        console.log("=== LLAMANDO sendWebMessage ===");

        this.sendWebMessage(messageData);

        console.log("=== sendWebMessage LLAMADO - PLUGIN DEBERÍA CERRAR ===");
    }

    /**
     * Simula la carga de datos desde Oracle Field Service
     * En un entorno real, esto sería una llamada a la API
     */
    async loadData() {
        try {
            this.showLoading(true);

            // Simular delay de red
            //await this.delay(100);

            // Datos de ejemplo basados en el payload proporcionado
            const mockData = tabledata || [
                {
                    "serviceHistory": [
                        {
                            "complementValidations": [],
                            "requiredInvetory": "MG1",
                            "revision": "ok",
                            "suggestedPosition": "Compartimiento limpiaparabrisas",
                            "Id": "300000373313549",
                            "RecordName": "WOA-0001061663",
                            "Actividad_c": "REVISION",
                            "Detencion_c": "NO",
                            "EstadoDeActividad_c": "Finalizado",
                            "Dispositivo_c": "4423661",
                            "Producto_Id_c": "300000016425160",
                            "Producto_c": "GNPLocaliza",
                            "Secuencia_c": 0,
                            "TipoDispositivo_c": "Primario",
                            "NoDeseaFotoDePreexistencia_c": false
                        },
                        {
                            "complementValidations": [],
                            "requiredInvetory": "MG1",
                            "suggestedPosition": "Compartimiento limpiaparabrisas",
                            "Id": "300000373313550",
                            "RecordName": "WOA-0001061664",
                            "Actividad_c": "CAMBIO",
                            "Detencion_c": "NO",
                            "EstadoDeActividad_c": "Finalizado",
                            "Dispositivo_c": "1520225078",
                            "Producto_Id_c": "300000016425160",
                            "Producto_c": "GNPLocaliza",
                            "Secuencia_c": 1,
                            "TipoDispositivo_c": "Primario"
                        }
                    ],
                    "validaSerie": "3HAMSAZR5GL364653",
                    "validadacionExitosa": "ok",
                    "InspeccionVehicular_c": false,
                    "Id": "300000083634544",
                    "Marca_c": "INTERNATIONAL",
                    "SubMarca_c": "4400",
                    "Modelo_c": "2016",
                    "Placas_c": "JU70119",
                    "Vin_c": "3HAMSAZR5GL364653",
                    "TipoVehiculoLista_c": "2",
                    "Color_c": "Blanco",
                    "validado": true
                }
            ];

            this.data = mockData[0]; // Tomamos el primer elemento

            // Inicializar variable global vin con datos mock
            if (this.data.Vin_c) {
                vin = this.data.Vin_c;
                console.log('VIN inicializado con datos mock:', vin);
            } else {
                console.warn('No se encontró Vin_c en los datos mock');
            }

            this.isLoaded = true;

            this.showLoading(false);
            this.renderData();

        } catch (error) {
            console.error('Error cargando datos:', error);
            this.showError(true);
            this.showLoading(false);
        }
    }

    /**
     * Verifica si los datos ya están validados
     */
    isDataValidated() {
        try {
            // Verificar en tabledata global
            if (tabledata) {
                if (Array.isArray(tabledata)) {
                    return tabledata.some(item => item.validado === true);
                } else if (typeof tabledata === 'object') {
                    return tabledata.validado === true;
                }
            }

            // Verificar en this.data.XA_LIST si existe
            if (this.data && this.data.XA_LIST) {
                const xaListData = JSON.parse(this.data.XA_LIST);
                if (Array.isArray(xaListData)) {
                    return xaListData.some(item => item.validado === true);
                } else if (typeof xaListData === 'object') {
                    return xaListData.validado === true;
                }
            }
        } catch (e) {
            console.log('Error verificando validación:', e);
        }

        return false;
    }

    /**
     * Renderiza los datos en la interfaz
     */
    renderData() {
        if (!this.data) {
            this.showError(true);
            return;
        }

        // Verificar si los datos ya están validados
        const isValidated = this.isDataValidated();
        console.log('Datos validados:', isValidated);

        if (isValidated) {
            // Si ya está validado, mostrar directamente el menú de actividades
            console.log('Datos ya validados - mostrando menú de actividades');
            this.showValidatedState();
        } else {
            // Si no está validado, mostrar la validación de VIN
            console.log('Datos no validados - mostrando validación de VIN');
            this.showValidationState();
        }

        // Mostrar contenido principal
        document.getElementById('main-content').style.display = 'block';
    }

    /**
     * Muestra el estado cuando los datos ya están validados
     */
    showValidatedState() {
        // Renderizar información del vehículo pero sin validación
        this.renderVehicleInfo();
        this.renderServiceHistory();

        // Inicializar VIN global y mostrar VIN real
        if (!vin && this.data && this.data.Vin_c) {
            vin = this.data.Vin_c;
            console.log('VIN inicializado en showValidatedState:', vin);
        }
        this.showRealVin();

        // Ocultar sección de validación
        const validationSection = document.querySelector('.validation-section');
        if (validationSection) {
            validationSection.style.display = 'none';
        }

        // Ocultar información del vehículo
        const vehicleInfo = document.querySelector('.vehicle-info');
        if (vehicleInfo) {
            vehicleInfo.style.display = 'none';
        }

        // Mostrar directamente el menú principal
        document.getElementById('main-menu').style.display = 'block';
        this.currentScreen = 'menu';
    }

    /**
     * Muestra el estado de validación cuando los datos no están validados
     */
    showValidationState() {
        // Renderizar información del vehículo con validación
        this.renderVehicleInfo();
        this.renderServiceHistory();

        // Inicializar VIN global y mostrar VIN enmascarado
        if (!vin && this.data && this.data.Vin_c) {
            vin = this.data.Vin_c;
            console.log('VIN inicializado en showValidationState:', vin);
        }
        this.showMaskedVin();

        // Asegurar que la sección de validación esté visible
        const validationSection = document.querySelector('.validation-section');
        if (validationSection) {
            validationSection.style.display = 'block';
        }

        // Mostrar información del vehículo
        const vehicleInfo = document.querySelector('.vehicle-info');
        if (vehicleInfo) {
            vehicleInfo.style.display = 'block';
        }

        // Ocultar menú principal
        document.getElementById('main-menu').style.display = 'none';
        this.currentScreen = 'validation';
    }

    /**
     * Renderiza la información del vehículo
     */
    renderVehicleInfo() {
        const data = this.data;

        // Guardar VIN original
        this.originalVin = data.Vin_c || '';

        // El VIN se mostrará según el estado de validación en setupVehicleInfoScreen
        // No modificar aquí para evitar conflictos con showRealVin/showMaskedVin
        console.log('VIN original guardado:', this.originalVin);
        document.getElementById('marca').textContent = data.Marca_c || '-';
        document.getElementById('submarca').textContent = data.SubMarca_c || '-';
        document.getElementById('modelo').textContent = data.Modelo_c || '-';
        document.getElementById('placas').value = data.Placas_c || '';
        document.getElementById('color').value = data.Color_c || '';

        // Poblar y configurar select de tipo de vehículo
        this.populateVehicleTypeSelect();
        const tipoSelect = document.getElementById('tipoVehiculo');
        if (tipoSelect && data.TipoVehiculoLista_c) {
            tipoSelect.value = data.TipoVehiculoLista_c;
        }

        // Configurar listeners para campos editables
        this.setupEditableFields();

        // Configurar listeners para sistema de semáforo
        this.setupSemaphoreSystem();

        // Configurar listener para validación de VIN
        this.setupVinValidation();
    }

    /**
     * Enmascara el VIN mostrando solo los últimos 7 caracteres
     */
    maskVin(vin) {
        if (!vin || vin.length < 7) {
            return vin;
        }

        const lastSeven = vin.slice(-7);
        const masked = '*'.repeat(vin.length - 7) + lastSeven;
        return masked;
    }

    /**
     * Configura los campos editables
     */
    setupEditableFields() {
        const editableFields = ['placas', 'color', 'tipoVehiculo'];

        editableFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            const originalValue = field.value;

            // Marcar como modificado cuando cambie el valor
            field.addEventListener('input', () => {
                if (field.value !== originalValue) {
                    field.classList.add('modified');
                } else {
                    field.classList.remove('modified');
                }

                // Convertir a mayúsculas automáticamente
                if (fieldId === 'placas') {
                    field.value = field.value.toUpperCase();
                }
            });

            // Guardar cambios cuando pierde el foco
            field.addEventListener('blur', () => {
                this.saveFieldChange(fieldId, field.value, originalValue);
            });

            // Manejar Enter para guardar
            field.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    field.blur(); // Esto disparará el evento blur
                }
            });
        });
    }

    /**
     * Guarda los cambios en un campo
     */
    saveFieldChange(fieldId, newValue, originalValue) {
        if (newValue !== originalValue && newValue.trim() !== '') {
            // Actualizar el dato en el objeto data
            if (fieldId === 'placas') {
                this.data.Placas_c = newValue;
            } else if (fieldId === 'color') {
                this.data.Color_c = newValue;
            } else if (fieldId === 'tipoVehiculo') {
                this.data.TipoVehiculoLista_c = newValue;
            }

            console.log(`Campo ${fieldId} actualizado: ${originalValue} → ${newValue}`);

            // En un entorno real, aquí se enviaría al servidor
            // this.updateFieldOnServer(fieldId, newValue);

            // Mostrar confirmación visual temporal
            this.showFieldUpdateConfirmation(fieldId);
        }
    }

    /**
     * Muestra confirmación visual de actualización de campo
     */
    showFieldUpdateConfirmation(fieldId) {
        const field = document.getElementById(fieldId);
        const originalBorder = field.style.borderColor;

        field.style.borderColor = 'var(--accent-color)';
        field.style.boxShadow = '0 0 0 2px rgba(0, 168, 107, 0.3)';

        setTimeout(() => {
            field.style.borderColor = originalBorder;
            field.style.boxShadow = '';
            field.classList.remove('modified');
        }, 1500);
    }
    setupVinValidation() {
        const vinInput = document.getElementById('vin-validation');
        const validateBtn = document.getElementById('validate-btn');
        const vinStatus = document.getElementById('vin-status');

        vinInput.addEventListener('input', () => {
            const inputValue = vinInput.value.toUpperCase().trim();
            vinInput.value = inputValue; // Convertir a mayúsculas automáticamente

            if (inputValue.length === 0) {
                // Campo vacío
                vinInput.className = 'validation-input';
                vinStatus.textContent = '';
                vinStatus.className = 'validation-status';
                validateBtn.disabled = true;
                this.isVinValidated = false;
            } else if (inputValue === this.originalVin) {
                // VIN correcto
                vinInput.className = 'validation-input valid';
                vinStatus.textContent = '✓ VIN validado correctamente';
                vinStatus.className = 'validation-status valid';
                validateBtn.disabled = false;
                this.isVinValidated = true;
            } else if (this.originalVin.startsWith(inputValue)) {
                // VIN parcialmente correcto
                vinInput.className = 'validation-input';
                vinStatus.textContent = `Continúe escribiendo... (${inputValue.length}/17)`;
                vinStatus.className = 'validation-status';
                validateBtn.disabled = true;
                this.isVinValidated = false;
            } else {
                // VIN incorrecto
                vinInput.className = 'validation-input invalid';
                vinStatus.textContent = '✗ VIN incorrecto. Verifique e intente nuevamente';
                vinStatus.className = 'validation-status invalid';
                validateBtn.disabled = true;
                this.isVinValidated = false;
            }
        });

        // Limpiar campo al hacer foco
        vinInput.addEventListener('focus', () => {
            if (!this.isVinValidated) {
                vinInput.select();
            }
        });
    }

    /**
     * Valida el VIN y permite continuar con el trabajo
     */
    validateVinAndContinue() {
        if (!this.isVinValidated) {
            alert('Por favor, ingrese el VIN completo y válido antes de continuar.');
            return;
        }

        // Obtener valores actuales de los campos editables
        const placas = document.getElementById('placas').value.trim();
        const color = document.getElementById('color').value.trim();
        const tipoVehiculo = document.getElementById('tipoVehiculo').value.trim();

        // Crear mensaje de confirmación con los datos actuales
        const confirmMessage = `¿Está seguro de que todos los datos están correctos?

📋 DATOS DE LA UNIDAD:
• VIN: ${this.originalVin}
• Marca: ${this.data.Marca_c || 'No especificada'}
• Submarca: ${this.data.SubMarca_c || 'No especificada'}
• Modelo: ${this.data.Modelo_c || 'No especificado'}
• Placas: ${placas || 'No especificadas'}
• Color: ${color || 'No especificado'}
• Tipo: ${this.getTipoVehiculo(tipoVehiculo) || 'No especificado'}

⚠️ Una vez confirmado, podrá proceder con las actividades de servicio.
Si necesita corregir algún dato, presione "Cancelar".`;

        // Mostrar confirmación
        if (!confirm(confirmMessage)) {
            return; // El usuario canceló, no continuar
        }

        // Guardar los datos finales
        this.saveCurrentData();

        // Marcar validación en tabledata y cerrar
        try {
            console.log('=== INICIANDO PROCESO DE VALIDACIÓN ===');
            console.log('Estado inicial - this.data:', this.data);
            console.log('Estado inicial - tabledata:', tabledata);

            if (!tabledata) {
                tabledata = this.data ? [this.data] : [];
                console.log('tabledata creado desde this.data:', tabledata);
            }

            // Obtener valores del frontend
            const placasValue = document.getElementById('placas').value.trim() || '';
            const colorValue = document.getElementById('color').value.trim() || '';
            const tipoVehiculoValue = document.getElementById('tipoVehiculo').value.trim() || '';

            console.log('Valores del frontend:', {
                placas: placasValue,
                color: colorValue,
                tipoVehiculo: tipoVehiculoValue
            });

            if (Array.isArray(tabledata)) {
                console.log('Procesando array tabledata');
                tabledata.forEach(item => {
                    // Marcar como validado
                    item.validado = true;

                    // Verificar y agregar campos faltantes
                    this.ensureVehicleFields(item, placasValue, colorValue, tipoVehiculoValue);
                });
            } else if (tabledata && typeof tabledata === 'object') {
                console.log('Procesando objeto tabledata');
                // Marcar como validado
                tabledata.validado = true;

                // Verificar y agregar campos faltantes
                this.ensureVehicleFields(tabledata, placasValue, colorValue, tipoVehiculoValue);
            }

            console.log('tabledata después de procesar:', tabledata);

            this.data.XA_LIST = JSON.stringify(tabledata);
            console.log('XA_LIST actualizado:', this.data.XA_LIST);

            var activityData = {
                "XA_LIST": this.data.XA_LIST
            };

            console.log('=== CERRANDO PLUGIN CON ACTIVITY DATA ===');
            console.log('activityData final:', activityData);
            console.log('Llamando closePlugin...');

            this.closePlugin(activityData);

            console.log('=== closePlugin LLAMADO ===');

        } catch (e) {
            console.error('Error en validación:', e);
            console.error('Stack trace:', e.stack);
            alert('Error al procesar la validación: ' + e.message);
        }

        // Registrar el evento de validación
        this.logValidationEvent();
    }

    /**
     * Verifica y agrega campos de vehículo faltantes en el item
     */
    ensureVehicleFields(item, placasValue, colorValue, tipoVehiculoValue) {
        console.log('=== VERIFICANDO CAMPOS DE VEHÍCULO ===');
        console.log('Item original:', item);
        console.log('Valores a aplicar:', { placasValue, colorValue, tipoVehiculoValue });

        // Verificar y agregar campo Placas_c
        if (!item.hasOwnProperty('Placas_c')) {
            console.log('Campo Placas_c no existe, agregando...');
            item.Placas_c = placasValue;
        } else {
            console.log('Campo Placas_c existe, actualizando valor...');
            item.Placas_c = placasValue;
        }

        // Verificar y agregar campo Color_c
        if (!item.hasOwnProperty('Color_c')) {
            console.log('Campo Color_c no existe, agregando...');
            item.Color_c = colorValue;
        } else {
            console.log('Campo Color_c existe, actualizando valor...');
            item.Color_c = colorValue;
        }

        // Verificar y agregar campo TipoVehiculoLista_c
        if (!item.hasOwnProperty('TipoVehiculoLista_c')) {
            console.log('Campo TipoVehiculoLista_c no existe, agregando...');
            item.TipoVehiculoLista_c = tipoVehiculoValue;
        } else {
            console.log('Campo TipoVehiculoLista_c existe, actualizando valor...');
            item.TipoVehiculoLista_c = tipoVehiculoValue;
        }

        console.log('Item después de verificar campos:', item);
        console.log('=== CAMPOS DE VEHÍCULO VERIFICADOS ===');
    }

    /**
     * Guarda los datos actuales finales
     */
    saveCurrentData() {
        const placas = document.getElementById('placas').value.trim();
        const color = document.getElementById('color').value.trim();
        const tipoVehiculo = document.getElementById('tipoVehiculo').value.trim();

        if (placas) {
            this.data.Placas_c = placas;
        }
        if (color) {
            this.data.Color_c = color;
        }
        if (tipoVehiculo) {
            this.data.TipoVehiculoLista_c = tipoVehiculo;
        }

        console.log('Datos finales guardados:', {
            VIN: this.originalVin,
            Placas: this.data.Placas_c,
            Color: this.data.Color_c,
            TipoVehiculo: this.data.TipoVehiculoLista_c,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Configura el sistema de semáforo para verificación
     */
    setupSemaphoreSystem() {
        // Lista COMPLETA de todos los elementos de verificación (25 elementos total)
        this.verificationItems = [
            // Iluminación
            'faros-auxiliares',           // Faros Auxiliares
            'luz-alta',                   // Faro Alto
            'luz-baja',                   // Faro Baixo
            'luz-cortesia',               // Luz de Cortesía
            'luz-reversa',                // Luz de la Cola
            'direccionales',              // Flechas
            'luces-freno',                // Luces de Freno
            'luces-advertencia',          // Luces de Advertencia (Fallos) - NUEVO
            'luz-panel-instrumentos',     // Luz del Panel de Instrumentos - NUEVO
            
            // Panel e Instrumentos
            'panel-instrumentos',         // Panel de Instrumentos - NUEVO
            'estado-tablero',             // Estado do Painel
            
            // Sistemas de Seguridad y Confort
            'alarma',                     // Alarma - NUEVO
            'aire-acondicionado',         // Aire Acondicionado Caliente/Frío - NUEVO
            'limpiaparabrisas',           // Limpiaparabrisas - NUEVO
            'bocina',                     // Bocina - NUEVO
            
            // Accesorios
            'encendedor',                 // Encendedor - NUEVO
            'sonido',                     // Sonido - NUEVO
            'reloj',                      // Reloj - NUEVO
            
            // Sistemas Mecánicos
            'transmision-automatica',     // Transmisión Automática - NUEVO
            'volante-retractil',          // Volante Retráctil - NUEVO
            
            // Sistemas Eléctricos
            'cerradura-electrica',        // Cerradura Electrica - NUEVO
            'vidrio-electrico',           // Vidrio Eléctrico
            'retrovisor-electrico',       // Retrovisor Eléctrico
            'retrovisor-manual',          // Retrovisor Manual
            
            // Interiores
            'forro-techo',                // Forro de teto/Quebra Sol
            'parabrisas'                  // Parabrisa
        ];

        // Configurar eventos para todos los botones semáforo
        const semaphoreButtons = document.querySelectorAll('.semaphore-btn');
        semaphoreButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const buttonsGroup = e.target.parentElement;
                const item = buttonsGroup.getAttribute('data-item');
                const status = e.target.getAttribute('data-status');

                // Remover clase 'selected' de todos los botones del grupo
                buttonsGroup.querySelectorAll('.semaphore-btn').forEach(btn => {
                    btn.classList.remove('selected');
                });

                // Agregar clase 'selected' al botón clickeado
                e.target.classList.add('selected');

                // Guardar la selección
                if (!this.verificationData) {
                    this.verificationData = {};
                }
                this.verificationData[item] = status;

                // Actualizar el progreso
                this.updateVerificationProgress();

                // Efecto visual de confirmación
                e.target.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    e.target.style.transform = 'scale(1)';
                }, 150);
            });
        });

        this.updateVerificationProgress();
    }






     updateVerificationProgress() {
        const totalItems = this.verificationItems.length; // Ahora serán 26 elementos
        const completedItems = Object.keys(this.verificationData).length;
        const progressPercentage = (completedItems / totalItems) * 100;

        // Actualizar texto de progreso
        const progressText = document.getElementById('verification-progress-text');
        if (progressText) {
            progressText.textContent = `${completedItems} de ${totalItems} elementos verificados`;
        }

        // Actualizar barra de progreso
        const progressFill = document.getElementById('verification-progress-fill');
        if (progressFill) {
            progressFill.style.width = `${progressPercentage}%`;
        }

        // Habilitar/deshabilitar botón de guardar
        const saveButton = document.querySelector('.verification-footer .btn-validate');
        if (saveButton) {
            saveButton.disabled = completedItems === 0;
            saveButton.textContent = completedItems === totalItems ?
                'Completar Verificación' :
                `Guardar Verificación (${completedItems}/${totalItems})`;
        }
    }



    clearVIN() {
        const vinInput = document.getElementById('vin-validation');
        const validateBtn = document.getElementById('validate-btn');
        const vinStatus = document.getElementById('vin-status');

        // Limpiar campo
        vinInput.value = '';
        vinInput.className = 'validation-input';

        // Resetear estado
        vinStatus.textContent = '';
        vinStatus.className = 'validation-status';

        // Deshabilitar botón de validación
        validateBtn.disabled = true;
        this.isVinValidated = false;

        // Enfocar el campo para continuar escribiendo
        vinInput.focus();

        console.log('Campo VIN limpiado');
    }
    showScreen(screen) {
        // Ocultar todas las pantallas
        document.getElementById('main-menu').style.display = 'none';
        document.getElementById('verification-screen').style.display = 'none';
        document.getElementById('photo-screen').style.display = 'none';
        document.getElementById('service-section').style.display = 'none';
        document.querySelector('.vehicle-info').style.display = 'none';

        // Mostrar la pantalla solicitada
        switch (screen) {
            case 'menu':
                document.getElementById('main-menu').style.display = 'block';
                break;
            case 'verificacion':
                document.getElementById('verification-screen').style.display = 'block';
                // Cargar datos previos de verificación si existen
                this.loadPreviousVerificationData();
                break;
            case 'fotos':
                document.getElementById('photo-screen').style.display = 'block';
                this.updatePhotoCounter();
                this.initializePhotoScreen();
                break;
            case 'historial':
                document.getElementById('service-section').style.display = 'block';
                break;
            case 'vehicle-info':
                document.querySelector('.vehicle-info').style.display = 'block';
                // Verificar si los datos están validados para bloquear campos
                this.setupVehicleInfoScreen();
                break;
        }

        this.currentScreen = screen;
    }

    /**
     * Configura la pantalla de información del vehículo según el estado de validación
     */
    setupVehicleInfoScreen() {
        console.log('=== CONFIGURANDO PANTALLA INFO VEHÍCULO ===');

        const isValidated = this.isDataValidated();
        console.log('¿Datos validados?', isValidated);

        // Asegurar que el VIN esté disponible
        if (!vin && this.data && this.data.Vin_c) {
            vin = this.data.Vin_c;
            console.log('VIN inicializado en setupVehicleInfoScreen:', vin);
        }

        if (isValidated) {
            console.log('Datos validados - bloqueando campos editables');
            this.lockVehicleFields();
        } else {
            console.log('Datos no validados - permitiendo edición');
            this.unlockVehicleFields();
        }
    }

    /**
     * Bloquea los campos editables cuando los datos están validados
     */
    lockVehicleFields() {
        console.log('🔒 Bloqueando campos editables...');

        // Mostrar header con botón regresar y ocultar título normal
        const vehicleInfoHeader = document.getElementById('vehicle-info-header');
        const vehicleInfoTitle = document.getElementById('vehicle-info-title');

        if (vehicleInfoHeader) {
            vehicleInfoHeader.style.display = 'flex';
            console.log('Header con botón regresar mostrado');
        }

        if (vehicleInfoTitle) {
            vehicleInfoTitle.style.display = 'none';
            console.log('Título normal ocultado');
        }

        // Mostrar VIN real cuando está validado
        this.showRealVin();
        console.log('VIN real mostrado (datos validados)');

        // Bloquear campos de entrada
        const editableFields = ['placas', 'color', 'tipoVehiculo'];
        editableFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.disabled = true;
                field.style.backgroundColor = '#f5f5f5';
                field.style.color = '#666';
                field.style.cursor = 'not-allowed';
                console.log(`Campo ${fieldId} bloqueado`);
            }
        });

        // Bloquear campo de validación VIN
        const vinInput = document.getElementById('vin-validation');
        if (vinInput) {
            vinInput.disabled = true;
            vinInput.style.backgroundColor = '#f5f5f5';
            vinInput.style.color = '#666';
            vinInput.style.cursor = 'not-allowed';
            vinInput.placeholder = 'VIN validado';
            console.log('Campo VIN bloqueado');
        }

        // Bloquear botón de validación
        const validateBtn = document.getElementById('validate-btn');
        if (validateBtn) {
            validateBtn.disabled = true;
            validateBtn.textContent = '✅ Datos Ya Validados';
            validateBtn.style.backgroundColor = '#28a745';
            validateBtn.style.cursor = 'not-allowed';
            console.log('Botón de validación bloqueado');
        }

        // Bloquear botón de limpiar VIN
        const clearVinBtn = document.getElementById('clear-vin-btn');
        if (clearVinBtn) {
            clearVinBtn.disabled = true;
            clearVinBtn.style.opacity = '0.5';
            clearVinBtn.style.cursor = 'not-allowed';
            console.log('Botón limpiar VIN bloqueado');
        }

        // Agregar mensaje informativo
        this.showValidationMessage();

        console.log('✅ Todos los campos bloqueados correctamente');
    }

    /**
     * Desbloquea los campos editables cuando los datos no están validados
     */
    unlockVehicleFields() {
        console.log('🔓 Desbloqueando campos editables...');

        // Ocultar header con botón regresar y mostrar título normal
        const vehicleInfoHeader = document.getElementById('vehicle-info-header');
        const vehicleInfoTitle = document.getElementById('vehicle-info-title');

        if (vehicleInfoHeader) {
            vehicleInfoHeader.style.display = 'none';
            console.log('Header con botón regresar ocultado');
        }

        if (vehicleInfoTitle) {
            vehicleInfoTitle.style.display = 'block';
            console.log('Título normal mostrado');
        }

        // Desbloquear campos de entrada
        const editableFields = ['placas', 'color', 'tipoVehiculo'];
        editableFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.disabled = false;
                field.style.backgroundColor = '';
                field.style.color = '';
                field.style.cursor = '';
                console.log(`Campo ${fieldId} desbloqueado`);
            }
        });

        // Desbloquear campo de validación VIN
        const vinInput = document.getElementById('vin-validation');
        if (vinInput) {
            vinInput.disabled = false;
            vinInput.style.backgroundColor = '';
            vinInput.style.color = '';
            vinInput.style.cursor = '';
            vinInput.placeholder = 'Ingrese el VIN completo para continuar';
            console.log('Campo VIN desbloqueado');
        }

        // Restaurar botón de validación
        const validateBtn = document.getElementById('validate-btn');
        if (validateBtn) {
            validateBtn.textContent = 'Validar VIN y Continuar';
            validateBtn.style.backgroundColor = '';
            validateBtn.style.cursor = '';
            console.log('Botón de validación restaurado');
        }

        // Desbloquear botón de limpiar VIN
        const clearVinBtn = document.getElementById('clear-vin-btn');
        if (clearVinBtn) {
            clearVinBtn.disabled = false;
            clearVinBtn.style.opacity = '';
            clearVinBtn.style.cursor = '';
            console.log('Botón limpiar VIN desbloqueado');
        }

        // Mostrar VIN enmascarado cuando no está validado
        this.showMaskedVin();
        console.log('VIN enmascarado mostrado (datos no validados)');

        // Remover mensaje informativo
        this.hideValidationMessage();

        console.log('✅ Todos los campos desbloqueados correctamente');
    }

    /**
     * Muestra mensaje informativo cuando los datos están validados
     */
    /* showValidationMessage() {
         // Verificar si ya existe el mensaje
         let messageDiv = document.getElementById('validation-info-message');
         
         if (!messageDiv) {
             messageDiv = document.createElement('div');
             messageDiv.id = 'validation-info-message';
             messageDiv.className = 'validation-info-message';
             messageDiv.innerHTML = `
                 <div class="info-icon">✅</div>
                 <div class="info-content">
                     <strong>Datos Ya Validados</strong>
                     <p>Los datos de este vehículo ya han sido validados y no pueden ser modificados. Para hacer cambios, contacte al supervisor.</p>
                 </div>
             `;
             
             // Insertar después del header de la sección vehicle-info
             const vehicleInfo = document.querySelector('.vehicle-info');
             const header = vehicleInfo.querySelector('h2');
             if (header && header.parentNode) {
                 header.parentNode.insertBefore(messageDiv, header.nextSibling);
             }
         }
         
         messageDiv.style.display = 'flex';
         console.log('Mensaje informativo mostrado');
     }*/

    /**
     * Oculta mensaje informativo
     */
    hideValidationMessage() {
        const messageDiv = document.getElementById('validation-info-message');
        if (messageDiv) {
            messageDiv.style.display = 'none';
            console.log('Mensaje informativo ocultado');
        }
    }

    /**
     * Convierte nombres de kebab-case a camelCase
     * Ejemplo: 'faros-auxiliares' -> 'farosAuxiliares'
     */
    convertToCamelCase(str) {
        return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
    }

    /**
     * Convierte nombres de camelCase a kebab-case
     * Ejemplo: 'farosAuxiliares' -> 'faros-auxiliares'
     */
    convertToKebabCase(str) {
        return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    }

    /**
     * Carga datos previos de verificación desde returnIni
     */
    loadPreviousVerificationData() {
        console.log('=== CARGANDO DATOS PREVIOS DE VERIFICACIÓN ===');
        console.log('returnIni global:', returnIni);

        if (!returnIni || returnIni.trim() === '') {
            console.log('No hay datos previos de verificación');
            return;
        }

        try {
            // Parsear el JSON de returnIni
            const previousData = JSON.parse(returnIni);
            console.log('Datos previos parseados:', previousData);

            // Mapeo inverso de estados (Field Service -> UI)
            const reverseStateMapping = {
                'ok': 'bueno',
                'broken': 'regular',
                'not_present': 'malo'
            };

            // Limpiar datos de verificación actual
            this.verificationData = {};

            // Procesar cada campo del returnIni
            Object.entries(previousData).forEach(([fieldName, fieldValue]) => {
                console.log(`Procesando campo: ${fieldName} = ${fieldValue}`);

                // Convertir camelCase a kebab-case para encontrar el elemento
                const kebabCaseField = this.convertToKebabCase(fieldName);
                console.log(`Campo convertido a kebab-case: ${kebabCaseField}`);

                // Mapear el valor al estado de UI
                const uiState = reverseStateMapping[fieldValue] || fieldValue;
                console.log(`Estado mapeado: ${uiState}`);

                // Verificar si el campo existe en los elementos de verificación
                if (this.verificationItems.includes(kebabCaseField)) {
                    // Actualizar datos de verificación
                    this.verificationData[kebabCaseField] = uiState;

                    // Actualizar interfaz visual
                    this.setVerificationUIState(kebabCaseField, uiState);

                    console.log(`Campo ${kebabCaseField} configurado a ${uiState}`);
                } else {
                    console.warn(`Campo ${kebabCaseField} no encontrado en elementos de verificación`);
                }
            });

            // Actualizar progreso
            this.updateVerificationProgress();

            console.log('=== DATOS PREVIOS CARGADOS EXITOSAMENTE ===');
            console.log('verificationData actualizado:', this.verificationData);

        } catch (error) {
            console.error('Error cargando datos previos de verificación:', error);
            console.error('returnIni problemático:', returnIni);
        }
    }

    /**
     * Establece el estado visual de un elemento de verificación
     */
    setVerificationUIState(item, state) {
        // Encontrar el grupo de botones para este elemento
        const buttonsGroup = document.querySelector(`[data-item="${item}"]`);
        if (!buttonsGroup) {
            console.warn(`No se encontró grupo de botones para ${item}`);
            return;
        }

        // Remover selección actual de todos los botones
        buttonsGroup.querySelectorAll('.semaphore-btn').forEach(btn => {
            btn.classList.remove('selected');
        });

        // Seleccionar el botón correcto
        const targetButton = buttonsGroup.querySelector(`[data-status="${state}"]`);
        if (targetButton) {
            targetButton.classList.add('selected');
            console.log(`Botón ${state} seleccionado para ${item}`);
        } else {
            console.warn(`No se encontró botón con estado ${state} para ${item}`);
        }
    }

    /**
     * Mapea los estados de verificación a valores para Field Service
     */
    mapVerificationState(state) {
        const stateMapping = {
            'bueno': 'ok',           // Verde
            'regular': 'broken',     // Amarillo  
            'malo': 'not_present'    // Rojo
        };
        return stateMapping[state] || state;
    }

    /**
     * Genera el payload xa_return_ini con los datos de verificación
     */
    generateVerificationPayload() {
        const payload = {};

        // Convertir cada elemento verificado al formato requerido
        Object.entries(this.verificationData).forEach(([item, status]) => {
            // Convertir nombre del campo a camelCase
            const camelCaseField = this.convertToCamelCase(item);
            payload[camelCaseField] = this.mapVerificationState(status);
        });

        console.log('Payload xa_return_ini generado (camelCase):', payload);
        return payload;
    }

    /**
     * Guarda los datos de verificación
     */
    saveVerification() {
        const totalItems = this.verificationItems.length;
        const completedItems = this.verificationData ? Object.keys(this.verificationData).length : 0;

        // Verificar que todos los elementos sean obligatorios
        if (completedItems < totalItems) {
            const missing = totalItems - completedItems;
            alert(`⚠️ VERIFICACIÓN INCOMPLETA\n\nTodos los elementos son OBLIGATORIOS.\nDebe completar TODOS los elementos para continuar.\n\nFaltan: ${missing} elemento(s) por verificar\nCompletados: ${completedItems} de ${totalItems}\n\nPor favor, complete la verificación de todos los elementos antes de continuar.`);
            return;
        }

        // Contar por tipo de estado
        const statusCount = {
            bueno: 0,
            regular: 0,
            malo: 0
        };

        Object.values(this.verificationData).forEach(status => {
            statusCount[status]++;
        });

        // Verificar si hay elementos marcados como "malo"
        const badItems = Object.entries(this.verificationData)
            .filter(([item, status]) => status === 'malo')
            .map(([item, status]) => item);

        let message = `✅ VERIFICACIÓN COMPLETA
        
📊 Resumen Final:
• ${completedItems} de ${totalItems} elementos verificados
• ${statusCount.bueno} en buen estado 🟢
• ${statusCount.regular} en estado regular 🟡
• ${statusCount.malo} en mal estado 🔴`;

        if (badItems.length > 0) {
            message += `\n\n⚠️ ATENCIÓN: Los siguientes elementos requieren atención especial:\n• ${badItems.join('\n• ')}`;
        }

        message += `\n\n¿Desea enviar la verificación a Field Service?`;

        if (confirm(message)) {
            try {
                console.log('=== INICIANDO PROCESO DE VERIFICACIÓN ===');
                console.log('Datos de verificación:', this.verificationData);

                // Generar payload para Field Service
                const verificationPayload = this.generateVerificationPayload();

                // Crear activityData solo con xa_return_ini
                const activityData = {
                    "xa_return_ini": JSON.stringify(verificationPayload)
                };

                console.log('=== ENVIANDO VERIFICACIÓN A FIELD SERVICE ===');
                console.log('activityData:', activityData);

                // Enviar a Field Service
                this.closePlugin(activityData);

                console.log('=== VERIFICACIÓN ENVIADA ===');

            } catch (e) {
                console.error('Error enviando verificación:', e);
                console.error('Stack trace:', e.stack);
                alert('Error al enviar la verificación: ' + e.message + '\n\nPor favor, intente nuevamente.');
            }
        }
    }

    /**
     * Lista de tipos de fotos requeridas con sus campos de Field Service
     */
    getPhotoTypes() {
        return [
            { name: 'Equipo', field: 'xa_end_device', id: 'equipo' },
            { name: 'Etiqueta', field: 'xa_label', id: 'etiqueta' },
            { name: 'Frente', field: 'xa_frontal', id: 'frente' },
            { name: 'Lateral Derecho', field: 'xa_right_side', id: 'lateral-derecho' },
            { name: 'Lateral Izquierdo', field: 'xa_left_side', id: 'lateral-izquierdo' },
            { name: 'Local de Equipo', field: 'xa_local_device', id: 'local-equipo' },
            { name: 'Lona Plástica', field: 'xa_plastic_tarpaulin', id: 'lona-plastica' },
            { name: 'Panel 1', field: 'xa_panel1', id: 'panel1' },
            { name: 'Panel 2', field: 'xa_panel2', id: 'panel2' },
            { name: 'Panel 3', field: 'xa_panel3', id: 'panel3' },
            { name: 'Panel 4', field: 'xa_odometer', id: 'panel4' },
            { name: 'Placa', field: 'xa_plate', id: 'placa' },
            { name: 'Puerta Abierta LD', field: 'xa_open_door_ld', id: 'puerta-ld' },
            { name: 'Puerta Abierta LI', field: 'xa_open_door_li', id: 'puerta-li' },
            { name: 'Repuesto', field: 'xa_spare_wheel', id: 'repuesto' },
            { name: 'Trasera', field: 'xa_back', id: 'trasera' },
            { name: 'VIN Number', field: 'xa_serie', id: 'vin-number' },
            { name: 'Tarjeta Circulação', field: 'xa_circulation_card', id: 'tarjeta-circulacao' }
        ];
    }

    /**
     * Tomar una foto real usando la cámara del dispositivo
     */
    async takePhoto(photoId) {
        console.log('=== TOMANDO FOTO REAL ===');
        console.log('Photo ID:', photoId);

        const photoTypes = this.getPhotoTypes();
        const photoType = photoTypes.find(type => type.id === photoId);

        if (!photoType) {
            console.error('Tipo de foto no encontrado:', photoId);
            alert('Error: Tipo de foto no encontrado');
            return;
        }

        const photoPlaceholder = document.getElementById(`foto-${photoId}`);
        if (!photoPlaceholder) {
            console.error('Elemento de foto no encontrado:', `foto-${photoId}`);
            alert('Error: Elemento de interfaz no encontrado');
            return;
        }

        const button = photoPlaceholder.querySelector('.btn-photo');
        if (!button) {
            console.error('Botón de foto no encontrado para:', photoId);
            return;
        }

        try {
            // Verificar si el navegador soporta la cámara
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('La cámara no está disponible en este dispositivo/navegador');
            }

            button.disabled = true;
            button.textContent = 'Abriendo cámara...';

            // Abrir la cámara
            await this.openCameraForPhoto(photoType, photoPlaceholder, button);

        } catch (error) {
            console.error('Error capturando foto:', error);

            // Restaurar botón
            button.disabled = false;
            button.textContent = 'Tomar Foto';

            // Mostrar error específico al usuario
            if (error.name === 'NotAllowedError') {
                alert('❌ PERMISOS DE CÁMARA\n\nPor favor, permita el acceso a la cámara para tomar fotos.\n\nVaya a configuración del navegador y active los permisos de cámara para este sitio.');
            } else if (error.name === 'NotFoundError') {
                alert('❌ CÁMARA NO ENCONTRADA\n\nNo se detectó ninguna cámara en este dispositivo.');
            } else if (error.name === 'NotSupportedError') {
                alert('❌ CÁMARA NO COMPATIBLE\n\nLa cámara no es compatible con este navegador.');
            } else {
                // Fallback: Usar input file como alternativa
                this.fallbackFileInput(photoType, photoPlaceholder, button);
            }
        }
    }

    /**
     * Abre la cámara y captura la foto
     */
    async openCameraForPhoto(photoType, photoPlaceholder, button) {
        return new Promise((resolve, reject) => {
            // Crear modal de cámara
            const cameraModal = this.createCameraModal(photoType.name);
            document.body.appendChild(cameraModal);

            const video = cameraModal.querySelector('#camera-video');
            const canvas = cameraModal.querySelector('#camera-canvas');
            const captureBtn = cameraModal.querySelector('#capture-btn');
            const cancelBtn = cameraModal.querySelector('#cancel-btn');
            const retakeBtn = cameraModal.querySelector('#retake-btn');
            const confirmBtn = cameraModal.querySelector('#confirm-btn');

            let stream = null;
            let photoDataUrl = null;

            // Configurar constraints de la cámara
            const constraints = {
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'environment' // Usar cámara trasera si está disponible
                }
            };

            // Abrir cámara
            navigator.mediaDevices.getUserMedia(constraints)
                .then(mediaStream => {
                    stream = mediaStream;
                    video.srcObject = stream;
                    video.style.display = 'block';
                    captureBtn.style.display = 'block';
                })
                .catch(error => {
                    this.closeCameraModal(cameraModal, stream);
                    reject(error);
                });

            // Capturar foto
            captureBtn.onclick = () => {
                const context = canvas.getContext('2d');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                // Dibujar frame del video en el canvas
                context.drawImage(video, 0, 0);

                // Obtener datos de la imagen
                photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);

                // Ocultar video y mostrar preview
                video.style.display = 'none';
                canvas.style.display = 'block';
                captureBtn.style.display = 'none';
                retakeBtn.style.display = 'block';
                confirmBtn.style.display = 'block';
            };

            // Retomar foto
            retakeBtn.onclick = () => {
                video.style.display = 'block';
                canvas.style.display = 'none';
                captureBtn.style.display = 'block';
                retakeBtn.style.display = 'none';
                confirmBtn.style.display = 'none';
                photoDataUrl = null;
            };

            // Confirmar foto
            confirmBtn.onclick = () => {
                if (photoDataUrl) {
                    this.savePhotoData(photoType, photoDataUrl, photoPlaceholder, button);
                    this.closeCameraModal(cameraModal, stream);
                    resolve();
                }
            };

            // Cancelar
            cancelBtn.onclick = () => {
                this.closeCameraModal(cameraModal, stream);
                button.disabled = false;
                button.textContent = 'Tomar Foto';
                reject(new Error('Usuario canceló la captura'));
            };
        });
    }

    /**
     * Crea el modal de la cámara
     */
    createCameraModal(photoTypeName) {
        const modal = document.createElement('div');
        modal.className = 'camera-modal';
        modal.innerHTML = `
            <div class="camera-container">
                <div class="camera-header">
                    <h3>📷 Capturar: ${photoTypeName}</h3>
                </div>
                <div class="camera-preview">
                    <video id="camera-video" autoplay playsinline></video>
                    <canvas id="camera-canvas" style="display: none;"></canvas>
                </div>
                <div class="camera-controls">
                    <button id="cancel-btn" class="btn btn-cancel">Cancelar</button>
                    <button id="capture-btn" class="btn btn-primary" style="display: none;">📷 Capturar</button>
                    <button id="retake-btn" class="btn btn-warning" style="display: none;">🔄 Retomar</button>
                    <button id="confirm-btn" class="btn btn-success" style="display: none;">✅ Confirmar</button>
                </div>
            </div>
        `;

        // Agregar estilos CSS para el modal
        const style = document.createElement('style');
        style.textContent = `
            .camera-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            }
            .camera-container {
                background: white;
                border-radius: 12px;
                padding: 20px;
                max-width: 90vw;
                max-width: 90vh;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            .camera-header h3 {
                margin: 0 0 15px 0;
                color: #333;
            }
            .camera-preview {
                border: 2px solid #ddd;
                border-radius: 8px;
                overflow: hidden;
                margin-bottom: 15px;
            }
            #camera-video, #camera-canvas {
                max-width: 400px;
                max-height: 300px;
                width: 100%;
                height: auto;
            }
            .camera-controls {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
                justify-content: center;
            }
            .camera-controls .btn {
                padding: 10px 20px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
            }
            .btn-cancel { background: #dc3545; color: white; }
            .btn-primary { background: #007bff; color: white; }
            .btn-warning { background: #ffc107; color: black; }
            .btn-success { background: #28a745; color: white; }
        `;
        modal.appendChild(style);

        return modal;
    }

    /**
     * Cierra el modal de cámara y libera recursos
     */
    closeCameraModal(modal, stream) {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        if (modal && modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
    }

    /**
     * Fallback: usar input file si la cámara no funciona
     */
    fallbackFileInput(photoType, photoPlaceholder, button) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment'; // Intentar usar cámara

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.savePhotoData(photoType, event.target.result, photoPlaceholder, button);
                };
                reader.readAsDataURL(file);
            } else {
                button.disabled = false;
                button.textContent = 'Tomar Foto';
            }
        };

        input.click();
    }

    /**
     * Guarda los datos de la foto capturada
     */
    savePhotoData(photoType, photoDataUrl, photoPlaceholder, button) {
        // Marcar como capturada
        photoPlaceholder.classList.add('captured');
        const photoIcon = photoPlaceholder.querySelector('.photo-icon');
        if (photoIcon) {
            photoIcon.textContent = '✅';
        }
        button.textContent = 'Foto Tomada';
        button.style.background = 'var(--success-color)';
        button.disabled = false; // Permitir retomar si es necesario

        // Crear preview pequeño de la foto
        const preview = document.createElement('img');
        preview.src = photoDataUrl;
        preview.style.cssText = 'width: 50px; height: 50px; object-fit: cover; border-radius: 4px; margin-top: 5px;';

        // Remover preview anterior si existe
        const existingPreview = photoPlaceholder.querySelector('.photo-preview');
        if (existingPreview) {
            existingPreview.remove();
        }

        preview.className = 'photo-preview';
        photoPlaceholder.appendChild(preview);

        // Generar datos de la foto
        const photoData = {
            timestamp: new Date().toISOString(),
            photoType: photoType.name,
            fieldName: photoType.field,
            photoId: photoType.id,
            status: 'captured',
            photoData: photoDataUrl, // Foto real en base64
            metadata: {
                size: photoDataUrl.length,
                format: 'JPEG'
            }
        };

        // Guardar datos de la foto con el campo de Field Service
        this.photoData[photoType.field] = photoData;

        // Actualizar contador solo si es una foto nueva
        if (!photoPlaceholder.dataset.counted) {
            this.photoCount++;
            photoPlaceholder.dataset.counted = 'true';
        }

        this.updatePhotoCounter();

        console.log(`Foto ${photoType.name} capturada para campo ${photoType.field}`);
        console.log('Datos de foto:', photoData);

        // Enviar foto inmediatamente a Field Service
        this.sendSinglePhotoToFieldService(photoType.field, photoData)
            .then(result => {
                if (result.success) {
                    console.log(`✅ Foto ${photoType.name} enviada a Field Service exitosamente`);
                    // Opcional: Mostrar notificación visual de éxito
                    this.showPhotoUploadNotification(photoType.name, 'success');
                } else {
                    console.error(`❌ Error enviando foto ${photoType.name}:`, result.message);
                    this.showPhotoUploadNotification(photoType.name, 'error', result.message);
                }
            })
            .catch(error => {
                console.error(`❌ Error enviando foto ${photoType.name}:`, error);
                this.showPhotoUploadNotification(photoType.name, 'error', error.message);
            });
    }

    /**
     * Genera datos simulados de foto (en producción sería la foto real)
     */
    generatePhotoData(photoType) {
        return {
            timestamp: new Date().toISOString(),
            photoType: photoType.name,
            fieldName: photoType.field,
            photoId: photoType.id,
            status: 'captured',
            // En producción aquí iría la foto real en base64 o URL
            photoData: `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//gA7Q1JFQVRPUjogZ2QtanBlZyB2MS4wICh1c2luZyBJSkcgSlBFRyB2NjIpLCBxdWFsaXR5ID0gOTAK/9sAQwADAgIDAgIDAwMDBAMDBAUIBQUEBAUKBwcGCAwKDAwLCgsLDQ4SEA0OEQ4LCxAWEBETFBUVFQwPFxgWFBgSFBUU/9sAQwEDBAQFBAUJBQUJFA0LDRQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQU/8AAEQgAyADIAwERAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMEAgEDAwQCBQkJBAMAAQIDEQQSITEFQVFhEyJxgZEUMqGxwdHhByNS8P/EABYBAQEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA==`,
            metadata: {
                width: 1920,
                height: 1080,
                size: 2048576, // 2MB simulado
                format: 'JPEG'
            }
        };
    }

    /**
     * Actualiza el contador de fotos
     */
    updatePhotoCounter() {
        const totalPhotos = this.getPhotoTypes().length; // 18 fotos totales
        const counter = document.getElementById('photo-count');
        const totalCounter = document.getElementById('photo-total');
        const completeButton = document.getElementById('complete-photos');
        const progressText = document.getElementById('photo-progress-text');
        const progressFill = document.getElementById('photo-progress-fill');

        if (counter) {
            counter.textContent = this.photoCount;
        }

        if (totalCounter) {
            totalCounter.textContent = totalPhotos;
        }

        if (progressText) {
            progressText.textContent = `${this.photoCount} de ${totalPhotos} fotos capturadas`;
        }

        if (progressFill) {
            const progressPercentage = (this.photoCount / totalPhotos) * 100;
            progressFill.style.width = `${progressPercentage}%`;

            // Cambiar color según progreso
            if (progressPercentage === 100) {
                progressFill.style.backgroundColor = 'var(--success-color)';
            } else if (progressPercentage >= 50) {
                progressFill.style.backgroundColor = 'var(--warning-color)';
            } else {
                progressFill.style.backgroundColor = 'var(--oracle-blue)';
            }
        }

        if (completeButton) {
            // Habilitar botón siempre (permitir envíos parciales)
            completeButton.disabled = false;
            completeButton.textContent = this.photoCount === totalPhotos ?
                'Guardar Fotos' :
                `Guardar Fotos (${this.photoCount}/${totalPhotos})`;
        }
    }

    /**
     * Genera el payload de fotos para Field Service (usando el patrón del pluginMaster)
     */
    generatePhotosPayload() {
        const payload = {};

        // Filtrar solo las fotos NUEVAS (no las existentes) para enviar a Field Service
        const newPhotosOnly = Object.entries(this.photoData).filter(([fieldName, photoData]) => {
            return photoData.status !== 'existing';
        });

        console.log(`📊 Generando payload de fotos: ${newPhotosOnly.length} fotos nuevas de ${Object.keys(this.photoData).length} totales`);

        // Agregar cada foto NUEVA capturada al payload usando el patrón real de Field Service
        newPhotosOnly.forEach(([fieldName, photoData]) => {
            // Convertir base64 a blob como lo hace pluginMaster
            const blob = this.dataURLtoBlob(photoData.photoData);
            const fileName = `${fieldName}.jpg`;

            // Usar el mismo formato que pluginMaster: objeto con fileName y fileContents
            payload[fieldName] = {
                fileName: fileName,
                fileContents: blob
            };

            console.log(`📸 Añadiendo foto NUEVA al payload: ${fieldName} (${photoData.photoType})`);
        });

        // Mostrar fotos excluidas (existentes)
        const existingPhotos = Object.entries(this.photoData).filter(([fieldName, photoData]) => {
            return photoData.status === 'existing';
        });

        if (existingPhotos.length > 0) {
            console.log(`⚠️ Fotos EXISTENTES excluidas del payload: ${existingPhotos.length}`);
            existingPhotos.forEach(([fieldName, photoData]) => {
                console.log(`  • ${fieldName} (${photoData.photoType}) - ya existe en Field Service`);
            });
        }

        console.log('Payload de fotos generado (formato pluginMaster):', payload);
        console.log(`🎯 RESUMEN: Enviando ${Object.keys(payload).length} fotos nuevas, excluyendo ${existingPhotos.length} existentes`);
        return payload;
    }

    /**
     * Convierte dataURL (base64) a Blob como lo hace pluginMaster
     */
    dataURLtoBlob(dataURL) {
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);

        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }

        return new Blob([u8arr], { type: mime });
    }

    /**
     * Completa la sesión de fotos y envía a Field Service
     */
    completePhotos() {
        // Calcular total de fotos requeridas (solo las que no están ocultas)
        const allPhotoTypes = this.getPhotoTypes();
        const visiblePhotoTypes = allPhotoTypes.filter(photoType => {
            const photoElement = document.getElementById(`foto-${photoType.id}`);
            const photoItem = photoElement?.closest('.photo-item');
            return photoItem && photoItem.style.display !== 'none';
        });

        const totalRequiredPhotos = allPhotoTypes.length;
        const capturedPhotos = Object.keys(this.photoData).length;

        console.log(`📊 Estado de fotos: ${capturedPhotos} capturadas de ${totalRequiredPhotos} requeridas`);
        console.log('Fotos visibles requeridas:', visiblePhotoTypes.map(p => p.name));
        console.log('Fotos ya capturadas:', Object.keys(this.photoData));

        // Permitir envío parcial - verificar si hay al menos una foto nueva para enviar
        const newPhotosOnly = Object.entries(this.photoData).filter(([fieldName, photoData]) => {
            return photoData.status !== 'existing';
        });

        if (newPhotosOnly.length === 0) {
            alert(`📸 SIN FOTOS NUEVAS\n\nNo hay fotos nuevas para enviar.\nTodas las fotos ya existen en Field Service.\n\nPuede tomar fotos adicionales o cerrar la actividad.`);
            return;
        }

  
let message = '';
        // Mostrar información sobre envío parcial si no están todas las fotos
        if (this.photoCount < totalRequiredPhotos) {
            const missing = totalRequiredPhotos - this.photoCount;
            const missingTypes = this.getMissingPhotoTypes().filter(type => {
                const photoType = allPhotoTypes.find(pt => pt.name === type);
                if (!photoType) return false;
                const photoElement = document.getElementById(`foto-${photoType.id}`);
                const photoItem = photoElement?.closest('.photo-item');
                return photoItem && photoItem.style.display !== 'none';
            });

            message = confirm(`📸 ENVÍO PARCIAL DE FOTOS\n\n✅ Fotos capturadas: ${this.photoCount} de ${totalRequiredPhotos}\n⚠️ Fotos faltantes: ${missing}\n\nFotos pendientes:\n• ${missingTypes.join('\n• ')}\n\n¿Desea enviar solo las fotos capturadas hasta ahora?`);
            
            if (!message) {
                return;
            }
        }
        
        if(this.photoCount === totalRequiredPhotos){
                    // Mostrar resumen de fotos capturadas
        const capturedTypes = Object.values(this.photoData).map(photo => photo.photoType);
        const existingPhotosCount = allPhotoTypes.length - totalRequiredPhotos;

        message = confirm(`📸 FOTOS COMPLETADAS

        ✅ ${this.photoCount - existingPhotosCount} fotos capturadas
        ${existingPhotosCount > 0 ? `✓ ${existingPhotosCount} fotos ya existían en Field Service\n` : ''}

        📋 Total de fotos requeridas: ${allPhotoTypes.length}

        ¿Desea finalizar y guardar las fotos?`);




            if (!message) {
                return;
            }

        }

        


        if (message) {
            try {
                console.log('=== ENVIANDO FOTOS A FIELD SERVICE ===');
                console.log('Datos de fotos capturadas:', this.photoData);

                // Generar payload de fotos usando el formato del pluginMaster
                const photosPayload = this.generatePhotosPayload();

                // Crear activityData siguiendo el patrón del pluginMaster
                const activityData = {
                    aid: activityId, // Agregar aid como en pluginMaster
                    ...photosPayload
                };

                console.log('=== ENVIANDO FOTOS A FIELD SERVICE (FORMATO PLUGINMASTER) ===');
                console.log('activityData con fotos:', activityData);
                console.log('Número de fotos a enviar:', Object.keys(photosPayload).length);

                // Mostrar detalles de cada foto
                Object.entries(photosPayload).forEach(([fieldName, photoObj]) => {
                    console.log(`Foto ${fieldName}:`, {
                        fileName: photoObj.fileName,
                        blobSize: photoObj.fileContents.size,
                        blobType: photoObj.fileContents.type
                    });
                });

                // Enviar a Field Service usando el mismo método que pluginMaster
                this.closePlugin(activityData);

                console.log('=== FOTOS ENVIADAS EXITOSAMENTE ===');

            } catch (e) {
                console.error('Error enviando fotos:', e);
                console.error('Stack trace:', e.stack);
                alert('Error al enviar las fotos: ' + e.message + '\n\nPor favor, intente nuevamente.');
            }
        }
    }

    /**
     * Obtiene la lista de tipos de fotos faltantes
     */
    getMissingPhotoTypes() {
        const allTypes = this.getPhotoTypes();
        const capturedFields = Object.keys(this.photoData);

        return allTypes
            .filter(type => !capturedFields.includes(type.field))
            .map(type => type.name);
    }

    /**
     * Inicializa la pantalla de fotos
     */
    initializePhotoScreen() {
        console.log('=== INICIALIZANDO PANTALLA DE FOTOS ===');

        // Cargar fotos existentes desde Field Service al inicializar
        this.loadExistingPhotos();

        // Verificar si ya hay fotos capturadas (para reentrada)
        const photoTypes = this.getPhotoTypes();

        photoTypes.forEach(photoType => {
            const photoElement = document.getElementById(`foto-${photoType.id}`);
            if (photoElement && this.photoData[photoType.field]) {
                // Marcar como capturada si ya existe en photoData
                this.markPhotoAsCaptured(photoType.id, true);
            }
        });

        console.log('Fotos ya capturadas:', Object.keys(this.photoData));
        console.log('=== PANTALLA DE FOTOS INICIALIZADA ===');
    }

    /**
     * Carga fotos existentes desde los datos de Field Service
     */
    loadExistingPhotos() {
        console.log('📸 Cargando fotos existentes desde variables globales...');

        const photoTypes = this.getPhotoTypes();
        let existingPhotosCount = 0;

        photoTypes.forEach(photoType => {
            // Obtener el valor desde la variable global correspondiente
            let fieldValue = null;
            
            // Mapear el campo a la variable global
            switch(photoType.field) {
                case 'xa_end_device': fieldValue = xa_end_device; break;
                case 'xa_label': fieldValue = xa_label; break;
                case 'xa_frontal': fieldValue = xa_frontal; break;
                case 'xa_right_side': fieldValue = xa_right_side; break;
                case 'xa_left_side': fieldValue = xa_left_side; break;
                case 'xa_local_device': fieldValue = xa_local_device; break;
                case 'xa_plastic_tarpaulin': fieldValue = xa_plastic_tarpaulin; break;
                case 'xa_panel1': fieldValue = xa_panel1; break;
                case 'xa_panel2': fieldValue = xa_panel2; break;
                case 'xa_panel3': fieldValue = xa_panel3; break;
                case 'xa_odometer': fieldValue = xa_odometer; break;
                case 'xa_plate': fieldValue = xa_plate; break;
                case 'xa_open_door_ld': fieldValue = xa_open_door_ld; break;
                case 'xa_open_door_li': fieldValue = xa_open_door_li; break;
                case 'xa_spare_wheel': fieldValue = xa_spare_wheel; break;
                case 'xa_back': fieldValue = xa_back; break;
                case 'xa_serie': fieldValue = xa_serie; break;
                case 'xa_circulation_card': fieldValue = xa_circulation_card; break;
                default:
                    console.warn(`Campo de foto no mapeado: ${photoType.field}`);
            }

            // Verificar si la variable global tiene valor (foto existente)
            if (fieldValue && fieldValue.trim() !== '') {
                console.log(`✅ Foto existente encontrada: ${photoType.name} -> ${photoType.field} = ${fieldValue}`);

                // Guardar en photoData como foto existente
                this.photoData[photoType.field] = {
                    timestamp: new Date().toISOString(),
                    photoType: photoType.name,
                    fieldName: photoType.field,
                    photoId: photoType.id,
                    status: 'existing',
                    photoData: fieldValue, // URL o identificador de Field Service
                    source: 'field_service'
                };

                // Ocultar el elemento de la UI ya que la foto ya existe
                this.hidePhotoItem(photoType.id);

                existingPhotosCount++;
            } else {
                console.log(`⏳ Foto pendiente: ${photoType.name} -> ${photoType.field} (variable: ${fieldValue === null ? 'null' : 'vacía'})`);
            }
        });

        console.log(`✅ ${existingPhotosCount} fotos existentes cargadas y ocultadas de la UI`);
        console.log(`📋 ${photoTypes.length - existingPhotosCount} fotos pendientes de capturar`);

        // Actualizar contador de progreso
        this.updatePhotoCounter();
    }

    /**
     * Oculta un elemento de foto de la UI cuando ya existe
     */
    hidePhotoItem(photoId) {
        const photoElement = document.getElementById(`foto-${photoId}`);
        if (photoElement) {
            // Buscar el contenedor padre (.photo-item)
            const photoItem = photoElement.closest('.photo-item');
            if (photoItem) {
                photoItem.style.display = 'none';
                console.log(`Elemento de foto ${photoId} ocultado (ya existe en Field Service)`);
            }
        }
    }

    /**
     * Marca una foto como capturada en la UI
     */
    markPhotoAsCaptured(photoId, hideFromUI = false) {
        const photoElement = document.getElementById(`foto-${photoId}`);
        if (!photoElement) return;

        if (hideFromUI) {
            this.hidePhotoItem(photoId);
            return;
        }

        // Marcar visualmente como capturada
        photoElement.classList.add('captured');
        const photoIcon = photoElement.querySelector('.photo-icon');
        if (photoIcon) {
            photoIcon.textContent = '✅';
        }
        const button = photoElement.querySelector('.btn-photo');
        if (button) {
            button.textContent = 'Foto Tomada';
            button.style.background = 'var(--success-color)';
            button.disabled = false; // Permitir retomar si es necesario
        }
    }

    /**
     * Envía las fotos capturadas parcialmente a Field Service
     */
    async sendPhotosToFieldService() {
        console.log('📤 Enviando fotos capturadas a Field Service...');

        const photosToSend = {};
        let photoCount = 0;

        // Recopilar todas las fotos capturadas
        Object.keys(this.photoData).forEach(fieldName => {
            if (this.photoData[fieldName]) {
                photosToSend[fieldName] = this.photoData[fieldName];
                photoCount++;
            }
        });

        if (photoCount === 0) {
            console.log('No hay fotos para enviar');
            return { success: false, message: 'No hay fotos capturadas para enviar' };
        }

        try {
            // En modo local, simular envío exitoso
            if (this.isLocal) {
                console.log('Modo local: Simulando envío de fotos a Field Service');
                console.log('Fotos a enviar:', photosToSend);

                // Simular delay de red
                await new Promise(resolve => setTimeout(resolve, 1000));

                return {
                    success: true,
                    message: `${photoCount} fotos enviadas correctamente (simulado)`,
                    photosCount: photoCount
                };
            }

            // En modo producción, enviar a Field Service
            const payload = {
                activityId: activityId,
                photos: photosToSend,
                timestamp: new Date().toISOString()
            };

            console.log('Enviando payload a Field Service:', payload);

            // Aquí iría la llamada real a la API de Field Service
            // const response = await fetch('/api/fieldservice/photos', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(payload)
            // });

            return {
                success: true,
                message: `${photoCount} fotos enviadas correctamente`,
                photosCount: photoCount
            };

        } catch (error) {
            console.error('Error enviando fotos a Field Service:', error);
            return {
                success: false,
                message: 'Error al enviar fotos: ' + error.message
            };
        }
    }

    /**
     * Envía una sola foto a Field Service inmediatamente después de capturarla
     */
    async sendSinglePhotoToFieldService(fieldName, photoData) {
        console.log(`📤 Enviando foto individual a Field Service: ${fieldName}`);

        try {
            // En modo local, simular envío exitoso
            if (this.isLocal) {
                console.log('Modo local: Simulando envío individual de foto a Field Service');
                console.log('Campo:', fieldName);
                console.log('Datos de foto:', photoData);

                // Simular delay de red
                await new Promise(resolve => setTimeout(resolve, 500));

                return {
                    success: true,
                    message: `Foto ${fieldName} enviada correctamente (simulado)`
                };
            }

            // En modo producción, enviar a Field Service
            const payload = {
                activityId: activityId,
                photoField: fieldName,
                photoData: photoData,
                timestamp: new Date().toISOString()
            };

            console.log('Enviando foto individual a Field Service:', payload);

            // Aquí iría la llamada real a la API de Field Service
            // const response = await fetch('/api/fieldservice/photo', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(payload)
            // });

            return {
                success: true,
                message: `Foto ${fieldName} enviada correctamente`
            };

        } catch (error) {
            console.error('Error enviando foto individual a Field Service:', error);
            return {
                success: false,
                message: 'Error al enviar foto: ' + error.message
            };
        }
    }

    /**
     * Muestra notificación temporal del estado de subida de foto
     */
    showPhotoUploadNotification(photoName, status, message = '') {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `photo-notification ${status}`;

        const icon = status === 'success' ? '✅' : '❌';
        const text = status === 'success'
            ? `${photoName} enviada exitosamente`
            : `Error enviando ${photoName}: ${message}`;

        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${icon}</span>
                <span class="notification-text">${text}</span>
            </div>
        `;

        // Estilos inline para la notificación
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${status === 'success' ? '#d4edda' : '#f8d7da'};
            color: ${status === 'success' ? '#155724' : '#721c24'};
            border: 1px solid ${status === 'success' ? '#c3e6cb' : '#f5c6cb'};
            border-radius: 8px;
            padding: 12px 16px;
            max-width: 300px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
        `;

        // Agregar al body
        document.body.appendChild(notification);

        // Remover después de 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);

        console.log(`📱 Notificación mostrada: ${text}`);
    }

    /**
     * Obtiene el resumen completo de la actividad
     */
    getActivitySummary() {
        return {
            vehicleData: this.getCurrentData(),
            verification: this.verificationData,
            photos: this.photoData,
            timestamp: new Date().toISOString(),
            technician: 'current_user', // En producción vendría del sistema
            status: 'completed'
        };
    }

    /**
     * Registra el evento de validación para auditoría
     */
    logValidationEvent() {
        const timestamp = new Date().toISOString();
        const validationLog = {
            timestamp: timestamp,
            vin: this.originalVin,
            action: 'VIN_VALIDATED',
            status: 'SUCCESS'
        };

        console.log('Evento de validación registrado:', validationLog);

        // En un entorno real, esto se enviaría al servidor
        // this.sendValidationLog(validationLog);
    }

    /**
     * Renderiza el historial de servicios
     */
    renderServiceHistory() {
        const container = document.getElementById('service-activities');
        container.innerHTML = '';

        if (!this.data.serviceHistory || this.data.serviceHistory.length === 0) {
            container.innerHTML = '<p>No hay actividades registradas.</p>';
            return;
        }

        // Ordenar por secuencia
        const sortedHistory = this.data.serviceHistory.sort((a, b) => a.Secuencia_c - b.Secuencia_c);

        sortedHistory.forEach(activity => {
            const activityCard = this.createActivityCard(activity);
            container.appendChild(activityCard);
        });
    }

    /**
     * Crea una tarjeta de actividad
     */
    createActivityCard(activity) {
        const card = document.createElement('div');
        card.className = 'activity-card';

        const activityTypeClass = activity.Actividad_c.toLowerCase();

        card.innerHTML = `
            <div class="activity-header">
                <div>
                    <span class="activity-type ${activityTypeClass}">${this.activityTypes[activity.Actividad_c] || activity.Actividad_c}</span>
                    <span class="activity-status">${activity.EstadoDeActividad_c}</span>
                </div>
                <div>
                    <strong>Secuencia: ${activity.Secuencia_c}</strong>
                </div>
            </div>
            
            <div class="activity-details">
                <div class="detail-item">
                    <span class="detail-label">ID de Registro:</span> ${activity.RecordName}
                </div>
                <div class="detail-item">
                    <span class="detail-label">Dispositivo:</span> ${activity.Dispositivo_c}
                </div>
                <div class="detail-item">
                    <span class="detail-label">Producto:</span> ${activity.Producto_c}
                </div>
                <div class="detail-item">
                    <span class="detail-label">Tipo de Dispositivo:</span> ${activity.TipoDispositivo_c}
                </div>
                <div class="detail-item">
                    <span class="detail-label">Posición Sugerida:</span> ${activity.suggestedPosition || 'No especificada'}
                </div>
                <div class="detail-item">
                    <span class="detail-label">Inventario Requerido:</span> ${activity.requiredInvetory || 'No especificado'}
                </div>
                <div class="detail-item">
                    <span class="detail-label">Detención:</span> ${activity.Detencion_c}
                </div>
                <div class="detail-item">
                    <span class="detail-label">Revisión:</span> ${activity.revision || 'Pendiente'}
                </div>
            </div>
        `;

        return card;
    }

    /**
     * Obtiene el tipo de vehículo basado en el código
     */
    getTipoVehiculo(codigo) {
        const tipos = {
            "1": "Auto",
            "7": "Autobus",
            "12": "Camion ligero",
            "5": "Maquinaria Pesada",
            "9": "Minivan",
            "3": "Moto",
            "6": "Pickup",
            "14": "Rabon",
            "4": "Remolques",
            "8": "SUV",
            "13": "Torton",
            "2": "Tracto",
            "10": "Van de Carga",
            "11": "Van de Pasajeros"
        };
        return tipos[codigo] || `Tipo ${codigo}`;
    }

    /**
     * Obtiene la lista completa de tipos de vehículo
     */
    getVehicleTypes() {
        return [
            { "LookupCode": "1", "DisplayLabel": "Auto" },
            { "LookupCode": "7", "DisplayLabel": "Autobus" },
            { "LookupCode": "12", "DisplayLabel": "Camion ligero" },
            { "LookupCode": "5", "DisplayLabel": "Maquinaria Pesada" },
            { "LookupCode": "9", "DisplayLabel": "Minivan" },
            { "LookupCode": "3", "DisplayLabel": "Moto" },
            { "LookupCode": "6", "DisplayLabel": "Pickup" },
            { "LookupCode": "14", "DisplayLabel": "Rabon" },
            { "LookupCode": "4", "DisplayLabel": "Remolques" },
            { "LookupCode": "8", "DisplayLabel": "SUV" },
            { "LookupCode": "13", "DisplayLabel": "Torton" },
            { "LookupCode": "2", "DisplayLabel": "Tracto" },
            { "LookupCode": "10", "DisplayLabel": "Van de Carga" },
            { "LookupCode": "11", "DisplayLabel": "Van de Pasajeros" }
        ];
    }

    /**
     * Puebla el select de tipos de vehículo
     */
    populateVehicleTypeSelect() {
        const select = document.getElementById('tipoVehiculo');
        if (!select) return;

        const vehicleTypes = this.getVehicleTypes();

        // Limpiar opciones existentes (excepto la primera)
        select.innerHTML = '<option value="">Seleccione tipo...</option>';

        // Agregar todas las opciones
        vehicleTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type.LookupCode;
            option.textContent = type.DisplayLabel;
            select.appendChild(option);
        });
    }

    /**
     * Muestra/oculta el indicador de carga
     */
    showLoading(show) {
        document.getElementById('loading').style.display = show ? 'block' : 'none';
    }

    /**
     * Muestra/oculta el mensaje de error
     */
    showError(show) {
        document.getElementById('error').style.display = show ? 'block' : 'none';
    }

    /**
     * Función de utilidad para simular delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Actualiza los datos
     */
    async refresh() {
        console.log('Actualizando datos...');
        document.getElementById('main-content').style.display = 'none';
        this.showError(false);
        await this.loadData();
    }

    /**
     * Obtiene los datos actuales incluyendo modificaciones
     */
    getCurrentData() {
        if (!this.data) return null;

        // Crear copia de los datos originales
        const currentData = JSON.parse(JSON.stringify(this.data));

        // Actualizar con valores actuales de campos editables
        const placasField = document.getElementById('placas');
        const colorField = document.getElementById('color');
        const tipoField = document.getElementById('tipoVehiculo');

        if (placasField && placasField.value.trim() !== '') {
            currentData.Placas_c = placasField.value;
        }

        if (colorField && colorField.value.trim() !== '') {
            currentData.Color_c = colorField.value;
        }

        if (tipoField && tipoField.value.trim() !== '') {
            currentData.TipoVehiculoLista_c = tipoField.value;
        }

        return currentData;
    }

    /**
     * Exporta los datos a JSON (versión actualizada)
     */
    export() {
        const currentData = this.getCurrentData();
        if (!currentData) {
            alert('No hay datos para exportar');
            return;
        }

        const dataStr = JSON.stringify(currentData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `field_service_data_${new Date().getTime()}.json`;
        link.click();
    }

    /**
     * Obtiene actividades por tipo
     */
    getActivitiesByType(type) {
        if (!this.data || !this.data.serviceHistory) return [];
        return this.data.serviceHistory.filter(activity => activity.Actividad_c === type);
    }

    /**
     * Obtiene estadísticas de actividades
     */
    getActivityStats() {
        if (!this.data || !this.data.serviceHistory) return {};

        const stats = {
            total: this.data.serviceHistory.length,
            finalizadas: 0,
            pendientes: 0,
            porTipo: {}
        };

        this.data.serviceHistory.forEach(activity => {
            // Contar por estado
            if (activity.EstadoDeActividad_c === 'Finalizado') {
                stats.finalizadas++;
            } else {
                stats.pendientes++;
            }

            // Contar por tipo
            const tipo = activity.Actividad_c;
            stats.porTipo[tipo] = (stats.porTipo[tipo] || 0) + 1;
        });

        return stats;
    }

    /**
     * Muestra el VIN real cuando los datos están validados
     */
    showRealVin() {
        console.log('🔍 Mostrando VIN real...');

        const vinMaskedElement = document.getElementById('vin-masked');
        if (!vinMaskedElement) {
            console.warn('Elemento vin-masked no encontrado');
            return;
        }

        // Obtener el VIN real desde múltiples fuentes
        let realVin = '';

        // 1. Intentar obtener del campo de validación
        const vinValidationInput = document.getElementById('vin-validation');
        if (vinValidationInput && vinValidationInput.value.trim()) {
            realVin = vinValidationInput.value.trim();
            console.log('VIN obtenido del campo de validación:', realVin);
        }

        // 2. Intentar obtener de los datos del plugin (Vin_c)
        if (!realVin && this.data && this.data.Vin_c) {
            realVin = this.data.Vin_c;
            console.log('VIN obtenido de this.data.Vin_c:', realVin);
        }

        // 3. Intentar obtener de la variable global vin
        if (!realVin && typeof vin !== 'undefined' && vin) {
            realVin = vin;
            console.log('VIN obtenido de variable global vin:', realVin);
        }

        // 4. Si aún no hay VIN, usar un valor por defecto
        if (!realVin) {
            realVin = 'VIN no disponible';
            console.warn('No se pudo obtener el VIN real desde ninguna fuente');
            console.log('Debug - this.data:', this.data);
            console.log('Debug - variable global vin:', typeof vin !== 'undefined' ? vin : 'undefined');
        }

        // Mostrar el VIN real
        vinMaskedElement.textContent = realVin;
        vinMaskedElement.style.letterSpacing = '1px';
        vinMaskedElement.style.fontWeight = '500';

        console.log(`VIN real mostrado: ${realVin}`);
    }

    /**
     * Muestra el VIN enmascarado cuando los datos no están validados
     * Formato: ******4653 (solo últimos 7 caracteres visibles)
     */
    showMaskedVin() {
        console.log('🔒 Mostrando VIN enmascarado...');

        const vinMaskedElement = document.getElementById('vin-masked');
        if (!vinMaskedElement) {
            console.warn('Elemento vin-masked no encontrado');
            return;
        }

        // Obtener el VIN real desde múltiples fuentes para determinar la longitud
        let realVin = '';

        // 1. Intentar obtener del campo de validación
        const vinValidationInput = document.getElementById('vin-validation');
        if (vinValidationInput && vinValidationInput.value.trim()) {
            realVin = vinValidationInput.value.trim();
            console.log('VIN obtenido del campo de validación para enmascarar:', realVin);
        }

        // 2. Intentar obtener de los datos del plugin (Vin_c)
        if (!realVin && this.data && this.data.Vin_c) {
            realVin = this.data.Vin_c;
            console.log('VIN obtenido de this.data.Vin_c para enmascarar:', realVin);
        }

        // 3. Intentar obtener de la variable global vin
        if (!realVin && typeof vin !== 'undefined' && vin) {
            realVin = vin;
            console.log('VIN obtenido de variable global vin para enmascarar:', realVin);
        }

        // Crear VIN enmascarado - mostrar solo los últimos 7 caracteres
        let maskedVin = '';
        if (realVin && realVin.length > 0) {
            if (realVin.length <= 7) {
                // Si el VIN es igual o menor a 7 caracteres, mostrar todo
                maskedVin = realVin;
            } else {
                // VIN normal: mostrar solo los últimos 7 caracteres con asteriscos al inicio
                const lastSevenChars = realVin.substring(realVin.length - 7);
                const maskedCount = realVin.length - 7;
                maskedVin = '*'.repeat(maskedCount) + lastSevenChars;
            }
        } else {
            // Si no hay VIN, mostrar placeholder enmascarado
            maskedVin = '***-****-*******';
            console.warn('No se pudo obtener el VIN real para enmascarar desde ninguna fuente');
            console.log('Debug - this.data:', this.data);
            console.log('Debug - variable global vin:', typeof vin !== 'undefined' ? vin : 'undefined');
        }

        // Mostrar el VIN enmascarado
        vinMaskedElement.textContent = maskedVin;
        vinMaskedElement.style.letterSpacing = '2px';
        vinMaskedElement.style.fontWeight = '400';

        console.log(`VIN enmascarado mostrado: ${maskedVin}`);
    }
}

// Crear instancia global del plugin
const fieldServicePlugin = new FieldServicePlugin();

// Función para validar VIN (para uso desde HTML)
function validateVIN() {
    fieldServicePlugin.validateVinAndContinue();
}

// Función para limpiar VIN (para uso desde HTML)
function clearVIN() {
    fieldServicePlugin.clearVIN();
}

// Función para mostrar pantallas (para uso desde HTML)
function showScreen(screen) {
    fieldServicePlugin.showScreen(screen);
}

// Función para guardar verificación (para uso desde HTML)
function saveVerification() {
    fieldServicePlugin.saveVerification();
}

// Función para tomar fotos (para uso desde HTML)
function takePhoto(type) {
    fieldServicePlugin.takePhoto(type);
}

// Función para completar fotos (para uso desde HTML)
function completePhotos() {
    fieldServicePlugin.completePhotos();
}

// Funciones globales para el HTML
function refreshData() {
    fieldServicePlugin.refresh();
}

function exportData() {
    fieldServicePlugin.export();
}

// Función para obtener datos del plugin (para uso externo)
function getPluginData() {
    return fieldServicePlugin.data;
}

// Función para obtener estadísticas
function getStats() {
    return fieldServicePlugin.getActivityStats();
}

// Event listeners adicionales
document.addEventListener('DOMContentLoaded', function () {
    console.log('Field Service Plugin cargado correctamente');

    // Agregar listener para teclas de acceso rápido
    document.addEventListener('keydown', function (e) {
        // F5 para actualizar
        if (e.key === 'F5') {
            e.preventDefault();
            refreshData();
        }

        // Ctrl+E para exportar
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            exportData();
        }
    });
});

// Exportar para uso en otros módulos si es necesario
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FieldServicePlugin;
}






