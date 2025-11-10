require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// API Routes

// Get all products with pagination
app.get('/api/products', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const products = await db.getProducts(limit, offset);
        const total = await db.getTotalProducts();

        res.json({
            data: products,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Get product by ID
app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await db.getProductById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// Create new product
app.post('/api/products', async (req, res) => {
    try {
        const { name, category, status, amount, date, rating } = req.body;
        const product = await db.createProduct(name, category, status, amount, date, rating);
        res.status(201).json(product);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

// Update product
app.put('/api/products/:id', async (req, res) => {
    try {
        const { name, category, status, amount, date, rating } = req.body;
        const product = await db.updateProduct(req.params.id, name, category, status, amount, date, rating);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
    try {
        const success = await db.deleteProduct(req.params.id);
        if (!success) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// Get chart data for line chart (sales by month)
app.get('/api/charts/line', async (req, res) => {
    try {
        const data = await db.getLineChartData();
        res.json(data);
    } catch (error) {
        console.error('Error fetching line chart data:', error);
        res.status(500).json({ error: 'Failed to fetch line chart data' });
    }
});

// Get chart data for bar chart (inventory by category)
app.get('/api/charts/bar', async (req, res) => {
    try {
        const data = await db.getBarChartData();
        res.json(data);
    } catch (error) {
        console.error('Error fetching bar chart data:', error);
        res.status(500).json({ error: 'Failed to fetch bar chart data' });
    }
});

// Get chart data for pie chart (device distribution)
app.get('/api/charts/pie', async (req, res) => {
    try {
        const data = await db.getPieChartData();
        res.json(data);
    } catch (error) {
        console.error('Error fetching pie chart data:', error);
        res.status(500).json({ error: 'Failed to fetch pie chart data' });
    }
});

// Initialize database on startup
db.init().then(() => {
    console.log('Database initialized');
    
    // Start server
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
        console.log(`Open http://localhost:${PORT}/index.html in your browser`);
    });
}).catch(error => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
});


