// ==========================================
// 1. IMPORTACIONES DIRECTAS DESDE INTERNET
// ==========================================
// Traemos el motor oficial de Supabase directamente para que funcione con type="module"
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// ==========================================
// 2. CONFIGURACIÓN INICIAL (¡Llaves Protegidas!)
// ==========================================
const SUPABASE_URL = "https://vqroowwikohpsudlinpc.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_inv_aAknxGhwHyv2dB_EYg_6o8gaKAg";   
const YT_API_KEY = "AIzaSyAuw_kVOu4dJ0J8ZHrU-4WHEjfZDLivLgo";               

// Datos fijos del canal @conejotako
const YT_CHANNEL_ID = "UCkaHtuBIU0JvmAxN5Qn6Ftw"; 

// Inicializamos la conexión de Supabase de manera correcta
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// URL oficial de YouTube para buscar los 3 videos más recientes
const youtubeUrl = `https://www.googleapis.com/youtube/v3/search?key=${YT_API_KEY}&channelId=${YT_CHANNEL_ID}&part=snippet,id&order=date&maxResults=3&type=video`;

// ==========================================
// 3. LÓGICA DE LOS 3 VIDEOS RECOMENDADOS (Escudo Supabase)
// ==========================================
async function gestionarVideosRecomendados() {
    try {
        // Consultamos primero a nuestro PostgreSQL en Supabase
        const { data: cache, error } = await supabase
            .from('videos_cache')
            .select('*')
            .order('id', { ascending: true });

        const ahora = new Date();
        const horaActual = ahora.getHours(); // Formato 24h (0-23)
        
        // Buscamos la hora de la última revisión guardada
        const ultimaRevision = cache && cache.length > 0 ? new Date(cache[0].ultima_revision) : null;

        // Estrategia inteligente: Revisar cada 1 hora entre las 6:00 AM y las 11:00 PM
        const UNA_HORA_EN_MS = 60 * 60 * 1000;
        const HORA_INICIO = 6;  
        const HORA_FIN = 23;   

        const pasoMasDeUnaHora = !ultimaRevision || (ahora - ultimaRevision >= UNA_HORA_EN_MS);
        const estaEnHorarioPermitido = (horaActual >= HORA_INICIO && horaActual < HORA_FIN);

        if (pasoMasDeUnaHora && estaEnHorarioPermitido) {
            console.log("Sincronizando: Horario activo y pasó más de 1 hora. Consultando YouTube...");
            
            // Llamada a YouTube (Gasta puntos)
            const response = await fetch(youtubeUrl);
            const ytData = await response.json();

            if (ytData.items && ytData.items.length > 0) {
                // Limpiamos el caché viejo de Postgres
                await supabase.from('videos_cache').delete().neq('id', 0);

                // Preparamos los datos limpios para insertar
                const filasAInsertar = ytData.items.map(item => ({
                    youtube_id: item.id.videoId,
                    titulo: item.snippet.title,
                    ultima_revision: ahora.toISOString()
                }));

                // Guardamos en Supabase para proteger futuras visitas
                await supabase.from('videos_cache').insert(filasAInsertar);
                
                // Los pintamos en la web
                renderizarVideos(filasAInsertar);
            } else {
                // Si la API falla o se agotan los puntos, mostramos el respaldo de Supabase
                console.log("La API de YouTube no devolvió datos, usando respaldo de Supabase.");
                renderizarVideos(cache);
            }
        } else {
            // Fuera de horario o todavía no pasa la hora: Leemos Postgres directo (0 puntos de YT)
            console.log("Escudo activo: Cargando videos desde Supabase para ahorrar puntos.");
            renderizarVideos(cache);
        }

    } catch (err) {
        console.error("Error al gestionar videos recomendados:", err);
        document.getElementById('contenedor-videos').innerHTML = "<p>No se pudieron cargar los videos recientes.</p>";
    }
}

// NUEVA FUNCIÓN OPTIMIZADA: Genera fachadas con miniaturas limpias en vez de iframes pesados
function renderizarVideos(videos) {
    const contenedor = document.getElementById('contenedor-videos');
    
    if (!videos || videos.length === 0) {
        contenedor.innerHTML = "<p>Aún no hay videos sincronizados. La primera carga se hará automáticamente en el horario permitido (6:00 AM - 11:00 PM).</p>";
        return;
    }

    contenedor.innerHTML = ''; // Borramos el texto "Cargando..."

    videos.forEach(video => {
        const idVideo = video.youtube_id || video.video_id;
        const tituloLower = video.titulo.toLowerCase();
        
        // DETECCIÓN: Si el título contiene la palabra "#shorts" o "short", lo tratamos como vertical
        const esShort = tituloLower.includes('#shorts') || tituloLower.includes('short');
        
        // Asignamos la clase de CSS correspondiente y la URL de redirección correcta
        const claseFormato = esShort ? 'formato-short' : 'formato-largo';
        const urlDestino = esShort 
            ? `https://www.youtube.com/shorts/${idVideo}` 
            : `https://www.youtube.com/watch?v=${idVideo}`;

        // Usamos imágenes oficiales de miniaturas de YouTube
        const urlMiniatura = `https://img.youtube.com/vi/${idVideo}/hqdefault.jpg`;

        const tarjeta = `
            <a href="${urlDestino}" target="_blank" class="tarjeta-video ${claseFormato}" rel="noopener noreferrer">
                <div class="mini-reproductor-capa" style="background-image: url('${urlMiniatura}');">
                    <div class="boton-play-personalizado">
                        <!-- Icono Play triángulo SVG limpio -->
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 5V19L19 12L8 5Z" fill="white"/>
                        </svg>
                    </div>
                </div>
                <h3 class="titulo-video" title="${video.titulo}">${video.titulo}</h3>
            </a>
        `;
        contenedor.innerHTML += tarjeta;
    });
}

// Inyecta el iframe real con reproducción automática únicamente tras el clic del usuario
window.reproducirVideoInSitu = function(elemento, idVideo) {
    const capa = elemento.querySelector('.mini-reproductor-capa');
    capa.innerHTML = `
        <iframe 
            src="https://www.youtube.com/embed/${idVideo}?autoplay=1" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
        </iframe>
    `;
};

// ==========================================
// 4. LÓGICA DEL DETECTOR EN VIVO (Intercambio de GIF)
// ==========================================
function controlarPantallaEnVivo() {
    const iframe = document.getElementById('iframe-youtube');
    const imgOffline = document.getElementById('imagen-offline');
    const reproductor = document.getElementById('reproductor-vivo');

    if (!iframe) return;

    // Crea un pulsador automático que intenta despertar la señal del reproductor cada 3 segundos
    const revisorEnVivo = setInterval(() => {
        try {
            iframe.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 1 }), '*');
        } catch (e) {}
    }, 3000);

    // Escuchamos la respuesta en tiempo real de YouTube
    window.addEventListener('message', (event) => {
        if (event.origin === "https://www.youtube.com") {
            try {
                const datos = JSON.parse(event.data);
                
                // Si YouTube responde con datos de reproducción válidos, significa que el directo inició
                if (datos.event === "infoDelivery" || datos.info) {
                    console.log("¡Señal en vivo detectada! Cambiando a reproductor...");
                    
                    if (imgOffline) {
                        imgOffline.classList.remove('mostrar');
                        imgOffline.classList.add('oculto');
                    }
                    
                    if (reproductor) {
                        reproductor.classList.remove('oculto');
                        reproductor.classList.add('mostrar');
                    }
                    
                    // Apagamos el reloj para ahorrar memoria
                    clearInterval(revisorEnVivo);
                }
            } catch (e) {}
        }
    });
}

// ==========================================
// 5. ARRANQUE AUTOMÁTICO DE LOS SISTEMAS
// ==========================================
gestionarVideosRecomendados();
controlarPantallaEnVivo();