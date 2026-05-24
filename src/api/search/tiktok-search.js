const axios = require('axios');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function tiktokSearch(query, limit = 10) {
    const errors = [];
    
    // Fuente 1: tikwm.com
    try {
        const url = `https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(query)}&count=${Math.min(limit, 30)}`;
        const response = await axios.get(url, {
            headers: { 'User-Agent': UA },
            timeout: 10000
        });
        
        if (response.data?.data?.videos?.length) {
            return formatResponse(response.data.data.videos.slice(0, limit));
        }
    } catch (error) {
        errors.push(`tikwm: ${error.message}`);
    }
    
    // Fuente 2: ssstik.io (alternativa)
    try {
        const searchUrl = `https://ssstik.io/search?q=${encodeURIComponent(query)}`;
        const response = await axios.get(searchUrl, {
            headers: { 'User-Agent': UA },
            timeout: 10000
        });
        
        if (response.data && response.data.length) {
            return formatSSSTikResponse(response.data.slice(0, limit));
        }
    } catch (error) {
        errors.push(`ssstik: ${error.message}`);
    }
    
    // Fuente 3: musicallydown (alternativa)
    try {
        const formData = new URLSearchParams();
        formData.append('q', query);
        
        const response = await axios.post('https://musicallydown.com/search', formData, {
            headers: {
                'User-Agent': UA,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            timeout: 10000
        });
        
        if (response.data && response.data.results) {
            return formatMusicallyResponse(response.data.results.slice(0, limit));
        }
    } catch (error) {
        errors.push(`musicallydown: ${error.message}`);
    }
    
    throw new Error(`Todas las fuentes fallaron: ${errors.join(' | ')}`);
}

function formatResponse(videos) {
    return videos.map(video => ({
        id: video.video_id,
        title: video.title || 'Sin título',
        description: video.title || 'Sin descripción',
        duration: video.duration || 0,
        cover_url: video.cover || '',
        play_count: video.play_count || 0,
        digg_count: video.digg_count || 0,
        comment_count: video.comment_count || 0,
        share_count: video.share_count || 0,
        download_count: video.download_count || 0,
        music: {
            id: video.music?.music_id || '',
            title: video.music?.title || '',
            author: video.music?.author || ''
        },
        author: {
            id: video.author?.id || '',
            name: video.author?.unique_id || 'Desconocido',
            nickname: video.author?.nickname || 'Desconocido',
            avatar: video.author?.avatar || ''
        },
        url: `https://www.tiktok.com/@${video.author?.unique_id || 'user'}/video/${video.video_id}`,
        created_at: video.create_time || 0
    }));
}

function formatSSSTikResponse(items) {
    return items.map(item => ({
        id: item.id || Date.now().toString(),
        title: item.title || 'Sin título',
        description: item.title || 'Sin descripción',
        duration: item.duration || 0,
        cover_url: item.thumbnail || '',
        play_count: parseInt(item.views) || 0,
        digg_count: 0,
        comment_count: 0,
        share_count: 0,
        download_count: 0,
        music: { id: '', title: '', author: '' },
        author: {
            id: '',
            name: item.author || 'Desconocido',
            nickname: item.author || 'Desconocido',
            avatar: ''
        },
        url: item.url || '',
        created_at: 0
    }));
}

function formatMusicallyResponse(results) {
    return results.map(result => ({
        id: result.id || Date.now().toString(),
        title: result.title || 'Sin título',
        description: result.title || 'Sin descripción',
        duration: result.duration || 0,
        cover_url: result.thumbnail || '',
        play_count: parseInt(result.plays) || 0,
        digg_count: parseInt(result.likes) || 0,
        comment_count: parseInt(result.comments) || 0,
        share_count: 0,
        download_count: 0,
        music: { id: '', title: '', author: '' },
        author: {
            id: '',
            name: result.author || 'Desconocido',
            nickname: result.author || 'Desconocido',
            avatar: ''
        },
        url: result.url || '',
        created_at: 0
    }));
}

module.exports = function(app) {
    app.get('/search/tiktok', async (req, res) => {
        const query = req.query.query;
        
        if (!query) {
            return res.status(400).json({
                status: false,
                creator: "EL VIGILANTE",
                error: "Falta el parámetro 'query'",
                usage: "/search/tiktok?query=goku&limit=10"
            });
        }
        
        const limit = parseInt(req.query.limit) || 10;
        const maxLimit = Math.min(limit, 30);
        
        try {
            const results = await tiktokSearch(query, maxLimit);
            
            res.json({
                status: true,
                creator: "EL VIGILANTE",
                query: query,
                limit: maxLimit,
                total_results: results.length,
                result: results
            });
            
        } catch (err) {
            console.error('[TikTok Search Error]', err.message);
            res.status(500).json({
                status: false,
                creator: "EL VIGILANTE",
                error: err.message
            });
        }
    });
};