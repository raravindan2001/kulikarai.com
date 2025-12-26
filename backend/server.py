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
JWT_SECRET = os.environ.get('JWT_SECRET', 'kulikari_family_secret_2024')
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
        except Exception as e:
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
    
    except Exception as e:
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
            data = await websocket.receive_json()
            # Handle incoming messages if needed
    except WebSocketDisconnect:
        manager.disconnect(user_id)

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