import { builder } from '../builder'

builder.queryField('health', (t) =>
	t.field({
		type: 'String',
		resolve: (_root, _args, _ctx) => {
			return 'Health OK'
		},
	})
)

export const ResultResponse = builder.simpleObject('ResultResponse', {
	fields: (t) => ({
		success: t.boolean(),
	}),
})

builder.queryField('whatTime', (t) =>
	t.field({
		type: 'DateTime',
		resolve: (_root, _args, _ctx) => {
			return new Date()
		},
	})
)

//{ name : "AShwin", hello:true}

const HelloResponseObject = builder.simpleObject('HelloResponse', {
	fields: (t) => ({
		name: t.string(),
		hello: t.boolean(),
	}),
})

builder.mutationField('sayHello', (t) =>
	t.field({
		type: HelloResponseObject,
		args: { name: t.arg({ type: 'String' }) },
		resolve: async (_root, { name }, _ctx) => {
			return {
				hello: true,
				name: name,
			}
		},
	})
)
