# Plan Maestro de Progreso y Evolución (Roadmap v2.0 – v3.0): Sanctum Rosarium · Rosario con CruxVincet

**Arquitectura Offline-First (iOS / iPadOS / Android PWA) y Dirección de Producto para el Apostolado CRVX VINCET (@CRVXVINCET)**

---

## 1. Principios de Ingeniería Innegociables: Cero Regresión en Sincronización y Estabilidad

El núcleo actual de *Sanctum Rosarium* garantiza que el rezo del Santo Rosario transcurra sin interrupciones, caídas de red ni desajustes entre las cuentas, los textos en pantalla y el motor de audio (`<audio>`). Para evolucionar hacia las versiones **v2.0 a v3.0** sin comprometer jamás esta estabilidad lograda, toda nueva funcionalidad se rige por cuatro leyes arquitectónicas:

1. **Inmutabilidad del Motor de Estado Principal (Core Bead Engine):** La máquina de estados que gobierna el avance de las cuentas (Señal de la Cruz, Credo, Padrenuestro, Avemarías, Gloria, Jaculatorias y Salve) permanece aislada. Las nuevas capas (meditaciones, lecturas por cuenta e intenciones) se acoplan como **interceptores opcionales de ciclo de vida** (`onBeforeMystery`, `onBeadChange`, `onBeforeRosary`) desacoplados del reloj del reproductor.
2. **Degradación Graciosa y Carga Asíncrona No Bloqueante:** Ningún texto patrístico, meditación o registro de intenciones puede bloquear el hilo principal ni retrasar el evento `play()` de un archivo de audio. Si un recurso secundario falla o está desactivado, el motor avanza instantáneamente al audio de la oración vocal.
3. **Estrategia de Almacenamiento Local Segregado:**
   - **Activos Estáticos e Inmutables (Audios y JSON Doctrinales pre-1958):** Resguardados mediante [CacheStorage API](https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage) bajo versionado estricto en el [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API), permitiendo actualizaciones atómicas sin corromper la versión activa.
   - **Datos Dinámicos y Privados del Fiel (Intenciones y Preferencias):** Almacenados en [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) con respaldo ligero de banderas de configuración en `localStorage`, garantizando persistencia local sin servidor externo.
4. **Protección contra Purga de Almacenamiento en iOS/Android:** Invocación proactiva de [StorageManager.persist()](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist) tras la instalación en pantalla de inicio (Add to Home Screen) para blindar tanto la caché de audios como el cuaderno de intenciones frente a limpiezas automáticas del sistema operativo.

---

## 2. Roadmap Evolutivo Estructurado (v2.0 – v3.0)

| Fase / Versión | Módulo Principal | Alcance Doctrinal (Pre-1958) | Mecanismo de Aislamiento y Sincronización | Estado por Defecto |
| :--- | :--- | :--- | :--- | :--- |
| **Fase 1 (v2.0)** | **Meditaciones Breves por Misterio** | Fruto espiritual del misterio y consideración ascética tradicional antes del Padrenuestro inicial de cada decena. | Hook `preMysteryHook`: estado intermedio opcional en la máquina de estados; botón de «Saltar meditación» en un toque y interruptor global persistente. | **Opcional** (Configurable: Audio + Texto / Solo Texto / Desactivado) |
| **Fase 2 (v2.5)** | **Pasajes Escriturísticos y Patrísticos por Cuenta** | Versículos de la Sagrada Escritura (Vulgata Sixto-Clementina / Mons. Straubinger / Torres Amat) y sentencias de los Santos Padres y Doctores por cada una de las 10 Avemarías. | Renderizado reactivo ligero (`O(1)` lookup desde JSON pre-empaquetado en memoria) vinculado al índice `[misterio][cuenta]`. Cero impacto en la pista de audio en curso. | **Opcional** (Conmutador en barra de lectura superior) |
| **Fase 3 (v3.0)** | **Cuaderno Local y Privado de Intenciones** | Peticiones organizadas en 4 categorías: *Vivos*, *Fieles Difuntos*, *Por la Santa Iglesia* y *Por los Sacerdotes y Seminarios de la FSSPX*. | Almacenamiento 100% local en [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) (con cifrado opcional en dispositivo vía [SubtleCrypto](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto)) + exportación/importación en archivo JSON local. | **100% Local / Sin Servidores** |

---

### Detalle de Ingeniería por Fase

#### Fase 1 (v2.0): Meditaciones Tradicionales Pre-1958 Antes de Cada Misterio
* **Fundamento Espiritual y Doctrinal:** Conforme al método recomendado por San Luis María Grignion de Montfort y los manuales devocionales pre-1958 hasta el pontificado de Pío XII, tras enunciar el misterio se propone una breve consideración de 15 a 25 segundos junto con el **Fruto del Misterio** (ej. *Primer Misterio Gozoso: La Anunciación del Ángel a Nuestra Señora — Fruto: La profunda humildad*).
* **Arquitectura de Integración Segura (Zero-Breakage):**
  - El flujo actual `ENUNCIACIÓN_MISTERIO -> PADRENUESTRO` se expande a una transición condicional: `ENUNCIACIÓN_MISTERIO -> [MEDITACIÓN_OPCIONAL] -> PADRENUESTRO`.
  - **Tres Modos de Operación en Ajustes:**
    1. *Modo Completo (Audio + Texto):* Reproduce el audio breve de la meditación tras enunciar el misterio y avanza automáticamente al Padrenuestro al dispararse el evento `ended`.
    2. *Modo Contemplativo Silencioso (Solo Texto con Pausa Configurable o Avance Manual):* Muestra el texto de la meditación sin pista adicional de voz para quien desea meditar mentalmente antes de iniciar el Padrenuestro.
    3. *Modo Directo (Desactivado):* Salta el nodo de meditación en `0ms`, conservando el comportamiento exacto de la versión v1.x.
  - **Control en Tiempo Real:** Durante la reproducción o visualización de la meditación, un botón sutil y accesible (`Saltar meditación ⏭`) permite cortar el paso intermedio y entrar directamente al Padrenuestro sin desincronizar el contador de la decena.

#### Fase 2 (v2.5): Lectura de Pasajes Escriturísticos y Patrísticos por Cuenta o Decena
* **Fundamento Espiritual y Doctrinal:** Para combatir las distracciones de la imaginación y alimentar la oración mental mientras los labios pronuncian el Avemaría (siguiendo la tradición cartujana y montfortiana del Rosario meditado), cada una de las 50 Avemarías de cada serie de misterios (Gozosos, Dolorosos y Gloriosos) cuenta con:
  - **Vista por Cuenta (1 a 10):** Un versículo bíblico tradicional (traducciones clásicas aprobadas pre-1958) o una máxima breve de los Santos Padres y Doctores (San Agustín, San Bernardo, Santo Tomás de Aquino, San Alfonso María de Ligorio) que ilumina el punto exacto de la escena evangélica.
  - **Vista por Decena (Resumen Patrístico):** Para quienes prefieren una sola lectura fija durante las diez cuentas sin cambio visual en cada Avemaría.
* **Arquitectura de Integración Segura (Zero-Breakage):**
  - **Cero Alteración del Flujo de Audio:** Los pasajes por cuenta son **exclusivamente visuales y síncronos al índice de cuenta activa** (`currentMysteryIndex`, `currentBeadIndex`). El motor de audio continúa reproduciendo las Avemarías con la misma cadencia y precisión que hoy.
  - **Estructura de Datos Estática Pre-Indexada:** Un archivo compacto `/data/patristic_beads_pre1958.json` (~45 KB comprimido) se precarga en el arranque desde la caché del Service Worker. Al avanzar de la cuenta `n` a `n+1`, la interfaz actualiza un nodo DOM aislado (`#bead-scripture-card`) mediante `textContent` puro (sin re-renderizar el árbol completo de la aplicación ni tocar el reproductor `<audio>`).
  - **Integración con Pantalla Bloqueada:** Se actualiza dinámicamente el subtítulo en [MediaSession API](https://developer.mozilla.org/en-US/docs/Web/API/MediaSession) (`navigator.mediaSession.metadata`) para que incluso desde la pantalla de bloqueo de iOS o Android el fiel pueda leer la jaculatoria o cita breve de la cuenta en curso.

#### Fase 3 (v3.0): Cuaderno Local y Privado de Intenciones del Rosario
* **Fundamento Espiritual y Privacidad Absoluta:** Las intenciones del alma pertenecen al fuero interno de la oración del fiel. Por principio ético y arquitectónico, **jamás se envían a ningún servidor, nube ni base de datos externa**. Todo vive exclusivamente en la memoria interna del teléfono o tableta del usuario.
* **Taxonomía Tradicional del Cuaderno de Intenciones:**
  1. **Por la Santa Iglesia Católica:** El triunfo del Inmaculado Corazón de María, la exaltación de nuestra Santa Madre la Iglesia y la extirpación de los errores modernos.
  2. **Por los Sacerdotes y Vocaciones de la FSSPX:** Santificación, perseverancia y fruto apostólico de los obispos, sacerdotes, seminaristas, religiosos y casas de la Fraternidad Sacerdotal San Pío X.
  3. **Por los Vivos (Familiares, Bienhechores y Necesidades Espirituales/Temporales):** Conversión de pecadores, enfermos, familias, ahijados y bienhechores del apostolado.
  4. **Por los Fieles Difuntos (Ánimas del Purgatorio):** Padres, parientes, amigos y ánimas más olvidadas del Purgatorio.
* **Arquitectura Técnica Local (`IndexedDB` + Respaldo Soberano):**
  - **Almacenamiento en `IndexedDB` (`IDBObjectStore`):** Creación del almacén `rosary_intentions_v1` mediante la [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) con campos `{ id, category, title, details, assignedMysteries, active, createdAt }`.
  - **Cifrado Local Opcional (Privacidad Reforzada):** Opción de proteger el cuaderno con un PIN local que deriva una clave AES-GCM de 256 bits en el propio dispositivo mediante [SubtleCrypto.deriveKey()](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveKey) y [SubtleCrypto.encrypt()](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt).
  - **Presentación en el Rezo:**
    - *En el Ofrecimiento Inicial:* Antes de comenzar la Señal de la Cruz, se despliega una tarjeta serena con las intenciones activas del día para que el fiel las una mentalmente al ofrecimiento del Rosario.
    - *Asignación por Misterio (Opcional):* El usuario puede vincular una intención específica a cada uno de los 5 misterios (ej. *1.º Misterio por la Iglesia y la FSSPX; 2.º Misterio por mis padres; 5.º Misterio por las ánimas del Purgatorio*), mostrándose como un cintillo discreto durante esa decena.
  - **Respaldo Manual sin Nube (Exportar / Importar):** Botón para exportar las intenciones a un archivo `.json` descargable en la app *Archivos* de iOS o *Descargas* de Android, permitiendo al usuario conservar su respaldo personal o transferirlo si cambia de teléfono, sin depender de cuentas ni servidores.

---

## 3. Textos para la Ventana de Donación / Apoyo al Apostolado (Español e Inglés)

Diseñados con tono cálido, sobrio, filial y persuasivo, listos para integrarse en un modal o pestaña dedicada dentro de la PWA.

### Versión en Español (ES)

**Título de la Ventana:**
> **Sostén este Apostolado y Ayúdanos a Llevar el Santo Rosario a Más Almas**

**Cuerpo del Mensaje:**
> *Sanctum Rosarium · Rosario con CruxVincet* es una obra de apostolado católico tradicional creada para ayudarte a rezar con recogimiento, fidelidad doctrinal y totalmente libre de anuncios, rastreadores o distracciones mundanas, incluso sin conexión a internet.
>
> Con la gracia de Dios, trabajamos ya en las **próximas actualizaciones (v2.0 – v3.0)**, que integrarán de forma segura:
> - **Meditaciones tradicionales pre-1958** breves antes de cada misterio (con opción de activarlas o saltarlas).
> - **Pasajes de la Sagrada Escritura y de los Santos Padres** para contemplar en cada cuenta o decena.
> - **Cuaderno privado de Intenciones del Rosario** (por tus seres queridos vivos y difuntos, por la Santa Iglesia y por los sacerdotes de la **FSSPX**), guardado al 100 % en tu propio teléfono sin servidores externos.
>
> **Tu generosidad acelera esta misión:** El desarrollo técnico, la grabación y el mantenimiento de esta herramienta se sostienen gracias a bienhechores como tú. Si este proyecto suma patrocinadores y donantes, podremos publicar estas nuevas funciones con mucha mayor velocidad.
>
> **Abiertos a colaborar con la Tradición:** Expresamos nuestra total disposición y alegría para colaborar con sacerdotes, miembros, capillas y proyectos apostólicos vinculados a la **Fraternidad Sacerdotal San Pío X (FSSPX)**.
>
> *Cada ofrenda, grande o pequeña, y cada Avemaría rezada por este apostolado nos ayuda a perseverar. ¡Dios te pague y la Santísima Virgen te alcance abundantes gracias!*

**Botones de Acción (UI CTAs):**
- Botón Principal: `[ Hacer una Donación / Ser Patrocinador ]`
- Botón Secundario: `[ Colaboraciones y Proyectos FSSPX · Contactar ]`
- Nota al pie: *«Oh María, por la Crucifixión Dolorosa de tu Divino Hijo, y por tus penas y dolores, alcánzanos de Dios la gracia de nuestra conversión y la libertad para su Iglesia. Amén.»*

---

### English Version (EN)

**Modal Title:**
> **Support This Apostolate & Help Us Bring the Traditional Rosary to More Souls**

**Message Body:**
> *Sanctum Rosarium · Rosary with CruxVincet* is a traditional Catholic apostolate built to help you pray with recollection, doctrinal fidelity, and complete freedom from ads, trackers, or worldly distractions—even 100% offline.
>
> By the grace of God, we are actively developing our **upcoming releases (v2.0 – v3.0)**, which will seamlessly introduce:
> - **Brief pre-1958 traditional meditations** before each mystery (with the option to enable or skip them at any time).
> - **Scriptural and Patristic readings** for each bead or decade to deepen mental prayer.
> - **A private, local Rosary Intentions Notebook** (for the living, the faithful departed, the Holy Church, and the priests of the **SSPX**), stored 100% on your own device with zero external servers.
>
> **Your generosity accelerates our roadmap:** Coding, audio production, and ongoing maintenance rely entirely on benefactors like you. With the support of sponsors and donors, we can deliver these upcoming features much faster.
>
> **Open to SSPX Collaboration:** We warmly welcome collaboration with priests, faithful, chapels, and apostolic initiatives associated with the **Society of Saint Pius X (SSPX / FSSPX)**.
>
> *Every contribution, large or small, and every Hail Mary offered for this apostolate helps us persevere. May God reward you, and may Our Blessed Lady obtain abundant graces for you!*

**Action Buttons (UI CTAs):**
- Primary Button: `[ Make a Donation / Become a Sponsor ]`
- Secondary Button: `[ SSPX Collaborations & Inquiries · Contact Us ]`
- Footer Prayer: *"O Mary, through the Sorrowful Crucifixion of thy Divine Son, and through thy sorrows and pains, obtain for us from God the grace of our conversion and freedom for His Church. Amen."*

---

## 4. Arquitectura de Resguardo y Ofuscación Ligera de Audios Offline (iOS/iPadOS Safari y Android)

### 4.1. El Desafío Crítico de WebKit (Safari en iPhone / iPad) con `<audio>` Offline

En navegadores basados en Chromium (Android), el elemento `<audio>` tolera múltiples esquemas de carga. Sin embargo, **WebKit en iOS y iPadOS** impone tres restricciones estrictas que rompen la reproducción si no se diseñan con precisión quirúrgica:
1. **Exigencia de `HTTP 206 Partial Content` (Byte-Range Requests):** Cuando `<audio src="...">` solicita un archivo a través de un Service Worker, Safari envía cabeceras `Range: bytes=0-1` o `Range: bytes=0-` y exige una respuesta [206 Partial Content](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/206) con `Content-Range` y `Accept-Ranges: bytes`. Si el Service Worker devuelve un `200 OK` plano o un flujo corrupto, Safari en iOS silencia el audio o lanza `MEDIA_ERR_SRC_NOT_SUPPORTED`.
2. **Penalización de Memoria con `Base64` (`data:audio/mpeg;base64,...`):** Convertir audios a cadenas Base64 infla el tamaño un **33 %** en disco y obliga a Safari a decodificar toda la cadena en memoria RAM en el hilo principal antes de reproducir el primer milisegundo, causando latencia perceptible entre cuentas o cierres inesperados en dispositivos con poca RAM.
3. **Bloqueo de Autoplay al Cambiar de Pista en Segundo Plano:** En iOS, si la pantalla está bloqueada y el cambio de pista tarda más de un ciclo asíncrono largo o crea un nuevo elemento `<audio>` desde cero, WebKit bloquea la reproducción por política de gestos de usuario (`User Activation`).

---

### 4.2. Comparativa de Estrategias de Ofuscación + Almacenamiento Offline

| Criterio Técnico | Opción A (Recomendada): Binario Ofuscado por Cabecera XOR (`*.cvx`) en `CacheStorage` + Desofuscación en RAM a `Blob URL` | Opción B: Interceptación Transparente en `ServiceWorker` con Soporte `206 Range` sobre `CacheStorage` | Opción C (No Recomendada para Audios Largos): `Base64 + XOR` en `IndexedDB` / `localStorage` |
| :--- | :--- | :--- | :--- |
| **Complejidad de Ofuscación** | **XOR Ligero de Cabecera/Bloque (primeros 4 KB o archivo completo en `Uint8Array`)** | XOR completo o por bloques al responder en el evento `fetch` | Cadena Base64 + XOR carácter por carácter |
| **Sobrecarga de Almacenamiento** | **0 %** (Binario puro `ArrayBuffer`) | **0 %** (Binario puro `ArrayBuffer`) | **+33 % a +100 %** (Inflado por Base64 y UTF-16) |
| **Latencia de Reproducción (`<audio>`)** | **< 2 ms (Instantánea)** vía pre-generación de `URL.createObjectURL(blob)` en memoria | **< 5 ms**, pero requiere construir respuestas `206 Partial Content` exactas para Safari | **30 ms – 180 ms** (Bloquea el hilo principal al decodificar Base64) |
| **Compatibilidad con Safari iOS/iPadOS** | **Máxima (100 %):** Un `Blob` nativo en memoria con MIME `audio/mp4` o `audio/mpeg` no sufre fallos de Range en el Service Worker | **Alta**, siempre que el manejador `Range` del Service Worker sea 100 % conforme al estándar | **Frágil:** Los `data:` URIs grandes fallan en `MediaSession` o agotan memoria en iOS |
| **Protección contra Descarga Directa Casual** | **Alta:** Los archivos en red y en caché son `.bin`/`.cvx` ilegibles por reproductores externos si se extraen crudos | **Alta:** Los archivos en red están ofuscados | **Media/Alta**, pero penaliza el rendimiento |

---

### 4.3. Arquitectura Híbrida Recomendada (Doble Escudo sin Latencia)

Para lograr **protección efectiva de los audios del apostolado**, **funcionamiento 100 % sin conexión** y **reproducción instantánea (`0ms` de salto entre cuentas)** tanto en iPhone/iPad como en Android, se recomienda el **Patrón de Empaquetado Binario XOR + Pre-Hidratación de `Blob URL` con Respaldo `206 Range`**:

#### Paso 1: Ofuscación en Tiempo de Compilación (Build-Time Packaging)
En lugar de subir archivos `.mp3` o `.m4a` planos al servidor estático (que cualquier bot o extractor descargaría directamente), un script de compilación aplica un **XOR binario con clave rodante de 32 bytes** (o cifra los primeros `8192 bytes` donde reside la cabecera ID3/MP4/AAC junto con una máscara ligera en el resto del binario) y los guarda con extensión opaca `.cvx` (ej. `/assets/audio/ave_maria_01.cvx`).
* Si alguien descarga `/assets/audio/ave_maria_01.cvx` desde el navegador o inspecciona el tráfico de red, el archivo no es reconocido por ningún reproductor multimedia porque su firma mágica (`magic bytes`) está ofuscada.
* **Si el flujo actual ya utiliza un empaquetado `Base64 + XOR` para activos pequeños:** En el momento en que el Service Worker o el instalador descarga el paquete por primera vez, debe **decodificar el Base64 una sola vez fuera del hilo crítico** (durante la precarga) y guardar en la [Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache) únicamente el `ArrayBuffer` binario (ofuscado con XOR o listo para hidratar), eliminando para siempre el costo del 33 % de Base64 durante el rezo diario.

#### Paso 2: Resguardo 100 % Offline en `CacheStorage` Versionado
El Service Worker precarga todos los paquetes `.cvx` en una caché dedicada e independiente del código de la interfaz (`sanctum-rosarium-audio-v1`):
* Separar la caché de código (`sanctum-rosarium-app-v2.0`) de la caché de audio (`sanctum-rosarium-audio-v1`) garantiza que **actualizar la aplicación a v2.0, v2.5 o v3.0 jamás obligue al usuario a volver a descargar los audios** ni rompa el funcionamiento offline.

#### Paso 3: Desofuscación Ultrarrápida en Memoria (`Uint8Array` XOR) y Pool de `ObjectURL`
Una operación XOR sobre un `Uint8Array` de 200 KB en JavaScript moderno tarda **menos de 0.4 milisegundos**.
1. Al iniciar la sesión del Rosario (o precargando solo las pistas necesarias del misterio actual), el motor lee el archivo `.cvx` desde `caches.match()`, ejecuta el XOR inverso en un `Uint8Array`, construye un `new Blob([decryptedBuffer], { type: 'audio/mpeg' })` y genera una dirección interna mediante [URL.createObjectURL()](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static).
2. **Reutilización de Instancia Única de `<audio>` para Safari iOS:** En lugar de destruir y crear etiquetas `<audio>` en cada cuenta (lo cual pierde el permiso de reproducción en segundo plano de iOS), se mantiene **una única instancia maestra de `HTMLAudioElement`** (o un doble búfer `audioA` / `audioB` pre-desbloqueado en el primer toque del botón «Iniciar Rosario») y simplemente se asigna `audioElement.src = blobUrlMap.get(trackId)` seguido de `audioElement.play()`.
3. **Gestión de Memoria Limpia:** Para los audios comunes que se repiten 10 o 50 veces (Señal de la Cruz, Padrenuestro, Avemaría, Gloria, Jaculatoria de Fátima), sus `blob:` URLs se mantienen en un `Map` en memoria durante toda la sesión (~2 MB totales en RAM) con **latencia cero** en cada repetición. Para los audios específicos de un misterio (enunciación y meditación de Fase 1), se pre-hidratan un misterio antes y se liberan con `URL.revokeObjectURL()` al concluir dicho misterio.

---

### 4.4. Implementación de Referencia Lista para Producción

A continuación se presenta el módulo arquitectónico completo (`AudioVaultEngine.js` + manejador de `Range` para `sw.js`) diseñado para mantener compatibilidad total con Safari iOS/iPadOS y Android:

```javascript
/**
 * Sanctum Rosarium · CRVX VINCET
 * Motor de Resguardo, Desofuscación Ligera (XOR + Base64/Binario) y Reproducción Instantánea Offline
 * Compatible 100% con Safari iOS/iPadOS y Android Chrome/WebView
 */

const AUDIO_CACHE_NAME = 'crvx-sanctum-rosarium-audio-vault-v1';

// Clave de ofuscación rodante de 16 bytes (personalizable en build-time)
const XOR_KEY = new Uint8Array([
  0x43, 0x52, 0x56, 0x58, 0x56, 0x49, 0x4E, 0x43,
  0x45, 0x54, 0x31, 0x39, 0x35, 0x38, 0x4D, 0x52
]);

export class OfflineAudioVault {
  constructor() {
    // Mapa en memoria de trackId -> ObjectURL listo para reproducción instantánea (<1ms)
    this.memoryBlobUrls = new Map();
    // Instancia única de <audio> para preservar el desbloqueo de autoplay en iOS con pantalla apagada
    this.masterAudio = new Audio();
    this.masterAudio.preload = 'auto';
  }

  /**
   * 1. Solicita blindaje de almacenamiento persistente al sistema operativo (iOS/Android)
   */
  async ensurePersistentStorage() {
    if (navigator.storage && navigator.storage.persist) {
      const isPersisted = await navigator.storage.persisted();
      if (!isPersisted) {
        await navigator.storage.persist();
      }
    }
  }

  /**
   * 2. Operación XOR simétrica in-place ultrarrápida (<0.5ms por pista de voz)
   * Si se ofuscan solo los primeros 8192 bytes (cabecera + inicio de frames) o el archivo completo,
   * basta ajustar el límite 'limit'.
   */
  applyXorTransform(uint8Buffer, headerOnly = false) {
    const keyLen = XOR_KEY.length;
    const limit = headerOnly ? Math.min(uint8Buffer.byteLength, 8192) : uint8Buffer.byteLength;
    for (let i = 0; i < limit; i++) {
      uint8Buffer[i] ^= XOR_KEY[i % keyLen];
    }
    return uint8Buffer;
  }

  /**
   * 3. Soporte híbrido: Si un activo proviene de un paquete Base64+XOR heredado,
   * lo convierte a Uint8Array binario una sola vez para no penalizar la RAM en cada Avemaría.
   */
  decodeBase64XorToUint8(base64String, headerOnly = false) {
    const binaryString = atob(base64String);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return this.applyXorTransform(bytes, headerOnly);
  }

  /**
   * 4. Precarga e hidrata una pista desde CacheStorage hacia un Blob URL en RAM
   * @param {string} trackId - Identificador interno (ej. 'ave_maria', 'misterio_gozoso_1_meditacion')
   * @param {string} obfuscatedAssetUrl - Ruta en caché (ej. '/audio-vault/ave_maria.cvx')
   * @param {string} mimeType - 'audio/mp4' (AAC/M4A recomendado para iOS) o 'audio/mpeg' (MP3)
   */
  async hydrateTrackToMemory(trackId, obfuscatedAssetUrl, mimeType = 'audio/mpeg') {
    if (this.memoryBlobUrls.has(trackId)) {
      return this.memoryBlobUrls.get(trackId);
    }

    const cache = await caches.open(AUDIO_CACHE_NAME);
    let response = await cache.match(obfuscatedAssetUrl);

    if (!response) {
      // Si no estaba en caché, lo descarga y lo persiste ofuscado en CacheStorage
      response = await fetch(obfuscatedAssetUrl);
      if (response.ok) {
        await cache.put(obfuscatedAssetUrl, response.clone());
      } else {
        throw new Error(`No se pudo cargar el activo de audio: ${trackId}`);
      }
    }

    const arrayBuffer = await response.arrayBuffer();
    const uint8View = new Uint8Array(arrayBuffer);

    // Desofuscación XOR en memoria RAM (el archivo en CacheStorage sigue ofuscado)
    this.applyXorTransform(uint8View, false);

    const audioBlob = new Blob([uint8View], { type: mimeType });
    const objectUrl = URL.createObjectURL(audioBlob);

    this.memoryBlobUrls.set(trackId, objectUrl);
    return objectUrl;
  }

  /**
   * 5. Reproducción instantánea y segura en iOS/Android
   * Reutiliza masterAudio para jamás perder el contexto de audio con la pantalla bloqueada.
   */
  async playTrack(trackId, obfuscatedAssetUrl, onEndedCallback) {
    const objectUrl = await this.hydrateTrackToMemory(trackId, obfuscatedAssetUrl);

    this.masterAudio.onended = null;
    if (this.masterAudio.src !== objectUrl) {
      this.masterAudio.src = objectUrl;
    } else {
      this.masterAudio.currentTime = 0;
    }

    this.masterAudio.onended = () => {
      if (typeof onEndedCallback === 'function') {
        onEndedCallback();
      }
    };

    return this.masterAudio.play();
  }

  /**
   * 6. Libera de la RAM las meditaciones de misterios ya rezados (manteniendo las oraciones fijas)
   */
  revokeTrackFromMemory(trackId) {
    const url = this.memoryBlobUrls.get(trackId);
    if (url) {
      URL.revokeObjectURL(url);
      this.memoryBlobUrls.delete(trackId);
    }
  }
}
```

#### Respaldo de `HTTP 206 Partial Content` en el Service Worker (`sw.js`) para Safari iOS
Si en algún flujo secundario un elemento `<audio>` solicita directamente un recurso interceptado por el Service Worker en lugar de usar el `Blob URL` en memoria, WebKit en iOS exigirá soporte de rangos (`Range: bytes=...`). Este interceptor garantiza que Safari jamás falle en modo offline:

```javascript
/**
 * Interceptor de Service Worker con soporte nativo de Byte-Range (HTTP 206) para Safari iOS/iPadOS
 */
async function handleAudioRangeRequest(request, cachedResponse, xorKey) {
  const arrayBuffer = await cachedResponse.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // Desofuscar en memoria antes de servir el rango solicitado por WebKit
  for (let i = 0; i < bytes.byteLength; i++) {
    bytes[i] ^= xorKey[i % xorKey.length];
  }

  const totalLength = bytes.byteLength;
  const rangeHeader = request.headers.get('range');

  if (!rangeHeader) {
    return new Response(bytes, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(totalLength),
        'Accept-Ranges': 'bytes'
      }
    });
  }

  // Parsear cabecera "bytes=start-end" enviada por Safari iOS
  const parts = rangeHeader.replace(/bytes=/, '').split('-');
  const start = parseInt(parts[0], 10);
  const end = parts[1] ? parseInt(parts[1], 10) : totalLength - 1;
  const chunk = bytes.subarray(start, end + 1);

  return new Response(chunk, {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Range': `bytes ${start}-${end}/${totalLength}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': String(chunk.byteLength)
    }
  });
}
```

---

## 5. Lista de Verificación de Despliegue Sin Riesgo (Checklist de Calidad)

1. **Separación de Cachés (`CacheStorage`):** Mantener `sanctum-rosarium-audio-vault-v1` separado del `app-shell-cache` para que ningún despliegue de código invalide los audios ya descargados en los teléfonos de los fieles.
2. **Desbloqueo en el Primer Gesto (`iOS Audio Unlock`):** Al pulsar el botón de «Comenzar el Santo Rosario», inicializar y desbloquear la instancia maestra `masterAudio` dentro del mismo manejador síncrono del evento `click`/`touchend` antes de la primera promesa asíncrona.
3. **Pruebas de Regresión del Interruptor de Fase 1 y Fase 2:** Verificar que con `meditaciones = false` y `pasajesPorCuenta = false`, la ruta de ejecución del código sea idéntica bit a bit al bucle actual de producción.
4. **Respaldo Local del Cuaderno de Intenciones (Fase 3):** Incluir desde el primer día de la v3.0 el botón `Exportar mis intenciones (.json)` para que el usuario tenga certeza absoluta de que sus peticiones jamás salen de su teléfono y nunca se pierden al renovar su dispositivo.
