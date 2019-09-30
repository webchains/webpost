const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');

const CategorySchema = new mongoose.Schema({
    id: String,
    category: String,
    hits: Number
}, {timestamps: {updatedAt: true, createdAt: true}, id: false});

CategorySchema.plugin(mongoosePaginate);
CategorySchema.index({id: 'text'});

const Category = mongoose.model('Category', CategorySchema);

module.exports = Category;