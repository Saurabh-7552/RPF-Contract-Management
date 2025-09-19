"""versioning update

Revision ID: 20250918_0002
Revises: 20250918_0001
Create Date: 2025-09-18 00:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20250918_0002"
down_revision: Union[str, None] = "20250918_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # rename columns
    with op.batch_alter_table("rfp_document_versions") as batch:
        batch.alter_column("document_id", new_column_name="rfp_document_id")
        batch.alter_column("version", new_column_name="version_number")
        batch.alter_column("storage_path", new_column_name="s3_key")
        batch.create_unique_constraint("uq_doc_version_number", ["rfp_document_id", "version_number"])

    op.create_foreign_key(
        "fk_rfp_document_versions_uploaded_by_users",
        source_table="rfp_document_versions",
        referent_table="users",
        local_cols=["uploaded_by"],
        remote_cols=["id"],
        ondelete="SET NULL",
    )
    with op.batch_alter_table("rfp_document_versions") as batch:
        batch.add_column(sa.Column("uploaded_by", sa.Integer(), nullable=True))
        batch.add_column(sa.Column("notes", sa.Text(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("rfp_document_versions") as batch:
        batch.drop_constraint("uq_doc_version_number", type_="unique")
        batch.drop_column("notes")
        batch.drop_column("uploaded_by")
        batch.alter_column("s3_key", new_column_name="storage_path")
        batch.alter_column("version_number", new_column_name="version")
        batch.alter_column("rfp_document_id", new_column_name="document_id")
    op.drop_constraint("fk_rfp_document_versions_uploaded_by_users", table_name="rfp_document_versions", type_="foreignkey")






