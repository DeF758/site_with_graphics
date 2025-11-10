#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Скрипт для создания файла .env с правильной кодировкой UTF-8
"""

import os

def create_env_file():
    print("Создание файла .env для подключения к PostgreSQL")
    print("=" * 50)
    
    db_host = input("DB_HOST (по умолчанию: localhost): ").strip() or "localhost"
    db_port = input("DB_PORT (по умолчанию: 5432): ").strip() or "5432"
    db_name = input("DB_NAME (обязательно): ").strip()
    db_user = input("DB_USER (обязательно): ").strip()
    db_password = input("DB_PASSWORD (обязательно): ").strip()
    port = input("PORT сервера (по умолчанию: 3000): ").strip() or "3000"
    
    if not db_name or not db_user or not db_password:
        print("Ошибка: DB_NAME, DB_USER и DB_PASSWORD обязательны!")
        return
    
    env_content = f"""# PostgreSQL Database Configuration
DB_HOST={db_host}
DB_PORT={db_port}
DB_NAME={db_name}
DB_USER={db_user}
DB_PASSWORD={db_password}

# Server Port
PORT={port}
"""
    
    # Write file with UTF-8 encoding
    with open('.env', 'w', encoding='utf-8') as f:
        f.write(env_content)
    
    print("\nФайл .env успешно создан!")
    print("Теперь вы можете запустить: python app.py")

if __name__ == '__main__':
    create_env_file()

