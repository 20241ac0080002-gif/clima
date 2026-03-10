const API_KEY = "14e1f930677171133a7e7d358a47fbbd";

window.onload = function() {
    renderizarHistorico();
    const climaSalvo = localStorage.getItem('clima_cache');
    if (climaSalvo) {
        renderizarClima(JSON.parse(climaSalvo));
    }
};

// --- DESAFIO NÍVEL 1: HISTÓRICO DAS ÚLTIMAS 5 ---
function salvarNoHistorico(cidade) {
    let cidades = JSON.parse(localStorage.getItem('historico_cidades')) || [];
    
    // Remove a cidade se ela já existir (para não duplicar) e adiciona no início
    cidades = cidades.filter(c => c.toLowerCase() !== cidade.toLowerCase());
    cidades.unshift(cidade);
    
    // Mantém apenas as 5 últimas
    cidades = cidades.slice(0, 5);
    
    localStorage.setItem('historico_cidades', JSON.stringify(cidades));
    renderizarHistorico();
}

function renderizarHistorico() {
    const container = document.getElementById('historico');
    const cidades = JSON.parse(localStorage.getItem('historico_cidades')) || [];
    
    container.innerHTML = cidades.map(cidade => 
        `<button class="btn-hist" onclick="buscarClimaPeloNome('${cidade}')">${cidade}</button>`
    ).join('');
}

// Auxiliar para os botões do histórico
function buscarClimaPeloNome(cidade) {
    document.getElementById('cidade-input').value = cidade;
    buscarClima();
}

// --- DESAFIO NÍVEL 2: GEOLOCALIZAÇÃO ---
function pegarLocalizacao() {
    if (navigator.geolocation) {
        document.getElementById('resultado').innerHTML = "<p class='loading-text'>Acessando GPS...</p>";
        navigator.geolocation.getCurrentPosition(pos => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            chamadaApi(`lat=${lat}&lon=${lon}`);
        }, () => {
            alert("Não foi possível acessar sua localização. Verifique as permissões do navegador.");
            document.getElementById('resultado').innerHTML = "";
        });
    } else {
        alert("Seu navegador não suporta geolocalização.");
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

        // Salva a última pesquisa principal
        localStorage.setItem('clima_cache', JSON.stringify(dados));
        
        // Salva no histórico de botões rápidos
        salvarNoHistorico(dados.name);
        
        renderizarClima(dados);
    } catch (erro) {
        resultadoDiv.innerHTML = `<p class="error-message">Erro: ${erro.message === 'city not found' ? 'Cidade não encontrada' : erro.message}</p>`;
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
            <div style="margin-top: 15px; font-size: 0.85rem; color: #64748b;">
                Mín: ${Math.round(dados.main.temp_min)}°C | Máx: ${Math.round(dados.main.temp_max)}°C<br>
                Umidade: ${dados.main.humidity}% | Vento: ${dados.wind.speed}km/h
            </div>
        </div>
    `;
}