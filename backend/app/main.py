import os
import json
import base64
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization

from .database import engine, Base
from .routers import tickets, memos, tags, notifications, sync
from .scheduler import setup_scheduler, VAPID_PRIVATE_KEY_FILE, VAPID_PUBLIC_KEY_FILE

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ── VAPID key management ──────────────────────────────────────────────────────


def _load_or_generate_vapid_keys() -> str:
    """Return the base64url-encoded VAPID public key."""
    if os.path.exists(VAPID_PRIVATE_KEY_FILE) and os.path.exists(VAPID_PUBLIC_KEY_FILE):
        with open(VAPID_PUBLIC_KEY_FILE) as f:
            return f.read().strip()

    # Generate a fresh P-256 key pair
    private_key = ec.generate_private_key(ec.SECP256R1())

    pem = private_key.private_bytes(
        serialization.Encoding.PEM,
        serialization.PrivateFormat.TraditionalOpenSSL,
        serialization.NoEncryption(),
    )
    with open(VAPID_PRIVATE_KEY_FILE, "wb") as f:
        f.write(pem)

    pub_bytes = private_key.public_key().public_bytes(
        serialization.Encoding.X962,
        serialization.PublicFormat.UncompressedPoint,
    )
    pub_b64 = base64.urlsafe_b64encode(pub_bytes).rstrip(b"=").decode()
    with open(VAPID_PUBLIC_KEY_FILE, "w") as f:
        f.write(pub_b64)

    logger.info("Generated new VAPID key pair")
    return pub_b64


# ── Lifespan ──────────────────────────────────────────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    app.state.vapid_public_key = _load_or_generate_vapid_keys()

    scheduler = setup_scheduler()
    scheduler.start()
    app.state.scheduler = scheduler
    logger.info("Kanban app started")
    yield
    scheduler.shutdown(wait=False)
    logger.info("Kanban app stopped")


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(title="Kanban Memo App", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tickets.router, prefix="/api/tickets", tags=["tickets"])
app.include_router(memos.router, prefix="/api/memos", tags=["memos"])
app.include_router(tags.router, prefix="/api/tags", tags=["tags"])
app.include_router(
    notifications.router, prefix="/api/notifications", tags=["notifications"]
)
app.include_router(sync.router, prefix="/sync", tags=["sync"])


@app.get("/api/health")
def health():
    return {"status": "ok"}
