const http = require('http')
const url = require('url')

const server = http.createServer((req, res) => {
	const parsedUrl = url.parse(req.url)

	const pReq = http.request({
		method: req.method,
		host: parsedUrl.hostname,
		port: parsedUrl.port || 80,
		path: parsedUrl.path,
		header: req.headers
	}, pRes => {
		res.writeHead(pRes.statusCode, pRes.headers)
		
		pRes.on('data', chunk => {
			res.write(chunk)
		})

		pRes.on('end', () => {
			res.end()
		})

		pRes.on('error', err => {
			console.log(err)
		})
	})

	req.on('data', chunk => {
		pReq.write(chunk)
	})

	req.on('end', () => {
		pReq.end()
	})

	req.on('error', err => {
		console.log(err)
	})
}).listen(8081)

