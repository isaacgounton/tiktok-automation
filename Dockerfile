FROM node:20.11.1-slim-bullseye@sha256:5f25104f37a9dc69714b3311f8c97683fe26aa800f05fb0f28c64af82bd2345c

# Add non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set working directory and change ownership
WORKDIR /app
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Copy package files with explicit ownership
COPY --chown=appuser:appgroup package*.json ./

# Install dependencies
RUN npm ci --production

# Copy application files with explicit ownership
COPY --chown=appuser:appgroup . .

# Set environment to production
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
CMD ["node", "server.js"]
