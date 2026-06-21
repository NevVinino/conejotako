// configuracion supabase 
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// CONFIGURACIÓN DE SUPABASE
const SUPABASE_URL = "https://vqroowwikohpsudlinpc.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_inv_aAknxGhwHyv2dB_EYg_6o8gaKAg"; 

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Arreglo global para guardar las referencias de los li que creemos dinámicamente
let elementosTraducciones = [];

// ==========================================
// 3. CARGA DINÁMICA DESDE SUPABASE
// ==========================================
async function cargarTraducciones() {
    const listaUL = document.getElementById('lista-traducciones');
    if (!listaUL) return;

    try {
        // Consultamos a Supabase ordenando por fecha de forma descendente (más recientes primero)
        const { data: traducciones, error } = await supabase
            .from('traducciones')
            .select('*')
            .order('fecha', { ascending: false });

        if (error) throw error;

        if (!traducciones || traducciones.length === 0) {
            listaUL.innerHTML = "<li><span class='titulo-traduccion'>Próximamente más traducciones...</span></li>";
            return;
        }

        // Limpiamos el mensaje de "Cargando..."
        listaUL.innerHTML = '';

        // Renderizamos cada traducción mapeando los datos de tu tabla
        traducciones.forEach(item => {
            // Formateamos la fecha técnica (AAAA-MM-DD) a visual (DD/MM/AAAA)
            let fechaFormateada = item.fecha;
            if (item.fecha && item.fecha.includes('-')) {
                const partes = item.fecha.split('-');
                fechaFormateada = `${partes[2]}/${partes[1]}/${partes[0]}`;
            }

            const li = document.createElement('li');
            // Inicializamos los mismos atributos data que usaba tu buscador original
            li.setAttribute('data-nombre', (item.nombre_busqueda || '').toLowerCase());
            li.setAttribute('data-fecha', item.fecha || '');

            // Validamos si ya tiene un link de MEGA asignado; si no, manejamos el estado "Pronto"
            const tieneLink = item.url_mega && item.url_mega.trim() !== "";
            const hrefAttr = tieneLink ? `href="${item.url_mega}"` : '';
            const claseLink = tieneLink ? '' : 'style="pointer-events: none; opacity: 0.6;"';

            li.innerHTML = `
                <a ${hrefAttr} target="_blank" ${claseLink} rel="noopener noreferrer">
                    <span class="titulo-traduccion">${item.titulo}</span>
                    <span class="fecha-traduccion">${fechaFormateada}</span>
                </a>
            `;
            
            listaUL.appendChild(li);
        });

        // Guardamos los li recién creados en el arreglo global para que el buscador pueda usarlos
        elementosTraducciones = Array.from(listaUL.getElementsByTagName("li"));

    } catch (err) {
        console.error("Error al cargar traducciones:", err);
        listaUL.innerHTML = "<li><span class='titulo-traduccion'>Error al sincronizar las traducciones.</span></li>";
    }
}

// ==========================================
// 4. LÓGICA ACTIVA DEL BUSCADOR
// ==========================================
function inicializarBuscador() {
    const buscador = document.getElementById("buscador");
    if (!buscador) return;

    buscador.addEventListener("input", () => {
        const query = buscador.value.toLowerCase().trim();

        elementosTraducciones.forEach(li => {
            const nombre = (li.getAttribute("data-nombre") || "").toLowerCase();
            const fechaTecnica = (li.getAttribute("data-fecha") || "").toLowerCase();
            const textoVisual = li.textContent.toLowerCase();

            // Lógica idéntica a tu buscador original
            if (nombre.includes(query) || fechaTecnica.includes(query) || textoVisual.includes(query)) {
                li.style.display = ""; 
            } else {
                li.style.display = "none"; 
            }
        });
    });
}

// ==========================================
// 5. ARRANQUE EN ORDEN CRONOLÓGICO
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
    // 1. Primero esperamos a que los datos se descarguen y se pinten en el HTML
    await cargarTraducciones();
    // 2. Una vez que existen los elementos, activamos la escucha del buscador
    inicializarBuscador();
});