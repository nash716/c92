const http = require('http')
const url = require('url')

http.createServer((req, res) => {
	const parsedUrl = url.parse(req.url)

	const headers = { }

	for (const key in req.headers) {
		if (key.toLowerCase() === 'user-agent') {
			headers[key] = 'Mozilla/5.0 (Linux; Android 7.1.1; ' +
			               'SOV35 Build/41.2.C.0.162) AppleWebKit/537.36 ' +
			               '(KHTML, like Gecko) Chrome/55.0.2883.91 ' +
			               'Mobile Safari/537.36'
		} else {
			headers[key] = req.headers[key]
		}
	}

	const pReq = http.request({
		method: req.method,
		host: parsedUrl.hostname,
		port: parsedUrl.port || 80,
		path: parsedUrl.path,
		headers: headers
	}, pRes => {
		res.writeHead(pRes.statusCode, pRes.headers)
		pRes.pipe(res)
	})

	req.pipe(pReq)
}).listen(8081)

