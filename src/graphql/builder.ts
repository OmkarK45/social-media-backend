import SchemaBuilder from '@giraphql/core'
import SimpleObjectsPlugin from '@giraphql/plugin-simple-objects'
import ScopeAuthPlugin from '@giraphql/plugin-scope-auth'
import ValidationPlugin from '@giraphql/plugin-validation'
import { Context } from './context'
import { FileUpload, GraphQLUpload } from 'graphql-upload'

export const builder = new SchemaBuilder<{
	DefaultInputFieldRequiredness: true
	Context: Context
	Scalars: {
		ID: { Input: string; Output: string | number }
		DateTime: { Input: Date; Output: Date }
		FileUpload: { Input: FileUpload; Output: FileUpload }
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

builder.scalarType('DateTime', {
	serialize: (date) => date.toISOString(),
	parseValue: (date) => new Date(date),
})

builder.addScalarType('FileUpload', GraphQLUpload, {})
