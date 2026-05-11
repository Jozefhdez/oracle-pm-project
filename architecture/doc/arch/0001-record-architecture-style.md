# 1. Architecture Style Selection

Date: 2026-03-11

## Context

The system must support a Kanban web interface, a Telegram bot, and a KPI dashboard — all sharing the same Oracle database.

The team evaluated the following architecture styles covered in the course:

| Style | Considered? | Reason |
|---|---|---|
| Monolith | Selected (primary) | Fits team size, budget, and deadline |
| Layered | Selected (internal) | Natural fit for Spring Boot's MVC structure |
| Event-Driven | Selected (bot edge) | Telegram long-polling is event-driven by nature |
| Microservices | Rejected | Overkill for a pilot; adds K8s complexity without benefit |
| Service-Based | Rejected | Shared DB without service autonomy gives no benefit over Monolith |
| Space-Based | Rejected | No high-scalability requirement in the pilot phase |
| Pipeline | Rejected | Not applicable to a CRUD + bot system |
| Microkernel | Rejected | No plug-in extensibility requirement |
| Service-Oriented | Rejected | ESB overhead not justified for five components |

## Decision

**Primary style: Modular Monolith**

The entire application ships as a single Spring Boot JAR containing the REST API, the React SPA (bundled via `frontend-maven-plugin`), the Telegram bot handler, and the Gemini integration. This single artifact is packaged into one Docker image (`todolistapp-springboot:0.1`) and deployed as one Kubernetes Deployment (`todolistapp-springboot-deployment`) with two replicas on OCI OKE.

**Internal structure: Layered Architecture**

Inside the monolith, code is organized into three horizontal layers:

- **Controller layer**: Spring MVC REST controllers and the Telegram bot handler. Entry points only; no business logic.
- **Service layer**: Business rules, KPI calculations, Gemini NLP orchestration. Stateless Spring `@Service` beans.
- **Repository layer**: Spring Data JPA repositories backed by Oracle 26ai ATP. No raw SQL in application code except for named queries.

**Bot edge: Event-Driven**

Incoming Telegram messages arrive as discrete events via long-polling. Each message triggers an independent processing pipeline: Bot Handler -> Gemini Service -> Task/Sprint Module -> Database. This edge behaves event-driven even though the rest of the system is synchronous.

## Consequences

**Positive:**

- Single deployable unit dramatically simplifies CI/CD: one `build.sh`, one Docker image, one `deploy.sh`.
- All code in one repository and one process — no cross-service network calls, no distributed tracing needed.
- Layered structure keeps Spring Boot idiomatic and is immediately understood by any Spring developer.

**Negative:**

- Individual modules (e.g., the KPI engine vs. the Telegram bot) cannot be scaled independently. Both replicas always run all modules.
- A bug in any module can bring down the entire application. No fault isolation between the bot and the web API.
- Future extraction into microservices would require significant refactoring of shared JPA entities and database access patterns.

**Accepted trade-off:** The simplicity and deployment speed of a Modular Monolith outweigh the scaling and isolation benefits of microservices for this pilot phase and team size.
