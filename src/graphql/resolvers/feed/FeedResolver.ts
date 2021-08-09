import { Post, prisma } from '@prisma/client'
import { builder } from '../../builder'
import { UserObject } from '../user/UserResolver'

// Look into this FeedPosts -> Post
const FeedResponse = builder.objectRef<Post>('FeedPosts')

FeedResponse.implement({
	fields: (t) => ({
		id: t.exposeString('id'),
		image: t.exposeString('image', { nullable: true }),
		caption: t.exposeString('caption', { nullable: true }),

		user: t.field({
			type: UserObject,
			resolve: async (post, _, { prisma }) => {
				return await prisma.user.findUnique({
					where: { id: post.userId },
					rejectOnNotFound: true,
				})
			},
		}),
	}),
})

builder.queryField('feed', (t) =>
	t.field({
		type: [FeedResponse],
		args: { offset: t.arg.int({}) },

		resolve: async (_parent, { offset }, { prisma, user }) => {
			return await prisma.post.findMany({
				// @TODO : this will probably will change as I do scroll
				take: 5,
				skip: offset,
				where: {
					OR: [
						{ user: { followers: { some: { id: user!.id } } } },
						{ userId: user?.id },
					],
				},
			})
		},
	})
)
