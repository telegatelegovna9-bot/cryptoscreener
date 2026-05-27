# Simplest possible Dockerfile for Next.js on Railway
FROM node:22-slim

WORKDIR /app

# Copy web app
COPY apps/web/package.json ./
COPY apps/web ./

# Install dependencies
RUN npm install 2>&1

# Build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build 2>&1

# Expose port
EXPOSE 3000

# Start
CMD ["npm", "start"]
