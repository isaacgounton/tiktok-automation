FROM node:20-alpine

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
RUN npm install --production

# Copy application files with explicit ownership
COPY --chown=appuser:appgroup . .

# Set environment to production
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
