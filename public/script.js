/**
 * JavaScript for ABI to OpenAPI Converter
 * Handles sending the ABI to the server and displaying the result
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('ABI to OpenAPI Converter loaded');
  
  const abiInput = document.getElementById('abiInput');
  const convertButton = document.getElementById('convertButton');
  const resultOutput = document.getElementById('resultOutput');
  const copyButton = document.getElementById('copyButton');
  const downloadButton = document.getElementById('downloadButton');
  
  downloadButton.disabled = true;
  copyButton.disabled = true;
  
  // Convert button click handler
  convertButton.addEventListener('click', async () => {
    try {
      // Get the ABI JSON text
      const abiJsonText = abiInput.value.trim();
      if (!abiJsonText) {
        resultOutput.textContent = 'Please enter an ABI JSON';
        return;
      }
      
      // Parse the ABI to validate it's proper JSON
      let abiJson;
      try {
        abiJson = JSON.parse(abiJsonText);
      } catch (e) {
        resultOutput.textContent = 'Invalid JSON: ' + e.message;
        return;
      }
      
      // Update UI to show loading
      convertButton.disabled = true;
      resultOutput.textContent = 'Converting...';
      
      // Send the ABI to the server
      const response = await fetch('/api/generateSpec', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: abiJsonText
      });
      
      // Handle the response
      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
      
      // Get the OpenAPI spec
      const openApiSpec = await response.json();
      
      const specString = JSON.stringify(openApiSpec, null, 2);
      resultOutput.textContent = specString;

      // Enable buttons after successful conversion
      downloadButton.disabled = false;
      copyButton.disabled = false;
    } catch (error) {
      resultOutput.textContent = 'Error: ' + error.message;
    } finally {
      convertButton.disabled = false;
    }
  });
  
  // Copy button click handler
  copyButton.addEventListener('click', () => {
    const textToCopy = resultOutput.textContent;
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        const originalText = copyButton.textContent;
        copyButton.textContent = 'Copied!';
        setTimeout(() => {
          copyButton.textContent = originalText;
        }, 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  });

  // Download button handler
  downloadButton.addEventListener('click', () => {
    const blob = new Blob([resultOutput.textContent], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'openapi-spec.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
});
