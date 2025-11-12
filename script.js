// Ensure a single global API base URL (may be set by other modules)
window.API_BASE_URL = window.API_BASE_URL || `${window.location.origin}/api`;

// Chart instances storage
let lineChart = null;
let barChart = null;
let pieChart = null;

// Initialize charts when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    await loadCharts();
});

async function loadCharts() {
    try {
        console.log('Loading chart data from API...');

        // helper to fetch single chart endpoint and log errors
        async function fetchChart(path) {
            try {
                const res = await fetch(`${window.API_BASE_URL}${path}`);
                if (!res.ok) {
                    const text = await res.text().catch(()=>'<no body>');
                    console.error(`API ${path} error:`, res.status, text);
                    return null;
                }
                return await res.json();
            } catch (err) {
                console.error(`Network error fetching ${path}:`, err);
                return null;
            }
        }

        const [lineData, barData, pieData] = await Promise.all([
            fetchChart('/charts/line'),
            fetchChart('/charts/bar'),
            fetchChart('/charts/pie')
        ]);

        console.log('Chart Data Received:', { lineData, barData, pieData });

        // Initialize each chart; if data is null, functions use defaults
        initializeLineChart(lineData);
        initializeBarChart(barData);
        initializePieChart(pieData);

    } catch (error) {
        console.error('Error loading charts (unexpected):', error);
        console.warn('Using fallback data for all charts...');
        initializeFallbackCharts();
    }
}

function initializeLineChart(lineData) {
    const lineChartEl = document.getElementById('lineChart');
    if (!lineChartEl) return;

    // destroy previous instance if present
    if (lineChart) {
        try { lineChart.destroy(); } catch(e){console.warn(e);}
        lineChart = null;
    }

    const lineCtx = lineChartEl.getContext('2d');
    const labels = (lineData?.labels && lineData.labels.length > 0)
        ? lineData.labels
        : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
    const data = (lineData?.data && lineData.data.length > 0)
        ? lineData.data.map(Number)
        : [0, 0, 0, 0, 0, 0, 0];

    lineChart = new Chart(lineCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sales',
                data: data,
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                borderColor: 'rgba(99, 102, 241, 1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'top' }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function initializeBarChart(barData) {
    const barChartEl = document.getElementById('barChart');
    if (!barChartEl) return;

    if (barChart) {
        try { barChart.destroy(); } catch(e){console.warn(e);}
        barChart = null;
    }

    const barCtx = barChartEl.getContext('2d');
    const colors = [
        'rgba(239, 68, 68, 0.7)',
        'rgba(59, 130, 246, 0.7)',
        'rgba(234, 179, 8, 0.7)',
        'rgba(16, 185, 129, 0.7)',
        'rgba(139, 92, 246, 0.7)',
        'rgba(249, 115, 22, 0.7)'
    ];
    const borderColors = [
        'rgba(239, 68, 68, 1)',
        'rgba(59, 130, 246, 1)',
        'rgba(234, 179, 8, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(139, 92, 246, 1)',
        'rgba(249, 115, 22, 1)'
    ];

    const labels = (barData?.labels && barData.labels.length > 0) ? barData.labels : [];
    const dataValues = (barData?.data && barData.data.length > 0) ? barData.data.map(Number) : [];

    barChart = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Products by Category',
                data: dataValues,
                backgroundColor: labels.length ? labels.map((_, i) => colors[i % colors.length]) : colors,
                borderColor: labels.length ? labels.map((_, i) => borderColors[i % borderColors.length]) : borderColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { position: 'top' } },
            scales: { y: { beginAtZero: true } }
        }
    });
}

function initializePieChart(pieData) {
    const pieChartEl = document.getElementById('pieChart');
    if (!pieChartEl) return;

    if (pieChart) {
        try { pieChart.destroy(); } catch(e){console.warn(e);}
        pieChart = null;
    }

    const pieCtx = pieChartEl.getContext('2d');
    const pieColors = [
        'rgba(99, 102, 241, 0.7)',
        'rgba(239, 68, 68, 0.7)',
        'rgba(16, 185, 129, 0.7)',
        'rgba(234, 179, 8, 0.7)',
        'rgba(139, 92, 246, 0.7)'
    ];
    const pieBorderColors = [
        'rgba(99, 102, 241, 1)',
        'rgba(239, 68, 68, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(234, 179, 8, 1)',
        'rgba(139, 92, 246, 1)'
    ];

    const labels = (pieData?.labels && pieData.labels.length > 0) ? pieData.labels : [];
    const dataValues = (pieData?.data && pieData.data.length > 0) ? pieData.data.map(Number) : [];

    pieChart = new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: dataValues,
                backgroundColor: labels.length ? labels.map((_, i) => pieColors[i % pieColors.length]) : pieColors,
                borderColor: labels.length ? labels.map((_, i) => pieBorderColors[i % pieBorderColors.length]) : pieBorderColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { position: 'top' } }
        }
    });
}

function initializeFallbackCharts() {
    initializeLineChart({ labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'], data: [65, 59, 80, 81, 56, 55, 40] });
    initializeBarChart({ labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'], data: [12, 19, 3, 5, 2, 3] });
    initializePieChart({ labels: ['Desktop', 'Mobile', 'Tablet'], data: [300, 500, 200] });
}
