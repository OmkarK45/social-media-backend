import { decodeGlobalID } from '@giraphql/plugin-relay'
import { builder } from '~/graphql/builder'
import { prisma } from '~/lib/db'
import { createNotification } from '../notifications/NotificationResolver'
import { ResultResponse } from '../ResultResponse'

builder.prismaObject('Like', {
	findUnique: (like) => ({ id: like.id }),
	fields: (t) => ({
		id: t.exposeString('id'),
		post: t.relation('post'),
		user: t.relation('user'),
	}),
})

builder.mutationField('toggleLike', (t) =>
	t.field({
		type: ResultResponse,
		args: { id: t.arg.string({}) },
		resolve: async (_, { id }, { user }) => {
			let like = await prisma.like.findUnique({
				where: {
					postId_userId: {
						postId: decodeGlobalID(id).id,
						userId: user!.id,
					},
				},
			})
			if (like) {
				await prisma.like.delete({
					where: {
						postId_userId: {
							postId: decodeGlobalID(id).id,
							userId: user!.id,
						},
					},
				})
			} else {
				like = await prisma.like.create({
					data: {
						user: { connect: { id: user!.id } },
						post: { connect: { id: decodeGlobalID(id).id } },
					},
				})
			}

			const post = await prisma.post.findFirst({
				where: { id: decodeGlobalID(id).id },
			})

			await createNotification({
				type: 'POST_LIKE',
				dispatcherId: user!.id,
				receiverId: post!.userId,
				entityId: like?.id!,
			})

			return {
				success: true,
			}
		},
	})
)
