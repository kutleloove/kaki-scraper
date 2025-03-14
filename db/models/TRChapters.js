const mongoose = require('mongoose');

const TRChaptersSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    novel: { type: mongoose.Schema.Types.ObjectId, ref: 'Novels', required: true },
    translated_at: { type: Date, default: Date.now }  // Çeviri tarihi
});

module.exports = mongoose.model('TRChapters', TRChaptersSchema);
