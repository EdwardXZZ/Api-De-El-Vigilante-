// ==================== ENDPOINT: /download/ytvideo (con yt-search) ====================
const axios = require('axios');
const yts = require('yt-search'); // <--- Importamos la nueva librería

async function downloadYouTubeVideo(videoUrl, quality = "360") {
    // ... (tu función de descarga con savenow.to se mantiene IDÉNTICA) ...
    // Solo cambia el nombre del parámetro de 'url' a 'videoUrl' para claridad.
    try {
        const downloadResp = await axios.get("https://p.savenow.to/ajax/download.php", {
            params: {
                copyright: 0,
                format: quality,
                url: videoUrl, // <--- Recibe la URL del video encontrado
                api: "dfcb6d76f2f6a9894gjkege8a4ab232222"
            },
            headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0..." }
        });
        // ... resto de la lógica (verificación de data.id, esperar el progreso, etc.) ...
        const data = downloadResp.data;
        if (!data.success || !data.id) throw new Error('No se pudo iniciar la descarga');

        const downloadId = data.id;
        let downloadUrl = null;
        while (!downloadUrl) {
            const progressResp = await axios.get("https://p.savenow.to/api/progress", { params: { id: downloadId }, headers: { Accept: "application/json" } });
            const progressData = progressResp.data;
            if (progressData.success === 1 && progressData.download_url) {
                downloadUrl = progressData.download_url;
            } else {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        return { title: data.info?.title || 'YouTube Video', thumbnail: data.info?.image || '', download_url: downloadUrl };
    } catch (err) {
        throw new Error(err.message);
    }
}

module.exports = function(app) {
    // --- CAMBIO IMPORTANTE: El parámetro 'url' ahora es el texto a buscar ---
    app.get('/download/ytvideo', async (req, res) => {
        const query = req.query.query; // <-- Recibimos el texto a buscar (ej: "Bad Bunny")
        const quality = req.query.quality || '360';

        // Validaciones
        if (!query) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "Falta el parámetro 'query' (texto a buscar)",
                usage: "/download/ytvideo?query=Bad+Bunny&quality=720"
            });
        }

        const validQualities = ['360', '720', '1080'];
        if (!validQualities.includes(quality)) {
            return res.status(400).json({ status: false, creator: "DVLYONN", error: `Calidad inválida. Usa: ${validQualities.join(', ')}` });
        }

        try {
            // --- 1. BUSCAR EL VIDEO usando yt-search ---
            console.log(`🔍 Buscando: "${query}"...`);
            const searchResult = await yts(query); // Realiza la búsqueda
            
            if (!searchResult.videos || searchResult.videos.length === 0) {
                throw new Error(`No se encontraron resultados para "${query}"`);
            }

            // Tomamos el primer video de los resultados (el más relevante)
            const firstVideo = searchResult.videos[0];
            const videoUrl = firstVideo.url; // <--- Aquí obtenemos la URL real del YouTube
            const videoTitle = firstVideo.title;
            
            console.log(`✅ Video encontrado: "${videoTitle}" (${videoUrl})`);

            // --- 2. DESCARGAR EL VIDEO usando tu función existente ---
            const result = await downloadYouTubeVideo(videoUrl, quality);

            // --- 3. RESPONDER CON EL JSON ---
            if (req.query.download === 'true') {
                return res.redirect(result.download_url);
            }

            return res.json({
                status: true,
                creator: "DVLYONN",
                result: {
                    original_query: query,
                    video_title: videoTitle,
                    video_url: videoUrl,
                    thumbnail: result.thumbnail,
                    quality: quality + 'p',
                    format: "MP4",
                    download_url: result.download_url
                }
            });

        } catch (error) {
            console.error('[YouTube Video Error]', error.message);
            res.status(500).json({ status: false, creator: "DVLYONN", error: error.message });
        }
    });
};