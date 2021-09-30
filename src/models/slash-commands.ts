import mongoose, { Schema } from 'mongoose'

const reqString = {
    type: String,
    required: true
}

const schema = new Schema({
    _id: reqString,
    nameAndClient: reqString,
    guild: String,
    description: String,
    options: Object
})

const name = 'tyrcommands-slash-commands'

export = mongoose.models[name] || mongoose.model(name, schema, name)