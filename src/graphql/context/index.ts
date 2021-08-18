import { Request, Response } from 'express'
import { User, Session, PrismaClient } from '@prisma/client'
import { ExpressContext } from 'apollo-server-express'

import { prisma } from '~/lib/db'
import { decryptToken } from '~/lib/jwt'
import Loader from '../loader'

export interface Context {
	req: Request
	res: Response
	user?: User
	session?: Session
	// TODO : remove prisma from here
	loader: typeof Loader
}

export type JwtPayload = {
	userId: string
	email: string
	sessionId: string
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
	const token = req.cookies['session']
	if (!token) {
		ctx.user = undefined
		ctx.session = undefined
	} else {
		const { sessionId, userId } = decryptToken<JwtPayload>(token)

		const session = await prisma.session.findFirst({
			where: {
				id: sessionId,
				userId: userId,
			},
			include: {
				user: true,
			},
		})

		if (session) {
			ctx.user = session.user
			ctx.session = session
		}
	}
	return ctx
}
