"""initial schema

Revision ID: 001_initial
Revises:
Create Date: 2026-06-23
"""
from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID

from alembic import op

revision: str = "001_initial"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("clerk_id", sa.String, unique=True, nullable=False),
        sa.Column("email", sa.String, nullable=False),
        sa.Column("plan", sa.String, nullable=False, server_default="free"),
        sa.Column("stripe_customer_id", sa.String, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    op.create_table(
        "documents",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("filename", sa.String, nullable=False),
        sa.Column("s3_key", sa.String, nullable=False),
        sa.Column("page_count", sa.Integer, nullable=True),
        sa.Column("status", sa.String, nullable=False, server_default="uploading"),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    op.create_table(
        "queries",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("document_ids", ARRAY(UUID(as_uuid=True)), nullable=False),
        sa.Column("question", sa.Text, nullable=False),
        sa.Column("answer", sa.Text, nullable=False),
        sa.Column("sources", JSONB, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    op.create_table(
        "usage",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("month", sa.Date, nullable=False),
        sa.Column("pdf_uploads", sa.Integer, default=0),
        sa.Column("pages_processed", sa.Integer, default=0),
        sa.Column("queries_made", sa.Integer, default=0),
        sa.Column("tokens_used", sa.Integer, default=0),
        sa.UniqueConstraint("user_id", "month", name="uq_user_month"),
    )


def downgrade() -> None:
    op.drop_table("usage")
    op.drop_table("queries")
    op.drop_table("documents")
    op.drop_table("users")
