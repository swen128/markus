FROM node:24-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    ca-certificates \
    ripgrep \
    iptables \
    ipset \
    iproute2 \
    dnsutils \
    aggregate \
    jq \
    sudo \
    unzip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /tmp
ENV BUN_INSTALL="/usr/local/share/bun"
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/usr/local/share/bun/bin:$PATH"

RUN npm install -g @anthropic-ai/claude-code@latest
RUN bun add -g @tobilu/qmd

COPY scripts/init-firewall.sh /usr/local/bin/init-firewall.sh
RUN chmod +x /usr/local/bin/init-firewall.sh && \
    echo "node ALL=(root) NOPASSWD: /usr/local/bin/init-firewall.sh" > /etc/sudoers.d/node-firewall && \
    chmod 0440 /etc/sudoers.d/node-firewall

RUN mkdir -p /home/node/.claude && chown -R node:node /home/node/.claude
ENV CLAUDE_CONFIG_DIR=/home/node/.claude

WORKDIR /workspace
COPY . /plugin
RUN cd /plugin && bun install --frozen-lockfile && chown -R node:node /plugin /workspace /usr/local/share/bun

USER node
RUN mkdir -p /tmp/qmd-warmup && \
    echo "warmup" > /tmp/qmd-warmup/doc.md && \
    qmd collection add /tmp/qmd-warmup --name warmup --mask doc.md && \
    qmd update && \
    qmd embed && \
    qmd collection remove warmup && \
    rm -rf /tmp/qmd-warmup

VOLUME /home/node/.claude
VOLUME /workspace

ENTRYPOINT ["sh", "-c", "sudo init-firewall.sh && exec claude --dangerously-skip-permissions --agent markus --plugin-dir /plugin --dangerously-load-development-channels plugin:markus@inline"]
