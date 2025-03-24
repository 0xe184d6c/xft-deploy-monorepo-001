const axios = require('axios');

// Token ID to delete
const tokenId = 1;

axios.delete(`http://localhost:5000/tokens/${tokenId}`)
  .then(response => {
    console.log('Token deleted successfully:');
    console.log(response.data);
  })
  .catch(error => {
    console.error('Error deleting token:', error.message);
  });