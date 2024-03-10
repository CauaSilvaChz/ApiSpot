const APIController = (function() {
    
    // Tokens para poder acessar a api
    const clientId = '58eac10086c742faae41465b25cf8ada';
    const clientSecret = '016df420469d4837a25b152c7d571b79';

    const _getToken = async () => {

        const result = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type' : 'application/x-www-form-urlencoded', 
                'Authorization' : 'Basic ' + btoa(clientId + ':' + clientSecret)
            },
            body: 'grant_type=client_credentials'
        });

        const data = await result.json();
        return data.access_token;
    }
    
    // Buscando os generos musicais
    const _getGenres = async (token) => {

        const result = await fetch(`https://api.spotify.com/v1/browse/categories?locale=sv_US`, {
            method: 'GET',
            headers: { 'Authorization' : 'Bearer ' + token}
        });

        const data = await result.json();
        return data.categories.items;
    }

    // Buscando playlist de acordo com o genero escolhido
    const _getPlaylistByGenre = async (token, genreId) => {

        // Quantidade de playlists por genero
        const limit = 15;
        
        const result = await fetch(`https://api.spotify.com/v1/browse/categories/${genreId}/playlists?limit=${limit}`, {
            method: 'GET',
            headers: { 'Authorization' : 'Bearer ' + token}
        });

        const data = await result.json();
        return data.playlists.items;
    }


    // Buscando as musicas de acordo com a playlist escolhida
    const _getTracks = async (token, tracksEndPoint) => {

        // Limite de musicas por playlist
        const limit = 10;

        const result = await fetch(`${tracksEndPoint}?limit=${limit}`, {
            method: 'GET',
            headers: { 'Authorization' : 'Bearer ' + token}
        });

        const data = await result.json();
        return data.items;
    }

    const _getTrack = async (token, trackEndPoint) => {

        const result = await fetch(`${trackEndPoint}`, {
            method: 'GET',
            headers: { 'Authorization' : 'Bearer ' + token}
        });

        const data = await result.json();
        return data;
    }

    return {
        getToken() {
            return _getToken();
        },
        getGenres(token) {
            return _getGenres(token);
        },
        getPlaylistByGenre(token, genreId) {
            return _getPlaylistByGenre(token, genreId);
        },
        getTracks(token, tracksEndPoint) {
            return _getTracks(token, tracksEndPoint);
        },
        getTrack(token, trackEndPoint) {
            return _getTrack(token, trackEndPoint);
        }
    }
})();


const UIController = (function() {

    //Objeto para armazenar os seletores do HTML
    const DOMElements = {
        selectGenre: '#select_genre',
        selectPlaylist: '#select_playlist',
        buttonSubmit: '#btn_submit',
        divSongDetail: '#song-detail',
        hfToken: '#hidden_token',
        divSonglist: '.song-list'
    }

    return {

        // Pegando as entradas do usuario
        inputField() {
            return {
                genre: document.querySelector(DOMElements.selectGenre),
                playlist: document.querySelector(DOMElements.selectPlaylist),
                tracks: document.querySelector(DOMElements.divSonglist),
                submit: document.querySelector(DOMElements.buttonSubmit),
                songDetail: document.querySelector(DOMElements.divSongDetail)
            }
        },

        // Criando as listas de opções
        createGenre(text, value) {
            const html = `<option value="${value}">${text}</option>`;
            document.querySelector(DOMElements.selectGenre).insertAdjacentHTML('beforeend', html);
        }, 

        createPlaylist(text, value) {
            const html = `<option value="${value}">${text}</option>`;
            document.querySelector(DOMElements.selectPlaylist).insertAdjacentHTML('beforeend', html);
        },

        // Criando lista de musicas 
        createTrack(id, name) {
            const html = `<a href="#" class="list-group-item list-group-item-action list-group-item-light" id="${id}">${name}</a>`;
            document.querySelector(DOMElements.divSonglist).insertAdjacentHTML('beforeend', html);
        },

        // Criando informações da musica
        createTrackDetail(img, title, artist) {

            const detailDiv = document.querySelector(DOMElements.divSongDetail);
            detailDiv.innerHTML = '';

            const html = 
            `
            <div class="row col-sm-12 px-0">
                <img src="${img}" alt="">        
            </div>
            <div class="row col-sm-12 px-0">
                <label for="Genre" class="form-label col-sm-12">${title}:</label>
            </div>
            <div class="row col-sm-12 px-0">
                <label for="artist" class="form-label col-sm-12">By ${artist}:</label>
            </div> 
            `;

            detailDiv.insertAdjacentHTML('beforeend', html)
        },

        resetTrackDetail() {
            this.inputField().songDetail.innerHTML = '';
        },

        resetTracks() {
            this.inputField().tracks.innerHTML = '';
            this.resetTrackDetail();
        },

        resetPlaylist() {
            this.inputField().playlist.innerHTML = '';
            this.resetTracks();
        },
        
        storeToken(value) {
            document.querySelector(DOMElements.hfToken).value = value;
        },

        getStoredToken() {
            return {
                token: document.querySelector(DOMElements.hfToken).value
            }
        }
    }

})();

const APPController = (function(UICtrl, APICtrl) {

    const DOMInputs = UICtrl.inputField();

    // Buscando generos ao carregar a pagina
    const loadGenres = async () => {
        // Pegando o token
        const token = await APICtrl.getToken();           
        // Armazenando o token
        UICtrl.storeToken(token);
        // Pegando os generos
        const genres = await APICtrl.getGenres(token);

        genres.forEach(element => UICtrl.createGenre(element.name, element.id));
    }

    // Criando evento de mudança de escolha do genero musical
    DOMInputs.genre.addEventListener('change', async () => {
        // Reseta a playlist
        UICtrl.resetPlaylist();
        // Pega o token que foi armazenado
        const token = UICtrl.getStoredToken().token;        
        // Pega o genero selecionado
        const genreSelect = UICtrl.inputField().genre;       
        const genreId = genreSelect.options[genreSelect.selectedIndex].value;             
        // Pega a playlist baseado em um genero
        const playlist = await APICtrl.getPlaylistByGenre(token, genreId);       
        // Cria uma lista de itens para cada playlist
        playlist.forEach(p => UICtrl.createPlaylist(p.name, p.tracks.href));
    });
     

    // Botao para acionar evento
    DOMInputs.submit.addEventListener('click', async (e) => {
        // Prevent para a paginar nao recarregar
        e.preventDefault();
        // Reseta as musicas
        UICtrl.resetTracks();
        // Pega o token que foi armazenado
        const token = UICtrl.getStoredToken().token;        

        const playlistSelect = UICtrl.inputField().playlist;
        // Busca o endpoint de acordo com a playlist selecionada
        const tracksEndPoint = playlistSelect.options[playlistSelect.selectedIndex].value;
        // Busca lista de musicas
        const tracks = await APICtrl.getTracks(token, tracksEndPoint);
        // Cria lista de musicas
        tracks.forEach(el => UICtrl.createTrack(el.track.href, el.track.name))
        
    });

    // Botao para acionar evento
    DOMInputs.tracks.addEventListener('click', async (e) => {
        // Prevent para a paginar nao recarregar
        e.preventDefault();
        UICtrl.resetTrackDetail();
        // Pega o token que foi armazenado
        const token = UICtrl.getStoredToken().token;
        // Endpoint da musica
        const trackEndpoint = e.target.id;
        // Pega o objeto de musica
        const track = await APICtrl.getTrack(token, trackEndpoint);
        // Carrega as informações da musica
        UICtrl.createTrackDetail(track.album.images[2].url, track.name, track.artists[0].name);
    });    

    return {
        init() {
            console.log('App is starting');
            loadGenres();
        }
    }

})(UIController, APIController);

// Chamando a função
APPController.init();




