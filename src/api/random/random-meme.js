const axios = require('axios');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const FUENTES = [
    {
        nombre: 'Reddit',
        obtener: async () => {
            const subreddits = ['MemesES', 'spanishmemes', 'LATAMmemes', 'dankespanol'];
            const randomSub = subreddits[Math.floor(Math.random() * subreddits.length)];
            const url = `https://www.reddit.com/r/${randomSub}/.json?limit=30`;
            const response = await axios.get(url, { headers: { 'User-Agent': UA } });
            const posts = response.data.data.children;
            const memes = posts.filter(p => {
                const url = p.data.url;
                return url && (url.endsWith('.jpg') || url.endsWith('.png') || url.endsWith('.jpeg') || url.endsWith('.gif') || url.endsWith('.webp'));
            });
            if (memes.length === 0) throw new Error('No hay memes en Reddit');
            const random = memes[Math.floor(Math.random() * memes.length)].data;
            return {
                titulo: random.title,
                url: random.url,
                votos: random.ups || 0,
                comentarios: random.num_comments || 0,
                autor: random.author || 'Anónimo',
                fuente: 'Reddit'
            };
        }
    },
    {
        nombre: 'Pinterest',
        obtener: async () => {
            const query = 'memes graciosos español';
            const url = `https://www.pinterest.com/resource/BaseSearchResource/get/?source_url=%2Fsearch%2Fpins%2F%3Fq%3D${encodeURIComponent(query)}&data=%7B%22options%22%3A%7B%22query%22%3A%22${encodeURIComponent(query)}%22%2C%22scope%22%3A%22pins%22%2C%22page_size%22%3A50%7D%7D`;
            const response = await axios.get(url, {
                headers: { 'User-Agent': UA, 'Accept': 'application/json' }
            });
            const results = response.data.resource_response?.data?.results;
            if (!results || results.length === 0) throw new Error('No hay memes en Pinterest');
            const memes = results.filter(item => item.images?.orig?.url);
            if (memes.length === 0) throw new Error('No hay memes en Pinterest');
            const random = memes[Math.floor(Math.random() * memes.length)];
            return {
                titulo: random.title || 'Meme divertido',
                url: random.images.orig.url,
                votos: random.like_count || 0,
                comentarios: random.comment_count || 0,
                autor: random.pinner?.username || 'Anónimo',
                fuente: 'Pinterest'
            };
        }
    },
    {
        nombre: 'Imgflip',
        obtener: async () => {
            const url = 'https://api.imgflip.com/get_memes';
            const response = await axios.get(url);
            if (!response.data.success) throw new Error('Error en Imgflip');
            const memes = response.data.data.memes;
            const random = memes[Math.floor(Math.random() * memes.length)];
            return {
                titulo: random.name,
                url: random.url,
                votos: 0,
                comentarios: 0,
                autor: 'Imgflip',
                fuente: 'Imgflip'
            };
        }
    }
];

async function getRandomMeme() {
    for (const fuente of FUENTES) {
        try {
            const meme = await fuente.obtener();
            return meme;
        } catch (error) {
            console.log(`Fuente ${fuente.nombre} falló:`, error.message);
            continue;
        }
    }
    throw new Error('Todas las fuentes fallaron');
}

module.exports = function(app) {
    app.get('/random/meme', async (req, res) => {
        try {
            const meme = await getRandomMeme();
            
            if (req.query.imagen === 'true' || req.query.download === 'true') {
                return res.redirect(meme.url);
            }
            
            return res.status(200).json({
                status: true,
                creador: "DVLYONN",
                resultado: {
                    titulo: meme.titulo,
                    url: meme.url,
                    votos: meme.votos,
                    comentarios: meme.comentarios,
                    autor: meme.autor,
                    fuente: meme.fuente,
                    creado: new Date().toLocaleDateString('es-ES')
                }
            });
        } catch (error) {
            console.error('Meme error:', error.message);
            return res.status(500).json({
                status: false,
                creador: "DVLYONN",
                error: error.message
            });
        }
    });
};