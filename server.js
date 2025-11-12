require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('./'));

// Initialize database and start server
async function startServer() {
    try {
        await db.init();
        
        // API Routes for Charts
        app.get('/api/charts/line', async (req, res) => {
            try {
                const data = await db.getLineChartData();
                res.json(data);
            } catch (error) {
                console.error('Error in /api/charts/line:', error);
                res.status(500).json({ error: error.message });
            }
        });

        app.get('/api/charts/bar', async (req, res) => {
            try {
                const data = await db.getBarChartData();
                res.json(data);
            } catch (error) {
                console.error('Error in /api/charts/bar:', error);
                res.status(500).json({ error: error.message });
            }
        });

        app.get('/api/charts/pie', async (req, res) => {
            try {
                const data = await db.getPieChartData();
                res.json(data);
            } catch (error) {
                console.error('Error in /api/charts/pie:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Data Table Routes
        app.get('/api/products', async (req, res) => {
            try {
                const limit = parseInt(req.query.limit) || 10;
                const offset = parseInt(req.query.offset) || 0;
                const products = await db.getProducts(limit, offset);
                const total = await db.getTotalProducts();
                res.json({ data: products, total });
            } catch (error) {
                console.error('Error in /api/products:', error);
                res.status(500).json({ error: error.message });
            }
        });

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();


