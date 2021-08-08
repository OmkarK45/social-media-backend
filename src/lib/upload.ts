import { v2 as cloudinary, UploadApiResponse } from 'cloudinary'
import dotEnv from 'dotenv'
import { FileUpload } from 'graphql-upload'
// just in case
dotEnv.config()

import { config } from './config'

const { cloud_name, api_key, api_secret } = config.cloudinary

cloudinary.config({
	cloud_name,
	api_key,
	api_secret,
})

export async function upload(file: FileUpload): Promise<UploadApiResponse> {
	return new Promise((resolve, reject) => {
		const uploadStream = cloudinary.uploader.upload_stream(
			{
				folder: config.cloudinary.folder,
			},
			(err, img) => {
				if (img) {
					resolve(img)
				} else {
					reject(err)
				}
			}
		)

		file.createReadStream().pipe(uploadStream)
	})
}
