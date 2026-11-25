# The interview app: one deploy, one origin.
#
# Stage 1 builds the React UI from the vendored Claire primitives. Stage 2 ships the Python
# server that serves both the built UI and the JSON API — no second host, no CORS, no proxy
# that only exists in dev.
FROM node:22-slim AS web
WORKDIR /web
COPY web/package.json web/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY web ./
RUN npm run build

FROM python:3.12-slim
WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY src ./src
COPY interviewer ./interviewer
COPY reviewer ./reviewer
COPY programs ./programs
COPY docker-entrypoint.sh ./
RUN chmod +x /app/docker-entrypoint.sh

# The built UI. Its absence is not fatal: the server falls back to the dependency-free page.
COPY --from=web /web/dist ./web/dist

ENV PYTHONUNBUFFERED=1 \
    KIT_PROVIDER=deepseek \
    PORT=8080

EXPOSE 8080
ENTRYPOINT ["/app/docker-entrypoint.sh"]
