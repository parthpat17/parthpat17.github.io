/* ==================== CONFIG ==================== */
const API_KEY = 'demo';   // <-- Free demo key (works for testing). Get your own at polygon.io for more calls.
let nodes = [];

/* ==================== DOM ==================== */
const tickerInput = document.getElementById('ticker-input');
const loadBtn     = document.getElementById('load-btn');
const statusEl    = document.getElementById('data-status');

/* ==================== HELPERS ==================== */
function setStatus(msg, isError = false) {
    statusEl.textContent = msg;
    statusEl.style.color = isError ? '#ff6b6b' : '#FFD700';
}

/* ==================== FETCH & SIMULATE ==================== */
async function loadData() {
    const raw = tickerInput.value.trim().toUpperCase();
    const symbol = raw || 'AAPL';
    
    // Dynamic date range: Last 30 days from today (Oct 30, 2025)
    const today = new Date('2025-10-30');
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    const fromDate = thirtyDaysAgo.toISOString().split('T')[0];
    const toDate = today.toISOString().split('T')[0];
    
    setStatus(`Fetching ${symbol} data from ${fromDate} to ${toDate}…`);

    try {
        const resp = await fetch(
            `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${fromDate}/${toDate}?adjusted=true&apiKey=${API_KEY}`
        );
        const data = await resp.json();

        if (!data.results || data.results.length === 0) {
            throw new Error(`No data for ${symbol}. Try a valid ticker like AAPL or TSLA.`);
        }

        const closes = data.results.map(r => r.c);
        const minP = Math.min(...closes);
        const maxP = Math.max(...closes);
        const range = maxP - minP || 1;

        // ---- generate 12 readable nodes ----
        nodes = [];
        for (let i = 0; i < 12; i++) {
            const price = minP + range * (i / 11);
            const strength = (Math.random() - 0.5) * 22; // -11 … +11
            const type = Math.random() > 0.5 ? 'yellow' : 'purple';
            nodes.push({ price: +price.toFixed(2), strength: +strength.toFixed(1), type });
        }

        setStatus(`${symbol} loaded successfully – Price range: $${minP.toFixed(2)} → $${maxP.toFixed(2)}`);
        drawHeatmap();
    } catch (e) {
        console.error('API Error:', e); // For debugging in browser console (F12)
        
        // ---- fallback demo ----
        nodes = [
            { price: 220.5, strength:  9.2, type: 'yellow' },
            { price: 225.1, strength: -12.4, type: 'purple' },
            { price: 230.3, strength:  6.1, type: 'yellow' },
            { price: 235.7, strength: -8.7, type: 'purple' },
            { price: 240.2, strength:  11.0, type: 'yellow' }
        ];
        
        let errorMsg = `API issue (key: ${API_KEY}). `;
        if (API_KEY === 'demo') {
            errorMsg += 'Demo key works but has limits—get a free personal key at polygon.io for more data.';
        } else {
            errorMsg += 'Check your key at polygon.io/dashboard/api-keys.';
        }
        errorMsg += ' Showing demo nodes for now.';
        
        setStatus(errorMsg, true);
        drawHeatmap();
    }
}

/* ==================== DRAW HEATMAP ==================== */
function drawHeatmap() {
    const canvas = document.getElementById('heatmap');
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // ---- clear ----
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, w, h);

    // ---- axes ----
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 20);
    ctx.lineTo(80, h - 60);
    ctx.lineTo(w - 40, h - 60);
    ctx.stroke();

    // axis labels
    ctx.fillStyle = '#aaa';
    ctx.font = '14px Arial';
    ctx.fillText('Price ($)', 10, h/2);
    ctx.save();
    ctx.translate(w/2, h - 20);
    ctx.rotate(-Math.PI/2);
    ctx.fillText('Strength', 0, 0);
    ctx.restore();

    // ---- price range ----
    const priceMin = Math.min(...nodes.map(n=>n.price));
    const priceMax = Math.max(...nodes.map(n=>n.price));
    const priceRange = priceMax - priceMin || 1;

    // ---- draw each node ----
    nodes.forEach(node => {
        // Y = price
        const y = h - 60 - ((node.price - priceMin) / priceRange) * (h - 100);
        // X = strength (centered, scaled)
        const strengthScale = (w - 120) / 44; // ±22 max
        const x = 80 + (node.strength + 22) * strengthScale;

        // colour gradient
        const grad = ctx.createRadialGradient(x, y, 0, x, y, 35);
        if (node.type === 'yellow') {
            grad.addColorStop(0, '#FFFF00');
            grad.addColorStop(1, '#FFD700');
        } else {
            grad.addColorStop(0, '#DDA0DD');
            grad.addColorStop(1, '#4B0082');
        }
        ctx.fillStyle = grad;

        const radius = 20 + Math.abs(node.strength) * 1.2; // bigger = stronger
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI*2);
        ctx.fill();

        // strength label (big)
        ctx.fillStyle = node.strength >= 0 ? '#fff' : '#ff5555';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(node.strength, x, y + 6);

        // price label (below)
        ctx.fillStyle = '#ddd';
        ctx.font = '14px Arial';
        ctx.fillText(`$${node.price}`, x, y + radius + 18);
    });

    // ---- current price line (optional) ----
    const latestPrice = nodes[nodes.length-1].price;
    const ly = h - 60 - ((latestPrice - priceMin) / priceRange) * (h - 100);
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.setLineDash([5,5]);
    ctx.beginPath();
    ctx.moveTo(80, ly);
    ctx.lineTo(w-40, ly);
    ctx.stroke();
    ctx.setLineDash([]);
}

/* ==================== EVENTS ==================== */
loadBtn.addEventListener('click', loadData);
tickerInput.addEventListener('keydown', e => { if (e.key === 'Enter') loadData(); });

window.addEventListener('load', () => {
    tickerInput.value = 'AAPL';
    loadData();
});
