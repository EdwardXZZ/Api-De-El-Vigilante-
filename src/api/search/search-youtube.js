// src/api/search/youtube.js
const axios = require('axios');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (Chrome)';

async function searchYouTube(query, limit = 20) {
    try {
        // Usar API pública de yt-search (sin clave, más estable)
        const url = `https://yt-api.p.rapidapi.com/search?query=${encodeURIComponent(query)}&limit=${limit}`;
        
        // Si tenés clave de RapidAPI, usala. Si no, usamos fallback
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': UA,
                    'X-RapidAPI-Key': 'TU_API_KEY_AQUI', // Opcional
                    'X-RapidAPI-Host': 'yt-api.p.rapidapi.com'
                },
                timeout: 10000
            });
            
            if (response.data?.data?.length) {
                return response.data.data.map(video => ({
                    title: video.title,
                    channel: video.channelTitle,
                    duration: video.length,
                    views: video.viewCount,
                    thumbnail: video.thumbnail?.[0]?.url || '',
                    url: `https://www.youtube.com/watch?v=${video.videoId}`,
                    publishedAt: video.publishDate || 'N/A'
                }));
            }
        } catch (e) {
            console.log('RapidAPI falló, usando fallback');
        }
        
        // Fallback: Google Custom Search (otra opción)
        throw new Error('No se encontraron resultados');
        
    } catch (error) {
        console.error('[YouTube Error]', error.message);
        return [];
    }
}

module.exports = function(app) {
    app.get('/search/youtube', async (req, res) => {
        const query = req.query.q;
        const limit = parseInt(req.query.limit) || 20;

        if (!query) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "Falta el parámetro 'q'",
                usage: "/search/youtube?q=badbunny&limit=10"
            });
        }

        try {
            const results = await searchYouTube(query, Math.min(limit, 30));
            return res.json({
                status: true,
                creator: "DVLYONN",
                query: query,
                total_results: results.length,
                result: results
            });
        } catch (error) {
            console.error('[YouTube Error]', error.message);
            res.status(500).json({
                status: false,
                creator: "DVLYONN",
                error: error.message
            });
        }
    });
};