import { builder } from '../../builder'
import { User } from '@prisma/client'
import { EditProfileInput } from '../../input/UserInput'

export const UserObject = builder.objectRef<User>('User')

UserObject.implement({
	fields: (t) => ({
		id: t.exposeID('id'),
		email: t.exposeString('email'),
		username: t.exposeString('username'),
		firstName: t.exposeString('firstName'),
		lastName: t.exposeString('lastName', { nullable: true }),
		bio: t.exposeString('bio', { nullable: true }),
		// paginate this to increase efficiency
		followers: t.field({
			type: [UserObject],
			authScopes: { user: true },
			args: { page: t.arg.int() },
			resolve: async (_, { page }, { prisma, user }) => {
				const followers = await prisma.user
					.findUnique({ where: { email: user!.email } })
					.followers({
						take: 10,
						skip: (page - 1) * 10,
					})
				console.log('FOLLOWERS QUERY')
				return followers
			},
		}),
		following: t.field({
			type: [UserObject],
			authScopes: { user: true },
			args: { page: t.arg.int() },
			resolve: async (_, { page }, { prisma, user }) => {
				const following = await prisma.user
					.findUnique({
						where: { email: user!.email },
					})
					.following({
						take: 10,
						skip: (page - 1) * 10,
					})

				console.log('FOLLOWING QUERY')

				return following
			},
		}),
	}),
})

builder.queryField('me', (t) =>
	t.field({
		type: UserObject,
		authScopes: { user: true },
		resolve: async (_, _args, { prisma, user }) => {
			console.log('ME QUERY')
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
		resolve: async (_parent, { input }, { prisma, user }) => {
			const updatedUser = await prisma.user.update({
				where: { email: user!.email },
				data: {
					username: input.username,
					bio: input.bio,
					lastName: input.lastName,
					firstName: input.firstName,
				},
			})
			return updatedUser
		},
	})
)
