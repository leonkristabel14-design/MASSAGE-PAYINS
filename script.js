const formulario = document.getElementById("formulario-contacto");

formulario.addEventListener("submit", function(event) {
    event.preventDefault();

    const nombre = document.getElementById("nombre").value;
    const telefono = document.getElementById("telefono").value;
    const mensaje = document.getElementById("mensaje").value;

    const numeroWhatsApp = "50372770015";

    const texto = `🌸 NUEVO PEDIDO 🌸

👤 Nombre: ${nombre}

📱 Número de teléfono: ${telefono}

📝 Pedido:
${mensaje}`;

    const enlace = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(texto)}`;

    window.open(enlace, "_blank");
});