require('dotenv').config();
const { Pool } = require('pg');

class Database {
    constructor() {
        this.pool = null;
    }

    // Initialize database connection and create tables
    async init() {
        try {
            this.pool = new Pool({
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 5432,
                database: process.env.DB_NAME,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                max: 20,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
            });

            // Test connection
            const client = await this.pool.connect();
            console.log('Connected to PostgreSQL database');
            client.release();

            await this.createTables();
        } catch (error) {
            console.error('Error connecting to database:', error);
            throw error;
        }
    }

    // Create tables if they don't exist
    async createTables() {
        try {
            const createProductsTable = `
                CREATE TABLE IF NOT EXISTS products (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    category VARCHAR(100) NOT NULL,
                    status VARCHAR(50) NOT NULL,
                    amount DECIMAL(10, 2) NOT NULL,
                    date DATE NOT NULL,
                    rating INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;

            await this.pool.query(createProductsTable);
            console.log('Products table ready');
            
            // Check if table is empty and seed with sample data
            const result = await this.pool.query('SELECT COUNT(*) as count FROM products');
            const count = parseInt(result.rows[0].count);
            
            if (count === 0) {
                console.log('Seeding database with sample data...');
                await this.seedData();
            }
        } catch (error) {
            console.error('Error creating tables:', error);
            throw error;
        }
    }

    // Seed database with sample data
    async seedData() {
        const categories = ['Electronics', 'Clothing', 'Food', 'Furniture', 'Books'];
        const statuses = ['Completed', 'Pending', 'Cancelled'];
        const products = [];

        for (let i = 1; i <= 50; i++) {
            const category = categories[Math.floor(Math.random() * categories.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const amount = (Math.random() * 1000).toFixed(2);
            const date = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
            const rating = Math.floor(Math.random() * 5) + 1;

            products.push({
                name: `Product ${i}`,
                category,
                status,
                amount: parseFloat(amount),
                date: date.toISOString().split('T')[0],
                rating
            });
        }

        try {
            const insertQuery = `
                INSERT INTO products (name, category, status, amount, date, rating)
                VALUES ($1, $2, $3, $4, $5, $6)
            `;

            for (const product of products) {
                await this.pool.query(insertQuery, [
                    product.name,
                    product.category,
                    product.status,
                    product.amount,
                    product.date,
                    product.rating
                ]);
            }

            console.log(`Inserted ${products.length} products`);
        } catch (error) {
            console.error('Error seeding data:', error);
            throw error;
        }
    }

    // Get products with pagination
    async getProducts(limit, offset) {
        try {
            const result = await this.pool.query(
                'SELECT * FROM products ORDER BY id LIMIT $1 OFFSET $2',
                [limit, offset]
            );
            
            // Format data for frontend
            const formatted = result.rows.map(row => ({
                id: row.id,
                name: row.name,
                category: row.category,
                status: row.status,
                amount: `$${parseFloat(row.amount).toFixed(2)}`,
                date: new Date(row.date).toLocaleDateString(),
                rating: row.rating
            }));
            
            return formatted;
        } catch (error) {
            console.error('Error fetching products:', error);
            throw error;
        }
    }

    // Get total number of products
    async getTotalProducts() {
        try {
            const result = await this.pool.query('SELECT COUNT(*) as total FROM products');
            return parseInt(result.rows[0].total);
        } catch (error) {
            console.error('Error counting products:', error);
            throw error;
        }
    }

    // Get product by ID
    async getProductById(id) {
        try {
            const result = await this.pool.query('SELECT * FROM products WHERE id = $1', [id]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            const row = result.rows[0];
            return {
                id: row.id,
                name: row.name,
                category: row.category,
                status: row.status,
                amount: `$${parseFloat(row.amount).toFixed(2)}`,
                date: new Date(row.date).toLocaleDateString(),
                rating: row.rating
            };
        } catch (error) {
            console.error('Error fetching product:', error);
            throw error;
        }
    }

    // Create new product
    async createProduct(name, category, status, amount, date, rating) {
        try {
            const result = await this.pool.query(
                'INSERT INTO products (name, category, status, amount, date, rating) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
                [name, category, status, parseFloat(amount), date, rating]
            );
            
            return {
                id: result.rows[0].id,
                name,
                category,
                status,
                amount: `$${parseFloat(amount).toFixed(2)}`,
                date,
                rating
            };
        } catch (error) {
            console.error('Error creating product:', error);
            throw error;
        }
    }

    // Update product
    async updateProduct(id, name, category, status, amount, date, rating) {
        try {
            const result = await this.pool.query(
                'UPDATE products SET name = $1, category = $2, status = $3, amount = $4, date = $5, rating = $6 WHERE id = $7 RETURNING *',
                [name, category, status, parseFloat(amount), date, rating, id]
            );
            
            if (result.rows.length === 0) {
                return null;
            }
            
            const row = result.rows[0];
            return {
                id: row.id,
                name: row.name,
                category: row.category,
                status: row.status,
                amount: `$${parseFloat(row.amount).toFixed(2)}`,
                date: row.date,
                rating: row.rating
            };
        } catch (error) {
            console.error('Error updating product:', error);
            throw error;
        }
    }

    // Delete product
    async deleteProduct(id) {
        try {
            const result = await this.pool.query('DELETE FROM products WHERE id = $1', [id]);
            return result.rowCount > 0;
        } catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    }

    // Get line chart data (sales by month)
    async getLineChartData() {
        try {
            const result = await this.pool.query(`
                SELECT 
                    TO_CHAR(date, 'YYYY-MM') as month,
                    SUM(amount) as total
                FROM products
                WHERE status = 'Completed'
                GROUP BY month
                ORDER BY month
                LIMIT 7
            `);
            
            const labels = result.rows.map(row => {
                const date = new Date(row.month + '-01');
                return date.toLocaleDateString('en-US', { month: 'short' });
            });
            const data = result.rows.map(row => parseFloat(row.total));
            
            return { labels, data };
        } catch (error) {
            console.error('Error fetching line chart data:', error);
            throw error;
        }
    }

    // Get bar chart data (inventory by category)
    async getBarChartData() {
        try {
            const result = await this.pool.query(`
                SELECT 
                    category,
                    COUNT(*) as count
                FROM products
                GROUP BY category
                ORDER BY count DESC
            `);
            
            const labels = result.rows.map(row => row.category);
            const data = result.rows.map(row => parseInt(row.count));
            
            return { labels, data };
        } catch (error) {
            console.error('Error fetching bar chart data:', error);
            throw error;
        }
    }

    // Get pie chart data (status distribution)
    async getPieChartData() {
        try {
            const result = await this.pool.query(`
                SELECT 
                    status,
                    COUNT(*) as count
                FROM products
                GROUP BY status
            `);
            
            const labels = result.rows.map(row => row.status);
            const data = result.rows.map(row => parseInt(row.count));
            
            return { labels, data };
        } catch (error) {
            console.error('Error fetching pie chart data:', error);
            throw error;
        }
    }

    // Close database connection
    async close() {
        if (this.pool) {
            await this.pool.end();
            console.log('Database connection closed');
        }
    }
}

module.exports = new Database();
