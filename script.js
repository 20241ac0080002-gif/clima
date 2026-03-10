const API_KEY = "14e1f930677171133a7e7d358a47fbbd";
let mapa = null; // Variável global para o mapa
let marcador = null; // Variável global para o marcador

window.onload = function() {
    renderizarHistorico();
    const climaSalvo = localStorage.getItem('clima_cache');
    if (climaSalvo) {
        const dados = JSON.parse(climaSalvo);
        renderizarClima(dados);
        atualizarMapa(dados.coord.lat, dados.coord.lon, dados.name);
    }
};

// --- FUNÇÃO PARA O MAPA ---
function atualizarMapa(lat, lon, nomeCidade) {
    const mapaDiv = document.getElementById('mapa');
    mapaDiv.style.display = "block"; // Mostra o mapa

    // Se o mapa ainda não existe, cria ele
    if (mapa === null) {
        mapa = L.map('mapa').setView([lat, lon], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(mapa);
        marcador = L.marker([lat, lon]).addTo(mapa);
    } else {
        // Se já existe, apenas move a visão e o marcador
        mapa.setView([lat, lon], 12);
        marcador.setLatLng([lat, lon]);
    }
    marcador.bindPopup(`<b>${nomeCidade}</b>`).openPopup();
}

// --- HISTÓRICO ---
function salvarNoHistorico(cidade) {
    let cidades = JSON.parse(localStorage.getItem('historico_cidades')) || [];
    cidades = cidades.filter(c => c.toLowerCase() !== cidade.toLowerCase());
    cidades.unshift(cidade);
    cidades = cidades.slice(0, 5);
    localStorage.setItem('historico_cidades', JSON.stringify(cidades));
    renderizarHistorico();
}

function renderizarHistorico() {
    const container = document.getElementById('historico');
    const cidades = JSON.parse(localStorage.getItem('historico_cidades')) || [];
    container.innerHTML = cidades.map(c => 
        `<button class="btn-hist" onclick="buscarClimaPeloNome('${c}')">${c}</button>`
    ).join('');
}

function buscarClimaPeloNome(cidade) {
    document.getElementById('cidade-input').value = cidade;
    buscarClima();
}

// --- BUSCA E GEOLOCALIZAÇÃO ---
function pegarLocalizacao() {
    if (navigator.geolocation) {
        document.getElementById('resultado').innerHTML = "<p class='loading-text'>Acessando GPS...</p>";
        navigator.geolocation.getCurrentPosition(pos => {
            chamadaApi(`lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
        });
    }
}

async function buscarClima() {
    const cidade = document.getElementById('cidade-input').value.trim();
    if (!cidade) return alert("Digite uma cidade!");
    chamadaApi(`q=${cidade}`);
}

async function chamadaApi(parametro) {
    const resultadoDiv = document.getElementById('resultado');
    resultadoDiv.innerHTML = "<p class='loading-text'>Consultando satélites...</p>";

    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?${parametro}&appid=${API_KEY}&units=metric&lang=pt_br`;
        const response = await fetch(url);
        const dados = await response.json();

        if (!response.ok) throw new Error(dados.message);

        localStorage.setItem('clima_cache', JSON.stringify(dados));
        salvarNoHistorico(dados.name);
        renderizarClima(dados);
        
        // CHAMA O MAPA COM AS COORDENADAS DA API
        atualizarMapa(dados.coord.lat, dados.coord.lon, dados.name);

    } catch (erro) {
        resultadoDiv.innerHTML = `<p class="error-message">Erro: Cidade não encontrada</p>`;
        document.getElementById('mapa').style.display = "none";
    }
}

function renderizarClima(dados) {
    const resultadoDiv = document.getElementById('resultado');
    const iconeUrl = `https://openweathermap.org/img/wn/${dados.weather[0].icon}@2x.png`;

    resultadoDiv.innerHTML = `
        <div class="weather-card">
            <span class="city-title">📍 ${dados.name}, ${dados.sys.country}</span>
            <img class="weather-icon" src="${iconeUrl}" alt="Clima">
            <div class="temp-main">${Math.round(dados.main.temp)}°C</div>
            <p class="description">${dados.weather[0].description}</p>
            <div style="margin-top: 10px; font-size: 0.85rem; color: #64748b;">
                Umidade: ${dados.main.humidity}% | Vento: ${dados.wind.speed}km/h
            </div>
        </div>
    `;
}