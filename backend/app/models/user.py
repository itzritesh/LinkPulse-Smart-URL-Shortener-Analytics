from sqlalchemy import Column, String, Boolean
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedModel


class User(TimeStampedModel):
    """User account model for LinkPulse authentication."""
    __tablename__ = "users"

    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    urls = relationship("ShortURL", back_populates="user", cascade="all, delete-orphan")
