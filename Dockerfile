FROM debian:bookworm-slim
WORKDIR /app
COPY packages/spotlight/dist/spotlight /app/spotlight
RUN chmod +x /app/spotlight

ENTRYPOINT ["/app/spotlight"]
