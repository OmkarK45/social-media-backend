import { Session } from '@prisma/client'

import { builder } from '~/graphql/builder'
import { JwtPayload } from '~/graphql/context'
import { UserObject } from '../user/UserResolver'
import { ChangePasswordInput, SignInInput, SignUpInput } from '~/graphql/input'

import { login } from '~/lib/auth'
import { createToken } from '~/lib/jwt'
import { hashPassword, isValidPassword, verifyPassword } from '~/lib/password'

import { ResultResponse } from '../ResultResponse'
import { prisma } from '~/lib/db'

export const SessionObject = builder.objectRef<Session>('Session')

SessionObject.implement({
	fields: (t) => ({
		id: t.exposeID('id'),
		userId: t.exposeID('userId'),
		createdAt: t.expose('createdAt', { type: 'DateTime' }),
		updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
	}),
})

const AuthResponseObject = builder.simpleObject('AuthResponse', {
	fields: (t) => ({
		success: t.boolean(),
		user: t.field({
			type: UserObject,
		}),
	}),
})

builder.mutationField('signUp', (t) =>
	t.field({
		type: AuthResponseObject,
		args: { input: t.arg({ type: SignUpInput, required: true }) },
		resolve: async (_, { input }, { res }) => {
			const existingUser = await prisma.user.findFirst({
				where: {
					OR: [{ email: input.email }, { username: input.username }],
				},
			})

			if (existingUser)
				throw new Error(
					'Given email address is already registered. Please log in instead.'
				)

			const newUser = await prisma.user.create({
				data: {
					username: input.username,
					email: input.email,
					firstName: input.firstName,
					lastName: input.lastName,
					hashedPassword: await hashPassword(input.password),
				},
			})

			const session = await prisma.session.create({
				data: {
					userId: newUser.id,
				},
			})

			const payload: JwtPayload = {
				email: input.email,
				sessionId: session.id,
				userId: newUser.id,
			}

			const token = createToken(payload)

			res.cookie('session', token, {
				httpOnly: true,
			})

			return { success: true, user: newUser }
		},
	})
)

builder.mutationField('signIn', (t) =>
	t.field({
		type: AuthResponseObject,
		args: {
			input: t.arg({ type: SignInInput, required: true }),
		},
		resolve: async (_, { input }, { res }) => {
			const user = await login(input.email, input.password)
			const session = await prisma.session.create({
				data: {
					userId: user.id,
				},
			})

			const payload: JwtPayload = {
				email: input.email,
				sessionId: session.id,
				userId: user.id,
			}

			const token = createToken(payload)

			res.cookie('session', token, {
				httpOnly: true,
			})

			return {
				success: true,
				user,
			}
		},
	})
)

builder.mutationField('logout', (t) =>
	t.field({
		type: ResultResponse,
		authScopes: {
			user: true,
		},
		resolve: async (_, _args, { res, session }) => {
			await prisma.session.delete({ where: { id: session!.id } })
			res.clearCookie('session')
			return {
				success: true,
			}
		},
	})
)

builder.mutationField('changePassword', (t) =>
	t.field({
		type: ResultResponse,
		args: {
			input: t.arg({ type: ChangePasswordInput, required: true }),
		},
		authScopes: { unauthenticated: false, user: true },
		resolve: async (_, { input }, { res, user, session }) => {
			const isValid = await verifyPassword(
				user!.hashedPassword,
				input.oldPassword
			)

			if (!isValidPassword(isValid)) {
				throw new Error('The old password provided is incorrect.')
			}

			await prisma.user.update({
				where: { email: user!.email },
				data: {
					hashedPassword: await hashPassword(input.newPassword),
					sessions: {
						deleteMany: { id: { not: session!.id } },
					},
				},
			})
			return {
				success: true,
			}
		},
	})
)
