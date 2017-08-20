const http = require('http')
const url = require('url')

const server = http.createServer((req, res) => {
	const data = [ ]

	req.on('data', chunk => {
		data.push(chunk)
	})

	req.on('end', () => {
		const requestBody = Buffer.concat(data)
		const headers = { }

		const finalBody = new Buffer(
		                      requestBody.toString('utf-8')
		                                 .replace(/&?time=[^&]*/, 'time=hoge'),
		                      'utf-8')

		for (let key in req.headers) {
			if (key.toLowerCase() === 'content-length') {
				headers[key] = finalBody.length
			} else {
				headers[key] = req.headers[key]
			}
		}

		const parsedUrl = url.parse(req.url)

		const pReq = http.request({
			method: req.method,
			host: parsedUrl.hostname,
			port: parsedUrl.port || 80,
			path: parsedUrl.path,
			headers: headers
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

		pReq.end(finalBody)
	})

	req.on('error', err => {
		console.log(err)
	})
}).listen(8081)

