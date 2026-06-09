function getNavbarBasePath() {
    const pathname = window.location.pathname.replace(/\\/g, "/");
    return pathname.includes("/paginas/") ? "../" : "";
}

function buildNavbarTemplate(basePath) {
    return `
    <div class="navbar">
        <div class="nav-container">
            <div class="nav-logo">
                <a href="${basePath}index.html">Conejotako</a>
                 <img src="${basePath}img/conejo.gif" alt="Conejo animado" class="nav-logo-gif">
            </div>
            <button class="menu-toggle" type="button" aria-label="Abrir menú" aria-expanded="false">&#9776;</button>
            <nav class="nav-links">
                <a href="${basePath}index.html">Inicio</a>
                <a href="${basePath}paginas/anime.html">Anime</a>
                <a href="${basePath}paginas/novelas.html">Novelas</a>
                <a href="${basePath}paginas/contacto.html">Contacto</a>
            </nav>
        </div>
    </div>
`;
}

// Cuando la página termine de cargar, inyectamos el menú en el contenedor
document.addEventListener("DOMContentLoaded", function() {
    const contenedor = document.getElementById('espacio-navbar');
    if (contenedor) {
        contenedor.innerHTML = buildNavbarTemplate(getNavbarBasePath());

        const menuToggle = contenedor.querySelector('.menu-toggle');
        const navLinks = contenedor.querySelector('.nav-links');

        if (menuToggle && navLinks) {
            menuToggle.addEventListener('click', function() {
                const isOpen = navLinks.classList.toggle('show');
                menuToggle.setAttribute('aria-expanded', String(isOpen));
                menuToggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
                menuToggle.innerHTML = isOpen ? '&times;' : '&#9776;';
            });

            navLinks.querySelectorAll('a').forEach(function(link) {
                link.addEventListener('click', function() {
                    navLinks.classList.remove('show');
                    menuToggle.setAttribute('aria-expanded', 'false');
                    menuToggle.setAttribute('aria-label', 'Abrir menú');
                    menuToggle.innerHTML = '&#9776;';
                });
            });
        }
    }
});