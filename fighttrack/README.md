# 🥊 FightTrack

A full-stack platform for amateur athletes to track training sessions and arrange sparring matches.

---

## Tech Stack

| Layer    | Technology                                   |
|----------|----------------------------------------------|
| Backend  | Django 4.2 + Django REST Framework + SQLite  |
| Auth     | DRF Token Authentication                     |
| Frontend | Angular 17 (standalone components)           |
| CORS     | django-cors-headers                          |

---

## Project Structure

```
fighttrack/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   └── fighttrack_api/
│       ├── settings.py
│       ├── urls.py
│       └── apps/
│           ├── users/      # Auth, UserProfile
│           ├── gyms/       # Gym model + custom manager
│           ├── training/   # TrainingLog (full CRUD)
│           └── sparring/   # SparringRequest
├── frontend/
│   ├── angular.json
│   ├── package.json
│   └── src/
│       └── app/
│           ├── components/
│           │   ├── login/
│           │   ├── register/
│           │   ├── dashboard/
│           │   ├── training-log/
│           │   ├── sparring/
│           │   ├── gyms/
│           │   └── navbar/
│           ├── services/
│           │   ├── auth.service.ts   ← login/logout/register
│           │   └── api.service.ts    ← ALL HttpClient calls
│           ├── interceptors/
│           │   └── auth.interceptor.ts  ← JWT injection
│           ├── guards/
│           │   └── auth.guard.ts
│           └── models/
│               └── models.ts         ← All TypeScript interfaces
└── FightTrack.postman_collection.json
```

---

## Backend Setup

```bash
cd backend

# 1. Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run migrations
python manage.py migrate

# 4. Create a superuser (optional)
python manage.py createsuperuser

# 5. Start dev server
python manage.py runserver
```

Backend runs at **http://localhost:8000**

---

## Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Start Angular dev server
ng serve
# or
npm start
```

Frontend runs at **http://localhost:4200**

---

## Requirements Checklist

### Backend (Django + DRF)

| Requirement | Implementation |
|---|---|
| ≥4 models | `User` (built-in), `UserProfile`, `Gym`, `TrainingLog`, `SparringRequest` |
| 1 custom model manager | `ActiveGymManager` on `Gym` – filters active gyms + `by_city()` |
| ≥2 ForeignKey relationships | `TrainingLog→User`, `SparringRequest→User×2`, `SparringRequest→Gym` |
| ≥2 `serializers.Serializer` | `LoginSerializer`, `RegisterSerializer`, `TrainingLogWriteSerializer`, `GymCreateSerializer`, `SparringRequestCreateSerializer`, `SparringStatusSerializer` |
| ≥2 `serializers.ModelSerializer` | `UserSerializer`, `UserProfileSerializer`, `GymSerializer`, `TrainingLogSerializer`, `SparringRequestSerializer` |
| ≥2 FBV with DRF decorators | `login_view`, `logout_view`, `register_view`, `gym_list`, `gym_detail`, `training_log_list_create`, `training_stats`, `sparring_list_create`, `sparring_incoming` |
| ≥2 CBV using APIView | `UserProfileView`, `UsersListView`, `GymCreateView`, `GymUpdateDeleteView`, `TrainingLogDetailView`, `SparringDetailView`, `SparringStatusView` |
| Token-based auth (login/logout) | `/api/auth/login/` + `/api/auth/logout/` |
| Full CRUD for ≥1 model | `TrainingLog` – GET list, POST, GET detail, PUT, DELETE |
| Link objects to `request.user` | `TrainingLog.user = request.user`, `SparringRequest.initiator = request.user` |
| CORS configured | `django-cors-headers`, allows `http://localhost:4200` |

### Frontend (Angular 17)

| Requirement | Implementation |
|---|---|
| Interfaces & services | `models/models.ts` interfaces; `auth.service.ts` + `api.service.ts` |
| ≥4 click events → API | `onLogin()`, `onRegister()`, `deleteLog()`, `respond()`, `cancel()`, `deleteGym()`, `logout()` |
| ≥4 `[(ngModel)]` form controls | Login (username, password), Register (×4), TrainingLog (×6), Sparring (×5), Gyms (×5) |
| CSS styling | Per-component styles + global dark theme via CSS variables |
| Routing with ≥3 named routes | `/dashboard`, `/training`, `/sparring`, `/gyms`, `/login`, `/register` |
| `@for` + `@if` | Used in all components (Angular 17 control flow syntax) |
| JWT HTTP interceptor | `auth.interceptor.ts` – injects `Authorization: Token <token>` |
| Login page + Logout | `login.component.ts` + navbar logout button |
| ≥1 Angular Service with HttpClient | `api.service.ts` handles ALL API calls; `auth.service.ts` handles auth |
| Graceful API error handling | All components show `errorMsg` alerts on failed requests |

---

## API Endpoints

### Auth
| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | `/api/auth/register/` | No | Register new user |
| POST | `/api/auth/login/` | No | Login, returns token |
| POST | `/api/auth/logout/` | Yes | Invalidate token |
| GET | `/api/auth/profile/` | Yes | Get own profile |
| PUT | `/api/auth/profile/` | Yes | Update own profile |
| GET | `/api/auth/users/` | Yes | List all other users |

### Gyms
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/gyms/?city=Almaty` | List active gyms (optional city filter) |
| GET | `/api/gyms/<id>/` | Get single gym |
| POST | `/api/gyms/create/` | Create gym |
| PUT | `/api/gyms/<id>/edit/` | Update gym |
| DELETE | `/api/gyms/<id>/edit/` | Soft-delete gym |

### Training Logs (Full CRUD)
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/training/` | List my training logs |
| POST | `/api/training/` | Create training log |
| GET | `/api/training/<id>/` | Get single log |
| PUT | `/api/training/<id>/` | Update log |
| DELETE | `/api/training/<id>/` | Delete log |
| GET | `/api/training/stats/` | Aggregate stats |

### Sparring
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/sparring/` | List all my sparring requests |
| POST | `/api/sparring/` | Create sparring request |
| GET | `/api/sparring/incoming/` | Pending requests received |
| GET | `/api/sparring/<id>/` | Get single request |
| DELETE | `/api/sparring/<id>/` | Cancel request (initiator only) |
| PATCH | `/api/sparring/<id>/status/` | Accept/decline (opponent only) |

---

## Postman

Import `FightTrack.postman_collection.json` into Postman.

1. Set the `base_url` variable to `http://localhost:8000`
2. Run **Register** or **Login** and copy the returned `token`
3. Set the `token` collection variable
4. All other requests will use `Authorization: Token {{token}}` automatically
