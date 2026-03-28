from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    JSON,
    Table,
)
from sqlalchemy.orm import relationship, backref
from datetime import datetime
from .database import Base

# ── Association tables ─────────────────────────────────────────────────────────

ticket_tags = Table(
    "ticket_tags",
    Base.metadata,
    Column(
        "ticket_id",
        Integer,
        ForeignKey("tickets.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True
    ),
)

memo_tags = Table(
    "memo_tags",
    Base.metadata,
    Column(
        "memo_id", Integer, ForeignKey("memos.id", ondelete="CASCADE"), primary_key=True
    ),
    Column(
        "tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True
    ),
)


# ── Tag ───────────────────────────────────────────────────────────────────────


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    color = Column(String(7), default="#6366f1")

    tickets = relationship("Ticket", secondary=ticket_tags, back_populates="tags")
    memos = relationship("Memo", secondary=memo_tags, back_populates="tags")


# ── Ticket ────────────────────────────────────────────────────────────────────


class Ticket(Base):
    """
    Regular tickets:   is_routine=False, parent_id=None
    Routine templates: is_routine=True,  status="backlog"
    Generated copies:  is_routine=False, parent_id=<template.id>
    """

    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(20), default="backlog", nullable=False)
    position = Column(Integer, default=0)

    # Routine / frequency (template tickets only)
    is_routine = Column(Boolean, default=False)
    frequency_type = Column(
        String(20), nullable=True
    )  # daily | weekly | interval | weekdays
    frequency_days = Column(JSON, nullable=True)  # ["monday", "friday"]
    frequency_interval = Column(Integer, nullable=True)  # days between runs
    start_date = Column(
        Date, nullable=True
    )  # anchor for interval counting; defaults to created_at
    last_generated = Column(DateTime, nullable=True)

    # Link generated copies back to their template
    parent_id = Column(
        Integer, ForeignKey("tickets.id", ondelete="SET NULL"), nullable=True
    )

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tags = relationship("Tag", secondary=ticket_tags, back_populates="tickets")
    children = relationship(
        "Ticket",
        foreign_keys=[parent_id],
        backref=backref("parent", remote_side="Ticket.id"),
    )


# ── Memo ──────────────────────────────────────────────────────────────────────


class Memo(Base):
    __tablename__ = "memos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=True)
    color = Column(String(7), default="#1e293b")
    pinned = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tags = relationship("Tag", secondary=memo_tags, back_populates="memos")


# ── Push-notification subscription ────────────────────────────────────────────


class NotificationSubscription(Base):
    __tablename__ = "notification_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    endpoint = Column(String(2000), unique=True, nullable=False)
    p256dh = Column(String(500), nullable=False)
    auth = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# ── Native device push token (FCM / APNs) ─────────────────────────────────────


class DevicePushToken(Base):
    __tablename__ = "device_push_tokens"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(500), unique=True, nullable=False)
    platform = Column(String(10), nullable=False)  # 'android' | 'ios'
    created_at = Column(DateTime, default=datetime.utcnow)
