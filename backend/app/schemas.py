from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional, List
from datetime import datetime, date
from enum import Enum


class TicketStatus(str, Enum):
    backlog = "backlog"
    in_progress = "in_progress"
    blocked = "blocked"
    today = "today"
    done = "done"


class FrequencyType(str, Enum):
    daily = "daily"
    weekly = "weekly"
    interval = "interval"
    weekdays = "weekdays"


# ── Tag ───────────────────────────────────────────────────────────────────────


class TagBase(BaseModel):
    name: str
    color: str = "#6366f1"


class TagCreate(TagBase):
    pass


class TagUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None


class TagRead(TagBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ── Ticket ────────────────────────────────────────────────────────────────────


class TicketBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: TicketStatus = TicketStatus.backlog
    is_routine: bool = False
    frequency_type: Optional[FrequencyType] = None
    frequency_days: Optional[List[str]] = None
    frequency_interval: Optional[int] = None
    start_date: Optional[date] = None


class TicketCreate(TicketBase):
    tag_ids: List[int] = []


class TicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TicketStatus] = None
    position: Optional[int] = None
    is_routine: Optional[bool] = None
    frequency_type: Optional[FrequencyType] = None
    frequency_days: Optional[List[str]] = None
    frequency_interval: Optional[int] = None
    start_date: Optional[date] = None
    tag_ids: Optional[List[int]] = None


class TicketStatusUpdate(BaseModel):
    status: TicketStatus
    position: Optional[int] = None


class TicketRead(TicketBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    position: int
    parent_id: Optional[int] = None
    last_generated: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    tags: List[TagRead] = []


# ── Memo ──────────────────────────────────────────────────────────────────────


class MemoBase(BaseModel):
    title: str
    content: Optional[str] = None
    color: str = "#1e293b"
    pinned: bool = False


class MemoCreate(MemoBase):
    tag_ids: List[int] = []


class MemoUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    color: Optional[str] = None
    pinned: Optional[bool] = None
    tag_ids: Optional[List[int]] = None


class MemoRead(MemoBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime
    tags: List[TagRead] = []


# ── Notifications ─────────────────────────────────────────────────────────────


class NotificationSubscriptionCreate(BaseModel):
    endpoint: str
    p256dh: str
    auth: str


class DevicePushTokenCreate(BaseModel):
    token: str
    platform: str  # 'android' | 'ios'


class VapidPublicKeyResponse(BaseModel):
    public_key: str
