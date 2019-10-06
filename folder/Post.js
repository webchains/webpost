const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');

const PostSchema = new mongoose.Schema({
    id: String,
    user: String,
    userid: String,
    postid: String,
    text: mongoose.SchemaTypes.Mixed,
    media: String,
    size: Number,
    timestamp: Number,
    category: String,
    replies: Array,
    interests: Array,
    popular: Number,
    updated: Number
}, {timestamps: {createdAt: true}, id: false});

PostSchema.plugin(mongoosePaginate);
PostSchema.index({id: 'text'});

const Post = mongoose.model('Post', PostSchema);

module.exports = Post;