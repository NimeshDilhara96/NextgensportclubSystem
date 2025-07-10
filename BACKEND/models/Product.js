const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    category: String,
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    image: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
