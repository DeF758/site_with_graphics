// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

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
        // Load all chart data in parallel
        console.log('Loading chart data from API...');
        const [lineResponse, barResponse, pieResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/charts/line`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            }),
            fetch(`${API_BASE_URL}/charts/bar`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            }),
            fetch(`${API_BASE_URL}/charts/pie`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            })
        ]);
        
        // Check if responses are OK
        if (!lineResponse.ok) {
            const errorText = await lineResponse.text();
            console.error('Line chart API error:', lineResponse.status, errorText);
            throw new Error(`Failed to fetch line chart data: ${lineResponse.status}`);
        }
        if (!barResponse.ok) {
            const errorText = await barResponse.text();
            console.error('Bar chart API error:', barResponse.status, errorText);
            throw new Error(`Failed to fetch bar chart data: ${barResponse.status}`);
        }
        if (!pieResponse.ok) {
            const errorText = await pieResponse.text();
            console.error('Pie chart API error:', pieResponse.status, errorText);
            throw new Error(`Failed to fetch pie chart data: ${pieResponse.status}`);
        }
        
        const [lineData, barData, pieData] = await Promise.all([
            lineResponse.json(),
            barResponse.json(),
            pieResponse.json()
        ]);

        // Debug: log data
        console.log('Line Chart Data:', lineData);
        console.log('Bar Chart Data:', barData);
        console.log('Pie Chart Data:', pieData);

        // Initialize Line Chart
        const lineChartEl = document.getElementById('lineChart');
        if (lineChartEl) {
            const lineCtx = lineChartEl.getContext('2d');
            lineChart = new Chart(lineCtx, {
                type: 'line',
                data: {
                    labels: lineData.labels && lineData.labels.length > 0 ? lineData.labels : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
                    datasets: [{
                        label: 'Sales',
                        data: lineData.data && lineData.data.length > 0 ? lineData.data : [0, 0, 0, 0, 0, 0, 0],
                        backgroundColor: 'rgba(99, 102, 241, 0.2)',
                        borderColor: 'rgba(99, 102, 241, 1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        // Initialize Bar Chart
        const barChartEl = document.getElementById('barChart');
        if (barChartEl) {
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

            barChart = new Chart(barCtx, {
                type: 'bar',
                data: {
                    labels: barData.labels && barData.labels.length > 0 ? barData.labels : [],
                    datasets: [{
                        label: 'Products by Category',
                        data: barData.data && barData.data.length > 0 ? barData.data : [],
                        backgroundColor: barData.labels && barData.labels.length > 0 ? barData.labels.map((_, i) => colors[i % colors.length]) : colors,
                        borderColor: barData.labels && barData.labels.length > 0 ? barData.labels.map((_, i) => borderColors[i % borderColors.length]) : borderColors,
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        // Initialize Pie Chart
        const pieChartEl = document.getElementById('pieChart');
        if (pieChartEl) {
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

            pieChart = new Chart(pieCtx, {
                type: 'pie',
                data: {
                    labels: pieData.labels && pieData.labels.length > 0 ? pieData.labels : [],
                    datasets: [{
                        data: pieData.data && pieData.data.length > 0 ? pieData.data : [],
                        backgroundColor: pieData.labels && pieData.labels.length > 0 ? pieData.labels.map((_, i) => pieColors[i % pieColors.length]) : pieColors,
                        borderColor: pieData.labels && pieData.labels.length > 0 ? pieData.labels.map((_, i) => pieBorderColors[i % pieBorderColors.length]) : pieBorderColors,
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error loading charts:', error);
        console.error('Error details:', error.message);
        // Fallback to static data if API fails
        initializeFallbackCharts();
    }
}

function initializeFallbackCharts() {
    // Line Chart
    const lineChartEl = document.getElementById('lineChart');
    if (lineChartEl) {
        const lineCtx = lineChartEl.getContext('2d');
        new Chart(lineCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
                datasets: [{
                    label: 'Sales 2023',
                    data: [65, 59, 80, 81, 56, 55, 40],
                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Bar Chart
    const barChartEl = document.getElementById('barChart');
    if (barChartEl) {
        const barCtx = barChartEl.getContext('2d');
        new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
                datasets: [{
                    label: 'Inventory',
                    data: [12, 19, 3, 5, 2, 3],
                    backgroundColor: [
                        'rgba(239, 68, 68, 0.7)',
                        'rgba(59, 130, 246, 0.7)',
                        'rgba(234, 179, 8, 0.7)',
                        'rgba(16, 185, 129, 0.7)',
                        'rgba(139, 92, 246, 0.7)',
                        'rgba(249, 115, 22, 0.7)'
                    ],
                    borderColor: [
                        'rgba(239, 68, 68, 1)',
                        'rgba(59, 130, 246, 1)',
                        'rgba(234, 179, 8, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(139, 92, 246, 1)',
                        'rgba(249, 115, 22, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Pie Chart
    const pieChartEl = document.getElementById('pieChart');
    if (pieChartEl) {
        const pieCtx = pieChartEl.getContext('2d');
        new Chart(pieCtx, {
            type: 'pie',
            data: {
                labels: ['Desktop', 'Mobile', 'Tablet'],
                datasets: [{
                    data: [300, 500, 200],
                    backgroundColor: [
                        'rgba(99, 102, 241, 0.7)',
                        'rgba(239, 68, 68, 0.7)',
                        'rgba(16, 185, 129, 0.7)'
                    ],
                    borderColor: [
                        'rgba(99, 102, 241, 1)',
                        'rgba(239, 68, 68, 1)',
                        'rgba(16, 185, 129, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                }
            }
        });
    }
}
