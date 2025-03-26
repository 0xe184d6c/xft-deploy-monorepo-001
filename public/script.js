document.addEventListener('DOMContentLoaded', () => {
  console.log('ABI to OpenAPI Converter loaded');

  const abiInput = document.getElementById('abiInput');
  const convertButton = document.getElementById('convertButton');
  const resultOutput = document.getElementById('resultOutput');
  const copyButton = document.getElementById('copyButton');
  const downloadButton = document.getElementById('downloadButton');

  downloadButton.disabled = true;
  copyButton.disabled = true;

  convertButton.addEventListener('click', async () => {
    try {
      const abiJsonText = abiInput.value.trim();
      if (!abiJsonText) {
        resultOutput.textContent = 'Please enter an ABI JSON';
        resultOutput.classList.remove('d-none');
        return;
      }

      let abiJson;
      try {
        abiJson = JSON.parse(abiJsonText);
      } catch (e) {
        resultOutput.textContent = 'Invalid JSON: ' + e.message;
        resultOutput.classList.remove('d-none');
        return;
      }

      convertButton.disabled = true;
      resultOutput.textContent = 'Converting...';
      resultOutput.classList.remove('d-none');

      const contractName = document.getElementById('contractName').value.trim() || 'SmartContract';

      const response = await fetch('/api/generateSpec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abi: abiJson, contractName })
      });

      if (!response.ok) throw new Error(`Server error: ${response.status} ${response.statusText}`);

      const openApiSpec = await response.json();
      const specString = JSON.stringify(openApiSpec, null, 2);
      resultOutput.textContent = specString;

      downloadButton.disabled = false;
      copyButton.disabled = false;

      const endpointsList = document.getElementById('endpointsList');
      endpointsList.innerHTML = '';
      endpointsList.classList.remove('d-none');

      const ul = document.createElement('ul');
      Object.entries(openApiSpec.paths).forEach(([path, methods]) => {
        Object.entries(methods).forEach(([method]) => {
          const li = document.createElement('li');
          const code = document.createElement('code');
          code.textContent = `${method.toUpperCase()} ${path}`;
          li.appendChild(code);
          ul.appendChild(li);
        });
      });
      endpointsList.appendChild(ul);
    } catch (error) {
      resultOutput.textContent = 'Error: ' + error.message;
    } finally {
      convertButton.disabled = false;
    }
  });

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

  downloadButton.addEventListener('click', () => {
    const blob = new Blob([resultOutput.textContent], { type: 'application/json' });
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