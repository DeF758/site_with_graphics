from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os
from dotenv import load_dotenv
from database import Database

# Load .env file with explicit encoding
# Try to read .env file manually with proper encoding
import io
import codecs

def load_env_safely():
    """Load .env file with proper encoding handling"""
    if not os.path.exists('.env'):
        load_dotenv()
        return
    
    try:
        # Read file as binary first, then try to decode
        with open('.env', 'rb') as f:
            raw_content = f.read()
        
        # Try multiple encodings
        encodings = ['utf-8-sig', 'utf-8', 'latin-1', 'cp1251', 'windows-1251']
        content = None
        
        for encoding in encodings:
            try:
                content = raw_content.decode(encoding)
                break
            except (UnicodeDecodeError, UnicodeError):
                continue
        
        if content is None:
            # Last resort: decode with errors='replace' to replace invalid bytes
            content = raw_content.decode('utf-8', errors='replace')
        
        # Parse content
        for line in content.splitlines():
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                key = key.strip()
                value = value.strip()
                # Remove quotes if present
                if value.startswith('"') and value.endswith('"'):
                    value = value[1:-1]
                elif value.startswith("'") and value.endswith("'"):
                    value = value[1:-1]
                # Clean value - remove any problematic characters
                value = value.replace('\ufeff', '').replace('\u200b', '')
                # Ensure value is valid UTF-8
                try:
                    value.encode('utf-8')
                except UnicodeEncodeError:
                    # If encoding fails, use only ASCII
                    value = value.encode('ascii', errors='ignore').decode('ascii')
                os.environ[key] = value
                
    except Exception as e:
        print(f'Warning: Could not load .env file: {e}')
        load_dotenv()

load_env_safely()

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Initialize database
db = Database()

@app.route('/api/products', methods=['GET'])
def get_products():
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        offset = (page - 1) * limit

        products = db.get_products(limit, offset)
        total = db.get_total_products()
        
        print(f'API: Returning {len(products)} products, total: {total}')

        return jsonify({
            'data': products,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'totalPages': (total + limit - 1) // limit
            }
        })
    except Exception as e:
        print(f'Error fetching products: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    try:
        product = db.get_product_by_id(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        return jsonify(product)
    except Exception as e:
        print(f'Error fetching product: {e}')
        return jsonify({'error': 'Failed to fetch product'}), 500

@app.route('/api/products', methods=['POST'])
def create_product():
    try:
        data = request.json
        product = db.create_product(
            data.get('name'),
            data.get('category'),
            data.get('status'),
            data.get('amount'),
            data.get('date'),
            data.get('rating')
        )
        return jsonify(product), 201
    except Exception as e:
        print(f'Error creating product: {e}')
        return jsonify({'error': 'Failed to create product'}), 500

@app.route('/api/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    try:
        data = request.json
        product = db.update_product(
            product_id,
            data.get('name'),
            data.get('category'),
            data.get('status'),
            data.get('amount'),
            data.get('date'),
            data.get('rating')
        )
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        return jsonify(product)
    except Exception as e:
        print(f'Error updating product: {e}')
        return jsonify({'error': 'Failed to update product'}), 500

@app.route('/api/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    try:
        success = db.delete_product(product_id)
        if not success:
            return jsonify({'error': 'Product not found'}), 404
        return jsonify({'message': 'Product deleted successfully'})
    except Exception as e:
        print(f'Error deleting product: {e}')
        return jsonify({'error': 'Failed to delete product'}), 500

@app.route('/api/charts/line', methods=['GET'])
def get_line_chart_data():
    try:
        data = db.get_line_chart_data()
        print(f'API Line Chart: {data}')
        return jsonify(data)
    except Exception as e:
        print(f'Error fetching line chart data: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to fetch line chart data'}), 500

@app.route('/api/charts/bar', methods=['GET'])
def get_bar_chart_data():
    try:
        data = db.get_bar_chart_data()
        print(f'API Bar Chart: {data}')
        return jsonify(data)
    except Exception as e:
        print(f'Error fetching bar chart data: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to fetch bar chart data'}), 500

@app.route('/api/charts/pie', methods=['GET'])
def get_pie_chart_data():
    try:
        data = db.get_pie_chart_data()
        print(f'API Pie Chart: {data}')
        return jsonify(data)
    except Exception as e:
        print(f'Error fetching pie chart data: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to fetch pie chart data'}), 500

# Serve static files
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/components/<path:path>')
def serve_components(path):
    return send_from_directory('components', path)

@app.route('/<path:path>')
def serve_static(path):
    # Don't serve .env or other sensitive files
    if path.startswith('.') or path.startswith('__'):
        return "Not found", 404
    return send_from_directory('.', path)

if __name__ == '__main__':
    # Initialize database connection
    db.init()
    
    port = int(os.getenv('PORT', 3000))
    print(f'Server is running on http://localhost:{port}')
    print(f'Open http://localhost:{port}/index.html in your browser')
    
    app.run(host='0.0.0.0', port=port, debug=True)

