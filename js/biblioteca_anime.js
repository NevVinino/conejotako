// 1. Usamos 'supabaseClient' para que no choque con la librería externa
const SUPABASE_URL = "https://vqroowwikohpsudlinpc.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_inv_aAknxGhwHyv2dB_EYg_6o8gaKAg";   

// Aquí cambiamos el nombre de la variable a 'supabaseClient'
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
            contenedor.innerHTML += `
                <div class="biblioteca-item">
                    <a href="lobby.html?id=${anime.id}">
                        <img src="${anime.imagen_url}" alt="${anime.titulo}">
                        <span>${anime.titulo}</span>
                    </a>
                </div>
            `;
        });

    } catch (error) {
        console.error("Error al conectar con Supabase:", error);
        estadoCarga.innerText = "Error al conectar con el servidor.";
    }
}

document.addEventListener('DOMContentLoaded', obtenerCatalogoAnime);