FROM mcr.microsoft.com/devcontainers/typescript-node:1-20-bullseye

# Run as root to install global dependencies
USER root

# Enable Corepack
RUN corepack enable

# Switch back to the default non-root user
USER node

# Install global dependencies or perform other setup steps here