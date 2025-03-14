const mongoose = require('mongoose');

const ENChaptersSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    novel: { type: mongoose.Schema.Types.ObjectId, ref: 'Novels', required: true },
    is_translated: { type: Boolean, default: false },
    source_url: { type: String, required: true },  // Kaynak URL (Veriyi kaynaktan tekrar çekmek gerekirse)
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ENChapters', ENChaptersSchema);
