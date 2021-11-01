import * as Joi from 'joi'

const configSchema = Joi.object({
	NODE_ENV: Joi.string().valid('local', 'test', 'development', 'production'),
	APP_ENV: Joi.string()
		.lowercase()
		.valid('local', 'test', 'development', 'production'),
	PORT: Joi.string().required(),
	DATABASE_URL: Joi.string().required(),
	APP_AUTH_SECRET: Joi.string().required(),
	TOKEN_EXPIRES_IN: Joi.string().required(),
	CLOUDINARY_URL: Joi.string(),
	CLOUDINARY_API_KEY: Joi.string(),
	CLOUDINARY_API_SECRET: Joi.string(),
	CLOUDINARY_CLOUD_NAME: Joi.string(),
	CLOUDINARY_FOLDER: Joi.string(),
}).unknown()

const { APP_ENV = 'development' } = process.env

export const IS_PRODUCTION = APP_ENV === 'production'

export const IS_DEVELOPMENT = APP_ENV === 'development'

export function loadConfig(schema: Joi.ObjectSchema, envs: NodeJS.ProcessEnv) {
	const { error, value: envVars } = schema.validate(envs, {
		abortEarly: true,
	})
	if (error) {
		throw new Error(`Environment variables validation error: ${error.message}`)
	}

	return {
		env: envVars.NODE_ENV,
		port: envVars.PORT,
		app_env: envVars.APP_ENV,
		database: {
			url: envVars.DATABASE_URL,
		},
		auth: {
			secret: envVars.APP_AUTH_SECRET,
			expiresIn: envVars.TOKEN_EXPIRES_IN,
		},
		cloudinary: {
			url: envVars.CLOUDINARY_URL,
			api_key: envVars.CLOUDINARY_API_KEY,
			api_secret: envVars.CLOUDINARY_API_SECRET,
			cloud_name: envVars.CLOUDINARY_CLOUD_NAME,
			folder: envVars.CLOUDINARY_FOLDER,
		},
	}
}

export const config = loadConfig(configSchema, process.env)
