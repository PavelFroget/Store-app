from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from passlib.hash import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from datetime import datetime

from database import SessionLocal
from models import User, Product
from schemas import UserRegister, UserLogin, ProductCreate, Token, TokenData
from schemas import OrderCreate, OrderItemCreate
from models import Order, OrderItem

from schemas import CategoryCreate, CategoryUpdate, CategoryOut
from models import Category

SECRET_KEY = "secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "http://127.0.0.1:4200"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    
    db = SessionLocal()
    user = db.query(User).filter(User.email == token_data.email).first()
    db.close()
    
    if user is None:
        raise credentials_exception
    return user

@app.post("/orders")
def create_order(order_data: OrderCreate, current_user: User = Depends(get_current_user)):
    db = SessionLocal()
    
    total = sum(item.purchase_price * item.quantity for item in order_data.items)
    
    new_order = Order(
        user_id=current_user.id,
        total_amount=total,
        status="NEW",
        created_at=datetime.utcnow()
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    
    order_id = new_order.id
    
    for item in order_data.items:
        order_item = OrderItem(
            order_id=order_id,          
            product_id=item.product_id,
            quantity=item.quantity,
            purchase_price=item.purchase_price
        )
        db.add(order_item)
    
    db.commit()
    db.close()
    
    return {"message": "Заказ создан", "order_id": order_id, "total": total}

@app.get("/orders")
def get_orders(current_user: User = Depends(get_current_user)):
    db = SessionLocal()
    orders = db.query(Order).filter(Order.user_id == current_user.id).all()
    result = []
    for order in orders:
        items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
        items_data = []
        for item in items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            items_data.append({
                "product_id": item.product_id,
                "product_name": product.name if product else "Товар удален",
                "quantity": item.quantity,
                "purchase_price": item.purchase_price
            })
        result.append({
            "id": order.id,
            "created_at": order.created_at,
            "status": order.status,
            "total_amount": order.total_amount,
            "items": items_data
        })
    db.close()
    return result

@app.get("/")
def root():
    return {"message": "Сервер работает"}

@app.post("/register")
def register(user: UserRegister):
    db: Session = SessionLocal()
    
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        db.close()
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = bcrypt.hash(user.password)
    new_user = User(
        name=user.name,
        email=user.email,
        password_hash=hashed_password,
        role="user",
        is_blocked=False
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    db.close()
    
    return {"message": "Пользователь зарегистрирован", "user_id": new_user.id}

@app.post("/login", response_model=Token)
def login(user: UserLogin):
    db = SessionLocal()
    db_user = db.query(User).filter(User.email == user.email).first()
    db.close()
    
    if not db_user:
        raise HTTPException(status_code=400, detail="Пользователь не найден")
    
    if db_user.is_blocked:
        raise HTTPException(status_code=403, detail="Пользователь заблокирован")
    
    if not bcrypt.verify(user.password, db_user.password_hash):
        raise HTTPException(status_code=400, detail="Неверный пароль")
    
    # Создаём токен
    access_token = create_access_token(
        data={"sub": db_user.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "is_blocked": current_user.is_blocked
    }

@app.get("/products")
def get_products():
    db = SessionLocal()
    products = db.query(Product).all()
    db.close()
    return products

@app.post("/products")
def create_product(product: ProductCreate):
    db = SessionLocal()
    new_product = Product(
        name=product.name,
        description=product.description,
        price=product.price,
        stock_quantity=product.stock_quantity,
        image_url=product.image_url,
        category_id=product.category_id
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    db.close()
    return {"message": "Товар добавлен", "product_id": new_product.id}

@app.get("/verify-token")
def verify_token(current_user: User = Depends(get_current_user)):
    return {"message": "Токен валиден", "user": current_user.email}

@app.post("/categories", response_model=CategoryOut)
def create_category(category: CategoryCreate):
    db = SessionLocal()
    new_category = Category(name=category.name, description=category.description)
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    db.close()
    return new_category

@app.get("/categories", response_model=list[CategoryOut])
def get_categories():
    db = SessionLocal()
    categories = db.query(Category).all()
    db.close()
    return categories

@app.get("/categories/{category_id}", response_model=CategoryOut)
def get_category(category_id: int):
    db = SessionLocal()
    category = db.query(Category).filter(Category.id == category_id).first()
    db.close()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@app.put("/categories/{category_id}", response_model=CategoryOut)
def update_category(
    category_id: int,
    category_update: CategoryUpdate,
):
    db = SessionLocal()
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        db.close()
        raise HTTPException(status_code=404, detail="Category not found")
    category.name = category_update.name
    category.description = category_update.description
    db.commit()
    db.refresh(category)
    db.close()
    return category

@app.delete("/categories/{category_id}")
def delete_category(category_id: int):
    db = SessionLocal()
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        db.close()
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(category)
    db.commit()
    db.close()
    return {"message": "Category deleted"}