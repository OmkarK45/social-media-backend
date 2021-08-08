import { Post } from '@prisma/client'
import { z } from 'zod'
import { upload } from '../../../lib/upload'
import { builder } from '../../builder'
import { HashTag, parseHashtags } from '../../utils/hashtags'
// upload photo with caption

const CreatePostResponse = builder.objectRef<Post>('Post')

CreatePostResponse.implement({
	fields: (t) => ({
		caption: t.exposeString('caption', { nullable: true }),
		image: t.exposeString('image', { nullable: true }),
	}),
})

const CreatePostInput = builder.inputType('CreatePostInput', {
	fields: (t) => ({
		caption: t.field({
			type: 'String',
			validate: { schema: z.string().min(1).max(256) },
		}),
		media: t.field({ type: 'FileUpload' }),
		// add caption here
	}),
})

builder.mutationField('createPost', (t) =>
	t.field({
		type: CreatePostResponse,

		args: { input: t.arg({ type: CreatePostInput }) },

		authScopes: {
			user: true,
		},

		resolve: async (_, { input }, { prisma, user }) => {
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
