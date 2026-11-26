# ---- build stage ----
# Debian (glibc) rather than Alpine: Rollup's native parser fails on musl in 4.68.6
# ("Code is nested too deeply", rollup/rollup#6670). Only the build stage; the
# served image below stays nginx:alpine.
FROM node:22.23.4-slim AS build
WORKDIR /app

# Private GitHub Packages auth (e.g. @smit9313/abss-pdf). The token arrives as a
# build-arg from CI; the .npmrc is written just for the install and removed in the
# same layer so it never persists in the image.
ARG NPM_TOKEN

# Vite inlines env values at BUILD time. Every value arrives via
# .env.production, which the workflow generates from the GitHub Actions
# variables and ships inside the build context, so there is nothing to
# declare here - a new variable never needs a change to this file.
COPY package*.json ./
RUN echo "@smit9313:registry=https://npm.pkg.github.com" > .npmrc \
 && echo "//npm.pkg.github.com/:_authToken=$NPM_TOKEN" >> .npmrc \
 && npm pkg delete scripts.prepare && npm install \
 && rm -f .npmrc
COPY . .
RUN npm run build

# ---- serve stage ----
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
