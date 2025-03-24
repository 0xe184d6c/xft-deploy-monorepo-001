const axios = require('axios');

const newToken = {
  name: "My Token",
  symbol: "MTK",
  decimals: 18,
  totalSupply: "1000000000000000000000000"
};

axios.post('http://localhost:5000/tokens', newToken)
  .then(response => {
    console.log('Token created successfully:');
    console.log(response.data);
  })
  .catch(error => {
    console.error('Error creating token:', error.message);
  });