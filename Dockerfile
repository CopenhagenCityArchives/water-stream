# This dockerfile builds the image used for running development environments.
FROM node:14.16

# Dependencies needed for and the node-canvas to install correctly
RUN apt-get update && apt-get install -y \
    libcairo2-dev \
    libpango1.0-dev \
    libgif-dev \
    build-essential \
    g++ \
&& rm -rf /var/lib/apt/lists/* # Keeps the image size down

# Build node_modules for kbh-billeder
WORKDIR /home/node/water-stream
COPY . .
RUN npm install --progress=false

CMD [ "node", "test/memory.js" ]
