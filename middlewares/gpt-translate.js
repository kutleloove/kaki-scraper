const { OpenAI } = require("openai");
const ENChapter = require('../db/models/ENChapters');
const TRChapter = require('../db/models/TRChapters');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Çeviri fonksiyonu
async function translateToTurkish(text) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that translates English text to Turkish.' },
        { role: 'user', content: text },
      ],
    });

    return response.choices[0].message.content.trim();
  } catch (err) {
    console.error('Çeviri hatası:', err);
    throw new Error('Çeviri işlemi başarısız.');
  }
}

// Gelişmiş Çeviri Middleware
async function translateUntranslatedChapters(req, res, next) {
  const { novelId, chapterIds } = req.body; // İstekten novelId ve chapterIds alınır

  try {
    let filter = { is_translated: false };

    // Eğer spesifik bir novelId verilmişse filtreye ekle
    if (novelId) {
      filter.novel = novelId;
    }

    // Eğer spesifik chapterId'ler verilmişse filtreye ekle
    if (chapterIds && chapterIds.length > 0) {
      filter._id = { $in: chapterIds };
    }

    const untranslatedChapters = await ENChapter.find(filter);

    if (untranslatedChapters.length === 0) {
      return res.status(404).json({ message: 'Çevrilecek uygun bölüm bulunamadı.' });
    }

    for (const chapter of untranslatedChapters) {
      const englishTitle = chapter.title;
      const englishContent = chapter.content;

      // Çeviri işlemi
      const translatedTitle = await translateToTurkish(englishTitle);
      const translatedContent = await translateToTurkish(englishContent);

      // Yeni TRChapter kaydını oluşturuyoruz
      const trChapter = new TRChapter({
        title: translatedTitle,
        content: translatedContent,
        novel: chapter.novel,
        enchapter: chapter._id,
        translated_at: new Date(),
      });

      // TRChapter'ı kaydediyoruz
      await trChapter.save();
      console.log(`Bölüm başarıyla çevrildi: ${translatedTitle}`);

      // ENChapter'ı güncelliyoruz
      chapter.is_translated = true;
      await chapter.save();
    }

    next();

  } catch (err) {
    console.error('Çevirme işlemi sırasında hata:', err);
    res.status(500).json({ error: 'Çeviri işlemi sırasında bir hata oluştu.' });
  }
}

module.exports = translateUntranslatedChapters;
