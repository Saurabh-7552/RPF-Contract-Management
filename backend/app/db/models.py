from __future__ import annotations

import enum
from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship, declarative_base


Base = declarative_base()


class UserRole(str, enum.Enum):
    buyer = "buyer"
    supplier = "supplier"


class RFPStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    RESPONSE_SUBMITTED = "RESPONSE_SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole, name="user_role", native_enum=False), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    rfps: Mapped[List[RFP]] = relationship("RFP", back_populates="owner", cascade="all, delete-orphan")
    responses: Mapped[List[Response]] = relationship("Response", back_populates="supplier", cascade="all, delete-orphan")


class RFP(Base):
    __tablename__ = "rfps"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[RFPStatus] = mapped_column(Enum(RFPStatus, name="rfp_status", native_enum=False), default=RFPStatus.DRAFT, nullable=False)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    owner: Mapped[User] = relationship("User", back_populates="rfps")
    documents: Mapped[List[RFPDocument]] = relationship("RFPDocument", back_populates="rfp", cascade="all, delete-orphan")
    responses: Mapped[List[Response]] = relationship("Response", back_populates="rfp", cascade="all, delete-orphan")
    activities: Mapped[List[ActivityLog]] = relationship("ActivityLog", back_populates="rfp", cascade="all, delete-orphan")


class RFPDocument(Base):
    __tablename__ = "rfp_documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    rfp_id: Mapped[int] = mapped_column(ForeignKey("rfps.id", ondelete="CASCADE"), index=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_path: Mapped[str] = mapped_column(String(1024), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    rfp: Mapped[RFP] = relationship("RFP", back_populates="documents")
    versions: Mapped[List[RFPDocumentVersion]] = relationship("RFPDocumentVersion", back_populates="document", cascade="all, delete-orphan")


class RFPDocumentVersion(Base):
    __tablename__ = "rfp_document_versions"
    __table_args__ = (
        UniqueConstraint("rfp_document_id", "version_number", name="uq_doc_version_number"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    rfp_document_id: Mapped[int] = mapped_column(ForeignKey("rfp_documents.id", ondelete="CASCADE"), index=True)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    s3_key: Mapped[str] = mapped_column(String(1024), nullable=False)
    uploaded_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    document: Mapped[RFPDocument] = relationship("RFPDocument", back_populates="versions")
    uploader: Mapped[Optional[User]] = relationship("User")


class Response(Base):
    __tablename__ = "responses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    rfp_id: Mapped[int] = mapped_column(ForeignKey("rfps.id", ondelete="CASCADE"), index=True)
    supplier_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    content: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    rfp: Mapped[RFP] = relationship("RFP", back_populates="responses")
    supplier: Mapped[User] = relationship("User", back_populates="responses")


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    rfp_id: Mapped[int] = mapped_column(ForeignKey("rfps.id", ondelete="CASCADE"), index=True)
    actor_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), index=True)
    action: Mapped[str] = mapped_column(String(255), nullable=False)
    details: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    rfp: Mapped[RFP] = relationship("RFP", back_populates="activities")
    actor: Mapped[Optional[User]] = relationship("User")



