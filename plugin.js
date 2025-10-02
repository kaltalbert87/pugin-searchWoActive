"use strict";

var urlWoTracking

var urlGetTracking;
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
var maxtrack;
var isGuard = false;
var cancellationStatus;
var activityId;
var visitType;
var arrivalTimeGuard = null;
var guardSchedule = null; // Variable para almacenar el horario de guardia
var resources;




const pendingFiles = [];
const fileInput = document.getElementById('fileInput');
const attachmentsList = document.getElementById('attachments');

const initLocalPlugin = () => {
  var data = dataActivityInit;
  openMessage(data);
}

function openMessage(data) {
  console.log(data);

  urlGetTracking = data.securedData.urlGetTracking;
  Autorizacion = data.securedData.Autorization;
  urlWoTracking = data.securedData.urlApiWoTracking;
  activityId = data.activity.aid || '';


  apptNumber = data.activity.appt_number;
  resourceId = data.resource.external_id;
  resourceName = data.resource.pname;
  timeSlot = data.activity["time_slot_label"];
  vin = data.activity["xa_car_vin"];
  accountName = data.activity.xa_wo_cuenta;
  requestedDate = data.activity.date;
  agentCai = data.activity.xa_agente_cai || '';

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

  sessionStorage.setItem('AutorizationFSM', data.securedData.AutorizationFSM);
  sessionStorage.setItem('userFSM', ulogin);
  sessionStorage.setItem('Autorizacion', Autorizacion);
  sessionStorage.setItem('urlWoTracking', urlWoTracking);

  if (data.activity.xa_contactability != null) {
    contactabilityNotes = data.activity.xa_contactability.replace(/(\r\n|\r|\n)+/g, ', ').trim() || '';
  }

  if (data.activity.xa_note != null) {
    activityNotes = data.activity.xa_note.replace(/(\r\n|\r|\n)+/g, ', ').trim() || '';

  }



  let tabledata = [];
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


  const motivoNum = Number(data.activity.xa_motivo_cancel) || 0; // Aseguramos que sea un número
  motivoCancelacion = justifications[motivoNum] || '';



  const cancellationStatusNum = Number(data.activity.xa_estatus_de_cancelacion) || 0; // Aseguramos que sea un número
  cancellationStatus = cancellationStatusId[cancellationStatusNum] || '';







  obsCancelacion = data.activity.xa_observacion_cancel || '';


  // tras leer data.activity y data.user:
  document.getElementById('infoCliente').innerText = accountName || '-';
  document.getElementById('infoTecnico').innerText = resourceName || '-';
  document.getElementById('infoOrden').innerText = apptNumber + '          ' + requestedDate;
  document.getElementById('infoIntervalo').innerText = timeSlot || '-';
  document.getElementById('infoVin').innerText = vin || '-';
  document.getElementById('infoStatus').innerText = statusActivity || '-';
  document.getElementById('infoProducto').innerText = productName || '-';
  document.getElementById('infoIdTec').innerText = resourceId || '-';
  document.getElementById('infoMotCanc').innerText = motivoCancelacion || '-';
  document.getElementById('factorCanc').innerText = cancellationStatus || '-';
  //document.getElementById('infoTipoVisita').innerText = visitType || '-';
  document.getElementById('infoNotasActividad').innerText = activityNotes || '-';
  document.getElementById('infoNotasContactabilidad').innerText = contactabilityNotes || '-';

  /*if (isGuard) {
    const checkbox = document.getElementById('checkboxGuard');
    if (checkbox) {
      checkbox.checked = true;
      checkbox.disabled = true; // Deshabilitar el checkbox si es Guardia
    }
  }*/


  // Mostar activdades del xa_list
  const activities = tabledata?.[0]?.serviceHistory || [];
  const container = document.getElementById('activitiesContainer');

  // Limpia el contenedor
  container.innerHTML = '';

  if (activities.length === 0) {
    container.innerHTML = '<p>No hay actividades registradas.</p>';
  } else {
    // Por cada actividad, creamos una tarjeta sencilla
    let activityTypeBackup = '';
    activities.forEach((act, idx) => {

      if (idx === 0) {
        deviceType = act.TipoDispositivo_c || '-';
        activityTypeBackup = act.Actividad_c || '-';

      }

      if ((act.Actividad_c === 'CAMBIO' || act.Actividad_c === 'INSTALACION') && act.TipoDispositivo_c === 'Primario' && (act.EstadoDeActividad_c === 'Instalado' || act.EstadoDeActividad_c === 'Finalizado')) {
        if (act.Dispositivo_c && act.Dispositivo_c.length === 10) {
          maxtrack = act.Dispositivo_c || '';
        } else {
          suntech = act.Dispositivo_c || '';
        }
      }


      if (act.TipoDispositivo_c === 'Primario' && (act.EstadoDeActividad_c === 'Instalado' || act.EstadoDeActividad_c === 'Revisado' || act.EstadoDeActividad_c === 'Finalizado')) {
        activityType = act.Actividad_c;
      }


      if (activityType === null) {
        if (act.TipoDispositivo_c === 'Secundario' && (act.EstadoDeActividad_c === 'Instalado' || act.EstadoDeActividad_c === 'Finalizado') && act.Actividad_c === 'CAMBIO') {
          activityType = 'Cambio'
        } else if (act.TipoDispositivo_c === 'Secundario' && (act.EstadoDeActividad_c === 'Instalado' || act.EstadoDeActividad_c === 'Finalizado') && act.Actividad_c === 'INSTALACION') {
          activityType = 'Instalacion'
        }
      }



      if (activityType === null && idx === activities.length - 1) {
        activityType = activityTypeBackup;
      }



      const card = document.createElement('div');
      card.className = 'contenedor-actividad ';
      card.innerHTML = `
       <div class="card-header">
        <i class="fa-comments-o"></i> Actividad ${idx + 1}
      </div>
        <div class="panel-body">
          <p><strong>Actividad:</strong> ${act.RecordName || '-'}</p>
          <p><strong>Tipo Dispositivo:</strong> ${act.TipoDispositivo_c || '-'}</p>
          <p><strong>Inventario Requerido:</strong> ${act.requiredInvetory || '-'}</p>
          <p><strong>Tipo Actividad:</strong> ${act.Actividad_c || '-'}</p>
          <p><strong>Estado Actividad:</strong> ${act.EstadoDeActividad_c || '-'}</p>
          <p><strong>Dispositivo:</strong> ${act.Dispositivo_c || '-'}</p>
        </div>
      `;
      container.appendChild(card);
    });
  }
  getTracking();
}







let commentsTable;
function initPlugin() {
  window.addEventListener("message", getWebMessage, false);
  var messsageData = {
    apiVersion: 1,
    method: 'ready'
  };


  const allColumns = [
    { title: "#", field: "id", width: 10, headerSort: false },
    { title: "Fecha", field: "fecha", width: 130, sorter: "datetime", hozAlign: "center" },
    { title: "Usuario", field: "user", width: 120, hozAlign: "center" },
    {
      title: "Adjuntos",
      field: "attached",
      width: 100,
      formatter: (cell) => {
        const val = cell.getValue();
        if (!val || val.length === 0) return "";
        // si hay, renderizamos un link
        return `<a href="javascript:void(0)">Descargar</a>`;
      },
      cellClick: (e, cell) => {
        const rowData = cell.getRow().getData()
        const woTrackingId = rowData.woTrackingId;
        const val = cell.getValue();
        if (!val || val.length === 0) return;
        downloadZipWithXhr(woTrackingId);
      }
    },
    { title: "Comentario", field: "comment", width: 748, formatter: "textarea" },
  ];


  // Inicializa la tabla
  commentsTable = new Tabulator("#listaComentarios", {
    height: "auto",
    layout: "fitColumns",
    placeholder: "No hay comentarios",
    pagination: "local",
    paginationSize: 10,
    paginationSizeSelector: [10, 20, 30, 50],
    rowFormatter: function (row) {
      const data = row.getData();
      if (data.comment.toLowerCase().includes("error")) {
        row.getElement().style.backgroundColor = "#fdecea";
      }
    },
    columns: allColumns,
  });



  // Auto-refresh cada 30 s
  // setInterval(() => { if(apptNumber) getTracking(); }, 30000);

  sendWebMessage(messsageData);
}






function createTracking() {
  const btn = document.getElementById('createTracking');
  const spinner = document.getElementById('preload1');
  const commentText = document.getElementById('comment').value.trim();

  if (!commentText) {
    alert('Por favor, ingresa un comentario antes de guardar.');
    return;
  }

  btn.disabled = true;
  spinner.style.visibility = 'visible';
  const uri = urlWoTracking + '/woTracking';

  const body1 = {
    woNumber: apptNumber,
    userName: ulogin,
    comment: commentText,
    timeSlot: timeSlot,
    resourceName: resourceName,
    resourceId: resourceId,
    accountName: accountName,
    vin: vin,
    productName: productName,
    state: state,
    statusWo: statusActivity,
    requestedDate: requestedDate,
    assignedAgent: agentCai,
    deviceType: deviceType,
    cancellationReason: motivoCancelacion,
    suntech: suntech,
    maxtrack: maxtrack,
    activityType: activityType,
    isGuard: isGuard,
    cancellationStatus: cancellationStatus,
    arrivalTime: arrivalTimeGuard,
    guardSchedule: guardSchedule
  };




  const body = JSON.stringify(body1);
  console.log("Payload:", body);

  const xhttp = new XMLHttpRequest();
  xhttp.open('POST', uri);
  xhttp.setRequestHeader('Content-Type', 'application/json');
  xhttp.setRequestHeader('Authorization', Autorizacion);


  xhttp.onreadystatechange = function () {
    if (this.readyState !== 4) return;
    spinner.style.visibility = 'hidden';
    btn.disabled = false;

    if (this.status >= 200 && this.status < 300) {
      let arr;
      try {
        arr = JSON.parse(this.responseText);
      } catch (e) {
        console.error("JSON inválido:", this.responseText);
        commentsTable.clearData();
        return;
      }

      // Validar que el primer elemento tenga id distinto de null
      if (arr.length > 0 && arr[0].id != null) {
        comment.value = '';
        sendAttachments(arr[0].id);
        getTracking();
      } else {
        alert('La respuesta no contenía un id válido.');
      }

    } else {
      console.error("Error HTTP:", this.status, this.responseText);
      commentsTable.clearData();
    }
  };

  xhttp.send(body);
}



function getTracking() {
  const spinner = document.getElementById('preloadGet');
  const uri = urlWoTracking + '/woTracking/?woNumber=' + encodeURIComponent(apptNumber);

  const xhttp = new XMLHttpRequest();
  xhttp.open('GET', uri);
  xhttp.setRequestHeader('Content-Type', 'application/json');
  xhttp.setRequestHeader('Authorization', Autorizacion);

  xhttp.onreadystatechange = function () {
    if (this.readyState !== 4) return;

    if (this.status === 200) {
      let arr;
      try { arr = JSON.parse(this.responseText); }
      catch {
        console.error("JSON inválido:", this.responseText);
        commentsTable.clearData();
        return;
      }
      // Convertir cada objeto de la respuesta al formato que usa commentsTable

      // Validar que el primer registro del array tenga el campo guardia como true
      if (arr.length > 0 && arr[0].guadia === true) {
        isGuard = true;
        const checkbox = document.getElementById('checkboxGuard');
        if (checkbox) {
          checkbox.checked = true;
          checkbox.disabled = true; // Deshabilitar el checkbox si es Guardia
        }
      }


      if (isGuard && arr.length > 0 && arr[0].arrivaltime !== null) {

        const arrivalTime = arr[0].arrivaltime;
        const container = document.getElementById('arrivalTimeContainer');
        container.innerHTML = `
          <strong>Llegada:</strong>
          <input type="time" id="arrivalTime" class="form-control" style="display: inline-block; width: auto;" value="${arrivalTime}">
        `;

        const arrivalInput = document.getElementById('arrivalTimeContainer').querySelector('#arrivalTime');
        arrivalInput.disabled = true; // Bloquear el campo para que ya no sea editable
        arrivalTimeGuard = arrivalTime;
      } else if (isGuard && arr.length > 0 && arr[0].arrivaltime === null) {
        const container = document.getElementById('arrivalTimeContainer');

        container.innerHTML = `
                  <strong>Llegada:</strong>
                  <input type="time" id="arrivalTime" class="form-control" style="display: inline-block; width: auto;">
                `;
      }

      if (arr.length > 0 && arr[0].guardschedule !== null) {
        guardSchedule = arr[0].guardschedule;
      }



      const rows = arr.map((item, i) => ({
        id: i + 1,                             // índice secuencial (o usa item.id si lo prefieres)
        woTrackingId: item.id || "",
        fecha: item.creation_date || "",       // ISO string tal cual, o formatea con Date()
        user: item.user_name || "",
        resourceName: item.resource_name || "",
        timeSlot: item.time_slot || "",
        accountName: item.account_name || "",
        vin: item.vin || "",
        productName: item.product_name || "",
        status: item.status || "",
        comment: item.comment || "",
        attached: item.count || "",
      }));
      commentsTable.setData(rows);
    } else {
      console.error('Error al obtener tracking:', this.status);
      commentsTable.clearData();
    }
  };

  xhttp.send();
}



function getMyTracking() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');  // getMonth() va de 0 a 11
  const day = String(now.getDate()).padStart(2, '0');
  const todayLocal = `${year}-${month}-${day}`;


  // 1. Inicializa la tabla con las columnas
  const commentsTable = new Tabulator("#myTracking", {
    height: "auto",
    layout: "fitColumns",
    placeholder: "No hay Actividades Asignadas",
    pagination: "local",
    paginationSize: 25,
    paginationSizeSelector: [50, 75, 100],
    // 1) Le decimos a Tabulator que ordene inicialmente por timeSlot ascendente
    initialSort: [
      { column: "timeSlot", dir: "asc" }
    ],
    rowFormatter: function (row) {
      const data = row.getData();
    },

    columns: [
      { title: "Orden", "width": 150, field: "apptNumber" },
      {
        title: "Horario", "width": 90,
        field: "timeSlot",
        sorter: "string",        // 2) (opcional) indicamos explícitamente un sorter
        headerSort: true         //    para que al hacer clic siga ordenando
      },
      { title: "VIN", "width": 200, field: "vin" },
      { title: "Cuenta", "width": 300, field: "account" },
      { title: "Estatus", field: "status" },
      { title: "Ciudad", field: "city" },
      { title: "Zona", field: "workZone" },
    ],
  });

  originUrl = document.location.ancestorOrigins[0] + '/rest/ofscCore/v1/activities/custom-actions/search';
  const autorization = sessionStorage.getItem('AutorizationFSM');
  const userFSM = sessionStorage.getItem('userFSM');

  // 2. Lógica de llamada
  const params = new URLSearchParams({
    fields: 'activityId,xa_wo_cuenta,apptNumber,status,workZone,activityType,timeSlot,resourceId,xa_note,xa_car_vin,xa_agente_cai,city,stateProvince',
    dateFrom: todayLocal,
    dateTo: todayLocal,
    searchInField: 'xa_agente_cai',
    searchForValue: userFSM,
    limit: 200,
  });
  const uri = `${originUrl}?${params.toString()}`;  // monta la URL completa
  const xhttp = new XMLHttpRequest();
  xhttp.open('GET', uri, true);
  xhttp.setRequestHeader('Content-Type', 'application/json');
  xhttp.setRequestHeader('Authorization', autorization);


  xhttp.onreadystatechange = function () {
    if (this.readyState !== 4) return;

    if (this.status === 200) {
      let data;
      try {
        data = JSON.parse(this.responseText);
      } catch {
        console.error("JSON inválido:", this.responseText);
        commentsTable.clearData();
        return;
      }

      // 3. Mapea cada item a la fila

      if (data.items && data.items.length > 0) {
        const rows = data.items.map(item => ({
          activityId: item.activityId,
          apptNumber: item.apptNumber,
          status: item.status === 'pending' ? 'Pendiente' : item.status === 'started' ? 'Iniciado' : item.status === 'completed' ? 'Completado' : item.status === 'cancelled' ? 'Cancelado' : item.status === 'notdone' ? 'Cancelado' : item.status,
          workZone: item.workZone,
          timeSlot: item.timeSlot,
          city: item.city,
          stateProvince: item.stateProvince,
          account: item.xa_wo_cuenta,
          vin: item.xa_car_vin,
          agent: item.xa_agente_cai,
          //   note:         item.xa_note.replace(/\n/g, ' '), // opcional: quitar saltos
        }));
        // 4. Carga los datos en la tabla
        commentsTable.setData(rows);
      }



    } else {
      console.error('Error al obtener tracking:', this.status);
      commentsTable.clearData();
    }
  };

  xhttp.send();

  // Botón de cerrar (si aplica)
  const btnCerrar = document.getElementById('submit');
  if (btnCerrar) {
    btnCerrar.addEventListener('click', () => history.back());
  }
}



function closePlugin() {
  var messageData = {
    apiVersion: 1,
    method: "close",
    backScreen: "plugin_by_label",
    wakeupNeeded: false

  };
  console.log("Sending close message" + JSON.stringify(messageData, undefined, 4));
  sendWebMessage(messageData);
}






function addAttachments() {

  // limpiamos el array para no duplicar
  //pendingFiles.length = 0;

  Array.from(fileInput.files).forEach(file => {

    pendingFiles.push(file);
    console.log(file.name);     // nombre del archivo
    console.log(file.size);     // tamaño en bytes
    console.log(file.type);     // tipo MIME, p.ej. "image/png"
    console.log(file.lastModified); // timestamp de la última modificación

    // Crear elemento de lista
    const listItem = document.createElement('li');
    listItem.style.display = 'flex';
    listItem.style.alignItems = 'center';
    listItem.style.marginBottom = '5px';

    // Texto con nombre de archivo
    const nameSpan = document.createElement('span');
    nameSpan.textContent = file.name;
    nameSpan.style.flex = '1';

    // Botón para eliminar
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = '✖';
    removeBtn.style.marginLeft = '10px';
    removeBtn.className = 'btn btn-sm btn-outline-danger';
    removeBtn.onclick = () => attachmentsList.removeChild(listItem);

    // Armar y añadir
    listItem.appendChild(nameSpan);
    listItem.appendChild(removeBtn);
    attachmentsList.appendChild(listItem);
  });

  // Limpiar el input para próximas selecciones
  fileInput.value = '';
}



function sendAttachments(idWotracking) {
  // vaciar lista en pantalla
  attachmentsList.innerHTML = '';
  
  console.log('=== INICIO sendAttachments ===');
  console.log('ID Tracking:', idWotracking);
  console.log('Cantidad de archivos:', pendingFiles.length);
  
  if (pendingFiles.length > 0) {
    console.log('🔄 ESTRATEGIA: Envío secuencial para evitar CORS');
    console.log('Archivos a procesar:', pendingFiles.map(f => f.name));
    
    // NUEVA ESTRATEGIA: Enviar uno por uno
    sendFileSequentially(idWotracking, 0);
  } else {
    console.log('⚠️ No hay archivos para enviar');
  }
}

// Función para enviar archivos secuencialmente
function sendFileSequentially(idWotracking, fileIndex) {
  if (fileIndex >= pendingFiles.length) {
    console.log('🎉 TODOS LOS ARCHIVOS ENVIADOS EXITOSAMENTE');
    clearAttachments();
    getTracking();
    return;
  }

  const file = pendingFiles[fileIndex];
  console.log(`📤 Enviando archivo ${fileIndex + 1}/${pendingFiles.length}: ${file.name}`);
  
  const uri = urlWoTracking + '/uploadAttachment';
  const form = new FormData();
  
  // Solo UN archivo por petición
  form.append('file0', file, file.name);
  form.append('idWotracking', idWotracking);

  console.log(`FormData para archivo ${fileIndex + 1}:`, {
    file: `${file.name} (${file.size} bytes)`,
    idWotracking: idWotracking
  });

  const xhttp = new XMLHttpRequest();
  xhttp.open('POST', uri);
  xhttp.setRequestHeader('Authorization', Autorizacion);
  
  // Progreso individual
  xhttp.upload.onprogress = function(e) {
    if (e.lengthComputable) {
      const percent = (e.loaded / e.total) * 100;
      console.log(`� Archivo ${fileIndex + 1} - Progreso: ${percent.toFixed(1)}%`);
    }
  };

  xhttp.onreadystatechange = function () {
    if (this.readyState !== 4) return;

    console.log(`=== RESPUESTA ARCHIVO ${fileIndex + 1} ===`);
    console.log('Status:', this.status);
    console.log('Response:', this.responseText);

    if (this.status >= 200 && this.status < 300) {
      console.log(`✅ Archivo ${fileIndex + 1} enviado correctamente: ${file.name}`);
      
      // Enviar siguiente archivo con delay
      setTimeout(() => {
        sendFileSequentially(idWotracking, fileIndex + 1);
      }, 800); // 800ms entre archivos
      
    } else if (this.status === 0) {
      console.error(`❌ CORS bloqueó archivo ${fileIndex + 1}: ${file.name}`);
      console.log('🔄 Intentando continuar con el siguiente archivo...');
      
      // Continuar con el siguiente aunque falle por CORS
      setTimeout(() => {
        sendFileSequentially(idWotracking, fileIndex + 1);
      }, 1000);
      
    } else {
      console.error(`❌ Error ${this.status} en archivo ${fileIndex + 1}:`, this.responseText);
      
      // Continuar con el siguiente archivo
      setTimeout(() => {
        sendFileSequentially(idWotracking, fileIndex + 1);
      }, 1000);
    }
  };

  xhttp.onerror = function () {
    console.error(`❌ Error de red en archivo ${fileIndex + 1}: ${file.name}`);
    
    // Continuar con el siguiente
    setTimeout(() => {
      sendFileSequentially(idWotracking, fileIndex + 1);
    }, 1000);
  };

  xhttp.timeout = 60000; // 60 segundos por archivo
  xhttp.send(form);
}

function btnCerrar() {
  history.back();
}


function _isJson(str) {
  console.log("function _isJson")
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

function getWebMessage(event) {
  console.log("function getWebMessage")
  if (typeof event.data === 'undefined') {
    return false;
  }

  if (!_isJson(event.data)) {
    return false;
  }

  var data = JSON.parse(event.data);

  if (!data.method) {
    return false;
  }

  switch (data.method) {
    case 'open':
      openMessage(data);
      break;
    case 'open':
      initMessage(data);
      break;
    case 'error':
      console.log("Received error message " + JSON.stringify(data, undefined, 4));
      ErrorWeb = 1;
      break;
    // other methods may go here
  }
}


function downloadZipWithXhr(woTrackingId) {
  const uri = urlWoTracking + '/attachment?woTrackingId=' + encodeURIComponent(woTrackingId.replace('.00', ''));
  const xhttp = new XMLHttpRequest();
  xhttp.open('GET', uri, true);
  
  // Usar text para capturar la respuesta JSON del servidor
  xhttp.responseType = 'text';

  // Cabeceras necesarias
  xhttp.setRequestHeader('Accept', 'application/zip, application/octet-stream, */*');
  xhttp.setRequestHeader('Authorization', Autorizacion);
  
  // Agregar timeout para evitar cuelgues
  xhttp.timeout = 30000; // 30 segundos

  xhttp.onload = function () {
    if (this.status === 200) {
      const responseText = this.response;
      
      if (!responseText || responseText.length === 0) {
        console.error('El archivo descargado está vacío');
        alert('Error: El archivo descargado está vacío');
        return;
      }

      console.log('Content-Type:', this.getResponseHeader('Content-Type'));
      console.log('Response length:', responseText.length);

      let zipData;
      
      try {
        // Intentar parsear como JSON (formato Buffer de Node.js)
        const jsonResponse = JSON.parse(responseText);
        
        if (jsonResponse.type === "Buffer" && Array.isArray(jsonResponse.data)) {
          console.log('Detectado formato Buffer de Node.js, convirtiendo...');
          // Convertir el array de bytes a Uint8Array
          zipData = new Uint8Array(jsonResponse.data);
        } else {
          throw new Error('Formato JSON no reconocido');
        }
        
      } catch (jsonError) {
        console.log('No es JSON válido, intentando como datos binarios...');
        
        // Si no es JSON, intentar convertir directamente
        const encoder = new TextEncoder();
        zipData = encoder.encode(responseText);
      }

      // Verificar si es realmente un ZIP validando los magic bytes
      const isValidZip = validateZipFile(zipData);
      
      if (!isValidZip) {
        console.error('El archivo procesado no es un ZIP válido');
        console.log('Primeros 20 bytes procesados:', Array.from(zipData.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' '));
        alert('Error: Los datos procesados no forman un ZIP válido. Revisa la consola para más detalles.');
        return;
      }

      console.log('ZIP válido detectado, tamaño:', zipData.length, 'bytes');

      // Convertir Uint8Array a Blob
      const blob = new Blob([zipData], { type: 'application/zip' });
      
      // Crear URL temporal
      const downloadUrl = window.URL.createObjectURL(blob);
      
      // Obtener nombre de archivo del header si está disponible
      let fileName = `Adjuntos.zip`;
      const contentDisposition = this.getResponseHeader('Content-Disposition');
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (fileNameMatch && fileNameMatch[1]) {
          fileName = fileNameMatch[1].replace(/['"]/g, '');
        }
      }

      // Crear enlace <a> para forzar descarga
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = downloadUrl;
      a.download = fileName;
      
      // Agregar al DOM, hacer click y limpiar
      document.body.appendChild(a);
      a.click();
      
      console.log('Descarga iniciada correctamente:', fileName);
      
      // Limpiar después de un delay para asegurar que la descarga inicie
      setTimeout(() => {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
        window.URL.revokeObjectURL(downloadUrl);
      }, 1000);
      
    } else if (this.status === 404) {
      console.error('Archivo no encontrado');
      alert('Error: No se encontraron archivos adjuntos para descargar');
    } else {
      console.error(`Error al descargar ZIP: ${this.status} ${this.statusText}`);
      alert(`Error al descargar archivo: ${this.status} - ${this.statusText}`);
    }
  };

  xhttp.onerror = function () {
    console.error('Error de red al solicitar el ZIP');
    alert('Error de conexión al intentar descargar el archivo');
  };

  xhttp.ontimeout = function () {
    console.error('Timeout al descargar el ZIP');
    alert('Tiempo de espera agotado. Intenta nuevamente.');
  };

  xhttp.send();
}

// Función auxiliar para validar si es un archivo ZIP válido
function validateZipFile(uint8Array) {
  if (uint8Array.length < 4) return false;
  
  // Magic numbers para ZIP files
  // PK signature: 0x50, 0x4B (PK)
  const pkSignature = uint8Array[0] === 0x50 && uint8Array[1] === 0x4B;
  
  if (!pkSignature) return false;
  
  // Verificar diferentes tipos de ZIP
  // Local file header: PK\x03\x04
  const localFileHeader = uint8Array[2] === 0x03 && uint8Array[3] === 0x04;
  // Central directory header: PK\x01\x02  
  const centralDirHeader = uint8Array[2] === 0x01 && uint8Array[3] === 0x02;
  // End of central directory: PK\x05\x06
  const endOfCentralDir = uint8Array[2] === 0x05 && uint8Array[3] === 0x06;
  
  return localFileHeader || centralDirHeader || endOfCentralDir;
}


// Función que limpia estado y UI
function clearAttachments() {
  // 1) vaciar array de archivos pendientes
  pendingFiles.length = 0;



  // 2) opcional: resetear el input de archivos
  fileInput.value = '';
}





function getOriginURL(url) {
  console.log("function getOriginURL")
  if (url != '') {
    if (url.indexOf("://") > -1) {
      return 'https://' + url.split('/')[2];
    } else {
      return 'https://' + url.split('/')[0];
    }
  }
  return '';
}


function sendWebMessage(data) {
  console.log("function sendWebMessage")
  var originUrl = document.location.ancestorOrigins[0] || '';

  if (originUrl) {
    parent.postMessage(data, getOriginURL(originUrl));
  }
};

function initMessage(data) {
  console.log("function initMessage" + data)
  var messsageData = {
    apiVersion: 1,
    method: 'initEnd'
  };
  sendWebMessage(messsageData);
}
setInterval(getTracking, 10000);







function openPopup() {

  if (!isNaN(resourceId)) {

    // Limpia el contenido previo del popup
    const popup = document.getElementById('popupWindow');
    popup.innerHTML = ''; // Limpia el contenido previo
    popup.style.display = 'none'; // Oculta el popup antes de cargar nuevos datos
    popup.className = 'popup-window'; // Asegura que tenga la clase correcta
    popup.style.display = 'block'; // Muestra el popup

    // Hacer que la ventana flotante sea movible
    popup.style.position = 'absolute';
    popup.style.cursor = 'move';

    let isDragging = false;
    let offsetX, offsetY;

    popup.addEventListener('mousedown', (e) => {
      isDragging = true;
      offsetX = e.clientX - popup.offsetLeft;
      offsetY = e.clientY - popup.offsetTop;
      popup.style.zIndex = 1000; // Traer al frente
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        popup.style.left = `${e.clientX - offsetX}px`;
        popup.style.top = `${e.clientY - offsetY}px`;
      }
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });


    const autorization = sessionStorage.getItem('AutorizationFSM');

    const baseUri = document.location.ancestorOrigins[0] + '/rest/ofscCore/v1/resources/' + resourceId + '/workSchedules/';
    const params = new URLSearchParams({ actualForDate: requestedDate });
    const uri = `${baseUri}?${params.toString()}`;

    const xhttp = new XMLHttpRequest();
    xhttp.open('GET', uri, true);
    xhttp.setRequestHeader('Content-Type', 'application/json');
    xhttp.setRequestHeader('Authorization', autorization);

    xhttp.onreadystatechange = function () {
      if (this.readyState !== 4) return;
      const popup = document.getElementById('popupWindow');

      if (this.status === 200 && this.responseText) {
        let data;
        try {
          data = JSON.parse(this.responseText);
        } catch {
          popup.innerHTML = '<p>Error al procesar la respuesta del calendario.</p>';
          return;
        }

        // Limpiar contenido previo
        popup.innerHTML = '';

        // Recorremos cada ítem del nuevo modelo

        let scheduleCount = 0;
        data.items.forEach(item => {
          if (item.recordType != 'non-working') {
            if (new Date(requestedDate + 'T12:00:00') >= new Date(item.startDate + 'T00:00:00') && new Date(requestedDate + 'T12:00:00') <= new Date(item.endDate + 'T23:59:59')) {
              scheduleCount++;
              const addCard = info => {
                const card = document.createElement('div');
                const commentsCalendar = item.comments || 'No hay comentarios.';

                let type = item.recordType || null;
                let shiftType = item.shiftType || null;

                let workTimeStart = '';
                let workTimeEnd = '';

                if (item.workTimeStart != null && workTimeStart === '') {
                  workTimeStart = item.workTimeStart.split(':')[0];
                }

                if (item.workTimeEnd != null && workTimeEnd === '') {
                  workTimeEnd = item.workTimeEnd.split(':')[0];

                }


                if (shiftType != null && shiftType === 'on-call') {
                  type = 'Guardia';
                } else if (shiftType !== null && shiftType !== 'on-call') {
                  type = 'Regular';
                } else if (shiftType === null && item.scheduleLabel !== null && item.scheduleLabel.includes('Flotilla')) {
                  type = 'Guardia';
                } else if (shiftType === null && !item.scheduleLabel.includes('Flotilla')) {
                  type = 'Regular';
                }

                let commentsTurn = '';
                let typeTurn = '';
                let scheduleShiftsFound = false;
                if (Array.isArray(item.scheduleShifts)) {
                  item.scheduleShifts.forEach(shift => {

                    if (shift.workTimeStart != null && workTimeStart === '') {
                      workTimeStart = shift.workTimeStart.split(':')[0];
                    }

                    if (shift.workTimeEnd != null && workTimeEnd === '') {
                      workTimeEnd = shift.workTimeEnd.split(':')[0];

                    }

                    if (shift.comments != null) {
                      commentsTurn = shift.comments;

                      if (shift.recordType != null) {
                        typeTurn = shift.recordType;
                      }
                      scheduleShiftsFound = true;
                    }

                  });

                }

                card.className = 'card mb-3';
                card.innerHTML = `
                  <div class="card-header bg-primary text-white">
                    
                    <strong>Fecha: ${item.startDate}${item.endDate && item.endDate !== item.startDate ? ' → ' + item.endDate : ''}</strong>&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;
                    <strong>Horario: ${workTimeStart || ''} – ${workTimeEnd || ''}</strong>
                  </div>
                  <div class="card-body">
                  <p><span class="font-weight-bold">Comentarios Calendario:</span></p>
                    <ul>
                     <li><span class="font-weight-bold">Tipo:</span> ${type}</li>
                      ${commentsCalendar
                    .split('\n')
                    .filter(line => line.trim())
                    .map(line => `<li>${line}</li>`)
                    .join('')}
                    </ul>


                    ${scheduleShiftsFound
                    ? `<span class="font-weight-bold">Comentarios Turno:</span>
         <ul>
           <li><span class="font-weight-bold">Tipo:</span> ${typeTurn}</li>
           ${commentsTurn
                      .split('\n')
                      .filter(line => line.trim())
                      .map(line => `<li>${line}</li>`)
                      .join('')}
         </ul>`
                    : ''}




                  </div>
                `;
                popup.appendChild(card);
              };

              const info = {
                recordType: item.recordType,
                startDate: item.startDate,
                endDate: item.endDate,
                shiftType: item.shiftType,
                workTimeStart: item.workTimeStart,
                workTimeEnd: item.workTimeEnd,
                comments: item.comments
              };
              if (item.nonWorkingReason) {
                info.comments = item.nonWorkingReason;
              }
              addCard(info);

            }

          }
        });
        if (scheduleCount === 0) {
          popup.innerHTML = `<p class="text-danger">No hay horarios disponibles para la fecha solicitada: ${requestedDate}.</p>`;
        }
      } else {
        popup.innerHTML = `<p class="text-danger">No se pudo obtener el calendario (HTTP ${this.status}).</p>`;
      }

      // --- Aquí agregamos el botón Cerrar ---
      const closeButton = document.createElement('button');
      closeButton.textContent = 'Cerrar';
      closeButton.className = 'btn btn-primary mt-2';
      closeButton.onclick = closePopup;


      popup.appendChild(closeButton);
      popup.style.display = 'block';

    };

    xhttp.send();


  } else {
    alert('La actividad no está asignada.');
  }





}

function closePopup() {
  document.getElementById('popupWindow').style.display = 'none';
}

function toggleCheck(checkbox) {

  if (!checkbox.checked) {
    checkbox.disabled = false; // Allow enabling if unchecked
  } else {
    checkbox.disabled = true; // Disable once checked

    comment.value = 'Actividad marcada como Guardia';
    isGuard = true; // Set the flag to true
    arrivalDisabled(checkbox);


    if (!isNaN(resourceId)) {
      const autorization = sessionStorage.getItem('AutorizationFSM');
      const baseUri = document.location.ancestorOrigins[0] + '/rest/ofscCore/v1/resources/' + resourceId + '/workSchedules/calendarView';
      const params = new URLSearchParams({ dateFrom: requestedDate, dateTo: requestedDate });
      const uri = `${baseUri}?${params.toString()}`;

      const xhttp = new XMLHttpRequest();
      xhttp.open('GET', uri, false);
      xhttp.setRequestHeader('Content-Type', 'application/json');
      xhttp.setRequestHeader('Authorization', autorization);

      xhttp.onreadystatechange = function () {
        if (this.readyState !== 4) return;
        const popup = document.getElementById('popupWindow');

        if (this.status === 200 && this.responseText) {
          let data;
          try {
            data = JSON.parse(this.responseText);
          } catch {
            return;
          }

          // Para cada fecha (aquí sólo habrá la de hoy)
          Object.entries(data).forEach(([fecha, infoPorTurno]) => {
            if (fecha.startsWith('links')) {
              return; // Saltar al siguiente si la fecha comienza con 'links'
            }
            Object.entries(infoPorTurno).forEach(([turno, info]) => {

              const comments = info.comments || 'No hay comentarios.';
              if (guardSchedule == null) {
                if (info.shiftLabel != null && info.shiftLabel.includes('Flotilla')) {
                  guardSchedule = info.workTimeStart + ' – ' + info.workTimeEnd;
                } else if (info.recordType != null && info.recordType.includes('extra_working') && !comments.includes('No hay comentarios')) {
                  guardSchedule = info.workTimeStart + ' – ' + info.workTimeEnd;
                }

              }


            });
          });
        }

      };

      xhttp.send();
    }
    createTracking();
    updateActivityToGuard();
  }

}


function arrivalDisabled(checkbox) {
  if (checkbox.checked) {
    const container = document.getElementById('arrivalTimeContainer');
    if (checkbox.checked) {
      container.innerHTML = `
                  <strong>Llegada:</strong>
                  <input type="time" id="arrivalTime" class="form-control" style="display: inline-block; width: auto;">
                `;
    } else {
      container.innerHTML = ''; // Clear the container
    }
  }

}




function updateArrivalTime() {
  const arrivalTime = document.getElementById('arrivalTimeContainer').querySelector('#arrivalTime').value;
  comment.value = 'Hora de llegada marcada: ' + arrivalTime;

  const arrivalInput = document.getElementById('arrivalTimeContainer').querySelector('#arrivalTime');
  arrivalInput.disabled = true; // Bloquear el campo para que ya no sea editable

  arrivalTimeGuard = arrivalTime;

  createTracking();



}


function generateReport() {
  const report = document.getElementById('options').value;
  const date = document.getElementById('date').value;

  const Autorizacion = sessionStorage.getItem('Autorizacion');
  const urlGetTracking = sessionStorage.getItem('urlWoTracking');

  if (!report) {
    alert('Ingresa el reporte a generar.');
    return;
  }

  if (!date) {
    alert('Ingresa una fecha.');
    return;
  }

  console.log('=== GENERANDO REPORTE ===');
  console.log('Reporte:', report);
  console.log('Fecha:', date);
  console.log('URL:', urlGetTracking + '/reportWoTracking?date=' + date + '&reportName=' + report);

  const uri = urlGetTracking + '/reportWoTracking?date=' + date + '&reportName=' + report;
  const xhttp = new XMLHttpRequest();
  xhttp.open('GET', uri, true);
  
  // Cambiar a 'text' para capturar la respuesta JSON del servidor
  xhttp.responseType = 'text';

  // Cabeceras necesarias
  xhttp.setRequestHeader('Accept', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/octet-stream, */*');
  xhttp.setRequestHeader('Authorization', Autorizacion);
  
  // Agregar timeout
  xhttp.timeout = 60000; // 60 segundos

  xhttp.onload = function () {
    console.log('=== RESPUESTA REPORTE ===');
    console.log('Status:', this.status);
    console.log('Content-Type:', this.getResponseHeader('Content-Type'));
    console.log('Response length:', this.response ? this.response.length : 0);

    if (this.status === 200) {
      const responseText = this.response;
      
      if (!responseText || responseText.length === 0) {
        console.error('El archivo descargado está vacío');
        alert('Error: El reporte generado está vacío');
        return;
      }

      let excelData;
      
      try {
        // Intentar parsear como JSON (formato Buffer de Node.js)
        const jsonResponse = JSON.parse(responseText);
        console.log('Respuesta es JSON:', jsonResponse.type);
        
        if (jsonResponse.type === "Buffer" && Array.isArray(jsonResponse.data)) {
          console.log('Detectado formato Buffer de Node.js, convirtiendo...');
          // Convertir el array de bytes a Uint8Array
          excelData = new Uint8Array(jsonResponse.data);
          console.log('Excel convertido, tamaño:', excelData.length, 'bytes');
        } else {
          throw new Error('Formato JSON no reconocido');
        }
        
      } catch (jsonError) {
        console.log('No es JSON válido, intentando como datos binarios...');
        
        // Si no es JSON, intentar convertir directamente
        const encoder = new TextEncoder();
        excelData = encoder.encode(responseText);
        console.log('Excel procesado como texto, tamaño:', excelData.length, 'bytes');
      }

      // Verificar si es un archivo Excel válido (magic bytes)
      const isValidExcel = validateExcelFile(excelData);
      
      if (!isValidExcel) {
        console.error('El archivo procesado no es un Excel válido');
        console.log('Primeros 20 bytes procesados:', Array.from(excelData.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' '));
        alert('Error: Los datos procesados no forman un archivo Excel válido. Revisa la consola para más detalles.');
        return;
      }

      console.log('✅ Excel válido detectado, generando descarga...');

      // Convertir Uint8Array a Blob
      const blob = new Blob([excelData], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      // Crear URL temporal
      const downloadUrl = window.URL.createObjectURL(blob);
      
      // Enlace <a> para forzar descarga
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = downloadUrl;
      a.download = report + '_' + date + '.xlsx';
      
      // Agregar al DOM, hacer click y limpiar
      document.body.appendChild(a);
      a.click();
      
      console.log('✅ Descarga de reporte iniciada:', a.download);
      
      // Limpiar después de un delay
      setTimeout(() => {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
        window.URL.revokeObjectURL(downloadUrl);
      }, 1000);
      
    } else if (this.status === 404) {
      console.error('Reporte no encontrado');
      alert('Error: No se pudo generar el reporte para la fecha especificada');
    } else {
      console.error(`Error al generar reporte: ${this.status} ${this.statusText}`);
      console.error('Response:', this.response);
      alert(`Error al generar reporte: ${this.status} - ${this.statusText}`);
    }
  };

  xhttp.onerror = function () {
    console.error('Error de red al solicitar el reporte');
    alert('Error de conexión al intentar generar el reporte');
  };

  xhttp.ontimeout = function () {
    console.error('Timeout al generar el reporte');
    alert('Tiempo de espera agotado al generar el reporte. Intenta nuevamente.');
  };

  xhttp.send();
}

// Función auxiliar para validar si es un archivo Excel válido
function validateExcelFile(uint8Array) {
  if (uint8Array.length < 8) return false;
  
  // Magic numbers para archivos Excel (.xlsx)
  // ZIP signature (ya que .xlsx es un ZIP): 0x50, 0x4B
  const zipSignature = uint8Array[0] === 0x50 && uint8Array[1] === 0x4B;
  
  if (!zipSignature) {
    // También verificar magic numbers para archivos Excel legacy (.xls)
    // Excel 97-2003: D0CF11E0A1B11AE1
    const excelLegacy = uint8Array[0] === 0xD0 && uint8Array[1] === 0xCF && 
                       uint8Array[2] === 0x11 && uint8Array[3] === 0xE0;
    return excelLegacy;
  }
  
  return true; // Si tiene ZIP signature, probablemente es un .xlsx válido
}


function updateActivityToGuard() {

  const baseUri = document.location.ancestorOrigins[0] + '/rest/ofscCore/v1/activities/' + activityId ;
  const autorization = sessionStorage.getItem('AutorizationFSM');
  const bodyUpdate = {
    activityType: 'OnCall'
  };

  const body = JSON.stringify(bodyUpdate);
  console.log("Payload:", body);

  const xhttp = new XMLHttpRequest();
  xhttp.open('PATCH', baseUri,false);
  xhttp.setRequestHeader('Content-Type', 'application/json');
  xhttp.setRequestHeader('Authorization', autorization);


  xhttp.onreadystatechange = function () {
    if (this.readyState !== 4) return;


    if (this.status >= 200 && this.status < 300) {
      let arr;
      try {
        console.log("Succes");
      } catch (e) {
        console.error("JSON inválido:", this.responseText);
        commentsTable.clearData();
        return;
      }

      // Validar que el primer elemento tenga id distinto de null
      if (arr.length > 0 && arr[0].id != null) {
        comment.value = '';
        sendAttachments(arr[0].id);
        getTracking();
      } else {
        alert('La respuesta no contenía un id válido.');
      }

    } else {
      console.error("Error HTTP:", this.status, this.responseText);
      commentsTable.clearData();
    }
  };

  xhttp.send(body);
}







function getMyTrackingSwat() {
  getResources();

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');  // getMonth() va de 0 a 11
  const day = String(now.getDate()).padStart(2, '0');
  const todayLocal = `${year}-${month}-${day}`;


  // 1. Inicializa la tabla con las columnas
  const commentsTable = new Tabulator("#myTrackingSwat", {
    height: "auto",
    layout: "fitColumns",
    placeholder: "No hay Actividades Asignadas",
    pagination: "local",
    paginationSize: 25,
    paginationSizeSelector: [50, 75, 100],
    // 1) Le decimos a Tabulator que ordene inicialmente por timeSlot ascendente
    initialSort: [
      { column: "timeSlot", dir: "asc" }
    ],
    rowFormatter: function (row) {
      const data = row.getData();
    },

    columns: [
      { title: "Orden", "width": 150, field: "apptNumber" },
      {
        title: "Horario", "width": 90,
        field: "timeSlot",
        sorter: "string",        // 2) (opcional) indicamos explícitamente un sorter
        headerSort: true         //    para que al hacer clic siga ordenando
      },
      { title: "VIN", "width": 200, field: "vin" },
      { title: "Cuenta", "width": 300, field: "account" },
      { title: "Estatus","width": 100, field: "status" },
      { title: "Instalador", field: "resourceName" },
    ],
  });

  originUrl = document.location.ancestorOrigins[0] + '/rest/ofscCore/v1/activities/custom-actions/search';
  const autorization = sessionStorage.getItem('AutorizationFSM');

  // 2. Lógica de llamada
  const params = new URLSearchParams({
    fields: 'activityId,xa_wo_cuenta,apptNumber,status,workZone,activityType,timeSlot,resourceId,xa_note,xa_car_vin,xa_agente_cai,city,stateProvince',
    dateFrom: todayLocal,
    dateTo: todayLocal,
    searchInField: 'xa_classification',
    searchForValue: 'SWAT',
    limit: 200,
  });
  const uri = `${originUrl}?${params.toString()}`;  // monta la URL completa
  const xhttp = new XMLHttpRequest();
  xhttp.open('GET', uri, true);
  xhttp.setRequestHeader('Content-Type', 'application/json');
  xhttp.setRequestHeader('Authorization', autorization);


  xhttp.onreadystatechange = function () {
    if (this.readyState !== 4) return;

    if (this.status === 200) {
      let data;
      try {
        data = JSON.parse(this.responseText);
      } catch {
        console.error("JSON inválido:", this.responseText);
        commentsTable.clearData();
        return;
      }
      if (data.items && data.items.length > 0) {
        const rows = data.items.map(item => ({
          activityId: item.activityId,
          apptNumber: item.apptNumber,
          status: item.status === 'pending' ? 'Pendiente' : item.status === 'started' ? 'Iniciado' : item.status === 'completed' ? 'Completado' : item.status === 'cancelled' ? 'Cancelado' : item.status === 'notdone' ? 'Cancelado' : item.status,
          timeSlot: item.timeSlot,
          resourceName: findValuesByField('resource_id', item.resourceId, 'resource_name')[0] || 'cc',
          account: item.xa_wo_cuenta,
          vin: item.xa_car_vin,
          agent: item.xa_agente_cai,
        }));
        commentsTable.setData(rows);
      }

    } else {
      console.error('Error al obtener tracking:', this.status);
      commentsTable.clearData();
    }
  };

  xhttp.send();
}





function getResources() {

 const Autorizacion = sessionStorage.getItem('Autorizacion');
const urlGetTracking = sessionStorage.getItem('urlWoTracking')+'/getResources';


  const spinner = document.getElementById('preloadGet');


  const xhttp = new XMLHttpRequest();
  xhttp.open('GET', urlGetTracking,false);
  xhttp.setRequestHeader('Content-Type', 'application/json');
  xhttp.setRequestHeader('Authorization', Autorizacion);


  xhttp.onreadystatechange = function () {
    if (this.readyState !== 4) return;

    if (this.status === 200) {

      try {
        resources = JSON.parse(this.responseText);
        console.log("Recursos obtenidos:", resources);
      }
      catch {
        console.error("JSON inválido:", this.responseText);
        return;
      }
    } else {
      console.error('Error al obtener tracking:', this.status);
      commentsTable.clearData();
    }
  };

  xhttp.send();

}


function findValuesByField(field, value, targetField) {
  if (!resources || !Array.isArray(resources)) {
    console.error("Resources is not a valid array.");
    return [];
  }

  return resources
    .filter(resource => resource[field] === value)
    .map(resource => resource[targetField]);
}






function sendAttachmentsXLS() {
const spinner = document.getElementById('preload2');
const btn = document.getElementById('uploadConfiguration'); 

btn.disabled = true;


  spinner.style.visibility = 'visible';
  // 2) vaciar lista en pantalla
  attachmentsList.innerHTML = '';
  if (pendingFiles.length > 0) {
    // 1) Preparamos el FormData con los archivos
    const form = new FormData();
    pendingFiles.forEach((file, i) => {
      form.append(`file${i}`, file, file.name);
    });




    const Autorizacion = sessionStorage.getItem('Autorizacion');
    const urlGetTracking = sessionStorage.getItem('urlWoTracking')+'/uploadProductDevices';

    // 2) Creamos y configuramos el XHR
    const xhttp = new XMLHttpRequest();
    xhttp.open('POST', urlGetTracking);
    // NO fijamos Content-Type: el navegador lo genera automáticamente
    xhttp.setRequestHeader(
      'Authorization',
      Autorizacion
    );

    // 3) Definimos el handler ANTES de enviar
    xhttp.onreadystatechange = function () {
      if (this.readyState !== 4) return;

      spinner.style.visibility = 'hidden';
      btn.disabled = false;


      if (this.status >= 200 && this.status < 300) {
        clearAttachments();
        alert('Proceso enviado correctamente.');
      } else {
        console.error("Error HTTP:", this.status, this.responseText);
        alert(`Error inesperado: ${this.status}`);
      }
    };

    // 4) Enviamos el FormData
    console.log("Enviando payload multipart:", form);
    xhttp.send(form);
  }


}








