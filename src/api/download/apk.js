const axios = require('axios');

const APTOIDE_API = 'https://ws75.aptoide.com/api/7/apps/search';

module.exports = function(app) {
    app.get('/apk/search', async (req, res) => {
        const query = req.query.q;
        const limit = Math.min(parseInt(req.query.limit) || 5, 10);

        if (!query) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "Falta el parámetro 'q'",
                usage: "/apk/search?q=whatsapp&limit=5"
            });
        }

        try {
            const response = await axios.get(APTOIDE_API, {
                params: { query, limit },
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            const data = response.data;
            if (data.info?.status !== 'OK' || !data.datalist?.list?.length) {
                throw new Error('No se encontraron resultados');
            }

            const results = data.datalist.list.slice(0, limit).map(app => ({
                name: app.name,
                package: app.package,
                version: app.file?.vername || 'N/A',
                size: app.size ? `${Math.round(app.size / (1024 * 1024))} MB` : 'N/A',
                icon: app.icon,
                download_url: app.file?.path || null,
                source: 'Aptoide'
            }));

            res.json({ status: true, creator: "DVLYONN", query, total: results.length, result: results });
        } catch (error) {
            console.error('Error en /apk/search:', error.message);
            res.status(500).json({ status: false, creator: "DVLYONN", error: error.message });
        }
    });

    app.get('/apk/download', async (req, res) => {
        const url = req.query.url;
        if (!url) return res.status(400).json({ status: false, creator: "DVLYONN", error: "Falta el parámetro 'url'" });

        try {
            if (req.query.download === 'true') return res.redirect(url);
            res.json({ status: true, creator: "DVLYONN", result: { url } });
        } catch (error) {
            res.status(500).json({ status: false, creator: "DVLYONN", error: error.message });
        }
    });
};