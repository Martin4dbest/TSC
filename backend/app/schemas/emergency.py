from pydantic import BaseModel
from datetime import datetime

class EmergencyBase(BaseModel):
    description: str

class EmergencyCreate(EmergencyBase):
    pass

class EmergencyRead(EmergencyBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        orm_mode = True  # use from_attributes if using Pydantic v2