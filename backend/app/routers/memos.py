from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from ..models import Memo, Tag
from ..schemas import MemoCreate, MemoUpdate, MemoRead

router = APIRouter()


@router.get("/", response_model=List[MemoRead])
def list_memos(
    tag_id: Optional[int] = Query(None),
    pinned: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Memo)
    if tag_id is not None:
        q = q.filter(Memo.tags.any(Tag.id == tag_id))
    if pinned is not None:
        q = q.filter(Memo.pinned == pinned)
    return q.order_by(Memo.pinned.desc(), Memo.updated_at.desc()).all()


@router.post("/", response_model=MemoRead, status_code=201)
def create_memo(memo: MemoCreate, db: Session = Depends(get_db)):
    db_memo = Memo(
        title=memo.title,
        content=memo.content,
        color=memo.color,
        pinned=memo.pinned,
    )
    if memo.tag_ids:
        db_memo.tags = db.query(Tag).filter(Tag.id.in_(memo.tag_ids)).all()

    db.add(db_memo)
    db.commit()
    db.refresh(db_memo)
    return db_memo


@router.get("/{memo_id}", response_model=MemoRead)
def get_memo(memo_id: int, db: Session = Depends(get_db)):
    memo = db.query(Memo).filter(Memo.id == memo_id).first()
    if not memo:
        raise HTTPException(status_code=404, detail="Memo not found")
    return memo


@router.put("/{memo_id}", response_model=MemoRead)
def update_memo(memo_id: int, payload: MemoUpdate, db: Session = Depends(get_db)):
    db_memo = db.query(Memo).filter(Memo.id == memo_id).first()
    if not db_memo:
        raise HTTPException(status_code=404, detail="Memo not found")

    data = payload.model_dump(exclude_unset=True)
    if "tag_ids" in data:
        tag_ids = data.pop("tag_ids")
        db_memo.tags = db.query(Tag).filter(Tag.id.in_(tag_ids)).all()

    for key, value in data.items():
        setattr(db_memo, key, value)

    db_memo.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_memo)
    return db_memo


@router.delete("/{memo_id}", status_code=204)
def delete_memo(memo_id: int, db: Session = Depends(get_db)):
    db_memo = db.query(Memo).filter(Memo.id == memo_id).first()
    if not db_memo:
        raise HTTPException(status_code=404, detail="Memo not found")
    db.delete(db_memo)
    db.commit()
