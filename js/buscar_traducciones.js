document.addEventListener("DOMContentLoaded", () => {
    const buscador = document.getElementById("buscador");
    const lista = document.getElementById("lista-traducciones");
    const elementos = Array.from(lista.getElementsByTagName("li"));

    // 1. ORDENAR AUTOMÁTICAMENTE (Más recientes primero) al cargar la página
    elementos.sort((a, b) => {
        const fechaA = new Date(a.getAttribute("data-fecha"));
        const fechaB = new Date(b.getAttribute("data-fecha"));
        return fechaB - fechaA; 
    });

    // Reinyectar los elementos ya ordenados de forma definitiva en el HTML
    elementos.forEach(li => lista.appendChild(li));

    // 2. FUNCIÓN DE FILTRADO PARA EL BUSCADOR (Nombre + Fecha)
    buscador.addEventListener("input", () => {
        const query = buscador.value.toLowerCase().trim();

        elementos.forEach(li => {
            // 1. Buscamos en el atributo data-nombre (ej: "priestella rapsodia")
            const nombre = li.getAttribute("data-nombre").toLowerCase();
            
            // 2. Buscamos en el atributo data-fecha (ej: "2026-05-15")
            const fechaTecnica = li.getAttribute("data-fecha").toLowerCase();
            
            // 3. Buscamos en el texto que ve el usuario (ej: "Priestella Rapsodia (15/05/2026)")
            const textoVisual = li.textContent.toLowerCase();
            
            // Si la búsqueda coincide con cualquiera de los tres, se muestra; si no, se oculta
            if (nombre.includes(query) || fechaTecnica.includes(query) || textoVisual.includes(query)) {
                li.style.display = ""; // Muestra el elemento
            } else {
                li.style.display = "none"; // Lo oculta
            }
        });
    });
});