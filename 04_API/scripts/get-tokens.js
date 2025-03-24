const axios = require('axios');

axios.get('http://localhost:5000/tokens')
  .then(response => {
    console.log('All tokens:');
    console.log(JSON.stringify(response.data, null, 2));
  })
  .catch(error => {
    console.error('Error fetching tokens:', error.message);
  });