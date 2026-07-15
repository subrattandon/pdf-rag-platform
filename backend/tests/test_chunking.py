from app.workers.embeddings import chunk_text


def test_chunk_text_short():
    text = "Hello world"
    chunks = chunk_text(text)
    assert len(chunks) >= 1
    assert "Hello world" in chunks[0]


def test_chunk_text_long():
    text = "word " * 2000
    chunks = chunk_text(text)
    assert len(chunks) > 1


def test_chunk_text_empty():
    chunks = chunk_text("")
    assert len(chunks) == 0
