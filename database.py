import os
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2 import pool
import random
from datetime import datetime, timedelta, date

class Database:
    def __init__(self):
        self.connection_pool = None

    def init(self):
        """Initialize database connection pool and create tables"""
        try:
            # Get environment variables and handle encoding issues
            db_host = os.getenv('DB_HOST', 'localhost')
            db_port = int(os.getenv('DB_PORT', 5432))
            db_name = os.getenv('DB_NAME', '')
            db_user = os.getenv('DB_USER', '')
            db_password = os.getenv('DB_PASSWORD', '')
            
            # Ensure all values are strings and properly encoded
            # Convert to string and handle encoding issues
            def safe_decode(value):
                if value is None:
                    return ''
                if isinstance(value, bytes):
                    try:
                        # Try UTF-8 first
                        return value.decode('utf-8')
                    except UnicodeDecodeError:
                        try:
                            # Try latin-1 (which can decode any byte)
                            return value.decode('latin-1')
                        except:
                            # Last resort: replace errors
                            return value.decode('utf-8', errors='replace')
                # Already a string, ensure it's clean
                result = str(value)
                # Remove BOM and other problematic characters
                result = result.strip().strip('\ufeff').strip('\u200b')
                return result
            
            db_host = safe_decode(db_host)
            db_name = safe_decode(db_name)
            db_user = safe_decode(db_user)
            db_password = safe_decode(db_password)
            
            # Ensure all values are properly encoded as UTF-8 strings
            # Clean and validate all connection parameters
            def clean_connection_param(value):
                if not value:
                    return ''
                # Convert to string if needed
                if isinstance(value, bytes):
                    # Try to decode as UTF-8, fallback to latin-1
                    try:
                        value = value.decode('utf-8')
                    except UnicodeDecodeError:
                        value = value.decode('latin-1', errors='replace')
                
                # Ensure it's a string
                value = str(value)
                
                # Remove problematic characters
                value = value.replace('\ufeff', '').replace('\u200b', '')
                value = value.strip()
                
                # Validate UTF-8 encoding
                try:
                    # Try to encode/decode to ensure valid UTF-8
                    value.encode('utf-8').decode('utf-8')
                except (UnicodeEncodeError, UnicodeDecodeError):
                    # If encoding fails, use ASCII only
                    value = value.encode('ascii', errors='ignore').decode('ascii')
                
                return value
            
            db_host = clean_connection_param(db_host)
            db_name = clean_connection_param(db_name)
            db_user = clean_connection_param(db_user)
            db_password = clean_connection_param(db_password)
            
            # Build connection string (DSN)
            # This is more reliable for handling special characters and encoding issues
            dsn = f"host={db_host} port={db_port} dbname={db_name} user={db_user} password={db_password}"
            
            # Create connection pool using connection string as first positional argument
            # SimpleConnectionPool(minconn, maxconn, dsn) - dsn must be first positional after min/max
            try:
                # Try with connection string as positional argument
                self.connection_pool = psycopg2.pool.SimpleConnectionPool(1, 20, dsn)
            except (TypeError, AttributeError):
                # Fallback: use individual parameters if connection string doesn't work
                # This should work but may have encoding issues with special characters
                self.connection_pool = psycopg2.pool.SimpleConnectionPool(
                    1, 20,
                    host=db_host,
                    port=db_port,
                    database=db_name,
                    user=db_user,
                    password=db_password
                )
            
            if self.connection_pool:
                print('Connected to PostgreSQL database')
                self.create_tables()
            else:
                raise Exception('Failed to create connection pool')
                
        except Exception as e:
            error_msg = str(e)
            print(f'Error connecting to database: {error_msg}')
            print(f'DB_HOST: {db_host}')
            print(f'DB_PORT: {db_port}')
            print(f'DB_NAME: {db_name[:20]}...' if len(db_name) > 20 else f'DB_NAME: {db_name}')
            print(f'DB_USER: {db_user[:20]}...' if len(db_user) > 20 else f'DB_USER: {db_user}')
            print(f'DB_PASSWORD: {"*" * len(db_password)}')
            
            # If it's a Unicode error, provide more helpful message
            if 'UnicodeDecodeError' in error_msg or 'utf-8' in error_msg.lower():
                print('\n⚠️  Проблема с кодировкой!')
                print('Попробуйте:')
                print('1. Убедитесь, что файл .env сохранен в UTF-8')
                print('2. Проверьте, нет ли специальных символов в пароле/имени пользователя')
                print('3. Попробуйте использовать только латинские буквы и цифры в пароле')
            
            raise e

    def get_connection(self):
        """Get a connection from the pool"""
        return self.connection_pool.getconn()

    def return_connection(self, conn):
        """Return a connection to the pool"""
        self.connection_pool.putconn(conn)

    def create_tables(self):
        """Create tables if they don't exist"""
        conn = None
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Note: GRANT commands require superuser privileges
            # If you get permission errors, run the SQL commands from fix_permissions.sql
            # as a PostgreSQL superuser (usually 'postgres')
            
            create_products_table = """
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
            """
            
            cursor.execute(create_products_table)
            conn.commit()
            print('Products table ready')
            
            # Check if table is empty and seed with sample data
            cursor.execute('SELECT COUNT(*) as count FROM products')
            count = cursor.fetchone()[0]
            
            if count == 0:
                print('Seeding database with sample data...')
                self.seed_data(conn, cursor)
            
            cursor.close()
            
        except Exception as e:
            error_msg = str(e)
            print(f'Error creating tables: {e}')
            
            # Provide helpful message for permission errors
            if 'нет доступа' in error_msg or 'permission denied' in error_msg.lower() or 'insufficient privilege' in error_msg.lower():
                print('\n⚠️  Проблема с правами доступа!')
                print('Пользователь не имеет прав на создание таблиц в схеме public.')
                print('\nРешение:')
                print('1. Подключитесь к PostgreSQL как суперпользователь (обычно postgres):')
                print('   psql -U postgres -d postgres')
                print('\n2. Выполните следующие команды:')
                db_user = os.getenv('DB_USER', 'testGr')
                print(f'   GRANT USAGE ON SCHEMA public TO {db_user};')
                print(f'   GRANT CREATE ON SCHEMA public TO {db_user};')
                print(f'   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO {db_user};')
                print(f'   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO {db_user};')
                print('\nИли используйте файл fix_permissions.sql')
            
            if conn:
                conn.rollback()
            raise e
        finally:
            if conn:
                self.return_connection(conn)

    def seed_data(self, conn, cursor):
        """Seed database with sample data"""
        categories = ['Electronics', 'Clothing', 'Food', 'Furniture', 'Books']
        statuses = ['Completed', 'Pending', 'Cancelled']
        
        insert_query = """
            INSERT INTO products (name, category, status, amount, date, rating)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        
        products = []
        for i in range(1, 51):
            category = random.choice(categories)
            status = random.choice(statuses)
            amount = round(random.uniform(10, 1000), 2)
            date = datetime.now() - timedelta(days=random.randint(0, 30))
            rating = random.randint(1, 5)
            
            products.append((
                f'Product {i}',
                category,
                status,
                amount,
                date.date(),
                rating
            ))
        
        cursor.executemany(insert_query, products)
        conn.commit()
        print(f'Inserted {len(products)} products')

    def get_products(self, limit, offset):
        """Get products with pagination"""
        conn = None
        try:
            conn = self.get_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            cursor.execute(
                'SELECT * FROM products ORDER BY id LIMIT %s OFFSET %s',
                (limit, offset)
            )
            
            rows = cursor.fetchall()
            
            # Format data for frontend
            formatted = []
            for row in rows:
                formatted.append({
                    'id': row['id'],
                    'name': row['name'],
                    'category': row['category'],
                    'status': row['status'],
                    'amount': f"${float(row['amount']):.2f}",
                    'date': row['date'].strftime('%m/%d/%Y') if isinstance(row['date'], (datetime, date)) else str(row['date']),
                    'rating': row['rating']
                })
            
            cursor.close()
            return formatted
            
        except Exception as e:
            print(f'Error fetching products: {e}')
            raise e
        finally:
            if conn:
                self.return_connection(conn)

    def get_total_products(self):
        """Get total number of products"""
        conn = None
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('SELECT COUNT(*) as total FROM products')
            total = cursor.fetchone()[0]
            
            cursor.close()
            return total
            
        except Exception as e:
            print(f'Error counting products: {e}')
            raise e
        finally:
            if conn:
                self.return_connection(conn)

    def get_product_by_id(self, product_id):
        """Get product by ID"""
        conn = None
        try:
            conn = self.get_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            cursor.execute('SELECT * FROM products WHERE id = %s', (product_id,))
            row = cursor.fetchone()
            
            if not row:
                return None
            
            cursor.close()
            return {
                'id': row['id'],
                'name': row['name'],
                'category': row['category'],
                'status': row['status'],
                'amount': f"${float(row['amount']):.2f}",
                'date': row['date'].strftime('%m/%d/%Y') if isinstance(row['date'], (datetime, date)) else str(row['date']),
                'rating': row['rating']
            }
            
        except Exception as e:
            print(f'Error fetching product: {e}')
            raise e
        finally:
            if conn:
                self.return_connection(conn)

    def create_product(self, name, category, status, amount, date, rating):
        """Create new product"""
        conn = None
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute(
                'INSERT INTO products (name, category, status, amount, date, rating) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id',
                (name, category, status, float(amount), date, rating)
            )
            
            product_id = cursor.fetchone()[0]
            conn.commit()
            
            cursor.close()
            return {
                'id': product_id,
                'name': name,
                'category': category,
                'status': status,
                'amount': f"${float(amount):.2f}",
                'date': date,
                'rating': rating
            }
            
        except Exception as e:
            print(f'Error creating product: {e}')
            if conn:
                conn.rollback()
            raise e
        finally:
            if conn:
                self.return_connection(conn)

    def update_product(self, product_id, name, category, status, amount, date, rating):
        """Update product"""
        conn = None
        try:
            conn = self.get_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            cursor.execute(
                'UPDATE products SET name = %s, category = %s, status = %s, amount = %s, date = %s, rating = %s WHERE id = %s RETURNING *',
                (name, category, status, float(amount), date, rating, product_id)
            )
            
            row = cursor.fetchone()
            conn.commit()
            
            if not row:
                cursor.close()
                return None
            
            cursor.close()
            return {
                'id': row['id'],
                'name': row['name'],
                'category': row['category'],
                'status': row['status'],
                'amount': f"${float(row['amount']):.2f}",
                'date': row['date'].strftime('%m/%d/%Y') if isinstance(row['date'], (datetime, date)) else str(row['date']),
                'rating': row['rating']
            }
            
        except Exception as e:
            print(f'Error updating product: {e}')
            if conn:
                conn.rollback()
            raise e
        finally:
            if conn:
                self.return_connection(conn)

    def delete_product(self, product_id):
        """Delete product"""
        conn = None
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('DELETE FROM products WHERE id = %s', (product_id,))
            deleted = cursor.rowcount > 0
            conn.commit()
            
            cursor.close()
            return deleted
            
        except Exception as e:
            print(f'Error deleting product: {e}')
            if conn:
                conn.rollback()
            raise e
        finally:
            if conn:
                self.return_connection(conn)

    def get_line_chart_data(self):
        """Get line chart data (sales by month)"""
        conn = None
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT 
                    TO_CHAR(date, 'YYYY-MM') as month,
                    SUM(amount) as total
                FROM products
                WHERE status = 'Completed'
                GROUP BY month
                ORDER BY month
                LIMIT 7
            """)
            
            rows = cursor.fetchall()
            
            labels = []
            data = []
            for row in rows:
                month_str = row[0]
                date_obj = datetime.strptime(month_str + '-01', '%Y-%m-%d')
                labels.append(date_obj.strftime('%b'))
                data.append(float(row[1]))
            
            # If no data, return empty arrays
            if not labels:
                labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']
                data = [0, 0, 0, 0, 0, 0, 0]
            
            cursor.close()
            return {'labels': labels, 'data': data}
            
        except Exception as e:
            print(f'Error fetching line chart data: {e}')
            raise e
        finally:
            if conn:
                self.return_connection(conn)

    def get_bar_chart_data(self):
        """Get bar chart data (inventory by category)"""
        conn = None
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT 
                    category,
                    COUNT(*) as count
                FROM products
                GROUP BY category
                ORDER BY count DESC
            """)
            
            rows = cursor.fetchall()
            
            labels = [row[0] for row in rows]
            data = [int(row[1]) for row in rows]
            
            # If no data, return empty arrays
            if not labels:
                labels = []
                data = []
            
            cursor.close()
            return {'labels': labels, 'data': data}
            
        except Exception as e:
            print(f'Error fetching bar chart data: {e}')
            raise e
        finally:
            if conn:
                self.return_connection(conn)

    def get_pie_chart_data(self):
        """Get pie chart data (status distribution)"""
        conn = None
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT 
                    status,
                    COUNT(*) as count
                FROM products
                GROUP BY status
            """)
            
            rows = cursor.fetchall()
            
            labels = [row[0] for row in rows]
            data = [int(row[1]) for row in rows]
            
            # If no data, return empty arrays
            if not labels:
                labels = []
                data = []
            
            cursor.close()
            return {'labels': labels, 'data': data}
            
        except Exception as e:
            print(f'Error fetching pie chart data: {e}')
            raise e
        finally:
            if conn:
                self.return_connection(conn)

    def close(self):
        """Close all connections in the pool"""
        if self.connection_pool:
            self.connection_pool.closeall()
            print('Database connection pool closed')

