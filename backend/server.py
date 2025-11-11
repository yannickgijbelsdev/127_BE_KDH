from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
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

# 2FA Configuration
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@127.be')
TOTP_SECRET = os.environ.get('TOTP_SECRET', '')

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

class AnalyticsEvent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tool_id: str
    tool_name: str
    event_type: str  # "visit", "click", "action", etc.
    event_data: dict = {}  # Flexible data storage
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AnalyticsEventCreate(BaseModel):
    tool_id: str
    tool_name: str
    event_type: str
    event_data: dict = {}

class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class Feedback(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    rating: int  # 1-10
    feedback_text: str
    suggestions: Optional[str] = None
    browser_name: Optional[str] = None
    browser_version: Optional[str] = None
    operating_system: Optional[str] = None
    gpu_vendor: Optional[str] = None
    gpu_renderer: Optional[str] = None
    cpu_cores: Optional[int] = None
    cpu_info: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    screen_resolution: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FeedbackCreate(BaseModel):
    rating: int
    feedback_text: str
    suggestions: Optional[str] = None
    browser_name: Optional[str] = None
    browser_version: Optional[str] = None
    operating_system: Optional[str] = None
    gpu_vendor: Optional[str] = None
    gpu_renderer: Optional[str] = None
    cpu_cores: Optional[int] = None
    cpu_info: Optional[str] = None
    user_agent: Optional[str] = None
    screen_resolution: Optional[str] = None

class ToolSuggestion(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tool_name: str
    description: str
    use_case: Optional[str] = None
    browser_name: Optional[str] = None
    browser_version: Optional[str] = None
    operating_system: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    status: str = "new"  # new, reviewed, implemented, rejected
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ToolSuggestionCreate(BaseModel):
    tool_name: str
    description: str
    use_case: Optional[str] = None
    browser_name: Optional[str] = None
    browser_version: Optional[str] = None
    operating_system: Optional[str] = None
    user_agent: Optional[str] = None

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

# ==================== AUTOSOFT MODELS ====================
class ReplacementDeviceChecklist(BaseModel):
    no_damage: bool = False
    windows_version: Optional[str] = None  # "win10_22h2", "win11_23h2", "win11_24h2", "win11_25h2"
    charger_included: bool = False
    image_restored: bool = False
    customer_data_wiped: bool = False
    notes: str = ""

class ReplacementDevice(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    barcode: str
    status: str = "technical_check"  # "technical_check", "checked"
    scans: List[str] = Field(default_factory=list)  # ISO datetime strings
    checklist: Optional[ReplacementDeviceChecklist] = None
    checked_by: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class DeviceScanRequest(BaseModel):
    barcode: str

class ChecklistUpdateRequest(BaseModel):
    checklist: ReplacementDeviceChecklist

# Initialize default admin on startup
async def create_default_admin():
    # Check if ANY admin user exists
    existing_admin = await db.users.find_one({"role": "admin"})
    if existing_admin:
        logger.info("Admin user already exists")
        return
    
    # No hardcoded admin creation - will be done via setup flow
    logger.info("No admin found - use /api/admin/setup to create first admin")

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

# ==================== ADMIN SETUP (First Time) ====================

@api_router.get("/admin/needs-setup")
async def check_needs_setup():
    """Check if initial admin setup is needed"""
    admin_count = await db.users.count_documents({"role": "admin"})
    needs_setup = admin_count == 0
    logger.info(f"Admin count: {admin_count}, needs_setup: {needs_setup}")
    return {"needs_setup": needs_setup}

@api_router.post("/admin/setup")
async def setup_admin(user_data: UserCreate):
    """Create the first admin user (only works if no admin exists)"""
    # Check if admin already exists
    existing_admin = await db.users.find_one({"role": "admin"})
    if existing_admin:
        raise HTTPException(status_code=400, detail="Admin already exists")
    
    # Check if email already in use
    existing_email = await db.users.find_one({"email": user_data.email})
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already in use")
    
    # Create admin user
    admin_user = User(
        email=user_data.email,
        username=user_data.username,
        password_hash=hash_password(user_data.password),
        role="admin",
        is2FAEnabled=False
    )
    
    doc = admin_user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    
    return {
        "message": "Admin user created successfully",
        "id": admin_user.id,
        "email": admin_user.email,
        "username": admin_user.username
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

# ==================== 2FA MANAGEMENT ====================

@api_router.post("/admin/users/{user_id}/enable-2fa")
async def enable_2fa(user_id: str, current_admin: User = Depends(get_current_admin)):
    # Generate new 2FA secret
    secret = pyotp.random_base32()
    
    # Update user with secret and enable 2FA
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "twofa_secret": secret,
            "is2FAEnabled": True
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user info for QR code
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    
    # Generate OTP Auth URL
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(
        name=user['email'],
        issuer_name="127.be Admin"
    )
    
    # Generate QR code as base64
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(provisioning_uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    import base64
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    img_base64 = base64.b64encode(img_byte_arr.getvalue()).decode('utf-8')
    
    return {
        "secret": secret,
        "qr_code_data": f"data:image/png;base64,{img_base64}",
        "provisioning_uri": provisioning_uri,
        "message": "2FA enabled. Scan QR code with Google Authenticator"
    }

@api_router.get("/admin/users/{user_id}/2fa-qrcode")
async def get_2fa_qrcode(user_id: str, current_admin: User = Depends(get_current_admin)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user or not user.get('twofa_secret'):
        raise HTTPException(status_code=404, detail="2FA not enabled for this user")
    
    # Generate QR code
    totp = pyotp.TOTP(user['twofa_secret'])
    provisioning_uri = totp.provisioning_uri(
        name=user['email'],
        issuer_name="127.be Admin"
    )
    
    # Create QR code image
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(provisioning_uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to bytes
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    
    return StreamingResponse(img_byte_arr, media_type="image/png")

@api_router.post("/admin/users/{user_id}/disable-2fa")
async def disable_2fa(user_id: str, current_admin: User = Depends(get_current_admin)):
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "is2FAEnabled": False,
            "twofa_secret": None
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "2FA disabled successfully"}

@api_router.post("/admin/users/{user_id}/verify-2fa")
async def verify_2fa_code(user_id: str, totp_code: str, current_admin: User = Depends(get_current_admin)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user or not user.get('twofa_secret'):
        raise HTTPException(status_code=404, detail="2FA not enabled")
    
    totp = pyotp.TOTP(user['twofa_secret'])
    if totp.verify(totp_code):
        return {"message": "2FA code verified successfully", "valid": True}
    else:
        return {"message": "Invalid 2FA code", "valid": False}

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

# ==================== PUBLIC TOOL STATUS ENDPOINTS ====================

@api_router.get("/tools")
async def get_enabled_tools():
    """Get all enabled tools (publicly accessible)"""
    tools = await db.tools.find({"enabled": True}, {"_id": 0, "code": 0, "file_path": 0}).to_list(1000)
    return tools

@api_router.get("/tools/{tool_id}/status")
async def get_tool_status(tool_id: str):
    """Check if a specific tool is enabled (publicly accessible)"""
    tool = await db.tools.find_one({"id": tool_id}, {"_id": 0, "enabled": 1, "name": 1})
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    return {"id": tool_id, "enabled": tool.get("enabled", True), "name": tool.get("name", "")}

# ==================== ANALYTICS ENDPOINTS ====================

@api_router.post("/analytics/event")
async def log_analytics_event(event: AnalyticsEventCreate, request: Request):
    """Log an analytics event (publicly accessible)"""
    # Get IP address from request
    client_ip = request.client.host
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()
    
    analytics_event = AnalyticsEvent(
        tool_id=event.tool_id,
        tool_name=event.tool_name,
        event_type=event.event_type,
        event_data=event.event_data,
        ip_address=client_ip
    )
    
    doc = analytics_event.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.analytics.insert_one(doc)
    
    return {"message": "Event logged successfully", "id": analytics_event.id}

@api_router.get("/admin/analytics/events", response_model=dict)
async def get_all_analytics(
    page: int = 1,
    limit: int = 50,
    current_admin: User = Depends(get_current_admin)
):
    """Get all analytics events with pagination"""
    skip = (page - 1) * limit
    
    # Get total count
    total = await db.analytics.count_documents({})
    
    # Get paginated events
    events = await db.analytics.find({}, {"_id": 0}).sort("timestamp", -1).skip(skip).limit(limit).to_list(limit)
    
    return {
        "events": events,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit  # Ceiling division
    }

@api_router.get("/admin/analytics/tool/{tool_id}", response_model=List[dict])
async def get_tool_analytics(tool_id: str, current_admin: User = Depends(get_current_admin)):
    """Get analytics for a specific tool"""
    events = await db.analytics.find({"tool_id": tool_id}, {"_id": 0}).sort("timestamp", -1).limit(500).to_list(500)
    return events

@api_router.get("/admin/analytics/stats")
async def get_analytics_stats(current_admin: User = Depends(get_current_admin)):
    """Get aggregated analytics statistics"""
    # Total events
    total_events = await db.analytics.count_documents({})
    
    # Events by tool
    pipeline = [
        {"$group": {"_id": "$tool_id", "count": {"$sum": 1}, "tool_name": {"$first": "$tool_name"}}},
        {"$sort": {"count": -1}}
    ]
    events_by_tool = await db.analytics.aggregate(pipeline).to_list(None)
    
    # Events by type
    pipeline_type = [
        {"$group": {"_id": "$event_type", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    events_by_type = await db.analytics.aggregate(pipeline_type).to_list(None)
    
    # Unique visitors (approximation based on unique sessions)
    unique_visitors = await db.analytics.distinct("event_data.session_id")
    
    return {
        "total_events": total_events,
        "events_by_tool": events_by_tool,
        "events_by_type": events_by_type,
        "unique_visitors": len(unique_visitors) if unique_visitors else 0
    }

# ==================== FEEDBACK ENDPOINTS ====================

@api_router.post("/feedback")
async def submit_feedback(feedback: FeedbackCreate, request: Request):
    """Submit user feedback (publicly accessible)"""
    # Get IP address from request
    client_ip = request.client.host
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()
    
    feedback_entry = Feedback(
        rating=feedback.rating,
        feedback_text=feedback.feedback_text,
        suggestions=feedback.suggestions,
        browser_name=feedback.browser_name,
        browser_version=feedback.browser_version,
        operating_system=feedback.operating_system,
        gpu_vendor=feedback.gpu_vendor,
        gpu_renderer=feedback.gpu_renderer,
        cpu_cores=feedback.cpu_cores,
        cpu_info=feedback.cpu_info,
        user_agent=feedback.user_agent,
        screen_resolution=feedback.screen_resolution,
        ip_address=client_ip
    )
    
    doc = feedback_entry.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.feedback.insert_one(doc)
    
    return {"message": "Feedback submitted successfully", "id": feedback_entry.id}

@api_router.get("/admin/feedback", response_model=dict)
async def get_all_feedback(
    page: int = 1,
    limit: int = 50,
    current_admin: User = Depends(get_current_admin)
):
    """Get all feedback with pagination"""
    skip = (page - 1) * limit
    
    # Get total count
    total = await db.feedback.count_documents({})
    
    # Get paginated feedback
    feedback_list = await db.feedback.find({}, {"_id": 0}).sort("timestamp", -1).skip(skip).limit(limit).to_list(limit)
    
    return {
        "feedback": feedback_list,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }

@api_router.get("/admin/feedback/stats")
async def get_feedback_stats(current_admin: User = Depends(get_current_admin)):
    """Get feedback statistics"""
    total_feedback = await db.feedback.count_documents({})
    
    # Average rating
    pipeline = [
        {"$group": {
            "_id": None,
            "avg_rating": {"$avg": "$rating"},
            "ratings": {"$push": "$rating"}
        }}
    ]
    result = await db.feedback.aggregate(pipeline).to_list(1)
    avg_rating = result[0]["avg_rating"] if result else 0
    
    # Rating distribution
    rating_counts = {}
    for i in range(1, 11):
        count = await db.feedback.count_documents({"rating": i})
        rating_counts[str(i)] = count
    
    return {
        "total_feedback": total_feedback,
        "average_rating": round(avg_rating, 2) if avg_rating else 0,
        "rating_distribution": rating_counts
    }

@api_router.delete("/admin/feedback/{feedback_id}")
async def delete_feedback(feedback_id: str, current_admin: User = Depends(get_current_admin)):
    """Delete a feedback entry"""
    result = await db.feedback.delete_one({"id": feedback_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    return {"message": "Feedback deleted successfully"}

@api_router.get("/admin/feedback/insights/keywords")
async def get_feedback_keywords(current_admin: User = Depends(get_current_admin)):
    """Get keyword insights from feedback"""
    import re
    from collections import Counter
    
    # Get all feedback
    all_feedback = await db.feedback.find({}, {"_id": 0}).to_list(None)
    
    if not all_feedback:
        return {
            "positive_keywords": [],
            "negative_keywords": [],
            "common_topics": [],
            "suggestions_keywords": []
        }
    
    # Dutch stop words
    stop_words = {
        'de', 'het', 'een', 'en', 'van', 'in', 'op', 'is', 'te', 'dat', 'voor', 'met',
        'niet', 'zijn', 'was', 'maar', 'er', 'als', 'bij', 'om', 'aan', 'ook', 'uit',
        'naar', 'door', 'kan', 'nog', 'deze', 'die', 'dan', 'meer', 'of', 'wat', 'ik',
        'je', 'hij', 'ze', 'we', 'hun', 'mijn', 'me', 'dit', 'zou', 'geen', 'wel', 'zoals',
        'over', 'al', 'zo', 'wordt', 'heel', 'veel', 'heeft', 'waren', 'zijn', 'kan',
        'moet', 'hebben', 'had', 'worden', 'waar', 'omdat', 'alleen', 'dus', 'onder',
        'tegen', 'na', 'nu', 'tot', 'iets', 'zeer', 'alle', 'hier', 'hem', 'haar', 'mij',
        'ons', 'jullie', 'dan', 'toen', 'daarom', 'echter', 'want', 'maar', 'toch',
        'altijd', 'nooit', 'vaak', 'soms', 'andere', 'eigen', 'ander', 'nieuwe', 'grote',
        'kleine', 'goede', 'beste', 'eerste', 'laatste', 'hele', 'zelf', 'elkaar', 'alles',
        'niets', 'iemand', 'niemand', 'elk', 'elke', 'iedere', 'beide', 'enige', 'enkele',
        'u', 'jullie', 'zullen', 'kunnen', 'moeten', 'willen', 'mogen', 'laten', 'gaan',
        'komen', 'zien', 'doen', 'maken', 'geven', 'krijgen', 'worden', 'blijven', 'staan',
        'zitten', 'liggen', 'houden', 'dragen', 'slaan', 'vallen', 'brengen', 'denken',
        'weten', 'zeggen', 'vertellen', 'vragen', 'antwoorden', 'kijken', 'luisteren',
        'voelen', 'horen', 'ruiken', 'proeven', 'proberen', 'beginnen', 'eindigen',
        'stoppen', 'verder', 'erg', 'gewoon', 'misschien', 'waarom', 'hoe', 'wanneer',
        'welke', 'wie', 'wat', 'waar'
    }
    
    def extract_keywords(text):
        if not text:
            return []
        # Convert to lowercase and extract words
        words = re.findall(r'\b\w+\b', text.lower())
        # Filter out stop words and short words
        return [w for w in words if len(w) > 3 and w not in stop_words]
    
    # Separate by rating
    positive_feedback = [f for f in all_feedback if f.get('rating', 0) >= 8]
    negative_feedback = [f for f in all_feedback if f.get('rating', 0) <= 4]
    
    # Extract keywords
    positive_words = []
    negative_words = []
    all_words = []
    suggestions_words = []
    
    for f in positive_feedback:
        positive_words.extend(extract_keywords(f.get('feedback_text', '')))
    
    for f in negative_feedback:
        negative_words.extend(extract_keywords(f.get('feedback_text', '')))
    
    for f in all_feedback:
        all_words.extend(extract_keywords(f.get('feedback_text', '')))
        if f.get('suggestions'):
            suggestions_words.extend(extract_keywords(f.get('suggestions', '')))
    
    # Count occurrences
    positive_counter = Counter(positive_words).most_common(15)
    negative_counter = Counter(negative_words).most_common(15)
    common_counter = Counter(all_words).most_common(20)
    suggestions_counter = Counter(suggestions_words).most_common(15)
    
    return {
        "positive_keywords": [{"word": word, "count": count} for word, count in positive_counter],
        "negative_keywords": [{"word": word, "count": count} for word, count in negative_counter],
        "common_topics": [{"word": word, "count": count} for word, count in common_counter],
        "suggestions_keywords": [{"word": word, "count": count} for word, count in suggestions_counter],
        "total_analyzed": len(all_feedback),
        "positive_count": len(positive_feedback),
        "negative_count": len(negative_feedback)
    }

# ==================== TOOL SUGGESTION ENDPOINTS ====================

@api_router.post("/tool-suggestions")
async def submit_tool_suggestion(suggestion: ToolSuggestionCreate, request: Request):
    """Submit a tool suggestion (publicly accessible)"""
    # Get IP address from request
    client_ip = request.client.host
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()
    
    suggestion_entry = ToolSuggestion(
        tool_name=suggestion.tool_name,
        description=suggestion.description,
        use_case=suggestion.use_case,
        browser_name=suggestion.browser_name,
        browser_version=suggestion.browser_version,
        operating_system=suggestion.operating_system,
        user_agent=suggestion.user_agent,
        ip_address=client_ip,
        status="new"
    )
    
    doc = suggestion_entry.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.tool_suggestions.insert_one(doc)
    
    return {"message": "Tool suggestion submitted successfully", "id": suggestion_entry.id}

@api_router.get("/admin/tool-suggestions", response_model=dict)
async def get_all_tool_suggestions(
    page: int = 1,
    limit: int = 50,
    status: Optional[str] = None,
    current_admin: User = Depends(get_current_admin)
):
    """Get all tool suggestions with pagination"""
    skip = (page - 1) * limit
    
    # Build query filter
    query = {}
    if status:
        query["status"] = status
    
    # Get total count
    total = await db.tool_suggestions.count_documents(query)
    
    # Get paginated suggestions
    suggestions_list = await db.tool_suggestions.find(query, {"_id": 0}).sort("timestamp", -1).skip(skip).limit(limit).to_list(limit)
    
    return {
        "suggestions": suggestions_list,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }

@api_router.get("/admin/tool-suggestions/stats")
async def get_tool_suggestions_stats(current_admin: User = Depends(get_current_admin)):
    """Get tool suggestions statistics"""
    total_suggestions = await db.tool_suggestions.count_documents({})
    new_suggestions = await db.tool_suggestions.count_documents({"status": "new"})
    reviewed_suggestions = await db.tool_suggestions.count_documents({"status": "reviewed"})
    implemented_suggestions = await db.tool_suggestions.count_documents({"status": "implemented"})
    rejected_suggestions = await db.tool_suggestions.count_documents({"status": "rejected"})
    
    return {
        "total_suggestions": total_suggestions,
        "new": new_suggestions,
        "reviewed": reviewed_suggestions,
        "implemented": implemented_suggestions,
        "rejected": rejected_suggestions
    }

@api_router.put("/admin/tool-suggestions/{suggestion_id}/status")
async def update_suggestion_status(
    suggestion_id: str,
    status_data: dict,
    current_admin: User = Depends(get_current_admin)
):
    """Update tool suggestion status"""
    result = await db.tool_suggestions.update_one(
        {"id": suggestion_id},
        {"$set": {"status": status_data.get("status")}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Tool suggestion not found")
    
    return {"message": "Status updated successfully"}

@api_router.delete("/admin/tool-suggestions/{suggestion_id}")
async def delete_tool_suggestion(suggestion_id: str, current_admin: User = Depends(get_current_admin)):
    """Delete a tool suggestion"""
    result = await db.tool_suggestions.delete_one({"id": suggestion_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tool suggestion not found")
    
    return {"message": "Tool suggestion deleted successfully"}

# ==================== AUTOSOFT ROUTES ====================
@api_router.post("/autosoft/scan")
async def scan_device(
    scan_request: DeviceScanRequest,
    current_admin: User = Depends(get_current_admin)
):
    """Scan a device barcode - first scan registers, second scan returns device for checklist"""
    barcode = scan_request.barcode.strip()
    
    # Check if device exists
    existing_device = await db.replacement_devices.find_one({"barcode": barcode}, {"_id": 0})
    
    if existing_device:
        # Second scan - return device info for checklist
        return {
            "action": "open_checklist",
            "device": existing_device
        }
    else:
        # First scan - register device
        new_device = ReplacementDevice(
            barcode=barcode,
            status="technical_check",
            scans=[datetime.now(timezone.utc).isoformat()]
        )
        
        doc = new_device.model_dump()
        await db.replacement_devices.insert_one(doc)
        
        return {
            "action": "registered",
            "device": new_device.model_dump()
        }

@api_router.get("/autosoft/devices")
async def get_all_devices(
    status: Optional[str] = None,
    current_admin: User = Depends(get_current_admin)
):
    """Get all replacement devices"""
    query = {}
    if status:
        query["status"] = status
    
    devices = await db.replacement_devices.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return {"devices": devices}

@api_router.get("/autosoft/device/{barcode}")
async def get_device(
    barcode: str,
    current_admin: User = Depends(get_current_admin)
):
    """Get specific device by barcode"""
    device = await db.replacement_devices.find_one({"barcode": barcode}, {"_id": 0})
    
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    return device

@api_router.put("/autosoft/device/{barcode}/checklist")
async def update_device_checklist(
    barcode: str,
    checklist_data: ChecklistUpdateRequest,
    current_admin: User = Depends(get_current_admin)
):
    """Update device checklist and mark as checked"""
    # Add second scan timestamp
    result = await db.replacement_devices.update_one(
        {"barcode": barcode},
        {
            "$set": {
                "status": "checked",
                "checklist": checklist_data.checklist.model_dump(),
                "checked_by": current_admin.username,
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            "$push": {
                "scans": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Get updated device
    updated_device = await db.replacement_devices.find_one({"barcode": barcode}, {"_id": 0})
    return updated_device

@api_router.delete("/autosoft/device/{barcode}")
async def delete_device(
    barcode: str,
    current_admin: User = Depends(get_current_admin)
):
    """Delete a device"""
    result = await db.replacement_devices.delete_one({"barcode": barcode})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Device not found")
    
    return {"message": "Device deleted successfully"}

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