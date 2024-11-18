FROM debian:bookworm-slim
WORKDIR /app
COPY packages/spotlight/dist/spotlight /app/spotlight

ENTRYPOINT ["/app/spotlight"]
