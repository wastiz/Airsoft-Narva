const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const {transformData} = require("../functions");

router.post('/submit-update-event', async (req, res) => {
    try {
        let { password, ...data } = req.body;

        if (password === "1234") {
            return res.status(405).json({ message: 'Пароль 1234 запрещен!' });
        } else if (!password || password !== process.env.ADMIN_PASSWORD) {
            console.log("Попытка с неверным паролем");
            return res.status(403).json({ message: 'Доступ запрещён. Неверный пароль.' });
        }

        console.log(data)
        const imageFile = data["bg-file"]
        if (imageFile) {
            const base64Data = imageFile.split(',')[1];

            const buffer = Buffer.from(base64Data, 'base64');

            const uploadPath = path.join(__dirname, 'public', 'img', 'event');

            if (!fs.existsSync(uploadPath)) {
                fs.mkdirSync(uploadPath, { recursive: true });
            }

            const filename = data.bgname;
            const filePath = path.join(uploadPath, filename);

            fs.writeFile(filePath, buffer, (err) => {
                if (err) {
                    console.error('Ошибка записи файла:', err);
                    return res.status(500).json({ message: 'Ошибка сохранения изображения' });
                }
                const imageUrl = `public/img/event/${filename}`;

                res.json({ message: 'Изображение успешно загружено', imageUrl: imageUrl });
            });
        }

        data = transformData(data);

        const filePath = path.join(__dirname, 'configs/event-config.json');
        const fileContent = await fs.promises.readFile(filePath, 'utf8');

        const parsedContent = JSON.parse(fileContent);
        Object.assign(parsedContent, data);

        await fs.promises.writeFile(filePath, JSON.stringify(parsedContent, null, 2), 'utf8');
        console.log("Файл успешно обновлён");

        res.status(200).json({ message: 'Файл успешно обновлён.' });
    } catch (error) {
        console.error("Ошибка:", error);
        res.status(500).json({ message: 'Произошла ошибка на сервере.', error: error.message });
    }
});

module.exports = router;
