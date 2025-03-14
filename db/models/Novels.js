const mongoose = require('mongoose');

const NovelsSchema = new mongoose.Schema({
    title: { type: String, required: true },
    summary: { type: String },
    cover_image: { type: String },  // Kapak görseli
    source_url: { type: String, required: true },  // Kaynak URL
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Novels', NovelsSchema);
