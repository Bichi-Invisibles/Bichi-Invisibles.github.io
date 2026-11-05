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
  rosaComprada: false
};

function mostrarMonedas() {
  document.getElementById("saldo-cantidad").textContent = estado.monedas;
}

mostrarMonedas();

// ---------- Productos de la tienda ----------
// Para agregar un producto, copia una línea y cambia sus datos.
//  - disponible: true si ya se puede comprar
//  - disponibleSi: (opcional) función que dice cuándo se puede comprar; reemplaza a "disponible"
//  - etiquetaNo: (opcional) texto del botón cuando no se puede comprar
//  - Los precios son PROVISORIOS, excepto el de la manzanilla (2 BP)
const PRODUCTOS = [
  { id: "saco-tierra",         nombre: "Saco de tierra",       precio: 3,  tipo: "herramienta", imagen: "assets/tienda/saco-tierra.png",         disponible: false },
  { id: "maceta-terracota",    nombre: "Maceta de terracota",  precio: 4,  tipo: "herramienta", imagen: "assets/tienda/maceta-terracota.png",    disponible: false },
  { id: "maceta-ceramica",     nombre: "Maceta de cerámica",   precio: 6,  tipo: "herramienta", imagen: "assets/tienda/maceta-ceramica.png",     disponible: false },
  { id: "jardinera",           nombre: "Jardinera",            precio: 8,  tipo: "herramienta", imagen: "assets/tienda/jardinera.png",           disponible: false },
  { id: "jardinera-madera",    nombre: "Jardinera de madera",  precio: 10, tipo: "herramienta", imagen: "assets/tienda/jardinera-madera.png",    disponible: false },
  { id: "semillas-manzanilla", nombre: "Manzanilla",           precio: 2,  tipo: "semilla",     imagen: "assets/tienda/semillas-manzanilla.png", disponible: false,
    // Solo se compra durante el tutorial; después queda plantada en su maceta
    disponibleSi: () => !estado.tutorialTerminado, etiquetaNo: () => "Plantada" },
  { id: "semillas-rosa",       nombre: "Rosa",                 precio: 4,  tipo: "semilla",     imagen: "assets/tienda/semillas-rosa.png",       disponible: false,
    // Se desbloquea al terminar el tutorial y se compra una sola vez (hay una sola maceta libre)
    disponibleSi: () => estado.tutorialTerminado && !estado.rosaComprada,
    etiquetaNo: () => (estado.rosaComprada ? "Ya la tienes" : "Pronto") },
  { id: "semillas-calle-calle",nombre: "Calle-calle chilena",  precio: 5,  tipo: "semilla",     imagen: "assets/tienda/semillas-calle-calle.png",disponible: false },
  { id: "semillas-pasiflora",  nombre: "Pasiflora",            precio: 6,  tipo: "semilla",     imagen: "assets/tienda/semillas-pasiflora.png",  disponible: false },
  { id: "semillas-lirio",      nombre: "Lirio chileno",        precio: 8,  tipo: "semilla",     imagen: "assets/tienda/semillas-lirio.png",      disponible: false }
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
  "assets/plantas/rosa-mediana.png",
  "assets/plantas/rosa-sed.png",
  "assets/plantas/rosa-flor.png",
  "assets/enciclopedia/libro-abierto.png",
  "assets/enciclopedia/libro-cerrado.png",
  "assets/pololo/pololo-registro.png",
  "assets/plantas/rosa-marchita.png",
  "assets/plantas/manzanilla-marchita.png",
  "assets/plantas/maceta-vacia.png",
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

botonContinuar.addEventListener("click", () => {
  if (!casillaAcepto.checked) return;
  intro.classList.add("saliendo");
  setTimeout(() => {
    intro.hidden = true;
    portada.inert = false;
    document.getElementById("btn-config").inert = false;
    botonJugar.focus();
  }, 400);

  // Los navegadores solo dejan sonar música después de un clic: este es ese clic
  iniciarSonido();
});

// ---------- Sonido y configuración ----------
// Ajustes que puedes cambiar
const GANANCIA_MUSICA = 0.45;   // la música suena a este porcentaje del volumen general (0 a 1)
const GANANCIA_VUELO = 1;       // lo mismo para el zumbido del pololo
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
  sonidoClic.volume = ajustes.volumenBotones;
  sonidoClic.currentTime = 0;
  sonidoClic.play().catch(() => {});
});

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

function sonarBrillos() {
  if (ajustes.volumenBotones <= 0) return;
  sonidoBrillos.volume = ajustes.volumenBotones;
  sonidoBrillos.currentTime = 0;
  sonidoBrillos.play().catch(() => {});
}

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
function actualizarSonidoVuelo(x) {
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

// Si se cambia de pestaña, el sonido se pausa
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    musicaFondo.pause();
    sonidoVuelo.pause();
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
    animado: true,   // en la ficha se muestra con sus alas aleteando
    // Datos del "carnet". Los tiempos vienen de fuentes (INIA y otras); la duración exacta de la vida
    // del adulto no aparece en ellas, por eso se muestra la época en que se le ve volar.
    ficha: {
      nombre: "Pololo verde",
      otroNombre: "San Juan verde",
      nacionalidad: "Chilena",
      zona: "Del Biobío a Los Lagos",
      descripcion: "¡Un pequeño escarabajo de color verde brillante! De adulto come hojas; de larva vive bajo tierra y come raíces. Algunas aves también se lo comen.",
      tiempos: [
        { etiqueta: "Como larva", valor: "8 a 9 meses bajo tierra" },
        { etiqueta: "Como escarabajo", valor: "Se le ve volar de octubre a febrero" }
      ],
      sexo: {
        columnas: ["Macho", "Hembra"],
        filas: [
          { etiqueta: "Tibias delanteras", valores: ["Verdes", "Café"] },
          { etiqueta: "Uñas de las patas", valores: ["Una más larga", "Todas iguales"] },
          { etiqueta: "Primer tarsito", valores: ["Más corto", "Más largo"] },
          { etiqueta: "Tamaño", valores: ["Un poco menor", "Un poco mayor"] }
        ]
      }
    }
  }
};

const casillasVacias = () => new Array(CASILLAS_POR_PLANA * 2).fill(null);
const ENCICLOPEDIA = [
  { titulo: "Terraza", casillas: ["pololo", ...casillasVacias().slice(1)] },
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

function abrirFicha(id, botonOrigen) {
  const datos = INSECTOS[id];
  const ficha = datos.ficha;
  botonDeFicha = botonOrigen;

  // "Foto de carnet": el insecto (animado si tiene capas)
  fichaDibujo.replaceChildren();
  if (datos.animado) {
    fichaDibujo.appendChild(crearPololoAnimado());
  } else {
    const dibujo = document.createElement("img");
    dibujo.src = datos.imagen;
    dibujo.alt = datos.nombre;
    fichaDibujo.appendChild(dibujo);
  }

  // Debajo de la foto: tiempos de cada etapa
  const tiempos = document.getElementById("ficha-tiempos");
  tiempos.replaceChildren();
  ficha.tiempos.forEach((t) => tiempos.appendChild(campoCarnet(t.etiqueta, t.valor)));

  // Datos del carnet
  fichaTexto.replaceChildren();
  const cabecera = elemento("div", "carnet-cabecera");
  cabecera.append(elemento("span", "carnet-titulo", "Carnet de insecto"), elemento("span", "carnet-sub", "Enciclopedia de Bichi"));
  const nombre = campoCarnet("Nombre", ficha.nombre, "campo-nombre");
  nombre.querySelector(".campo-valor").id = "ficha-titulo";
  const fila1 = elemento("div", "campo-fila");
  fila1.append(nombre, campoCarnet("Otro nombre", ficha.otroNombre));
  const fila2 = elemento("div", "campo-fila");
  fila2.append(campoCarnet("Nacionalidad", ficha.nacionalidad), campoCarnet("¿Dónde vive?", ficha.zona));
  const descripcion = campoCarnet("Descripción", ficha.descripcion, "campo-descripcion");

  // Sexo: pequeña tabla macho / hembra
  const sexo = elemento("div", "campo campo-sexo");
  sexo.appendChild(elemento("span", "campo-etiqueta", "Sexo: cómo distinguirlos"));
  const tabla = elemento("table", "sexo-tabla");
  const encabezado = elemento("tr");
  encabezado.append(elemento("th"), ...ficha.sexo.columnas.map((c) => elemento("th", "", c)));
  tabla.appendChild(encabezado);
  ficha.sexo.filas.forEach((fila) => {
    const tr = elemento("tr");
    tr.append(elemento("th", "", fila.etiqueta), ...fila.valores.map((v) => elemento("td", "", v)));
    tabla.appendChild(tr);
  });
  sexo.appendChild(tabla);

  fichaTexto.append(cabecera, fila1, fila2, descripcion, sexo);
  fichaTexto.scrollTop = 0;
  fichaCapa.hidden = false;
  botonFichaCerrar.focus();
}

function cerrarFicha() {
  fichaCapa.hidden = true;
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
  botonEnciclo.setAttribute("aria-label", "Enciclopedia de insectos: ¡hay un insecto nuevo!");
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

function abrirEnciclo() {
  botonEnciclo.classList.remove("tintinea");
  botonEnciclo.setAttribute("aria-label", "Enciclopedia de insectos");
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
  botonEnciclo.setAttribute("aria-label", "Enciclopedia de insectos");
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
  { texto: "¡Oh, hola, y bienvenido a Bichi!" },
  { texto: "Yo soy San Juan verde, o para los amigos, Pololo verde. Habito aquí en Chile y…" },
  { texto: "Mmm… veo que observas el fondo. Sí, está un poco descuidado, y en esas telarañas ya no vive nadie.", desenfoque: false },
  { texto: "¿Te parece si arreglamos un poco?", desenfoque: false },
  { texto: "Antes de que se me olvide, te explicaré unas cositas muy importantes para hacer el cambio en este lugar." },
  { texto: "Al costado izquierdo tienes un menú con distintos íconos.", resalta: "menu-izq" },
  { texto: "El ícono de la H es para ir a la fabricación de tu hotel de insectos, pero eso lo veremos más adelante.", resalta: "menu-hotel" },
  { texto: "También tienes tu propia enciclopedia, donde podrás ver todos los insectos que encuentres durante tu experiencia.", resalta: "menu-enciclopedia" },
  { texto: "Y luego tenemos la tienda. En ella podrás comprar distintas herramientas y artículos para ir mejorando esta terraza, para que distintos insectos se acerquen aquí.", resalta: "menu-tienda" },
  { texto: "Pero… te preguntarás cómo comprar. Para eso tenemos los increíbles BichiPesos (BP). ¡Los conseguirás al regar tus plantas y al encontrar insectos nuevos!", resalta: "saldo" },
  { texto: "Pero, por el momento, ¡yo te daré 10 BP para que comencemos!", resalta: "saldo", regalo: 10 },
  { texto: "¿Ves esa esponja en tu inventario? ¡Utilicémosla para limpiar este lugar! Haz clic en ella y, con el clic presionado, muévela por la pantalla hasta limpiar todo.", desenfoque: false, resalta: "slot-esponja" }
];

// 2) Después de limpiar: el pololo muestra la tienda
const PASOS_DESPUES_DE_LIMPIAR = [
  { texto: "¡Buen trabajo! Ahora está mejor.", desenfoque: false },
  {
    texto: "Pero podría ser mucho mejor… ¡te mostraré la tienda!",
    resalta: "menu-tienda",
    espera: "abrir-tienda",
    alMostrar: () => { botonTienda.disabled = false; }
  }
];

// 3) Con la tienda abierta
const PASOS_EN_LA_TIENDA = [
  { texto: "¡Mira cuántas cosas! Aquí arriba están las herramientas y los materiales para mejorar tu terraza.", resalta: "tienda-herramientas", requiereTienda: true },
  { texto: "Y aquí abajo están las semillas. Cada planta puede atraer insectos distintos, ¡así que elige con cuidado!", resalta: "tienda-semillas", requiereTienda: true },
  { texto: "Cada cosa tiene su precio en BP. Si no te alcanzan, ¡tendrás que juntar más!", resalta: "saldo", requiereTienda: true },
  { texto: "Para empezar, compremos semillas de manzanilla. ¡Cuestan 2 BP!", resalta: "comprar-semillas-manzanilla", requiereTienda: true, espera: "comprar-manzanilla" }
];

// 4) Después de comprar la manzanilla
const PASOS_COMPRA_HECHA = [
  { texto: "¡Excelente! Mira cómo bajó tu saldo y cómo llegaron tus semillas al inventario.", resalta: "slot-semillas-manzanilla" }
];

// 5) Plantar: el jugador arrastra las semillas hasta la maceta de la derecha
const PASOS_PLANTAR = [
  {
    texto: "Ahora toma tus semillas del inventario, arrástralas hasta la maceta de la derecha y suéltalas ahí.",
    desenfoque: false,
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
  { texto: "¡Mira, ya brotó! Debajo de la maceta hay una barra que muestra cuánto le falta para crecer.", desenfoque: false, resalta: "barra-crecimiento" },
  { texto: "Te dejo mirando cómo crece. ¡Ya vuelvo!", desenfoque: false }
];

// 7) La planta tiene sed
const PASOS_SED = [
  { texto: "¡Oh, oh! ¿Ves esa gotita? Tu manzanilla tiene sed y dejó de crecer.", desenfoque: false, resalta: "icono-gota" },
  { texto: "Las plantas necesitan agua para crecer sanas. ¡Hay una regadera sobre la mesa de la derecha! Haz clic en ella para guardarla en tu inventario.",
    desenfoque: false,
    resalta: "zona-regadera",
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
    espera: "regar",
    alMostrar: () => {
      estado.regaderaUsable = true;
      aplicarEstadoSlots();
    }
  }
];

// 9) La planta se recupera
const PASOS_RECUPERADA = [
  { texto: "¡Funcionó! Tu manzanilla se recuperó y volvió a crecer. Además, regar te dio 1 BP: cada vez que riegues una planta recibirás la mitad de lo que costaron sus semillas.", desenfoque: false, resalta: "saldo" }
];

// 10) La manzanilla florece
const PASOS_FINAL = [
  { texto: "¡Mira esa manzanilla! Ya floreció gracias a tus cuidados.", desenfoque: false },
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
      : (producto.etiquetaNo ? producto.etiquetaNo() : "Pronto");
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

function abrirTienda() {
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
    slot.disabled = !macetaParaSemilla(slot.id.replace("slot-", ""));
  });

  const regadera = document.getElementById("slot-regadera");
  if (regadera) {
    regadera.disabled = !estado.regaderaUsable;
    regadera.classList.toggle("seleccionado", estado.regaderaSeleccionada);
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
  if (activa) quitarResaltado();
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
function comprobarLimpieza() {
  if (estado.limpiezaCompleta) return;
  if (cantidadLimpias / TOTAL_CELDAS >= META_LIMPIEZA) completarLimpieza();
}

function completarLimpieza() {
  if (estado.limpiezaCompleta) return;   // por si se llama dos veces
  estado.limpiezaCompleta = true;
  frotando = false;
  seleccionarEsponja(false);
  slotEsponja.disabled = true;
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

  // Después vuelve el pololo: felicita, muestra la tienda y guía la primera compra
  setTimeout(() => {
    iniciarSecuencia(PASOS_DESPUES_DE_LIMPIAR, () => {
      iniciarSecuencia(PASOS_EN_LA_TIENDA, () => {
        iniciarSecuencia(PASOS_COMPRA_HECHA, () => {
          iniciarSecuencia(PASOS_PLANTAR, () => {
            iniciarSecuencia(PASOS_PLANTADA);
          });
        });
      });
    });
  }, 2400);
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
    etapaInicial: "mediana",   // la rosa no tiene imagen de brote: parte en etapa mediana
    imagenes: {
      mediana: "assets/plantas/rosa-mediana.png",
      sed:     "assets/plantas/rosa-sed.png",
      grande:  "assets/plantas/rosa-flor.png",
      marchita: "assets/plantas/rosa-marchita.png"
    },
    lienzo: { ancho: 619, anclaX: 313.06, anclaY: 848.36, escala: 0.415 }
  }
};

// Las dos macetas del balcón. x e y son el punto de la base de cada maceta, en cqw
const MACETAS = [
  {
    nombre: "derecha", x: 86.54, y: 30.5,
    zona: document.getElementById("zona-maceta"),
    planta: document.getElementById("planta"),
    barra: document.getElementById("barra-crecimiento"),
    relleno: document.getElementById("barra-relleno"),
    gota: document.getElementById("icono-gota")
  },
  {
    nombre: "izquierda", x: 17.08, y: 30.5,
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
});

// Tiempos del crecimiento (PROVISORIOS, solo para probar; los puedes cambiar)
const CRECIMIENTO = {
  duracion: 24000,      // milisegundos desde que se planta hasta que florece (si nunca tuviera sed)
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

// ¿En qué maceta se puede plantar esta semilla ahora mismo? (null = en ninguna)
function macetaParaSemilla(semillaId) {
  if (semillaId === "semillas-manzanilla") {
    return estado.puedePlantar && !MACETAS[0].especie ? MACETAS[0] : null;
  }
  if (semillaId === "semillas-rosa") {
    return estado.tutorialTerminado && !MACETAS[1].especie ? MACETAS[1] : null;
  }
  return null;
}

function necesitaAgua(maceta) {
  return maceta.etapa === "sed" || maceta.etapa === "marchita";
}

// La zona de cada maceta solo se puede usar cuando recibe una semilla o cuando la planta tiene sed
function actualizarZonas() {
  MACETAS.forEach((maceta) => {
    const recibeSemilla = Object.keys(estado.inventario).some(
      (id) => (estado.inventario[id] || 0) > 0 && macetaParaSemilla(id) === maceta
    );
    maceta.zona.disabled = !(recibeSemilla || necesitaAgua(maceta));
  });
}

// Cambia la imagen de la planta, con un pequeño "pop"
function mostrarPlanta(maceta, etapa) {
  const especie = ESPECIES[maceta.especie];
  const lienzoEsp = especie.lienzo;
  maceta.etapa = etapa;

  // Ubica la imagen para que su ancla quede sobre la base de la maceta
  const px = ESCALA_CQW * lienzoEsp.escala;
  maceta.planta.style.left = (maceta.x - lienzoEsp.anclaX * px).toFixed(2) + "cqw";
  maceta.planta.style.top = (maceta.y - lienzoEsp.anclaY * px).toFixed(2) + "cqw";
  maceta.planta.style.width = (lienzoEsp.ancho * px).toFixed(2) + "cqw";

  maceta.planta.src = especie.imagenes[etapa];
  maceta.planta.hidden = false;
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

function darSed(maceta) {
  maceta.pausada = true;
  mostrarPlanta(maceta, "sed");
  maceta.gota.hidden = false;
  dibujarBarra(maceta);
  actualizarZonas();

  // En el tutorial, el pololo vuelve a explicar el riego
  if (esDelTutorial(maceta)) {
    setTimeout(() => {
      iniciarSecuencia(PASOS_SED, () => {
        iniciarSecuencia(PASOS_REGAR, () => {
          iniciarSecuencia(PASOS_RECUPERADA);
        });
      });
    }, 1200);
  }
}

function marchitar(maceta) {
  mostrarPlanta(maceta, "marchita");
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
}

// Fin del tutorial: se desbloquea la rosa y el pololo pequeñito empieza a volar
function terminarTutorial() {
  estado.tutorialTerminado = true;
  activarEnciclopedia();
  descubrirInsecto("pololo");   // el pololo pequeñito es el primer insecto registrado
  actualizarTienda();
  aplicarEstadoSlots();
  iniciarVueloLibre();
}

// ---------- Arrastrar las semillas hasta la maceta ----------
let arrastrandoSemilla = false;
let semillaActual = null;   // { id, maceta } de la semilla que se está arrastrando

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
  const conSemilla = arrastrandoSemilla && imagenLista(semillaArrastre);
  const conRegadera = estado.regaderaSeleccionada && imagenLista(regaderaCursor);
  escena.classList.toggle("modo-objeto", conSemilla || conRegadera);
}

// ¿El mouse está sobre la maceta? (con un poquito de margen para que sea fácil acertar)
function estaSobreMaceta(evento, maceta) {
  const caja = maceta.zona.getBoundingClientRect();
  const margen = caja.width * 0.2;
  return (
    evento.clientX >= caja.left - margen && evento.clientX <= caja.right + margen &&
    evento.clientY >= caja.top - margen && evento.clientY <= caja.bottom + margen
  );
}

barraObjetos.addEventListener("pointerdown", (evento) => {
  const slot = evento.target.closest('.slot-dinamico[id^="slot-semillas-"]');
  if (!slot || slot.disabled) return;

  const id = slot.id.replace("slot-", "");
  const maceta = macetaParaSemilla(id);
  if (!maceta) return;

  evento.preventDefault();
  arrastrandoSemilla = true;
  semillaActual = { id, maceta };
  slot.setPointerCapture(evento.pointerId);
  slot.classList.add("arrastrando");

  // La semilla que se arrastra es la misma que se ve en la casilla
  const producto = PRODUCTOS.find((p) => p.id === id);
  if (producto) semillaArrastre.src = producto.imagen;
  semillaArrastre.hidden = false;
  moverObjeto(semillaArrastre, evento);
  actualizarModoObjeto();
});

barraObjetos.addEventListener("pointermove", (evento) => {
  if (!arrastrandoSemilla) return;
  moverObjeto(semillaArrastre, evento);
  actualizarModoObjeto();
  semillaActual.maceta.zona.classList.toggle("sobre", estaSobreMaceta(evento, semillaActual.maceta));
});

function terminarArrastre(evento, cancelado) {
  if (!arrastrandoSemilla) return;
  const { id, maceta } = semillaActual;
  arrastrandoSemilla = false;
  semillaActual = null;
  semillaArrastre.hidden = true;
  maceta.zona.classList.remove("sobre");
  const slot = document.getElementById("slot-" + id);
  if (slot) slot.classList.remove("arrastrando");
  actualizarModoObjeto();

  // Si la soltó sobre la maceta, se planta; si no, la semilla vuelve al inventario
  if (!cancelado && estaSobreMaceta(evento, maceta)) plantar(maceta, id);
}

barraObjetos.addEventListener("pointerup", (evento) => terminarArrastre(evento, false));
barraObjetos.addEventListener("pointercancel", (evento) => terminarArrastre(evento, true));

function plantar(maceta, semillaId) {
  if (macetaParaSemilla(semillaId) !== maceta) return;

  // Se gasta una semilla
  if (maceta === MACETAS[0]) estado.puedePlantar = false;
  estado.inventario[semillaId] = Math.max(0, (estado.inventario[semillaId] || 0) - 1);

  maceta.especie = semillaId.replace("semillas-", "");
  maceta.progreso = 0;
  maceta.pausada = false;
  maceta.regada = false;
  maceta.terminada = false;
  mostrarPlanta(maceta, ESPECIES[maceta.especie].etapaInicial);
  maceta.barra.hidden = false;
  dibujarBarra(maceta);
  encenderReloj();
  dibujarInventario();

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
  estado.regaderaSeleccionada = activa;
  regaderaCursor.hidden = !activa;
  actualizarModoObjeto();
  aplicarEstadoSlots();
  if (activa) quitarResaltado();
}

// Clic en las casillas del inventario (regadera con mouse; semillas con teclado)
barraObjetos.addEventListener("click", (evento) => {
  const slot = evento.target.closest(".slot-dinamico");
  if (!slot || slot.disabled) return;

  if (slot.id === "slot-regadera") seleccionarRegadera(!estado.regaderaSeleccionada);

  // Con teclado (Enter o espacio) no se puede arrastrar: la semilla se planta directo
  if (slot.id.startsWith("slot-semillas-") && evento.detail === 0) {
    const id = slot.id.replace("slot-", "");
    const maceta = macetaParaSemilla(id);
    if (maceta) plantar(maceta, id);
  }
});

// La regadera sigue al mouse dentro de la escena
escena.addEventListener("pointermove", (evento) => {
  if (estado.regaderaSeleccionada) {
    regaderaCursor.hidden = false;
    moverObjeto(regaderaCursor, evento);
  }
});

escena.addEventListener("pointerleave", () => {
  regaderaCursor.hidden = true;
});

// Esc guarda la regadera
document.addEventListener("keydown", (evento) => {
  if (evento.key === "Escape" && estado.regaderaSeleccionada) seleccionarRegadera(false);
});

// Regar una planta: clic sobre su maceta con la regadera en la mano
MACETAS.forEach((maceta) => {
  maceta.zona.addEventListener("click", () => {
    if (estado.regaderaSeleccionada && necesitaAgua(maceta)) regar(maceta);
  });
});

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
    mostrarPlanta(maceta, "mediana");
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
  cambioDeSentido: 0.35 // probabilidad (0 a 1) de que la próxima pasada sea en sentido contrario
};

const prefiereQuietud = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const vuelo = {
  direccion: -1,       // -1 = va hacia la izquierda, 1 = va hacia la derecha
  x: 82,
  alturaBase: 26,
  fase: 0,
  tiempo: 0,
  descanso: 0,
  ultimo: 0
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
  vuelo.x += vuelo.direccion * VUELO.velocidad * pasado;

  // Sube y baja suavemente mientras avanza
  const frecuencia = (Math.PI * 2) / VUELO.periodo;
  const y = vuelo.alturaBase + VUELO.ondulacion * Math.sin(frecuencia * vuelo.tiempo + vuelo.fase);
  const velocidadVertical = VUELO.ondulacion * frecuencia * Math.cos(frecuencia * vuelo.tiempo + vuelo.fase);

  // Inclina el cuerpo según suba o baje
  const pendiente = velocidadVertical / VUELO.velocidad;
  const angulo = Math.max(-15, Math.min(15, vuelo.direccion * Math.atan(pendiente) * 180 / Math.PI));
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