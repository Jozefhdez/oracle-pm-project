-- Vector Search Migration
-- Run as TODOUSER after admin grants and ONNX model loading are done.
-- Prerequisites:
--   1. Admin has run the GRANT statements for DBMS_CLOUD, DBMS_VECTOR, etc.
--   2. TODOUSER has loaded the ALL_MINILM_L12_V2 model via DBMS_VECTOR.LOAD_ONNX_MODEL.

-- Step 1: Add the vector column to tasks
ALTER TABLE tasks ADD (embedding VECTOR(384, FLOAT32));

-- Step 2: Trigger to auto-generate embeddings on insert or title update
CREATE OR REPLACE TRIGGER trg_task_embedding_bu
BEFORE INSERT OR UPDATE OF title ON tasks
FOR EACH ROW
BEGIN
    :NEW.embedding := VECTOR_EMBEDDING(ALL_MINILM_L12_V2 USING :NEW.title AS data);
END;
/

-- Step 3: Backfill embeddings for existing tasks
UPDATE tasks SET embedding = VECTOR_EMBEDDING(ALL_MINILM_L12_V2 USING title AS data);
COMMIT;

-- Step 4: Vector index for fast cosine similarity search (optional but recommended)
CREATE VECTOR INDEX tasks_embedding_vidx ON tasks(embedding)
ORGANIZATION NEIGHBOR PARTITIONS
DISTANCE COSINE
WITH TARGET ACCURACY 90;
