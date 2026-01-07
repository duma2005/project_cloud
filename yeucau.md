# Requierement - FilmConsensus

Tai lieu nay liet ke cac thu vien/phan mem can thiet de chay film-consensus.

## Frontend (Next.js)
- Node.js 18.17+ (khuyen nghi Node 20)
- npm 9+ (hoac cong cu tuong duong)

### NPM packages (tu package.json)
- @prisma/client
- clsx
- next
- react
- react-dom
- zod

### NPM dev packages (de build/dev)
- prisma
- typescript
- tailwindcss
- postcss
- autoprefixer
- eslint
- eslint-config-next
- @types/node
- @types/react
- @types/react-dom

## Backend (FastAPI)
- Python 3.10+ (khuyen nghi 3.11)
- pip + venv

### Python packages (tu Backend/requirements.txt)
- fastapi
- uvicorn
- sqlalchemy
- psycopg2-binary
- python-jose
- requests
- python-dotenv

## Database
- PostgreSQL 14+ (hoac cloud Postgres nhu Neon)
- psql client (tien loi khi can tao schema/seed)

## Ghi chu
- Prisma can truy cap PostgreSQL qua `DATABASE_URL`.
- Backend/Frontend deu can cac bien moi truong hop le de ket noi DB va backend API.
