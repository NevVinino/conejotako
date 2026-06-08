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
    }
});