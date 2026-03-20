from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, date
import logging
import json
import os

logger = logging.getLogger(__name__)

VAPID_PRIVATE_KEY_FILE = "vapid_private.pem"
VAPID_PUBLIC_KEY_FILE = "vapid_public.txt"


# ── Helpers ───────────────────────────────────────────────────────────────────


def _get_db():
    from .database import SessionLocal

    return SessionLocal()


def _should_generate_today(ticket, today: date) -> bool:
    """Return True if this routine template should spawn a today-instance."""
    freq_type = ticket.frequency_type
    if not freq_type:
        return False
    if ticket.last_generated and ticket.last_generated.date() == today:
        return False

    day_name = today.strftime("%A").lower()

    if freq_type == "daily":
        return True
    elif freq_type == "weekdays":
        return day_name in ["monday", "tuesday", "wednesday", "thursday", "friday"]
    elif freq_type == "weekly":
        days = [d.lower() for d in (ticket.frequency_days or [])]
        return day_name in days
    elif freq_type == "interval":
        interval = ticket.frequency_interval or 1
        if not ticket.last_generated:
            return True
        return (today - ticket.last_generated.date()).days >= interval
    return False


def _send_fcm(tokens, title: str, body: str):
    """Send push to native devices via Firebase FCM.

    Requires FIREBASE_SERVICE_ACCOUNT_PATH env var pointing to a
    Firebase service-account JSON file.  Silently skipped if not configured.
    """
    sa_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
    if not sa_path or not os.path.exists(sa_path):
        return
    try:
        import firebase_admin
        from firebase_admin import credentials, messaging

        if not firebase_admin._apps:
            cred = credentials.Certificate(sa_path)
            firebase_admin.initialize_app(cred)

        for device in tokens:
            try:
                msg = messaging.Message(
                    notification=messaging.Notification(title=title, body=body),
                    token=device.token,
                )
                messaging.send(msg)
            except Exception as exc:
                logger.error(
                    "FCM send failed for token …%s: %s", device.token[-12:], exc
                )
    except ImportError:
        logger.warning("firebase-admin not installed – native push skipped")
    except Exception:
        logger.exception("FCM error")

    if not os.path.exists(VAPID_PRIVATE_KEY_FILE):
        logger.warning("VAPID private key not found – skipping push")
        return
    try:
        from pywebpush import webpush, WebPushException
    except ImportError:
        logger.error("pywebpush not installed")
        return

    payload = json.dumps({"title": title, "body": body, "icon": "/favicon.ico"})
    for sub in subscriptions:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
                },
                data=payload,
                vapid_private_key=VAPID_PRIVATE_KEY_FILE,
                vapid_claims={"sub": "mailto:kanban@localhost"},
            )
        except WebPushException as exc:
            logger.error("Push failed for %s…: %s", sub.endpoint[:60], exc)


# ── Scheduled jobs ────────────────────────────────────────────────────────────


def generate_routine_tickets():
    """Midnight job: create today-instances for due routine templates."""
    db = _get_db()
    try:
        from .models import Ticket

        today = date.today()
        templates = (
            db.query(Ticket)
            .filter(Ticket.is_routine == True, Ticket.status == "backlog")
            .all()
        )

        count = 0
        for tpl in templates:
            if _should_generate_today(tpl, today):
                instance = Ticket(
                    title=tpl.title,
                    description=tpl.description,
                    status="today",
                    parent_id=tpl.id,
                    is_routine=False,
                )
                instance.tags = list(tpl.tags)
                db.add(instance)
                tpl.last_generated = datetime.utcnow()
                count += 1

        if count:
            db.commit()
        logger.info("Generated %d routine ticket instance(s) for %s", count, today)
    except Exception:
        logger.exception("Error generating routine tickets")
        db.rollback()
    finally:
        db.close()


def send_today_reminders():
    """Morning job: push today-ticket summary to all subscribers."""
    db = _get_db()
    try:
        from .models import Ticket, NotificationSubscription, DevicePushToken

        subscriptions = db.query(NotificationSubscription).all()
        device_tokens = db.query(DevicePushToken).all()
        if not subscriptions and not device_tokens:
            return

        today_tickets = db.query(Ticket).filter(Ticket.status == "today").all()
        if not today_tickets:
            title = "Plan your day ☀️"
            body = "Your Today column is empty – add tickets to focus on!"
        else:
            n = len(today_tickets)
            sample = ", ".join(t.title for t in today_tickets[:3])
            tail = f" (+{n - 3} more)" if n > 3 else ""
            title = f"Today: {n} task{'s' if n != 1 else ''}"
            body = sample + tail

        _send_push(subscriptions, title, body)
        _send_fcm(device_tokens, title, body)
    except Exception:
        logger.exception("Error sending today reminders")
    finally:
        db.close()


def setup_scheduler() -> BackgroundScheduler:
    scheduler = BackgroundScheduler(timezone="UTC")
    scheduler.add_job(
        generate_routine_tickets,
        CronTrigger(hour=0, minute=5),
        id="gen_routines",
        replace_existing=True,
    )
    scheduler.add_job(
        send_today_reminders,
        CronTrigger(hour=8, minute=0),
        id="today_reminders",
        replace_existing=True,
    )
    return scheduler
