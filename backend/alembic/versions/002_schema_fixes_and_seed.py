"""schema fixes and demo user seed

Revision ID: 002_schema_fixes
Revises: 001_initial
Create Date: 2026-07-15
"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "002_schema_fixes"
down_revision: str | None = "001_initial"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # --- documents: add processing columns (schema drift from ORM) ---
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    documents_cols = {c["name"] for c in inspector.get_columns("documents")}
    queries_cols = {c["name"] for c in inspector.get_columns("queries")}

    if "processing_step" not in documents_cols:
        op.add_column(
            "documents",
            sa.Column("processing_step", sa.String, nullable=True),
        )
    if "processing_progress" not in documents_cols:
        op.add_column(
            "documents",
            sa.Column(
                "processing_progress",
                sa.Integer,
                nullable=False,
                server_default="0",
            ),
        )

    # --- queries: add conversation_id (schema drift from ORM) ---
    if "conversation_id" not in queries_cols:
        op.add_column(
            "queries",
            sa.Column("conversation_id", sa.String, nullable=True),
        )
        op.create_index(
            "ix_queries_conversation_id",
            "queries",
            ["conversation_id"],
        )

    # --- Seed the demo user so FK constraints on documents/queries/usage pass ---
    # The security fallback uses 00000000-0000-0000-0000-000000000001 as the demo user id.
    op.execute(
        sa.text(
            "INSERT INTO users (id, clerk_id, email, plan) "
            "VALUES (:id, :clerk_id, :email, :plan) "
            "ON CONFLICT (id) DO NOTHING"
        ).bindparams(
            id="00000000-0000-0000-0000-000000000001",
            clerk_id="demo",
            email="demo@pdfsage.local",
            plan="free",
        )
    )


def downgrade() -> None:
    op.drop_index("ix_queries_conversation_id", table_name="queries")
    op.drop_column("queries", "conversation_id")
    op.drop_column("documents", "processing_progress")
    op.drop_column("documents", "processing_step")
