# migrate_data.py
from sqlmodel import Session, select, create_engine
from models import Customer, Lead, Task, Meeting, User  # podle toho, co máš

OLD_DB_URL = "sqlite:///./crm_old.db"
NEW_DB_URL = "sqlite:///./crm.db"

old_engine = create_engine(OLD_DB_URL, echo=True)
new_engine = create_engine(NEW_DB_URL, echo=True)


def copy_table(model):
    """Zkopíruje všechny záznamy jedné tabulky 1:1 (včetně id)."""
    with Session(old_engine) as old_sess, Session(new_engine) as new_sess:
        rows = old_sess.exec(select(model)).all()
        for row in rows:
            # převedeme řádek na dict – podle verze SQLModel buď .model_dump(), nebo .dict()
            data = row.model_dump() if hasattr(row, "model_dump") else row.dict()
            new_obj = model(**data)
            new_sess.add(new_obj)
        new_sess.commit()
    print(f"OK – zkopírováno {len(rows)} záznamů tabulky {model.__name__}")


def main():
    # pořadí trochu hlídat kvůli FK – např. nejdřív customers, pak tasks/meetings
    copy_table(Customer)
    copy_table(User)
    copy_table(Lead)
    copy_table(Task)
    copy_table(Meeting)
    # pokud máš join tabulky (např. MeetingUser), přidej je sem:
    # copy_table(MeetingUser)


if __name__ == "__main__":
    main()
