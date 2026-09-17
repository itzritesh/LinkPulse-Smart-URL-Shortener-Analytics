from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func, Index
from sqlalchemy.orm import relationship
from app.models.base import Base


class Click(Base):
    """Click event model capturing granular visitor telemetry for shortened links."""
    __tablename__ = "clicks"
    __table_args__ = (
        Index("ix_clicks_url_id_clicked_at", "url_id", "clicked_at"),
    )


    id = Column(Integer, primary_key=True, index=True)
    url_id = Column(
        Integer,
        ForeignKey("urls.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    ip_address = Column(String(45), nullable=True)
    country = Column(String(64), nullable=True, index=True)
    region = Column(String(64), nullable=True)
    city = Column(String(128), nullable=True)
    device_type = Column(String(32), nullable=True, index=True)
    browser = Column(String(64), nullable=True, index=True)
    operating_system = Column(String(64), nullable=True, index=True)
    referrer = Column(String(2048), nullable=True)
    clicked_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    # Relationships
    url = relationship("ShortURL", back_populates="clicks")


# Backward-compatibility alias
ClickEvent = Click
