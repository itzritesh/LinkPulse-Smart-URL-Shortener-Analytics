from sqlalchemy import Column, String, Boolean, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedModel


class ShortURL(TimeStampedModel):
    """Short URL model with user ownership, custom aliases, and expiration support."""
    __tablename__ = "urls"

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    original_url = Column(String(2048), nullable=False, index=True)
    short_code = Column(String(64), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True, index=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    click_count = Column(Integer, default=0, nullable=False)

    # Relationships
    user = relationship("User", back_populates="urls")
    clicks = relationship("Click", back_populates="url", cascade="all, delete-orphan")

    @property
    def analytics(self):
        return self.clicks
