import { Post } from '@prisma/client'
import { upload } from '../../../lib/upload'
import { builder } from '../../builder'
// upload photo with caption

const CreatePostResponse = builder.objectRef<Post>('Post')

CreatePostResponse.implement({
	fields: (t) => ({
		body: t.exposeString('body', { nullable: true }),
	}),
})

const CreatePostInput = builder.inputType('CreatePostInput', {
	fields: (t) => ({
		media: t.field({ type: 'FileUpload' }),
	}),
})

builder.mutationField('createPost', (t) =>
	t.field({
		type: 'String',
		args: { input: t.arg({ type: CreatePostInput }) },
		resolve: async (_, { input }, { prisma, user }) => {
			const media = await input.media
			const response = await upload(media)
			return response.url
		},
	})
)
