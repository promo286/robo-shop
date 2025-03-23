FROM node:14

# Enable Instana Auto Profiling
ENV INSTANA_AUTO_PROFILE true

# Set working directory
WORKDIR /opt/server

# Copy package.json and install dependencies first to leverage Docker caching
COPY package.json /opt/server/
RUN npm install

# Copy application files
COPY server.js /opt/server/

# Expose the correct port used in the application
EXPOSE 8091

# Start the application
CMD ["node", "server.js"]

