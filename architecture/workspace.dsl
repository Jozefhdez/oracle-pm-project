workspace "Oracle PM Tool" "Cloud-native project management tool for agile teams, built on OCI." {

    model {

        # Actors
        developer      = person "Developer"        "Uses the Kanban board and Telegram bot to manage tasks daily."
        projectManager = person "Project Manager"  "Creates sprints, monitors KPI dashboard, queries bot for summaries."
        devops         = person "DevOps Engineer"  "Provisions OCI infrastructure, manages CI/CD, deploys to OKE."

        # External Systems
        ociIam = softwareSystem "OCI IAM" "Oracle Cloud Identity and Access Management. OIDC identity provider for all user authentication." {
            tags "External System"
        }

        telegram = softwareSystem "Telegram" "Messaging platform. The bot uses long-polling to receive developer and PM commands." {
            tags "External System"
        }

        geminiApi = softwareSystem "Gemini API" "Google Gemini large language model. Used by the bot to parse natural language task commands." {
            tags "External System"
        }

        ocir = softwareSystem "OCI Container Registry" "Stores the Docker image for the Spring Boot application." {
            tags "External System"
        }

        # Main System (inside enterprise boundary)
        group "Team 13" {

        oraclePmTool = softwareSystem "Oracle PM Tool" "Cloud-native project management tool. Provides a Kanban web app, Telegram bot, and KPI dashboard." {

            springBoot = container "Spring Boot Application" "Monolithic backend + frontend. Serves the React SPA as static files, exposes the REST API, handles Telegram long-polling, and calls Gemini. Runs as 2 replicas on OKE." "Java 17 / Spring Boot 3" {

                securityModule      = component "Security Module"        "Validates JWTs issued by OCI IAM and enforces role-based access. Configured via Spring Security OAuth2 Resource Server."  "Spring Security"
                taskModule          = component "Task Module"            "Task CRUD, Kanban status transitions, work log management. Drives task_state_history and task_assignment_history writes via DB triggers." "Spring MVC + JPA"
                projectSprintModule = component "Project/Sprint Module"  "Project and sprint lifecycle: create, activate, close. Maintains planned_task_count baseline for scope-creep KPI."              "Spring MVC + JPA"
                kpiModule           = component "KPI Module"             "Computes and returns KPI snapshots (cycle time, scope creep, blocker resolution). Writes sprint_kpi_snapshot on sprint close."  "Spring MVC + JPA"
                telegramBot         = component "Telegram Bot Handler"   "Receives messages via long-polling. Dispatches intents to Gemini Service for NLP parsing, then calls Task or Project modules." "TelegramBots SDK"
                geminiService       = component "Gemini Service"         "HTTP client for the Gemini generateContent endpoint. Builds prompts, calls the API, and parses JSON responses."                  "Spring RestTemplate"
                userModule          = component "User Module"            "User profile management and Telegram account linking via one-time codes."                                                        "Spring MVC + JPA"
            }

            database = container "Oracle 26ai ATP" "Managed cloud database. Stores all relational data and VECTOR embeddings for semantic task search. Schema: TODOUSER." "Oracle 26ai Autonomous Transaction Processing" {
                tags "Database"
            }
        }

        } # end group

        # System-level Relationships
        developer      -> oraclePmTool "Manages tasks and views KPI dashboard"
        projectManager -> oraclePmTool "Creates sprints and monitors team performance"
        devops         -> oraclePmTool "Deploys and operates"

        oraclePmTool -> ociIam    "Validates user identity via OIDC"
        oraclePmTool -> telegram  "Sends and receives bot messages"
        oraclePmTool -> geminiApi "Natural language processing for bot commands"
        devops        -> ocir     "Pushes Docker images via build.sh"

        # Container-level Relationships
        developer      -> springBoot "Accesses Kanban board and REST API via browser (HTTPS)"
        developer      -> telegram   "Sends task updates via Telegram"
        projectManager -> springBoot "Accesses KPI dashboard via browser (HTTPS)"
        telegram       -> springBoot "Delivers bot messages via long-polling"
        springBoot     -> database   "Reads and writes all application data" "JDBC / JPA"
        springBoot     -> ociIam     "Validates JWT bearer tokens"           "HTTPS / JWKS"
        springBoot     -> geminiApi  "Sends NLP prompts and receives responses" "HTTPS / REST"

        # Component-level Relationships
        securityModule      -> ociIam           "Fetches JWKS and validates tokens" "HTTPS"
        telegramBot         -> geminiService    "Forwards raw message text for NLP parsing"
        telegramBot         -> taskModule       "Calls status-update and work-log endpoints"
        telegramBot         -> projectSprintModule "Queries sprint summaries"
        geminiService       -> geminiApi        "POST /generateContent"              "HTTPS / REST"
        taskModule          -> database         "Task CRUD and history writes"       "JPA"
        projectSprintModule -> database         "Project and sprint CRUD"            "JPA"
        kpiModule           -> database         "Reads history tables for KPI math"  "JPA"
        userModule          -> database         "User profile and link-code storage" "JPA"

        # Deployment
        deploymentEnvironment "Production — OCI mx-queretaro-1" {

            deploymentNode "Oracle Cloud Infrastructure" "OCI Region: mx-queretaro-1" "OCI" {

                deploymentNode "OCI Load Balancer" "Public HTTPS endpoint. TLS termination. Routes port 443 to OKE NodePort 32541." "OCI LBaaS" {
                    infrastructureNode "HTTPS Listener (443)" "oracle-pm.duckdns.org — RSA certificate (oracle-pm-cert-rsa)" "OCI LBaaS"
                }

                deploymentNode "OKE Cluster — mtdrworkshop namespace" "Oracle Kubernetes Engine. Node pool across worker nodes." "OCI OKE" {

                    deploymentNode "Pod Replica 1" "Spring Boot pod" "Docker / OKE" {
                        containerInstance springBoot
                    }

                    deploymentNode "Pod Replica 2" "Spring Boot pod" "Docker / OKE" {
                        containerInstance springBoot
                    }
                }

                deploymentNode "Oracle 26ai ATP — oraclepmdb" "Managed Autonomous Transaction Processing. Schema: TODOUSER. TNS alias: oraclepmdb_tp." "OCI ATP" {
                    containerInstance database
                }
            }
        }
    }

    views {

        systemLandscape "SystemLandscape" "All actors and software systems." {
            include *
            autolayout lr
        }

        systemContext oraclePmTool "SystemContext" "Oracle PM Tool and its external dependencies." {
            include *
            autolayout lr
        }

        container oraclePmTool "Containers" "Containers inside Oracle PM Tool." {
            include *
            autolayout lr
        }

        component springBoot "Components" "Internal modules of the Spring Boot application." {
            include *
            autolayout lr
        }

        deployment oraclePmTool "Production — OCI mx-queretaro-1" "Deployment" "Production deployment on OCI OKE." {
            include *
            autolayout lr
        }

        dynamic oraclePmTool "TelegramTaskUpdate" "Developer updates task status via Telegram bot." {
            developer  -> telegram   "Sends natural-language command (e.g. 'mark task X as done')"
            telegram   -> springBoot "Delivers message via long-polling"
            springBoot -> geminiApi  "POST /generateContent — parse intent and extract task reference"
            geminiApi  -> springBoot "Returns structured action (taskId, newStatus)"
            springBoot -> database   "UPDATE tasks SET status = DONE — triggers write to task_state_history"
            database   -> springBoot "Confirms row updated"
            springBoot -> telegram   "Sends confirmation reply"
            telegram   -> developer  "Displays task marked as done"
            autolayout lr
        }

        styles {
            element "Person" {
                background #1168bd
                color      #ffffff
                shape      Person
            }
            element "Software System" {
                background #1168bd
                color      #ffffff
            }
            element "External System" {
                background #999999
                color      #ffffff
            }
            element "Container" {
                background #438dd5
                color      #ffffff
            }
            element "Database" {
                shape Cylinder
            }
            element "Component" {
                background #85bbf0
                color      #000000
            }
        }
    }
}
