FROM node:18-bullseye-slim

# Install Python 3 and pip
RUN apt-get update && apt-get install -y python3 python3-pip && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package.json and install Node dependencies
COPY package*.json ./
RUN npm install --production

# Copy requirements.txt and install Python dependencies
COPY requirements.txt ./
# By default some systems use externally managed environments. We bypass this to install globally in our docker container
RUN pip3 install --no-cache-dir --break-system-packages -r requirements.txt || pip3 install --no-cache-dir -r requirements.txt

# Copy the rest of the backend files
COPY . .

# Start the application
EXPOSE 3000
CMD ["npm", "start"]
