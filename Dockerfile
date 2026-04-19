FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Run database migrations
RUN pnpm run db:migrate

# Expose port
EXPOSE 8000

# Start the application
CMD ["pnpm", "start"]