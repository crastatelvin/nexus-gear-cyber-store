FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Install dependencies (production only)
COPY package*.json ./
RUN npm ci --only=production

# Copy application source
COPY . .

# Expose the application port
EXPOSE 3000

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV JWT_SECRET=super_secret_cyber_nexus_key_2026

# Start the Node.js application server
CMD [ "node", "server.js" ]
