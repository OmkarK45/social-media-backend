import { Hashtag } from '@prisma/client'
import { builder } from '~/graphql/builder'
import { prisma } from '~/lib/db'
import { getConnection, getPrismaPaginationArgs } from '~/lib/page'
import { PostObject } from '../post/PostResolver'

export const HashtagObject = builder.objectRef<Hashtag>('Hashtag')

HashtagObject.implement({
	fields: (t) => ({
		id: t.exposeID('id'),
		hashtag: t.exposeString('hashtag'),
	}),
})

builder.queryField('popularHashtags', (t) =>
	t.connection({
		type: HashtagObject,
		resolve: async (_, args, _ctx) => {
			const popularHashtags = await prisma.hashtag.findMany({
				...getPrismaPaginationArgs(args),
			})
			return getConnection({
				args,
				nodes: popularHashtags,
			})
		},
	})
)

builder.queryField('searchByHashtag', (t) =>
	t.connection({
		type: PostObject,
		args: { keyword: t.arg.string(), ...t.arg.connectionArgs() },
		resolve: async (_root, { keyword, ...args }, _ctx) => {
			const postsWithHashtag = await prisma.post.findMany({
				where: {
					hashtags: {
						some: {
							hashtag: {
								startsWith: keyword.toLowerCase(),
							},
						},
					},
				},
				...getPrismaPaginationArgs(args),
			})
			return getConnection({
				args: { ...args },
				nodes: postsWithHashtag,
			})
		},
	})
)
