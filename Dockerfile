FROM denoland/deno:latest as base
WORKDIR /app
EXPOSE 8000
COPY src /app

RUN deno cache main.ts
CMD ["run", "--allow-net", "--allow-env", "main.ts"]