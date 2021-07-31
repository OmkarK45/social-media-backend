import { builder } from '../../../graphql/builder'
import { UserObject } from './UserResolver'

const FollowUserInput = builder.inputType('FollowUserInput', {
	fields: (t) => ({ username: t.string({}) }),
})

builder.mutationField('followUser', (t) =>
	t.field({
		type: UserObject,
		args: { input: t.arg({ type: FollowUserInput }) },
		authScopes: { user: true },
		resolve: async (_, { input }, { prisma, user }) => {
			const updatedUser = await prisma.user.update({
				where: { id: user!.id },
				data: {
					following: {
						connect: { username: input.username },
					},
				},
			})

			return updatedUser
		},
	})
)

builder.mutationField('unfollowUser', (t) =>
	t.field({
		type: UserObject,
		args: { input: t.arg({ type: FollowUserInput }) },
		authScopes: { user: true },
		resolve: async (_, { input }, { prisma, user }) => {
			const updatedUser = await prisma.user.update({
				where: { id: user!.id },
				data: {
					following: {
						disconnect: { username: input.username },
					},
				},
			})

			return updatedUser
		},
	})
)
