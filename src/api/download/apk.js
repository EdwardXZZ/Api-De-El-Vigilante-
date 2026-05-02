const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const BASE = 'https://apkcombo.com';

async function searchApk(query, limit = 5) {
    try {
        const url = `${BASE}/es/search?q=${encodeURIComponent(query)}`;
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': UA,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3'
            },
            timeout: 15000
        });
        const $ = cheerio.load(data);
        const results = [];

        $('.card, .search-result, .media').each((i, el) => {
            if (results.length >= limit) return false;
            const linkEl = $(el).find('a').first();
            let link = linkEl.attr('href');
            if (!link) return;
            if (link.startsWith('/')) link = BASE + link;
            const name = $(el).find('.title, h4').first().text().trim();
            const version = $(el).find('.version, .version-text').first().text().trim();
            const size = $(el).find('.size, .file-size').first().text().trim();
            if (name && link) results.push({ name, link, version, size, fuente: 'APKCombo' });
        });

        if (results.length === 0) throw new Error('No se encontraron resultados');
        return results;
    } catch (err) {
        throw new Error(`Error en búsqueda: ${err.message}`);
    }
}

async function getDownloadUrl(apkUrl) {
    try {
        const { data } = await axios.get(apkUrl, { headers: { 'User-Agent': UA }, timeout: 15000 });
        const $ = cheerio.load(data);
        let downloadLink = null;

        const selectors = [
            'a.download-button', 'a[download]', '.btn-download', 'a:contains("Download APK")',
            'a[href*="download"]', 'a[href*=".apk"]'
        ];
        for (const sel of selectors) {
            const el = $(sel).first();
            const href = el.attr('href');
            if (href && (href.startsWith('http') || href.startsWith('/'))) {
                downloadLink = href.startsWith('/') ? BASE + href : href;
                break;
            }
        }

        if (!downloadLink) {
            const scripts = $('script').map((i, el) => $(el).html()).get();
            for (const script of scripts) {
                const match = script.match(/https?:\/\/[^\s"']+\.apk/i);
                if (match) {
                    downloadLink = match[0];
                    break;
                }
            }
        }

        if (!downloadLink) throw new Error('No se encontró enlace de descarga');
        return { url: downloadLink };
    } catch (err) {
        throw new Error(`Error obteniendo descarga: ${err.message}`);
    }
}

module.exports = function(app) {
    app.get('/apk/search', async (req, res) => {
        const query = req.query.q;
        const limit = parseInt(req.query.limit) || 5;
        if (!query) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "Falta el parámetro 'q'",
                usage: "/apk/search?q=whatsapp&limit=5"
            });
        }
        try {
            const results = await searchApk(query, Math.min(limit, 10));
            res.json({
                status: true,
                creator: "DVLYONN",
                query: query,
                total: results.length,
                result: results
            });
        } catch (error) {
            res.status(500).json({
                status: false,
                creator: "DVLYONN",
                error: error.message
            });
        }
    });
    
    app.get('/apk/download', async (req, res) => {
        const url = req.query.url;
        if (!url) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "Falta el parámetro 'url'"
            });
        }
        try {
            const downloadInfo = await getDownloadUrl(url);
            if (req.query.download === 'true') {
                return res.redirect(downloadInfo.url);
            }
            res.json({
                status: true,
                creator: "DVLYONN",
                result: { url: downloadInfo.url }
            });
        } catch (error) {
            res.status(500).json({
                status: false,
                creator: "DVLYONN",
                error: error.message
            });
        }
    });
};