from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File, Form, WebSocket, WebSocketDisconnect, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import base64
from io import BytesIO
from PIL import Image

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# GridFS bucket for file storage
fs_bucket = AsyncIOMotorGridFSBucket(db)

# JWT settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'kulikarai_family_secret_2024')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION = timedelta(days=30)

security = HTTPBearer()

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json(message)

    async def broadcast(self, message: dict, users: List[str]):
        for user_id in users:
            if user_id in self.active_connections:
                await self.active_connections[user_id].send_json(message)

manager = ConnectionManager()

# Create the main app
app = FastAPI()

# Health check endpoint (must be at root level for Kubernetes)
@app.get("/health")
async def health_check():
    """Health check endpoint for Kubernetes probes"""
    return {"status": "healthy", "service": "kulikarai-api"}

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfile(BaseModel):
    id: str
    email: str
    name: str
    bio: Optional[str] = None
    avatar: Optional[str] = None
    birthday: Optional[str] = None
    relationships: List[Dict] = []
    created_at: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    avatar: Optional[str] = None
    birthday: Optional[str] = None

class RelationshipAdd(BaseModel):
    user_id: str
    relation_type: str  # parent, sibling, child, spouse, etc.

# Industry-standard Family Tree Models
class FamilyMemberCreate(BaseModel):
    name: str
    gender: Optional[str] = "unknown"  # male, female, unknown
    birth_date: Optional[str] = None
    death_date: Optional[str] = None
    father_id: Optional[str] = None
    mother_id: Optional[str] = None
    spouse_id: Optional[str] = None
    bio: Optional[str] = None
    photo_url: Optional[str] = None

class FamilyMemberUpdate(BaseModel):
    name: Optional[str] = None
    gender: Optional[str] = None
    birth_date: Optional[str] = None
    death_date: Optional[str] = None
    father_id: Optional[str] = None
    mother_id: Optional[str] = None
    spouse_id: Optional[str] = None
    bio: Optional[str] = None
    photo_url: Optional[str] = None

class PhotoCreate(BaseModel):
    caption: Optional[str] = None
    album_id: Optional[str] = None

class PhotoUpdate(BaseModel):
    caption: Optional[str] = None
    tags: Optional[List[str]] = None

class Photo(BaseModel):
    id: str
    user_id: str
    url: str
    caption: Optional[str] = None
    album_id: Optional[str] = None
    tags: List[str] = []
    likes: List[str] = []
    created_at: str

class CommentCreate(BaseModel):
    comment: str

class Comment(BaseModel):
    id: str
    photo_id: str
    user_id: str
    comment: str
    created_at: str

class AlbumCreate(BaseModel):
    name: str
    description: Optional[str] = None

class Album(BaseModel):
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    created_at: str

class MessageCreate(BaseModel):
    receiver_id: Optional[str] = None
    group_id: Optional[str] = None
    message: str

class Message(BaseModel):
    id: str
    sender_id: str
    receiver_id: Optional[str] = None
    group_id: Optional[str] = None
    message: str
    created_at: str
    read: bool = False

class GroupCreate(BaseModel):
    name: str
    members: List[str]

class Group(BaseModel):
    id: str
    name: str
    members: List[str]
    created_by: str
    created_at: str

class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    date: str
    location: Optional[str] = None

class Event(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    date: str
    location: Optional[str] = None
    attendees: List[str] = []
    created_at: str

class PostCreate(BaseModel):
    content: str
    media: Optional[List[str]] = []

class Post(BaseModel):
    id: str
    user_id: str
    content: str
    media: List[str] = []
    likes: List[str] = []
    created_at: str

# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str) -> str:
    payload = {
        'user_id': user_id,
        'exp': datetime.now(timezone.utc) + JWT_EXPIRATION
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token: str) -> str:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload['user_id']
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    return verify_token(credentials.credentials)

# Auth endpoints
@api_router.post("/auth/register")
async def register(user: UserRegister):
    existing = await db.users.find_one({"email": user.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user.email,
        "password": hash_password(user.password),
        "name": user.name,
        "bio": "",
        "avatar": "",
        "birthday": "",
        "relationships": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    token = create_token(user_id)
    return {"token": token, "user_id": user_id}

@api_router.post("/auth/login")
async def login(user: UserLogin):
    db_user = await db.users.find_one({"email": user.email}, {"_id": 0})
    if not db_user or not verify_password(user.password, db_user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(db_user['id'])
    return {"token": token, "user_id": db_user['id']}

@api_router.get("/auth/me", response_model=UserProfile)
async def get_me(user_id: str = Depends(get_current_user)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# User endpoints
@api_router.put("/users/me", response_model=UserProfile)
async def update_user(update: UserUpdate, user_id: str = Depends(get_current_user)):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        await db.users.update_one({"id": user_id}, {"$set": update_data})
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    return user

@api_router.post("/users/relationships")
async def add_relationship(rel: RelationshipAdd, user_id: str = Depends(get_current_user)):
    relationship = {"user_id": rel.user_id, "relation_type": rel.relation_type}
    await db.users.update_one({"id": user_id}, {"$push": {"relationships": relationship}})
    return {"message": "Relationship added"}

@api_router.post("/users/add-parent")
async def add_parent(parent_data: dict, user_id: str = Depends(get_current_user)):
    """Add a parent to the family tree and create relationship"""
    parent_name = parent_data.get("parentName")
    relation = parent_data.get("relation", "parent")
    
    # Check if parent already exists
    existing = await db.users.find_one({"name": parent_name}, {"_id": 0})
    
    if existing:
        parent_id = existing['id']
    else:
        # Create new user for parent
        parent_id = str(uuid.uuid4())
        parent_doc = {
            "id": parent_id,
            "email": f"{parent_name.lower().replace(' ', '')}@kulikarai.family",
            "password": hash_password("changeme123"),
            "name": parent_name,
            "bio": "",
            "avatar": "",
            "birthday": "",
            "relationships": [{
                "user_id": user_id,
                "relation_type": "child"
            }],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(parent_doc)
    
    # Add relationship to current user
    relationship = {"user_id": parent_id, "relation_type": relation}
    await db.users.update_one({"id": user_id}, {"$push": {"relationships": relationship}})
    
    return {"message": "Parent added", "parent_id": parent_id}

@api_router.post("/users/add-family-member")
async def add_family_member(member_data: dict, user_id: str = Depends(get_current_user)):
    """Add a family member with optional parent information"""
    name = member_data.get("name")
    relation = member_data.get("relation")
    father_name = member_data.get("fatherName")
    mother_name = member_data.get("motherName")
    
    # Create new family member
    member_id = str(uuid.uuid4())
    member_doc = {
        "id": member_id,
        "email": f"{name.lower().replace(' ', '')}@kulikarai.family",
        "password": hash_password("changeme123"),
        "name": name,
        "bio": "",
        "avatar": "",
        "birthday": "",
        "relationships": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Add relationship to current user
    if relation:
        member_doc["relationships"].append({
            "user_id": user_id,
            "relation_type": "sibling" if relation in ["sibling"] else "child"
        })
        await db.users.update_one(
            {"id": user_id},
            {"$push": {"relationships": {"user_id": member_id, "relation_type": relation}}}
        )
    
    await db.users.insert_one(member_doc)
    
    # Add parents if provided
    parent_ids = []
    for parent_name, parent_relation in [(father_name, "father"), (mother_name, "mother")]:
        if parent_name:
            existing_parent = await db.users.find_one({"name": parent_name}, {"_id": 0})
            if existing_parent:
                parent_id = existing_parent['id']
            else:
                parent_id = str(uuid.uuid4())
                parent_doc = {
                    "id": parent_id,
                    "email": f"{parent_name.lower().replace(' ', '')}@kulikarai.family",
                    "password": hash_password("changeme123"),
                    "name": parent_name,
                    "bio": "",
                    "avatar": "",
                    "birthday": "",
                    "relationships": [{
                        "user_id": member_id,
                        "relation_type": "child"
                    }],
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await db.users.insert_one(parent_doc)
            
            # Add parent relationship to member
            await db.users.update_one(
                {"id": member_id},
                {"$push": {"relationships": {"user_id": parent_id, "relation_type": parent_relation}}}
            )
            parent_ids.append(parent_id)
    
    return {"message": "Family member added", "member_id": member_id, "parent_ids": parent_ids}

@api_router.delete("/users/relationships/{user_id}/{relation_user_id}")
async def delete_relationship(user_id: str, relation_user_id: str, current_user: str = Depends(get_current_user)):
    """Delete a relationship between two users"""
    if user_id != current_user:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.users.update_one(
        {"id": user_id},
        {"$pull": {"relationships": {"user_id": relation_user_id}}}
    )
    
    await db.users.update_one(
        {"id": relation_user_id},
        {"$pull": {"relationships": {"user_id": user_id}}}
    )
    
    return {"message": "Relationship deleted"}

@api_router.get("/users/family-tree")
async def get_family_tree(user_id: str = Depends(get_current_user)):
    users = await db.users.find({}, {"_id": 0, "password": 0, "email": 0}).to_list(1000)
    return {"users": users}

@api_router.get("/users")
async def search_users(query: str = Query(""), current_user: str = Depends(get_current_user)):
    if query:
        users = await db.users.find(
            {"name": {"$regex": query, "$options": "i"}},
            {"_id": 0, "password": 0, "email": 0}
        ).to_list(20)
    else:
        users = await db.users.find({}, {"_id": 0, "password": 0, "email": 0}).to_list(50)
    return {"users": users}

@api_router.get("/users/{user_id}", response_model=UserProfile)
async def get_user(user_id: str, current_user: str = Depends(get_current_user)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Photo endpoints
@api_router.post("/photos/upload")
async def upload_photo(
    file: UploadFile = File(...),
    caption: str = Form(""),
    album_id: str = Form(""),
    user_id: str = Depends(get_current_user)
):
    """Upload photo to MongoDB GridFS and store metadata."""
    try:
        # Read file content
        file_content = await file.read()
        
        # Validate file size (10MB max)
        if len(file_content) > 10 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File size exceeds 10MB limit")
        
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Only image files are allowed")
        
        # Resize image for optimization
        try:
            image = Image.open(BytesIO(file_content))
            
            # Convert RGBA to RGB if needed
            if image.mode == 'RGBA':
                image = image.convert('RGB')
            
            # Resize if too large (max 1920x1920)
            max_size = (1920, 1920)
            image.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            # Save optimized image
            img_byte_arr = BytesIO()
            image.save(img_byte_arr, format='JPEG', quality=85, optimize=True)
            file_content = img_byte_arr.getvalue()
        except Exception:
            # If image processing fails, use original
            pass
        
        # Upload to GridFS
        file_id = await fs_bucket.upload_from_stream(
            file.filename or f"photo_{uuid.uuid4()}.jpg",
            file_content,
            metadata={
                "content_type": file.content_type,
                "user_id": user_id,
                "uploaded_at": datetime.now(timezone.utc).isoformat()
            }
        )
        
        # Create photo document
        photo_id = str(uuid.uuid4())
        photo_doc = {
            "id": photo_id,
            "user_id": user_id,
            "file_id": str(file_id),
            "filename": file.filename,
            "caption": caption or "",
            "album_id": album_id or "",
            "tags": [],
            "likes": [],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.photos.insert_one(photo_doc)
        
        return {
            "id": photo_id,
            "file_id": str(file_id),
            "message": "Photo uploaded successfully",
            "url": f"/api/photos/file/{file_id}"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@api_router.get("/photos/file/{file_id}")
async def get_photo_file(file_id: str):
    """Retrieve photo file from GridFS."""
    try:
        from bson import ObjectId
        
        # Get file from GridFS
        grid_out = await fs_bucket.open_download_stream(ObjectId(file_id))
        
        # Read file content
        contents = await grid_out.read()
        
        # Get content type from metadata
        content_type = grid_out.metadata.get("content_type", "image/jpeg") if grid_out.metadata else "image/jpeg"
        
        return StreamingResponse(
            BytesIO(contents),
            media_type=content_type,
            headers={
                "Content-Disposition": f"inline; filename={grid_out.filename}"
            }
        )
    
    except Exception:
        raise HTTPException(status_code=404, detail="File not found")

@api_router.post("/photos")
async def upload_photo_legacy(photo_data: dict, user_id: str = Depends(get_current_user)):
    """Legacy endpoint for backward compatibility with base64 uploads."""
    photo_id = str(uuid.uuid4())
    photo_doc = {
        "id": photo_id,
        "user_id": user_id,
        "url": photo_data.get("image", ""),
        "caption": photo_data.get("caption", ""),
        "album_id": photo_data.get("album_id", ""),
        "tags": [],
        "likes": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.photos.insert_one(photo_doc)
    return {"id": photo_id, "message": "Photo uploaded"}

@api_router.get("/photos", response_model=List[Photo])
async def get_photos(album_id: Optional[str] = None, user_id: str = Depends(get_current_user)):
    query = {"album_id": album_id} if album_id else {}
    photos = await db.photos.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Update URLs for GridFS-stored photos
    for photo in photos:
        if photo.get("file_id"):
            photo["url"] = f"/api/photos/file/{photo['file_id']}"
    
    return photos

@api_router.get("/photos/{photo_id}", response_model=Photo)
async def get_photo(photo_id: str, user_id: str = Depends(get_current_user)):
    photo = await db.photos.find_one({"id": photo_id}, {"_id": 0})
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    return photo

@api_router.put("/photos/{photo_id}")
async def update_photo(photo_id: str, update: PhotoUpdate, user_id: str = Depends(get_current_user)):
    photo = await db.photos.find_one({"id": photo_id}, {"_id": 0})
    if not photo or photo['user_id'] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        await db.photos.update_one({"id": photo_id}, {"$set": update_data})
    return {"message": "Photo updated"}

@api_router.delete("/photos/{photo_id}")
async def delete_photo(photo_id: str, user_id: str = Depends(get_current_user)):
    photo = await db.photos.find_one({"id": photo_id}, {"_id": 0})
    if not photo or photo['user_id'] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.photos.delete_one({"id": photo_id})
    await db.photo_comments.delete_many({"photo_id": photo_id})
    return {"message": "Photo deleted"}

@api_router.post("/photos/{photo_id}/like")
async def like_photo(photo_id: str, user_id: str = Depends(get_current_user)):
    photo = await db.photos.find_one({"id": photo_id}, {"_id": 0})
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    if user_id in photo.get('likes', []):
        await db.photos.update_one({"id": photo_id}, {"$pull": {"likes": user_id}})
        return {"message": "Unliked", "liked": False}
    else:
        await db.photos.update_one({"id": photo_id}, {"$push": {"likes": user_id}})
        return {"message": "Liked", "liked": True}

@api_router.post("/photos/{photo_id}/comments", response_model=Comment)
async def add_comment(photo_id: str, comment: CommentCreate, user_id: str = Depends(get_current_user)):
    comment_id = str(uuid.uuid4())
    comment_doc = {
        "id": comment_id,
        "photo_id": photo_id,
        "user_id": user_id,
        "comment": comment.comment,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.photo_comments.insert_one(comment_doc)
    return comment_doc

@api_router.get("/photos/{photo_id}/comments", response_model=List[Comment])
async def get_comments(photo_id: str, user_id: str = Depends(get_current_user)):
    comments = await db.photo_comments.find({"photo_id": photo_id}, {"_id": 0}).sort("created_at", 1).to_list(100)
    return comments

@api_router.post("/photos/{photo_id}/tags")
async def tag_user(photo_id: str, tagged_user_id: str, user_id: str = Depends(get_current_user)):
    await db.photos.update_one({"id": photo_id}, {"$addToSet": {"tags": tagged_user_id}})
    return {"message": "User tagged"}

# Album endpoints
@api_router.post("/albums", response_model=Album)
async def create_album(album: AlbumCreate, user_id: str = Depends(get_current_user)):
    album_id = str(uuid.uuid4())
    album_doc = {
        "id": album_id,
        "user_id": user_id,
        "name": album.name,
        "description": album.description or "",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.albums.insert_one(album_doc)
    return album_doc

@api_router.get("/albums", response_model=List[Album])
async def get_albums(user_id: str = Depends(get_current_user)):
    albums = await db.albums.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return albums

@api_router.get("/albums/{album_id}", response_model=Album)
async def get_album(album_id: str, user_id: str = Depends(get_current_user)):
    album = await db.albums.find_one({"id": album_id}, {"_id": 0})
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    return album

# Message endpoints
@api_router.post("/messages", response_model=Message)
async def send_message(msg: MessageCreate, user_id: str = Depends(get_current_user)):
    message_id = str(uuid.uuid4())
    message_doc = {
        "id": message_id,
        "sender_id": user_id,
        "receiver_id": msg.receiver_id or "",
        "group_id": msg.group_id or "",
        "message": msg.message,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "read": False
    }
    await db.messages.insert_one(message_doc)
    
    # Send via WebSocket if connected
    if msg.receiver_id:
        await manager.send_personal_message(message_doc, msg.receiver_id)
    elif msg.group_id:
        group = await db.groups.find_one({"id": msg.group_id}, {"_id": 0})
        if group:
            await manager.broadcast(message_doc, group['members'])
    
    return message_doc

@api_router.get("/messages/conversations")
async def get_conversations(user_id: str = Depends(get_current_user)):
    messages = await db.messages.find(
        {"$or": [{"sender_id": user_id}, {"receiver_id": user_id}]},
        {"_id": 0}
    ).to_list(1000)
    
    conversations = {}
    for msg in messages:
        other_user = msg['receiver_id'] if msg['sender_id'] == user_id else msg['sender_id']
        if other_user and other_user not in conversations:
            conversations[other_user] = msg
    
    return {"conversations": list(conversations.values())}

@api_router.get("/messages/{conversation_id}", response_model=List[Message])
async def get_messages(conversation_id: str, user_id: str = Depends(get_current_user)):
    messages = await db.messages.find(
        {"$or": [
            {"sender_id": user_id, "receiver_id": conversation_id},
            {"sender_id": conversation_id, "receiver_id": user_id}
        ]},
        {"_id": 0}
    ).sort("created_at", 1).to_list(1000)
    return messages

@api_router.get("/messages/group/{group_id}", response_model=List[Message])
async def get_group_messages(group_id: str, user_id: str = Depends(get_current_user)):
    messages = await db.messages.find({"group_id": group_id}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    return messages

@api_router.delete("/messages/{message_id}")
async def delete_message(message_id: str, user_id: str = Depends(get_current_user)):
    """Delete a message"""
    message = await db.messages.find_one({"id": message_id}, {"_id": 0})
    if not message or message['sender_id'] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.messages.delete_one({"id": message_id})
    return {"message": "Message deleted"}

# Group endpoints
@api_router.post("/groups", response_model=Group)
async def create_group(group: GroupCreate, user_id: str = Depends(get_current_user)):
    group_id = str(uuid.uuid4())
    group_doc = {
        "id": group_id,
        "name": group.name,
        "members": list(set(group.members + [user_id])),
        "created_by": user_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.groups.insert_one(group_doc)
    return group_doc

@api_router.get("/groups", response_model=List[Group])
async def get_groups(user_id: str = Depends(get_current_user)):
    groups = await db.groups.find({"members": user_id}, {"_id": 0}).to_list(100)
    return groups

# Event endpoints
@api_router.post("/events", response_model=Event)
async def create_event(event: EventCreate, user_id: str = Depends(get_current_user)):
    event_id = str(uuid.uuid4())
    event_doc = {
        "id": event_id,
        "user_id": user_id,
        "title": event.title,
        "description": event.description or "",
        "date": event.date,
        "location": event.location or "",
        "attendees": [user_id],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.events.insert_one(event_doc)
    return event_doc

@api_router.get("/events", response_model=List[Event])
async def get_events(user_id: str = Depends(get_current_user)):
    events = await db.events.find({}, {"_id": 0}).sort("date", 1).to_list(100)
    return events

@api_router.post("/events/{event_id}/attend")
async def attend_event(event_id: str, user_id: str = Depends(get_current_user)):
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if user_id in event.get('attendees', []):
        await db.events.update_one({"id": event_id}, {"$pull": {"attendees": user_id}})
        return {"message": "Removed from attendees", "attending": False}
    else:
        await db.events.update_one({"id": event_id}, {"$push": {"attendees": user_id}})
        return {"message": "Added to attendees", "attending": True}

# Post endpoints (Feed)
@api_router.post("/posts", response_model=Post)
async def create_post(post: PostCreate, user_id: str = Depends(get_current_user)):
    post_id = str(uuid.uuid4())
    post_doc = {
        "id": post_id,
        "user_id": user_id,
        "content": post.content,
        "media": post.media or [],
        "likes": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.posts.insert_one(post_doc)
    return post_doc

@api_router.get("/posts", response_model=List[Post])
async def get_posts(user_id: str = Depends(get_current_user)):
    posts = await db.posts.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return posts

@api_router.post("/posts/{post_id}/like")
async def like_post(post_id: str, user_id: str = Depends(get_current_user)):
    post = await db.posts.find_one({"id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if user_id in post.get('likes', []):
        await db.posts.update_one({"id": post_id}, {"$pull": {"likes": user_id}})
        return {"message": "Unliked", "liked": False}
    else:
        await db.posts.update_one({"id": post_id}, {"$push": {"likes": user_id}})
        return {"message": "Liked", "liked": True}

@api_router.post("/posts/{post_id}/comments")
async def add_post_comment(post_id: str, comment: CommentCreate, user_id: str = Depends(get_current_user)):
    comment_id = str(uuid.uuid4())
    comment_doc = {
        "id": comment_id,
        "post_id": post_id,
        "user_id": user_id,
        "comment": comment.comment,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.post_comments.insert_one(comment_doc)
    return comment_doc

@api_router.get("/posts/{post_id}/comments")
async def get_post_comments(post_id: str, user_id: str = Depends(get_current_user)):
    comments = await db.post_comments.find({"post_id": post_id}, {"_id": 0}).sort("created_at", 1).to_list(100)
    return comments

# WebSocket for real-time chat
@app.websocket("/api/ws/chat/{user_id}")
async def websocket_chat(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)
    try:
        while True:
            await websocket.receive_json()
            # Handle incoming messages if needed
    except WebSocketDisconnect:
        manager.disconnect(user_id)

# Cooking Tips endpoints
@api_router.post("/cooking-tips")
async def create_cooking_tip(tip_data: dict, user_id: str = Depends(get_current_user)):
    tip_id = str(uuid.uuid4())
    tip_doc = {
        "id": tip_id,
        "user_id": user_id,
        "user_name": (await db.users.find_one({"id": user_id}, {"_id": 0}))['name'],
        "title": tip_data.get("title"),
        "category": tip_data.get("category", "general"),
        "ingredients": tip_data.get("ingredients", ""),
        "instructions": tip_data.get("instructions"),
        "cooking_time": tip_data.get("cooking_time", ""),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.cooking_tips.insert_one(tip_doc)
    return tip_doc

@api_router.get("/cooking-tips")
async def get_cooking_tips(user_id: str = Depends(get_current_user)):
    tips = await db.cooking_tips.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return tips

@api_router.delete("/cooking-tips/{tip_id}")
async def delete_cooking_tip(tip_id: str, user_id: str = Depends(get_current_user)):
    tip = await db.cooking_tips.find_one({"id": tip_id}, {"_id": 0})
    if not tip or tip['user_id'] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.cooking_tips.delete_one({"id": tip_id})
    return {"message": "Tip deleted"}

# Kolam Tips endpoints
@api_router.post("/kolam-tips")
async def create_kolam_tip(tip_data: dict, user_id: str = Depends(get_current_user)):
    tip_id = str(uuid.uuid4())
    tip_doc = {
        "id": tip_id,
        "user_id": user_id,
        "user_name": (await db.users.find_one({"id": user_id}, {"_id": 0}))['name'],
        "title": tip_data.get("title"),
        "difficulty": tip_data.get("difficulty", "easy"),
        "description": tip_data.get("description"),
        "dots_pattern": tip_data.get("dots_pattern", ""),
        "image_url": tip_data.get("image_url", ""),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.kolam_tips.insert_one(tip_doc)
    return tip_doc

@api_router.get("/kolam-tips")
async def get_kolam_tips(user_id: str = Depends(get_current_user)):
    tips = await db.kolam_tips.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return tips

@api_router.delete("/kolam-tips/{tip_id}")
async def delete_kolam_tip(tip_id: str, user_id: str = Depends(get_current_user)):
    tip = await db.kolam_tips.find_one({"id": tip_id}, {"_id": 0})
    if not tip or tip['user_id'] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.kolam_tips.delete_one({"id": tip_id})
    return {"message": "Tip deleted"}

# Perumal Utsavam endpoints
@api_router.post("/perumal-utsavam")
async def create_utsavam(utsavam_data: dict, user_id: str = Depends(get_current_user)):
    utsavam_id = str(uuid.uuid4())
    utsavam_doc = {
        "id": utsavam_id,
        "user_id": user_id,
        "user_name": (await db.users.find_one({"id": user_id}, {"_id": 0}))['name'],
        "name": utsavam_data.get("name"),
        "date": utsavam_data.get("date"),
        "place": utsavam_data.get("place"),
        "time": utsavam_data.get("time", ""),
        "links": utsavam_data.get("links", []),
        "description": utsavam_data.get("description", ""),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.perumal_utsavam.insert_one(utsavam_doc)
    return utsavam_doc

@api_router.get("/perumal-utsavam")
async def get_utsavam_list(user_id: str = Depends(get_current_user)):
    utsavams = await db.perumal_utsavam.find({}, {"_id": 0}).sort("date", 1).to_list(100)
    return utsavams

@api_router.delete("/perumal-utsavam/{utsavam_id}")
async def delete_utsavam(utsavam_id: str, user_id: str = Depends(get_current_user)):
    utsavam = await db.perumal_utsavam.find_one({"id": utsavam_id}, {"_id": 0})
    if not utsavam or utsavam['user_id'] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.perumal_utsavam.delete_one({"id": utsavam_id})
    return {"message": "Utsavam deleted"}

# Book Review endpoints
@api_router.post("/book-reviews")
async def create_book_review(review_data: dict, user_id: str = Depends(get_current_user)):
    review_id = str(uuid.uuid4())
    review_doc = {
        "id": review_id,
        "user_id": user_id,
        "user_name": (await db.users.find_one({"id": user_id}, {"_id": 0}))['name'],
        "book_title": review_data.get("book_title"),
        "author": review_data.get("author"),
        "rating": review_data.get("rating", 5),
        "review": review_data.get("review"),
        "genre": review_data.get("genre", ""),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.book_reviews.insert_one(review_doc)
    return review_doc

@api_router.get("/book-reviews")
async def get_book_reviews(user_id: str = Depends(get_current_user)):
    reviews = await db.book_reviews.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return reviews

@api_router.delete("/book-reviews/{review_id}")
async def delete_book_review(review_id: str, user_id: str = Depends(get_current_user)):
    review = await db.book_reviews.find_one({"id": review_id}, {"_id": 0})
    if not review or review['user_id'] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.book_reviews.delete_one({"id": review_id})
    return {"message": "Review deleted"}

# Hobbies endpoints
@api_router.post("/hobbies")
async def create_hobby(hobby_data: dict, user_id: str = Depends(get_current_user)):
    hobby_id = str(uuid.uuid4())
    hobby_doc = {
        "id": hobby_id,
        "user_id": user_id,
        "user_name": (await db.users.find_one({"id": user_id}, {"_id": 0}))['name'],
        "title": hobby_data.get("title"),
        "category": hobby_data.get("category", "general"),
        "description": hobby_data.get("description"),
        "skill_level": hobby_data.get("skill_level", "beginner"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.hobbies.insert_one(hobby_doc)
    return hobby_doc

@api_router.get("/hobbies")
async def get_hobbies(user_id: str = Depends(get_current_user)):
    hobbies = await db.hobbies.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return hobbies

@api_router.delete("/hobbies/{hobby_id}")
async def delete_hobby(hobby_id: str, user_id: str = Depends(get_current_user)):
    hobby = await db.hobbies.find_one({"id": hobby_id}, {"_id": 0})
    if not hobby or hobby['user_id'] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.hobbies.delete_one({"id": hobby_id})
    return {"message": "Hobby deleted"}

# Gaming Space endpoints
@api_router.post("/gaming-space")
async def create_gaming_post(post_data: dict, user_id: str = Depends(get_current_user)):
    post_id = str(uuid.uuid4())
    post_doc = {
        "id": post_id,
        "user_id": user_id,
        "user_name": (await db.users.find_one({"id": user_id}, {"_id": 0}))['name'],
        "game_name": post_data.get("game_name"),
        "content": post_data.get("content"),
        "score": post_data.get("score", ""),
        "game_type": post_data.get("game_type", "online"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.gaming_space.insert_one(post_doc)
    return post_doc

@api_router.get("/gaming-space")
async def get_gaming_posts(user_id: str = Depends(get_current_user)):
    posts = await db.gaming_space.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return posts

@api_router.delete("/gaming-space/{post_id}")
async def delete_gaming_post(post_id: str, user_id: str = Depends(get_current_user)):
    post = await db.gaming_space.find_one({"id": post_id}, {"_id": 0})
    if not post or post['user_id'] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.gaming_space.delete_one({"id": post_id})
    return {"message": "Post deleted"}

# Tournaments endpoints
@api_router.post("/tournaments")
async def create_tournament(tournament_data: dict, user_id: str = Depends(get_current_user)):
    tournament_id = str(uuid.uuid4())
    tournament_doc = {
        "id": tournament_id,
        "user_id": user_id,
        "user_name": (await db.users.find_one({"id": user_id}, {"_id": 0}))['name'],
        "name": tournament_data.get("name"),
        "game": tournament_data.get("game"),
        "start_date": tournament_data.get("start_date"),
        "participants": tournament_data.get("participants", []),
        "winner": tournament_data.get("winner", ""),
        "status": tournament_data.get("status", "upcoming"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.tournaments.insert_one(tournament_doc)
    return tournament_doc

@api_router.get("/tournaments")
async def get_tournaments(user_id: str = Depends(get_current_user)):
    tournaments = await db.tournaments.find({}, {"_id": 0}).sort("start_date", -1).to_list(100)
    return tournaments

@api_router.put("/tournaments/{tournament_id}")
async def update_tournament(tournament_id: str, update_data: dict, user_id: str = Depends(get_current_user)):
    tournament = await db.tournaments.find_one({"id": tournament_id}, {"_id": 0})
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    await db.tournaments.update_one(
        {"id": tournament_id},
        {"$set": update_data}
    )
    return {"message": "Tournament updated"}

@api_router.delete("/tournaments/{tournament_id}")
async def delete_tournament(tournament_id: str, user_id: str = Depends(get_current_user)):
    tournament = await db.tournaments.find_one({"id": tournament_id}, {"_id": 0})
    if not tournament or tournament['user_id'] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.tournaments.delete_one({"id": tournament_id})
    return {"message": "Tournament deleted"}

# Achievements endpoints
@api_router.post("/achievements")
async def create_achievement(achievement_data: dict, user_id: str = Depends(get_current_user)):
    achievement_id = str(uuid.uuid4())
    achievement_doc = {
        "id": achievement_id,
        "user_id": user_id,
        "user_name": (await db.users.find_one({"id": user_id}, {"_id": 0}))['name'],
        "title": achievement_data.get("title"),
        "description": achievement_data.get("description"),
        "category": achievement_data.get("category", "personal"),
        "date": achievement_data.get("date"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.achievements.insert_one(achievement_doc)
    return achievement_doc

@api_router.get("/achievements")
async def get_achievements(user_id: str = Depends(get_current_user)):
    achievements = await db.achievements.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return achievements

@api_router.delete("/achievements/{achievement_id}")
async def delete_achievement(achievement_id: str, user_id: str = Depends(get_current_user)):
    achievement = await db.achievements.find_one({"id": achievement_id}, {"_id": 0})
    if not achievement or achievement['user_id'] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.achievements.delete_one({"id": achievement_id})
    return {"message": "Achievement deleted"}

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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()