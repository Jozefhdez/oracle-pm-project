# 2. Oracle 26ai ATP over a Standard Relational Database

Date: 2026-05-10

## Status

Accepted

## Context

The Oracle PM Tool's Telegram bot needs to resolve ambiguous task references from natural language messages. For example, a developer sending "the authentication bug is done" must be matched to the correct task in the database even when the message does not include a task ID.

Semantic (vector) search was identified as the correct approach: embed task titles as dense vectors and find the nearest neighbour to the embedding of the incoming message.

The team evaluated three database options:

| Option | Vector Support | Relational Support | Notes |
|---|---|---|---|
| Oracle 26ai ATP | Native (VECTOR_EMBEDDING, ONNX models) | Full SQL | One DB for everything |
| PostgreSQL + pgvector | pgvector extension | Full SQL | Two-extension setup; self-managed on OCI |
| PostgreSQL + Pinecone | External vector store | Full SQL | Two separate services; added latency and cost |

## Decision

Use **Oracle 26ai ATP** as the sole database for all relational and vector data.

The ONNX model `ALL_MINILM_L12_V2` (384-dimensional sentence embeddings) is loaded directly into the Oracle 26ai engine via `DBMS_VECTOR.LOAD_ONNX_MODEL`. A database trigger (`trg_task_embedding_bu`) automatically generates and stores the embedding for every task title on INSERT or UPDATE, using:

```sql
SELECT VECTOR_EMBEDDING(TODOUSER_DEV.ALL_MINILM_L12_V2 USING :NEW.title AS data)
INTO v_emb FROM dual;
```

At query time, the bot service calls `VECTOR_DISTANCE` to find the most semantically similar task to the incoming message — all within a single SQL statement, with no external service call.

The project runs on OCI under a $300 student credit budget. Oracle 26ai ATP is available as a free Always-Free tier on OCI, eliminating the cost of a separate vector database service.

## Consequences

**Positive:**

- Single database for all data: no synchronisation between a relational store and a vector store.
- Embedding generation is automatic via a DB trigger — the application layer never calls an embedding API directly.
- Vector search executes inside the DB engine, avoiding a network round-trip to an external service.
- Zero additional cost: Oracle 26ai ATP is covered by the OCI Always-Free tier used for this project.

**Negative:**

- Vendor lock-in to OCI and Oracle 26ai. Migrating to another database would require rewriting the embedding trigger, the ONNX model loading procedure, and all VECTOR_EMBEDDING / VECTOR_DISTANCE SQL.
- Oracle 26ai-specific syntax appears in trigger code and native queries, making the data layer non-portable.
- The ONNX model must be loaded into the correct schema (TODOUSER_DEV) and the consuming schema (TODOUSER) must hold the SELECT ANY MINING MODEL system privilege.

**Accepted trade-off:** The operational simplicity of a single database and zero additional cost outweigh the portability concerns for a pilot deployment on OCI infrastructure.
