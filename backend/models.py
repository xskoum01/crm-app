# backend/models.py
from datetime import date
from typing import Optional

from sqlmodel import SQLModel, Field


# -------------------------------------------------
# Customers
# -------------------------------------------------


class CustomerBase(SQLModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    note: Optional[str] = None
    status: str = "active"  # "active" / "inactive" / "negotiation"


class Customer(CustomerBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)


class CustomerCreate(CustomerBase):
    """Payload pro vytvoření zákazníka (POST /customers)."""
    pass


class CustomerRead(CustomerBase):
    """Response model pro čtení zákazníka."""
    id: int


# -------------------------------------------------
# Leads
# -------------------------------------------------


class LeadBase(SQLModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    source: Optional[str] = None
    note: Optional[str] = None
    status: str = "new"   # <--- přidáno



class Lead(LeadBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)


class LeadCreate(LeadBase):
    pass


class LeadRead(LeadBase):
    id: int


# -------------------------------------------------
# Tasks
# -------------------------------------------------


class TaskBase(SQLModel):
    title: str
    description: Optional[str] = None
    priority: int = 2  # 1=high, 2=medium, 3=low
    due_date: Optional[date] = None
    done: bool = False
    assignee: str  # "vlada" nebo "peta"
    status: str = "todo"  # "todo" / "in_progress" / "done"
    customer_id: Optional[int] = Field(
        default=None, foreign_key="customer.id"
    )  # lookup na zákazníka


class Task(TaskBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)


class TaskCreate(TaskBase):
    pass


class TaskRead(TaskBase):
    id: int


# -------------------------------------------------
# Meetings
# -------------------------------------------------


class MeetingBase(SQLModel):
    title: str
    date: date
    time: Optional[str] = None
    customer_id: Optional[int] = Field(default=None, foreign_key="customer.id")
    note: Optional[str] = None
    status: str = "planned"   # "planned" / "done" / "cancelled"


class Meeting(MeetingBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)


# pro API – čtení/zápis
class MeetingCreate(MeetingBase):
    # seznam ID uživatelů, kterým schůzka patří
    user_ids: list[int] = []


class MeetingRead(MeetingBase):
    id: int
    user_ids: list[int] = []

class MeetingUser(SQLModel, table=True):
    meeting_id: int = Field(foreign_key="meeting.id", primary_key=True)
    user_id: int = Field(foreign_key="user.id", primary_key=True)



# -------------------------------------------------
# Users (uživatelé)
# -------------------------------------------------


class UserBase(SQLModel):
    name: str
    email: str
    role: str = "user"        # např. "admin", "user"
    is_active: bool = True


class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)


class UserCreate(UserBase):
    pass


class UserRead(UserBase):
    id: int
