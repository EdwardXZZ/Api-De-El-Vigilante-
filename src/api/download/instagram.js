const axios = require('axios');

async function instagramDownload(url) {
    const shortcodeMatch = url.match(/instagram\.com\/(?:p|reel)\/([a-zA-Z0-9_-]+)/);
    if (!shortcodeMatch) throw new Error('URL inválida');
    const shortcode = shortcodeMatch[1];

    // Usamos el mismo método que el n8n Instagram Guest Scraper
    const { data } = await axios.get(`https://www.instagram.com/p/${shortcode}/?__a=1&__d=1`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
            'X-Requested-With': 'XMLHttpRequest'
        }
    });

    if (!data || !data.graphql || !data.graphql.shortcode_media) {
        throw new Error('No se pudo obtener el contenido');
    }

    const media = data.graphql.shortcode_media;
    let videoUrl = null;
    let imageUrl = null;

    if (media.video_url) {
        videoUrl = media.video_url;
    } else if (media.display_url) {
        imageUrl = media.display_url;
    } else if (media.edge_sidecar_to_children) {
        // Para carruseles, tomamos el primero
        const firstNode = media.edge_sidecar_to_children.edges[0]?.node;
        if (firstNode.video_url) videoUrl = firstNode.video_url;
        else if (firstNode.display_url) imageUrl = firstNode.display_url;
    }

    if (!videoUrl && !imageUrl) throw new Error('No se encontró contenido multimedia');

    return {
        type: videoUrl ? 'video' : 'image',
        url: videoUrl || imageUrl,
        caption: media.edge_media_to_caption?.edges[0]?.node?.text || 'Instagram Post',
        owner: media.owner?.username || 'Desconocido'
    };
}

module.exports = function(app) {
    app.get('/download/instagram', async (req, res) => {
        const url = req.query.url;
        if (!url) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "Falta el parámetro 'url'",
                usage: "/download/instagram?url=URL_DEL_POST"
            });
        }

        try {
            const result = await instagramDownload(url);
            if (req.query.download === 'true') {
                return res.redirect(result.url);
            }
            return res.json({
                status: true,
                creator: "DVLYONN",
                result: result
            });
        } catch (err) {
            console.error('[Instagram Error]', err.message);
            res.status(500).json({
                status: false,
                creator: "DVLYONN",
                error: err.message
            });
        }
    });
};