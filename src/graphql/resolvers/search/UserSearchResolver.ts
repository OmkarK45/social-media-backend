import { builder } from '~/graphql/builder'
import { UserObject } from '../user/UserResolver'

const SearchResponse = builder.simpleObject('SearchResponse', {
	fields: (t) => ({
		users: t.field({ type: [UserObject] }),
		total: t.int(),
	}),
})

builder.mutationField('searchUser', (t) =>
	t.field({
		type: SearchResponse,
		description: 'Searches user whose username matches given keyword',
		args: { keyword: t.arg.string() },
		resolve: async (_, { keyword }, { prisma }) => {
			const usersWithCount = await prisma.$transaction([
				prisma.user.count({
					where: { username: { startsWith: keyword.toLowerCase() } },
				}),
				prisma.user.findMany({
					where: {
						username: {
							startsWith: keyword.toLowerCase(),
						},
					},
				}),
			])
			return {
				users: usersWithCount[1],
				total: usersWithCount[0],
			}
		},
	})
)
