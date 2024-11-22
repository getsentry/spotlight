FROM debian:bookworm-slim
ARG TARGETARCH
WORKDIR /app
COPY --chmod=555 packages/spotlight/dist/spotlight-linux-$TARGETARCH /app/spotlight

ENTRYPOINT ["/app/spotlight"]
