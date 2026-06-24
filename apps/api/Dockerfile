FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm install

FROM deps AS build
COPY tsconfig.base.json eslint.config.js prettier.config.js ./
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm run build --workspace @sh-cert-converter/shared
RUN npm run build --workspace @sh-cert-converter/api

FROM node:22-alpine AS runner
RUN sed -i 's/https:/http:/g' /etc/apk/repositories \
  && apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm install --omit=dev --workspace @sh-cert-converter/api --workspace @sh-cert-converter/shared
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/packages/shared/dist packages/shared/dist
EXPOSE 3001
CMD ["npm", "run", "start", "--workspace", "@sh-cert-converter/api"]
