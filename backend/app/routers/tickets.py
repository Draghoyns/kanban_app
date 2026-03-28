from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from ..models import Ticket, Tag
from ..schemas import TicketCreate, TicketUpdate, TicketRead, TicketStatusUpdate

router = APIRouter()


@router.get("/", response_model=List[TicketRead])
def list_tickets(
    status: Optional[str] = Query(None),
    tag_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Ticket)
    if status:
        q = q.filter(Ticket.status == status)
    if tag_id:
        q = q.filter(Ticket.tags.any(Tag.id == tag_id))
    return q.order_by(Ticket.position, Ticket.created_at).all()


@router.post("/", response_model=TicketRead, status_code=201)
def create_ticket(ticket: TicketCreate, db: Session = Depends(get_db)):
    col_count = db.query(Ticket).filter(Ticket.status == ticket.status.value).count()

    db_ticket = Ticket(
        title=ticket.title,
        description=ticket.description,
        status=ticket.status.value,
        position=col_count,
        is_routine=ticket.is_routine,
        frequency_type=ticket.frequency_type.value if ticket.frequency_type else None,
        frequency_days=ticket.frequency_days,
        frequency_interval=ticket.frequency_interval,
        start_date=ticket.start_date,
    )
    if ticket.tag_ids:
        db_ticket.tags = db.query(Tag).filter(Tag.id.in_(ticket.tag_ids)).all()

    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    return db_ticket


@router.get("/{ticket_id}", response_model=TicketRead)
def get_ticket(ticket_id: int, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@router.put("/{ticket_id}", response_model=TicketRead)
def update_ticket(ticket_id: int, payload: TicketUpdate, db: Session = Depends(get_db)):
    db_ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not db_ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    data = payload.model_dump(exclude_unset=True)

    if "tag_ids" in data:
        tag_ids = data.pop("tag_ids")
        db_ticket.tags = db.query(Tag).filter(Tag.id.in_(tag_ids)).all()

    # Normalise enum values to strings
    for enum_field in ("status", "frequency_type"):
        if enum_field in data and data[enum_field] is not None:
            data[enum_field] = (
                data[enum_field].value
                if hasattr(data[enum_field], "value")
                else data[enum_field]
            )

    for key, value in data.items():
        setattr(db_ticket, key, value)

    db_ticket.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_ticket)
    return db_ticket


@router.patch("/{ticket_id}/status", response_model=TicketRead)
def update_ticket_status(
    ticket_id: int, payload: TicketStatusUpdate, db: Session = Depends(get_db)
):
    db_ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not db_ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    db_ticket.status = payload.status.value
    if payload.position is not None:
        db_ticket.position = payload.position
    else:
        # Place at end of target column
        db_ticket.position = (
            db.query(Ticket).filter(Ticket.status == payload.status.value).count()
        )

    db_ticket.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_ticket)
    return db_ticket


@router.delete("/{ticket_id}", status_code=204)
def delete_ticket(ticket_id: int, db: Session = Depends(get_db)):
    db_ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not db_ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    db.delete(db_ticket)
    db.commit()
