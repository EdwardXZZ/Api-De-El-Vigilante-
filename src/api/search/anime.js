const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function(app) {

    app.get('/search/anime', async (req, res) => {
        const query = req.query.q;
        const url = req.query.url;

        // Si hay URL, es descarga
        if (url) {
            try {
                const { data } = await axios.get(url, {
                    headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 8000
                });
                
                const $ = cheerio.load(data);
                const opciones = [];
                
                $('a').each((i, el) => {
                    const href = $(el).attr('href') || '';
                    const text = $(el).text().trim().toUpperCase();
                    
                    if (href.includes('mega.nz') || href.includes('drive.google.com') || 
                        href.includes('mediafire.com')) {
                        opciones.push({ servidor: text || 'Descarga', url: href });
                    }
                });

                if (opciones.length === 0) {
                    return res.json({
                        status: false,
                        creator: "EL VIGILANTE",
                        mensaje: "No se encontraron links de descarga"
                    });
                }

                return res.json({
                    status: true,
                    creator: "EL VIGILANTE",
                    total: opciones.length,
                    opciones
                });

            } catch (error) {
                return res.status(500).json({
                    status: false,
                    creator: "EL VIGILANTE",
                    error: "Error al obtener descargas"
                });
            }
        }

        // Si no hay URL, es búsqueda
        if (!query) {
            return res.status(400).json({
                status: false,
                creator: "EL VIGILANTE",
                error: "Falta el parámetro 'q' o 'url'",
                buscar: "/search/anime?q=naruto",
                descargar: "/search/anime?url=URL_EPISODIO"
            });
        }

        try {
            const { data } = await axios.get(
                `https://www3.animeflv.net/browse?q=${encodeURIComponent(query)}`,
                { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 8000 }
            );
            
            const $ = cheerio.load(data);
            const resultados = [];
            
            $('.ListAnimes li, article').each((i, el) => {
                if (i >= 15) return;
                const titulo = $(el).find('.Title, h3').first().text().trim();
                const link = $(el).find('a').attr('href') || '';
                const img = $(el).find('img').attr('src') || '';
                const tipo = $(el).find('.Type').first().text().trim();
                
                if (titulo) {
                    resultados.push({
                        titulo,
                        tipo: tipo || 'TV',
                        imagen: img.startsWith('http') ? img : 'https://www3.animeflv.net' + img,
                        link: link.startsWith('http') ? link : 'https://www3.animeflv.net' + link
                    });
                }
            });

            return res.json({
                status: true,
                creator: "EL VIGILANTE",
                query: query,
                total: resultados.length,
                resultados
            });

        } catch (error) {
            return res.status(500).json({
                status: false,
                creator: "EL VIGILANTE",
                error: "Error en la búsqueda"
            });
        }
    });

};