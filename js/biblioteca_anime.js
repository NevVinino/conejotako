// 1. Usamos 'supabaseClient' para que no choque con la librería externa
const SUPABASE_URL = "https://vqroowwikohpsudlinpc.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_inv_aAknxGhwHyv2dB_EYg_6o8gaKAg";   

// Aquí cambiamos el nombre de la variable a 'supabaseClient'
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let elementosAnime = [];

async function obtenerCatalogoAnime() {
    const contenedor = document.getElementById('contenedor-biblioteca');
    const estadoCarga = document.getElementById('estado-carga');

    try {
        // 2. Aquí también usamos 'supabaseClient' para hacer la consulta
        const { data: catalogo, error } = await supabaseClient
            .from('biblioteca_contenido')
            .select('id, titulo, imagen_url')
            .eq('categoria', 'anime')
            .order('creado_en', { ascending: false });

        if (error) throw error;

        if (catalogo.length === 0) {
            estadoCarga.innerText = "Por el momento no hay series disponibles.";
            return;
        }

        contenedor.innerHTML = '';

        catalogo.forEach(anime => {
            const tarjeta = document.createElement('div');
            tarjeta.className = 'biblioteca-item';
            tarjeta.setAttribute('data-titulo', (anime.titulo || '').toLowerCase());
            tarjeta.innerHTML = `
                <a href="lobby.html?id=${anime.id}">
                    <img src="${anime.imagen_url}" alt="${anime.titulo}">
                    <span>${anime.titulo}</span>
                </a>
            `;
            contenedor.appendChild(tarjeta);
        });

        elementosAnime = Array.from(contenedor.getElementsByClassName('biblioteca-item'));

    } catch (error) {
        console.error("Error al conectar con Supabase:", error);
        estadoCarga.innerText = "Error al conectar con el servidor.";
    }
}

function inicializarBuscadorAnime() {
    const buscador = document.getElementById('buscador');
    if (!buscador) return;

    buscador.addEventListener('input', () => {
        const query = buscador.value.toLowerCase().trim();

        elementosAnime.forEach(item => {
            const titulo = (item.getAttribute('data-titulo') || '').toLowerCase();
            const textoVisible = item.textContent.toLowerCase();

            if (titulo.includes(query) || textoVisible.includes(query)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    await obtenerCatalogoAnime();
    inicializarBuscadorAnime();
});