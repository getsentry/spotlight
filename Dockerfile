FROM node:lts-bullseye-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
WORKDIR /app
COPY . /app
# https://github.com/pnpm/pnpm/issues/6295
RUN echo "dedupe-peer-dependents=false" > .npmrc
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run --filter="./packages/sidecar" build && \
  pnpm run --filter="./packages/overlay" build 
RUN pnpm run --filter="./packages/spotlight" build
RUN pnpm deploy --filter="./packages/spotlight" --prod /deploy/spotlight

FROM base as spotlight
# FROM gcr.io/distroless/nodejs20-debian12 as sidecar
COPY --from=build /deploy/spotlight /app
WORKDIR /app
EXPOSE 8969
ENTRYPOINT [ "./bin/run.js" ]
