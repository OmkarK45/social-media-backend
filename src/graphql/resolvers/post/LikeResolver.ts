import { builder } from '~/graphql/builder'
import { prisma } from '~/lib/db'
import { getConnection, getPrismaPaginationArgs } from '~/lib/page'
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
	t.connection({
		type: UserObject,
		args: { ...t.arg.connectionArgs(), id: t.arg.string({}) },
		resolve: async (_, { id, after, before, first, last }, { user }) => {
			const likes = await prisma.like.findMany({
				where: {
					postId: id,
				},
				select: { user: true },
			})
			const usersWhoLiked = likes.map((like) => like.user)

			return getConnection({
				args: { after, before, first, last },
				nodes: usersWhoLiked,
			})
		},
	})
)
