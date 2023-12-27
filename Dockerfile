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
RUN pnpm run --filter="./packages/sidecar" build
RUN pnpm deploy --filter="./packages/sidecar" --prod /deploy/sidecar

FROM base as sidecar
# FROM gcr.io/distroless/nodejs20-debian12 as sidecar
COPY --from=build /deploy/sidecar /app
WORKDIR /app
EXPOSE 8969
ENTRYPOINT [ "./server.js" ]
