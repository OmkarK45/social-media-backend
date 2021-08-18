import { Post } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '~/lib/db'

import { upload } from '../../../lib/upload'
import { builder } from '../../builder'
import { HashTag, parseHashtags } from '../../utils/hashtags'
import { CommentObject } from '../comments/CommentResolver'
import { HashtagObject } from '../hashtag/HashtagResolver'
import { ResultResponse } from '../ResultResponse'
import { UserObject } from '../user/UserResolver'
// upload photo with caption

const PostResponse = builder.objectRef<Post>('Post')

PostResponse.implement({
	fields: (t) => ({
		id: t.exposeString('id'),
		caption: t.exposeString('caption', { nullable: true }),
		image: t.exposeString('image', { nullable: true }),
		// @todo -> isMine, comments, user
		isMine: t.boolean({
			resolve: async ({ userId }, _, { user }) => {
				if (!user) {
					return false
				}
				return userId === user.id
			},
		}),
		isLiked: t.boolean({
			resolve: async ({ id }, _, { user }) => {
				if (!user) {
					return false
				}
				const hasLiked = await prisma.like.findUnique({
					where: { postId_userId: { postId: id, userId: user.id } },
					select: { id: true },
				})
				if (hasLiked) {
					return true
				}
				return false
			},
		}),
		user: t.field({
			type: UserObject,
			resolve: async ({ userId }, _, _ctx) => {
				return await prisma.user.findUnique({
					where: { id: userId },
					rejectOnNotFound: true,
				})
			},
		}),
		hashtags: t.field({
			type: [HashtagObject],
			resolve: async ({ id }, _, _ctx) => {
				return await prisma.hashtag.findMany({
					where: {
						posts: {
							some: { id },
						},
					},
				})
			},
		}),
		likes: t.int({
			resolve: async ({ id }, _, _ctx) => {
				return prisma.like.count({ where: { postId: id } })
			},
		}),
		comments: t.field({
			type: [CommentObject],
			resolve: async ({ id }, _, _ctx) => {
				return await prisma.comment.findMany({
					where: { post: { id } },
				})
			},
		}),
		totalComments: t.int({
			resolve: ({ id }, _, _ctx) =>
				prisma.comment.count({ where: { postId: id } }),
		}),
	}),
})

const CreatePostInput = builder.inputType('CreatePostInput', {
	fields: (t) => ({
		caption: t.field({
			type: 'String',
			validate: { schema: z.string().min(1).max(256) },
		}),
		media: t.field({ type: 'FileUpload' }),
	}),
})

/** Creates a new Post */
builder.mutationField('createPost', (t) =>
	t.field({
		type: PostResponse,

		args: { input: t.arg({ type: CreatePostInput }) },

		authScopes: {
			user: true,
		},

		resolve: async (_, { input }, { user }) => {
			/**  Incoming image file  */
			const media = await input.media
			const response = await upload(media)

			/** Parse hashtags from caption */
			let hashTags: Array<HashTag> = []

			if (input.caption) {
				hashTags = parseHashtags(input.caption)
			}

			return await prisma.post.create({
				data: {
					caption: input.caption,
					image: response.url,
					user: { connect: { id: user!.id } },
					...(hashTags.length > 0 && {
						hashtags: {
							connectOrCreate: hashTags,
						},
					}),
				},
			})
		},
	})
)

/** Delete Post */
builder.mutationField('deletePost', (t) =>
	t.field({
		type: ResultResponse,
		args: { id: t.arg.string() },
		authScopes: { user: true },
		resolve: async (_, { id }, { user }) => {
			const photo = await prisma.post.findUnique({
				where: { id },
				select: { userId: true },
				rejectOnNotFound: true,
			})

			if (photo.userId !== user!.id) {
				throw new Error('You are not authorized to perform this operation.')
			}

			await prisma.post.delete({
				where: { id },
			})

			return {
				success: true,
			}
		},
	})
)

const EditPostInput = builder.inputType('EditPostInput', {
	fields: (t) => ({
		// TODO -> better validate here
		id: t.string(),
		caption: t.string(),
	}),
})

/** Edit Post */
builder.mutationField('editPost', (t) =>
	t.field({
		type: PostResponse,
		args: { input: t.arg({ type: EditPostInput }) },
		authScopes: { user: true },
		resolve: async (_parent, { input }, { user }) => {
			const oldPost = await prisma.post.findFirst({
				where: { id: input.id, userId: user!.id },
				include: {
					hashtags: {
						select: { hashtag: true },
					},
				},
				rejectOnNotFound: true,
			})

			return await prisma.post.update({
				where: { id: input.id },
				data: {
					id: input.id,
					caption: input.caption,
					hashtags: {
						disconnect: oldPost.hashtags,
						connectOrCreate: parseHashtags(input.caption),
					},
				},
			})
		},
	})
)

// see individual post
builder.queryField('seePost', (t) =>
	t.field({
		type: PostResponse,
		args: { id: t.arg.string() },
		resolve: async (_, { id }, _ctx) => {
			return await prisma.post.findUnique({
				where: { id },
				rejectOnNotFound: true,
			})
		},
	})
)
