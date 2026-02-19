"""FastAPI backend for Eventory multisite.

Provides optional user management and server-side storage of Eventory
credentials so that logins no longer need to be kept in browser
localStorage.  The frontend detects whether a backend URL is configured
and automatically switches between the two modes.
"""

from typing import Annotated, Optional

import httpx
from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import create_access_token, decode_token, hash_password, verify_password
from models import EventoryLogin, SessionLocal, User, create_tables

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(title="Eventory multisite backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

create_tables()

# ---------------------------------------------------------------------------
# Dependency helpers
# ---------------------------------------------------------------------------

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Session = Depends(get_db),
) -> User:
    username = decode_token(token)
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------


class UserCreate(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    id: int
    username: str

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str


class EventoryLoginCreate(BaseModel):
    label: str
    username: str
    password: str
    color: str = "#1976d2"


class EventoryLoginUpdate(BaseModel):
    label: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    color: Optional[str] = None


class EventoryLoginOut(BaseModel):
    """Response model for an Eventory login entry.

    The ``password`` field is intentionally excluded to avoid leaking
    credentials back to the client.
    """

    id: int
    label: str
    username: str
    color: str

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Auth routes
# ---------------------------------------------------------------------------


@app.post("/auth/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already taken",
        )
    user = User(username=payload.username, hashed_password=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.post("/auth/login", response_model=Token)
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}


@app.get("/auth/me", response_model=UserOut)
def read_me(current_user: User = Depends(get_current_user)):
    return current_user


# ---------------------------------------------------------------------------
# Eventory login management routes
# ---------------------------------------------------------------------------


@app.get("/logins", response_model=list[EventoryLoginOut])
def list_logins(current_user: User = Depends(get_current_user)):
    return current_user.eventory_logins


@app.post("/logins", response_model=EventoryLoginOut, status_code=status.HTTP_201_CREATED)
def create_login(
    payload: EventoryLoginCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    login = EventoryLogin(
        owner_id=current_user.id,
        label=payload.label,
        username=payload.username,
        password=payload.password,
        color=payload.color,
    )
    db.add(login)
    db.commit()
    db.refresh(login)
    return login


@app.put("/logins/{login_id}", response_model=EventoryLoginOut)
def update_login(
    login_id: int,
    payload: EventoryLoginUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    login = (
        db.query(EventoryLogin)
        .filter(EventoryLogin.id == login_id, EventoryLogin.owner_id == current_user.id)
        .first()
    )
    if not login:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Login not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(login, field, value)
    db.commit()
    db.refresh(login)
    return login


@app.delete("/logins/{login_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_login(
    login_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    login = (
        db.query(EventoryLogin)
        .filter(EventoryLogin.id == login_id, EventoryLogin.owner_id == current_user.id)
        .first()
    )
    if not login:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Login not found")
    db.delete(login)
    db.commit()


# ---------------------------------------------------------------------------
# Eventory proxy – forward requests to the Eventory API on behalf of the
# client so that CORS / auth header injection is handled server-side.
# ---------------------------------------------------------------------------

EVENTORY_BASE = "https://api.eventory.se"


@app.api_route(
    "/eventory/{path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
)
async def eventory_proxy(path: str, request: Request):
    """Transparent proxy to the Eventory API.

    The client should pass its Eventory ``Authorization`` header as-is;
    it will be forwarded unchanged.
    """
    url = f"{EVENTORY_BASE}/{path}"
    headers = {
        key: value
        for key, value in request.headers.items()
        if key.lower() not in ("host", "content-length")
    }
    body = await request.body()
    params = dict(request.query_params)

    async with httpx.AsyncClient() as client:
        response = await client.request(
            method=request.method,
            url=url,
            headers=headers,
            content=body,
            params=params,
            follow_redirects=True,
        )

    from fastapi.responses import Response

    return Response(
        content=response.content,
        status_code=response.status_code,
        headers=dict(response.headers),
    )
