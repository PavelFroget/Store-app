from main import app
from database import SessionLocal
from sqlalchemy import text

def get_auth_token(client, email="test@example.com", password="123456"):
    client.post("/register", json={
        "name": "Test User",
        "email": email,
        "password": password
    })
    response = client.post("/login", json={
        "email": email,
        "password": password
    })
    assert response.status_code == 200
    return response.json()["access_token"]

#def clean_db():
#    db = SessionLocal()
#   db.execute(text("DELETE FROM order_items;"))
#    db.execute(text("DELETE FROM orders;"))
#    db.execute(text("DELETE FROM users;"))
#    db.commit()
#    db.close()

# Регистрация нового пользователя
def test_register(client):
    #clean_db()
    response = client.post("/register", json={
        "name": "Alice",
        "email": "alice@example.com",
        "password": "secret"
    })
    assert response.status_code == 200
    assert "user_id" in response.json()

# Попытка зарегистрироваться с уже существующим email
def test_register_dupl_email(client):
    #clean_db()
    client.post("/register", json={
        "name": "Bob",
        "email": "bob@example.com",
        "password": "pass"
    })
    response = client.post("/register", json={
        "name": "Bob2",
        "email": "bob@example.com",
        "password": "pass"
    })
    assert response.status_code == 400
    assert "Email already registered" in response.text

# Вход с правильными данными
def test_login(client):
    #clean_db()
    email = "login@example.com"
    password = "mypassword"
    client.post("/register", json={
        "name": "Login Test",
        "email": email,
        "password": password
    })
    response = client.post("/login", json={
        "email": email,
        "password": password
    })
    assert response.status_code == 200
    assert "access_token" in response.json()

# Вход с неверным паролем
def test_login_password(client):
    #clean_db()
    email = "wrong@example.com"
    password = "correct"
    client.post("/register", json={
        "name": "Wrong",
        "email": email,
        "password": password
    })
    response = client.post("/login", json={
        "email": email,
        "password": "incorrect"
    })
    assert response.status_code == 400
    assert "Неверный пароль" in response.text

# Получение списка товаров без авторизации
def test_get_products(client):
    response = client.get("/products")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

# Попытка создать заказ без токена
def test_create_order(client):
    response = client.post("/orders", json={"items": []})
    assert response.status_code == 401

# Получение данных текущего пользователя по JWT-токену
def test_get_user(client):
    #clean_db()
    token = get_auth_token(client, "me@example.com", "secret")
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/users/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["email"] == "me@example.com"