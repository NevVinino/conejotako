// 1. Usamos 'supabaseClient' para que no choque con la librería externa
const SUPABASE_URL = "https://vqroowwikohpsudlinpc.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_inv_aAknxGhwHyv2dB_EYg_6o8gaKAg";   

// Aquí mantenemos tu variable 'supabaseClient'
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function obtenerCatalogoManga() {
    const contenedor = document.getElementById('contenedor-biblioteca');
    const estadoCarga = document.getElementById('estado-carga');

    try {
        // 2. Aquí hacemos la consulta filtrando ÚNICAMENTE por 'manga'
        const { data: catalogo, error } = await supabaseClient
            .from('biblioteca_contenido')
            .select('id, titulo, imagen_url')
            .eq('categoria', 'manga') // <--- ¡La clave de la separación está aquí!
            .order('creado_en', { ascending: false });

        if (error) throw error;

        if (catalogo.length === 0) {
            estadoCarga.innerText = "Por el momento no hay mangas grabados disponibles.";
            return;
        }

        contenedor.innerHTML = '';

        // 3. Renderizamos las portadas de tus mangas grabados
        catalogo.forEach(manga => {
            contenedor.innerHTML += `
                <div class="biblioteca-item">
                    <a href="lobby.html?id=${manga.id}">
                        <img src="${manga.imagen_url}" alt="${manga.titulo}">
                        <span>${manga.titulo}</span>
                    </a>
                </div>
            `;
        });

    } catch (error) {
        console.error("Error al conectar con Supabase:", error);
        estadoCarga.innerText = "Error al conectar con el servidor.";
    }
}

document.addEventListener('DOMContentLoaded', obtenerCatalogoManga);