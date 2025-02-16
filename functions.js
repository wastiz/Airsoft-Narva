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

module.exports = {transformData, getEventConfig};