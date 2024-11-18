# Use Node.js base image
FROM node:16

# Set working directory
WORKDIR /src/index

# Copy package.json and install dependencies
COPY package.json .
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose the port your app listens on
EXPOSE 3000

# Command to run the application
CMD ["npm", "run", "dev"]
