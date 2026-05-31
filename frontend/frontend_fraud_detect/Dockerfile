FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with npm install (more reliable than ci for dev environments)
RUN npm install

# Copy source code
COPY . .

# Expose Vite development server port
EXPOSE 5173

# Start Vite dev server with 0.0.0.0 binding for external access
CMD ["npm", "run", "dev"]
