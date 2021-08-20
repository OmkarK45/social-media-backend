import { NodeType, User } from '@prisma/client'

import { builder } from '~/graphql/builder'
import { EditProfileInput } from '~/graphql/input'
import { prisma } from '~/lib/db'
import { getConnection, getPrismaPaginationArgs } from '~/lib/page'

export const UserObject = builder.objectRef<User>('User')

builder.node(UserObject, {
	isTypeOf: (value) =>
		(value as { nodeType?: NodeType }).nodeType === NodeType.User,
	id: { resolve: (user) => user.id },
	fields: (t) => ({
		bio: t.exposeString('bio', { nullable: true }),
		email: t.exposeString('email'),
		avatar: t.exposeString('avatar', { nullable: true }),
		username: t.exposeString('username'),
		lastName: t.exposeString('lastName', { nullable: true }),
		firstName: t.exposeString('firstName'),
		createdAt: t.expose('createdAt', { type: 'DateTime' }),
		updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
		followers: t.connection({
			type: UserObject,
			authScopes: {
				user: true,
			},
			resolve: async (_, args, { user }) => {
				const followers = await prisma.user
					.findUnique({
						where: { email: user!.email },
						select: { hashedPassword: false },
					})
					.followers({
						...getPrismaPaginationArgs(args),
					})

				return getConnection({ args, nodes: followers })
			},
		}),
		following: t.connection({
			type: UserObject,
			authScopes: { user: true },
			resolve: async (_, args, { user }) => {
				const following = await prisma.user
					.findUnique({
						where: { email: user!.email },
						select: { hashedPassword: false },
					})
					.following({
						...getPrismaPaginationArgs(args),
					})

				return getConnection({ args, nodes: following })
			},
		}),
	}),
})

builder.queryField('me', (t) =>
	t.field({
		type: UserObject,
		authScopes: { user: true },
		resolve: async (_, _args, { user }) => {
			return await prisma.user.findUnique({
				where: { email: user?.email },
				rejectOnNotFound: true,
			})
		},
	})
)

builder.mutationField('editProfile', (t) =>
	t.field({
		type: UserObject,
		args: { input: t.arg({ type: EditProfileInput }) },
		authScopes: {
			user: true,
			unauthenticated: false,
		},
		resolve: async (_parent, { input }, { user }) => {
			const updatedUser = await prisma.user.update({
				where: { email: user!.email },
				data: {
					username: input.username,
					bio: input.bio,
					lastName: input.lastName,
					firstName: input.firstName,
					avatar: input.avatar,
				},
			})
			return updatedUser
		},
	})
)
