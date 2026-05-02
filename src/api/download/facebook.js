const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function facebookDownload(url) {
    const formData = new URLSearchParams();
    formData.append('URLz', url);
    const response = await axios.post('https://fdown.net/download.php', formData.toString(), {
        headers: {
            'User-Agent': UA,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': 'https://fdown.net/',
            'Origin': 'https://fdown.net'
        }
    });
    const $ = cheerio.load(response.data);
    const downloadLinks = [];
    $('a').each((i, el) => {
        const href = $(el).attr('href');
        if (href && href.includes('.mp4')) {
            downloadLinks.push(href);
        }
    });
    if (!downloadLinks.length) throw new Error('No se encontró enlace de video');
    const title = $('title').text().replace('Download Facebook Video', '').trim() || 'Facebook Video';
    const thumbnail = $('meta[property="og:image"]').attr('content') || '';
    const videos = downloadLinks.slice(0, 2).map((link, idx) => ({
        quality: idx === 0 ? 'HD' : 'SD',
        url: link
    }));
    return { title, thumbnail, videos };
}

module.exports = function(app) {
    app.get('/download/facebook', async (req, res) => {
        const url = req.query.url;
        if (!url) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "Falta el parámetro 'url'",
                usage: "/download/facebook?url=URL_DEL_VIDEO"
            });
        }
        try {
            const result = await facebookDownload(url);
            if (req.query.download === 'true') {
                return res.redirect(result.videos[0].url);
            }
            return res.json({
                status: true,
                creator: "DVLYONN",
                result
            });
        } catch (err) {
            console.error('[Facebook Scraper Error]', err.message);
            res.status(500).json({
                status: false,
                creator: "DVLYONN",
                error: err.message
            });
        }
    });
};