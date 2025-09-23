const classSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  code: {
    type: string,
    required: true
  },
  subjects: [{ type: Schema.Types.ObjectId, ref: 'Subject' }]
});