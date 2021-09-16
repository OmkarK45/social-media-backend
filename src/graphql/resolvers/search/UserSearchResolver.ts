import { builder } from '~/graphql/builder'
import { prisma } from '~/lib/db'
import { getConnection, getPrismaPaginationArgs } from '~/lib/page'
import { UserObject } from '../user/UserResolver'

const SearchResponse = builder.simpleObject('SearchResponse', {
	fields: (t) => ({
		users: t.field({ type: [UserObject] }),
		total: t.int(),
	}),
})

builder.mutationField('searchUser', (t) =>
	t.connection({
		type: UserObject,
		args: { keyword: t.arg.string(), ...t.arg.connectionArgs() },
		resolve: async (_, { keyword, first, last, after, before }, _ctx) => {
			const users = await prisma.user.findMany({
				where: {
					username: {
						startsWith: keyword.toLowerCase(),
					},
				},
				...getPrismaPaginationArgs({ after, before, first, last }),
			})

			return getConnection({
				args: { first, last, after, before },
				nodes: users,
			})
		},
	})
)
