FROM debian:bookworm-slim
ARG TARGETARCH
WORKDIR /app
COPY --chmod=555 packages/spotlight/dist-bin/spotlight-linux-$TARGETARCH /app/spotlight

HEALTHCHECK CMD [ "bash", "-c", "exec 3<>'/dev/tcp/localhost/8969' && printf 'GET /health HTTP/1.0\r\nHost: localhost\r\n\r\n' >&3 && read -r line <&3 && echo \"$line\" | grep -q '200 OK'" ]

ENTRYPOINT ["/app/spotlight"]
