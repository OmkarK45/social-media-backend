import { builder } from '~/graphql/builder'
import { prisma } from '~/lib/db'
import { connectionResolver } from '~/lib/paginate'
import { ResultResponse } from '../ResultResponse'
import { UserObject } from '../user/UserResolver'

builder.mutationField('toggleLike', (t) =>
	t.field({
		type: ResultResponse,
		args: { id: t.arg.string({}) },
		resolve: async (_, { id }, { user }) => {
			const like = await prisma.like.findUnique({
				where: {
					postId_userId: {
						postId: id,
						userId: user!.id,
					},
				},
			})
			if (like) {
				await prisma.like.delete({
					where: {
						postId_userId: {
							postId: id,
							userId: user!.id,
						},
					},
				})
			} else {
				await prisma.like.create({
					data: {
						user: {
							connect: {
								id: user!.id,
							},
						},
						post: {
							connect: {
								id,
							},
						},
					},
				})
			}
			return {
				success: true,
			}
		},
	})
)

// TODO : Paginate this
builder.queryField('seeLikes', (t) =>
	t.field({
		type: [UserObject],
		args: { id: t.arg.string({}) },
		resolve: async (_, { id }, { user }) => {
			const result = await connectionResolver(
				{ first: 1, last: 0 },
				prisma.like
			)
			console.log(JSON.stringify(result, null, 2))
			const likes = await prisma.like.findMany({
				where: {
					postId: id,
				},
				select: { user: true },
			})
			return likes.map((like) => like.user)
		},
	})
)
