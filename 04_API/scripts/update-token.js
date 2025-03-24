const axios = require('axios');

// Token ID to update
const tokenId = 1;

// Updated token data
const updatedToken = {
  totalSupply: "2000000000000000000000000"
};

axios.put(`http://localhost:5000/tokens/${tokenId}`, updatedToken)
  .then(response => {
    console.log('Token updated successfully:');
    console.log(response.data);
  })
  .catch(error => {
    console.error('Error updating token:', error.message);
  });