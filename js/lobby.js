const SUPABASE_URL = "https://vqroowwikohpsudlinpc.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_inv_aAknxGhwHyv2dB_EYg_6o8gaKAg";   
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 1. Obtener el ID del anime desde la URL (?id=1)
const params = new URLSearchParams(window.location.search);
const animeId = params.get('id');

let listaEpisodios = []; // Cache local para buscar/invertir sin recargar de Supabase
let ordenAscendente = true;

if (!animeId) {
    window.location.href = "anime.html"; // Si no hay ID, regresa a la biblioteca
}

async function cargarLobby() {
    const header = document.getElementById('anime-header');

    try {
        // Petición 1: Datos del Anime
        const { data: anime, error: errorAnime } = await supabaseClient
            .from('biblioteca_contenido')
            .select('*')
            .eq('id', animeId)
            .single();

        if (errorAnime) throw errorAnime;

        // Pintamos el banner principal superior
        header.innerHTML = `
            <div class="anime-portada-bloque">
                <img src="${anime.imagen_url}" alt="${anime.titulo}">
            </div>
            <div class="anime-info-bloque">
                <h2>${anime.titulo}</h2>
                <p class="sinopsis">${anime.descripcion || 'Sin sinopsis disponible.'}</p>
                <button class="btn-capitulos-scroll">Capítulos</button>
            </div>
        `;

        // ========================================================
        // ¡MUDANZA AQUÍ! Activamos el botón justo después de crearlo
        // ========================================================
        const btnScroll = document.querySelector('.btn-capitulos-scroll');
        const seccionGrid = document.querySelector('.controles-capitulos'); // Buscamos por clase del contenedor

        if (btnScroll && seccionGrid) {
            btnScroll.addEventListener('click', () => {
                seccionGrid.scrollIntoView({ behavior: 'smooth' });
            });
        }

        // Petición 2: Episodios enlazados a este Anime
        const { data: episodios, error: errorEpisodios } = await supabaseClient
            .from('episodios')
            .select('*')
            .eq('contenido_id', animeId)
            .order('numero_episodio', { ascending: true });

        if (errorEpisodios) throw errorEpisodios;

        listaEpisodios = episodios;
        renderizarEpisodios(listaEpisodios);

    } catch (error) {
        console.error("Error cargando el lobby:", error);
        header.innerHTML = `<p class="estado-lobby">Error al cargar el contenido.</p>`;
    }
}

// Función encargada de dibujar los cuadraditos de los episodios
function renderizarEpisodios(episodios) {
    const grid = document.getElementById('grid-capitulos');
    grid.innerHTML = '';

    if (episodios.length === 0) {
        grid.innerHTML = `<p class="estado-lobby">Próximamente se subirán los capítulos de esta serie.</p>`;
        return;
    }

    episodios.forEach(ep => {
        grid.innerHTML += `
            <div class="capitulo-tarjeta">
                <a href="escenario.html?id=${ep.id}">
                    <div class="thumbnail-wrapper">
                        <img src="${ep.thumbnail_url || '../img/default-thumb.jpg'}" alt="Episodio ${ep.numero_episodio}">
                        <span class="etiqueta-ep">Capítulo ${ep.numero_episodio}</span>
                    </div>
                </a>
            </div>
        `;
    });
}

// LÓGICA DEL BUSCADOR (Filtra en tiempo real por el número ingresado)
document.getElementById('buscador-input').addEventListener('input', (e) => {
    const valor = e.target.value.trim();
    if (valor === '') {
        renderizarEpisodios(listaEpisodios);
    } else {
        const filtrados = listaEpisodios.filter(ep => ep.numero_episodio.toString() === valor);
        renderizarEpisodios(filtrados);
    }
});

// LÓGICA DE INVERTIR ORDEN
document.getElementById('btn-invertir').addEventListener('click', () => {
    ordenAscendente = !ordenAscendente;
    listaEpisodios.reverse();
    renderizarEpisodios(listaEpisodios);
    document.getElementById('btn-invertir').innerText = ordenAscendente ? "↓ Invertir" : "↑ Invertir";
});

document.addEventListener('DOMContentLoaded', cargarLobby);