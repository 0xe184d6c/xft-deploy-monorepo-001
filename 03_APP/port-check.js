// Simple script to verify port availability
const net = require('net');

// Function to check if a port is in use
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
      .once('error', err => {
        if (err.code === 'EADDRINUSE') {
          // Port is in use
          resolve(true);
        } else {
          // Other error occurred
          console.error('Error checking port:', err);
          resolve(false);
        }
      })
      .once('listening', () => {
        // Port is free, close server and resolve
        server.close(() => {
          resolve(false);
        });
      })
      .listen(port, '0.0.0.0');
  });
}

// Check if port 5000 is available
async function checkPort() {
  const port = 5000;
  const inUse = await isPortInUse(port);
  
  if (inUse) {
    console.log(`Port ${port} is in use - this is good for our workflow!`);
    console.log('Server should be running properly.');
  } else {
    console.log(`Port ${port} is free - our server isn't binding properly.`);
  }
}

// Run the check
checkPort();