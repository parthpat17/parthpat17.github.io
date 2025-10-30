// Free Polygon.io integration (get key at polygon.io)
const API_KEY = 'YOUR_API_KEY'; // Replace with your free key
let nodes = [];

// Fetch real price data and simulate nodes based on user-entered ticker
async function loadData() {
    const tickerInput = document.getElementById('ticker-input').value.toUpperCase();
    const SYMBOL = tickerInput || 'AAPL'; // Default to AAPL if empty
    const statusElement = document.getElementById('data-status');

    if (!tickerInput) {
        statusElement.textContent = 'No ticker entered, using AAPL as default...';
    }

    try {
        statusElement.textContent = `Loading data for ${SYMBOL}...`;
        const response = await fetch(`https://api.polygon.io/v2/aggs/ticker/${SYMBOL}/range/1/day/2025-10-01/2025-10-30?apiKey=${API_KEY}`);
        const data = await response.json();
        if (data.results) {
            const prices = data.results.map(r => r.c); // Closing prices
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            const range = maxPrice - minPrice;

            // Simulate 10 nodes based on price levels
            nodes = [];
            for (let i = 0; i < 10; i++) {
                const price = minPrice + (range * i / 10);
                const strength = (Math.random() - 0.5) * 20; // -10 to +10
                const type = Math.random() > 0.5 ? 'yellow' : 'purple';
                nodes.push({ price, strength, type });
            }

            statusElement.textContent = `Loaded data for ${SYMBOL} (Price range: $${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)})`;
            drawHeatmap();
        } else {
            throw new Error('No data');
        }
    } catch (error) {
        // Fallback simulation
        nodes = [
            { price: 220, strength: 8, type: 'yellow' },
            { price: 225, strength: -12, type: 'purple' },
            { price: 230, strength: 5, type: 'yellow' },
        ];
        statusElement.textContent = `Error loading ${SYMBOL} data. Using demo data (API key needed for real data)`;
        drawHeatmap();
    }
}

// Draw gradient nodes on canvas (y-axis: price levels)
function drawHeatmap() {
    const canvas = document.getElementById('heatmap');
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    // Draw price axis
    ctx.strokeStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(50, 0);
    ctx.lineTo(50, height);
    ctx.lineTo(width, height);
    ctx.stroke();

    // Draw nodes as gradient circles
    nodes.sort((a, b) => a.price - b.price);
    nodes.forEach((node, i) => {
        const x = 60 + (i * 70); // Horizontal spacing
        const y = height - ((node.price - Math.min(...nodes.map(n => n.price))) / (Math.max(...nodes.map(n => n.price)) - Math.min(...nodes.map(n => n.price))) * height);
        
        // Gradient color
        let color;
        if (node.type === 'yellow') {
            const grad = ctx.createRadialGradient(x, y, 0, x, y, 30);
            grad.addColorStop(0, '#FFFF00');
            grad.addColorStop(1, '#FFD700');
            color = grad;
        } else {
            const grad = ctx.createRadialGradient(x, y, 0, x, y, 30);
            grad.addColorStop(0, '#8A2BE2');
            grad.addColorStop(1, '#4B0082');
            color = grad;
        }
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, Math.abs(node.strength) + 10, 0, 2 * Math.PI); // Size by strength
        ctx.fill();

        // Label
        ctx.fillStyle = '#FFF';
        ctx.font = '12px Arial';
        ctx.fillText(`${node.strength.toFixed(1)}`, x - 10, y - 10);
        ctx.fillText(node.price.toFixed(2), x - 20, y + 40);
    });
}

// Init on load (optional: load default ticker)
window.addEventListener('load', () => {
    document.getElementById('ticker-input').value = 'AAPL'; // Default ticker
    loadData();
});
