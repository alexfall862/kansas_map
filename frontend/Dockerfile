# Frontend: Vite + React
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN if [ -f package-lock.json ]; then npm ci;         elif [ -f yarn.lock ]; then yarn install --frozen-lockfile;         elif [ -f pnpm-lock.yaml ]; then npm i -g pnpm && pnpm i --frozen-lockfile;         else npm i; fi
COPY . .
RUN npm run build

# Serve with vite preview (simplest) or a static server
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=build /app /app
ENV PORT=4173
EXPOSE 4173
# Railway sets $PORT; use it if provided
CMD sh -c "npx vite preview --host --port ${PORT:-4173}"
