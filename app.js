const clientId = '649514248a3c4b928d6d6e880206e1db';
const clientSecret = '8b861e27912343a892db9f9aa55c8a76'; 
const redirectUri = 'https://lucianogonzalez10.github.io/spoti/buscador';
const scopes = 'playlist-read-private playlist-modify-public user-library-read';

function iniciarSesionSpotify() {
    const url = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;
    window.location.href = url;
}

async function obtenerToken(codigoAutorizacion) {
    try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
            },
            body: `grant_type=authorization_code&code=${codigoAutorizacion}&redirect_uri=${encodeURIComponent(redirectUri)}`
        });

        const data = await response.json();
        if (data.access_token) {
            sessionStorage.setItem('accessToken', data.access_token);
            setTimeout(() => { sessionStorage.removeItem('accessToken'); }, data.expires_in * 1000);
            return data.access_token;
        } else {
            console.error('Error al obtener el token:', data);
            return null;
        }
    } catch (error) {
        console.error('Error al obtener el token:', error);
        return null;
    }
}

async function buscarCanciones() {
    const query = document.getElementById('buscar').value;

    let accessToken = sessionStorage.getItem('accessToken');
    if (!accessToken) {
        const urlParams = new URLSearchParams(window.location.search);
        const codigoAutorizacion = urlParams.get('code');
        if (codigoAutorizacion) {
            accessToken = await obtenerToken(codigoAutorizacion);
        } else {
            iniciarSesionSpotify();
            return;
        }
    }

    if (!accessToken) {
        console.error('No se pudo obtener el token de acceso.');
        return;
    }

    try {
        const response = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const data = await response.json();
        if (data.tracks && data.tracks.items) {
            mostrarResultados(data.tracks.items);
        } else {
            console.error('Error en la búsqueda de canciones:', data);
        }
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

function cerrarSesionSpotify() {
    sessionStorage.removeItem('accessToken');
    iniciarSesionSpotify();
}
const botonCerrar = document.getElementById('cerrarSesion');
botonCerrar.addEventListener('click', cerrarSesionSpotify());

// Verificar si hay un código de autorización en la URL al cargar la página
window.onload = async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const codigoAutorizacion = urlParams.get('code');
    if (codigoAutorizacion && !sessionStorage.getItem('accessToken')) {
        const accessToken = await obtenerToken(codigoAutorizacion);
        if (accessToken) {
            // Remove the authorization code from the URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
}
