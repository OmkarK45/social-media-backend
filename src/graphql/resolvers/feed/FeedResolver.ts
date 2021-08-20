import { builder } from '~/graphql/builder'
import { prisma } from '~/lib/db'
import { getConnection, getPrismaPaginationArgs } from '~/lib/page'
import { PostObject } from '../post/PostResolver'

builder.queryField('feed', (t) =>
	t.connection({
		type: PostObject,
		authScopes: { user: true },
		resolve: async (_parent, args, { user }) => {
			const posts = await prisma.post.findMany({
				where: {
					OR: [
						{ user: { followers: { some: { id: user!.id } } } },
						{ userId: user?.id },
					],
				},
				...getPrismaPaginationArgs(args),
			})

			return getConnection({ args, nodes: posts })
		},
	})
)
