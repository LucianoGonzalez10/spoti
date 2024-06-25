const clientId = '649514248a3c4b928d6d6e880206e1db';
const clientSecret = '8b861e27912343a892db9f9aa55c8a76'; 
const redirectUri = 'http://127.0.0.1:5500/index.html';
const scopes = 'playlist-read-private playlist-modify-public user-library-read';

let accessToken = null;

function iniciarSesionSpotify() {
    const url = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;
    window.location.href = url;
}

async function obtenerToken(codigoAutorizacion) {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
        },
        body: `grant_type=authorization_code&code=${codigoAutorizacion}&redirect_uri=${encodeURIComponent(redirectUri)}`
    });

    const data = await response.json();
    accessToken = data.access_token; 
    setTimeout(() => { accessToken = null; }, data.expires_in * 1000); 
    return accessToken;
}

async function buscarCanciones() {
    const query = document.getElementById('buscar').value;

    if (!accessToken) {
        const urlParams = new URLSearchParams(window.location.search);
        const codigoAutorizacion = urlParams.get('code');
        await obtenerToken(codigoAutorizacion);
    }

    try {
        const response = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const data = await response.json();
        mostrarResultados(data.tracks.items);
    } catch (error) {
        console.error('Error al buscar canciones:', error);
    }
}

function mostrarResultados(canciones) {
    const resultados = document.getElementById('resultados');
    resultados.innerHTML = '';

    canciones.forEach(cancion => {
        const div = document.createElement('div');
        div.className = 'cancion';
        div.innerHTML = `
            <p>${cancion.name} - ${cancion.artists[0].name}</p>
            <button onclick="reproducirCancion('${cancion.id}')">Reproducir</button>
        `;
        resultados.appendChild(div);
    });
}

function reproducirCancion(id) {
    const player = document.createElement('iframe');
    player.src = `https://open.spotify.com/embed/track/${id}`;
    player.width = '300';
    player.height = '80';
    player.frameBorder = '0';
    player.allow = 'encrypted-media';
    document.body.appendChild(player);
}