import fetch from 'node-fetch';

async function testServer() {
    try {
        const response = await fetch('http://localhost:3002/api/save-configuration', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                test: true
            })
        });
        
        if (response.ok) {
            console.log('Server is running and responding correctly');
            const data = await response.json();
            console.log('Response:', data);
        } else {
            console.error('Server responded with error:', response.status);
        }
    } catch (error) {
        console.error('Failed to connect to server:', error.message);
    }
}

testServer(); 