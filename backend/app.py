# backend/app.py
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from db import create_db_and_tables, get_session
from models import (
    Customer,
    CustomerCreate,
    CustomerRead,
    Lead,
    LeadCreate,
    LeadRead,
    Task,
    TaskCreate,
    TaskRead,
    Meeting,
    MeetingCreate,
    MeetingRead,
    MeetingUser,   # <<< DŮLEŽITÉ pro N:N Meeting–User
    User,
    UserCreate,
    UserRead,
)

# -------------------------------------------------
# FastAPI app
# -------------------------------------------------

app = FastAPI(title="Mini CRM")

# CORS – pro frontend na localhostu
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # pro lokální vývoj OK, pak zpřísnit
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "ok"}

@app.on_event("startup")
def on_startup():
    create_db_and_tables()


# -------------------------------------------------
# Customers
# -------------------------------------------------


@app.get("/customers", response_model=List[CustomerRead])
def list_customers(session: Session = Depends(get_session)):
    customers = session.exec(
        select(Customer).order_by(Customer.id.desc())
    ).all()
    return customers


@app.get("/customers/{customer_id}", response_model=CustomerRead)
def get_customer(customer_id: int, session: Session = Depends(get_session)):
    customer = session.get(Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@app.post("/customers", response_model=CustomerRead)
def create_customer(
    customer_in: CustomerCreate, session: Session = Depends(get_session)
):
    customer = Customer.from_orm(customer_in)
    session.add(customer)
    session.commit()
    session.refresh(customer)
    return customer


@app.put("/customers/{customer_id}", response_model=CustomerRead)
def update_customer(
    customer_id: int,
    customer_in: CustomerCreate,
    session: Session = Depends(get_session),
):
    customer = session.get(Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    data = customer_in.dict()
    for key, value in data.items():
        setattr(customer, key, value)

    session.add(customer)
    session.commit()
    session.refresh(customer)
    return customer


@app.delete("/customers/{customer_id}", status_code=204)
def delete_customer(customer_id: int, session: Session = Depends(get_session)):
    customer = session.get(Customer, customer_id)
    if not customer:
        raise HTTPException(statusocode=404, detail="Customer not found")
    session.delete(customer)
    session.commit()
    return


# -------------------------------------------------
# Leads
# -------------------------------------------------


@app.get("/leads", response_model=List[LeadRead])
def list_leads(session: Session = Depends(get_session)):
    leads = session.exec(select(Lead).order_by(Lead.id.desc())).all()
    return leads


@app.get("/leads/{lead_id}", response_model=LeadRead)
def get_lead(lead_id: int, session: Session = Depends(get_session)):
    lead = session.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@app.post("/leads", response_model=LeadRead)
def create_lead(lead_in: LeadCreate, session: Session = Depends(get_session)):
    lead = Lead.from_orm(lead_in)
    session.add(lead)
    session.commit()
    session.refresh(lead)
    return lead


@app.put("/leads/{lead_id}", response_model=LeadRead)
def update_lead(
    lead_id: int,
    lead_in: LeadCreate,
    session: Session = Depends(get_session),
):
    lead = session.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    data = lead_in.dict()
    for key, value in data.items():
        setattr(lead, key, value)

    session.add(lead)
    session.commit()
    session.refresh(lead)
    return lead


@app.delete("/leads/{lead_id}", status_code=204)
def delete_lead(lead_id: int, session: Session = Depends(get_session)):
    lead = session.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    session.delete(lead)
    session.commit()
    return


# -------------------------------------------------
# Tasks
# -------------------------------------------------


@app.get("/tasks", response_model=List[TaskRead])
def list_tasks(
    assignee: Optional[str] = None,
    session: Session = Depends(get_session),
):
    statement = select(Task)
    if assignee:
        statement = statement.where(Task.assignee == assignee)
    statement = statement.order_by(Task.due_date.is_(None), Task.due_date)
    tasks = session.exec(statement).all()
    return tasks


@app.get("/tasks/{task_id}", response_model=TaskRead)
def get_task(task_id: int, session: Session = Depends(get_session)):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@app.post("/tasks", response_model=TaskRead)
def create_task(task_in: TaskCreate, session: Session = Depends(get_session)):
    task = Task.from_orm(task_in)
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


@app.put("/tasks/{task_id}", response_model=TaskRead)
def update_task(
    task_id: int,
    task_in: TaskCreate,
    session: Session = Depends(get_session),
):
    """Plná úprava úkolu z detailu (Vláďa / Peta)."""
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    data = task_in.dict()
    for key, value in data.items():
        setattr(task, key, value)

    session.add(task)
    session.commit()
    session.refresh(task)
    return task


@app.patch("/tasks/{task_id}", response_model=TaskRead)
def update_task_done(
    task_id: int,
    done: Optional[bool] = None,
    session: Session = Depends(get_session),
):
    """Jednoduché označení úkolu jako hotový/nehotový (checkbox v seznamu)."""
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if done is not None:
        task.done = done

    session.add(task)
    session.commit()
    session.refresh(task)
    return task


@app.delete("/tasks/{task_id}", status_code=204)
def delete_task(task_id: int, session: Session = Depends(get_session)):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    session.delete(task)
    session.commit()
    return


# -------------------------------------------------
# Meetings – N:N Meeting <-> User přes MeetingUser
# -------------------------------------------------


@app.get("/meetings", response_model=List[MeetingRead])
def list_meetings(session: Session = Depends(get_session)):
    meetings = session.exec(
        select(Meeting).order_by(Meeting.id.desc())
    ).all()

    if not meetings:
        return []

    meeting_ids = [m.id for m in meetings if m.id is not None]

    # načteme všechny vazby meeting-user najednou
    rels = session.exec(
        select(MeetingUser).where(MeetingUser.meeting_id.in_(meeting_ids))
    ).all()

    user_ids_by_meeting: dict[int, list[int]] = {}
    for rel in rels:
        user_ids_by_meeting.setdefault(rel.meeting_id, []).append(rel.user_id)

    result: list[MeetingRead] = []
    for m in meetings:
        mid = m.id or 0
        result.append(
            MeetingRead(
                id=mid,
                title=m.title,
                date=m.date,
                time=m.time,
                customer_id=m.customer_id,
                note=m.note,
                status=m.status,
                user_ids=user_ids_by_meeting.get(mid, []),
            )
        )

    return result


@app.get("/meetings/{meeting_id}", response_model=MeetingRead)
def get_meeting(meeting_id: int, session: Session = Depends(get_session)):
    meeting = session.get(Meeting, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    # user_ids pro konkrétní meeting
    user_ids = session.exec(
        select(MeetingUser.user_id).where(MeetingUser.meeting_id == meeting_id)
    ).all()

    return MeetingRead(
        id=meeting.id,
        title=meeting.title,
        date=meeting.date,
        time=meeting.time,
        customer_id=meeting.customer_id,
        note=meeting.note,
        status=meeting.status,
        user_ids=list(user_ids),
    )


@app.post("/meetings", response_model=MeetingRead)
def create_meeting(
    meeting_in: MeetingCreate,
    session: Session = Depends(get_session),
):
    # MeetingCreate má navíc user_ids -> z payloadu je odstraníme
    meeting_data = meeting_in.dict(exclude={"user_ids"})
    meeting = Meeting(**meeting_data)

    session.add(meeting)
    session.commit()
    session.refresh(meeting)

    # uložíme vazby na uživatele
    user_ids = meeting_in.user_ids or []
    for uid in user_ids:
        rel = MeetingUser(meeting_id=meeting.id, user_id=uid)
        session.add(rel)
    session.commit()

    return MeetingRead(
        id=meeting.id,
        title=meeting.title,
        date=meeting.date,
        time=meeting.time,
        customer_id=meeting.customer_id,
        note=meeting.note,
        status=meeting.status,
        user_ids=user_ids,
    )


@app.put("/meetings/{meeting_id}", response_model=MeetingRead)
def update_meeting(
    meeting_id: int,
    meeting_in: MeetingCreate,
    session: Session = Depends(get_session),
):
    meeting = session.get(Meeting, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    # aktualizace základních polí meetingu (bez user_ids)
    data = meeting_in.dict(exclude={"user_ids"})
    for key, value in data.items():
        setattr(meeting, key, value)

    # smažeme staré vazby
    old_rels = session.exec(
        select(MeetingUser).where(MeetingUser.meeting_id == meeting_id)
    ).all()
    for rel in old_rels:
        session.delete(rel)

    # přidáme nové vazby podle meeting_in.user_ids
    user_ids = meeting_in.user_ids or []
    for uid in user_ids:
        session.add(MeetingUser(meeting_id=meeting_id, user_id=uid))

    session.add(meeting)
    session.commit()
    session.refresh(meeting)

    return MeetingRead(
        id=meeting.id,
        title=meeting.title,
        date=meeting.date,
        time=meeting.time,
        customer_id=meeting.customer_id,
        note=meeting.note,
        status=meeting.status,
        user_ids=user_ids,
    )


@app.delete("/meetings/{meeting_id}", status_code=204)
def delete_meeting(meeting_id: int, session: Session = Depends(get_session)):
    meeting = session.get(Meeting, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    # smažeme vazby MeetingUser
    rels = session.exec(
        select(MeetingUser).where(MeetingUser.meeting_id == meeting_id)
    ).all()
    for rel in rels:
        session.delete(rel)

    session.delete(meeting)
    session.commit()
    return


# -------------------------------------------------
# Users
# -------------------------------------------------


@app.get("/users", response_model=List[UserRead])
def list_users(session: Session = Depends(get_session)):
    users = session.exec(select(User).order_by(User.id.desc())).all()
    return users


@app.get("/users/{user_id}", response_model=UserRead)
def get_user(user_id: int, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.post("/users", response_model=UserRead)
def create_user(user_in: UserCreate, session: Session = Depends(get_session)):
    user = User.from_orm(user_in)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@app.put("/users/{user_id}", response_model=UserRead)
def update_user(
    user_id: int,
    user_in: UserCreate,
    session: Session = Depends(get_session),
):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    data = user_in.dict()
    for key, value in data.items():
        setattr(user, key, value)

    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@app.delete("/users/{user_id}", status_code=204)
def delete_user(user_id: int, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    session.delete(user)
    session.commit()
    return
