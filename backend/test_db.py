from database import engine

try:
    connection = engine.connect()
    print("Подключение к БД успешно!")
    connection.close()
except Exception as e:
    print("Ошибка:", e)