import { User } from '@prisma/client'

import { builder } from '~/graphql/builder'
import { EditProfileInput } from '~/graphql/input'
import { connectionForPrisma, resolveConnection } from '~/lib/cursor'
import { prisma } from '~/lib/db'

export const UserObject = builder.objectRef<User>('User')

const FollowerResponse = builder.simpleObject('FollowerResponse', {
	fields: (t) => ({
		users: t.field({
			type: [UserObject],
		}),
		totalFollowers: t.int(),
		totalPages: t.int(),
	}),
})

const FollowingResponse = builder.simpleObject('FollowingResponse', {
	fields: (t) => ({
		users: t.field({
			type: [UserObject],
		}),
		totalFollowing: t.int(),
		totalPages: t.int(),
	}),
})

UserObject.implement({
	fields: (t) => ({
		id: t.exposeID('id'),
		bio: t.exposeString('bio', { nullable: true }),
		email: t.exposeString('email'),
		avatar: t.exposeString('avatar', { nullable: true }),
		username: t.exposeString('username'),
		lastName: t.exposeString('lastName', { nullable: true }),
		firstName: t.exposeString('firstName'),
		createdAt: t.expose('createdAt', { type: 'DateTime' }),
		updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
		followers: t.field({
			type: FollowerResponse,
			authScopes: {
				user: true,
			},

			args: {
				first: t.arg.int({ required: false }),
				before: t.arg.string({ required: false }),
				after: t.arg.string({ required: false }),
				last: t.arg.int({ required: false }),
			},

			resolve: async (_, args, { user }) => {
				const followers = await prisma.user
					.findUnique({
						where: { email: user!.email },
						select: { hashedPassword: false },
					})
					.followers({
						...connectionForPrisma(args, 'createdAt'),
					})

				const totalFollowers = await prisma.user.count({
					where: {
						following: {
							some: {
								username: user!.username,
							},
						},
					},
				})

				return {
					users: followers,
					totalFollowers,
					totalPages: Math.ceil(totalFollowers / 10),
				}
			},
		}),
		following: t.field({
			type: FollowingResponse,
			authScopes: { user: true },
			args: {
				first: t.arg.int({ required: false }),
				before: t.arg.string({ required: false }),
				after: t.arg.string({ required: false }),
				last: t.arg.int({ required: false }),
			},
			resolve: async (_, args, { user }) => {
				const following = await prisma.user
					.findUnique({
						where: { email: user!.email },
					})
					.following({
						...connectionForPrisma(args, 'createdAt'),
					})
				const totalFollowing = await prisma.user.count({
					where: { followers: { some: { username: user!.username } } },
				})

				return {
					users: following,
					totalFollowing,
					totalPages: Math.ceil(totalFollowing / 10),
				}
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
