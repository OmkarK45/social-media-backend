import { NodeType, Post } from '@prisma/client'
import { z } from 'zod'
import { decodeGlobalID } from '@giraphql/plugin-relay'

import { getConnection, getPrismaPaginationArgs } from '~/lib/page'
import { prisma } from '~/lib/db'
import { upload } from '~/lib/upload'

import { builder } from '~/graphql/builder'
import { HashTag, parseHashtags } from '~/graphql/utils/hashtags'

import { CommentObject } from '../comments/CommentResolver'
import { HashtagObject } from '../hashtag/HashtagResolver'
import { ResultResponse } from '../ResultResponse'
import { UserObject } from '../user/UserResolver'
import { getHash } from '~/lib/blurhash'
import { parseMentions } from '~/graphql/utils/parseMentions'
import { getMentions } from '~/graphql/utils/getMentions'

export const PostObject = builder.objectRef<Post>('Post')

builder.node(PostObject, {
	isTypeOf: (value) =>
		(value as { nodeType?: NodeType }).nodeType === NodeType.Post,
	id: { resolve: (post) => post.id },
	fields: (t) => ({
		caption: t.exposeString('caption', { nullable: true }),
		image: t.exposeString('image', { nullable: true }),
		gifImage: t.exposeString('gifLink', { nullable: true }),
		blurHash: t.exposeString('blurHash', { nullable: true }),
		createdAt: t.expose('createdAt', { type: 'DateTime' }),
		updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
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
		hashtags: t.connection({
			type: HashtagObject,
			resolve: async ({ id }, args, _ctx) => {
				const hashtags = await prisma.post
					.findUnique({ where: { id } })
					.hashtags()
				return getConnection({ args, nodes: hashtags })
			},
		}),
		likes: t.int({
			resolve: async ({ id }, _args, _ctx) => {
				return prisma.like.count({ where: { postId: id } })
			},
		}),
		likedBy: t.connection({
			type: UserObject,
			resolve: async ({ id }, args, _ctx) => {
				const usersWhoLiked = await prisma.user.findMany({
					where: {
						likes: {
							some: {
								postId: id,
							},
						},
					},
					...getPrismaPaginationArgs(args),
				})

				return getConnection({ args, nodes: usersWhoLiked })
			},
		}),
		comments: t.connection({
			type: CommentObject,

			resolve: async ({ id }, args, _ctx) => {
				const comments = await prisma.post
					.findUnique({
						where: { id },
					})
					.comments({
						...getPrismaPaginationArgs(args),
						orderBy: {
							createdAt: 'desc',
						},
					})
				return getConnection({ args, nodes: comments })
			},
		}),
		totalComments: t.int({
			resolve: ({ id }, _, _ctx) =>
				prisma.comment.count({ where: { postId: id } }),
		}),
	}),
})

// although both are optional here, we check it on the frontend and make sure one of them is required
const CreatePostInput = builder.inputType('CreatePostInput', {
	fields: (t) => ({
		caption: t.field({
			type: 'String',
			validate: { schema: z.string().min(1).max(256) },
		}),
		media: t.field({ type: 'FileUpload', required: false }),
		gifLink: t.string({ required: false }),
	}),
})

/** Creates a new Post */
builder.mutationField('createPost', (t) =>
	t.field({
		type: PostObject,

		args: { input: t.arg({ type: CreatePostInput }) },

		resolve: async (_, { input }, { user, session }) => {
			/**  Incoming image file  */
			let media
			let response
			let blurHash

			if (input.media && input.media !== null) {
				media = await input.media
				response = await upload(media)
				blurHash = await getHash(response.url)
			}
			/** Upload to cloudinary */

			/** logic for placeholder */
			/** Parse hashtags from caption */
			let hashTags: Array<HashTag> = []

			if (input.caption) {
				hashTags = parseHashtags(input.caption)
			}

			const post = await prisma.post.create({
				data: {
					caption: input.caption,
					image: response ? response.url : null,
					blurHash: blurHash ? blurHash.hash : null,
					gifLink: input.gifLink,
					user: { connect: { id: user!.id } },
					...(hashTags.length > 0 && {
						hashtags: {
							connectOrCreate: hashTags,
						},
					}),
				},
			})

			const usersMentioned = await parseMentions(
				getMentions(input.caption),
				session,
				post
			)
			console.log('Users Mentioned', usersMentioned)
			const mentions = usersMentioned.filter(
				(user) => user.receiverId !== session?.userId
			)
			console.log('Mentioned', mentions)

			await prisma.notification.createMany({
				data: mentions,
				skipDuplicates: true,
			})

			return post
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
				where: { id: decodeGlobalID(id).id },
				select: { userId: true },
				rejectOnNotFound: true,
			})

			if (photo.userId !== user!.id) {
				throw new Error('You are not authorized to perform this operation.')
			}
			await prisma.comment.deleteMany({
				where: { postId: decodeGlobalID(id).id },
			})
			await prisma.like.deleteMany({
				where: { postId: decodeGlobalID(id).id },
			})
			await prisma.post.delete({
				where: { id: decodeGlobalID(id).id },
			})

			return {
				success: true,
			}
		},
	})
)

const EditPostInput = builder.inputType('EditPostInput', {
	fields: (t) => ({
		id: t.string(),
		caption: t.string(),
		gifLink: t.string({ required: false }),
	}),
})

/** Edit Post */
builder.mutationField('editPost', (t) =>
	t.field({
		type: PostObject,
		args: { input: t.arg({ type: EditPostInput }) },
		authScopes: { user: true },
		resolve: async (_parent, { input }, { user }) => {
			console.log(input)

			const oldPost = await prisma.post.findFirst({
				where: { id: decodeGlobalID(input.id).id, userId: user!.id },
				include: {
					hashtags: {
						select: { hashtag: true },
					},
				},
				rejectOnNotFound: true,
			})

			return await prisma.post.update({
				where: { id: decodeGlobalID(input.id).id },
				data: {
					caption: input.caption,
					gifLink: input.gifLink,
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
		type: PostObject,
		args: { id: t.arg.string() },
		resolve: async (_, { id }, _ctx) => {
			const decodedID = decodeGlobalID(id)
			return await prisma.post.findUnique({
				where: { id: decodedID.id },
				rejectOnNotFound: true,
			})
		},
	})
)

builder.queryField('postsByHashtag', (t) =>
	t.connection({
		type: PostObject,
		args: { hashtag: t.arg.string(), ...t.arg.connectionArgs() },
		resolve: async (_, { hashtag, ...args }, _ctx) => {
			const posts = await prisma.post.findMany({
				where: {
					hashtags: {
						some: {
							hashtag: {
								equals: hashtag.toLowerCase(),
							},
						},
					},
				},
				...getPrismaPaginationArgs(args),
			})
			return getConnection({
				args,
				nodes: posts,
			})
		},
	})
)

// TODO : come up with logic
// builder.queryField('popularPosts', (t) =>
// 	t.connection({
// 		type: PostObject,
// 		args: { orderBy: t.arg.string() },
// 		resolve: async (_, { orderBy }, { user }) => {
// 			const popularPosts = await prisma.post.findMany({
// 				where : { userId : { not : user?.id}},
// 				include : {
// 					likes : true
// 				},
// 				orderBy : {

// 				}
// 			})
// 		},
// 	})
// )
