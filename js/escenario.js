const SUPABASE_URL = "https://vqroowwikohpsudlinpc.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_inv_aAknxGhwHyv2dB_EYg_6o8gaKAg";   
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const params = new URLSearchParams(window.location.search);
let episodioId = parseInt(params.get('id'), 10);

if (!episodioId || isNaN(episodioId)) {
    window.location.href = "anime.html";
}

let listaHermanos = [];
let contenidoIdActual = null;

async function cargarEscenario() {
    try {
        // Petición 1: Obtener el capítulo actual
        const { data: epActual, error: errorEp } = await supabaseClient
            .from('episodios')
            .select('*')
            .eq('id', episodioId)
            .single();

        if (errorEp) throw errorEp;

        contenidoIdActual = epActual.contenido_id;

        // Actualizar datos en reproductor
        document.getElementById('titulo-streaming-actual').innerText = `EPISODIO ${epActual.numero_episodio} - ${epActual.titulo_episodio.toUpperCase()}`;
        document.getElementById('reproductor-iframe').src = epActual.url_embed_video;
        document.getElementById('btn-volver-lobby').href = `lobby.html?id=${contenidoIdActual}`;

        // Renderizar descargas
        renderizarDescargas(epActual);

        // Petición 2: Obtener todos los capítulos de esta serie para el Sidebar
        const { data: hermanos, error: errorHermanos } = await supabaseClient
            .from('episodios')
            .select('*')
            .eq('contenido_id', contenidoIdActual)
            .order('numero_episodio', { ascending: true });

        if (errorHermanos) throw errorHermanos;

        listaHermanos = hermanos;
        renderizarPlaylist(listaHermanos);
        
        // CORRECCIÓN AQUÍ: Ahora llamamos a la función correcta de navegación combinada
        configurarNavegacion(epActual);

    } catch (error) {
        console.error("Error en escenario:", error);
    }
}

function renderizarPlaylist(episodios) {
    const contenedor = document.getElementById('playlist-contenedor');
    contenedor.innerHTML = '';

    episodios.forEach(ep => {
        // Marcamos con una clase especial si es el capítulo que se está reproduciendo actualmente
        const esActivo = ep.id === episodioId ? 'activo' : '';
        
        contenedor.innerHTML += `
            <a href="escenario.html?id=${ep.id}" class="item-playlist ${esActivo}">
                <div class="thumb-playlist">
                    <img src="${ep.thumbnail_url || '../img/default-thumb.jpg'}" alt="Ep ${ep.numero_episodio}">
                </div>
                <div class="info-playlist">
                    <span class="num-ep">Episodio ${ep.numero_episodio}</span>
                    <p class="tit-ep">${ep.titulo_episodio}</p>
                </div>
            </a>
        `;
    });
}

function renderizarDescargas(ep) {
    const contenedor = document.getElementById('contenedor-descargas');
    contenedor.innerHTML = '';

    if (ep.url_redir_mega) {
        contenedor.innerHTML += `<a href="${ep.url_redir_mega}" target="_blank" class="btn-link-descarga mega">MEGA</a>`;
    }
    if (ep.url_redir_onedrive) {
        contenedor.innerHTML += `<a href="${ep.url_redir_onedrive}" target="_blank" class="btn-link-descarga onedrive">OneDrive</a>`;
    }
    if (!ep.url_redir_mega && !ep.url_redir_onedrive) {
        contenedor.innerHTML = `<p class="texto-vacio">No hay enlaces disponibles por ahora.</p>`;
    }
}

function configurarNavegacion(epActual) {
    const btnAnt = document.getElementById('btn-anterior');
    const btnSig = document.getElementById('btn-siguiente');
    
    // 1. Buscamos si existe un capítulo anterior (Número actual - 1)
    const anteriorEp = listaHermanos.find(ep => ep.numero_episodio === epActual.numero_episodio - 1);
    
    if (anteriorEp) {
        btnAnt.style.display = "block"; // Se muestra si existe
        btnAnt.onclick = () => {
            window.location.href = `escenario.html?id=${anteriorEp.id}`;
        };
    } else {
        btnAnt.style.display = "none";  // Se oculta si es el Capítulo 1
    }

    // 2. Buscamos si existe un capítulo siguiente (Número actual + 1)
    const siguiendoEp = listaHermanos.find(ep => ep.numero_episodio === epActual.numero_episodio + 1);

    if (siguiendoEp) {
        btnSig.style.display = "block"; // Se muestra si existe
        btnSig.onclick = () => {
            window.location.href = `escenario.html?id=${siguiendoEp.id}`;
        };
    } else {
        btnSig.style.display = "none";  // Se oculta si es el último capítulo subido
    }
}

document.addEventListener('DOMContentLoaded', cargarEscenario);