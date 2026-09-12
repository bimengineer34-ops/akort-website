FROM node:lts

WORKDIR /app

# better-sqlite3 compiles a native addon during npm install.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321

# Seeding is idempotent (checks each table is empty before inserting), so it's
# safe to run on every container start, not just the first one.
CMD ["sh", "-c", "npm run db:seed && node ./dist/server/entry.mjs"]
