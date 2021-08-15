import { builder } from '../../builder'
import { ResultResponse } from '../ResultResponse'
import { string } from 'zod'

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
			return { success: true, id: newComment.id }
		},
	})
)
