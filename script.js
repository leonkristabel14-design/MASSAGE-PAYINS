// ==========================================
// CONFIGURACIÓN DE FIREBASE
// ==========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import {
    getAuth,
    signInAnonymously,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
    getDatabase,
    ref,
    push,
    onValue,
    remove
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";

// REEMPLAZA ESTOS DATOS CON LOS DE TU PROYECTO FIREBASE

const firebaseConfig = {
  apiKey: "AIzaSyDR-kkVSp0NI8V1m8Uv_yrSrsNZZ5D1SFc",
  authDomain: "massage-payins.firebaseapp.com",
  projectId: "massage-payins",
  storageBucket: "massage-payins.firebasestorage.app",
  messagingSenderId: "54703297379",
  appId: "1:54703297379:web:c3cedee40f05a4a2c4f956",
  measurementId: "G-G64YGV6DPY"
};

// PEGA AQUÍ EL UID DE TU DISPOSITIVO ADMINISTRADOR
// Primero déjalo vacío para obtener tu UID.
const UID_ADMINISTRADORA = "";


const aplicacion = initializeApp(firebaseConfig);
const autenticacion = getAuth(aplicacion);
const baseDatos = getDatabase(aplicacion);


const referenciaMovimientos = ref(baseDatos, "movimientos");

let usuarioActual = null;
let nombreActual = "";
let movimientos = [];
let serviciosCliente = [];
let personaEsAdministradora = false;
let detenerEscucha = null;

// ==========================================
// FUNCIONES GENERALES
// ==========================================

function dinero(cantidad) {
    return "$" + Number(cantidad || 0).toFixed(2);
}

function fechaLocal() {
    const fecha = new Date();

    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
}

function horaActual() {
    return new Date().toLocaleTimeString("es-SV", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });
}

function crearCelda(fila, contenido) {
    const celda = document.createElement("td");
    celda.textContent = contenido;
    fila.appendChild(celda);
    return celda;
}

function mostrarEstado(mensaje) {
    document.getElementById("estadoAcceso").textContent = mensaje;
}

// ==========================================
// INICIO DE SESIÓN ANÓNIMO
// ==========================================

onAuthStateChanged(autenticacion, async usuario => {
    if (!usuario) {
        try {
            mostrarEstado("Preparando acceso seguro...");
            await signInAnonymously(autenticacion);
        } catch (error) {
            mostrarEstado("No se pudo conectar. Revisa Firebase.");
            console.error(error);
        }

        return;
    }

    usuarioActual = usuario;

    document.getElementById("identificadorDispositivo").textContent =
        "UID de este dispositivo: " + usuario.uid;

    console.log("UID DE ESTE DISPOSITIVO:", usuario.uid);

    const nombreGuardado = localStorage.getItem("nombreMassagePayins");

    if (nombreGuardado === "PAPI" || nombreGuardado === "YANELLY") {
        entrarAlSistema(nombreGuardado);
    } else {
        mostrarEstado("Selecciona tu nombre para continuar.");
    }
});

// Seleccionar nombre
document.querySelectorAll(".boton-acceso").forEach(boton => {
    boton.addEventListener("click", () => {
        if (!usuarioActual) {
            mostrarEstado("Espera a que Firebase termine de conectar.");
            return;
        }

        const nombre = boton.dataset.nombre;

        localStorage.setItem("nombreMassagePayins", nombre);

        entrarAlSistema(nombre);
    });
});

function entrarAlSistema(nombre) {
    nombreActual = nombre;

    personaEsAdministradora =
        usuarioActual.uid === UID_ADMINISTRADORA &&
        UID_ADMINISTRADORA !== "";

    document.getElementById("pantallaAcceso").classList.add("oculto");

    document.getElementById("nombreUsuario").textContent =
        nombreActual + (personaEsAdministradora ? " | ADMINISTRADORA" : " | USUARIO");

    document.getElementById("personaIngreso").textContent = nombreActual;

    document.getElementById("cerrarSesion").classList.remove("oculto");

    if (detenerEscucha) {
        detenerEscucha();
    }

    escucharMovimientos();
}

// Cambiar el nombre visible
document.getElementById("cerrarSesion").addEventListener("click", () => {
    localStorage.removeItem("nombreMassagePayins");

    if (detenerEscucha) {
        detenerEscucha();
        detenerEscucha = null;
    }

    document.getElementById("pantallaAcceso").classList.remove("oculto");
    mostrarEstado("Selecciona tu nombre para continuar.");
});

// ==========================================
// ESCUCHAR Y SINCRONIZAR LOS MOVIMIENTOS
// ==========================================

function escucharMovimientos() {
    detenerEscucha = onValue(
        referenciaMovimientos,
        instantanea => {
            const datos = instantanea.val() || {};

            movimientos = Object.entries(datos).map(([id, movimiento]) => ({
                id,
                ...movimiento
            }));

            actualizarSistema();
        },
        error => {
            console.error(error);
            alert("No se pudieron cargar los movimientos. Revisa las reglas de Firebase.");
        }
    );
}

// ==========================================
// SELECCIONAR SERVICIOS
// ==========================================

document.querySelectorAll(".boton-servicio").forEach(boton => {
    boton.addEventListener("click", () => {
        const nombre = boton.dataset.servicio;
        const precio = Number(boton.dataset.precio);

        const posicion = serviciosCliente.findIndex(
            servicio => servicio.nombre === nombre
        );

        if (posicion >= 0) {
            serviciosCliente.splice(posicion, 1);
            boton.classList.remove("seleccionado");
        } else {
            serviciosCliente.push({ nombre, precio });
            boton.classList.add("seleccionado");
        }

        mostrarServicios();
        calcularTotal();
    });
});

// Agregar servicio personalizado
document.getElementById("agregarOtro").addEventListener("click", () => {
    const nombre = document.getElementById("otroNombre").value.trim();
    const precio = Number(document.getElementById("otroPrecio").value);

    if (!nombre || !Number.isFinite(precio) || precio <= 0) {
        alert("Escribe el nombre del servicio y un precio válido.");
        return;
    }

    serviciosCliente.push({ nombre, precio });

    document.getElementById("otroNombre").value = "";
    document.getElementById("otroPrecio").value = "";

    mostrarServicios();
    calcularTotal();
});

// Mostrar servicios seleccionados
function mostrarServicios() {
    const lista = document.getElementById("listaServicios");
    lista.innerHTML = "";

    if (serviciosCliente.length === 0) {
        const elemento = document.createElement("li");
        elemento.textContent = "No hay servicios seleccionados.";
        lista.appendChild(elemento);
        return;
    }

    serviciosCliente.forEach((servicio, indice) => {
        const elemento = document.createElement("li");

        const descripcion = document.createElement("span");
        descripcion.textContent =
            servicio.nombre + " - " + dinero(servicio.precio);

        const botonQuitar = document.createElement("button");
        botonQuitar.type = "button";
        botonQuitar.textContent = "Quitar";

        botonQuitar.addEventListener("click", () => {
            serviciosCliente.splice(indice, 1);

            document.querySelectorAll(".boton-servicio").forEach(boton => {
                if (boton.dataset.servicio === servicio.nombre) {
                    boton.classList.remove("seleccionado");
                }
            });

            mostrarServicios();
            calcularTotal();
        });

        elemento.append(descripcion, botonQuitar);
        lista.appendChild(elemento);
    });
}

// ==========================================
// CALCULAR COBRO
// ==========================================

function calcularTotal() {
    const subtotal = serviciosCliente.reduce(
        (suma, servicio) => suma + servicio.precio,
        0
    );

    const descuento = Math.max(
        0,
        Number(document.getElementById("descuento").value) || 0
    );

    const total = Math.max(0, subtotal - descuento);

    document.getElementById("subtotalCliente").textContent = dinero(subtotal);
    document.getElementById("totalConDescuento").textContent = dinero(total);
    document.getElementById("totalCobrar").value = total.toFixed(2);
}

document.getElementById("descuento").addEventListener("input", calcularTotal);

// ==========================================
// GUARDAR MOVIMIENTOS EN FIREBASE
// ==========================================

async function guardarMovimiento(movimiento) {
    try {
        await push(referenciaMovimientos, movimiento);
        return true;
    } catch (error) {
        console.error(error);
        alert("No se pudo guardar. Comprueba tu conexión y las reglas de Firebase.");
        return false;
    }
}

// Guardar ingreso
document.getElementById("guardarIngreso").addEventListener("click", async () => {
    if (!nombreActual) {
        alert("Primero debes seleccionar tu nombre.");
        return;
    }

    if (serviciosCliente.length === 0) {
        alert("Selecciona al menos un servicio.");
        return;
    }

    const fecha = document.getElementById("fechaIngreso").value;
    const total = Number(document.getElementById("totalCobrar").value);

    if (!fecha || !Number.isFinite(total) || total < 0) {
        alert("Revisa la fecha y el total cobrado.");
        return;
    }

    const subtotal = serviciosCliente.reduce(
        (suma, servicio) => suma + servicio.precio,
        0
    );

    const descuento = Math.max(
        0,
        Number(document.getElementById("descuento").value) || 0
    );

    const descripcion = serviciosCliente
        .map(servicio => servicio.nombre)
        .join(", ");

    const movimiento = {
        fecha,
        hora: horaActual(),
        concepto: descripcion +
            " | Subtotal: " + dinero(subtotal) +
            " | Descuento: " + dinero(descuento),
        ingreso: total,
        salida: 0,
        persona: nombreActual,
        uidRegistro: usuarioActual.uid
    };

    const guardado = await guardarMovimiento(movimiento);

    if (guardado) {
        serviciosCliente = [];

        document.querySelectorAll(".boton-servicio").forEach(boton => {
            boton.classList.remove("seleccionado");
        });

        document.getElementById("descuento").value = 0;
        document.getElementById("fechaIngreso").value = fechaLocal();

        mostrarServicios();
        calcularTotal();

        alert("Ingreso guardado y sincronizado.");
    }
});

// Guardar gasto
document.getElementById("formularioGasto").addEventListener("submit", async evento => {
    evento.preventDefault();

    const concepto = document.getElementById("conceptoGasto").value.trim();
    const cantidad = Number(document.getElementById("cantidadGasto").value);
    const fecha = document.getElementById("fechaGasto").value;

    if (!concepto || !Number.isFinite(cantidad) || cantidad <= 0 || !fecha) {
        alert("Completa correctamente todos los datos del gasto.");
        return;
    }

    const movimiento = {
        fecha,
        hora: horaActual(),
        concepto,
        ingreso: 0,
        salida: cantidad,
        persona: nombreActual,
        uidRegistro: usuarioActual.uid
    };

    const guardado = await guardarMovimiento(movimiento);

    if (guardado) {
        document.getElementById("formularioGasto").reset();
        document.getElementById("fechaGasto").value = fechaLocal();

        alert("Gasto guardado y sincronizado.");
    }
});

// ==========================================
// ELIMINAR UN MOVIMIENTO
// SOLO LA CUENTA ADMINISTRADORA
// ==========================================

async function eliminarMovimiento(id) {
    if (!personaEsAdministradora) {
        alert("No tienes permiso para eliminar movimientos.");
        return;
    }

    const confirmar = confirm(
        "¿Deseas eliminar este movimiento? Esta acción no se puede deshacer."
    );

    if (!confirmar) return;

    try {
        await remove(ref(baseDatos, "movimientos/" + id));
        alert("Movimiento eliminado.");
    } catch (error) {
        console.error(error);
        alert("Firebase rechazó la eliminación. Comprueba los permisos.");
    }
}

// ==========================================
// ACTUALIZAR TODO EL SISTEMA
// ==========================================

function actualizarSistema() {
    mostrarHistorial();
    mostrarResumenDiario();
    mostrarResumenMensual();
    actualizarTarjetas();
}

// Historial completo
function mostrarHistorial() {
    const tabla = document.getElementById("tablaMovimientos");
    tabla.innerHTML = "";

    const ordenados = [...movimientos].sort((a, b) => {
        return b.fecha.localeCompare(a.fecha) ||
            (b.hora || "").localeCompare(a.hora || "");
    });

    if (ordenados.length === 0) {
        const fila = document.createElement("tr");
        crearCelda(fila, "Todavía no hay movimientos registrados.");
        tabla.appendChild(fila);
        return;
    }

    ordenados.forEach(movimiento => {
        const fila = document.createElement("tr");

        crearCelda(fila, movimiento.fecha);
        crearCelda(fila, movimiento.hora || "No registrada");
        crearCelda(fila, movimiento.concepto);
        crearCelda(fila, dinero(movimiento.ingreso));
        crearCelda(fila, dinero(movimiento.salida));
        crearCelda(fila, movimiento.persona);

        const celdaAccion = document.createElement("td");

        if (personaEsAdministradora) {
            const boton = document.createElement("button");
            boton.className = "boton-eliminar";
            boton.textContent = "Eliminar";

            boton.addEventListener("click", () => {
                eliminarMovimiento(movimiento.id);
            });

            celdaAccion.appendChild(boton);
        } else {
            celdaAccion.textContent = "Sin permiso";
        }

        fila.appendChild(celdaAccion);
        tabla.appendChild(fila);
    });
}

// Resumen del mes actual
function actualizarTarjetas() {
    const mesActual = fechaLocal().slice(0, 7);

    const registrosMes = movimientos.filter(
        movimiento => movimiento.fecha.slice(0, 7) === mesActual
    );

    const ingresos = registrosMes.reduce(
        (suma, movimiento) => suma + Number(movimiento.ingreso || 0),
        0
    );

    const gastos = registrosMes.reduce(
        (suma, movimiento) => suma + Number(movimiento.salida || 0),
        0
    );

    document.getElementById("totalIngresos").textContent = dinero(ingresos);
    document.getElementById("totalSalidas").textContent = dinero(gastos);
    document.getElementById("totalGeneral").textContent = dinero(ingresos - gastos);
}

// Agrupar movimientos por día o mes
function agruparMovimientos(tipo) {
    const agrupados = {};

    movimientos.forEach(movimiento => {
        const clave = tipo === "dia"
            ? movimiento.fecha
            : movimiento.fecha.slice(0, 7);

        if (!agrupados[clave]) {
            agrupados[clave] = { ingresos: 0, gastos: 0 };
        }

        agrupados[clave].ingresos += Number(movimiento.ingreso || 0);
        agrupados[clave].gastos += Number(movimiento.salida || 0);
    });

    return agrupados;
}

// Resumen diario
function mostrarResumenDiario() {
    const tabla = document.getElementById("resumenDiario");
    tabla.innerHTML = "";

    const diarios = agruparMovimientos("dia");
    const fechas = Object.keys(diarios).sort().reverse();

    if (fechas.length === 0) {
        const fila = document.createElement("tr");
        crearCelda(fila, "No hay registros diarios.");
        tabla.appendChild(fila);
        return;
    }

    fechas.forEach(fecha => {
        const datos = diarios[fecha];
        const fila = document.createElement("tr");

        crearCelda(fila, fecha);
        crearCelda(fila, dinero(datos.ingresos));
        crearCelda(fila, dinero(datos.gastos));
        crearCelda(fila, dinero(datos.ingresos - datos.gastos));

        tabla.appendChild(fila);
    });
}

// Resumen mensual
function mostrarResumenMensual() {
    const tabla = document.getElementById("resumenMensual");
    tabla.innerHTML = "";

    const mensuales = agruparMovimientos("mes");
    const meses = Object.keys(mensuales).sort().reverse();

    if (meses.length === 0) {
        const fila = document.createElement("tr");
        crearCelda(fila, "No hay registros mensuales.");
        tabla.appendChild(fila);
    }

    meses.forEach(mes => {
        const datos = mensuales[mes];
        const [anio, numeroMes] = mes.split("-");

        const nombreMes = new Date(
            Number(anio),
            Number(numeroMes) - 1,
            1
        ).toLocaleDateString("es-SV", {
            month: "long",
            year: "numeric"
        });

        const fila = document.createElement("tr");

        crearCelda(fila, nombreMes);
        crearCelda(fila, dinero(datos.ingresos));
        crearCelda(fila, dinero(datos.gastos));
        crearCelda(fila, dinero(datos.ingresos - datos.gastos));

        tabla.appendChild(fila);
    });

    document.getElementById("mesActual").textContent =
        new Date().toLocaleDateString("es-SV", {
            month: "long",
            year: "numeric"
        });
}

// ==========================================
// INICIAR EL SISTEMA
// ==========================================

document.getElementById("fechaIngreso").value = fechaLocal();
document.getElementById("fechaGasto").value = fechaLocal();

mostrarServicios();
calcularTotal();