const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');

const CategorySchema = new mongoose.Schema({
    category: String,
    hit: Number,
    count: Number,
    timestamp: Number,
    popular: Number,
    updated: Number
}, {id: false});

CategorySchema.plugin(mongoosePaginate);
CategorySchema.index({id: 'text'});

const Category = mongoose.model('Category', CategorySchema);

module.exports = Category;