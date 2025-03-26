
/**
 * Events Parser module
 * Extracts and formats event definitions from Ethereum ABI
 */

function parseEvents(abiJson) {
  if (!Array.isArray(abiJson)) {
    if (Array.isArray(abiJson.abi)) {
      abiJson = abiJson.abi;
    } else {
      throw new Error('Invalid ABI format');
    }
  }

  return abiJson
    .filter(item => item.type === 'event')
    .map(event => {
      const params = event.inputs
        .map(input => {
          const indexed = input.indexed ? 'indexed ' : '';
          return `${input.name} ${indexed}${input.type}`;
        })
        .join(', ');
      
      return `${event.name}(${params})`;
    });
}

module.exports = { parseEvents };
