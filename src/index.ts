import dotEnv from 'dotenv'
import express, { urlencoded } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { graphqlUploadExpress } from 'graphql-upload'
import { graphiqlMiddleware } from 'graphiql-middleware'
import { ironSession, Session } from 'next-iron-session'

import { config } from './lib/config'
import { apolloServer } from './app'
import { sessionOption } from './lib/session'

dotEnv.config({
	path: '../.env',
})
const app = express()

app.use(ironSession(sessionOption))
app.use(
	'/graphiql',
	graphiqlMiddleware(
		{
			endpointURL: '/graphql',
		},
		{
			headerEditorEnabled: true,
			shouldPersistHeaders: true,
		}
	)
)
app.use(cookieParser())
app.use(express.json())
app.use(urlencoded({ extended: true }))
app.use(
	cors({
		origin: function (origin, callback) {
			return callback(null, true)
		},
		credentials: true,
		optionsSuccessStatus: 200,
	})
)
app.use(graphqlUploadExpress({ maxFiles: 5, maxFileSize: 100000000 }))
app.get('/', (_, res) => res.json({ msg: 'Health OK. API is UP' }))

async function start(port: number): Promise<void> {
	const server = await apolloServer()
	await server.start()

	server.applyMiddleware({
		app,
		path: '/graphql',
		cors: {
			origin: function (origin, callback) {
				return callback(null, true)
			},
			credentials: true,
		},
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
