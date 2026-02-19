"""SQLAlchemy database models for the Eventory multisite backend."""

from sqlalchemy import Column, Integer, String, ForeignKey, create_engine
from sqlalchemy.orm import DeclarativeBase, relationship, sessionmaker

DATABASE_URL = "sqlite:///./eventory_backend.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    eventory_logins = relationship("EventoryLogin", back_populates="owner", cascade="all, delete-orphan")


class EventoryLogin(Base):
    __tablename__ = "eventory_logins"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    label = Column(String, nullable=False)
    username = Column(String, nullable=False)
    password = Column(String, nullable=False)
    color = Column(String, nullable=False, default="#1976d2")

    owner = relationship("User", back_populates="eventory_logins")


def create_tables() -> None:
    Base.metadata.create_all(bind=engine)
