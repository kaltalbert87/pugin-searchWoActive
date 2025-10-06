# SearchWoByVin — Plugin para Field Service (Buscar actividades por VIN)

Breve: este plugin web busca órdenes/actividades por VIN contra una API (n8n) y permite asignar un técnico a una actividad. Está pensado para ejecutarse embebido dentro de Oracle Field Service (OFS) como un iframe, comunicándose con el padre por `postMessage`.

## Objetivo del README
- Documentar el comportamiento del plugin.
- Explicar el flujo de asignación y cómo verificar que el botón "Confirmar Selección" sólo se activa cuando el usuario pulsa explícitamente "Asignar".

## Contrato mínimo
- Entrada: el usuario introduce una fracción de VIN en la UI (`index.html`).
- Salida: petición PATCH a `${urln8n}crm/SelfAssigned` con payload `{ resourceid, woNumber }` y cabecera `Authorization` provista por el host (o fallback local para pruebas).
- UX clave: el botón `Confirmar Selección` permanece deshabilitado hasta que el usuario haga click explícito en `Asignar`.

## Archivos clave
- `index.html` — Interfaz (VIN input, resultados, área de selección, botones Confirmar/Limpiar).
- `search.js` — Lógica del plugin:
	- `doSearch()` realiza GET a `crm/searchWoByVin?vin=...`.
	- `fetchResources()` obtiene técnicos desde `fsm/resources`.
	- `renderResourceSelector()` muestra selects (organización/técnico) y el botón `Asignar`.
	- `assignResource()` guarda la selección en `this.selectedResource` y habilita `Confirmar`.
	- `confirmSelection()` envía PATCH a `crm/SelfAssigned` y, al recibir éxito, muestra modal y envía un `postMessage` al host para pedir cierre.
- `styles.css` — Estilos visuales y modal.

> Nota: se implementó explícitamente que seleccionar un técnico en el `<select>` no habilita `Confirmar` automáticamente; es necesario pulsar `Asignar`.

## Requisitos y configuración
- No hay servidor incluido: la app hace XHRs contra un `n8n` base URL que el host debe proporcionar mediante `postMessage` / `open` con `securedData.n8nUrl` y `securedData.Authorization`.
- Fallback local: cuando no se detecta parent, `search.js` establece valores de prueba para `urln8n` y `Autorizacion` (útil para pruebas offline). Revisa la función `sendWebMessage()` si quieres cambiar esos valores.

## Cómo probar localmente
1. Abrir `index.html` en un navegador (doble clic o `open index.html` en macOS).

```bash
# desde la raíz del proyecto (opcional) sirve abrir archivo directamente
open index.html
```

2. Flujo de prueba manual:
	 - Ingresa una fracción de VIN y haz click en "Buscar".
	 - En la lista de resultados selecciona una actividad. Observa que el botón "Confirmar Selección" está deshabilitado.
	 - En el selector de técnicos elige uno y pulsa `Asignar`.
	 - Tras pulsar `Asignar`, el botón `Confirmar Selección` se habilita.
	 - Pulsa `Confirmar Selección` para enviar la petición al endpoint `crm/SelfAssigned`.

3. Logs: abre la consola del navegador para ver mensajes `console.log()` (envío de `postMessage`, payloads, respuestas XHR y errores).

## Cómo verificar específicamente que "Confirmar" sólo se activa tras "Asignar"
1. Carga `index.html`.
2. Realiza una búsqueda y selecciona una actividad.
3. No toques el select de técnicos: confirma visualmente que `Confirmar Selección` está deshabilitado.
4. Selecciona un técnico en el select, pero NO pulses `Asignar`: `Confirmar` debe permanecer deshabilitado.
5. Ahora pulsa `Asignar`: el texto de nota cambiará a "Asignado: <nombre> (...)" y `Confirmar Selección` se habilitará.
6. Si cambias de actividad o pulsas "Limpiar", `Confirmar` debe volver a deshabilitarse.

Esto reproduce el requisito UX: la acción de asignación es explícita.

## Integración con Oracle Field Service (OFS)
1. OFS debe incluir este HTML/JS en un iframe y enviar un `postMessage` `open` con `securedData` conteniendo `n8nUrl` y `Authorization`.
2. Tras una asignación exitosa, `search.js` envía al parent un mensaje de cierre con el siguiente payload:

```json
{ "apiVersion": 1, "method": "close", "backScreen": "mobility", "wakeupNeeded": false }
```

3. Si el parent no cierra la vista, el plugin intenta `history.back()` como fallback.

## Casos borde y notas
- El botón `Confirmar` permanecerá deshabilitado si no se ha pulsado `Asignar` (incluso si el `<select>` tiene un valor). Esto previene confirmaciones accidentales.
- Si cambias de actividad (o limpias la selección), `selectedResource` se borra y `Confirmar` vuelve a desactivarse.
- `confirmSelection()` no intentará auto-asignar ya que la UX exige el click explícito en `Asignar`.
- Validaciones de red y errores XHR se muestran en `statusArea`.

## Dónde ajustar cosas rápido
- Cambiar la URL base o encabezados por defecto (modo local) en `sendWebMessage()` dentro de `search.js`.
- Mensajes al host y payload de cierre en `confirmSelection()`.
- Si prefieres que seleccionar del `<select>` habilite `Confirmar` automáticamente, añade un `change` handler en `resourceSelect` que habilite el botón o modifica `assignResource()` para activarse en `change`.

## Siguientes pasos sugeridos
- Probar en entorno OFS real para verificar que el parent responde al payload de cierre.
- (Opcional) añadir tests automatizados para la lógica `assignResource()` / `confirmBtn`.
- Si quieres, hago ahora uno de estos: crear un commit con el README, añadir un `change` handler para habilitar Confirmar en `change`, o preparar un PR.

---
Si quieres que haga commit ahora con un mensaje claro (`feat: document plugin and confirm-button behavior`) dilo y lo hago; si prefieres probar primero en tu navegador, dime y te guío en los pasos.
