"""initial

Revision ID: 20250918_0001
Revises: 
Create Date: 2025-09-18 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20250918_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=32), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "rfps",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("status", sa.String(length=32), nullable=False, server_default=sa.text("'DRAFT'")),
        sa.Column("owner_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_rfps_owner_id", "rfps", ["owner_id"], unique=False)

    op.create_table(
        "rfp_documents",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("rfp_id", sa.Integer(), sa.ForeignKey("rfps.id", ondelete="CASCADE"), nullable=False),
        sa.Column("filename", sa.String(length=255), nullable=False),
        sa.Column("storage_path", sa.String(length=1024), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_rfp_documents_rfp_id", "rfp_documents", ["rfp_id"], unique=False)

    op.create_table(
        "rfp_document_versions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("document_id", sa.Integer(), sa.ForeignKey("rfp_documents.id", ondelete="CASCADE"), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("storage_path", sa.String(length=1024), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("document_id", "version", name="uq_document_version"),
    )
    op.create_index("ix_rfp_document_versions_document_id", "rfp_document_versions", ["document_id"], unique=False)

    op.create_table(
        "responses",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("rfp_id", sa.Integer(), sa.ForeignKey("rfps.id", ondelete="CASCADE"), nullable=False),
        sa.Column("supplier_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("content", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_responses_rfp_id", "responses", ["rfp_id"], unique=False)
    op.create_index("ix_responses_supplier_id", "responses", ["supplier_id"], unique=False)

    op.create_table(
        "activity_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("rfp_id", sa.Integer(), sa.ForeignKey("rfps.id", ondelete="CASCADE"), nullable=False),
        sa.Column("actor_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("action", sa.String(length=255), nullable=False),
        sa.Column("details", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_activity_logs_rfp_id", "activity_logs", ["rfp_id"], unique=False)
    op.create_index("ix_activity_logs_actor_id", "activity_logs", ["actor_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_activity_logs_actor_id", table_name="activity_logs")
    op.drop_index("ix_activity_logs_rfp_id", table_name="activity_logs")
    op.drop_table("activity_logs")

    op.drop_index("ix_responses_supplier_id", table_name="responses")
    op.drop_index("ix_responses_rfp_id", table_name="responses")
    op.drop_table("responses")

    op.drop_index("ix_rfp_document_versions_document_id", table_name="rfp_document_versions")
    op.drop_table("rfp_document_versions")

    op.drop_index("ix_rfp_documents_rfp_id", table_name="rfp_documents")
    op.drop_table("rfp_documents")

    op.drop_index("ix_rfps_owner_id", table_name="rfps")
    op.drop_table("rfps")

    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")

    # enums not used in this migration; nothing to drop


