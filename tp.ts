const [file, setFile] = useState({})
const [uploadFile] = useMutation(UploadMutation)

const handleSubmit = async () => {
	if (file) {
		uploadFile({
			variables: { file },
			// add the rest of the form fields to this query
			// refetchQueries: [{ query: FileQuery, variables: file }],
		})
		setFile({})
		// post message on form
		console.log('Uploaded successfully: ', file)
	} else {
		// return alertk
		console.log('No files to upload')
	}
}

const { getRootProps, getInputProps } = useDropzone({
	accept: 'image/*',
	onDrop: (acceptedFile) => {
		setFile(
			Object.assign(acceptedFile[0], {
				preview: URL.createObjectURL(acceptedFile[0]),
			})
		)
	},
})

;<div {...getRootProps({ className: 'dropzone' })}>
	<input {...getInputProps()} />
	<p>Drag 'n' drop some file here, or click to select file</p>
</div>

// usemedia query
