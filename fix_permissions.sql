-- SQL скрипт для выдачи прав пользователю на схему public
-- Выполните этот скрипт от имени суперпользователя PostgreSQL (обычно postgres)

-- Замените 'testGr' на ваше имя пользователя
-- Замените 'postgres' на имя вашей базы данных

-- Подключитесь к базе данных как суперпользователь:
-- psql -U postgres -d postgres

-- Затем выполните следующие команды:

-- Выдать права на использование схемы public
GRANT USAGE ON SCHEMA public TO testGr;

-- Выдать права на создание объектов в схеме public
GRANT CREATE ON SCHEMA public TO testGr;

-- Выдать права на все существующие таблицы в схеме public
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO testGr;

-- Выдать права на все будущие таблицы в схеме public
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO testGr;

-- Выдать права на все последовательности (для SERIAL)
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO testGr;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO testGr;

