// ==========================================
// 1. IMPORTACIONES DIRECTAS DESDE INTERNET
// ==========================================
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// ==========================================
// 2. CONFIGURACIÓN INICIAL (¡Llaves Protegidas!)
// ==========================================
const SUPABASE_URL = "https://vqroowwikohpsudlinpc.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_inv_aAknxGhwHyv2dB_EYg_6o8gaKAg";   
const YT_API_KEY = "AIzaSyAuw_kVOu4dJ0J8ZHrU-4WHEjfZDLivLgo";              

const YT_CHANNEL_ID = "UCkaHtuBIU0JvmAxN5Qn6Ftw"; 

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// URLs de la API de YouTube
const youtubeUrl = `https://www.googleapis.com/youtube/v3/search?key=${YT_API_KEY}&channelId=${YT_CHANNEL_ID}&part=snippet,id&order=date&maxResults=3&type=video`;
const youtubeLiveUrl = `https://www.googleapis.com/youtube/v3/search?key=${YT_API_KEY}&channelId=${YT_CHANNEL_ID}&part=snippet,id&eventType=live&type=video&maxResults=1`;

const LIVE_EMBED_URL = `https://www.youtube.com/embed/live_stream?channel=${YT_CHANNEL_ID}&autoplay=1&mute=1&playsinline=1&rel=0`;

// Constantes globales de horario (Estrategia inteligente)
const HORA_INICIO = 6;  // 6:00 AM
const HORA_FIN = 23;   // 11:00 PM

// ==========================================
// 3. LÓGICA DE LOS 3 VIDEOS RECOMENDADOS (Escudo Supabase)
// ==========================================
async function gestionarVideosRecomendados() {
    try {
        const { data: cache, error } = await supabase
            .from('videos_cache')
            .select('*')
            .order('id', { ascending: true });

        const ahora = new Date();
        const horaActual = ahora.getHours(); 
        const ultimaRevision = cache && cache.length > 0 ? new Date(cache[0].ultima_revision) : null;

        const UNA_HORA_EN_MS = 60 * 60 * 1000;
        const pasoMasDeUnaHora = !ultimaRevision || (ahora - ultimaRevision >= UNA_HORA_EN_MS);
        const estaEnHorarioPermitido = (horaActual >= HORA_INICIO && horaActual < HORA_FIN);

        if (pasoMasDeUnaHora && estaEnHorarioPermitido) {
            console.log("Videos: Sincronizando con YouTube...");
            const response = await fetch(youtubeUrl);
            const ytData = await response.json();

            if (ytData.items && ytData.items.length > 0) {
                await supabase.from('videos_cache').delete().neq('id', 0);

                const filasAInsertar = ytData.items.map(item => ({
                    youtube_id: item.id.videoId,
                    titulo: item.snippet.title,
                    ultima_revision: ahora.toISOString()
                }));

                await supabase.from('videos_cache').insert(filasAInsertar);
                renderizarVideos(filasAInsertar);
            } else {
                renderizarVideos(cache);
            }
        } else {
            console.log("Escudo Videos Activo: Cargando desde Supabase.");
            renderizarVideos(cache);
        }
    } catch (err) {
        console.error("Error al gestionar videos recomendados:", err);
        document.getElementById('contenedor-videos').innerHTML = "<p>No se pudieron cargar los videos recientes.</p>";
    }
}

function renderizarVideos(videos) {
    const contenedor = document.getElementById('contenedor-videos');
    if (!contenedor) return;
    
    if (!videos || videos.length === 0) {
        contenedor.innerHTML = "<p>Aún no hay videos sincronizados.</p>";
        return;
    }

    contenedor.innerHTML = ''; 
    videos.forEach(video => {
        const idVideo = video.youtube_id || video.video_id;
        const tituloLower = video.titulo.toLowerCase();
        const esShort = tituloLower.includes('#shorts') || tituloLower.includes('short');
        const claseFormato = esShort ? 'formato-short' : 'formato-largo';
        const urlDestino = esShort ? `https://www.youtube.com/shorts/${idVideo}` : `https://www.youtube.com/watch?v=${idVideo}`;
        const urlMiniatura = `https://img.youtube.com/vi/${idVideo}/hqdefault.jpg`;

        const tarjeta = `
            <a href="${urlDestino}" target="_blank" class="tarjeta-video ${claseFormato}" rel="noopener noreferrer">
                <div class="mini-reproductor-capa" style="background-image: url('${urlMiniatura}');">
                    <div class="boton-play-personalizado">
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

// ==========================================
// 4. LÓGICA DEL DETECTOR EN VIVO (Escudo Supabase - FIX REPRODUCTOR)
// ==========================================
let verificacionEnVivoEnCurso = false;

async function controlarPantallaEnVivo() {
    const iframe = document.getElementById('iframe-youtube');
    const imgOffline = document.getElementById('imagen-offline');
    const reproductor = document.getElementById('reproductor-vivo');

    if (!iframe || !imgOffline || !reproductor) return;
    if (verificacionEnVivoEnCurso) return;
    verificacionEnVivoEnCurso = true;

    try {
        // Leemos el último estado guardado en Supabase
        const { data: cacheLive } = await supabase
            .from('estado_canal')
            .select('*')
            .eq('id', 1)
            .single();

        const ahora = new Date();
        const horaActual = ahora.getHours();
        
        // Intentamos recuperar la fecha de revisión guardada
        let ultimaRevision = null;
        let videoIdGuardado = "";
        
        if (cacheLive && cacheLive.ultima_revision) {
            // Separamos la fecha del ID de video que guardaremos ahí mismo
            const partes = cacheLive.ultima_revision.split('|');
            ultimaRevision = new Date(partes[0]);
            if (partes.length > 1) videoIdGuardado = partes[1];
        }
        
        // Configuración blindada: Revisar la API cada 15 minutos en horario permitido
        const QUINCE_MINUTOS_EN_MS = 15 * 60 * 1000;
        const pasoTiempoSuficiente = !ultimaRevision || (ahora - ultimaRevision >= QUINCE_MINUTOS_EN_MS);
        const estaEnHorarioPermitido = (horaActual >= HORA_INICIO && horaActual < HORA_FIN);

        let estaEnVivo = cacheLive ? cacheLive.en_vivo : false;
        let liveVideoId = videoIdGuardado;

        // Solo va a YouTube si pasó el tiempo Y estamos en el horario de actividad
        if (pasoTiempoSuficiente && estaEnHorarioPermitido) {
            console.log("Escudo Directo: Consultando estado real en YouTube...");
            
            const response = await fetch(youtubeLiveUrl);
            const ytData = await response.json();
            
            estaEnVivo = Array.isArray(ytData.items) && ytData.items.length > 0;
            
            if (estaEnVivo) {
                // Extraemos el ID real y único del stream actual
                liveVideoId = ytData.items[0].id.videoId;
            } else {
                liveVideoId = "";
            }

            // Guardamos la respuesta y el ID del video en Supabase usando un separador '|'
            await supabase.from('estado_canal').upsert({
                id: 1,
                en_vivo: estaEnVivo,
                ultima_revision: `${ahora.toISOString()}|${liveVideoId}`
            });
        } else {
            console.log("Escudo Directo Activo: Usando estado de Supabase.");
            if (!estaEnHorarioPermitido) {
                estaEnVivo = false;
            }
        }

        // Pintar la interfaz en base al resultado
        if (estaEnVivo && liveVideoId) {
            imgOffline.classList.remove('mostrar');
            imgOffline.classList.add('oculto');
            reproductor.classList.remove('oculto');
            reproductor.classList.add('mostrar');

            // Creamos la URL de incrustación PERFECTA usando el ID real del video
            const urlIncrustacionReal = `https://www.youtube.com/embed/${liveVideoId}?autoplay=1&mute=1&playsinline=1&rel=0`;

            if (iframe.src !== urlIncrustacionReal) {
                iframe.src = urlIncrustacionReal;
            }
        } else {
            reproductor.classList.remove('mostrar');
            reproductor.classList.add('oculto');
            imgOffline.classList.remove('oculto');
            imgOffline.classList.add('mostrar');

            if (iframe.src) {
                iframe.removeAttribute('src');
            }
        }
    } catch (err) {
        console.error("Error en el sistema de directo:", err);
    } finally {
        verificacionEnVivoEnCurso = false;
    }
}

// ==========================================
// 5. ARRANQUE AUTOMÁTICO DE LOS SISTEMAS
// ==========================================
// Ejecución inmediata al cargar la página
gestionarVideosRecomendados();
controlarPantallaEnVivo();

// Los usuarios revisan Supabase cada 2 minutos. Si el escudo global de 15 minutos 
// ya venció, el primer usuario en entrar renovará los datos desde YouTube.
setInterval(controlarPantallaEnVivo, 120000);