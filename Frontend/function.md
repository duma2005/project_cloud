# Frontend Functions (FilmConsensus)

Tai lieu nay tom tat cac chuc nang phia frontend va cac thu vien duoc su dung trong thu muc film-consensus.

## Cac trang/chuc nang chinh
- Trang chu (/): hien thi 3 cum phim Trending, Popular, Anticipated va link xem tat ca.
- Trending (/trending): danh sach phim moi them, hien thi theo createdAt.
- Popular (/top): danh sach phim theo imdbScore cao nhat.
- Discover (/discover): duyet catalog co phan trang (page param).
- Search (/search): tim kiem theo tu khoa, co lich su tim kiem (localStorage), pagination, hien trang thai loading/error/empty.
- Movie detail (/movie/[slug]): thong tin phim, tong hop ratings, top cast, JSON-LD schema.org, nut them vao watchlist.
- Watchlist (/watchlist): can dang nhap, hien danh sach phim da luu, co retry khi loi.
- Auth (/login): form dang nhap, luu token vao localStorage, menu dang nhap/dang xuat.
- Contact (/contact): form lien he co validate va gui qua API.
- About (/about): thong tin san pham.
- Chatbot widget: bong noi chat, keo tha duoc, gui cau hoi toi backend.
- SEO/metadata: metadata cho trang, canonical/OG, schema.org cho movie.

## API routes (frontend proxy)
- GET /api/search: proxy toi backend /movies/search, map field name, ho tro page/limit, rate limit.
- POST /api/auth/login: validate input, proxy toi backend /auth/login, rate limit.
- GET /api/watchlist: proxy toi backend /watchlist/, can Authorization.
- POST /api/watchlist/add: validate input, proxy toi backend /watchlist/add, can Authorization.
- POST /api/contact: validate input, proxy toi backend /contact, rate limit.
- POST /api/revalidate: revalidate cache theo secret.
- POST /api/cron/refresh: endpoint du tru de refresh catalog (hien tra ve stub).

## Thu vien va cong nghe
Runtime
- Next.js (App Router, Route Handlers, metadata, revalidatePath).
- React 18.
- TypeScript.
- TailwindCSS (UI styles).
- Prisma Client (@prisma/client) cho truy van DB trong server components.
- Zod (validate form/request payload).
- clsx (ghep className).

Dev/Build
- ESLint + eslint-config-next (lint).
- Prisma CLI (generate/migrate).
- PostCSS + Autoprefixer.
- React Grab (dev overlay, chi load trong development).
