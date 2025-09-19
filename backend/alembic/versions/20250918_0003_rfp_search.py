"""rfp search vector

Revision ID: 20250918_0003
Revises: 20250918_0002
Create Date: 2025-09-18 00:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20250918_0003"
down_revision: Union[str, None] = "20250918_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add tsvector column
    op.add_column("rfps", sa.Column("search_vector", sa.TEXT(), nullable=True))
    # Populate existing rows
    op.execute(
        sa.text(
            "UPDATE rfps SET search_vector = to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,''))"
        )
    )
    # Convert column to tsvector type explicitly (Postgres) using USING
    op.execute(sa.text("ALTER TABLE rfps ALTER COLUMN search_vector TYPE tsvector USING search_vector::tsvector"))

    # Create GIN index
    op.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_rfps_search_vector ON rfps USING GIN (search_vector)"))

    # Create trigger function and trigger to keep it updated
    op.execute(
        sa.text(
            """
            CREATE OR REPLACE FUNCTION rfp_search_vector_update() RETURNS trigger AS $$
            BEGIN
              NEW.search_vector := to_tsvector('english', coalesce(NEW.title,'') || ' ' || coalesce(NEW.description,''));
              RETURN NEW;
            END
            $$ LANGUAGE plpgsql;
            """
        )
    )
    op.execute(
        sa.text(
            """
            DROP TRIGGER IF EXISTS rfp_search_vector_trigger ON rfps;
            CREATE TRIGGER rfp_search_vector_trigger
            BEFORE INSERT OR UPDATE OF title, description ON rfps
            FOR EACH ROW EXECUTE PROCEDURE rfp_search_vector_update();
            """
        )
    )


def downgrade() -> None:
    op.execute(sa.text("DROP TRIGGER IF EXISTS rfp_search_vector_trigger ON rfps"))
    op.execute(sa.text("DROP FUNCTION IF EXISTS rfp_search_vector_update"))
    op.execute(sa.text("DROP INDEX IF EXISTS ix_rfps_search_vector"))
    op.drop_column("rfps", "search_vector")






