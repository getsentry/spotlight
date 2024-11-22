FROM debian:bookworm-slim
ARG TARGETARCH
WORKDIR /app
COPY packages/spotlight/dist/spotlight-linux-$TARGETARCH /app/spotlight
RUN chmod +x /app/spotlight

ENTRYPOINT ["/app/spotlight"]
