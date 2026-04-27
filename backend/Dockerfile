FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy prisma schema for generation
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source
COPY . .

# Expose port
EXPOSE 5000

# Start application
CMD ["npm", "run", "dev"]

