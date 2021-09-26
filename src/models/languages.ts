import mongoose, { Schema } from 'mongoose'

const reqString = {
    type: String,
    required: true
}

const schema = new Schema({
    // Guild ID
    _id: reqString,
    language: reqString
})

const name = 'tyrcommands-languages'

export = mongoose.models[name] || mongoose.model(name, schema, name)