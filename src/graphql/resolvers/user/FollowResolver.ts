import { builder } from '~/graphql/builder'
import { prisma } from '~/lib/db'
import { getConnection, getPrismaPaginationArgs } from '~/lib/page'
import { UserObject } from './UserResolver'

const FollowUserInput = builder.inputType('FollowUserInput', {
	fields: (t) => ({ username: t.string({}) }),
})

const FollowUnfollowResponse = builder.simpleObject('FollowResponse', {
	fields: (t) => ({
		ok: t.boolean(),
	}),
})

builder.mutationField('followUser', (t) =>
	t.field({
		type: FollowUnfollowResponse,
		args: { input: t.arg({ type: FollowUserInput }) },
		authScopes: { user: true },
		resolve: async (_, { input }, { user }) => {
			const updatedUser = await prisma.user.update({
				where: { id: user!.id },
				data: {
					following: {
						connect: { username: input.username },
					},
				},
			})

			return { ok: true }
		},
	})
)

builder.mutationField('unfollowUser', (t) =>
	t.field({
		type: FollowUnfollowResponse,
		args: { input: t.arg({ type: FollowUserInput }) },
		authScopes: { user: true },
		resolve: async (_, { input }, { user }) => {
			const updatedUser = await prisma.user.update({
				where: { id: user!.id },
				data: {
					following: {
						disconnect: { username: input.username },
					},
				},
			})

			return { ok: true }
		},
	})
)

builder.queryField('whoToFollow', (t) =>
	t.connection({
		type: UserObject,
		authScopes: { user: false, unauthenticated: true },
		resolve: async (_root, args, { user }) => {
			const existingFollowing = await prisma.user
				.findUnique({
					where: { id: user!.id },
				})
				.following()

			const suggestions = await prisma.user.findMany({
				where: {
					id: {
						notIn: existingFollowing.map((x) => x.id),
					},
				},
				...getPrismaPaginationArgs(args),
			})

			const newSuggestions = suggestions.filter(
				(suggestion) => suggestion.id !== user?.id
			)

			return getConnection({ args, nodes: newSuggestions })
		},
	})
)
