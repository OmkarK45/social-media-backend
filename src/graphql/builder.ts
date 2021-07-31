import SchemaBuilder from '@giraphql/core'
import SimpleObjectsPlugin from '@giraphql/plugin-simple-objects'
import ScopeAuthPlugin from '@giraphql/plugin-scope-auth'
import ValidationPlugin from '@giraphql/plugin-validation'
import { Context } from './context'

export const builder = new SchemaBuilder<{
	DefaultInputFieldRequiredness: true
	Context: Context
	Scalars: {
		ID: { Input: string; Output: string | number }
		Date: { Input: Date; Output: Date }
	}
	AuthScopes: {
		user: boolean
		unauthenticated: boolean
	}
}>({
	defaultInputFieldRequiredness: true,
	plugins: [ScopeAuthPlugin, SimpleObjectsPlugin, ValidationPlugin],
	authScopes: async ({ user }) => ({
		user: !!user,
		unauthenticated: !user,
	}),
})

builder.queryType({})
builder.mutationType({})

builder.scalarType('Date', {
	serialize: (date) => date.toISOString(),
	parseValue: (date) => new Date(date),
})
