# JobTrack: Job Application Tracker

A full-stack web app for keeping your job search organized. Log every company you apply to, mark when they respond, and schedule interview dates, all in one clean dashboard.

Built with a **React + Vite** frontend and a **FastAPI + SQLAlchemy** backend, storing data in **MySQL**.

## Features

- **Add applications** with company name, application date, and an optional interview date
- **Track responses** by toggling each application between "Awaiting response" and "Responded"
- **Schedule interviews** by setting or changing an interview date right from the list
- **Dashboard stats** showing total applications, responses received, and interviews scheduled
- **Search and filter** by company name, or by All / Awaiting response / Responded
- **Delete** applications you no longer want to track
- **Live API status** indicator, plus loading, error, and empty states
- **Input validation** on the server (company name is trimmed and cannot be blank)

## Tech Stack

| Layer    | Technology                                           |
| -------- | ---------------------------------------------------- |
| Frontend | React 19, Vite, plain CSS                            |
| Backend  | FastAPI, Pydantic v2, SQLAlchemy 2, Uvicorn          |
| Database | MySQL (via `mysql-connector-python`)                 |

## Project Structure

```
Job-Application-Tracker/
├── backend/
│   ├── main.py            # FastAPI app and API routes
│   ├── models.py          # SQLAlchemy Application model
│   ├── schemas.py         # Pydantic request/response schemas
│   ├── database.py        # Engine, session, DATABASE_URL loading
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    └── JobTrack/
        ├── src/
        │   ├── App.jsx    # Main UI and API calls
        │   ├── App.css
        │   └── main.jsx
        ├── index.html
        └── package.json
```

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 20.19+ (or 22.12+) and npm
- A running MySQL server

### 1. Set up the database

Create an empty MySQL database:

```sql
CREATE DATABASE jobtrack;
```

The `applications` table is created automatically the first time the backend starts.

### 2. Run the backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Copy the example environment file and fill in your MySQL credentials:

```bash
cp .env.example .env
```

```env
DATABASE_URL=mysql+mysqlconnector://username:password@localhost:3306/jobtrack
```

Start the API server:

```bash
uvicorn main:app --reload
```

The API runs at `http://127.0.0.1:8000`, with interactive docs at `http://127.0.0.1:8000/docs`.

### 3. Run the frontend

In a second terminal:

```bash
cd frontend/JobTrack
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

By default the frontend talks to `http://127.0.0.1:8000/api`. To point it somewhere else, set `VITE_API_URL` in a `.env` file inside `frontend/JobTrack`:

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

## API Reference

Base path: `/api`

| Method   | Endpoint                | Description                                   |
| -------- | ----------------------- | --------------------------------------------- |
| `GET`    | `/health`               | Health check                                  |
| `GET`    | `/applications`         | List all applications, newest first           |
| `POST`   | `/applications`         | Create an application                         |
| `PATCH`  | `/applications/{id}`    | Update `responded` and/or `interview_date`    |
| `DELETE` | `/applications/{id}`    | Delete an application                         |

**Create an application**

```http
POST /api/applications
Content-Type: application/json

{
  "company": "Acme Inc.",
  "applied_date": "2026-11-10",
  "interview_date": null
}
```

**Application object**

```json
{
  "id": 1,
  "company": "Acme Inc.",
  "applied_date": "2026-11-10",
  "responded": false,
  "interview_date": null
}
```

## Scripts (frontend)

| Command           | Description                    |
| ----------------- | ------------------------------ |
| `npm run dev`     | Start the Vite dev server      |
| `npm run build`   | Build for production           |
| `npm run preview` | Preview the production build   |
| `npm run lint`    | Run ESLint                     |

## Notes

- CORS on the backend allows requests from `localhost` and `127.0.0.1` on any port, which suits local development. Update the allowed origins in `backend/main.py` before deploying.
- The backend requires `DATABASE_URL` to be set and will refuse to start without it.

## Author

Built by [Somnath0411](https://github.com/Somnath0411).
