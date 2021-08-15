import { Comment } from '@prisma/client'
import { string } from 'zod'

import { builder } from '../../builder'
import { ResultResponse } from '../ResultResponse'
import { UserObject } from '../user/UserResolver'
import { Context } from '../../context'

export const CommentObject = builder.objectRef<Comment>('Comment')

CommentObject.implement({
	fields: (t) => ({
		body: t.exposeString('body'),
		id: t.exposeString('id'),
		// todo -> look into this
		user: t.loadable({
			type: UserObject,
			load: async (ids: Array<string>, context: Context) => {
				const result = await context.loader.loadUsersById(ids)
				return result
			},
			resolve: ({ userId }, _, { prisma }) => {
				return userId
			},
		}),
		isMine: t.boolean({
			authScopes: { user: true },
			resolve: ({ userId }, _, { user }) => user!.id === userId,
		}),
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

/** Create Comment Mutation */
builder.mutationField('createComment', (t) =>
	t.field({
		type: ResultResponse,
		args: { input: t.arg({ type: CreateCommentInput }) },
		authScopes: { user: true },
		resolve: async (_parent, { input }, { prisma, user }) => {
			const newComment = await prisma.comment.create({
				data: {
					body: input.body,
					post: { connect: { id: input.postId } },
					user: { connect: { id: user!.id } },
				},
			})
			// todo customize this Result response to include id as well. I might need comment id on FE
			return { success: true, id: newComment.id }
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
		resolve: async (_, { input }, { prisma, user }) => {
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
		resolve: async (_, { id }, { prisma, user }) => {
			const foundComment = await prisma.comment.findUnique({
				where: { id },
			})
			if (!foundComment) {
				return { success: false }
			}
			if (foundComment.userId !== user.id) {
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
