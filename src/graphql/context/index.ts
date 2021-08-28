import { Request, Response } from 'express'
import { User, Session, PrismaClient } from '@prisma/client'
import { ExpressContext } from 'apollo-server-express'

import Loader from '../loader'
import { connectSession } from '~/lib/session'

export interface Context {
	req: Request
	res: Response
	user?: User
	session?: Session
	loader: typeof Loader
}

export async function makeGraphQLContext({
	req,
	res,
}: ExpressContext): Promise<Context> {
	let ctx: Context = {
		req,
		res,
		loader: Loader,
	}
	const session = await connectSession({ req, res })
	console.log(session)
	if (session) {
		ctx.user = session.user
		ctx.session = session
	}

	return ctx
}
