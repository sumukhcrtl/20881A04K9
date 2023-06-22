const http = require('http');

const server = http.createServer((req, res) => {
  if (req.url === '/numbers' && req.method === 'GET') {
    const urls = [
      'http://104.211.219.98/numbers/rand'
    ];

    const fetchPromises = urls.map((url) =>
      new Promise((resolve, reject) => {
        const options = {
          method: 'GET',
          timeout: 500,
        };

        const req = http.request(url, options, (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            try {
              const numbers = JSON.parse(data).numbers;
              resolve(numbers);
            } catch (error) {
              reject(new Error('Invalid JSON response'));
            }
          });
        });

        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });

        req.on('error', (error) => {
          reject(error);
        });

        req.end();
      })
    );

    Promise.allSettled(fetchPromises)
      .then((results) => {
        const validResponses = results
          .filter((result) => result.status === 'fulfilled')
          .map((result) => result.value)
          .flat();

        const uniqueNumbers = [...new Set(validResponses)];
        const sortedNumbers = uniqueNumbers.sort((a, b) => a - b);

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ numbers: sortedNumbers }));
      })
      .catch((error) => {
        console.error('Error occurred:', error.message);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Internal server error' }));
      });
  } else {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const port = 5000;
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
