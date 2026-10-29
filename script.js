// ---------- Estado del juego ----------
// Aquí guardamos todo lo que cambia durante la partida
const estado = {
  monedas: 0,
  regaloEntregado: false,
  esponjaSeleccionada: false,
  limpiezaCompleta: false,
  inventario: {}          // objetos comprados, por ejemplo: { "semillas-manzanilla": 1 }
};

function mostrarMonedas() {
  document.getElementById("saldo-cantidad").textContent = estado.monedas;
}

mostrarMonedas();

// ---------- Productos de la tienda ----------
// Para agregar un producto, copia una línea y cambia sus datos.
//  - disponible: true si ya se puede comprar (por ahora solo la manzanilla)
//  - Los precios son PROVISORIOS, excepto el de la manzanilla (2 BP)
const PRODUCTOS = [
  { id: "saco-tierra",         nombre: "Saco de tierra",       precio: 3,  tipo: "herramienta", imagen: "assets/tienda/saco-tierra.png",         disponible: false },
  { id: "maceta-terracota",    nombre: "Maceta de terracota",  precio: 4,  tipo: "herramienta", imagen: "assets/tienda/maceta-terracota.png",    disponible: false },
  { id: "maceta-ceramica",     nombre: "Maceta de cerámica",   precio: 6,  tipo: "herramienta", imagen: "assets/tienda/maceta-ceramica.png",     disponible: false },
  { id: "jardinera",           nombre: "Jardinera",            precio: 8,  tipo: "herramienta", imagen: "assets/tienda/jardinera.png",           disponible: false },
  { id: "jardinera-madera",    nombre: "Jardinera de madera",  precio: 10, tipo: "herramienta", imagen: "assets/tienda/jardinera-madera.png",    disponible: false },
  { id: "semillas-manzanilla", nombre: "Manzanilla",           precio: 2,  tipo: "semilla",     imagen: "assets/tienda/semillas-manzanilla.png", disponible: true  },
  { id: "semillas-rosa",       nombre: "Rosa",                 precio: 4,  tipo: "semilla",     imagen: "assets/tienda/semillas-rosa.png",       disponible: false },
  { id: "semillas-calle-calle",nombre: "Calle-calle chilena",  precio: 5,  tipo: "semilla",     imagen: "assets/tienda/semillas-calle-calle.png",disponible: false },
  { id: "semillas-pasiflora",  nombre: "Pasiflora",            precio: 6,  tipo: "semilla",     imagen: "assets/tienda/semillas-pasiflora.png",  disponible: false },
  { id: "semillas-lirio",      nombre: "Lirio chileno",        precio: 8,  tipo: "semilla",     imagen: "assets/tienda/semillas-lirio.png",      disponible: false }
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
botonBalcon.addEventListener("click", async () => {
  botonBalcon.disabled = true; // evita doble clic
  await irConCarga(niveles, partida, RECURSOS_JUEGO);
  botonBalcon.disabled = false;
  iniciarTutorial();
});

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

const guia = document.getElementById("guia");
const textoGlobo = document.getElementById("globo-texto");
const botonSiguiente = document.getElementById("btn-siguiente");

let secuencia = [];
let pasoActual = 0;
let alTerminarSecuencia = null;
let esperaActual = null;
let elementoResaltado = null;

// Quita el borde amarillo del elemento que estaba marcado
function quitarResaltado() {
  if (elementoResaltado) {
    elementoResaltado.classList.remove("resaltado");
    elementoResaltado = null;
  }
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
    elementoResaltado = document.getElementById(paso.resalta);
    if (elementoResaltado) elementoResaltado.classList.add("resaltado");
  }

  // Foco para quien use el teclado
  if (!botonSiguiente.hidden) {
    botonSiguiente.focus({ preventScroll: true });
  } else if (elementoResaltado && elementoResaltado.tagName === "BUTTON" && !elementoResaltado.disabled) {
    elementoResaltado.focus({ preventScroll: true });
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

// Crea la tarjeta de un producto
function crearTarjeta(producto) {
  const tarjeta = document.createElement("article");
  tarjeta.className = "producto" + (producto.disponible ? "" : " no-disponible");

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
  boton.textContent = producto.disponible ? "Comprar" : "Pronto";
  boton.disabled = !producto.disponible;
  boton.setAttribute(
    "aria-label",
    (producto.disponible ? "Comprar " : "No disponible aún: ") + producto.nombre
  );
  if (producto.disponible) boton.addEventListener("click", () => comprar(producto));

  tarjeta.append(foto, nombre, precio, boton);
  return tarjeta;
}

PRODUCTOS.forEach((producto) => {
  const lista = producto.tipo === "herramienta" ? listaHerramientas : listaSemillas;
  lista.appendChild(crearTarjeta(producto));
});

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
  if (estado.monedas < producto.precio) {
    avisoTienda.textContent = "Te faltan BP para comprar esto.";
    return;
  }

  estado.monedas -= producto.precio;
  mostrarMonedas();
  estado.inventario[producto.id] = (estado.inventario[producto.id] || 0) + 1;
  dibujarInventario();
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

  PRODUCTOS.forEach((producto) => {
    const cantidad = estado.inventario[producto.id] || 0;
    if (cantidad <= 0) return;

    const slot = document.createElement("button");
    slot.className = "slot slot-dinamico";
    slot.id = "slot-" + producto.id;
    slot.disabled = true; // todavía no se puede usar (se activa en la siguiente etapa)
    slot.setAttribute("aria-label", producto.nombre + ", cantidad " + cantidad);

    const imagen = document.createElement("img");
    imagen.src = producto.imagen;
    imagen.alt = "";
    imagen.onerror = () => imagen.remove();

    const numero = document.createElement("span");
    numero.className = "slot-cantidad";
    numero.textContent = cantidad;

    slot.append(imagen, numero);
    barraObjetos.appendChild(slot);
  });

  actualizarBarra();
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
  estado.limpiezaCompleta = true;
  frotando = false;
  seleccionarEsponja(false);
  slotEsponja.disabled = true;
  quitarResaltado();

  // La suciedad que queda se desvanece y se ve el balcón limpio
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
        iniciarSecuencia(PASOS_COMPRA_HECHA);
      });
    });
  }, 2400);
}