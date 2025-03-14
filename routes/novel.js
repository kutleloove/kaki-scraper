const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Novel = require('../db/models/Novels');
const ENChapter = require('../db/models/ENChapters');
const translateUntranslatedChapters = require('../middlewares/gpt-translate');

// Çeviriyi çalıştırmak için route ekleyelim
router.get('/translate', translateUntranslatedChapters, (req, res) => {
  res.send('Tüm çevrilmemiş bölümler başarıyla çevrildi.');
});

router.get('/status', async (req, res) => {
  try {
      const novelsDir = path.join(__dirname, '..', 'novels');
      const directories = fs.readdirSync(novelsDir, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name);

      const novelsStatus = [];

      for (const dir of directories) {
          const novelPath = path.join(novelsDir, dir);
          const novelFiles = fs.readdirSync(novelPath)
              .filter(file => path.extname(file) === '.txt');

          let novel = await Novel.findOne({ title: dir });

          if (!novel) {
              novelsStatus.push({
                  başlık: dir,
                  bölümler: {
                      yüklenmiş: 0,
                      yüklenmeyen: novelFiles.length,
                      yüklenecek: novelFiles.length
                  }
              });
              continue;
          }

          const uploadedChapters = await ENChapter.find({ novel: novel._id });

          const uploadedFiles = uploadedChapters.map(chapter => path.basename(chapter.source_url));

          const yüklenmiş = uploadedFiles.length;
          const yüklenmeyen = novelFiles.length - yüklenmiş;
          const yüklenecek = yüklenmeyen;

          novelsStatus.push({
              başlık: novel.title,
              bölümler: {
                  yüklenmiş,
                  yüklenmeyen,
                  yüklenecek
              }
          });
      }

      res.json({ noveller: novelsStatus });

  } catch (err) {
      console.error('Durum kontrol hatası:', err);
      res.status(500).json({ error: 'Error fetching novel status.' });
  }
});

router.post('/upload', async (req, res) => {
    try {
        const novelsDir = path.join(__dirname, '..', 'novels');
        const directories = fs.readdirSync(novelsDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        for (const dir of directories) {
            const novelPath = path.join(novelsDir, dir);
            const novelFiles = fs.readdirSync(novelPath);

            let novel = await Novel.findOne({ title: dir });

            // Eğer roman veritabanında yoksa, yeni roman ekleyelim
            if (!novel) {
                novel = new Novel({
                    title: dir,
                    source_url: `/${dir}`,
                });
                await novel.save();
                console.log(`Yeni novel oluşturuldu: ${dir}`);
            } else {
                console.log(`Novel zaten mevcut: ${dir}`);
            }

            for (const file of novelFiles) {
                const filePath = path.join(novelPath, file);

                if (path.extname(file) === '.txt') {
                    const existingChapter = await ENChapter.findOne({ source_url: filePath });

                    if (existingChapter) {
                        console.log(`Yüklendi (geçiliyor): ${file}`);
                        continue;
                    }

                    const content = fs.readFileSync(filePath, 'utf-8');
                    const chapterTitle = file.replace('.txt', '');

                    const chapter = new ENChapter({
                        title: chapterTitle,
                        content: content,
                        source_url: filePath, // Dosya yolu kaydediliyor
                        novel: novel._id
                    });

                    await chapter.save();
                    console.log(`Yeni bölüm kaydedildi: ${file}`);
                }
            }

            console.log(`Tamamlandı: ${dir}`);
        }

        res.json({ message: 'Novels and chapters successfully uploaded.' });
    } catch (err) {
        console.error('Yükleme hatası:', err);
        res.status(500).json({ error: 'Error uploading novels and chapters.' });
    }
});

module.exports = router;
