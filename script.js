// ---------- Estado del juego ----------
// Aquí guardaremos todo lo que cambia durante la partida
const estado = {
  monedas: 100
};

function mostrarMonedas() {
  document.getElementById("coins-amount").textContent = estado.monedas;
}

mostrarMonedas();

// ---------- Recursos que se precargan ----------
// Cuando tengas más imágenes, agrégalas aquí (una por línea, con coma al final)
const RECURSOS = [
  "assets/logo-bichi.png"
  // "assets/abeja/abeja-cuerpo.png",
  // "assets/iconos/icono-tienda.png",
];

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
const carga = document.getElementById("carga");
const juego = document.querySelector(".game");
const botonJugar = document.getElementById("btn-jugar");

// Play: portada -> carga -> juego
botonJugar.addEventListener("click", async () => {
  botonJugar.disabled = true; // evita doble clic
  portada.hidden = true;
  carga.hidden = false;

  // Esperamos las dos cosas: que carguen las imágenes y un mínimo de 1,2 segundos
  await Promise.all([
    Promise.all(RECURSOS.map(cargarImagen)),
    esperar(10000)
  ]);

  carga.hidden = true;
  juego.hidden = false;
});