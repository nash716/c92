const http = require('http')
const url = require('url')

http.createServer((req, res) => {
	const parsedUrl = url.parse(req.url)

	const pReq = http.request({
		method: req.method,
		host: parsedUrl.hostname,
		port: parsedUrl.port || 80,
		path: parsedUrl.path,
		headers: req.headers
	}, pRes => {
		
	})

	res.end('Hello, World!')
}).listen(8081)

