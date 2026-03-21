# Docker Image

Verify the Docker image builds correctly and has all dependencies cached.


## Steps

```bash
docker build -t markus-test .
docker run --rm --entrypoint bash markus-test -c 'bunx --version'
docker run --rm --entrypoint sh markus-test -c 'mkdir -p /tmp/pd && cp /plugin/package.json /plugin/bun.lock /tmp/pd/ && cd /tmp/pd && bun install --frozen-lockfile'
docker run --rm --entrypoint bash markus-test -c 'ls ~/.cache/qmd/models/'
```

## Pass

- `bunx --version` prints a version number (no "Permission denied")
- `bun install --frozen-lockfile` exits 0 (no "AccessDenied")
- `~/.cache/qmd/models/` contains 3 `.gguf` files (embedding, reranker, generation)

## Fail

- `bunx` permission denied or not found
- `bun install` AccessDenied error
- Only 1 model file cached (missing reranker and generation models)
