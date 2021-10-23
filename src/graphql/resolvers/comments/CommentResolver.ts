import { string } from 'zod'

import { builder } from '~/graphql/builder'
import { ResultResponse } from '../ResultResponse'
import { prisma } from '~/lib/db'
import { decodeGlobalID } from '@giraphql/plugin-relay'
import { createNotification } from '../notifications/NotificationResolver'

builder.prismaObject('Comment', {
	findUnique: (comment) => ({ id: comment.id }),
	fields: (t) => ({
		id: t.exposeString('id'),
		body: t.exposeString('body'),
		user: t.relation('user'),
		isMine: t.boolean({
			authScopes: { user: true },
			resolve: ({ userId }, _, { user }) => user!.id === userId,
		}),
		post: t.relation('post'),
	}),
})

const CreateCommentInput = builder.inputType('CreateCommentInput', {
	fields: (t) => ({
		postId: t.string({}),
		body: t.string({
			validate: {
				schema: string()
					.min(1, 'Comment should be atleast 1 character long.')
					.max(250, 'Your comment is too lengthy.'),
			},
		}),
	}),
})

const CreateCommentObject = builder.simpleObject('CreateCommentObject', {
	fields: (t) => ({
		id: t.string(),
		body: t.string(),
	}),
})

/** Create Comment Mutation */
builder.mutationField('createComment', (t) =>
	t.field({
		type: CreateCommentObject,
		args: { input: t.arg({ type: CreateCommentInput }) },
		authScopes: { user: true },
		resolve: async (_parent, { input }, { user }) => {
			const post = await prisma.post.findUnique({
				where: { id: decodeGlobalID(input.postId).id },
				include: { user: true },
			})

			const newComment = await prisma.comment.create({
				data: {
					body: input.body,
					post: { connect: { id: decodeGlobalID(input.postId).id } },
					user: { connect: { id: user!.id } },
				},
			})

			await createNotification({
				dispatcherId: user?.id!,
				receiverId: post?.userId!,
				entityId: post?.id!,
				type: 'POST_REPLY',
			})

			return { id: newComment.id, body: newComment.body }
		},
	})
)

const EditCommentInput = builder.inputType('EditCommentInput', {
	fields: (t) => ({
		id: t.string(),
		body: t.string({
			validate: {
				schema: string().min(1, 'Comment must be atleast 1 character long.'),
			},
		}),
		postId: t.string(),
	}),
})

/** Edit Comment Mutation */
builder.mutationField('editComment', (t) =>
	t.field({
		type: ResultResponse,
		args: { input: t.arg({ type: EditCommentInput }) },
		resolve: async (_, { input }, { user }) => {
			const foundComment = await prisma.comment.findUnique({
				where: { id: input.id },
				rejectOnNotFound: true,
			})
			if (!foundComment) {
				throw new Error('Comment with that ID was not found.')
			}
			if (foundComment.userId !== user?.id) {
				throw new Error('You are not authorized to edit this comment.')
			} else {
				await prisma.comment.update({
					where: { id: input.id },
					data: {
						body: input.body,
					},
				})
			}
			return { success: true }
		},
	})
)

/** Delete Comment Mutation */
builder.mutationField('deleteComment', (t) =>
	t.field({
		type: ResultResponse,
		args: { id: t.arg.string() },
		resolve: async (_, { id }, { user }) => {
			const foundComment = await prisma.comment.findUnique({
				where: { id },
			})
			if (!foundComment) {
				return { success: false }
			}
			if (foundComment.userId !== user!.id) {
				throw new Error('You are not authorized to do this operation.')
			} else {
				await prisma.comment.delete({
					where: { id },
				})
			}
			return { success: true }
		},
	})
)
