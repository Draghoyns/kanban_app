from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import NotificationSubscription, DevicePushToken
from ..schemas import (
    NotificationSubscriptionCreate,
    DevicePushTokenCreate,
    VapidPublicKeyResponse,
)
from ..scheduler import generate_routine_tickets, send_today_reminders

router = APIRouter()


@router.get("/vapid-key", response_model=VapidPublicKeyResponse)
def get_vapid_key(request: Request):
    return {"public_key": request.app.state.vapid_public_key}


@router.post("/subscribe", status_code=201)
def subscribe(payload: NotificationSubscriptionCreate, db: Session = Depends(get_db)):
    existing = (
        db.query(NotificationSubscription)
        .filter(NotificationSubscription.endpoint == payload.endpoint)
        .first()
    )
    if existing:
        # Update keys in case they changed
        existing.p256dh = payload.p256dh
        existing.auth = payload.auth
        db.commit()
        return {"status": "updated"}

    sub = NotificationSubscription(
        endpoint=payload.endpoint,
        p256dh=payload.p256dh,
        auth=payload.auth,
    )
    db.add(sub)
    db.commit()
    return {"status": "created"}


@router.delete("/unsubscribe")
def unsubscribe(endpoint: str, db: Session = Depends(get_db)):
    sub = (
        db.query(NotificationSubscription)
        .filter(NotificationSubscription.endpoint == endpoint)
        .first()
    )
    if sub:
        db.delete(sub)
        db.commit()
    return {"status": "ok"}


@router.post("/trigger-routines")
def trigger_routines():
    """Manually run the routine-ticket generation job (for testing)."""
    generate_routine_tickets()
    return {"status": "triggered"}


@router.post("/trigger-reminders")
def trigger_reminders():
    """Manually send today-reminders (for testing)."""
    send_today_reminders()
    return {"status": "triggered"}


# ── Native device tokens (FCM / APNs) ─────────────────────────────────────────


@router.post("/subscribe-native", status_code=201)
def subscribe_native(payload: DevicePushTokenCreate, db: Session = Depends(get_db)):
    """Register an FCM / APNs push token from the native mobile app."""
    existing = (
        db.query(DevicePushToken).filter(DevicePushToken.token == payload.token).first()
    )
    if existing:
        existing.platform = payload.platform
        db.commit()
        return {"status": "updated"}

    device = DevicePushToken(token=payload.token, platform=payload.platform)
    db.add(device)
    db.commit()
    return {"status": "created"}


@router.delete("/unsubscribe-native")
def unsubscribe_native(token: str, db: Session = Depends(get_db)):
    device = db.query(DevicePushToken).filter(DevicePushToken.token == token).first()
    if device:
        db.delete(device)
        db.commit()
    return {"status": "ok"}
