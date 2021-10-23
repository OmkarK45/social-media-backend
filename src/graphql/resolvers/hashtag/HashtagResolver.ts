import { builder } from '~/graphql/builder'
import { prisma } from '~/lib/db'

builder.prismaObject('Hashtag', {
	findUnique: (hashtag) => ({ id: hashtag.id }),
	fields: (t) => ({
		id: t.exposeID('id'),
		hashtag: t.exposeString('hashtag'),
		posts: t.relatedConnection('posts', {
			cursor: 'id',
		}),
	}),
})

builder.queryField('popularHashtags', (t) =>
	t.prismaConnection({
		type: 'Hashtag',
		cursor: 'id',
		maxSize: 100,
		defaultSize: 10,
		resolve: async (query, _, args, _ctx) => {
			const popularHashtags = await prisma.hashtag.findMany({
				...query,
			})
			return popularHashtags
		},
	})
)

builder.queryField('searchByHashtag', (t) =>
	t.prismaConnection({
		type: 'Post',
		cursor: 'id',
		args: { keyword: t.arg.string() },
		resolve: async (query, _root, { keyword }, _ctx) => {
			const postsWithHashtag = await prisma.post.findMany({
				...query,
				where: {
					hashtags: {
						some: {
							hashtag: {
								startsWith: keyword.toLowerCase(),
							},
						},
					},
				},
			})
			return postsWithHashtag
		},
	})
)
