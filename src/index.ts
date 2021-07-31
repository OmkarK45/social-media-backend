import dotEnv from 'dotEnv'
import express, { urlencoded } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { graphqlUploadExpress } from 'graphql-upload'

import { config } from './lib/config'
import { apolloServer } from './app'

dotEnv.config({
	path: '../.env',
})

const app = express()

app.use(cookieParser())
app.use(express.json())
app.use(urlencoded({ extended: true }))
app.use(cors({ origin: 'http://localhost:3000', credentials: true }))
app.use(graphqlUploadExpress({ maxFiles: 5, maxFileSize: 100000000 }))
app.get('/health', (_, res) => res.json({ msg: 'Health OK. API is UP' }))

async function start(port: number): Promise<void> {
	const server = await apolloServer()
	await server.start()

	server.applyMiddleware({
		app,
		path: '/graphql',
		cors: true,
	})

	return new Promise<void>((resolve) => {
		app.listen(port, async () => {
			console.log(`
			################################################
			⭐  NodeJS Environment : ${config.app_env} ⭐
			🛡️  Server listening on port: ${config.port} 🛡️
			################################################`)
			resolve()
		})
	})
}

start(config.port)
