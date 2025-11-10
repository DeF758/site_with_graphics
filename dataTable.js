// Generate sample data for the table
function generateTableData() {
    const categories = ['Electronics', 'Clothing', 'Food', 'Furniture', 'Books'];
    const statuses = ['Completed', 'Pending', 'Cancelled'];
    const data = [];
    
    for (let i = 1; i <= 50; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const amount = (Math.random() * 1000).toFixed(2);
        const date = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
        
        data.push({
            id: i,
            name: `Product ${i}`,
            category,
            status,
            amount: `$${amount}`,
            date: date.toLocaleDateString(),
            rating: Math.floor(Math.random() * 5) + 1
        });
    }
    
    return data;
}

class CustomDataTable extends HTMLElement {
    connectedCallback() {
        const data = generateTableData();
        
        this.attachShadow({ mode: 'open' });
        // Initial render
        this.shadowRoot.innerHTML = `
            <style>
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
                }

                .page-button {
                    padding: 0.5rem 1rem;
                    background-color: #ffffff;
                    border: 1px solid #e5e7eb;
                    border-radius: 0.375rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .page-button:hover {
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
                <table>
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
                    <tbody>
                        ${data.map(item => `
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
                        `).join('')}
                    </tbody>
                </table>
                <div class="pagination-controls">
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
        
        // Setup pagination after initial render
        setTimeout(() => {
            setupPagination(data, this.shadowRoot);
        }, 0);
        
        // Replace feather icons after rendering
        setTimeout(() => {
            feather.replace(this.shadowRoot);
        }, 100);
    }
}
customElements.define('custom-data-table', CustomDataTable);

class Pagination {
constructor(data, rowsPerPage = 10) {
        this.data = data;
        this.rowsPerPage = rowsPerPage;
        this.currentPage = 1;
        this.pages = Math.ceil(data.length / rowsPerPage);
    }

    getPaginatedData() {
        const start = (this.currentPage - 1) * this.rowsPerPage;
        const end = start + this.rowsPerPage;
        return this.data.slice(start, end);
    }

    nextPage() {
        if (this.currentPage < this.pages) {
            this.currentPage++;
            return true;
        }
        return false;
    }

    prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            return true;
        }
        return false;
    }

    goToPage(page) {
        if (page >= 1 && page <= this.pages) {
            this.currentPage = page;
            return true;
        }
        return false;
    }

    setRowsPerPage(rows) {
        this.rowsPerPage = rows;
        this.pages = Math.ceil(this.data.length / this.rowsPerPage);
        if (this.currentPage > this.pages) {
            this.currentPage = this.pages;
        }
    }
}
function updateTable(pagination, shadowRoot) {
    const paginatedData = pagination.getPaginatedData();
    const tbody = shadowRoot.querySelector('tbody');
    tbody.innerHTML = paginatedData.map(item => `
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

    // Update pagination controls
    const pageNumbers = shadowRoot.getElementById('page-numbers');
    pageNumbers.innerHTML = '';
    
    const maxVisiblePages = 5;
    let startPage, endPage;
    
    if (pagination.pages <= maxVisiblePages) {
        startPage = 1;
        endPage = pagination.pages;
    } else {
        const half = Math.floor(maxVisiblePages / 2);
        if (pagination.currentPage <= half) {
            startPage = 1;
            endPage = maxVisiblePages;
        } else if (pagination.currentPage + half >= pagination.pages) {
            startPage = pagination.pages - maxVisiblePages + 1;
            endPage = pagination.pages;
        } else {
            startPage = pagination.currentPage - half;
            endPage = pagination.currentPage + half;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const button = document.createElement('button');
        button.className = `page-button ${i === pagination.currentPage ? 'active' : ''}`;
        button.textContent = i;
        button.addEventListener('click', () => {
            pagination.goToPage(i);
            updateTable(pagination, shadowRoot);
            updatePaginationButtons(pagination, shadowRoot);
        });
        pageNumbers.appendChild(button);
    }
    
    updatePaginationButtons(pagination, shadowRoot);
    feather.replace(shadowRoot);
}
function updatePaginationButtons(pagination, shadowRoot) {
    const prevButton = shadowRoot.querySelector('.prev-button');
    const nextButton = shadowRoot.querySelector('.next-button');
    const pageButtons = shadowRoot.querySelectorAll('.page-button:not(.prev-button):not(.next-button)');
    
    prevButton.disabled = pagination.currentPage === 1;
    nextButton.disabled = pagination.currentPage === pagination.pages;
    
    pageButtons.forEach(button => {
        const pageNum = parseInt(button.textContent);
        button.classList.toggle('active', pageNum === pagination.currentPage);
    });
}
function setupPagination(data, shadowRoot) {
    if (!shadowRoot) return;
const pagination = new Pagination(data, 10);
    
    // Initial table update
    updateTable(pagination, shadowRoot);
    
    // Event listeners
    shadowRoot.querySelector('.prev-button').addEventListener('click', () => {
        if (pagination.prevPage()) {
            updateTable(pagination, shadowRoot);
            updatePaginationButtons(pagination, shadowRoot);
        }
    });
    
    shadowRoot.querySelector('.next-button').addEventListener('click', () => {
        if (pagination.nextPage()) {
            updateTable(pagination, shadowRoot);
            updatePaginationButtons(pagination, shadowRoot);
        }
    });
    
    shadowRoot.getElementById('rows-per-page').addEventListener('change', (e) => {
        const rows = parseInt(e.target.value);
        pagination.setRowsPerPage(rows);
        updateTable(pagination, shadowRoot);
        updatePaginationButtons(pagination, shadowRoot);
    });

    // Handle page number clicks
    shadowRoot.addEventListener('click', (e) => {
        if (e.target.classList.contains('page-button') && !e.target.classList.contains('prev-button') && !e.target.classList.contains('next-button')) {
            const page = parseInt(e.target.textContent);
            if (pagination.goToPage(page)) {
                updateTable(pagination, shadowRoot);
                updatePaginationButtons(pagination, shadowRoot);
            }
        }
    });
}