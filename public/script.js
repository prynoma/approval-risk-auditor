document.addEventListener('DOMContentLoaded', () => {
    const walletAddressInput = document.getElementById('walletAddress');
    const chainIdSelect = document.getElementById('chainId');
    const scanButton = document.getElementById('scanButton');
    const resultsDiv = document.getElementById('results');

    const AGENT_BASE_URL = 'https://approval-risk-agent.up.railway.app/'; // Replace with your deployed agent URL if not running locally
    const AGENT_ENDPOINT_PATH = '/entrypoints/check/invoke';

    scanButton.addEventListener('click', async () => {
        const walletAddress = walletAddressInput.value.trim();
        const chainId = chainIdSelect.value;

        if (!walletAddress) {
            resultsDiv.innerHTML = '<p class="error">Please enter a wallet address.</p>';
            return;
        }

        resultsDiv.innerHTML = '<p>Scanning... Please wait.</p>';

        try {
            const response = await fetch(`${AGENT_BASE_URL}${AGENT_ENDPOINT_PATH}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    input: {
                        wallet_address: walletAddress,
                        chain_id: chainId,
                    },
                }),
            });

            const data = await response.json();

            if (response.ok) {
                resultsDiv.innerHTML = `<pre>${JSON.stringify(data.output.risky_approvals, null, 2)}</pre>`;
            } else {
                resultsDiv.innerHTML = `<p class="error">Error: ${data.error || 'Unknown error'}</p>`;
            }
        } catch (error) {
            resultsDiv.innerHTML = `<p class="error">Failed to connect to agent: ${error.message}</p>`;
            console.error('Error calling agent:', error);
        }
    });
});
