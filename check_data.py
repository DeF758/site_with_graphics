#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Скрипт для проверки данных в базе данных
"""

import os
from dotenv import load_dotenv
from database import Database

# Load environment variables
load_dotenv()

# Initialize database
db = Database()
db.init()

# Check if table exists and has data
try:
    total = db.get_total_products()
    print(f"Всего продуктов в базе данных: {total}")
    
    if total > 0:
        print("\nПервые 5 продуктов:")
        products = db.get_products(5, 0)
        for product in products:
            print(f"  ID: {product['id']}, Name: {product['name']}, Category: {product['category']}, Status: {product['status']}, Amount: {product['amount']}")
    else:
        print("\n⚠️  Таблица пустая! Нужно заполнить данными.")
        print("При первом запуске приложение должно автоматически заполнить таблицу 50 тестовыми записями.")
        print("Если этого не произошло, проверьте права доступа к таблице.")
    
    # Check chart data
    print("\n--- Данные для графиков ---")
    
    line_data = db.get_line_chart_data()
    print(f"Line Chart - Labels: {line_data['labels']}, Data: {line_data['data']}")
    
    bar_data = db.get_bar_chart_data()
    print(f"Bar Chart - Labels: {bar_data['labels']}, Data: {bar_data['data']}")
    
    pie_data = db.get_pie_chart_data()
    print(f"Pie Chart - Labels: {pie_data['labels']}, Data: {pie_data['data']}")
    
except Exception as e:
    print(f"Ошибка: {e}")
finally:
    db.close()

