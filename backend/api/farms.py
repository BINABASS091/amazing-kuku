from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from . import schemas
from .models import Farm, User
from .auth import get_current_active_user
from database import get_db

router = APIRouter(prefix="/farms", tags=["farms"])

@router.post("/", response_model=schemas.FarmInDB, status_code=status.HTTP_201_CREATED)
async def create_farm(
    farm: schemas.FarmCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new farm"""
    db_farm = Farm(
        id=str(uuid.uuid4()),
        name=farm.name,
        owner_id=current_user.id,
        location=farm.location,
        size=farm.size,
        description=farm.description
    )
    
    db.add(db_farm)
    db.commit()
    db.refresh(db_farm)
    return db_farm

@router.get("/", response_model=List[schemas.FarmInDB])
async def read_farms(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List all farms (admin sees all, others see their own)"""
    if current_user.role == "admin":
        farms = db.query(Farm).offset(skip).limit(limit).all()
    else:
        farms = db.query(Farm).filter(
            Farm.owner_id == current_user.id
        ).offset(skip).limit(limit).all()
    return farms

@router.get("/{farm_id}", response_model=schemas.FarmInDB)
async def read_farm(
    farm_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific farm by ID"""
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    
    # Check permissions
    if farm.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this farm"
        )
    
    return farm

@router.put("/{farm_id}", response_model=schemas.FarmInDB)
async def update_farm(
    farm_id: str,
    farm_update: schemas.FarmUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update a farm"""
    db_farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not db_farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    
    # Check permissions
    if db_farm.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this farm"
        )
    
    update_data = farm_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_farm, field, value)
    
    db.add(db_farm)
    db.commit()
    db.refresh(db_farm)
    return db_farm

@router.delete("/{farm_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_farm(
    farm_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a farm"""
    db_farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not db_farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    
    # Check permissions
    if db_farm.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this farm"
        )
    
    db.delete(db_farm)
    db.commit()
    return None
