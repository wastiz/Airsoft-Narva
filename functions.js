const eventConfig = require('./configs/event-config.json');
const path = require("path");
const fs = require("fs");

function transformData(input) {
    const output = {};

    const convertDate = (date) => {
        const [year, month, day] = date.split('-');
        return `${day}.${month}.${year}`;
    };

    output["header"] = {
        "bg": input.bgname ? `img/event/${input.bgname}` : eventConfig.header.bg,
        "type": input.image ? "image" : (input.video ? "video" : "none"),
        "before-title": "Объявляем регистрацию на",
        "title": input.title,
        "after-title": convertDate(input.date) || "Дата не указана",
        "button": "Регистрация"
    };

    output["schedule"] = input.schedule;
    output["story"] = input.story;
    output["rules"] = input.rules;
    output["teams"] = input.teams;
    output["teamrestriction"] = parseInt(input.teamrestriction, 10) || null;

    output["dates-prices"] = input.pricing.map(item => {
        const formattedStartDate = item[0].split('-').reverse().join('.');
        const formattedEndDate = item[1].split('-').reverse().join('.');
        return `${formattedStartDate}-${formattedEndDate}-${item[2]}`;
    });

    return output;
}

function getEventConfig() {
    const filePath = path.join(__dirname, 'configs/event-config.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
}

// router.post('/submit-update-event', async (req, res) => {
//     try {
//         let { password, ...data } = req.body;
//
//         console.log("Данные команд с фронта:", data.teams); // Проверка данных команд
//
//         if (password === "1234") {
//             return res.status(405).json({ message: 'Пароль 1234 запрещен!' });
//         } else if (!password || password !== process.env.ADMIN_PASSWORD) {
//             console.log("Попытка с неверным паролем");
//             return res.status(403).json({ message: 'Доступ запрещён. Неверный пароль.' });
//         }
//
//         const imageFile = data["bg-file"];
//         if (imageFile) {
//             const base64Data = imageFile.split(',')[1];
//             const buffer = Buffer.from(base64Data, 'base64');
//             const uploadPath = path.join(__dirname, '..', 'public', 'img', 'event');
//
//             if (!fs.existsSync(uploadPath)) {
//                 fs.mkdirSync(uploadPath, { recursive: true });
//             }
//
//             const filename = data.bgname;
//             const filePath = path.join(uploadPath, filename);
//
//             fs.writeFile(filePath, buffer, (err) => {
//                 if (err) {
//                     console.error('Ошибка записи файла:', err);
//                     return res.status(500).json({ message: 'Ошибка сохранения изображения' });
//                 }
//
//                 const imageUrl = `public/img/event/${filename}`;
//                 console.log("Изображение успешно загружено");
//
//                 return res.json({ message: 'Изображение успешно загружено', imageUrl: imageUrl });
//             });
//         } else {
//             // Преобразуем данные
//             data = transformData(data);
//
//             const filePath = path.join(__dirname, '../configs/event-config.json');
//             const fileContent = await fs.promises.readFile(filePath, 'utf8');
//
//             const parsedContent = JSON.parse(fileContent);
//
//             if (data.teams) {
//                 parsedContent.teams = data.teams;
//             }
//
//             Object.assign(parsedContent, data);
//
//             await fs.promises.writeFile(filePath, JSON.stringify(parsedContent, null, 2), 'utf8');
//             console.log("Файл успешно обновлён");
//
//             return res.status(200).json({ message: 'Файл успешно обновлён.' });
//         }
//     } catch (error) {
//         console.error("Ошибка:", error);
//         return res.status(500).json({ message: 'Произошла ошибка на сервере.', error: error.message });
//     }
// });

module.exports = {transformData, getEventConfig};