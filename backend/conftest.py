import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base
from main import app
from models import * 

print(Base.metadata.tables.keys())

Base.metadata.create_all(bind=engine)

from database import get_db



# Подключаемся к тестовой БД (в CI это будет PostgreSQL, локально можно изменить)
DATABASE_URL = "postgresql://postgres:1234@localhost:5432/building_store"

@pytest.fixture(scope="session")
def test_engine():
    engine = create_engine(DATABASE_URL)
    # Создаём все таблицы перед тестами
    Base.metadata.create_all(bind=engine)
    yield engine
    # Удаляем таблицы после тестов
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session(test_engine):
    Session = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    session = Session()
    yield session
    session.rollback()
    session.close()

@pytest.fixture(scope="function")
def client(db_session):
    # Подменяем зависимость get_db, чтобы тесты использовали нашу тестовую сессию
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()