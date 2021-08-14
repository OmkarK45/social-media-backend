import { builder } from '../../builder'
import { ResultResponse } from '../ResultResponse'
import { UserObject } from '../user/UserResolver'

builder.mutationField('toggleLike', (t) =>
	t.field({
		type: ResultResponse,
		args: { id: t.arg.string({}) },
		resolve: async (_, { id }, { user, prisma }) => {
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

builder.queryField('seeLikes', (t) =>
	t.field({
		type: [UserObject],
		args: { id: t.arg.string({}) },
		resolve: async (_, { id }, { prisma, user }) => {
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
