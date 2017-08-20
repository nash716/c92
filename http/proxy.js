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
		res.writeHead(pRes.statusCode, pRes.headers)
		pRes.pipe(res)
	})

	req.pipe(pReq)
}).listen(8081)

