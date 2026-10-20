# AICTE Agentic Decision-Support Platform
### Complete Functional Prototype — Institutional Regulatory Scrutiny & Forensics

The **AICTE Agentic Decision-Support Platform** is a hybrid microservices system engineered to assist regulatory scrutiny committees in evaluating technical institution approval dossiers (Extension of Approval, Land Titles, Fire Safety NOCs, Cadre Ratios, and Building Occupancies).

This platform replaces speculative or manual verification with an autonomous multi-agent verification pipeline, mathematical document forensics, conditional ladder verification, cryptographic hash-chained audit logging, and human-in-the-loop decision controls.

---

## 1. Architecture Overview

```text
                     Next.js Frontend (Port 3000)
                            |
                            v
                    Fastify API Gateway (Port 5001)
                            |
              +-------------+-------------+
              |                           |
              v                           v
     PostgreSQL (Prisma)            Redis + BullMQ
              |                           |
              |                           v
              |                    Python AI Service (Port 8000)
              |                              FastAPI
              |                           |
              |                  LangGraph Orchestrator
              |                           |
              |          +----------------+----------------+
              |          |                |                |
              |          v                v                v
              |       PaddleOCR/OpenCV   Forensics     Verification
              |          |                |                |
              |          +----------------+----------------+
              |                           |
              |                           v
              |                    Compliance Engine (APH 2026-27)
              |                           |
              +---------------------------+
                            |
                            v
                    Evidence-Based Report
                            |
                            v
                    Human Official Review (Approve / Rectify / Escalate)
                            |
                            v
                     SHA-256 Tamper-Evident Hash Chain
```

### Core Runtime Principles
1. **Zero Fake Data**: All stats, findings, document previews, and audit logs are derived from genuine execution and stored records.
2. **Single Orchestration Runtime**: Python LangGraph acts as the autonomous graph orchestrator with deterministic DAG fallback for environments without LangGraph binaries installed.
3. **No Automatic Approvals**: AI agents generate findings and recommendations; only authenticated scrutiny officers can officially Approve, Request Rectification, or Escalate.
4. **Tamper-Evident Audit Trail**: Every application submission, document upload, AI finding generation, and official review action is cryptographically hash-chained (`sequence:timestamp:actorId:actorRole:action:resourceRef:previousHash`).

---

## 2. Six-Agent Pipeline

1. **Intake Agent (`ai-service/agents/intake.py`)**:
   - Classifies submitted application categories (Engineering & Tech, Management, Pharmacy, Architecture).
   - Maps statutory document checklists according to AICTE Approval Process Handbook (APH 2026-27).
   - Detects missing mandatory attachments before resource-intensive processing begins.
2. **Document Agent (`ai-service/agents/document.py`)**:
   - Preprocesses raster scans (contrast enhancement, deskewing, noise reduction).
   - Extracts digital text via PDF text streams and OCR engines.
   - Extracts structured statutory fields (Land area, NOC validity dates, Faculty identifiers).
3. **Forensics Agent (`ai-service/agents/forensics.py`)**:
   - **Level 1 (File & Visual)**:
     - Error Level Analysis (ELA) for JPEG/PNG compression differentials with generated visual heatmaps.
     - Perceptual hashing (64-bit pHash) detecting exact and near-duplicate certificates across applications.
     - EXIF / PDF metadata inspection detecting image-manipulation software signatures (e.g. Adobe Photoshop, GIMP).
   - **Level 2 (Semantic Deduplication)**:
     - Cross-institution faculty UID duplicate detection preventing ghost faculty roster reuse.
4. **Verification Agent (`ai-service/agents/verification.py`)**:
   - Executes the conditional verification ladder:
     `QR Code Decoding -> Digital Signature (pyHanko) -> Mock Issuer Registry -> Scrutiny Review Flag`.
   - Distinguishes cryptographic signature validity from signer authority trust.
5. **Compliance Agent (`ai-service/agents/compliance.py`)**:
   - Evaluates versioned, configuration-driven rules from `data/rules/aph_2026_27_rules.json`.
   - Validates minimum land acreage, fire safety validity windows, and faculty cadre ratios.
6. **Orchestrator Agent (`ai-service/agents/orchestrator.py` & `graph/workflow.py`)**:
   - Coordinates dynamic conditional routing (Scanned Image $\to$ Forensics; Signed PDF/QR $\to$ Verification; Mixed $\to$ Both).
   - Synthesizes all agent execution steps into an evidence-linked scrutiny report.

---

## 3. Project Structure

```text
aicte-agentic-platform/
├── frontend/                        # Next.js 16 + React 19 + Tailwind v4 + TypeScript
│   ├── app/                         # App router (dashboard, applications, upload, review, audit, agents)
│   ├── components/                  # Dashboard, Evidence Modal, Stat Cards, Header, Sidebar
│   └── lib/                         # Authenticated API client, Auth Context, Types
├── gateway/                         # Fastify API Gateway (Node.js + TypeScript)
│   ├── src/
│   │   ├── server.ts                # Fastify server bootstrap & CORS
│   │   ├── routes/                  # Auth, Applications, Documents, Findings, Audit, Analytics
│   │   ├── middleware/              # JWT verification & RBAC role guards
│   │   └── services/                # DB repository, Auth, Storage, Audit, Queue, Impact
│   ├── prisma/schema.prisma         # Relational PostgreSQL data models
│   └── test/gateway.test.ts         # Gateway automated test suite
├── ai-service/                      # Python FastAPI AI & Forensics Service
│   ├── main.py                      # FastAPI endpoints (/health, /process/application, etc.)
│   ├── agents/                      # Intake, Document, Forensics, Verification, Compliance, Orchestrator
│   ├── graph/workflow.py            # LangGraph StateGraph orchestration
│   ├── tools/                       # ELA, pHash, QR, Signature, OCR, Preprocessing, Metadata
│   └── tests/test_agents.py         # AI service automated test suite
├── data/
│   ├── rules/                       # APH 2026-27 versioned compliance rules
│   ├── mock-registry/               # Prototype mock issuer certificate database
│   └── test-fixtures/               # Explicitly labeled synthetic test files
├── storage/
│   ├── documents/                   # Secure storage for uploaded dossiers
│   └── evidence/                    # Generated ELA heatmaps and forensic artifacts
├── docker-compose.yml               # Multi-container orchestration (5 services)
├── .env.example                     # Environment configuration template
└── README.md
```

---

## 4. Prerequisites

- **Node.js**: `v20.x` or higher
- **Python**: `3.10` or higher
- **npm**: `v10.x` or higher
- **Docker & Docker Compose** (optional for containerized deployment)

---

## 5. Local Setup & Execution

### Step 1: Install Dependencies

```bash
# 1. Gateway dependencies
cd gateway
npm install

# 2. Frontend dependencies
cd ../frontend
npm install

# 3. Python AI service dependencies
cd ../ai-service
pip install -r requirements.txt
```

### Step 2: Environment Configuration

Copy `.env.example` in root:
```bash
cp .env.example .env
```

### Step 3: Run Automated Test Suites

```bash
# 1. Gateway automated tests (Auth, RBAC, Audit hash-chain, Impact calculations)
cd gateway
npx ts-node test/gateway.test.ts

# 2. Live End-to-End AI processing test (Real multipart upload, real Python AI execution, zero simulated findings)
npx ts-node test/real_ai_processing.test.ts

# 3. Python AI agent test suite (Intake, ELA, pHash, Verification ladder, Compliance, Orchestrator)
cd ../ai-service
python3 tests/test_agents.py

# 4. Dynamic routing verification test (Scanned image, Digital PDF, Mixed dossier)
python3 tests/test_dynamic_routing.py
```


### Step 4: Start Services Locally

You can run the three core services concurrently in separate terminals:

```bash
# Terminal 1: Python AI Service (Port 8000)
cd ai-service
python3 main.py

# Terminal 2: Fastify API Gateway (Port 5001)
cd gateway
npm run dev

# Terminal 3: Next.js Frontend (Port 3000)
cd frontend
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 6. Docker Deployment

To launch the complete platform including PostgreSQL and Redis:

```bash
docker compose up --build
```

Services will be accessible at:
- **Frontend Dashboard**: `http://localhost:3000`
- **Fastify API Gateway**: `http://localhost:5001`
- **FastAPI AI Service**: `http://localhost:8000`
- **PostgreSQL Database**: `localhost:5432`
- **Redis Queue**: `localhost:6379`

---

## 7. Demonstration Accounts (Sandbox Credentials)

The platform is pre-seeded with bcrypt-hashed credentials specifically for sandbox demonstration:

| Demonstration Role | Email | Password | Permissions & Scope |
|---|---|---|---|
| **Demo Scrutiny Officer** | `demo-officer@aicte.gov.in` | `DemoOfficer#AICTE2026!` | Review applications, Approve, Request Rectification, Escalate |
| **Demo Institution** | `demo-institution@engg.edu` | `DemoInst#AICTE2026!` | Create applications, upload dossiers, view submitted files |
| **Demo Administrator** | `demo-admin@aicte.gov.in` | `DemoAdmin#AICTE2026!` | Configure scrutiny baseline, audit verification, full access |

> [!NOTE]
> These are designated demonstration sandbox accounts. They are not genuine AICTE officials or institutions. Switching roles via the dashboard selector performs real HTTP authentication against `/api/auth/login` to obtain an authenticated session.

---


## 8. API Reference

### Gateway Endpoints (`http://localhost:5001`)

- `GET /health`: Health status.
- `POST /api/auth/login`: Authenticate and obtain JWT token.
- `GET /api/auth/me`: Retrieve current session user.
- `GET /api/applications`: List applications (supports `?status=`).
- `POST /api/applications`: Create new application dossier.
- `GET /api/applications/:id`: Fetch application details, documents, findings, and review history.
- `POST /api/applications/:id/process`: Queue application for autonomous AI agent processing.
- `POST /api/applications/:id/approve`: Authorize regulatory approval (Scrutiny Officer only).
- `POST /api/applications/:id/rectification`: Issue deficiency rectification notice (Scrutiny Officer only).
- `POST /api/applications/:id/escalate`: Escalate to Senior Appellate Committee (Scrutiny Officer only).
- `POST /api/documents/upload`: Multipart upload with MIME validation & SHA-256 calculation.
- `GET /api/documents/:id/preview`: Secure streaming of uploaded document.
- `GET /api/findings/:id/evidence`: Fetch evidence payload and generated heatmaps.
- `GET /api/audit`: Retrieve hash-chained audit log.
- `GET /api/audit/verify`: Cryptographically recompute and verify SHA-256 audit chain.
- `GET /api/analytics/impact`: Retrieve genuine processing metrics and manual time saved.
- `POST /api/analytics/impact/config`: Update scrutiny manual baseline benchmark (Admin only).

### Python AI Endpoints (`http://localhost:8000`)

- `GET /health`: Service health check.
- `POST /process/application`: Orchestrated 6-agent decision-support pipeline.
- `POST /extract/document`: OCR and document extraction.
- `POST /analyze/forensics`: ELA, pHash, and metadata inspection.
- `POST /verify/document`: Conditional verification ladder.
- `POST /evaluate/compliance`: APH 2026-27 rule engine evaluation.

---

## 9. Prototype Scope & Known Limitations

1. **Third-Party Authority Connectivity**:
   - The platform includes a local prototype mock registry (`data/mock-registry/issuer_records.json`) for testing issuer certificate validation. It **does not claim live production connectivity to DigiLocker or State Government Land Registries**, which require statutory API gateways and VPN tunnels.
2. **Error Level Analysis (ELA)**:
   - ELA heatmaps identify recompression anomalies and editing artifacts. They provide indicators of potential tampering for human review, not absolute legal proof of forgery.
3. **Digital Signatures**:
   - Digital signatures are verified cryptographically using pyHanko. Document trust status is reported separately from certificate authority (CA) root trust stores.
