const http = require('http')
const url = require('url')

const server = http.createServer((req, res) => {
	const parsedUrl = url.parse(req.url)
	const headers = { }

	// Accept-Encoding ヘッダを削除する
	for (const key in req.headers) {
		if (key.toLowerCase() !== 'accept-encoding') {
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
		const data = [ ]
		
		// レスポンスボディをためていく
		pRes.on('data', chunk => {
			data.push(chunk)
		})

		pRes.on('end', () => {
			// 一つの Buffer にレスポンスボディをまとめる
			const responseBody = Buffer.concat(data)

			let textFlag = false

			// このレスポンスが text/html であるかチェック
			for (const key in pRes.headers) {
				if (key.toLowerCase() === 'content-type' &&
				    pRes.headers[key].startsWith('text/html')) {

					textFlag = true

					break
				}
			}

			let finalBody

			// text/html なら、white をすべて black に改変
			if (textFlag) {
				finalBody = new Buffer(
				                responseBody.toString('utf-8')
				                            .replace(/white/g, 'black'),
				                'utf-8')
			} else {
				finalBody = responseBody
			}

			const headers = { }

			// Content-Length の再計算
			for (const key in pRes.headers) {
				if (key.toLowerCase() === 'content-length') {
					headers[key] = finalBody.length
				} else {
					headers[key] = pRes.headers[key]
				}
			}

			res.writeHead(pRes.statusCode, headers)

			res.end(finalBody)
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

