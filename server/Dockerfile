FROM node:20-alpine

WORKDIR /app

# Copy dependency definition
COPY package*.json ./

# Install dependencies for production
RUN npm ci --only=production

# Copy all server files
COPY . .

# Set default environment variables
ENV NODE_ENV=production
ENV PORT=5001

EXPOSE 5001

CMD ["node", "index.js"]
