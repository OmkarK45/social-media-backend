import { builder } from '~/graphql/builder'
import { connectionForPrisma, resolveConnection } from '~/lib/cursor'
import { prisma } from '~/lib/db'
import { PostResponse } from '../post/PostResolver'

builder.queryField('feed', (t) =>
	t.field({
		type: [PostResponse],
		args: {
			first: t.arg.int({ required: false }),
			before: t.arg.string({ required: false }),
			after: t.arg.string({ required: false }),
			last: t.arg.int({ required: false }),
		},
		authScopes: { user: true },
		resolve: async (_parent, args, { user }) => {
			const users = await prisma.post.findMany({
				where: {
					OR: [
						{ user: { followers: { some: { id: user!.id } } } },
						{ userId: user?.id },
					],
				},
				...connectionForPrisma(args, 'createdAt'),
			})

			return users
		},
	})
)
