// API Configuration — single global value to avoid duplicate const declarations
window.API_BASE_URL = window.API_BASE_URL || `${window.location.origin}/api`;
 
// API Service
class ApiService {
    static async getProducts(page = 1, limit = 10) {
        try {
            const url = `${window.API_BASE_URL}/products?page=${page}&limit=${limit}`;
            console.log('Fetching products from:', url);
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error:', response.status, errorText);
                throw new Error(`Failed to fetch products: ${response.status} ${errorText}`);
            }
            
            const data = await response.json();
            console.log('Products API Response:', data);
            return data;
        } catch (error) {
            console.error('Error fetching products:', error);
            throw error;
        }
    }
}

class CustomDataTable extends HTMLElement {
    constructor() {
        super();
        this.currentPage = 1;
        this.rowsPerPage = 10;
        this.totalPages = 1;
        this.totalItems = 0;
        this.isLoading = false;
    }

    async connectedCallback() {
        // Render into light DOM so DevTools / XPath can find the table
        this.render();
        await this.loadData();
    }

    render() {
        this.innerHTML = `
            <style>
                .loading {
                    text-align: center;
                    padding: 2rem;
                    color: #6b7280;
                }

                .error {
                    text-align: center;
                    padding: 2rem;
                    color: #ef4444;
                    background-color: #fee2e2;
                    border-radius: 0.5rem;
                    margin: 1rem;
                }

                .pagination-controls {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem;
                    border-top: 1px solid #e5e7eb;
                    background-color: #f9fafb;
                }

                .pagination-buttons {
                    display: flex;
                    gap: 0.5rem;
                    align-items: center;
                }

                .page-button {
                    padding: 0.5rem 1rem;
                    background-color: #ffffff;
                    border: 1px solid #e5e7eb;
                    border-radius: 0.375rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.875rem;
                }

                .page-button:hover:not(:disabled) {
                    background-color: #f3f4f6;
                }

                .page-button.active {
                    background-color: #6366f1;
                    color: white;
                    border-color: #6366f1;
                }

                .page-button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .rows-per-page {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                select {
                    padding: 0.5rem;
                    border: 1px solid #e5e7eb;
                    border-radius: 0.375rem;
                    background-color: white;
                }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                
                th, td {
                    padding: 1rem;
                    text-align: left;
                    border-bottom: 1px solid #e5e7eb;
                }
                
                th {
                    background-color: #f9fafb;
                    font-weight: 600;
                    color: #4b5563;
                    text-transform: uppercase;
                    font-size: 0.75rem;
                    letter-spacing: 0.05em;
                }
                
                tr:hover {
                    background-color: #f3f4f6;
                }
                
                .status {
                    display: inline-block;
                    padding: 0.25rem 0.5rem;
                    border-radius: 9999px;
                    font-size: 0.75rem;
                    font-weight: 500;
                }
                
                .status-completed {
                    background-color: #d1fae5;
                    color: #065f46;
                }
                
                .status-pending {
                    background-color: #fef3c7;
                    color: #92400e;
                }
                
                .status-cancelled {
                    background-color: #fee2e2;
                    color: #991b1b;
                }
                
                .rating {
                    display: flex;
                    gap: 0.25rem;
                }
                
                .star {
                    color: #f59e0b;
                }
                
                @media (max-width: 768px) {
                    table {
                        display: block;
                        overflow-x: auto;
                        white-space: nowrap;
                    }
                }
            </style>
            <div class="overflow-x-auto">
                <div id="loading" class="loading" style="display: none;">Loading...</div>
                <div id="error" class="error" style="display: none;"></div>
                <table id="table" style="display: none;">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Status</th>
                            <th>Amount</th>
                            <th>Date</th>
                            <th>Rating</th>
                        </tr>
                    </thead>
                    <tbody id="tbody">
                    </tbody>
                </table>
                <div class="pagination-controls" id="pagination" style="display: none;">
                    <div class="rows-per-page">
                        <span>Rows per page:</span>
                        <select id="rows-per-page">
                            <option value="5">5</option>
                            <option value="10" selected>10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                        </select>
                    </div>
                    <div class="pagination-buttons">
                        <button class="page-button prev-button" disabled>Previous</button>
                        <div id="page-numbers"></div>
                        <button class="page-button next-button">Next</button>
                    </div>
                </div>
            </div>
        `;

        // Setup event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        const prevButton = this.querySelector('.prev-button');
        const nextButton = this.querySelector('.next-button');
        const rowsPerPageSelect = this.querySelector('#rows-per-page');

        prevButton?.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.loadData();
            }
        });

        nextButton?.addEventListener('click', () => {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
                this.loadData();
            }
        });

        rowsPerPageSelect?.addEventListener('change', (e) => {
            this.rowsPerPage = parseInt(e.target.value);
            this.currentPage = 1;
            this.loadData();
        });
    }

    async loadData() {
        this.isLoading = true;
        this.showLoading();

        try {
            const response = await ApiService.getProducts(this.currentPage, this.rowsPerPage);
            console.log('Products API Response:', response);
            
            if (!response || !response.data) {
                throw new Error('Invalid response from API');
            }
            
            this.totalItems = response.pagination.total;
            this.totalPages = response.pagination.totalPages;
            
            this.renderTable(response.data);
            this.updatePagination();
            this.hideLoading();
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError(`Failed to load data. Make sure the server is running at ${window.location.origin}`);
            this.hideLoading();
        } finally {
            this.isLoading = false;
        }
    }

    renderTable(data) {
        const tbody = this.querySelector('#tbody');
        const table = this.querySelector('#table');
        const pagination = this.querySelector('#pagination');

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;">No data available</td></tr>';
        } else {
            tbody.innerHTML = data.map(item => `
                <tr>
                    <td>${item.id}</td>
                    <td>${item.name}</td>
                    <td>${item.category}</td>
                    <td><span class="status status-${item.status.toLowerCase()}">${item.status}</span></td>
                    <td>${item.amount}</td>
                    <td>${item.date}</td>
                    <td class="rating">
                        ${Array.from({ length: 5 }, (_, i) => 
                            `<i data-feather="star" style="${i < item.rating ? 'fill: #f59e0b;' : 'fill: none;'}"></i>`
                        ).join('')}
                    </td>
                </tr>
            `).join('');
        }

        table.style.display = 'table';
        pagination.style.display = 'flex';
        
        // Replace feather icons within this component (light DOM)
        setTimeout(() => {
            try {
                // Replace icons globally; scoping options are limited for feather
                feather.replace();
            } catch (e) {
                console.warn('Feather replace failed:', e);
            }
        }, 100);
    }

    updatePagination() {
        const prevButton = this.querySelector('.prev-button');
        const nextButton = this.querySelector('.next-button');
        const pageNumbers = this.querySelector('#page-numbers');

        prevButton.disabled = this.currentPage === 1;
        nextButton.disabled = this.currentPage === this.totalPages;

        // Clear existing page numbers
        pageNumbers.innerHTML = '';

        const maxVisiblePages = 5;
        let startPage, endPage;

        if (this.totalPages <= maxVisiblePages) {
            startPage = 1;
            endPage = this.totalPages;
        } else {
            const half = Math.floor(maxVisiblePages / 2);
            if (this.currentPage <= half) {
                startPage = 1;
                endPage = maxVisiblePages;
            } else if (this.currentPage + half >= this.totalPages) {
                startPage = this.totalPages - maxVisiblePages + 1;
                endPage = this.totalPages;
            } else {
                startPage = this.currentPage - half;
                endPage = this.currentPage + half;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            const button = document.createElement('button');
            button.className = `page-button ${i === this.currentPage ? 'active' : ''}`;
            button.textContent = i;
            button.addEventListener('click', () => {
                this.currentPage = i;
                this.loadData();
            });
            pageNumbers.appendChild(button);
        }
    }

    showLoading() {
        const loading = this.querySelector('#loading');
        const table = this.querySelector('#table');
        const pagination = this.querySelector('#pagination');
        const error = this.querySelector('#error');
        
        loading.style.display = 'block';
        table.style.display = 'none';
        pagination.style.display = 'none';
        error.style.display = 'none';
    }

    hideLoading() {
        const loading = this.querySelector('#loading');
        loading.style.display = 'none';
    }

    showError(message) {
        const error = this.querySelector('#error');
        const table = this.querySelector('#table');
        const pagination = this.querySelector('#pagination');
        
        error.textContent = message;
        error.style.display = 'block';
        table.style.display = 'none';
        pagination.style.display = 'none';
    }
}

customElements.define('custom-data-table', CustomDataTable);
