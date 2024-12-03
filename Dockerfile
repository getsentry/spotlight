FROM debian:bookworm-slim
ARG TARGETARCH
WORKDIR /app
COPY --chmod=555 packages/spotlight/dist-bin/spotlight-linux-$TARGETARCH /app/spotlight

ENTRYPOINT ["/app/spotlight"]
