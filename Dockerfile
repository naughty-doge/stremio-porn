FROM node:20-alpine

LABEL org.opencontainers.image.title="goonhub"
LABEL org.opencontainers.image.description="GoonHub - Stremio addon that provides videos and webcam streams from various porn sites"
LABEL org.opencontainers.image.source="https://github.com/VarKhir/goonhub"

WORKDIR /var/stremio_addon

# Copy package files first for better layer caching
COPY package.json ./
RUN npm install --only=prod --no-package-lock

# Copy application files (controlled by .dockerignore)
COPY dist/ ./dist/
COPY static/ ./static/

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD sh -c "wget --spider -q http://localhost:\${GOONHUB_PORT:-8080}/ || exit 1"

CMD ["node", "dist/index.js"]
