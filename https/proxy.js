const http = require('http')
const https = require('https')
const fs = require('fs')
const url = require('url')
const net = require('net')
const tls = require('tls')
const pem = require('pem')

const ConnectionEstablishedMsg = 
      new Buffer('HTTP/1.1 200 Connection Established\r\n\r\n')
const cache = { }

// オレオレ認証局の秘密鍵と証明書を指定。パスは適宜変更のこと。
const key = fs.readFileSync('../keys/fake-ca.key.pem')
const cert = fs.readFileSync('../keys/fake-ca.crt.pem')

const httpsServer = https.createServer({
	SNICallback: (serverName, cb) => {
		// 通信したいリモートサーバの証明書を作ってブラウザに返す。
		// このとき、先程作った認証局の証明書を信頼していないとブラウザで警告が出る
		if (cache[serverName]) {
			cb(null, cache[serverName])

			return
		}

		pem.createCertificate({
			country: 'JP',
			state: 'Tokyo',
			locality: 'Shibuya',
			organization: 'preflight.cc',
			commonName: serverName,
			altNames: [ serverName ],
			serviceKey: key,
			serviceCertificate: cert,
			serial: Date.now(),
			days: 300
		}, (err, generated) => {
			if (err) {
				cb(err)

				return
			}

			const ctx = tls.createSecureContext({
				key: generated.clientKey,
				cert: generated.certificate
			})

			cache[serverName] = ctx

			cb(null, ctx)
		})
	}
}, (req, res) => {
	// HTTP サーバから転送されてきたデータを処理するハンドラ
	// ここでは証明書まわりをクリアしているので、ヘッダやボディの中身がわかる
	// ここからは HTTP のときとほぼ同じ流れ
	const fullUrl = `https://${req.headers.host}${req.url}`

	const parsedUrl = url.parse(fullUrl)

	// **https** の request を呼ぶのを忘れずに
	const pReq = https.request({
		method: req.method,
		host: parsedUrl.hostname,
		port: parsedUrl.port || 443,
		path: parsedUrl.path,
		headers: req.headers
	}, pRes => {
		res.writeHead(pRes.statusCode, pRes.headers)
		pRes.pipe(res)
	})

	req.pipe(pReq)
})

httpsServer.listen()

const server = http.createServer((req, res) => {
	const parsedUrl = url.parse(req.url)

	const pReq = http.request({
		method: req.method,
		host: parsedUrl.hostname,
		port: parsedUrl.port || 80,
		path: parsedUrl.path,
		headers: req.headers
	}, (pRes) => {
		res.writeHead(pRes.statusCode, pRes.headers)
		pRes.pipe(res)
	})

	req.pipe(pReq)
})

server.on('connect', (req, sock, head) => {
	const addr = httpsServer.address()

	// CONNECT メソッドで接続が来たら、まず "Connection Established" を返し、
	// その後の暗号化されたデータをまるごとローカルに立てた HTTPS サーバに転送
	const pSock = net.connect(addr.port, addr.address, () => {
		sock.write(ConnectionEstablishedMsg)
		pSock.write(head)

		sock.pipe(pSock)
		pSock.pipe(sock)
	})
})

server.listen(8081)

