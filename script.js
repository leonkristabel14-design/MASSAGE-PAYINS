function mostrarMensaje(texto, tipo) {

    const mensajeDiv = document.createElement('div');

    mensajeDiv.className = 'mensaje-' + tipo;

    mensajeDiv.textContent = texto;

    mensajeDiv.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 10px;
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.5s ease;
        ${
            tipo === 'exito'
                ? 'background-color: #10b981; color: white;'
                : 'background-color: #ef4444; color: white;'
        }
    `;

    document.body.appendChild(mensajeDiv);

    setTimeout(function () {

        mensajeDiv.style.animation = 'slideOut 0.5s ease forwards';

        setTimeout(function () {

            mensajeDiv.remove();

        }, 500);

    }, 3000);

}
document.querySelectorAll('a[href^="#"]').forEach(function (link) {

    link.addEventListener('click', function (evento) {

        evento.preventDefault();

        const destino = this.getAttribute('href');

        const seccion = document.querySelector(destino);

        if (seccion) {

            seccion.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });

        }

    });

});

const secciones = document.querySelectorAll('section');

const observer = new IntersectionObserver(function (entries) {

    entries.forEach(function (entry) {

        if (entry.isIntersecting) {

            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';

        }

    });

}, {
    threshold: 0.1
});

secciones.forEach(function (seccion) {

    seccion.style.opacity = '0';
    seccion.style.transform = 'translateY(50px)';
    seccion.style.transition = 'opacity 0.6s ease, transform 0.6s ease';

    observer.observe(seccion);

});

const barrasProgreso = document.querySelectorAll('.progress');

const observerBarras = new IntersectionObserver(function (entries) {

    entries.forEach(function (entry) {

        if (entry.isIntersecting) {

            const barra = entry.target;
            const ancho = barra.style.width;

            barra.style.width = '0%';

            setTimeout(function () {

                barra.style.width = ancho;

            }, 200);

        }

    });

}, {
    threshold: 0.5
});

barrasProgreso.forEach(function (barra) {

    observerBarras.observe(barra);

});

const barras = document.querySelectorAll('.progress-bar');

barras.forEach(function (barra) {

    observerBarras.observe(barra);

});


const formulario = document.querySelector('form');

if (formulario) {

    formulario.addEventListener('submit', function (e) {

        e.preventDefault();

        const boton = formulario.querySelector('button[type="submit"]');

        const textoOriginal = boton.textContent;

        boton.textContent = 'Enviando...';
        boton.disabled = true;

        setTimeout(function () {

            mostrarMensaje(
                '¡Gracias por tu mensaje! Te contactaré pronto.',
                'exito'
            );

            formulario.reset();

            boton.textContent = textoOriginal;
            boton.disabled = false;

        }, 2000);

    });

}


const estilos = document.createElement('style');

estilos.textContent = `
@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slideOut {
    from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(100%);
        opacity: 0;
    }
}
`;

document.head.appendChild(estilos);