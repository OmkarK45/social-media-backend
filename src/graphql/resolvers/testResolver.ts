// import { prisma } from '~/lib/db'
// import { builder } from '../builder'

// builder.prismaNode(prisma.foo, {
// 	findUnique: (id) => ({ id: parseInt(id) }),
// 	id: { resolve: (user) => user.id },
// 	fields: (t) => ({
// 		username: t.exposeString('name'),
// 		bars: t.relatedConnection('bars', {
// 			cursor: 'id',
// 			args: {
// 				oldestFirst: t.arg.boolean(),
// 			},
// 			query: (args, context) => ({
// 				take: 2,
// 				orderBy: {
// 					createdAt: args.oldestFirst ? 'asc' : 'desc',
// 				},
// 			}),
// 		}),
// 	}),
// })

// builder.prismaNode(prisma.bar, {
// 	findUnique: (id) => ({ id: parseInt(id) }),
// 	id: { resolve: (post) => post.id },
// 	fields: (t) => ({
// 		name: t.exposeString('text'),
// 	}),
// })

// builder.queryField('allBars', (t) =>
// 	t.prismaConnection({
// 		type: prisma.bar,
// 		cursor: 'id',
// 		resolve: (query) => prisma.bar.findMany(query),
// 	})
// )

// builder.mutationField('addFoo', (t) =>
// 	t.field({
// 		type: 'String',
// 		args: { name: t.arg.string() },
// 		resolve: async (_, { name }, _ctx) => {
// 			await prisma.foo.create({
// 				data: { name: 'Omkar' },
// 			})
// 			return 'OK'
// 		},
// 	})
// )

// builder.mutationField('addBar', (t) =>
// 	t.field({
// 		type: 'String',
// 		args: { text: t.arg.string(), fooId: t.arg.int() },
// 		resolve: async (_, { text, fooId }, _ctx) => {
// 			await prisma.bar.create({
// 				data: {
// 					text,
// 					foo: {
// 						connect: {
// 							id: fooId,
// 						},
// 					},
// 				},
// 			})
// 			return 'OK'
// 		},
// 	})
// )
