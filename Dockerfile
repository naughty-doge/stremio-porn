FROM node:alpine

WORKDIR /var/stremio_addon
# The exact files included are controlled by .dockerignore
COPY . .
RUN npm install --only=prod --no-package-lock

CMD node dist/index.js
