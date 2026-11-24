// ---------- Estado del juego ----------
// Aquí guardamos todo lo que cambia durante la partida
const estado = {
  monedas: 0,
  regaloEntregado: false,
  esponjaSeleccionada: false,
  limpiezaCompleta: false,
  inventario: {},         // objetos comprados, por ejemplo: { "semillas-manzanilla": 1 }
  puedePlantar: false,        // true mientras el pololo pide plantar las semillas
  regaderaEnInventario: false,
  regaderaUsable: false,
  regaderaSeleccionada: false,
  tutorialTerminado: false,   // pasa a true cuando florece la manzanilla y termina el tutorial
  rosaComprada: false,
  puedeComprarManzanilla: false,  // el botón de la manzanilla se abre solo cuando el pololo lo indica
  manzanillaComprada: false,
  semillaSeleccionada: null,      // id de la semilla que el jugador tiene "en la mano"
  especiesPlantadas: [],          // para las misiones
  misionActual: 0,
  macetasColocadas: 0,            // macetas nuevas ya puestas en el piso
  plantasPlantadas: 0,            // cuántas plantas se han plantado en total (la 3ª atrae a la chinita)
  tiendaAmpliada: false           // pasa a true cuando se descubre al abejorro en el diario: se desbloquean macetas, tierra y pasiflora
};

// Lugares del piso donde se pueden poner macetas nuevas (x e y = punto de la base de la maceta, en cqw)
const LUGARES_MACETAS = [
  { x: 30,   y: 30.5 },
  { x: 43.5, y: 30.5 },
  { x: 57,   y: 30.5 },
  { x: 70.5, y: 30.5 }
];

function mostrarMonedas() {
  document.getElementById("saldo-cantidad").textContent = estado.monedas;
}

mostrarMonedas();

// El saldo "salta" y muestra un +N flotando, para que se note que sumó
function animarSaldo(cantidad) {
  const saldo = document.getElementById("saldo");
  saldo.classList.remove("saldo-suma");
  void saldo.offsetWidth;
  saldo.classList.add("saldo-suma");
  const aviso = document.createElement("span");
  aviso.className = "saldo-aviso";
  aviso.textContent = "+" + cantidad;
  saldo.appendChild(aviso);
  setTimeout(() => aviso.remove(), 1600);
}

// ---------- Productos de la tienda ----------
// Para agregar un producto, copia una línea y cambia sus datos.
//  - disponible: true si ya se puede comprar
//  - disponibleSi: (opcional) función que dice cuándo se puede comprar; reemplaza a "disponible"
//  - etiquetaNo: (opcional) texto del botón cuando no se puede comprar
//  - Los precios son PROVISORIOS, excepto el de la manzanilla (2 BP)
const PRODUCTOS = [
  { id: "saco-tierra",         nombre: "Saco de tierra",       precio: 3,  tipo: "herramienta", imagen: "assets/tienda/saco-tierra.png",         disponible: false,
    // 1 saco llena 1 maceta; se desbloquea al descubrir al abejorro
    disponibleSi: () => estado.tiendaAmpliada },
  { id: "maceta-terracota",    nombre: "Maceta de terracota",  precio: 4,  tipo: "herramienta", imagen: "assets/tienda/maceta-terracota.png",    disponible: false,
    // Solo se pueden comprar tantas como lugares libres hay en el piso (LUGARES_MACETAS)
    disponibleSi: () => estado.tiendaAmpliada && (estado.macetasColocadas + (estado.inventario["maceta-terracota"] || 0)) < LUGARES_MACETAS.length,
    etiquetaNo: () => (estado.tiendaAmpliada ? "Sin espacio" : "Comprar") },
  { id: "maceta-ceramica",     nombre: "Maceta de cerámica",   precio: 6,  tipo: "herramienta", imagen: "assets/tienda/maceta-ceramica.png",     disponible: false },
  { id: "jardinera",           nombre: "Jardinera",            precio: 8,  tipo: "herramienta", imagen: "assets/tienda/jardinera.png",           disponible: false },
  { id: "jardinera-madera",    nombre: "Jardinera de madera",  precio: 10, tipo: "herramienta", imagen: "assets/tienda/jardinera-madera.png",    disponible: false },
  { id: "semillas-manzanilla", nombre: "Manzanilla",           precio: 2,  tipo: "semilla",     imagen: "assets/tienda/semillas-manzanilla.png", disponible: false,
    // Solo se puede comprar cuando el pololo lo indica, y una sola vez
    disponibleSi: () => estado.puedeComprarManzanilla,
    etiquetaNo: () => "Comprar" },
  { id: "semillas-rosa",       nombre: "Rosa",                 precio: 4,  tipo: "semilla",     imagen: "assets/tienda/semillas-rosa.png",       disponible: false,
    // Se desbloquea al terminar el tutorial y se compra una sola vez (hay una sola maceta libre)
    disponibleSi: () => estado.tutorialTerminado && !estado.rosaComprada,
    etiquetaNo: () => "Comprar" },
  // Desde aquí, todas se desbloquean junto con las macetas y la tierra; ordenadas de la más barata a la más cara
  { id: "semillas-calle-calle", nombre: "Calle-calle chilena", precio: 5, tipo: "semilla", imagen: "assets/tienda/semillas-calle-calle.png", disponible: false,
    disponibleSi: () => estado.tiendaAmpliada },
  { id: "semillas-pasiflora", nombre: "Pasiflora", precio: 6, tipo: "semilla", imagen: "assets/tienda/semillas-pasiflora.png", disponible: false,
    disponibleSi: () => estado.tiendaAmpliada },
  { id: "semillas-lirio", nombre: "Lirio chileno", precio: 8, tipo: "semilla", imagen: "assets/tienda/semillas-lirio.png", disponible: false,
    disponibleSi: () => estado.tiendaAmpliada },
  { id: "semillas-lavanda", nombre: "Lavanda", precio: 10, tipo: "semilla", imagen: "assets/tienda/semillas-lavanda.png", disponible: false,
    disponibleSi: () => estado.tiendaAmpliada },
  { id: "semillas-malamadre", nombre: "Malamadre", precio: 13, tipo: "semilla", imagen: "assets/tienda/semillas-malamadre.png", disponible: false,
    disponibleSi: () => estado.tiendaAmpliada },
  { id: "semillas-salvia-chilena", nombre: "Salvia chilena", precio: 15, tipo: "semilla", imagen: "assets/tienda/semillas-salvia-chilena.png", disponible: false,
    disponibleSi: () => estado.tiendaAmpliada },
  { id: "semillas-lengua-de-suegra", nombre: "Lengua de suegra", precio: 20, tipo: "semilla", imagen: "assets/tienda/semillas-lengua-de-suegra.png", disponible: false,
    disponibleSi: () => estado.tiendaAmpliada }
];

// Objetos que NO se compran en la tienda pero sí van al inventario
const OBJETOS_EXTRA = [
  { id: "regadera", nombre: "Regadera", imagen: "assets/plantas/regadera.png", sinCantidad: true }
];

// ---------- Carga de imágenes ----------
// Se descargan en la primera carga (inicio -> niveles)
const RECURSOS_NIVELES = [
  "assets/fondos/fondo-inicio.gif",
  "assets/niveles/nivel-balcon.png",
  "assets/niveles/nivel-patio.png"
];

// Se descargan en la segunda carga (niveles -> juego)
const RECURSOS_JUEGO = [
  "assets/escenarios/balcon-sucio.png",
  "assets/escenarios/balcon-limpio.png",
  "assets/objetos/esponja.webp",
  "assets/pololo/pololo-cuerpo.png",
  "assets/pololo/pololo-ala-izq.png",
  "assets/pololo/pololo-ala-der.png",
  "assets/pololo/pololo-parpados.png",
  "assets/iconos/icono-tienda.png",
  "assets/iconos/icono-enciclopedia.png",
  "assets/iconos/icono-hotel.png",
  "assets/iconos/icono-bichipeso.png",
  "assets/iconos/icono-flecha.png",
  "assets/pololo/pololo-vuelo.png",
  "assets/abejorro/abejorro-vuelo.png",
  "assets/abejorro/abejorro-cuerpo.png",
  "assets/abejorro/abejorro-alas-izq.png",
  "assets/abejorro/abejorro-alas-der.png",
  "assets/plantas/rosa-mediana.png",
  "assets/plantas/rosa-sed.png",
  "assets/plantas/rosa-flor.png",
  "assets/enciclopedia/libro-abierto.png",
  "assets/enciclopedia/libro-cerrado.png",
  "assets/pololo/pololo-registro.png",
  "assets/plantas/rosa-marchita.png",
  "assets/plantas/manzanilla-marchita.png",
  "assets/plantas/maceta-vacia.png",
  "assets/plantas/maceta-sin-tierra.png",
  "assets/plantas/pasiflora-mediana.png",
  "assets/plantas/pasiflora-sed.png",
  "assets/plantas/pasiflora-flor.png",
  "assets/plantas/pasiflora-marchita.png",
  "assets/plantas/manzanilla-pequena.png",
  "assets/plantas/manzanilla-mediana.png",
  "assets/plantas/manzanilla-mediana-sed.png",
  "assets/plantas/manzanilla-grande.png",
  "assets/plantas/icono-gota.png",
  "assets/plantas/regadera.png",
  ...PRODUCTOS.map((producto) => producto.imagen)
];

// Tiempo mínimo de cada pantalla de carga, en milisegundos (5000 = 5 segundos)
const TIEMPO_MINIMO_CARGA = 5000;

// Descarga una imagen y avisa cuando terminó (aunque falle, para no quedarse pegado)
function cargarImagen(ruta) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => {
      console.warn("No se pudo cargar:", ruta);
      resolve();
    };
    img.src = ruta;
  });
}

// Espera una cantidad de milisegundos
function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Deja el GIF de carga listo de antemano, para que aparezca al tiro
cargarImagen("assets/iconos/icono-carga.gif");

// ---------- Pantallas ----------
const portada = document.getElementById("portada");
const niveles = document.getElementById("niveles");
const carga = document.getElementById("carga");
const partida = document.getElementById("partida");

const botonJugar = document.getElementById("btn-jugar");
const botonBalcon = document.getElementById("btn-nivel-balcon");

// Pasa de una pantalla a otra mostrando la carga en el medio
async function irConCarga(desde, hacia, recursos) {
  desde.hidden = true;
  carga.hidden = false;

  // Esperamos las dos cosas: que carguen las imágenes y el tiempo mínimo
  await Promise.all([
    Promise.all(recursos.map(cargarImagen)),
    esperar(TIEMPO_MINIMO_CARGA)
  ]);

  carga.hidden = true;
  hacia.hidden = false;
}

// Play: inicio -> carga -> niveles
botonJugar.addEventListener("click", async () => {
  botonJugar.disabled = true; // evita doble clic
  await irConCarga(portada, niveles, RECURSOS_NIVELES);
  botonJugar.disabled = false;
});

// Balcón: niveles -> carga -> partida (y empieza el tutorial)
async function entrarAlBalcon() {
  botonBalcon.disabled = true; // evita doble clic
  await irConCarga(niveles, partida, RECURSOS_JUEGO);
  botonBalcon.disabled = false;
  iniciarTutorial();
}

// ---------- Pantalla de bienvenida ----------
// Aparece primero, encima de la portada. Hay que llegar al final, marcar "acepto" y presionar la flecha.
const intro = document.getElementById("intro");
const textoIntro = document.getElementById("intro-texto");
const casillaAcepto = document.getElementById("intro-acepto");
const botonContinuar = document.getElementById("intro-continuar");

portada.inert = true; // la portada espera: no se puede usar mientras no se acepte
document.getElementById("btn-config").inert = true; // el botón de configuración también espera
textoIntro.focus({ preventScroll: true });

casillaAcepto.addEventListener("change", () => {
  botonContinuar.disabled = !casillaAcepto.checked;
});

// Mensaje temporal junto al engranaje de configuración
const avisoConfig = document.getElementById("aviso-config");
let timerAviso = null;

function mostrarAvisoConfig() {
  avisoConfig.hidden = false;
  avisoConfig.classList.remove("saliendo");
  timerAviso = setTimeout(ocultarAvisoConfig, 9000);
}

function ocultarAvisoConfig() {
  clearTimeout(timerAviso);
  avisoConfig.classList.add("saliendo");
  setTimeout(() => { avisoConfig.hidden = true; }, 500);
}

botonContinuar.addEventListener("click", () => {
  if (!casillaAcepto.checked) return;
  intro.classList.add("saliendo");
  setTimeout(() => {
    intro.hidden = true;
    portada.inert = false;
    document.getElementById("btn-config").inert = false;
    botonJugar.focus();
    mostrarAvisoConfig();
  }, 400);

  // Los navegadores solo dejan sonar música después de un clic: este es ese clic
  iniciarSonido();
});

// ---------- Sonido y configuración ----------
// Ajustes que puedes cambiar
const GANANCIA_MUSICA = 0.45;   // la música suena a este porcentaje del volumen general (0 a 1)
const GANANCIA_VUELO = 1;       // lo mismo para el zumbido del pololo
const GANANCIA_CHINITA = 0.4;   // lo mismo para el zumbido de la chinita (su sonido es más fuerte que los otros; 1 = igual que el pololo)
const CLAVE_AJUSTES = "bichi-ajustes";

const ajustes = { volumenMusica: 0.6, volumenAleteo: 0.6, volumenBotones: 0.6, musicaActiva: true };

// Recupera los ajustes de la última vez (si el navegador lo permite)
try {
  const guardados = JSON.parse(localStorage.getItem(CLAVE_AJUSTES) || "{}");
  const limitar = (n) => Math.min(1, Math.max(0, n));
  // "volumen" es el ajuste antiguo (una sola barra): se usa para las dos si no hay otro
  if (typeof guardados.volumen === "number") {
    ajustes.volumenMusica = limitar(guardados.volumen);
    ajustes.volumenAleteo = limitar(guardados.volumen);
    ajustes.volumenBotones = limitar(guardados.volumen);
  }
  if (typeof guardados.volumenBotones === "number") ajustes.volumenBotones = limitar(guardados.volumenBotones);
  if (typeof guardados.volumenMusica === "number") ajustes.volumenMusica = limitar(guardados.volumenMusica);
  if (typeof guardados.volumenAleteo === "number") ajustes.volumenAleteo = limitar(guardados.volumenAleteo);
  if (typeof guardados.musicaActiva === "boolean") ajustes.musicaActiva = guardados.musicaActiva;
} catch (error) {
  // sin ajustes guardados: se usan los de siempre
}

function guardarAjustes() {
  try {
    localStorage.setItem(CLAVE_AJUSTES, JSON.stringify(ajustes));
  } catch (error) {
    // si no se puede guardar, el juego sigue igual
  }
}

const musicaFondo = new Audio("assets/musica/spring-colors.mp3");
musicaFondo.loop = true;
musicaFondo.preload = "auto";

const sonidoVuelo = new Audio("assets/sonidos/vuelo-pololo.mp3");
sonidoVuelo.loop = true;
sonidoVuelo.preload = "auto";

// Sonido que se oye al apretar cualquier botón del juego
const sonidoClic = new Audio("assets/sonidos/clic-boton.mp3");
sonidoClic.preload = "auto";

// Un solo oyente para todos los botones (también funciona con teclado: Enter o espacio)
document.addEventListener("click", (evento) => {
  const boton = evento.target.closest("button, [role='button']");
  if (!boton || boton.disabled || boton.hasAttribute("data-sin-clic")) return;
  if (ajustes.volumenBotones <= 0) return;
  // Objetos del inventario, regadera de la mesa y macetas: suenan con el "plop"
  if (boton.matches(".slot, .zona-regadera")) {
    sonarPlop();
    return;
  }
  sonidoClic.volume = ajustes.volumenBotones;
  sonidoClic.currentTime = 0;
  sonidoClic.play().catch(() => {});
});

// "Plop" al tomar o guardar objetos del inventario y al enderezar las macetas (se controla con "Efectos de sonido")
const sonidoPlop = new Audio("assets/sonidos/plop.mp3");
sonidoPlop.preload = "auto";

function sonarPlop() {
  if (ajustes.volumenBotones <= 0) return;
  sonidoPlop.volume = ajustes.volumenBotones;
  sonidoPlop.currentTime = 0;
  sonidoPlop.play().catch(() => {});
}

// Brillos que suenan cuando el balcón pasa de sucio a limpio
const sonidoBrillos = new Audio("assets/sonidos/brillos-limpieza.mp3");
sonidoBrillos.preload = "auto";

// Sonido de pasar la página de la enciclopedia
const sonidoPagina = new Audio("assets/sonidos/pasar-pagina.mp3");
sonidoPagina.preload = "auto";

function sonarPagina() {
  if (ajustes.volumenBotones <= 0) return;
  sonidoPagina.volume = ajustes.volumenBotones;
  sonidoPagina.currentTime = 0;
  sonidoPagina.play().catch(() => {});
}

// Agua de la regadera (se controla con "Efectos de sonido")
const sonidoRegar = new Audio("assets/sonidos/regar.mp3");
sonidoRegar.preload = "auto";

function sonarRegar() {
  if (ajustes.volumenBotones <= 0) return;
  sonidoRegar.volume = ajustes.volumenBotones;
  sonidoRegar.currentTime = 0;
  sonidoRegar.play().catch(() => {});
}

function sonarBrillos() {
  if (ajustes.volumenBotones <= 0) return;
  sonidoBrillos.volume = ajustes.volumenBotones;
  sonidoBrillos.currentTime = 0;
  sonidoBrillos.play().catch(() => {});
}

// Zumbido del abejorro colorado (suena desde que se planta la rosa)
const sonidoAbejorro = new Audio("assets/sonidos/vuelo-abejorro.mp3");
sonidoAbejorro.loop = true;
sonidoAbejorro.preload = "auto";

let sonidoPermitido = false;   // pasa a true con el primer clic del jugador

function aplicarVolumen() {
  musicaFondo.volume = Math.min(1, ajustes.volumenMusica * GANANCIA_MUSICA);
}

function iniciarSonido() {
  sonidoPermitido = true;
  aplicarVolumen();
  if (ajustes.musicaActiva) musicaFondo.play().catch(() => {});
}

// El zumbido del pololo se oye mientras está en pantalla y se apaga al salir por un borde
let poloEnGuia = false;   // true mientras el pololo grande habla (el pequeñito del fondo se esconde)
function actualizarSonidoVuelo(x) {
  if (poloEnGuia) x = null;
  if (!sonidoPermitido || x === null) {
    if (!sonidoVuelo.paused) sonidoVuelo.pause();
    return;
  }
  const fuera = x < 0 ? -x : (x > 100 ? x - 100 : 0);   // cuánto está fuera de la pantalla (en cqw)
  const cercania = Math.max(0, 1 - fuera / VUELO.margen);
  const volumen = Math.min(1, ajustes.volumenAleteo * GANANCIA_VUELO * cercania);
  sonidoVuelo.volume = volumen;

  if (volumen > 0.003) {
    if (sonidoVuelo.paused) sonidoVuelo.play().catch(() => {});
  } else if (!sonidoVuelo.paused) {
    sonidoVuelo.pause();
  }
}

// Zumbido de la chinita chilena (suena desde que se planta la tercera planta)
const sonidoChinita = new Audio("assets/sonidos/vuelo-chinita.mp3");
sonidoChinita.loop = true;
sonidoChinita.preload = "auto";

// Si se cambia de pestaña, el sonido se pausa
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    musicaFondo.pause();
    sonidoVuelo.pause();
    sonidoAbejorro.pause();
    sonidoChinita.pause();
  } else if (sonidoPermitido && ajustes.musicaActiva) {
    musicaFondo.play().catch(() => {});
  }
});

// Menú de configuración
const botonConfig = document.getElementById("btn-config");
const panelConfig = document.getElementById("config");
const botonCerrarConfig = document.getElementById("config-cerrar");
const rangoVolumen = document.getElementById("config-volumen");
const valorVolumen = document.getElementById("config-volumen-valor");
const rangoBotones = document.getElementById("config-botones");
const valorBotones = document.getElementById("config-botones-valor");
const rangoAleteo = document.getElementById("config-aleteo");
const valorAleteo = document.getElementById("config-aleteo-valor");
const botonMusica = document.getElementById("config-musica");

function dibujarConfig() {
  const porcentaje = Math.round(ajustes.volumenMusica * 100);
  rangoVolumen.value = porcentaje;
  valorVolumen.textContent = porcentaje + " %";
  const porcentajeBotones = Math.round(ajustes.volumenBotones * 100);
  rangoBotones.value = porcentajeBotones;
  valorBotones.textContent = porcentajeBotones + " %";
  const porcentajeAleteo = Math.round(ajustes.volumenAleteo * 100);
  rangoAleteo.value = porcentajeAleteo;
  valorAleteo.textContent = porcentajeAleteo + " %";
  botonMusica.textContent = ajustes.musicaActiva ? "Desactivar música" : "Activar música";
  botonMusica.classList.toggle("apagada", !ajustes.musicaActiva);
}

let focoAntesDeConfig = null;

function abrirConfig() {
  if (!avisoConfig.hidden) ocultarAvisoConfig();
  focoAntesDeConfig = document.activeElement;
  panelConfig.hidden = false;
  rangoVolumen.focus();
}

function cerrarConfig() {
  panelConfig.hidden = true;
  if (focoAntesDeConfig) focoAntesDeConfig.focus();
}

botonConfig.addEventListener("click", abrirConfig);
botonCerrarConfig.addEventListener("click", cerrarConfig);
panelConfig.addEventListener("click", (evento) => {
  if (evento.target === panelConfig) cerrarConfig();   // clic en el fondo oscuro
});

rangoVolumen.addEventListener("input", () => {
  ajustes.volumenMusica = Number(rangoVolumen.value) / 100;
  aplicarVolumen();
  dibujarConfig();
  guardarAjustes();
});

rangoAleteo.addEventListener("input", () => {
  ajustes.volumenAleteo = Number(rangoAleteo.value) / 100;
  dibujarConfig();
  guardarAjustes();
  // el zumbido se ajusta solo en el siguiente cuadro del vuelo; si está sonando, se oye el cambio al tiro
  if (!sonidoVuelo.paused) sonidoVuelo.volume = Math.min(1, ajustes.volumenAleteo * GANANCIA_VUELO);
});

rangoBotones.addEventListener("input", () => {
  ajustes.volumenBotones = Number(rangoBotones.value) / 100;
  dibujarConfig();
  guardarAjustes();
});

botonMusica.addEventListener("click", () => {
  ajustes.musicaActiva = !ajustes.musicaActiva;
  if (sonidoPermitido) {
    if (ajustes.musicaActiva) musicaFondo.play().catch(() => {});
    else musicaFondo.pause();
  }
  dibujarConfig();
  guardarAjustes();
});

dibujarConfig();
aplicarVolumen();

// ---------- Enciclopedia de insectos ----------
// Cada apartado ocupa dos páginas (izquierda y derecha) y tiene sus casillas de insectos.
// Mientras no se descubra nada, todas muestran "?". Cuando existan insectos registrados,
// se cambia el null de la casilla por los datos del insecto.
const CASILLAS_POR_PLANA = 5;
// Los insectos que existen en el juego. Cuando se suma uno nuevo, se agrega aquí
// y se pone su id en la casilla que le corresponde dentro de ENCICLOPEDIA.
const INSECTOS = {
  pololo: {
    nombre: "Pololo verde",
    imagen: "assets/pololo/pololo-registro.png",
    foto: "assets/fotos/pololo-real.jpg",
    animado: true,   // en la ficha se muestra con sus alas aleteando
    // Datos del "carnet". Los tiempos vienen de fuentes (INIA y otras); la duración exacta de la vida
    // del adulto no aparece en ellas, por eso se muestra la época en que se le ve volar.
    ficha: {
      nombre: "Pololo verde",
      nombreCientifico: "Hylamorpha elegans",
      otroNombre: "San Juan verde",
      nacionalidad: "Chilena",
      // Fuente: INIA (vive de Coquimbo a Los Lagos, donde crecen los bosques de Nothofagus/robles).
      zona: "De Coquimbo a Los Lagos",
      // Regiones que se iluminan en el mapa (los nombres son los de los archivos assets/mapa/region-NOMBRE.png)
      regiones: ["coquimbo", "valparaiso", "metropolitana", "ohiggins", "maule", "nuble", "biobio", "araucania", "losrios", "loslagos"],
      descripcion: "¡Un pequeño escarabajo de color verde brillante! De adulto come hojas; de larva vive bajo tierra y come raíces. Algunas aves también se lo comen.",
      tiempos: [
        { etiqueta: "Como larva", valor: "8 a 9 meses bajo tierra" }
      ],
      sexo: {
        columnas: ["Macho", "Hembra"],
        filas: [
          { etiqueta: "Tibias delanteras", valores: ["Verdes", "Café"],
            partes: [ { x: 38.8, y: 54.5, w: 5.5, h: 25, giro: 12 }, { x: 61.2, y: 54.5, w: 5.5, h: 25, giro: -12 } ] },
          { etiqueta: "Uñas de las patas", valores: ["Una más larga", "Todas iguales"],
            partes: [ { x: 36.7, y: 68, w: 5, h: 8 }, { x: 38.3, y: 78, w: 5, h: 8 }, { x: 41.7, y: 88.5, w: 5, h: 8 },
                      { x: 63.3, y: 68, w: 5, h: 8 }, { x: 61.7, y: 78, w: 5, h: 8 }, { x: 58.3, y: 88.5, w: 5, h: 8 } ] },
          { etiqueta: "Primer tarsito", valores: ["Más corto", "Más largo"],
            partes: [ { x: 36.4, y: 62.5, w: 4, h: 8 }, { x: 63.6, y: 62.5, w: 4, h: 8 } ] },
          { etiqueta: "Tamaño", valores: ["Un poco menor", "Un poco mayor"],
            partes: [ { x: 50, y: 53, w: 42, h: 80, redondo: true } ] }
        ]
      }
    }
  }
};

INSECTOS.abejorro = {
  nombre: "Abejorro colorado",
  imagen: "assets/abejorro/abejorro-registro.png",
  foto: "assets/fotos/abejorro-real.jpg",
    animado: "abejorro",   // en la ficha se muestra con sus alas aleteando
  ficha: {
    nombre: "Abejorro colorado",
    nombreCientifico: "Bombus dahlbomii",
    otroNombre: "Abejorro gigante",
    nacionalidad: "Chilena y argentina",
    // Fuentes: Lista Roja de la UICN (En Peligro), prensa chilena y Wikipedia. Antes vivía de Coquimbo a Magallanes;
    // hoy ha desaparecido de gran parte del norte de esa zona.
    zona: "Antes, de Coquimbo a Magallanes",
    regiones: ["coquimbo", "valparaiso", "metropolitana", "ohiggins", "maule", "nuble", "biobio", "araucania", "losrios", "loslagos", "aysen", "magallanes"],
    descripcion: "¡El abejorro más grande del mundo! Es peludito, de cuerpo rojo anaranjado, con la cabeza, las alas y las patas negras. Come néctar y polen. Además, poliniza flores nativas del sur de Chile. Está en peligro de extinción porque llegaron abejorros de otros países y se pierden los lugares donde vive. Así lo clasifica la UICN, la Unión Internacional para la Conservación de la Naturaleza.",
    tiempos: [
      { etiqueta: "Conservación", valor: "En peligro de extinción" },
      { etiqueta: "Reina", valor: "Hasta unos 4 cm de largo" }
    ]
    // No se agrega la tabla "macho / hembra" porque las fuentes no describen cómo distinguirlos
  }
};

INSECTOS.chinita = {
  nombre: "Chinita chilena",
  imagen: "assets/chinita/chinita-registro.png",
  foto: "assets/fotos/chinita-real.jpg",
  animado: "chinita",   // en la ficha se muestra con sus alas aleteando
  // Los datos salen de la ficha de Guardianes de la Fauna (guardiandelafauna.cl), escrita a partir de
  // Grez, González y Zaviezo (2021), González, Cotoras y Grez (2020) y Eizaguirre (2004).
  fuente: "Datos: Guardianes de la Fauna (guardiandelafauna.cl), según Grez, González y Zaviezo (2021); González, Cotoras y Grez (2020); Eizaguirre (2004).",
  ficha: {
    nombre: "Chinita chilena",
    nombreCientifico: "Eriopis chilensis",
    nacionalidad: "Chilena",
    zona: "De Copiapó a Chiloé",
    regiones: ["atacama", "coquimbo", "valparaiso", "metropolitana", "ohiggins", "maule", "nuble", "biobio", "araucania", "losrios", "loslagos"],
    descripcion: "¡Una chinita que vive solo en Chile! Es pequeñita y redondeada, de colores negro y anaranjado. Come pulgones, tanto de adulta como de larva, y así ayuda a cuidar las plantas. Se la ve en jardines, cultivos y bosques. Hoy compite con chinitas que llegaron de otros países.",
    tiempos: [
      { etiqueta: "Tamaño", valor: "3,6 a 4,7 mm" },
      { etiqueta: "Conservación", valor: "Preocupación menor" }
    ]
  }
};

const casillasVacias = () => new Array(CASILLAS_POR_PLANA * 2).fill(null);
const ENCICLOPEDIA = [
  { titulo: "Terraza", casillas: ["pololo", "abejorro", "chinita", ...casillasVacias().slice(3)] },
  { titulo: "Patio",   casillas: casillasVacias() },
  { proximamente: true }
];

const insectosDescubiertos = [];   // ids de los insectos que ya se registraron
const insectosNuevos = [];         // descubiertos que el jugador aún no ha visto en el libro

const encicloPanel = document.getElementById("enciclo");
const botonEnciclo = document.getElementById("menu-enciclopedia");
const botonEncicloCerrar = document.getElementById("enciclo-cerrar");
const botonPagAnterior = document.getElementById("enciclo-anterior");
const botonPagSiguiente = document.getElementById("enciclo-siguiente");
const planaIzq = document.getElementById("plana-izq");
const planaDer = document.getElementById("plana-der");
const textoProximamente = document.getElementById("enciclo-proximamente");
const encicloEstado = document.getElementById("enciclo-estado");

// -1 = libro cerrado (la tapa); 0, 1, 2... = cada apartado de la lista de arriba
let apartadoActual = -1;
let focoAntesDeEnciclo = null;
const libroEl = document.getElementById("libro");
const libroFondo = document.getElementById("libro-fondo");
const libroTapa = document.getElementById("libro-tapa");

let ultimoRevelado = null;
let revelacionEl = null;
let revelacionTimer = null;
let revelacionAnim = null;

function cancelarRevelacion() {
  clearTimeout(revelacionTimer);
  if (revelacionAnim) revelacionAnim.cancel();
  revelacionAnim = null;
  if (revelacionEl) revelacionEl.remove();
  revelacionEl = null;
}

// Si en esta página hay un insecto recién descubierto: primero se ve grande en el centro,
// luego viaja hasta su casilla y, al llegar, suenan los brillitos.
function iniciarRevelacion() {
  cancelarRevelacion();
  const casilla = planaIzq.querySelector("[data-nuevo]") || planaDer.querySelector("[data-nuevo]");
  if (!casilla) return;
  const id = casilla.dataset.nuevo;
  const datos = INSECTOS[id];

  revelacionEl = document.createElement("div");
  revelacionEl.className = "revelacion";
  const etiqueta = document.createElement("p");
  etiqueta.className = "revelacion-etiqueta";
  etiqueta.textContent = "¡Nuevo insecto!";
  const dibujo = document.createElement("img");
  dibujo.src = datos.imagen;
  dibujo.alt = "";
  const nombre = document.createElement("p");
  nombre.className = "revelacion-nombre";
  nombre.textContent = datos.nombre;
  revelacionEl.append(etiqueta, dibujo, nombre);
  libroEl.appendChild(revelacionEl);
  encicloEstado.textContent = "¡Nuevo insecto! " + datos.nombre;

  revelacionTimer = setTimeout(() => volarACasilla(id, casilla, dibujo), 2300);
}

function volarACasilla(id, casilla, dibujo) {
  const el = revelacionEl;
  const terminar = () => {
    cancelarRevelacion();
    const posicion = insectosNuevos.indexOf(id);
    if (posicion !== -1) insectosNuevos.splice(posicion, 1);
    ultimoRevelado = id;
    dibujarEnciclo();
    sonarBrillos();
    // Al descubrir al abejorro se desbloquean en la tienda las macetas, la tierra y la pasiflora
    if (id === "abejorro") ampliarTienda();
  };

  el.classList.add("viajando");   // el texto se desvanece
  if (prefiereQuietud) {
    revelacionTimer = setTimeout(terminar, 400);
    return;
  }
  const r1 = dibujo.getBoundingClientRect();
  const r2 = casilla.getBoundingClientRect();
  const dx = (r2.left + r2.width / 2) - (r1.left + r1.width / 2);
  const dy = (r2.top + r2.height / 2) - (r1.top + r1.height / 2);
  const escala = (r2.width * 0.8) / r1.width;
  revelacionAnim = dibujo.animate(
    [
      { transform: "translate(0, 0) scale(1)" },
      { transform: "translate(" + dx + "px, " + dy + "px) scale(" + escala + ")" }
    ],
    { duration: 900, easing: "ease-in-out", fill: "forwards" }
  );
  revelacionAnim.onfinish = terminar;
}

function dibujarCasillas(lista, casillas) {
  lista.replaceChildren();
  casillas.forEach((id) => {
    const item = document.createElement("li");
    item.className = "casilla";
    if (id && insectosNuevos.includes(id)) {
      // descubierto pero todavía no mostrado: espera a que termine la revelación
      item.textContent = "?";
      item.dataset.nuevo = id;
      item.setAttribute("aria-label", "Insecto por descubrir");
    } else if (id && insectosDescubiertos.includes(id)) {
      const datos = INSECTOS[id];
      item.classList.add("descubierta");
      const boton = document.createElement("button");
      boton.className = "casilla-boton";
      boton.setAttribute("aria-label", datos.nombre + ": ver información");
      const dibujo = document.createElement("img");
      dibujo.src = datos.imagen;
      dibujo.alt = "";
      const nombre = document.createElement("span");
      nombre.textContent = datos.nombre;
      boton.append(dibujo, nombre);
      boton.addEventListener("click", () => abrirFicha(id, boton));
      item.appendChild(boton);
      // el insecto recién revelado aparece con un pequeño "pop"
      if (id === ultimoRevelado) {
        item.classList.add("nuevo");
        ultimoRevelado = null;
      }
    } else {
      item.textContent = "?";
      item.setAttribute("aria-label", "Insecto por descubrir");
    }
    lista.appendChild(item);
  });
}

// ---------- Ficha de un insecto ----------
const fichaCapa = document.getElementById("ficha-capa");
const fichaDibujo = document.getElementById("ficha-dibujo");
const fichaGiro = document.getElementById("ficha-giro");
const fichaReal = document.getElementById("ficha-real");
const fichaRealImg = document.getElementById("ficha-real-img");
const fichaCredito = document.getElementById("ficha-credito");
const fichaVoltear = document.getElementById("ficha-voltear");
let yaVolteoFoto = false;   // después de la primera vez, el botón deja de llamar tanto la atención

fichaVoltear.addEventListener("click", () => {
  const volteada = fichaGiro.classList.toggle("volteada");
  fichaReal.setAttribute("aria-hidden", String(!volteada));
  fichaDibujo.setAttribute("aria-hidden", String(volteada));
  fichaVoltear.setAttribute("aria-label", volteada ? "Ver el dibujo del insecto" : "Ver foto real del insecto");
  yaVolteoFoto = true;
  fichaVoltear.classList.add("ya-usado");
});
const fichaTexto = document.getElementById("ficha-texto");
const botonFichaCerrar = document.getElementById("ficha-cerrar");
let botonDeFicha = null;

function crearPololoAnimado() {
  // Mismas capas que el pololo del tutorial: las alas aletean y el cuerpo flota
  const flota = document.createElement("div");
  flota.className = "guia-flota";
  const capas = document.createElement("div");
  capas.className = "guia-capas";
  [
    ["capa ala ala-izq", "assets/pololo/pololo-ala-izq.png"],
    ["capa ala ala-der", "assets/pololo/pololo-ala-der.png"],
    ["pololo-cuerpo", "assets/pololo/pololo-cuerpo.png"],
    ["capa parpados", "assets/pololo/pololo-parpados.png"]
  ].forEach(([clase, ruta]) => {
    const pieza = document.createElement("img");
    pieza.className = clase;
    pieza.src = ruta;
    pieza.alt = "";
    capas.appendChild(pieza);
  });
  flota.appendChild(capas);
  return flota;
}

// Abejorro de frente, con sus alas aleteando (mismo lienzo para todas las capas)
function crearAbejorroAnimado() {
  const flota = document.createElement("div");
  flota.className = "guia-flota";
  const capas = document.createElement("div");
  capas.className = "guia-capas capas-abejorro";
  capas.append(...capasAbejorro());
  flota.appendChild(capas);
  return flota;
}

// Chinita de frente: los élitros (alas negras) atrás, las alas transparentes aleteando, el cuerpo y los párpados
function crearChinitaAnimada() {
  const flota = document.createElement("div");
  flota.className = "guia-flota";
  const capas = document.createElement("div");
  capas.className = "guia-capas capas-chinita";
  capas.append(...capasChinita());
  flota.appendChild(capas);
  return flota;
}

function capasChinita() {
  return [
    ["capa elitro", "assets/chinita/chinita-elitros-izq.png"],
    ["capa elitro", "assets/chinita/chinita-elitros-der.png"],
    ["capa ala ala-izq", "assets/chinita/chinita-alas-izq.png"],
    ["capa ala ala-der", "assets/chinita/chinita-alas-der.png"],
    ["pololo-cuerpo", "assets/chinita/chinita-cuerpo.png"],
    ["capa parpados", "assets/chinita/chinita-parpados.png"]
  ].map(([clase, ruta]) => {
    const pieza = document.createElement("img");
    pieza.className = clase;
    pieza.src = ruta;
    pieza.alt = "";
    return pieza;
  });
}

function capasAbejorro() {
  return [
    ["capa ala ala-izq", "assets/abejorro/abejorro-alas-izq.png"],
    ["capa ala ala-der", "assets/abejorro/abejorro-alas-der.png"],
    ["pololo-cuerpo", "assets/abejorro/abejorro-cuerpo.png"],
    ["capa parpados", "assets/abejorro/abejorro-parpados.png"]
  ].map(([clase, ruta]) => {
    const pieza = document.createElement("img");
    pieza.className = clase;
    pieza.src = ruta;
    pieza.alt = "";
    return pieza;
  });
}

// Pequeña ayuda para crear elementos
function elemento(etiqueta, clase, texto) {
  const el = document.createElement(etiqueta);
  if (clase) el.className = clase;
  if (texto !== undefined) el.textContent = texto;
  return el;
}

// Un campo del carnet: etiqueta chica arriba y el dato abajo
function campoCarnet(etiqueta, valor, clase) {
  const campo = elemento("div", "campo" + (clase ? " " + clase : ""));
  campo.append(elemento("span", "campo-etiqueta", etiqueta), elemento("span", "campo-valor", valor));
  return campo;
}

const NOMBRES_REGIONES = {
  arica: "Arica y Parinacota", tarapaca: "Tarapacá", antofagasta: "Antofagasta", atacama: "Atacama",
  coquimbo: "Coquimbo", valparaiso: "Valparaíso", metropolitana: "Metropolitana", ohiggins: "O'Higgins",
  maule: "Maule", nuble: "Ñuble", biobio: "Biobío", araucania: "La Araucanía", losrios: "Los Ríos",
  loslagos: "Los Lagos", aysen: "Aysén", magallanes: "Magallanes"
};

// "Coquimbo, Valparaíso y Maule"
function listaDeRegiones(ids) {
  const nombres = ids.map((id) => NOMBRES_REGIONES[id] || id);
  if (nombres.length < 2) return nombres.join("");
  return nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1];
}

function abrirFicha(id, botonOrigen) {
  const datos = INSECTOS[id];
  const ficha = datos.ficha;
  botonDeFicha = botonOrigen;

  // Reverso de la foto: la foto real del insecto
  fichaGiro.classList.remove("volteada");
  fichaVoltear.setAttribute("aria-label", "Ver foto real del insecto");
  fichaVoltear.classList.toggle("sin-foto", !datos.foto);
  fichaVoltear.hidden = !datos.foto;
  if (datos.foto) {
    fichaRealImg.src = datos.foto;
    fichaRealImg.alt = "Foto real: " + datos.nombre;
    fichaCredito.hidden = !datos.fotoCredito;
    fichaCredito.textContent = datos.fotoCredito || "";
  }
  fichaReal.setAttribute("aria-hidden", "true");

  // "Foto de carnet": el insecto (animado si tiene capas)
  fichaDibujo.replaceChildren();
  if (datos.animado) {
    fichaDibujo.appendChild(datos.animado === "abejorro" ? crearAbejorroAnimado() : datos.animado === "chinita" ? crearChinitaAnimada() : crearPololoAnimado());
  } else {
    const dibujo = document.createElement("img");
    dibujo.src = datos.imagen;
    dibujo.alt = datos.nombre;
    fichaDibujo.appendChild(dibujo);
  }

  // Fuente de los datos (letra pequeña, abajo del carnet)
  const fuente = document.getElementById("ficha-fuente");
  fuente.hidden = !datos.fuente;
  fuente.textContent = datos.fuente || "";
  document.getElementById("ficha").classList.toggle("con-fuente", Boolean(datos.fuente));

  // Debajo de la foto: tiempos de cada etapa
  const tiempos = document.getElementById("ficha-tiempos");
  tiempos.replaceChildren();
  ficha.tiempos.forEach((t) => tiempos.appendChild(campoCarnet(t.etiqueta, t.valor)));

  // Datos del carnet
  fichaTexto.replaceChildren();
  const cabecera = elemento("div", "carnet-cabecera");
  cabecera.append(elemento("span", "carnet-titulo", "Carnet de insecto"), elemento("span", "carnet-sub", "Diario de campo de Bichi"));
  const nombre = campoCarnet("Nombre", ficha.nombre, "campo-nombre");
  nombre.querySelector(".campo-valor").id = "ficha-titulo";
  if (ficha.nombreCientifico) nombre.appendChild(elemento("span", "campo-cientifico", ficha.nombreCientifico));
  // Si el insecto no tiene "otro nombre", ese cuadro no se muestra
  const fila1 = elemento("div", "campo-fila " + (ficha.otroNombre ? "campo-fila-3" : "campo-fila-2"));
  fila1.append(nombre);
  if (ficha.otroNombre) fila1.append(campoCarnet("Otro nombre", ficha.otroNombre));
  fila1.append(campoCarnet("Nacionalidad", ficha.nacionalidad));
  // Nombres de las regiones (para que no haya que saberlas de memoria)
  const filaRegiones = ficha.regiones
    ? campoCarnet("Regiones", listaDeRegiones(ficha.regiones), "campo-regiones")
    : null;
  // Si el insecto no tiene mapa, la zona se escribe como un campo más
  const fila2 = ficha.regiones ? null : campoCarnet("¿Dónde vive?", ficha.zona);
  const descripcion = campoCarnet("Descripción", ficha.descripcion, "campo-descripcion");

  // Sexo: pequeña tabla macho / hembra (solo si hay datos confiables de cómo distinguirlos)
  let sexo = null;
  if (ficha.sexo) {
  sexo = elemento("div", "campo campo-sexo");
  sexo.appendChild(elemento("span", "campo-etiqueta", "Sexo: cómo distinguirlos"));
  const tabla = elemento("table", "sexo-tabla");
  const encabezado = elemento("tr");
  encabezado.append(elemento("th"), ...ficha.sexo.columnas.map((c) => elemento("th", "", c)));
  tabla.appendChild(encabezado);
  // Capa transparente sobre el dibujo del insecto, donde se iluminan las partes del cuerpo
  const capaPartes = elemento("div", "partes-cuerpo");
  capaPartes.setAttribute("aria-hidden", "true");
  const contenedorDibujo = fichaDibujo.querySelector(".guia-capas") || fichaDibujo;
  contenedorDibujo.appendChild(capaPartes);

  ficha.sexo.filas.forEach((fila) => {
    const tr = elemento("tr");
    tr.append(elemento("th", "", fila.etiqueta), ...fila.valores.map((v) => elemento("td", "", v)));
    tabla.appendChild(tr);

    if (!fila.partes) return;
    const piezas = fila.partes.map((p) => {
      const pieza = elemento("span", "parte-cuerpo" + (p.redondo ? " parte-redonda" : ""));
      pieza.style.left = p.x + "%";
      pieza.style.top = p.y + "%";
      pieza.style.width = p.w + "%";
      pieza.style.height = p.h + "%";
      if (p.giro) pieza.style.setProperty("--giro", p.giro + "deg");
      capaPartes.appendChild(pieza);
      return pieza;
    });
    const encender = (si) => {
      tr.classList.toggle("fila-activa", si);
      piezas.forEach((pieza) => pieza.classList.toggle("activa", si));
    };
    tr.tabIndex = 0;
    tr.addEventListener("pointerenter", () => encender(true));
    tr.addEventListener("pointerleave", () => encender(false));
    tr.addEventListener("focus", () => encender(true));
    tr.addEventListener("blur", () => encender(false));
    // En pantallas táctiles no existe "pasar el cursor": un toque enciende o apaga la parte
    tr.addEventListener("click", () => encender(!tr.classList.contains("fila-activa")));
  });
  sexo.appendChild(tabla);
  }

  // Mapa de Chile: se iluminan las regiones donde vive
  const mapa = document.getElementById("ficha-mapa");
  mapa.replaceChildren();
  if (ficha.regiones) {
    const base = document.createElement("img");
    base.className = "mapa-base";
    base.src = "assets/mapa/mapa-base.png";
    base.alt = "";
    mapa.appendChild(base);
    ficha.regiones.forEach((region) => {
      const luz = document.createElement("img");
      luz.className = "mapa-region";
      luz.src = "assets/mapa/region-" + region + ".png";
      luz.alt = "";
      mapa.appendChild(luz);
    });
    mapa.setAttribute("role", "img");
    mapa.setAttribute("aria-label", "Mapa de Chile con la zona donde vive: " + ficha.zona);
    mapa.parentElement.hidden = false;
    document.getElementById("ficha-mapa-texto").textContent = ficha.zona;
  } else {
    mapa.parentElement.hidden = true;
  }

  fichaTexto.append(cabecera, fila1);
  if (filaRegiones) fichaTexto.append(filaRegiones);
  fichaTexto.append(descripcion);
  if (sexo) fichaTexto.append(sexo);
  if (fila2) fichaTexto.insertBefore(fila2, descripcion);
  fichaTexto.scrollTop = 0;
  fichaCapa.hidden = false;
  botonEncicloCerrar.classList.add("oculto");   // mientras el carnet está abierto solo se ve su X
  botonFichaCerrar.focus();
}

function cerrarFicha() {
  fichaCapa.hidden = true;
  botonEncicloCerrar.classList.remove("oculto");
  fichaDibujo.replaceChildren();   // así la animación se detiene
  if (botonDeFicha) botonDeFicha.focus();
  botonDeFicha = null;
}

botonFichaCerrar.addEventListener("click", cerrarFicha);
fichaCapa.addEventListener("click", (evento) => {
  if (evento.target === fichaCapa) cerrarFicha();   // clic fuera del rectángulo
});

// Registra un insecto y hace tintinear el botón de la enciclopedia hasta que se abra
function descubrirInsecto(id) {
  if (insectosDescubiertos.includes(id)) return;
  insectosDescubiertos.push(id);
  insectosNuevos.push(id);
  botonEnciclo.classList.add("tintinea");
  botonEnciclo.setAttribute("aria-label", "Diario de campo: ¡hay un insecto nuevo!");
  revisarMisiones();
}

function dibujarEnciclo() {
  const cerrado = apartadoActual === -1;
  const apartado = cerrado ? {} : ENCICLOPEDIA[apartadoActual];

  libroEl.classList.toggle("cerrado", cerrado);
  libroTapa.hidden = !cerrado;
  libroFondo.hidden = cerrado;
  planaIzq.hidden = cerrado || !!apartado.proximamente;
  planaDer.hidden = cerrado || !!apartado.proximamente;
  textoProximamente.hidden = !apartado.proximamente;

  if (cerrado) {
    encicloEstado.textContent = "Enciclopedia cerrada. Pasa la página para abrirla.";
  } else if (apartado.proximamente) {
    encicloEstado.textContent = "Próximamente";
  } else {
    document.getElementById("titulo-izq").textContent = apartado.titulo;
    dibujarCasillas(document.getElementById("casillas-izq"), apartado.casillas.slice(0, CASILLAS_POR_PLANA));
    dibujarCasillas(document.getElementById("casillas-der"), apartado.casillas.slice(CASILLAS_POR_PLANA));
    encicloEstado.textContent = apartado.titulo + ". Páginas con " + CASILLAS_POR_PLANA + " casillas de insectos cada una.";
  }

  // Con el libro cerrado no hay "anterior"; en la última página no hay "siguiente"
  botonPagAnterior.hidden = cerrado;

  cancelarRevelacion();
  if (!cerrado && !apartado.proximamente) iniciarRevelacion();
  botonPagSiguiente.hidden = apartadoActual === ENCICLOPEDIA.length - 1;
}

function cambiarPagina(paso) {
  const nuevo = apartadoActual + paso;
  if (nuevo < -1 || nuevo >= ENCICLOPEDIA.length) return;
  apartadoActual = nuevo;
  sonarPagina();
  dibujarEnciclo();
  // si el botón que se usó desapareció, el foco pasa al otro para no perderse
  if (document.activeElement.hidden || document.activeElement === document.body) {
    (botonPagSiguiente.hidden ? botonPagAnterior : botonPagSiguiente).focus();
  }
}

let objetivoDiarioActivo = false;   // el objetivo "abre el diario" tras conocer al abejorro

function abrirEnciclo() {
  if (objetivoDiarioActivo) {
    objetivoDiarioActivo = false;
    ponerMision(null);
  }
  botonEnciclo.classList.remove("tintinea");
  botonEnciclo.setAttribute("aria-label", "Diario de campo");
  focoAntesDeEnciclo = document.activeElement;
  apartadoActual = -1;   // siempre se abre con el libro cerrado
  dibujarEnciclo();
  encicloPanel.hidden = false;
  botonPagSiguiente.focus();
}

function cerrarEnciclo() {
  if (!fichaCapa.hidden) cerrarFicha();
  cancelarRevelacion();
  encicloPanel.hidden = true;
  if (focoAntesDeEnciclo) focoAntesDeEnciclo.focus();
}

botonEnciclo.addEventListener("click", abrirEnciclo);
botonEncicloCerrar.addEventListener("click", cerrarEnciclo);
botonPagSiguiente.addEventListener("click", () => cambiarPagina(1));
botonPagAnterior.addEventListener("click", () => cambiarPagina(-1));
encicloPanel.addEventListener("click", (evento) => {
  if (evento.target === encicloPanel) cerrarEnciclo();   // clic en el fondo oscuro
});
document.addEventListener("keydown", (evento) => {
  if (encicloPanel.hidden) return;
  if (!fichaCapa.hidden) {
    // con la ficha abierta, Esc la cierra y las flechas no pasan la página
    if (evento.key === "Escape") { evento.stopPropagation(); cerrarFicha(); }
    return;
  }
  if (evento.key === "Escape") cerrarEnciclo();
  else if (evento.key === "ArrowRight") cambiarPagina(1);
  else if (evento.key === "ArrowLeft") cambiarPagina(-1);
});

// La enciclopedia se activa cuando termina el tutorial
function activarEnciclopedia() {
  botonEnciclo.disabled = false;
  botonEnciclo.setAttribute("aria-label", "Diario de campo");
}

// ---------- Carrusel de niveles ----------
// El nivel de adelante es el activo. Se cambia arrastrando, con las flechas o con el teclado.
const carrusel = document.getElementById("carrusel");
const tarjetasNivel = Array.from(carrusel.querySelectorAll(".nivel-tarjeta"));
const botonNivelAnterior = document.getElementById("nivel-anterior");
const botonNivelSiguiente = document.getElementById("nivel-siguiente");
const ayudaCarrusel = document.getElementById("carrusel-ayuda");

const AYUDA_ARRASTRAR = "Mantén el clic presionado y arrastra hacia un lado para cambiar de nivel.";
const SEPARACION = 0.72;   // qué tan separadas quedan las tarjetas (en anchos de tarjeta)
const REDUCCION = 0.28;    // cuánto se achica la tarjeta que queda al lado

let nivelActivo = 0;
let suprimirClic = false;

// Coloca las tarjetas. "posicion" puede tener decimales mientras se arrastra
function colocarTarjetas(posicion, animar) {
  tarjetasNivel.forEach((tarjeta, i) => {
    const distancia = i - posicion;
    const lejos = Math.abs(distancia);
    const signo = Math.sign(distancia);

    const desplazamiento = signo * (SEPARACION * Math.min(lejos, 1) + 0.45 * Math.max(lejos - 1, 0));
    const escala = Math.max(0.45, 1 - REDUCCION * Math.min(lejos, 1) - 0.17 * Math.max(lejos - 1, 0));

    tarjeta.style.transition = animar ? "transform 0.4s ease, opacity 0.4s ease" : "none";
    tarjeta.style.transform =
      "translateX(calc(-50% + var(--ancho-tarjeta) * " + desplazamiento.toFixed(3) + ")) scale(" + escala.toFixed(3) + ")";
    tarjeta.style.opacity = Math.max(0.4, 1 - 0.3 * lejos).toFixed(2);
    tarjeta.style.zIndex = String(100 - Math.round(lejos * 10));
  });
}

function irANivel(indice) {
  nivelActivo = Math.max(0, Math.min(tarjetasNivel.length - 1, indice));
  colocarTarjetas(nivelActivo, true);

  tarjetasNivel.forEach((tarjeta, i) => {
    if (i === nivelActivo) tarjeta.setAttribute("aria-current", "true");
    else tarjeta.removeAttribute("aria-current");
  });
  botonNivelAnterior.disabled = nivelActivo === 0;
  botonNivelSiguiente.disabled = nivelActivo === tarjetasNivel.length - 1;
  ayudaCarrusel.textContent = AYUDA_ARRASTRAR;
}

// Clic en un nivel: si está atrás, pasa al frente; si es el Balcón y está al frente, se entra
tarjetasNivel.forEach((tarjeta, i) => {
  tarjeta.addEventListener("click", () => {
    if (suprimirClic) return;
    if (i !== nivelActivo) {
      irANivel(i);
    } else if (tarjeta === botonBalcon) {
      if (!botonBalcon.disabled) entrarAlBalcon();
    } else if (tarjeta.classList.contains("nivel-bloqueado")) {
      ayudaCarrusel.textContent = tarjeta.id === "btn-nivel-patio"
        ? "El Patio todavía está bloqueado."
        : "Pronto habrá nuevos lugares por descubrir.";
    }
  });
});

botonNivelAnterior.addEventListener("click", () => irANivel(nivelActivo - 1));
botonNivelSiguiente.addEventListener("click", () => irANivel(nivelActivo + 1));

carrusel.addEventListener("keydown", (evento) => {
  if (evento.key === "ArrowLeft") irANivel(nivelActivo - 1);
  if (evento.key === "ArrowRight") irANivel(nivelActivo + 1);
});

// Arrastrar: mantener el clic y mover hacia un lado
let arrastreNivel = null;

carrusel.addEventListener("pointerdown", (evento) => {
  if (evento.pointerType === "mouse" && evento.button !== 0) return;
  arrastreNivel = {
    inicioX: evento.clientX,
    base: nivelActivo,
    paso: tarjetasNivel[0].offsetWidth * SEPARACION,
    movido: false
  };
});

carrusel.addEventListener("pointermove", (evento) => {
  if (!arrastreNivel) return;
  const dx = evento.clientX - arrastreNivel.inicioX;

  if (!arrastreNivel.movido && Math.abs(dx) > 8) {
    arrastreNivel.movido = true;
    carrusel.setPointerCapture(evento.pointerId);
    carrusel.classList.add("arrastrando");
  }
  if (!arrastreNivel.movido) return;

  const posicion = arrastreNivel.base - dx / arrastreNivel.paso;
  colocarTarjetas(Math.max(-0.3, Math.min(tarjetasNivel.length - 0.7, posicion)), false);
});

function soltarCarrusel(evento, cancelado) {
  if (!arrastreNivel) return;
  const { movido, inicioX, base, paso } = arrastreNivel;
  arrastreNivel = null;
  carrusel.classList.remove("arrastrando");
  if (!movido) return;

  // Después de arrastrar, el navegador manda un clic: lo ignoramos
  suprimirClic = true;
  setTimeout(() => { suprimirClic = false; }, 0);

  const dx = evento.clientX - inicioX;
  let destino = Math.round(base - dx / paso);
  // Un arrastre corto pero decidido también cambia de nivel
  if (!cancelado && destino === base && Math.abs(dx) > 40) destino = base + (dx < 0 ? 1 : -1);
  irANivel(cancelado ? base : destino);
}

carrusel.addEventListener("pointerup", (evento) => soltarCarrusel(evento, false));
carrusel.addEventListener("pointercancel", (evento) => soltarCarrusel(evento, true));

irANivel(0);
colocarTarjetas(0, false);

// ---------- Elementos de la partida ----------
const escena = document.querySelector(".escena");
const fondoEscena = document.getElementById("escena-fondo");
const barraObjetos = document.querySelector(".hotbar");
const slotEsponja = document.getElementById("slot-esponja");
const botonTienda = document.getElementById("menu-tienda");

// ---------- Misiones ----------
// Un pequeño recuadro arriba dice qué toca hacer. Durante el tutorial lo manda el pololo;
// después se usan las misiones de abajo, que dan BP al cumplirse.
const cuadroMision = document.getElementById("mision");
const textoMision = document.getElementById("mision-texto");
const progresoMision = document.getElementById("mision-progreso");
const etiquetaMision = document.getElementById("mision-etiqueta");
const simboloMision = document.getElementById("mision-simbolo");
const iconoMision = document.getElementById("mision-icono");
const panelMision = document.getElementById("mision-panel");
const puntoMision = document.getElementById("mision-punto");
let timerMision = null;

// etiqueta: "Objetivo" = lo que toca hacer para avanzar; "Misión" = retos que dan BP
function ponerMision(texto, progreso, etiqueta) {
  clearTimeout(timerMision);
  etiquetaMision.textContent = etiqueta || "Objetivo";
  simboloMision.textContent = etiqueta === "Misión" ? "!" : "?";
  cuadroMision.classList.remove("cumplida");
  if (!texto) {
    cuadroMision.hidden = true;
    return;
  }
  const cambio = textoMision.textContent !== texto;
  textoMision.textContent = texto;
  progresoMision.textContent = progreso || "";
  cuadroMision.hidden = false;
  ubicarMision();
  if (cambio) {
    // El icono se mueve y deja un puntito hasta que el jugador lo abre
    cuadroMision.classList.remove("nueva");
    void cuadroMision.offsetWidth;   // reinicia la animación
    cuadroMision.classList.add("nueva");
    if (!panelMision.hidden) return;
    puntoMision.hidden = false;
  }
}

// El icono va en la esquina superior izquierda del escenario; si el engranaje de configuración
// (que flota sobre la página) tapa esa esquina, se pone justo a su lado, en la misma fila
function ubicarMision() {
  const caja = escena.getBoundingClientRect();
  if (!caja.width) return;
  const engranaje = document.getElementById("btn-config").getBoundingClientRect();
  const margen = Math.max(8, caja.width * 0.01);
  let izq = margen;
  let arriba = margen;
  if (engranaje.right + 8 > caja.left && engranaje.left < caja.right) {
    izq = Math.max(margen, engranaje.right + 8 - caja.left);
    arriba = Math.max(margen, engranaje.top - caja.top);
  }
  cuadroMision.style.left = izq + "px";
  cuadroMision.style.top = arriba + "px";
}
window.addEventListener("resize", ubicarMision);

// Clic en el icono: muestra u oculta el objetivo
function abrirMision(abrir) {
  panelMision.hidden = !abrir;
  iconoMision.setAttribute("aria-expanded", String(abrir));
  if (abrir) puntoMision.hidden = true;
}
iconoMision.addEventListener("click", () => abrirMision(panelMision.hidden));

// Misiones de después del tutorial (se pueden agregar más; van en orden)
//  - progreso: función que dice cuánto lleva el jugador;  meta: cuánto necesita;  recompensa: BP
const MISIONES = [
  { texto: "Planta dos plantas diferentes", meta: 2, recompensa: 4, progreso: () => estado.especiesPlantadas.length }
];

function mostrarMisionLibre() {
  const mision = MISIONES[estado.misionActual];
  if (!mision) {
    ponerMision("¡Cumpliste todas las misiones por ahora!", "", "Misión");
    timerMision = setTimeout(() => ponerMision(null), 6000);
    return;
  }
  ponerMision(mision.texto, Math.min(mision.progreso(), mision.meta) + " / " + mision.meta, "Misión");
}

// Se llama cada vez que pasa algo que podría cumplir la misión (plantar, descubrir un insecto...)
function revisarMisiones() {
  if (!estado.tutorialTerminado) return;
  const mision = MISIONES[estado.misionActual];
  if (!mision) return;
  if (mision.progreso() < mision.meta) {
    mostrarMisionLibre();
    return;
  }
  // ¡Cumplida!
  estado.monedas += mision.recompensa;
  mostrarMonedas();
  animarSaldo(mision.recompensa);
  sonarBrillos();
  estado.misionActual++;
  ponerMision("¡Misión cumplida! +" + mision.recompensa + " BP", "", "Misión");
  abrirMision(true);   // se muestra sola un momento
  cuadroMision.classList.add("cumplida");
  timerMision = setTimeout(() => { mostrarMisionLibre(); abrirMision(false); }, 3200);
}

// ---------- Tutorial del pololo verde ----------
// Cada secuencia es una lista de mensajes. Se pueden cambiar sin tocar el resto del código.
//  - texto:         lo que dice el pololo
//  - desenfoque:    false si el fondo debe verse nítido (si no se escribe, se desenfoca)
//  - resalta:       id del elemento que se marca con borde amarillo
//  - regalo:        BichiPesos que recibe el jugador en ese paso
//  - espera:        el pololo espera a que el jugador haga algo (no hay flecha)
//  - requiereTienda: la tienda debe estar abierta en ese paso
//  - alMostrar:     algo que ocurre cuando aparece ese mensaje

// 1) Presentación y limpieza
const PASOS_INTRO = [
  { texto: "¡Oh, hola, y bienvenido a Bichi!", mision: "Habla con el pololo" },
  { texto: "Yo soy San Juan verde, o para los amigos, Pololo verde. Habito aquí en Chile y…" },
  { texto: "Mmm… veo que observas el fondo. Sí, está un poco descuidado, y en esas telarañas ya no vive nadie.", desenfoque: false },
  { texto: "¿Te parece si arreglamos un poco?", desenfoque: false },
  { texto: "Antes de que se me olvide, te explicaré unas cositas muy importantes para hacer el cambio en este lugar." },
  { texto: "Al costado izquierdo tienes un menú con distintos íconos.", resalta: "menu-izq" },
  { texto: "El ícono de la H es para ir a la fabricación de tu hotel de insectos, pero eso lo veremos más adelante.", resalta: "menu-hotel" },
  { texto: "También tienes tu propio diario de campo, donde podrás ver todos los insectos que encuentres durante tu experiencia.", resalta: "menu-enciclopedia" },
  { texto: "Y luego tenemos la tienda. En ella podrás comprar distintas herramientas y artículos para ir mejorando esta terraza, para que distintos insectos se acerquen aquí.", resalta: "menu-tienda" },
  { texto: "Pero… te preguntarás cómo comprar. Para eso tenemos los increíbles BichiPesos (BP). ¡Los conseguirás al regar tus plantas y al encontrar insectos nuevos!", resalta: "saldo" },
  { texto: "Pero, por el momento, ¡yo te daré 10 BP para que comencemos!", resalta: "saldo", regalo: 10 },
  { texto: "¿Ves esa esponja en tu inventario? ¡Utilicémosla para limpiar este lugar! Haz clic en ella y, con el clic presionado, muévela por la pantalla hasta limpiar todo.", desenfoque: false, resalta: "slot-esponja", mision: "Limpia el balcón con la esponja" }
];

// 2) Después de limpiar: el pololo muestra la tienda
const PASOS_DESPUES_DE_LIMPIAR = [
  { texto: "¡Buen trabajo! Ahora está mejor.", desenfoque: false, mision: "Habla con el pololo" },
  {
    texto: "Pero podría ser mucho mejor… ¡te mostraré la tienda!",
    resalta: "menu-tienda",
    mision: "Abre la tienda",
    espera: "abrir-tienda",
    alMostrar: () => { botonTienda.disabled = false; }
  }
];

// 3) Con la tienda abierta
const PASOS_EN_LA_TIENDA = [
  { texto: "¡Mira cuántas cosas! Aquí arriba están las herramientas y los materiales para mejorar tu terraza.", resalta: "tienda-herramientas", requiereTienda: true, mision: "Habla con el pololo" },
  { texto: "Y aquí abajo están las semillas. Cada planta puede atraer insectos distintos, ¡así que elige con cuidado!", resalta: "tienda-semillas", requiereTienda: true },
  { texto: "Cada cosa tiene su precio en BP. Si no te alcanzan, ¡tendrás que juntar más!", resalta: "saldo", requiereTienda: true },
  { texto: "Para empezar, compremos semillas de manzanilla. ¡Cuestan 2 BP!", resalta: "comprar-semillas-manzanilla", requiereTienda: true, espera: "comprar-manzanilla",
    mision: "Compra semillas de manzanilla",
    // recién ahora se abre el botón de la manzanilla
    alMostrar: () => { estado.puedeComprarManzanilla = true; actualizarTienda(); } }
];

// 4) Después de comprar la manzanilla
const PASOS_COMPRA_HECHA = [
  { texto: "¡Excelente! Mira cómo bajó tu saldo y cómo llegaron tus semillas al inventario.", resalta: "slot-semillas-manzanilla", mision: "Habla con el pololo" }
];

// 5) Plantar: el jugador arrastra las semillas hasta la maceta de la derecha
const PASOS_PLANTAR = [
  {
    texto: "Ahora haz clic en tus semillas del inventario y luego haz clic sobre la maceta de la derecha para plantarlas.",
    desenfoque: false,
    mision: "Planta las semillas en la maceta de la derecha",
    resalta: ["slot-semillas-manzanilla", "zona-maceta"],
    espera: "plantar",
    alMostrar: () => {
      cerrarTienda();
      estado.puedePlantar = true;
      aplicarEstadoSlots();
    }
  }
];

// 6) Ya plantada
const PASOS_PLANTADA = [
  { texto: "¡Mira, ya brotó! Debajo de la maceta hay una barra que muestra cuánto le falta para crecer.", desenfoque: false, resalta: "barra-crecimiento", mision: "Habla con el pololo" },
  { texto: "Te dejo mirando cómo crece. ¡Ya vuelvo!", desenfoque: false }
];

// 7) La planta tiene sed
const PASOS_SED = [
  { texto: "¡Oh, oh! ¿Ves esa gotita? Tu manzanilla tiene sed y dejó de crecer.", desenfoque: false, resalta: "icono-gota", mision: "Habla con el pololo" },
  { texto: "Las plantas necesitan agua para crecer sanas. ¡Hay una regadera sobre la mesa de la derecha! Haz clic en ella para guardarla en tu inventario.",
    desenfoque: false,
    resalta: "zona-regadera",
    mision: "Toma la regadera de la mesa",
    espera: "tomar-regadera",
    alMostrar: () => {
      zonaRegadera.hidden = false;
      zonaRegadera.disabled = false;
    }
  }
];

// 8) Regar
const PASOS_REGAR = [
  {
    texto: "¡Muy bien! Ahora selecciona la regadera en tu inventario y haz clic sobre tu manzanilla para regarla.",
    desenfoque: false,
    resalta: ["slot-regadera", "zona-maceta"],
    mision: "Riega tu manzanilla con la regadera",
    espera: "regar",
    alMostrar: () => {
      estado.regaderaUsable = true;
      aplicarEstadoSlots();
    }
  }
];

// 9) La planta se recupera
const PASOS_RECUPERADA = [
  { texto: "¡Funcionó! Tu manzanilla se recuperó y volvió a crecer. Además, regar te dio 1 BP: cada vez que riegues una planta recibirás la mitad de lo que costaron sus semillas.", desenfoque: false, resalta: "saldo", mision: "Habla con el pololo" }
];

// 10) La manzanilla florece
const PASOS_FINAL = [
  { texto: "¡Mira esa manzanilla! Ya floreció gracias a tus cuidados.", desenfoque: false, mision: "Habla con el pololo" },
  { texto: "¿Ves la otra maceta, la de la izquierda? Aún está vacía. Pasa por la tienda, compra semillas de rosa y plántalas ahí.", desenfoque: false, resalta: "zona-maceta-izq" },
  { texto: "Esto es todo por ahora. Me haré pequeñito para volar por tu terraza. ¡Pronto habrá más cosas por descubrir!", desenfoque: false }
];

const guia = document.getElementById("guia");
const textoGlobo = document.getElementById("globo-texto");
const botonSiguiente = document.getElementById("btn-siguiente");

let secuencia = [];
let pasoActual = 0;
let alTerminarSecuencia = null;
let esperaActual = null;
let elementosResaltados = [];

// Quita el borde amarillo de los elementos que estaban marcados
function quitarResaltado() {
  elementosResaltados.forEach((elemento) => elemento.classList.remove("resaltado"));
  elementosResaltados = [];
}

// Entrega los BP del regalo, una sola vez
function entregarRegalo(cantidad) {
  if (estado.regaloEntregado) return;
  estado.regaloEntregado = true;
  estado.monedas += cantidad;
  mostrarMonedas();
}

// Muestra el mensaje del paso actual
function mostrarPaso() {
  const paso = secuencia[pasoActual];

  textoGlobo.textContent = paso.texto;
  if (paso.mision !== undefined) ponerMision(paso.mision);
  fondoEscena.classList.toggle("desenfocado", paso.desenfoque !== false);

  // Si el paso espera una acción del jugador, no hay flecha
  esperaActual = paso.espera || null;
  botonSiguiente.hidden = Boolean(esperaActual);

  if (paso.requiereTienda && tienda.hidden) abrirTienda();
  if (paso.regalo) entregarRegalo(paso.regalo);
  if (paso.alMostrar) paso.alMostrar();

  quitarResaltado();
  if (paso.resalta) {
    // "resalta" puede ser un id o una lista de ids
    const ids = Array.isArray(paso.resalta) ? paso.resalta : [paso.resalta];
    elementosResaltados = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    elementosResaltados.forEach((elemento) => elemento.classList.add("resaltado"));
  }

  // Foco para quien use el teclado
  const primero = elementosResaltados[0];
  if (!botonSiguiente.hidden) {
    botonSiguiente.focus({ preventScroll: true });
  } else if (primero && primero.tagName === "BUTTON" && !primero.disabled) {
    primero.focus({ preventScroll: true });
  }
}

function iniciarSecuencia(pasos, alTerminar) {
  secuencia = pasos;
  pasoActual = 0;
  alTerminarSecuencia = alTerminar || null;
  guia.hidden = false;
  mostrarPaso();
}

// Pasa al siguiente mensaje; si no quedan, termina la secuencia
function avanzar() {
  pasoActual++;
  if (pasoActual < secuencia.length) {
    mostrarPaso();
    return;
  }

  const secuenciaTerminada = secuencia;
  if (alTerminarSecuencia) alTerminarSecuencia();

  // Si no empezó otra secuencia, el pololo se despide
  if (secuencia === secuenciaTerminada) {
    guia.hidden = true;
    fondoEscena.classList.remove("desenfocado");
  }
}

botonSiguiente.addEventListener("click", avanzar);

function iniciarTutorial() {
  iniciarSecuencia(PASOS_INTRO, () => {
    // Ahora sí se puede usar la esponja (sigue resaltada hasta que la elijas)
    slotEsponja.disabled = false;
  });
}

// ---------- Tienda ----------
const tienda = document.getElementById("tienda");
const botonCerrarTienda = document.getElementById("tienda-cerrar");
const listaHerramientas = document.getElementById("lista-herramientas");
const listaSemillas = document.getElementById("lista-semillas");
const avisoTienda = document.getElementById("tienda-aviso");
const tarjetasTienda = {};  // guarda la tarjeta y el botón de cada producto

// Crea la tarjeta de un producto
function crearTarjeta(producto) {
  const tarjeta = document.createElement("article");
  tarjeta.className = "producto";

  const foto = document.createElement("div");
  foto.className = "producto-foto";
  const imagen = document.createElement("img");
  imagen.src = producto.imagen;
  imagen.alt = "";
  imagen.onerror = () => imagen.remove(); // si falta la imagen, queda el cuadro verde
  foto.appendChild(imagen);

  const nombre = document.createElement("p");
  nombre.className = "producto-nombre";
  nombre.textContent = producto.nombre;

  const precio = document.createElement("p");
  precio.className = "producto-precio";
  const iconoPrecio = document.createElement("img");
  iconoPrecio.src = "assets/iconos/icono-bichipeso.png";
  iconoPrecio.alt = "BichiPesos";
  const cifra = document.createElement("span");
  cifra.textContent = producto.precio;
  precio.append(iconoPrecio, cifra);

  const boton = document.createElement("button");
  boton.className = "producto-comprar";
  boton.id = "comprar-" + producto.id;
  boton.addEventListener("click", () => comprar(producto));

  tarjeta.append(foto, nombre, precio, boton);
  tarjetasTienda[producto.id] = { tarjeta, boton };
  return tarjeta;
}

// ¿Se puede comprar este producto ahora?
function estaDisponible(producto) {
  return producto.disponibleSi ? producto.disponibleSi() : producto.disponible;
}

// Actualiza los botones de la tienda según lo que el jugador ya puede comprar
function actualizarTienda() {
  PRODUCTOS.forEach((producto) => {
    const { tarjeta, boton } = tarjetasTienda[producto.id];
    const disponible = estaDisponible(producto);
    tarjeta.classList.toggle("no-disponible", !disponible);
    boton.disabled = !disponible;
    boton.textContent = disponible
      ? "Comprar"
      : (producto.etiquetaNo ? producto.etiquetaNo() : "Comprar");
    boton.setAttribute(
      "aria-label",
      (disponible ? "Comprar " : "No disponible aún: ") + producto.nombre
    );
  });
}

PRODUCTOS.forEach((producto) => {
  const lista = producto.tipo === "herramienta" ? listaHerramientas : listaSemillas;
  lista.appendChild(crearTarjeta(producto));
});
actualizarTienda();

function ampliarTienda() {
  if (estado.tiendaAmpliada) return;
  estado.tiendaAmpliada = true;
  actualizarTienda();
  avisarTiendaNueva();
  aplicarEstadoSlots();
}

// El botón de la tienda tintinea cuando hay productos nuevos por descubrir (se apaga al abrirla)
function avisarTiendaNueva() {
  botonTienda.classList.add("tintinea");
  botonTienda.setAttribute("aria-label", "Tienda: ¡hay productos nuevos!");
}

function abrirTienda() {
  botonTienda.classList.remove("tintinea");
  botonTienda.setAttribute("aria-label", "Tienda");
  tienda.hidden = false;
  escena.classList.add("tienda-abierta");
  avisoTienda.textContent = "";
  // Si el pololo esperaba que se abriera la tienda, sigue con la explicación
  if (esperaActual === "abrir-tienda") avanzar();
}

function cerrarTienda() {
  tienda.hidden = true;
  escena.classList.remove("tienda-abierta");
}

botonTienda.addEventListener("click", abrirTienda);
botonCerrarTienda.addEventListener("click", cerrarTienda);

// Compra un producto: descuenta el saldo y lo guarda en el inventario
function comprar(producto) {
  if (!estaDisponible(producto)) return;
  if (estado.monedas < producto.precio) {
    avisoTienda.textContent = "Te faltan BP para comprar esto.";
    return;
  }

  estado.monedas -= producto.precio;
  mostrarMonedas();
  estado.inventario[producto.id] = (estado.inventario[producto.id] || 0) + 1;
  if (producto.id === "semillas-rosa") estado.rosaComprada = true;
  if (producto.id === "semillas-manzanilla") {
    // una sola compra: el botón se bloquea para que no gasten todos los BP aquí
    estado.manzanillaComprada = true;
    estado.puedeComprarManzanilla = false;
  }
  dibujarInventario();
  actualizarTienda();
  avisoTienda.textContent = "¡Compraste " + producto.nombre + "!";

  if (esperaActual === "comprar-manzanilla" && producto.id === "semillas-manzanilla") {
    avanzar();
  }
}

// ---------- Barra de objetos (inventario) ----------
function hayObjetosEnLaBarra() {
  return !slotEsponja.hidden || barraObjetos.querySelector(".slot-dinamico") !== null;
}

// Muestra la barra si tiene objetos y la esconde si quedó vacía
function actualizarBarra() {
  if (hayObjetosEnLaBarra()) {
    barraObjetos.hidden = false;
    barraObjetos.classList.remove("saliendo");
  } else {
    barraObjetos.classList.add("saliendo");
    setTimeout(() => {
      if (!hayObjetosEnLaBarra()) barraObjetos.hidden = true;
    }, 600);
  }
}

// Dibuja una casilla por cada objeto comprado
function dibujarInventario() {
  barraObjetos.querySelectorAll(".slot-dinamico").forEach((slot) => slot.remove());

  [...PRODUCTOS, ...OBJETOS_EXTRA].forEach((producto) => {
    const cantidad = estado.inventario[producto.id] || 0;
    if (cantidad <= 0) return;

    const slot = document.createElement("button");
    slot.className = "slot slot-dinamico";
    slot.id = "slot-" + producto.id;
    slot.disabled = true; // se activa solo cuando el juego lo permite (ver aplicarEstadoSlots)
    slot.setAttribute("aria-label", producto.nombre + ", cantidad " + cantidad);

    const imagen = document.createElement("img");
    imagen.src = producto.imagen;
    imagen.alt = "";
    imagen.onerror = () => {
      // Si falta la imagen, se escribe el nombre para que la casilla no quede vacía
      imagen.remove();
      const etiqueta = document.createElement("span");
      etiqueta.className = "slot-etiqueta";
      etiqueta.textContent = producto.nombre;
      slot.prepend(etiqueta);
    };

    const numero = document.createElement("span");
    numero.className = "slot-cantidad";
    numero.textContent = cantidad;

    if (producto.sinCantidad) slot.append(imagen);
    else slot.append(imagen, numero);
    barraObjetos.appendChild(slot);
  });

  aplicarEstadoSlots();
  actualizarBarra();
}

// Activa o apaga las casillas según lo que el jugador puede hacer en ese momento
function aplicarEstadoSlots() {
  // Cada casilla de semillas se activa solo si hay una maceta donde plantarla
  barraObjetos.querySelectorAll('.slot-dinamico[id^="slot-semillas-"]').forEach((slot) => {
    const idSemilla = slot.id.replace("slot-", "");
    slot.disabled = !macetaParaSemilla(idSemilla);
    slot.classList.toggle("seleccionado", estado.semillaSeleccionada === idSemilla);
    slot.setAttribute("aria-pressed", String(estado.semillaSeleccionada === idSemilla));
  });

  // Maceta: se activa si queda un lugar libre en el piso. Saco de tierra: si hay una maceta sin tierra.
  const slotMaceta = document.getElementById("slot-maceta-terracota");
  if (slotMaceta) {
    slotMaceta.disabled = !hayLugarLibre();
    slotMaceta.classList.toggle("seleccionado", estado.semillaSeleccionada === "maceta-terracota");
    slotMaceta.setAttribute("aria-pressed", String(estado.semillaSeleccionada === "maceta-terracota"));
  }
  const slotTierra = document.getElementById("slot-saco-tierra");
  if (slotTierra) {
    slotTierra.disabled = !macetaParaSemilla("saco-tierra");
    slotTierra.classList.toggle("seleccionado", estado.semillaSeleccionada === "saco-tierra");
    slotTierra.setAttribute("aria-pressed", String(estado.semillaSeleccionada === "saco-tierra"));
  }

  const regadera = document.getElementById("slot-regadera");
  if (regadera) {
    regadera.disabled = !estado.regaderaUsable;
    regadera.classList.toggle("seleccionado", estado.regaderaSeleccionada);
    regadera.setAttribute("aria-pressed", String(estado.regaderaSeleccionada));
  }

  actualizarZonas();
}

// ---------- Limpieza con la esponja ----------
const esponjaCursor = document.getElementById("esponja-cursor");
const lienzo = document.getElementById("fondo-sucio");
const ctx = lienzo.getContext("2d");

// Ajustes que puedes cambiar
const RADIO_ESPONJA = 85;     // tamaño de la zona que limpia (en píxeles de la imagen de 1920x1080)
const META_LIMPIEZA = 0.85;   // 0.85 = cuando se limpia el 85 %, el resto se desvanece solo

// El lienzo tiene el mismo tamaño que tus escenarios
const ANCHO_LIENZO = 1920;
const ALTO_LIENZO = 1080;
lienzo.width = ANCHO_LIENZO;
lienzo.height = ALTO_LIENZO;

// Dibuja el balcón sucio en el lienzo
const imagenSucia = new Image();
imagenSucia.onload = () => ctx.drawImage(imagenSucia, 0, 0, ANCHO_LIENZO, ALTO_LIENZO);
imagenSucia.onerror = () => console.warn("No se pudo cargar el balcón sucio");
imagenSucia.src = "assets/escenarios/balcon-sucio.png";

// Para saber cuánto se ha limpiado, dividimos la imagen en una cuadrícula de celdas
// y marcamos las que la esponja ya pasó
const TAMANO_CELDA = 40;
const COLUMNAS = Math.ceil(ANCHO_LIENZO / TAMANO_CELDA);
const FILAS = Math.ceil(ALTO_LIENZO / TAMANO_CELDA);
const TOTAL_CELDAS = COLUMNAS * FILAS;
const celdasLimpias = new Uint8Array(TOTAL_CELDAS);
let cantidadLimpias = 0;

function marcarCeldas(x, y) {
  const r = RADIO_ESPONJA * 0.8;
  const col0 = Math.max(0, Math.floor((x - r) / TAMANO_CELDA));
  const col1 = Math.min(COLUMNAS - 1, Math.floor((x + r) / TAMANO_CELDA));
  const fila0 = Math.max(0, Math.floor((y - r) / TAMANO_CELDA));
  const fila1 = Math.min(FILAS - 1, Math.floor((y + r) / TAMANO_CELDA));

  for (let fila = fila0; fila <= fila1; fila++) {
    for (let col = col0; col <= col1; col++) {
      const indice = fila * COLUMNAS + col;
      if (celdasLimpias[indice]) continue;
      const centroX = col * TAMANO_CELDA + TAMANO_CELDA / 2;
      const centroY = fila * TAMANO_CELDA + TAMANO_CELDA / 2;
      if ((centroX - x) ** 2 + (centroY - y) ** 2 <= r * r) {
        celdasLimpias[indice] = 1;
        cantidadLimpias++;
      }
    }
  }
}

// Borra la suciedad en un punto, con bordes suaves
function borrarEn(x, y) {
  ctx.globalCompositeOperation = "destination-out";
  const degradado = ctx.createRadialGradient(x, y, 0, x, y, RADIO_ESPONJA);
  degradado.addColorStop(0, "rgba(0, 0, 0, 1)");
  degradado.addColorStop(0.7, "rgba(0, 0, 0, 0.85)");
  degradado.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = degradado;
  ctx.beginPath();
  ctx.arc(x, y, RADIO_ESPONJA, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
  marcarCeldas(x, y);
}

// Convierte la posición del mouse a la posición dentro de la imagen
function posicionEnLienzo(evento) {
  const caja = lienzo.getBoundingClientRect();
  return {
    x: (evento.clientX - caja.left) * (ANCHO_LIENZO / caja.width),
    y: (evento.clientY - caja.top) * (ALTO_LIENZO / caja.height)
  };
}

// Selecciona o guarda la esponja
function seleccionarEsponja(activa) {
  estado.esponjaSeleccionada = activa;
  slotEsponja.classList.toggle("seleccionado", activa);
  escena.classList.toggle("modo-esponja", activa);
  esponjaCursor.hidden = !activa;
  if (activa) {
    quitarResaltado();
    if (!estado.limpiezaCompleta) { barraLimpieza.hidden = false; dibujarBarraLimpieza(); }
  }
}

slotEsponja.addEventListener("click", () => {
  if (estado.limpiezaCompleta) return;
  seleccionarEsponja(!estado.esponjaSeleccionada);
});

// Atajos: tecla 1 para tomar o guardar la esponja, Esc para guardarla o cerrar la tienda
document.addEventListener("keydown", (evento) => {
  if (evento.key === "Escape" && !panelConfig.hidden) {
    cerrarConfig();
    return;
  }
  if (evento.key === "Escape" && !tienda.hidden) {
    cerrarTienda();
    return;
  }
  if (slotEsponja.disabled || slotEsponja.hidden || estado.limpiezaCompleta) return;
  if (evento.key === "1") seleccionarEsponja(!estado.esponjaSeleccionada);
  if (evento.key === "Escape") seleccionarEsponja(false);
});

// La esponja sigue al mouse dentro de la escena
escena.addEventListener("pointermove", (evento) => {
  const caja = escena.getBoundingClientRect();
  esponjaCursor.style.left = (evento.clientX - caja.left) + "px";
  esponjaCursor.style.top = (evento.clientY - caja.top) + "px";
});

escena.addEventListener("pointerenter", () => {
  if (estado.esponjaSeleccionada) esponjaCursor.hidden = false;
});

escena.addEventListener("pointerleave", () => {
  esponjaCursor.hidden = true;
});

// Frotar: mantener el clic presionado y mover
let frotando = false;
let ultimoPunto = null;

lienzo.addEventListener("pointerdown", (evento) => {
  if (!estado.esponjaSeleccionada || estado.limpiezaCompleta) return;
  frotando = true;
  lienzo.setPointerCapture(evento.pointerId);
  ultimoPunto = posicionEnLienzo(evento);
  borrarEn(ultimoPunto.x, ultimoPunto.y);
  esponjaCursor.classList.add("frotando");
});

lienzo.addEventListener("pointermove", (evento) => {
  if (!frotando) return;
  const punto = posicionEnLienzo(evento);

  // Borramos también los puntos intermedios para que no queden huecos al mover rápido
  const dx = punto.x - ultimoPunto.x;
  const dy = punto.y - ultimoPunto.y;
  const pasos = Math.max(1, Math.ceil(Math.hypot(dx, dy) / (RADIO_ESPONJA / 4)));
  for (let i = 1; i <= pasos; i++) {
    borrarEn(ultimoPunto.x + (dx * i) / pasos, ultimoPunto.y + (dy * i) / pasos);
  }

  ultimoPunto = punto;
  comprobarLimpieza();
});

function soltarEsponja() {
  frotando = false;
  ultimoPunto = null;
  esponjaCursor.classList.remove("frotando");
  comprobarLimpieza();
}

lienzo.addEventListener("pointerup", soltarEsponja);
lienzo.addEventListener("pointercancel", soltarEsponja);

// ¿Ya está lo suficientemente limpio?
const barraLimpieza = document.getElementById("barra-limpieza");
const limpiezaRelleno = document.getElementById("limpieza-relleno");
const limpiezaBurbujas = document.getElementById("limpieza-burbujas");

// Dibuja el nivel de limpieza (0 a 1): 100 % = lo necesario para dar por limpio el balcón
function dibujarBarraLimpieza() {
  const nivel = Math.max(0, Math.min(1, cantidadLimpias / (TOTAL_CELDAS * META_LIMPIEZA)));
  const pct = Math.round(nivel * 100);
  limpiezaRelleno.style.width = pct + "%";
  limpiezaBurbujas.style.left = pct + "%";
  barraLimpieza.setAttribute("aria-valuenow", String(pct));
}

function comprobarLimpieza() {
  dibujarBarraLimpieza();
  if (estado.limpiezaCompleta) return;
  if (cantidadLimpias / TOTAL_CELDAS >= META_LIMPIEZA) completarLimpieza();
}

function completarLimpieza() {
  if (estado.limpiezaCompleta) return;   // por si se llama dos veces
  estado.limpiezaCompleta = true;
  frotando = false;
  seleccionarEsponja(false);
  slotEsponja.disabled = true;
  dibujarBarraLimpieza();
  barraLimpieza.classList.add("completa");
  setTimeout(() => { barraLimpieza.hidden = true; }, 1600);
  quitarResaltado();

  // La suciedad que queda se desvanece y se ve el balcón limpio
  sonarBrillos();
  lienzo.classList.add("desvanecer");
  setTimeout(() => { lienzo.hidden = true; }, 1300);

  // Ya limpio, la esponja se guarda y sale del inventario
  setTimeout(() => {
    slotEsponja.hidden = true;
    actualizarBarra();
  }, 1300);

  // Primero las macetas: sin diálogo, solo el objetivo arriba
  setTimeout(() => {
    ponerMision("Levanta las dos macetas");
    activarMacetas();
  }, 1600);

  // Cuando las dos están de pie, vuelve el pololo: felicita, muestra la tienda y guía la primera compra
  alLevantarMacetas = () => {
    setTimeout(() => {
      iniciarSecuencia(PASOS_DESPUES_DE_LIMPIAR, () => {
        iniciarSecuencia(PASOS_EN_LA_TIENDA, () => {
          iniciarSecuencia(PASOS_COMPRA_HECHA, () => {
            iniciarSecuencia(PASOS_PLANTAR, () => {
              iniciarSecuencia(PASOS_PLANTADA, () => ponerMision("Espera a que crezca tu manzanilla"));
            });
          });
        });
      });
    }, 500);
  };
}

// ---------- Plantar y crecer ----------
const zonaRegadera = document.getElementById("zona-regadera");
const semillaArrastre = document.getElementById("semilla-arrastre");
const regaderaCursor = document.getElementById("regadera-cursor");

// Cuánto mide, en cqw, 1 píxel de las imágenes de los escenarios (1672 px de ancho = 100 cqw)
const ESCALA_CQW = 100 / 1672;

// Cada especie tiene sus imágenes por etapa y los datos para calzar su lienzo sobre la maceta:
//  - anclaX / anclaY: punto del lienzo que se apoya en la base de la maceta
//  - escala: tamaño de la imagen en el escenario (si la planta se ve muy grande o chica, cambia este número)
const ESPECIES = {
  manzanilla: {
    etapaInicial: "pequena",
    imagenes: {
      pequena: "assets/plantas/manzanilla-pequena.png",
      mediana: "assets/plantas/manzanilla-mediana.png",
      sed:     "assets/plantas/manzanilla-mediana-sed.png",
      grande:  "assets/plantas/manzanilla-grande.png",
      marchita: "assets/plantas/manzanilla-marchita.png"
    },
    lienzo: { ancho: 1054, anclaX: 552, anclaY: 1153, escala: 0.292 }
  },
  rosa: {
    etapaInicial: "pequena",   // parte desde el brote más pequeño, como todas
    imagenes: {
      pequena: "assets/plantas/manzanilla-pequena.png",   // el brote en maceta que ya teníamos
      mediana: "assets/plantas/rosa-mediana.png",
      sed:     "assets/plantas/rosa-sed.png",
      grande:  "assets/plantas/rosa-flor.png",
      marchita: "assets/plantas/rosa-marchita.png"
    },
    lienzo: { ancho: 619, anclaX: 313.06, anclaY: 848.36, escala: 0.415 },
    // El brote es la imagen de la manzanilla: se achica para que su maceta mida igual que la de la rosa
    lienzoEtapa: { pequena: { ancho: 1054, anclaX: 552, anclaY: 1153, escala: 0.262 } }
  },
  pasiflora: {
    etapaInicial: "pequena",   // como todas: parte desde el brote más pequeño
    imagenes: {
      pequena: "assets/plantas/manzanilla-pequena.png",   // el brote en maceta que ya teníamos
      mediana: "assets/plantas/pasiflora-mediana.png",
      sed:     "assets/plantas/pasiflora-sed.png",
      grande:  "assets/plantas/pasiflora-flor.png",
      marchita: "assets/plantas/pasiflora-marchita.png"
    },
    lienzo: { ancho: 619, anclaX: 313.06, anclaY: 848.36, escala: 0.415 },
    lienzoEtapa: { pequena: { ancho: 1054, anclaX: 552, anclaY: 1153, escala: 0.262 } }
  },
  "calle-calle": {
    etapaInicial: "pequena",
    imagenes: {
      pequena: "assets/plantas/calle-calle-pequena.png",
      mediana: "assets/plantas/calle-calle-mediana.png",
      sed: "assets/plantas/calle-calle-sed.png",
      grande: "assets/plantas/calle-calle-flor.png",
      marchita: "assets/plantas/calle-calle-marchita.png"
    },
    lienzo: { ancho: 529, anclaX: 276.0, anclaY: 734.5, escala: 0.584, cimaSed: 135 }
  },
  lirio: {
    etapaInicial: "pequena",
    imagenes: {
      pequena: "assets/plantas/lirio-chileno-pequena.png",
      mediana: "assets/plantas/lirio-chileno-mediana.png",
      sed: "assets/plantas/lirio-chileno-sed.png",
      grande: "assets/plantas/lirio-chileno-flor.png",
      marchita: "assets/plantas/lirio-chileno-marchita.png"
    },
    lienzo: { ancho: 529, anclaX: 276.0, anclaY: 734.5, escala: 0.584, cimaSed: 89 }
  },
  lavanda: {
    etapaInicial: "pequena",
    imagenes: {
      pequena: "assets/plantas/lavanda-pequena.png",
      mediana: "assets/plantas/lavanda-mediana.png",
      crecida: "assets/plantas/lavanda-crecida.png",
      sed: "assets/plantas/lavanda-sed.png",
      grande: "assets/plantas/lavanda-flor.png",
      marchita: "assets/plantas/lavanda-marchita.png"
    },
    lienzo: { ancho: 529, anclaX: 276.0, anclaY: 734.5, escala: 0.584, cimaSed: 144 }
  },
  malamadre: {
    etapaInicial: "pequena",
    imagenes: {
      pequena: "assets/plantas/malamadre-pequena.png",
      mediana: "assets/plantas/malamadre-mediana.png",
      crecida: "assets/plantas/malamadre-crecida.png",
      sed: "assets/plantas/malamadre-sed.png",
      grande: "assets/plantas/malamadre-flor.png",
      marchita: "assets/plantas/malamadre-marchita.png"
    },
    lienzo: { ancho: 529, anclaX: 276.0, anclaY: 734.5, escala: 0.584, cimaSed: 287 }
  },
  "salvia-chilena": {
    etapaInicial: "pequena",
    imagenes: {
      pequena: "assets/plantas/salvia-chilena-pequena.png",
      mediana: "assets/plantas/salvia-chilena-mediana.png",
      crecida: "assets/plantas/salvia-chilena-crecida.png",
      sed: "assets/plantas/salvia-chilena-sed.png",
      grande: "assets/plantas/salvia-chilena-flor.png",
      marchita: "assets/plantas/salvia-chilena-marchita.png"
    },
    lienzo: { ancho: 529, anclaX: 276.0, anclaY: 734.5, escala: 0.584, cimaSed: 166 }
  },
  "lengua-de-suegra": {
    etapaInicial: "pequena",
    imagenes: {
      pequena: "assets/plantas/lengua-de-suegra-pequena.png",
      mediana: "assets/plantas/lengua-de-suegra-mediana.png",
      crecida: "assets/plantas/lengua-de-suegra-crecida.png",
      sed: "assets/plantas/lengua-de-suegra-sed.png",
      grande: "assets/plantas/lengua-de-suegra-flor.png",
      marchita: "assets/plantas/lengua-de-suegra-marchita.png"
    },
    lienzo: { ancho: 529, anclaX: 276.0, anclaY: 734.5, escala: 0.584, cimaSed: 218 }
  }
};

// Las dos macetas del balcón. x e y son el punto de la base de cada maceta, en cqw
const MACETAS = [
  {
    nombre: "derecha", x: 86.54, y: 30.5,
    sprite: document.getElementById("maceta-sprite"),
    sombra: document.getElementById("sombra-der"),
    zona: document.getElementById("zona-maceta"),
    planta: document.getElementById("planta"),
    barra: document.getElementById("barra-crecimiento"),
    relleno: document.getElementById("barra-relleno"),
    gota: document.getElementById("icono-gota")
  },
  {
    nombre: "izquierda", x: 17.08, y: 30.5,
    sprite: document.getElementById("maceta-sprite-izq"),
    sombra: document.getElementById("sombra-izq"),
    zona: document.getElementById("zona-maceta-izq"),
    planta: document.getElementById("planta-izq"),
    barra: document.getElementById("barra-crecimiento-izq"),
    relleno: document.getElementById("barra-relleno-izq"),
    gota: document.getElementById("icono-gota-izq")
  }
];

// Lo que cambia en cada maceta durante la partida
MACETAS.forEach((maceta) => {
  maceta.especie = null;    // manzanilla, rosa o null (vacía)
  maceta.etapa = "ninguna"; // pequena, mediana, sed, grande
  maceta.progreso = 0;      // de 0 (recién plantada) a 1 (florecida)
  maceta.pausada = false;
  maceta.regada = false;
  maceta.terminada = false;
  maceta.levantada = false; // las macetas empiezan tiradas
});

// Al limpiar el balcón las macetas se pueden tocar; cada clic la enderezan
function activarMacetas() {
  MACETAS.forEach((maceta) => {
    if (maceta.levantada) return;
    maceta.sprite.disabled = false;
    maceta.sprite.classList.add("activa");
  });
}

function levantarMaceta(maceta) {
  if (maceta.levantada) return;
  maceta.levantada = true;
  maceta.sprite.disabled = true;
  maceta.sprite.classList.remove("activa", "caida");
  setTimeout(() => maceta.sombra.classList.remove("caida"), 450);   // la sombra vuelve bajo la maceta al caer de pie
  maceta.sprite.classList.add("levantando");
  sonarPlop();
  setTimeout(() => {
    maceta.sprite.classList.remove("levantando");
    if (MACETAS.every((m) => m.levantada)) alLevantarMacetas();
  }, 1000);
}

MACETAS.forEach((maceta) => {
  maceta.sprite.addEventListener("click", () => levantarMaceta(maceta));
});

// Cuando las dos macetas están de pie, el pololo vuelve y sigue el tutorial
let alLevantarMacetas = () => {};

// Tiempos del crecimiento (PROVISORIOS, solo para probar; los puedes cambiar)
const CRECIMIENTO = {
  duracion: 15000,      // milisegundos desde que se planta hasta que florece (si nunca tuviera sed)
  etapaMediana: 0.5,    // a la mitad del camino el brote pasa a planta mediana
  etapaSed: 0.65,       // un poco después le da sed y se detiene
  marchitarDespues: 90000 // milisegundos que una planta florecida aguanta antes de secarse otra vez
};

// BP que entrega regar una planta: la mitad de lo que costaron sus semillas
// (manzanilla 2 BP -> 1 BP; rosa 4 BP -> 2 BP). Si el precio fuera impar, se redondea hacia abajo.
function recompensaDeRiego(especie) {
  const producto = PRODUCTOS.find((p) => p.id === "semillas-" + especie);
  return producto ? Math.floor(producto.precio / 2) : 0;
}

// Pequeño "+1 BP" que sube desde la maceta
function mostrarGanancia(maceta, cantidad) {
  const aviso = document.createElement("div");
  aviso.className = "bp-gana";
  aviso.textContent = "+" + cantidad + " BP";
  aviso.style.left = maceta.x + "cqw";
  aviso.style.top = (maceta.y - 16) + "cqw";
  escena.appendChild(aviso);
  setTimeout(() => aviso.remove(), 1600);
}

// La manzanilla de la maceta derecha es la del tutorial (el pololo la acompaña)
function esDelTutorial(maceta) {
  return maceta === MACETAS[0] && maceta.especie === "manzanilla" && !estado.tutorialTerminado;
}

const ESPECIES_NUEVAS = ["calle-calle", "pasiflora", "lirio", "lavanda", "malamadre", "salvia-chilena", "lengua-de-suegra"];

// ¿Esta maceta puede recibir ahora este objeto (semilla o saco de tierra)?
function macetaAcepta(maceta, id) {
  if (id === "saco-tierra") return maceta.sinTierra === true;
  if (id === "semillas-manzanilla") return estado.puedePlantar && maceta === MACETAS[0] && !maceta.especie;
  if (id === "semillas-rosa") return estado.tutorialTerminado && maceta === MACETAS[1] && !maceta.especie;
  // La pasiflora va en las macetas nuevas, ya con tierra
  // Todas las demás plantas van en las macetas nuevas, ya con tierra
  if (ESPECIES_NUEVAS.includes(id.replace("semillas-", ""))) return estado.tiendaAmpliada && maceta.extra === true && !maceta.sinTierra && !maceta.especie;
  return false;
}

// ¿En qué maceta se puede usar este objeto ahora mismo? (null = en ninguna)
function macetaParaSemilla(id) {
  return MACETAS.find((m) => macetaAcepta(m, id)) || null;
}

function necesitaAgua(maceta) {
  return maceta.etapa === "sed" || maceta.etapa === "marchita";
}

// La zona de cada maceta solo se puede usar cuando recibe una semilla o cuando la planta tiene sed
function actualizarZonas() {
  MACETAS.forEach((maceta) => {
    // La zona (maceta y planta) responde cuando llevas una semilla para ella o la planta pide agua
    const recibeSemilla = Boolean(estado.semillaSeleccionada) && macetaAcepta(maceta, estado.semillaSeleccionada);
    maceta.zona.disabled = !maceta.levantada || !(recibeSemilla || necesitaAgua(maceta));
    maceta.zona.classList.toggle("objetivo", recibeSemilla);
    maceta.zona.classList.toggle("vacia", !maceta.especie);   // vacía: la caja se ajusta solo a la maceta
  });
  actualizarLugares();
}

// Cambia la imagen de la planta, con un pequeño "pop"
function mostrarPlanta(maceta, etapa) {
  const especie = ESPECIES[maceta.especie];
  const lienzoEsp = (especie.lienzoEtapa && especie.lienzoEtapa[etapa]) || especie.lienzo;
  maceta.etapa = etapa;

  // Ubica la imagen para que su ancla quede sobre la base de la maceta
  const px = ESCALA_CQW * lienzoEsp.escala;
  maceta.planta.style.left = (maceta.x - lienzoEsp.anclaX * px).toFixed(2) + "cqw";
  maceta.planta.style.top = (maceta.y - lienzoEsp.anclaY * px).toFixed(2) + "cqw";
  maceta.planta.style.width = (lienzoEsp.ancho * px).toFixed(2) + "cqw";

  maceta.planta.src = especie.imagenes[etapa];
  maceta.planta.hidden = false;
  maceta.sprite.hidden = true;   // la imagen de la planta ya trae su propia maceta
  maceta.planta.classList.remove("cambia");
  void maceta.planta.offsetWidth; // reinicia la animación
  maceta.planta.classList.add("cambia");
}

function dibujarBarra(maceta) {
  const porcentaje = Math.round(maceta.progreso * 100);
  maceta.relleno.style.width = porcentaje + "%";
  maceta.barra.setAttribute("aria-valuenow", porcentaje);
  maceta.barra.classList.toggle("pausada", maceta.pausada);
}

// Reloj del crecimiento: avanza cada 0,1 segundos (se enciende una sola vez)
let ultimoTick = 0;
let relojEncendido = false;
function encenderReloj() {
  if (relojEncendido) return;
  relojEncendido = true;
  ultimoTick = performance.now();
  setInterval(avanzarCrecimiento, 100);
}

function avanzarCrecimiento() {
  const ahora = performance.now();
  const pasado = Math.min(ahora - ultimoTick, 500);
  ultimoTick = ahora;

  if (!guia.hidden) return; // mientras el pololo grande habla, las plantas esperan

  MACETAS.forEach((maceta) => {
    if (!maceta.especie) return;

    // Planta florecida: tras un buen rato se seca otra vez y hay que volver a regarla
    if (maceta.terminada) {
      if (maceta.etapa === "grande") {
        maceta.hastaMarchitar -= pasado;
        if (maceta.hastaMarchitar <= 0) marchitar(maceta);
      }
      return;
    }
    if (maceta.pausada) return;

    maceta.progreso = Math.min(1, maceta.progreso + pasado / CRECIMIENTO.duracion);
    dibujarBarra(maceta);

    if (maceta.progreso >= 1) {
      florecer(maceta);
    } else if (maceta.progreso >= CRECIMIENTO.etapaSed && !maceta.regada) {
      darSed(maceta);
    } else if (maceta.progreso >= CRECIMIENTO.etapaMediana && maceta.etapa === "pequena") {
      mostrarPlanta(maceta, "mediana");
    }
  });
}

// En las macetas nuevas la gota se pone justo encima de la punta de la planta (así no tapa capullos ni flores)
function ubicarGota(maceta) {
  if (!maceta.extra) return;
  const lienzo = ESPECIES[maceta.especie].lienzo;
  if (lienzo.cimaSed === undefined) return;
  const px = ESCALA_CQW * lienzo.escala;
  const cima = maceta.y - (lienzo.anclaY - lienzo.cimaSed) * px;   // y de la punta de la planta, en cqw
  maceta.gota.style.top = Math.max(0.5, cima - 5.6).toFixed(2) + "cqw";
}

function darSed(maceta) {
  maceta.pausada = true;
  mostrarPlanta(maceta, "sed");
  ubicarGota(maceta);
  maceta.gota.hidden = false;
  dibujarBarra(maceta);
  actualizarZonas();

  // En el tutorial, el pololo vuelve a explicar el riego
  if (esDelTutorial(maceta)) {
    setTimeout(() => {
      iniciarSecuencia(PASOS_SED, () => {
        iniciarSecuencia(PASOS_REGAR, () => {
          iniciarSecuencia(PASOS_RECUPERADA, () => ponerMision("Espera a que florezca tu manzanilla"));
        });
      });
    }, 1200);
  }
}

function marchitar(maceta) {
  mostrarPlanta(maceta, "marchita");
  ubicarGota(maceta);
  maceta.gota.hidden = false;
  actualizarZonas();
}

function florecer(maceta) {
  maceta.terminada = true;
  maceta.hastaMarchitar = CRECIMIENTO.marchitarDespues;
  maceta.barra.hidden = true;   // ya no hace falta la barra de crecimiento
  mostrarPlanta(maceta, "grande");

  if (esDelTutorial(maceta)) {
    setTimeout(() => iniciarSecuencia(PASOS_FINAL, terminarTutorial), 1200);
  }

  // La primera rosa que florece atrae al abejorro colorado, unos segundos después
  if (maceta.especie === "rosa" && !estado.abejorroProgramado) {
    estado.abejorroProgramado = true;
    setTimeout(iniciarEventoAbejorro, ABEJORRO.esperaTrasFlor * 1000);
  }
}

// Para ajustar el tamaño de las "cajas de clic": abre el juego con ?cajas al final de la dirección
// (por ejemplo index.html?cajas) y verás las zonas marcadas en rojo.
if (/[?&]cajas\b/.test(window.location.search)) document.documentElement.classList.add("ver-cajas");

// Fin del tutorial: se desbloquea la rosa y el pololo pequeñito empieza a volar
function terminarTutorial() {
  estado.tutorialTerminado = true;
  activarEnciclopedia();
  descubrirInsecto("pololo");   // el pololo pequeñito es el primer insecto registrado
  mostrarMisionLibre();
  actualizarTienda();
  avisarTiendaNueva();   // la rosa ya se puede comprar
  aplicarEstadoSlots();
  iniciarVueloLibre();
}

// ---------- Semillas: clic en la semilla y clic en la maceta ----------
// Igual que la esponja y la regadera: se elige con un clic y se usa con otro clic.

function moverObjeto(elemento, evento) {
  const caja = escena.getBoundingClientRect();
  elemento.style.left = (evento.clientX - caja.left) + "px";
  elemento.style.top = (evento.clientY - caja.top) + "px";
}

// Si la imagen del objeto no cargó, se deja el cursor normal para no quedarse sin puntero
function imagenLista(imagen) {
  return imagen.complete && imagen.naturalWidth > 0;
}

function actualizarModoObjeto() {
  const conSemilla = Boolean(estado.semillaSeleccionada) && imagenLista(semillaArrastre);
  const conRegadera = estado.regaderaSeleccionada && imagenLista(regaderaCursor);
  escena.classList.toggle("modo-objeto", conSemilla || conRegadera);
}

// Toma una semilla "en la mano" (o la suelta si id es null)
function seleccionarSemilla(id) {
  if (id && estado.regaderaSeleccionada) seleccionarRegadera(false);
  estado.semillaSeleccionada = id;
  if (id) {
    const producto = PRODUCTOS.find((p) => p.id === id);
    if (producto) semillaArrastre.src = producto.imagen;
    quitarResaltado();
  } else {
    semillaArrastre.hidden = true;
  }
  actualizarModoObjeto();
  aplicarEstadoSlots();
}

barraObjetos.addEventListener("click", (evento) => {
  const slot = evento.target.closest('.slot-dinamico[id^="slot-semillas-"], #slot-maceta-terracota, #slot-saco-tierra');
  if (!slot || slot.disabled) return;
  const id = slot.id.replace("slot-", "");
  seleccionarSemilla(estado.semillaSeleccionada === id ? null : id);
});

function plantar(maceta, semillaId) {
  if (!macetaAcepta(maceta, semillaId)) return;

  // Se gasta una semilla
  seleccionarSemilla(null);
  if (maceta === MACETAS[0]) estado.puedePlantar = false;
  estado.inventario[semillaId] = Math.max(0, (estado.inventario[semillaId] || 0) - 1);

  maceta.especie = semillaId.replace("semillas-", "");
  estado.plantasPlantadas++;
  if (estado.plantasPlantadas === 3) setTimeout(iniciarEventoChinita, CHINITA.esperaTrasPlantar * 1000);   // la 3ª planta atrae a la chinita
  if (!estado.especiesPlantadas.includes(maceta.especie)) estado.especiesPlantadas.push(maceta.especie);
  maceta.progreso = 0;
  maceta.pausada = false;
  maceta.regada = false;
  maceta.terminada = false;
  mostrarPlanta(maceta, ESPECIES[maceta.especie].etapaInicial);
  maceta.barra.hidden = false;
  dibujarBarra(maceta);
  encenderReloj();
  dibujarInventario();

  revisarMisiones();
  if (maceta === MACETAS[0] && esperaActual === "plantar") avanzar();
}

// ---------- Regadera ----------
// Tomarla de la mesa
zonaRegadera.addEventListener("click", () => {
  if (estado.regaderaEnInventario) return;
  estado.regaderaEnInventario = true;
  zonaRegadera.hidden = true;
  zonaRegadera.disabled = true;
  estado.inventario["regadera"] = 1;
  dibujarInventario();
  if (esperaActual === "tomar-regadera") avanzar();
});

function seleccionarRegadera(activa) {
  if (activa && estado.semillaSeleccionada) seleccionarSemilla(null);
  estado.regaderaSeleccionada = activa;
  regaderaCursor.hidden = !activa;
  actualizarModoObjeto();
  aplicarEstadoSlots();
  if (activa) quitarResaltado();
}

// Clic en la casilla de la regadera
barraObjetos.addEventListener("click", (evento) => {
  const slot = evento.target.closest("#slot-regadera");
  if (!slot || slot.disabled) return;
  seleccionarRegadera(!estado.regaderaSeleccionada);
});

// La regadera sigue al mouse dentro de la escena
escena.addEventListener("pointermove", (evento) => {
  if (estado.regaderaSeleccionada && !regando) {
    regaderaCursor.hidden = false;
    moverObjeto(regaderaCursor, evento);
  }
  if (estado.semillaSeleccionada) {
    semillaArrastre.hidden = false;
    moverObjeto(semillaArrastre, evento);
  }
});

escena.addEventListener("pointerleave", () => {
  if (!regando) regaderaCursor.hidden = true;
  semillaArrastre.hidden = true;
});

// Esc guarda la regadera
document.addEventListener("keydown", (evento) => {
  if (evento.key !== "Escape") return;
  if (regando) return;
  if (estado.regaderaSeleccionada) seleccionarRegadera(false);
  if (estado.semillaSeleccionada) seleccionarSemilla(null);
});

// Clic sobre la maceta o la planta: llena con tierra, planta la semilla que llevas o riega con la regadera
function conectarZona(maceta) {
  maceta.zona.addEventListener("click", () => {
    const objeto = estado.semillaSeleccionada;
    if (objeto === "saco-tierra" && macetaAcepta(maceta, objeto)) llenarConTierra(maceta);
    else if (objeto && macetaAcepta(maceta, objeto)) plantar(maceta, objeto);
    else if (estado.regaderaSeleccionada && necesitaAgua(maceta)) regarConAnimacion(maceta);
  });
}
MACETAS.forEach(conectarZona);

// ---------- Macetas nuevas: comprar la maceta, ponerla en el piso, llenarla de tierra ----------
const lugaresMacetas = LUGARES_MACETAS.map((lugar) => {
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "lugar-maceta";
  boton.hidden = true;
  boton.setAttribute("aria-label", "Poner la maceta aquí");
  boton.style.setProperty("--mx", lugar.x);
  boton.style.setProperty("--my", lugar.y);
  boton.addEventListener("click", () => colocarMaceta(lugar));
  lugar.boton = boton;
  lugar.ocupado = false;
  return lugar;
});
document.getElementById("icono-gota-izq").after(...lugaresMacetas.map((l) => l.boton));

function hayLugarLibre() {
  return lugaresMacetas.some((l) => !l.ocupado);
}

// Los lugares libres se marcan solo mientras llevas una maceta en la mano
function actualizarLugares() {
  const conMaceta = estado.semillaSeleccionada === "maceta-terracota";
  lugaresMacetas.forEach((l) => { l.boton.hidden = !(conMaceta && !l.ocupado); });
}

function crearMacetaNueva(lugar) {
  const numero = MACETAS.length - 1;
  const fijar = (el) => { el.style.setProperty("--mx", lugar.x); el.style.setProperty("--my", lugar.y); return el; };

  const sombra = fijar(elemento("span", "maceta-sombra maceta-nueva-sombra"));
  sombra.setAttribute("aria-hidden", "true");

  const sprite = fijar(elemento("button", "maceta-sprite maceta-nueva"));
  sprite.type = "button";
  sprite.disabled = true;
  sprite.setAttribute("aria-label", "Maceta nueva");
  const imagenMaceta = document.createElement("img");
  imagenMaceta.src = "assets/plantas/maceta-sin-tierra.png";
  imagenMaceta.alt = "";
  imagenMaceta.draggable = false;
  sprite.appendChild(imagenMaceta);

  const planta = fijar(elemento("img", "planta"));
  planta.alt = "";
  planta.hidden = true;

  const zona = fijar(elemento("button", "zona-maceta zona-nueva vacia"));
  zona.type = "button";
  zona.disabled = true;
  zona.setAttribute("aria-label", "Maceta nueva " + numero);

  const relleno = elemento("div", "barra-relleno");
  const barra = fijar(elemento("div", "barra-crecimiento barra-nueva"));
  barra.setAttribute("role", "progressbar");
  barra.setAttribute("aria-label", "Crecimiento de la planta");
  barra.setAttribute("aria-valuemin", "0");
  barra.setAttribute("aria-valuemax", "100");
  barra.setAttribute("aria-valuenow", "0");
  barra.hidden = true;
  barra.appendChild(relleno);

  const gota = fijar(elemento("img", "icono-gota gota-nueva"));
  gota.src = "assets/plantas/icono-gota.png";
  gota.alt = "La planta tiene sed";
  gota.hidden = true;

  // Sombra, maceta y planta van dentro del fondo (se desenfocan con él); lo demás, sobre la escena
  document.getElementById("escena-fondo").append(sombra, sprite, planta);
  document.getElementById("icono-gota-izq").after(zona, barra, gota);

  const maceta = {
    nombre: "nueva-" + numero, x: lugar.x, y: lugar.y,
    sprite, sombra, zona, planta, barra, relleno, gota,
    extra: true,          // maceta comprada (no es una de las dos del tutorial)
    sinTierra: true,      // hay que llenarla con un saco de tierra
    levantada: true,
    especie: null, etapa: "ninguna", progreso: 0,
    pausada: false, regada: false, terminada: false
  };
  MACETAS.push(maceta);
  conectarZona(maceta);
  return maceta;
}

function colocarMaceta(lugar) {
  if (lugar.ocupado || estado.semillaSeleccionada !== "maceta-terracota") return;
  lugar.ocupado = true;
  estado.macetasColocadas++;
  estado.inventario["maceta-terracota"] = Math.max(0, (estado.inventario["maceta-terracota"] || 0) - 1);
  const maceta = crearMacetaNueva(lugar);
  maceta.sprite.classList.add("cayendo");
  setTimeout(() => maceta.sprite.classList.remove("cayendo"), 700);
  sonarPlop();
  seleccionarSemilla(null);
  dibujarInventario();
}

function llenarConTierra(maceta) {
  if (!macetaAcepta(maceta, "saco-tierra")) return;
  maceta.sinTierra = false;
  estado.inventario["saco-tierra"] = Math.max(0, (estado.inventario["saco-tierra"] || 0) - 1);
  maceta.sprite.querySelector("img").src = "assets/plantas/maceta-vacia.png";
  maceta.sprite.classList.add("rellenando");
  setTimeout(() => maceta.sprite.classList.remove("rellenando"), 600);
  sonarPlop();
  seleccionarSemilla(null);
  dibujarInventario();
}

// La regadera se acomoda sobre la maceta, se inclina y suelta gotitas; después la planta recibe el agua
let regando = false;
const DURACION_RIEGO = 2300;   // milisegundos que dura la animación

function regarConAnimacion(maceta) {
  if (regando) return;
  regando = true;
  const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const caja = escena.getBoundingClientRect();
  const zona = maceta.zona.getBoundingClientRect();
  const ancho = caja.width * 0.09;   // ancho de la regadera mientras riega (igual que en el CSS)

  // 1) Se coloca arriba de la planta, con el pico mirando hacia ella
  regaderaCursor.hidden = false;
  regaderaCursor.classList.add("regando");
  const centroX = zona.left - caja.left + zona.width * 0.5;
  const arriba = zona.top - caja.top + zona.height * 0.03;
  regaderaCursor.style.left = (centroX - ancho * 0.54) + "px";
  regaderaCursor.style.top = arriba + "px";

  // 2) Se inclina y suena el agua
  setTimeout(() => {
    regaderaCursor.classList.add("inclinada");
    sonarRegar();
    if (reducir) return;
    const gotas = document.createElement("div");
    gotas.className = "gotas-riego";
    gotas.style.left = centroX + "px";
    gotas.style.top = (arriba + ancho * 0.04) + "px";
    gotas.style.setProperty("--caida", (zona.height * 0.5) + "px");
    for (let i = 0; i < 9; i++) {
      const gota = document.createElement("span");
      gota.style.setProperty("--retraso", (i * 0.12) + "s");
      gota.style.setProperty("--desvio", ((i % 3) - 1) * 0.6 + "cqw");
      gotas.appendChild(gota);
    }
    escena.appendChild(gotas);
    setTimeout(() => gotas.remove(), DURACION_RIEGO);
  }, reducir ? 0 : 450);

  // 3) La planta recibe el agua
  setTimeout(() => {
    regaderaCursor.classList.remove("regando", "inclinada");
    regaderaCursor.style.left = "";
    regaderaCursor.style.top = "";
    regando = false;
    regar(maceta);
  }, reducir ? 900 : DURACION_RIEGO);
}

function regar(maceta) {
  const eraResecaDeNuevo = maceta.terminada;   // true = ya había florecido y se volvió a secar
  maceta.regada = true;
  maceta.pausada = false;
  seleccionarRegadera(false);
  maceta.gota.hidden = true;

  if (eraResecaDeNuevo) {
    maceta.hastaMarchitar = CRECIMIENTO.marchitarDespues;
    mostrarPlanta(maceta, "grande");
  } else {
    // Tras regar vuelve a crecer: usa la etapa "crecida" si la planta la tiene
    mostrarPlanta(maceta, ESPECIES[maceta.especie].imagenes.crecida ? "crecida" : "mediana");
    dibujarBarra(maceta);
  }

  const ganancia = recompensaDeRiego(maceta.especie);
  if (ganancia > 0) {
    estado.monedas += ganancia;
    mostrarMonedas();
    mostrarGanancia(maceta, ganancia);
  }

  actualizarZonas();
  if (maceta === MACETAS[0] && esperaActual === "regar") avanzar();
}

// ---------- Pololo pequeñito volando por la terraza ----------
// Vuela de lado a lado como en una pecera: sale por un borde de la pantalla,
// descansa fuera de vista un rato y vuelve a entrar por el borde contrario.
const poloVuelo = document.getElementById("pololo-vuelo");
const poloVueloVoltea = document.getElementById("vuelo-voltea");

// Ajustes que puedes cambiar (las distancias están en "cqw": la escena mide 100 de ancho y unos 56 de alto)
const VUELO = {
  velocidad: 6,        // qué tan rápido avanza (más alto = más rápido)
  alturaMin: 14,       // altura más alta a la que vuela (0 = arriba de todo)
  alturaMax: 38,       // altura más baja a la que vuela
  ondulacion: 4.5,     // cuánto sube y baja mientras avanza
  periodo: 7,          // segundos que tarda en hacer una subida y una bajada
  descansoMin: 3,      // segundos mínimos fuera de la pantalla antes de volver
  descansoMax: 8,      // segundos máximos fuera de la pantalla
  margen: 9,           // qué tanto sale de la pantalla antes de desaparecer
  cambioDeSentido: 0.35, // probabilidad (0 a 1) de que la próxima pasada sea en sentido contrario
  paradaProb: 0.2,     // probabilidad (0 a 1) de que en una pasada se detenga a mostrarse de frente
  paradaMin: 3,        // segundos mínimos que se queda quieto de frente
  paradaMax: 5         // segundos máximos
};

const prefiereQuietud = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const vuelo = {
  direccion: -1,       // -1 = va hacia la izquierda, 1 = va hacia la derecha
  x: 82,
  alturaBase: 26,
  fase: 0,
  tiempo: 0,
  descanso: 0,
  ultimo: 0,
  puntoParada: null,   // posición (en cqw) donde se detendrá en esta pasada, o null
  parada: 0            // segundos que le quedan detenido
};

function numeroEntre(minimo, maximo) {
  return minimo + Math.random() * (maximo - minimo);
}

function ponerPololo(x, y, angulo) {
  poloVuelo.style.transform =
    "translate(" + x.toFixed(2) + "cqw, " + y.toFixed(2) + "cqw) rotate(" + angulo.toFixed(1) + "deg)";
}

// Prepara una nueva pasada: normalmente entra por el borde contrario al que salió
function nuevaPasada() {
  // De vez en cuando cambia de sentido, para que no sea tan predecible
  if (Math.random() < VUELO.cambioDeSentido) vuelo.direccion *= -1;
  vuelo.alturaBase = numeroEntre(VUELO.alturaMin, VUELO.alturaMax);
  vuelo.fase = numeroEntre(0, Math.PI * 2);
  vuelo.tiempo = 0;
  vuelo.x = vuelo.direccion > 0 ? -VUELO.margen : 100 + VUELO.margen;
  vuelo.puntoParada = (!prefiereQuietud && Math.random() < VUELO.paradaProb) ? numeroEntre(22, 78) : null;
  // El dibujo mira hacia la derecha: si va hacia la izquierda, se da vuelta
  poloVueloVoltea.classList.toggle("izquierda", vuelo.direccion < 0);
}

function volarPololo(ahora) {
  requestAnimationFrame(volarPololo);
  const pasado = Math.min((ahora - vuelo.ultimo) / 1000, 0.1);
  vuelo.ultimo = ahora;

  // Descansando fuera de la pantalla
  if (vuelo.descanso > 0) {
    actualizarSonidoVuelo(null);
    vuelo.descanso -= pasado;
    if (vuelo.descanso <= 0) nuevaPasada();
    return;
  }

  vuelo.tiempo += pasado;
  if (vuelo.parada > 0) {
    // Detenido, mostrándose de frente
    vuelo.parada -= pasado;
    if (vuelo.parada <= 0) poloVuelo.classList.remove("de-frente");
  } else {
    vuelo.x += vuelo.direccion * VUELO.velocidad * pasado;
    const llego = vuelo.direccion > 0 ? vuelo.x >= vuelo.puntoParada : vuelo.x <= vuelo.puntoParada;
    if (vuelo.puntoParada !== null && llego) {
      vuelo.puntoParada = null;
      vuelo.parada = numeroEntre(VUELO.paradaMin, VUELO.paradaMax);
      poloVuelo.classList.add("de-frente");
    }
  }

  // Sube y baja suavemente mientras avanza
  const frecuencia = (Math.PI * 2) / VUELO.periodo;
  const y = vuelo.alturaBase + VUELO.ondulacion * Math.sin(frecuencia * vuelo.tiempo + vuelo.fase);
  const velocidadVertical = VUELO.ondulacion * frecuencia * Math.cos(frecuencia * vuelo.tiempo + vuelo.fase);

  // Inclina el cuerpo según suba o baje
  const pendiente = velocidadVertical / VUELO.velocidad;
  const angulo = vuelo.parada > 0 ? 0 : Math.max(-15, Math.min(15, vuelo.direccion * Math.atan(pendiente) * 180 / Math.PI));
  ponerPololo(vuelo.x, y, angulo);
  actualizarSonidoVuelo(vuelo.x);

  // Salió por un borde: descansa y volverá por el otro
  const salioDerecha = vuelo.direccion > 0 && vuelo.x > 100 + VUELO.margen;
  const salioIzquierda = vuelo.direccion < 0 && vuelo.x < -VUELO.margen;
  if (salioDerecha || salioIzquierda) {
    vuelo.descanso = numeroEntre(VUELO.descansoMin, VUELO.descansoMax);
  }
}

function iniciarVueloLibre() {
  poloVuelo.hidden = false;
  poloVueloVoltea.classList.toggle("izquierda", vuelo.direccion < 0);
  ponerPololo(vuelo.x, vuelo.alturaBase, 0);
  void poloVuelo.offsetWidth; // aplica la posición inicial antes de mostrarlo
  poloVuelo.classList.add("visible");

  // Si la persona prefiere menos movimiento, el pololo se queda quieto en su lugar
  if (prefiereQuietud) return;
  vuelo.ultimo = performance.now();
  requestAnimationFrame(volarPololo);
}


// ---------- Abejorro colorado ----------
// Al plantar la primera rosa: se oye un zumbido, el pololo avisa, el abejorro vuela escondido
// (se oye más fuerte cuanto más cerca) y por fin aparece volando. Hay que hacerle clic.
const abejorroEl = document.getElementById("abejorro-vuelo");
const abejorroVoltea = document.getElementById("abejorro-voltea");
const abejorroBoton = document.getElementById("abejorro-boton");

// Ajustes que puedes cambiar (distancias en cqw, tiempos en segundos)
const ABEJORRO = {
  velocidad: 5.5,        // qué tan rápido vuela (más alto = más rápido)
  alturaMin: 16,
  alturaMax: 34,
  ondulacion: 3.5,
  periodo: 6,
  margen: 11,            // qué tanto sale de la pantalla antes de desaparecer
  distanciaInicial: 80,  // desde qué tan lejos (fuera de la pantalla) empieza a acercarse
  volumenLejano: 0.2,    // volumen del zumbido cuando aún está muy lejos (0 a 1)
  esperaTrasFlor: 10,    // segundos entre que la rosa florece y empieza a oírse el zumbido
  esperaAviso: 3.5,      // segundos entre que empieza el zumbido y el aviso del pololo
  descansoMin: 2,
  descansoMax: 5,
  paradaProb: 0.2,       // probabilidad (0 a 1) de que en una pasada se detenga a mostrarse de frente
  paradaMin: 3,
  paradaMax: 5
};

const abejorro = {
  fase: "inactivo",      // inactivo, oculto, visible, charla, libre
  direccion: -1,
  x: 0,
  alturaBase: 24,
  fasePeriodo: 0,
  tiempo: 0,
  descanso: 0,
  ultimo: 0,
  puntoParada: null,
  parada: 0
};

function ponerAbejorro(x, y, angulo) {
  abejorroEl.style.transform =
    "translate(" + x.toFixed(2) + "cqw, " + y.toFixed(2) + "cqw) rotate(" + angulo.toFixed(1) + "deg)";
}

// Volumen del zumbido: 0 a 1 según qué tan cerca está
function sonarAbejorro(cercania) {
  if (!sonidoPermitido || cercania === null) {
    if (!sonidoAbejorro.paused) sonidoAbejorro.pause();
    return;
  }
  const volumen = Math.min(1, ajustes.volumenAleteo * GANANCIA_VUELO * cercania);
  sonidoAbejorro.volume = volumen;
  if (volumen > 0.003) {
    if (sonidoAbejorro.paused) sonidoAbejorro.play().catch(() => {});
  } else if (!sonidoAbejorro.paused) {
    sonidoAbejorro.pause();
  }
}

function cuandoGuiaLibre(accion) {
  if (guia.hidden) accion();
  else setTimeout(() => cuandoGuiaLibre(accion), 500);
}

// Cambia al pololo o al abejorro como quien habla en el globo de diálogo
const capasPololoOriginales = document.querySelector("#guia .guia-capas").innerHTML;
function ponerGuia(quien) {
  const capas = document.querySelector("#guia .guia-capas");
  const nombre = document.querySelector("#guia .globo-nombre");
  const esAbejorro = quien === "abejorro";
  const esChinita = quien === "chinita";
  guia.classList.toggle("es-abejorro", esAbejorro);
  guia.classList.toggle("es-chinita", esChinita);
  capas.classList.toggle("capas-abejorro", esAbejorro);
  capas.classList.toggle("capas-chinita", esChinita);
  nombre.textContent = esAbejorro ? "Abejorro colorado" : esChinita ? "Chinita chilena" : "Pololo verde";
  if (esAbejorro) capas.replaceChildren(...capasAbejorro());
  else if (esChinita) capas.replaceChildren(...capasChinita());
  else capas.innerHTML = capasPololoOriginales;
}

const PASOS_ZUMBIDO = [
  { texto: "¿Escuchaste eso?", desenfoque: false },
  { texto: "Es momento de prestarle atención a tu entorno.", desenfoque: false }
];

const PASOS_ABEJORRO = [
  { texto: "¡Wow, holaaa! ¡Qué lindo lugar! Me presento: soy el Abejorro colorado, el abejorro más grande del país." },
  { texto: "Actualmente estoy en peligro de extinción, así que te agradecería que cuidaras de mi especie." },
  { texto: "Me gustó tu terraza. Si no te molesta, me quedaré por aquí." }
];

function iniciarEventoAbejorro() {
  if (abejorro.fase !== "inactivo" || estado.abejorroListo) return;
  abejorro.fase = "oculto";
  // Entra por la derecha o por la izquierda, 50 y 50, para que no se sepa por dónde saldrá
  abejorro.direccion = Math.random() < 0.5 ? -1 : 1;
  abejorro.x = abejorro.direccion < 0
    ? 100 + ABEJORRO.margen + ABEJORRO.distanciaInicial
    : -ABEJORRO.margen - ABEJORRO.distanciaInicial;
  abejorro.alturaBase = numeroEntre(ABEJORRO.alturaMin, ABEJORRO.alturaMax);
  abejorro.fasePeriodo = numeroEntre(0, Math.PI * 2);
  abejorro.tiempo = 0;
  abejorroVoltea.classList.toggle("izquierda", abejorro.direccion < 0);
  abejorroEl.hidden = false;
  abejorro.ultimo = performance.now();
  requestAnimationFrame(volarAbejorro);

  // El pololo avisa un momento después de empezar a oírse el zumbido
  setTimeout(() => {
    cuandoGuiaLibre(() => {
      iniciarSecuencia(PASOS_ZUMBIDO, () => {
        ponerMision("Presta atención: ¿de dónde viene ese zumbido?");
      });
    });
  }, ABEJORRO.esperaAviso * 1000);
}

function mostrarAbejorro(clicable) {
  abejorroEl.classList.add("visible");
  abejorroEl.classList.toggle("clicable", clicable);
  abejorroBoton.disabled = !(clicable || abejorro.fase === "libre");
}

function volarAbejorro(ahora) {
  if (abejorro.fase === "inactivo") return;
  requestAnimationFrame(volarAbejorro);
  const pasado = Math.min((ahora - abejorro.ultimo) / 1000, 0.1);
  abejorro.ultimo = ahora;

  // Mientras charla con el jugador, se queda quieto (y casi no se oye)
  if (abejorro.fase === "charla") {
    sonarAbejorro(0.25);
    return;
  }

  // Para quien prefiere menos movimiento: el abejorro se queda parado en un lugar visible
  if (prefiereQuietud && (abejorro.fase === "visible" || abejorro.fase === "libre")) {
    ponerAbejorro(58, 22, 0);
    mostrarAbejorro(abejorro.fase === "visible");
    sonarAbejorro(0.4);
    return;
  }

  // Descansando fuera de la pantalla entre una pasada y otra
  if (abejorro.descanso > 0) {
    sonarAbejorro(null);
    abejorro.descanso -= pasado;
    if (abejorro.descanso <= 0) nuevaPasadaAbejorro();
    return;
  }

  // Cuánto ha entrado en la zona visible (negativo = todavía está fuera de la pantalla)
  const adentro = abejorro.direccion < 0 ? (100 + ABEJORRO.margen) - abejorro.x : abejorro.x + ABEJORRO.margen;
  const esperando = abejorro.fase === "oculto" && !guia.hidden && adentro > -25;
  if (abejorro.parada > 0) {
    // Detenido, mostrándose de frente
    abejorro.tiempo += pasado;
    abejorro.parada -= pasado;
    if (abejorro.parada <= 0) abejorroEl.classList.remove("de-frente");
  } else if (!esperando) {
    abejorro.tiempo += pasado;
    abejorro.x += abejorro.direccion * ABEJORRO.velocidad * pasado;
    if (abejorro.puntoParada !== null && abejorro.fase === "libre") {
      const llego = abejorro.direccion > 0 ? abejorro.x >= abejorro.puntoParada : abejorro.x <= abejorro.puntoParada;
      if (llego) {
        abejorro.puntoParada = null;
        abejorro.parada = numeroEntre(ABEJORRO.paradaMin, ABEJORRO.paradaMax);
        abejorroEl.classList.add("de-frente");
      }
    }
  }

  // Sube y baja suavemente, como el pololo
  const frecuencia = (Math.PI * 2) / ABEJORRO.periodo;
  const fase = frecuencia * abejorro.tiempo + abejorro.fasePeriodo;
  const y = abejorro.alturaBase + ABEJORRO.ondulacion * Math.sin(fase);
  const pendiente = ABEJORRO.ondulacion * frecuencia * Math.cos(fase) / ABEJORRO.velocidad;
  const angulo = abejorro.parada > 0 ? 0 : Math.max(-12, Math.min(12, abejorro.direccion * Math.atan(pendiente) * 180 / Math.PI));
  ponerAbejorro(abejorro.x, y, angulo);

  // Volumen según la distancia a la pantalla
  const fuera = abejorro.x < 0 ? -abejorro.x : (abejorro.x > 100 ? abejorro.x - 100 : 0);
  if (abejorro.fase === "oculto") {
    const lejos = Math.min(1, fuera / (ABEJORRO.margen + ABEJORRO.distanciaInicial));
    sonarAbejorro(ABEJORRO.volumenLejano + (1 - ABEJORRO.volumenLejano) * (1 - lejos));
  } else {
    sonarAbejorro(Math.max(0, 1 - fuera / ABEJORRO.margen));
  }

  // Llegó al borde de la pantalla: por fin aparece volando
  if (abejorro.fase === "oculto" && adentro >= 0) {
    abejorro.fase = "visible";
    mostrarAbejorro(true);
    ponerMision(null);   // sin pista: que la persona lo descubra sola
  }

  const salioDerecha = abejorro.direccion > 0 && abejorro.x > 100 + ABEJORRO.margen;
  const salioIzquierda = abejorro.direccion < 0 && abejorro.x < -ABEJORRO.margen;
  if ((abejorro.fase === "visible" || abejorro.fase === "libre") && (salioDerecha || salioIzquierda)) {
    abejorro.descanso = numeroEntre(ABEJORRO.descansoMin, ABEJORRO.descansoMax);
  }
}

function nuevaPasadaAbejorro() {
  if (Math.random() < 0.35) abejorro.direccion *= -1;
  abejorro.alturaBase = numeroEntre(ABEJORRO.alturaMin, ABEJORRO.alturaMax);
  abejorro.fasePeriodo = numeroEntre(0, Math.PI * 2);
  abejorro.tiempo = 0;
  abejorro.x = abejorro.direccion > 0 ? -ABEJORRO.margen : 100 + ABEJORRO.margen;
  abejorro.puntoParada = (abejorro.fase === "libre" && !prefiereQuietud && Math.random() < ABEJORRO.paradaProb) ? numeroEntre(22, 78) : null;
  abejorroVoltea.classList.toggle("izquierda", abejorro.direccion < 0);
  // Desde la segunda pasada vuelve a verse (ya fuera de la pantalla, sin saltos)
  if (abejorro.fase === "libre") mostrarAbejorro(false);
}

// Clic en el abejorro: sale de frente y se presenta
const sonidoAbejorroApretado = new Audio("assets/sonidos/abejorro-apretado.mp3");
sonidoAbejorroApretado.preload = "auto";
let temporizadorApreton2 = null;

abejorroBoton.addEventListener("click", () => {
  if (abejorro.fase === "libre") {
    // Ya es amigo: al hacerle clic se "aprieta" y suena
    sonidoAbejorroApretado.volume = ajustes.volumenBotones;
    sonidoAbejorroApretado.currentTime = 0;
    sonidoAbejorroApretado.play().catch(() => {});
    abejorroEl.classList.remove("apretado");
    void abejorroEl.offsetWidth;
    abejorroEl.classList.add("apretado");
    clearTimeout(temporizadorApreton2);
    temporizadorApreton2 = setTimeout(() => abejorroEl.classList.remove("apretado"), 450);
    return;
  }
  if (abejorro.fase !== "visible") return;
  abejorro.fase = "charla";
  abejorroEl.classList.remove("de-frente");
  abejorroEl.classList.add("sin-fade");   // desaparece de inmediato, sin atenuarse
  abejorroEl.classList.remove("visible", "clicable");
  abejorroBoton.disabled = true;
  abejorroEl.classList.remove("apretable");
  setTimeout(() => abejorroEl.classList.remove("sin-fade"), 100);
  quitarResaltado();
  ponerGuia("abejorro");
  ponerMision(null);
  iniciarSecuencia(PASOS_ABEJORRO, () => {
    ponerGuia("pololo");
    estado.abejorroListo = true;
    // Se queda por la terraza (ya no hay que hacerle clic)
    // (arranca fuera de la pantalla: no vuelve a verse en el lugar donde se quedó)
    abejorro.fase = "libre";
    abejorro.descanso = 2;
    abejorro.direccion = Math.random() < 0.5 ? -1 : 1;
    abejorroBoton.disabled = false;
    abejorroEl.classList.add("apretable");
    // El diario se ilumina: ahí aparece el nuevo descubrimiento
    descubrirInsecto("abejorro");
    objetivoDiarioActivo = true;
    ponerMision("Abre tu diario de campo: ¡hay un insecto nuevo!");
  });
});


// Cuando el pololo grande aparece a hablar, el pequeñito que vuela al fondo desaparece;
// al despedirse, el pequeñito vuelve a verse
function revisarPoloDelFondo() {
  poloEnGuia = !guia.hidden && !guia.classList.contains("es-abejorro") && !guia.classList.contains("es-chinita");
  poloVuelo.classList.toggle("oculto-guia", poloEnGuia);
}
new MutationObserver(revisarPoloDelFondo).observe(guia, { attributes: true, attributeFilter: ["hidden", "class"] });


// Versión "de frente" de cada volador: aparece cuando se detienen un momento a mostrarse
function crearFrenteVuelo(capas, claseExtra) {
  const caja = document.createElement("div");
  caja.className = "vuelo-frente";
  caja.setAttribute("aria-hidden", "true");
  const c = document.createElement("div");
  c.className = "guia-capas" + (claseExtra ? " " + claseExtra : "");
  c.append(...capas);
  caja.appendChild(c);
  return caja;
}
poloVuelo.appendChild(crearFrenteVuelo(
  [
    ["capa ala ala-izq", "assets/pololo/pololo-ala-izq.png"],
    ["capa ala ala-der", "assets/pololo/pololo-ala-der.png"],
    ["pololo-cuerpo", "assets/pololo/pololo-cuerpo.png"],
    ["capa parpados", "assets/pololo/pololo-parpados.png"]
  ].map(([clase, ruta]) => {
    const pieza = document.createElement("img");
    pieza.className = clase;
    pieza.src = ruta;
    pieza.alt = "";
    return pieza;
  })
));
abejorroEl.appendChild(crearFrenteVuelo(capasAbejorro(), "capas-abejorro"));


// ---------- Clic sobre el pololo volando: se "aprieta" y suena ----------
const sonidoPoloApretado = new Audio("assets/sonidos/pololo-apretado.mp3");
sonidoPoloApretado.preload = "auto";
let temporizadorApreton = null;

poloVuelo.addEventListener("click", () => {
  sonidoPoloApretado.volume = ajustes.volumenBotones;
  sonidoPoloApretado.currentTime = 0;
  sonidoPoloApretado.play().catch(() => {});
  // Reinicia la animación aunque se haga clic varias veces seguidas
  poloVuelo.classList.remove("apretado");
  void poloVuelo.offsetWidth;
  poloVuelo.classList.add("apretado");
  clearTimeout(temporizadorApreton);
  temporizadorApreton = setTimeout(() => poloVuelo.classList.remove("apretado"), 450);
});

// Un clic sobre la versión "de frente" del abejorro cuenta como clic en el abejorro
abejorroEl.querySelector(".vuelo-frente").addEventListener("click", () => abejorroBoton.click());


// ---------- Mini juego: círculos de luz mientras las plantas crecen ----------
// Aparece un círculo en el piso del balcón con un aro de luz que se va cerrando.
// Si haces clic justo cuando el aro llega al centro, a las plantas que están creciendo
// les faltan 1 segundo menos para terminar. De vez en cuando aparece una hojita: un clic = +1 BP.
const MINIJUEGO_ACTIVO = false;   // pásalo a true para probar el mini juego de círculos (aún en ideas)
const RITMO = {
  cadaMin: 1.8,        // segundos mínimos entre un círculo y el siguiente
  cadaMax: 3.2,        // segundos máximos
  duracionAro: 1.3,    // segundos que tarda el aro en llegar al centro (más alto = más fácil)
  margenAntes: 0.3,    // segundos antes del centro en que todavía vale el clic
  margenDespues: 0.2,  // segundos después del centro en que todavía vale el clic
  restaSegundos: 1,    // segundos que se restan al crecimiento por cada acierto
  probHoja: 0.12,      // probabilidad (0 a 1) de que en vez de un círculo salga una hojita de BP
  vidaHoja: 4.5,       // segundos que la hojita se queda en pantalla
  maxEnPantalla: 2,    // cuántos círculos pueden estar a la vez
  zona: { xMin: 22, xMax: 78, yMin: 35, yMax: 46 }   // dónde aparecen (en cqw)
};

let ritmoActivos = 0;
let ritmoPrimeraVez = true;   // la primera vez se muestra una pista

function ritmoPuedeJugar() {
  if (!MINIJUEGO_ACTIVO) return false;
  if (document.hidden || !estado.tutorialTerminado) return false;
  if (!guia.hidden || !tienda.hidden || !fichaCapa.hidden || !encicloPanel.hidden || !panelConfig.hidden) return false;
  if (escena.offsetParent === null) return false;
  return MACETAS.some(plantaCreciendo);
}

function plantaCreciendo(maceta) {
  return Boolean(maceta.especie) && !maceta.pausada && !maceta.terminada && maceta.progreso < 1;
}

function ritmoPosicion() {
  const z = RITMO.zona;
  return {
    x: z.xMin + Math.random() * (z.xMax - z.xMin),
    y: z.yMin + Math.random() * (z.yMax - z.yMin)
  };
}

function ritmoAviso(texto, x, y, clase) {
  const aviso = document.createElement("div");
  aviso.className = "ritmo-aviso " + (clase || "");
  aviso.textContent = texto;
  aviso.style.left = x + "cqw";
  aviso.style.top = (y - 6) + "cqw";
  escena.appendChild(aviso);
  setTimeout(() => aviso.remove(), 1200);
}

// Adelanta el crecimiento de todas las plantas que están creciendo
function adelantarCrecimiento(segundos) {
  const paso = (segundos * 1000) / CRECIMIENTO.duracion;
  MACETAS.forEach((maceta) => {
    if (!plantaCreciendo(maceta)) return;
    // Sin regar, nunca pasa de la etapa de sed (así no se salta el riego)
    const techo = maceta.regada ? 1 : CRECIMIENTO.etapaSed - 0.005;
    maceta.progreso = Math.min(techo, maceta.progreso + paso);
    dibujarBarra(maceta);
  });
}

function ritmoCrearCirculo() {
  const { x, y } = ritmoPosicion();
  const inicio = performance.now();
  const punto = document.createElement("button");
  punto.type = "button";
  punto.className = "ritmo-punto";
  punto.style.left = x + "cqw";
  punto.style.top = y + "cqw";
  punto.setAttribute("data-sin-clic", "");
  punto.setAttribute("aria-label", "Círculo de luz: haz clic cuando el aro llegue al centro");
  const aro = document.createElement("span");
  aro.className = "ritmo-aro";
  aro.style.animationDuration = RITMO.duracionAro + "s";
  punto.appendChild(aro);
  if (ritmoPrimeraVez) {
    const pista = document.createElement("span");
    pista.className = "ritmo-pista";
    pista.textContent = "Clic cuando el aro llegue al centro";
    punto.appendChild(pista);
  }
  escena.appendChild(punto);
  ritmoActivos++;

  let resuelto = false;
  const cerrar = (clase) => {
    if (resuelto) return;
    resuelto = true;
    ritmoActivos--;
    punto.classList.add(clase);
    setTimeout(() => punto.remove(), 450);
  };

  punto.addEventListener("click", () => {
    if (resuelto) return;
    const t = (performance.now() - inicio) / 1000;
    const bien = t >= RITMO.duracionAro - RITMO.margenAntes && t <= RITMO.duracionAro + RITMO.margenDespues;
    if (bien) {
      ritmoPrimeraVez = false;
      adelantarCrecimiento(RITMO.restaSegundos);
      sonarPlop();
      ritmoAviso("-" + RITMO.restaSegundos + " s", x, y, "bien");
      cerrar("acierto");
    } else {
      cerrar("fallo");
    }
  });
  setTimeout(() => cerrar("fallo"), (RITMO.duracionAro + RITMO.margenDespues + 0.15) * 1000);
}

function ritmoCrearHoja() {
  const { x, y } = ritmoPosicion();
  const hoja = document.createElement("button");
  hoja.type = "button";
  hoja.className = "ritmo-hoja";
  hoja.style.left = x + "cqw";
  hoja.style.top = y + "cqw";
  hoja.setAttribute("data-sin-clic", "");
  hoja.setAttribute("aria-label", "Hojita de BichiPesos: haz clic para ganar 1 BP");
  hoja.innerHTML = '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M6 34C6 16 16 6 34 6c0 18-10 28-28 28Z" fill="#8DAD4E" stroke="#36600C" stroke-width="2.5" stroke-linejoin="round"/><path d="M8 32C16 24 22 18 30 10" fill="none" stroke="#36600C" stroke-width="2.5" stroke-linecap="round"/></svg><span>+1</span>';
  escena.appendChild(hoja);
  ritmoActivos++;
  let resuelta = false;
  const cerrar = (clase) => {
    if (resuelta) return;
    resuelta = true;
    ritmoActivos--;
    hoja.classList.add(clase);
    setTimeout(() => hoja.remove(), 450);
  };
  hoja.addEventListener("click", () => {
    if (resuelta) return;
    estado.monedas += 1;
    mostrarMonedas();
    animarSaldo(1);
    sonarPlop();
    cerrar("acierto");
  });
  setTimeout(() => cerrar("fallo"), RITMO.vidaHoja * 1000);
}

function ritmoSiguiente() {
  if (ritmoPuedeJugar() && ritmoActivos < RITMO.maxEnPantalla) {
    if (Math.random() < RITMO.probHoja) ritmoCrearHoja();
    else ritmoCrearCirculo();
  }
  const espera = RITMO.cadaMin + Math.random() * (RITMO.cadaMax - RITMO.cadaMin);
  setTimeout(ritmoSiguiente, espera * 1000);
}
setTimeout(ritmoSiguiente, 4000);


// ---------- A veces, un insecto apretado suelta 1 BP ----------
const PROB_BP_INSECTO = 0.005;  // probabilidad (0 a 1) de que un clic sobre un insecto suelte 1 BP (0.005 = 0,5%)

function soltarBPDesde(elemento) {
  if (!estado.tutorialTerminado || Math.random() >= PROB_BP_INSECTO) return;
  const r = elemento.getBoundingClientRect();
  const e = escena.getBoundingClientRect();
  const x = ((r.left + r.width / 2) - e.left) / e.width * 100;
  const y = ((r.top + r.height / 2) - e.top) / e.width * 100;
  const moneda = document.createElement("img");
  moneda.src = "assets/iconos/icono-bichipeso.png";
  moneda.alt = "";
  moneda.className = "bp-cae";
  moneda.style.left = x + "cqw";
  moneda.style.top = y + "cqw";
  escena.appendChild(moneda);
  setTimeout(() => moneda.remove(), 1300);
  ritmoAviso("+1 BP", x, y - 2, "bien");
  estado.monedas += 1;
  mostrarMonedas();
  animarSaldo(1);
}
poloVuelo.addEventListener("click", () => soltarBPDesde(poloVuelo));
abejorroBoton.addEventListener("click", () => { if (abejorro.fase === "libre") soltarBPDesde(abejorroEl); });

// ---------- Chinita chilena ----------
// Al plantar la tercera planta (cualquiera): se oye un zumbido suave, la chinita entra volando
// y aparece. Hay que hacerle clic para que se presente.
const chinitaEl = document.getElementById("chinita-vuelo");
const chinitaVoltea = document.getElementById("chinita-voltea");
const chinitaBoton = document.getElementById("chinita-boton");

// Ajustes que puedes cambiar (distancias en cqw, tiempos en segundos)
const CHINITA = {
  velocidad: 4.5,        // qué tan rápido vuela (más alto = más rápido)
  alturaMin: 20,
  alturaMax: 38,
  ondulacion: 3.5,
  periodo: 6,
  margen: 11,            // qué tanto sale de la pantalla antes de desaparecer
  distanciaInicial: 80,  // desde qué tan lejos (fuera de la pantalla) empieza a acercarse
  volumenLejano: 0.2,    // volumen del zumbido cuando aún está muy lejos (0 a 1)
  esperaTrasPlantar: 6,  // segundos entre que se planta la tercera planta y empieza a oírse su zumbido
  descansoMin: 2,
  descansoMax: 5,
  paradaProb: 0.2,       // probabilidad (0 a 1) de que en una pasada se detenga a mostrarse de frente
  paradaMin: 3,
  paradaMax: 5
};

const chinita = {
  fase: "inactivo",      // inactivo, oculto, visible, charla, libre
  direccion: -1,
  x: 0,
  alturaBase: 24,
  fasePeriodo: 0,
  tiempo: 0,
  descanso: 0,
  ultimo: 0,
  puntoParada: null,
  parada: 0
};

function ponerChinita(x, y, angulo) {
  chinitaEl.style.transform =
    "translate(" + x.toFixed(2) + "cqw, " + y.toFixed(2) + "cqw) rotate(" + angulo.toFixed(1) + "deg)";
}

// Volumen del zumbido: 0 a 1 según qué tan cerca está
function sonarChinita(cercania) {
  if (!sonidoPermitido || cercania === null) {
    if (!sonidoChinita.paused) sonidoChinita.pause();
    return;
  }
  const volumen = Math.min(1, ajustes.volumenAleteo * GANANCIA_CHINITA * cercania);
  sonidoChinita.volume = volumen;
  if (volumen > 0.003) {
    if (sonidoChinita.paused) sonidoChinita.play().catch(() => {});
  } else if (!sonidoChinita.paused) {
    sonidoChinita.pause();
  }
}

function mostrarChinita(clicable) {
  chinitaEl.classList.add("visible");
  chinitaEl.classList.toggle("clicable", clicable);
  chinitaBoton.disabled = !(clicable || chinita.fase === "libre");
}

function volarChinita(ahora) {
  if (chinita.fase === "inactivo") return;
  requestAnimationFrame(volarChinita);
  const pasado = Math.min((ahora - chinita.ultimo) / 1000, 0.1);
  chinita.ultimo = ahora;

  // Mientras charla con el jugador, se queda quieto (y casi no se oye)
  if (chinita.fase === "charla") {
    sonarChinita(0.25);
    return;
  }

  // Para quien prefiere menos movimiento: el chinita se queda parado en un lugar visible
  if (prefiereQuietud && (chinita.fase === "visible" || chinita.fase === "libre")) {
    ponerChinita(58, 22, 0);
    mostrarChinita(chinita.fase === "visible");
    sonarChinita(0.4);
    return;
  }

  // Descansando fuera de la pantalla entre una pasada y otra
  if (chinita.descanso > 0) {
    sonarChinita(null);
    chinita.descanso -= pasado;
    if (chinita.descanso <= 0) nuevaPasadaChinita();
    return;
  }

  // Cuánto ha entrado en la zona visible (negativo = todavía está fuera de la pantalla)
  const adentro = chinita.direccion < 0 ? (100 + CHINITA.margen) - chinita.x : chinita.x + CHINITA.margen;
  const esperando = chinita.fase === "oculto" && !guia.hidden && adentro > -25;
  if (chinita.parada > 0) {
    // Detenido, mostrándose de frente
    chinita.tiempo += pasado;
    chinita.parada -= pasado;
    if (chinita.parada <= 0) chinitaEl.classList.remove("de-frente");
  } else if (!esperando) {
    chinita.tiempo += pasado;
    chinita.x += chinita.direccion * CHINITA.velocidad * pasado;
    if (chinita.puntoParada !== null && chinita.fase === "libre") {
      const llego = chinita.direccion > 0 ? chinita.x >= chinita.puntoParada : chinita.x <= chinita.puntoParada;
      if (llego) {
        chinita.puntoParada = null;
        chinita.parada = numeroEntre(CHINITA.paradaMin, CHINITA.paradaMax);
        chinitaEl.classList.add("de-frente");
      }
    }
  }

  // Sube y baja suavemente, como el pololo
  const frecuencia = (Math.PI * 2) / CHINITA.periodo;
  const fase = frecuencia * chinita.tiempo + chinita.fasePeriodo;
  const y = chinita.alturaBase + CHINITA.ondulacion * Math.sin(fase);
  const pendiente = CHINITA.ondulacion * frecuencia * Math.cos(fase) / CHINITA.velocidad;
  const angulo = chinita.parada > 0 ? 0 : Math.max(-12, Math.min(12, chinita.direccion * Math.atan(pendiente) * 180 / Math.PI));
  ponerChinita(chinita.x, y, angulo);

  // Volumen según la distancia a la pantalla
  const fuera = chinita.x < 0 ? -chinita.x : (chinita.x > 100 ? chinita.x - 100 : 0);
  if (chinita.fase === "oculto") {
    const lejos = Math.min(1, fuera / (CHINITA.margen + CHINITA.distanciaInicial));
    sonarChinita(CHINITA.volumenLejano + (1 - CHINITA.volumenLejano) * (1 - lejos));
  } else {
    sonarChinita(Math.max(0, 1 - fuera / CHINITA.margen));
  }

  // Llegó al borde de la pantalla: por fin aparece volando
  if (chinita.fase === "oculto" && adentro >= 0) {
    chinita.fase = "visible";
    mostrarChinita(true);
    ponerMision(null);   // sin pista: que la persona lo descubra sola
  }

  const salioDerecha = chinita.direccion > 0 && chinita.x > 100 + CHINITA.margen;
  const salioIzquierda = chinita.direccion < 0 && chinita.x < -CHINITA.margen;
  if ((chinita.fase === "visible" || chinita.fase === "libre") && (salioDerecha || salioIzquierda)) {
    chinita.descanso = numeroEntre(CHINITA.descansoMin, CHINITA.descansoMax);
  }
}

function nuevaPasadaChinita() {
  if (Math.random() < 0.35) chinita.direccion *= -1;
  chinita.alturaBase = numeroEntre(CHINITA.alturaMin, CHINITA.alturaMax);
  chinita.fasePeriodo = numeroEntre(0, Math.PI * 2);
  chinita.tiempo = 0;
  chinita.x = chinita.direccion > 0 ? -CHINITA.margen : 100 + CHINITA.margen;
  chinita.puntoParada = (chinita.fase === "libre" && !prefiereQuietud && Math.random() < CHINITA.paradaProb) ? numeroEntre(22, 78) : null;
  chinitaVoltea.classList.toggle("izquierda", chinita.direccion < 0);
  // Desde la segunda pasada vuelve a verse (ya fuera de la pantalla, sin saltos)
  if (chinita.fase === "libre") mostrarChinita(false);
}

// La chinita llega sola: no hace falta que nadie la anuncie
const PASOS_CHINITA = [
  { texto: "¡Holi! Me descubriste en tu terraza, ¡muy bien! Tus flores son muy lindas..." },
  { texto: "Decidido, ¡aquí me quedaré!" }
];

function iniciarEventoChinita() {
  if (chinita.fase !== "inactivo" || estado.chinitaListo) return;
  chinita.fase = "oculto";
  chinita.direccion = Math.random() < 0.5 ? -1 : 1;
  chinita.x = chinita.direccion < 0
    ? 100 + CHINITA.margen + CHINITA.distanciaInicial
    : -CHINITA.margen - CHINITA.distanciaInicial;
  chinita.alturaBase = numeroEntre(CHINITA.alturaMin, CHINITA.alturaMax);
  chinita.fasePeriodo = numeroEntre(0, Math.PI * 2);
  chinita.tiempo = 0;
  chinitaVoltea.classList.toggle("izquierda", chinita.direccion < 0);
  chinitaEl.hidden = false;
  chinita.ultimo = performance.now();
  requestAnimationFrame(volarChinita);
}

// Clic sobre la chinita
const sonidoChinitaApretada = new Audio("assets/sonidos/chinita-apretada.mp3");
sonidoChinitaApretada.preload = "auto";
let temporizadorApreton3 = null;

chinitaBoton.addEventListener("click", () => {
  if (chinita.fase === "libre") {
    // Ya es amiga: al hacerle clic se "aprieta" y suena
    sonidoChinitaApretada.volume = ajustes.volumenBotones;
    sonidoChinitaApretada.currentTime = 0;
    sonidoChinitaApretada.play().catch(() => {});
    chinitaEl.classList.remove("apretado");
    void chinitaEl.offsetWidth;
    chinitaEl.classList.add("apretado");
    clearTimeout(temporizadorApreton3);
    temporizadorApreton3 = setTimeout(() => chinitaEl.classList.remove("apretado"), 450);
    soltarBPDesde(chinitaEl);
    return;
  }
  if (chinita.fase !== "visible") return;
  chinita.fase = "charla";
  chinitaEl.classList.remove("de-frente");
  chinitaEl.classList.add("sin-fade");
  chinitaEl.classList.remove("visible", "clicable");
  chinitaBoton.disabled = true;
  chinitaEl.classList.remove("apretable");
  setTimeout(() => chinitaEl.classList.remove("sin-fade"), 100);
  quitarResaltado();
  ponerGuia("chinita");
  iniciarSecuencia(PASOS_CHINITA, () => {
    ponerGuia("pololo");
    estado.chinitaListo = true;
    // Se queda por la terraza (arranca fuera de la pantalla)
    chinita.fase = "libre";
    chinita.descanso = 2;
    chinita.direccion = Math.random() < 0.5 ? -1 : 1;
    chinitaBoton.disabled = false;
    chinitaEl.classList.add("apretable");
    // El diario se ilumina: ahí aparece el nuevo descubrimiento
    descubrirInsecto("chinita");
  });
});

// Un clic sobre la versión "de frente" de la chinita cuenta como clic en la chinita
chinitaEl.appendChild(crearFrenteVuelo(capasChinita(), "capas-chinita"));
chinitaEl.querySelector(".vuelo-frente").addEventListener("click", () => chinitaBoton.click());
