import { Session, User } from '@prisma/client'
import { Request, Response } from 'express'
import { IncomingMessage } from 'http'
import { applySession, SessionOptions } from 'next-iron-session'
import { prisma } from './db'

const NEXT_IRON_SESSION_ID_KEY = 'sessionID'
export const NEXT_IRON_SESSION_COOKIENAME = 'session.cookie'

export const sessionOption: SessionOptions = {
	cookieName: NEXT_IRON_SESSION_COOKIENAME,
	cookieOptions: {
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		httpOnly: true,
	},
	password: [
		{
			id: 1,
			password: process.env.NEXT_IRON_SESSION_PASSWORD as string,
		},
	],
}

interface RequestSession extends IncomingMessage {
	session: import('next-iron-session').Session
}

interface PrismaSession extends Session {
	user: User
}

export const createSession = async (req: IncomingMessage, user: User) => {
	const session = await prisma.session.create({
		data: {
			userId: user.id,
			expiresAt: new Date(),
		},
	})

	const requestSession = req as unknown as RequestSession

	requestSession.session.set(NEXT_IRON_SESSION_ID_KEY, session.id)
	await requestSession.session.save()

	return session
}

export const removeSession = async (req: IncomingMessage, session: Session) => {
	const requestSession = req as unknown as RequestSession

	requestSession.session.destroy()

	await prisma.session.delete({ where: { id: session!.id } })
}

export const connectSession = async ({
	req,
	res,
}: Pick<{ req: Request; res?: Response }, 'req' | 'res'>) => {
	await applySession(req, res, sessionOption)

	let session: PrismaSession | null = null

	const requestSession = req as unknown as RequestSession
	const sessionID = requestSession.session.get(NEXT_IRON_SESSION_ID_KEY)

	if (sessionID) {
		session = await prisma.session.findUnique({
			where: { id: sessionID },
			include: { user: true },
		})
	}

	return session
}
