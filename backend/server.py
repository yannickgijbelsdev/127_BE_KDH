from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import pyotp
import qrcode
import io


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

security = HTTPBearer()

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    username: str
    password_hash: str
    role: str = "user"  # "admin" or "user"
    is2FAEnabled: bool = False
    twofa_secret: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    role: str = "user"

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    password: Optional[str] = None
    is2FAEnabled: Optional[bool] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    totp_code: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class ToolConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    name: str
    path: str
    enabled: bool = True
    file_path: str
    code: str
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Helper Functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**user)

async def get_current_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user

# Initialize default admin on startup
async def create_default_admin():
    existing_admin = await db.users.find_one({"email": "admin@127.be"})
    if not existing_admin:
        admin_user = User(
            email="admin@127.be",
            username="admin",
            password_hash=hash_password("Admin123!"),
            role="admin",
            is2FAEnabled=False
        )
        doc = admin_user.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.users.insert_one(doc)
        logger.info("Default admin created: admin@127.be / Admin123!")

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# ==================== ADMIN AUTH ROUTES ====================

@api_router.post("/admin/login", response_model=Token)
async def admin_login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Check 2FA if enabled
    if user['is2FAEnabled']:
        if not credentials.totp_code:
            raise HTTPException(status_code=401, detail="2FA code required")
        
        totp = pyotp.TOTP(user['twofa_secret'])
        if not totp.verify(credentials.totp_code):
            raise HTTPException(status_code=401, detail="Invalid 2FA code")
    
    access_token = create_access_token({"sub": user['id']})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user['id'],
            "email": user['email'],
            "username": user['username'],
            "role": user['role']
        }
    }

@api_router.get("/admin/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "role": current_user.role,
        "is2FAEnabled": current_user.is2FAEnabled
    }

# ==================== ADMIN USER MANAGEMENT ====================

@api_router.get("/admin/users", response_model=List[dict])
async def get_all_users(current_admin: User = Depends(get_current_admin)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0, "twofa_secret": 0}).to_list(1000)
    return users

@api_router.post("/admin/users", response_model=dict)
async def create_user(user_data: UserCreate, current_admin: User = Depends(get_current_admin)):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    
    new_user = User(
        email=user_data.email,
        username=user_data.username,
        password_hash=hash_password(user_data.password),
        role=user_data.role
    )
    
    doc = new_user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    
    return {"id": new_user.id, "email": new_user.email, "username": new_user.username}

@api_router.put("/admin/users/{user_id}")
async def update_user(user_id: str, user_data: UserUpdate, current_admin: User = Depends(get_current_admin)):
    update_dict = {}
    if user_data.email:
        update_dict['email'] = user_data.email
    if user_data.username:
        update_dict['username'] = user_data.username
    if user_data.password:
        update_dict['password_hash'] = hash_password(user_data.password)
    if user_data.is2FAEnabled is not None:
        update_dict['is2FAEnabled'] = user_data.is2FAEnabled
        if user_data.is2FAEnabled and not update_dict.get('twofa_secret'):
            update_dict['twofa_secret'] = pyotp.random_base32()
    
    result = await db.users.update_one({"id": user_id}, {"$set": update_dict})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User updated successfully"}

@api_router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, current_admin: User = Depends(get_current_admin)):
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}

# ==================== ADMIN TOOL MANAGEMENT ====================

@api_router.get("/admin/tools", response_model=List[ToolConfig])
async def get_tools(current_admin: User = Depends(get_current_admin)):
    tools = await db.tools.find({}, {"_id": 0}).to_list(1000)
    return tools

@api_router.get("/admin/tools/{tool_id}", response_model=ToolConfig)
async def get_tool(tool_id: str, current_admin: User = Depends(get_current_admin)):
    tool = await db.tools.find_one({"id": tool_id}, {"_id": 0})
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    return tool

@api_router.put("/admin/tools/{tool_id}")
async def update_tool(tool_id: str, tool_data: dict, current_admin: User = Depends(get_current_admin)):
    update_dict = tool_data.copy()
    update_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    # Save code to file if provided
    if 'code' in update_dict and 'file_path' in update_dict:
        file_path = Path(update_dict['file_path'])
        if file_path.exists():
            file_path.write_text(update_dict['code'])
    
    result = await db.tools.update_one({"id": tool_id}, {"$set": update_dict})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Tool not found")
    
    return {"message": "Tool updated successfully"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    await create_default_admin()
    # Initialize tools configuration
    tools_count = await db.tools.count_documents({})
    if tools_count == 0:
        tools = [
            {
                "id": "dpd",
                "name": "Dead Pixel Detector",
                "path": "/dpd",
                "enabled": True,
                "file_path": str(ROOT_DIR.parent / "frontend" / "src" / "components" / "PixelTest.jsx"),
                "code": "",
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": "printer",
                "name": "Printer Tester",
                "path": "/printer",
                "enabled": True,
                "file_path": str(ROOT_DIR.parent / "frontend" / "src" / "components" / "PrinterTest.jsx"),
                "code": "",
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": "sscreen",
                "name": "Screen Refresh Tester",
                "path": "/sscreen",
                "enabled": True,
                "file_path": str(ROOT_DIR.parent / "frontend" / "src" / "components" / "ScreenTest.jsx"),
                "code": "",
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": "wea",
                "name": "Webcam & Audio Test",
                "path": "/wea",
                "enabled": True,
                "file_path": str(ROOT_DIR.parent / "frontend" / "src" / "components" / "WebcamAudioTest.jsx"),
                "code": "",
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": "password",
                "name": "Password Generator",
                "path": "/password",
                "enabled": True,
                "file_path": str(ROOT_DIR.parent / "frontend" / "src" / "components" / "PasswordGenerator.jsx"),
                "code": "",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db.tools.insert_many(tools)
        logger.info("Tools configuration initialized")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()