
const formulario = document.getElementById("formulario-contacto");

formulario.addEventListener("submit", function(event) {
    event.preventDefault();

    // Obtener los datos del formulario
    const nombre = document.getElementById("nombre").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const producto = document.getElementById("producto").value;
    const cantidad = document.getElementById("cantidad").value;
    const fecha = document.getElementById("fecha").value;
    const direccion = document.getElementById("direccion").value.trim();
    const mensaje = document.getElementById("mensaje").value.trim();

    // Número de WhatsApp de Flores y Detalles
    const numeroWhatsApp = "50372770015";

    // Convertir la fecha a un formato más bonito
    const fechaEntrega = new Date(fecha + "T00:00:00");

    const fechaFormateada = fechaEntrega.toLocaleDateString("es-SV", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });

    // Crear el mensaje que llegará a WhatsApp
    const texto = `🌸 *NUEVO PEDIDO - FLORES Y DETALLES* 🌸

👤 *Nombre del cliente:*
${nombre}

📱 *Teléfono:*
${telefono}

🌷 *Producto:*
${producto}

🔢 *Cantidad:*
${cantidad}

📅 *Fecha de entrega:*
${fechaFormateada}

📍 *Dirección de entrega:*
${direccion}

📝 *Detalles del pedido:*
${mensaje}

💐 Gracias por elegir Flores y Detalles.`;

    // Crear enlace de WhatsApp
    const enlace = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(texto)}`;

    // Abrir WhatsApp
    window.open(enlace, "_blank");
});
