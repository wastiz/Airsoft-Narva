document.addEventListener('DOMContentLoaded', function () {

    const imageRadio = document.querySelector('#event-image');
    const videoRadio = document.querySelector('#event-video');
    const imageFileInput = document.querySelector('#event-image-file');
    const videoFileInput = document.querySelector('#event-video-file');

    const toggleFileInputs = () => {
        if (imageRadio.checked) {
            imageFileInput.disabled = false;
            videoFileInput.disabled = true;
        } else if (videoRadio.checked) {
            imageFileInput.disabled = true;
            videoFileInput.disabled = false;
        }
    };

    toggleFileInputs();

    imageRadio.addEventListener('change', toggleFileInputs);
    videoRadio.addEventListener('change', toggleFileInputs);

    let ruleListCounter = 0;
    let ruleItemCounter = 0;
    let teamCounter = 0;

    function addRuleList() {
        ruleListCounter++;
        const newRuleList = `
            <div class="rule-list-item" id="rule-list-item-${ruleListCounter}">
                <label for="rule-title-${ruleListCounter}">Название списка правил</label>
                <input id="rule-title-${ruleListCounter}" type="text" placeholder="Название списка правил">
                <div class="rule-items d-flex flex-col mb-20">
                    <label for="rule-item-${ruleListCounter}-1">Правило 1</label>
                    <div class="input-item">
                        <input class="rule-input" id="rule-item-${ruleListCounter}-1" type="text" placeholder="Текст правила">
                        <span class="remove-item" onclick="removeRuleItem(${ruleListCounter}, 1)" title="Удалить правило">&times;</span>
                    </div>
                </div>
                <button type="button" onclick="addRuleItem(${ruleListCounter})">Добавить правило</button>
                <button class="remove-item-btn" onclick="removeRuleList(${ruleListCounter})" title="Удалить список правил">Удалить список</button>
            </div>
        `;
        document.getElementById('rules-list').insertAdjacentHTML('beforeend', newRuleList);
    }

    function addRuleItem(ruleListId) {
        ruleItemCounter++;
        const newRuleItem = `
            <div id="rule-item-${ruleListId}-${ruleItemCounter}">
                <label for="rule-item-${ruleListId}-${ruleItemCounter}">Правило ${ruleItemCounter}</label>
                <div class="input-item">
                    <input class="rule-input" id="rule-item-${ruleListId}-${ruleItemCounter}" type="text" placeholder="Текст правила">
                    <span class="remove-item" onclick="removeRuleItem(${ruleListId}, ${ruleItemCounter})" title="Удалить правило">&times;</span>
                </div>
            </div>
        `;
        const ruleListItem = document.getElementById(`rule-list-item-${ruleListId}`);
        if (ruleListItem) {
            ruleListItem.querySelector('.rule-items').insertAdjacentHTML('beforeend', newRuleItem);
        } else {
            console.error('Element not found:', `rule-list-item-${ruleListId}`);
        }
    }

    function removeRuleItem(ruleListId, ruleItemIndex) {
        const ruleItem = document.getElementById(`rule-item-${ruleListId}-${ruleItemIndex}`);
        if (ruleItem) {
            ruleItem.remove();
        } else {
            console.error('Элемент не найден:', `rule-item-${ruleListId}-${ruleItemIndex}`);
        }
    }

    function removeRuleList(ruleListId) {
        const ruleListItem = document.getElementById(`rule-list-item-${ruleListId}`);
        if (ruleListItem) {
            ruleListItem.remove();
        } else {
            console.error('Элемент не найден:', `rule-list-item-${ruleListId}`);
        }
    }

    function addTeam() {
        teamCounter++;
        const newTeam = `
        <div class="team-list-item" id="team-list-item-${teamCounter}">
            <label for="team-id-${teamCounter}">id команды</label>
            <input id="team-id-${teamCounter}" type="text" placeholder="id команды">
    
            <label for="team-name-${teamCounter}">Название команды</label>
            <input id="team-name-${teamCounter}" type="text" placeholder="Название команды">
    
            <label for="team-description-${teamCounter}">Описание</label>
            <textarea id="team-description-${teamCounter}" rows="1" placeholder="Описание команды..."></textarea>
    
            <input class="form-check-input" type="checkbox" value="" id="disable-team-${teamCounter}">
            <label class="form-check-label" for="disable-team-${teamCounter}">
                Закрыть команду
            </label>
            <span class="remove-item" onclick="removeTeam(${teamCounter})" title="Удалить команду">&times;</span>
        </div>
        `;
        document.getElementById('teams-list').insertAdjacentHTML('beforeend', newTeam);
    }

    function removeTeam(teamIndex) {
        const teamItem = document.getElementById(`team-list-item-${teamIndex}`);
        if (teamItem) {
            teamItem.remove();
        } else {
            console.error('Элемент не найден:', `team-list-item-${teamIndex}`);
        }
    }

    window.addRuleList = addRuleList;
    window.addRuleItem = addRuleItem;
    window.removeRuleItem = removeRuleItem;
    window.removeRuleList = removeRuleList;
    window.addTeam = addTeam;
    window.removeTeam = removeTeam;

    document.querySelectorAll('.team-list-item').forEach((item, index) => {
        teamCounter = Math.max(teamCounter, index + 1);
    });

    const textHandler = document.getElementById('text-handler');

    document.querySelector('form').addEventListener('submit', function (event) {
        event.preventDefault();
        textHandler.innerText = 'Обрабатываем...';

        let fileName = '';

        if (document.getElementById('event-image-file').files.length > 0) {
            fileName = document.getElementById('event-image-file').files[0].name;
        }

        const eventData = {
            title: document.getElementById('event-title').value,
            date: document.getElementById('event-date').value,
            image: document.getElementById('event-image').checked,
            video: document.getElementById('event-video').checked,
            bgname: fileName,
            schedule: {
                arrival: document.getElementById('event-arrival').value,
                briefing: document.getElementById('event-briefing').value,
                start: document.getElementById('event-start').value,
                end: document.getElementById('event-end').value,
                afterparty: document.getElementById('event-afterparty').value
            },
            story: document.getElementById('event-story').value,
            rules: gatherRules(),
            teams: gatherTeams(),
            teamrestriction: document.getElementById('team-restriction').value,
            pricing: gatherPricing(),
            password: document.getElementById('update-password').value,
            active: document.getElementById('event-active').checked
        };

        const imageFile = document.getElementById('event-image-file').files[0];
        const videoFile = document.getElementById('event-video-file').files[0];

        const promises = [];

        if (imageFile) {
            promises.push(new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = function() {
                    eventData['bg-file'] = reader.result;
                    resolve();
                };
                reader.onerror = reject;
                reader.readAsDataURL(imageFile);
            }));
        }

        if (videoFile) {
            promises.push(new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = function() {
                    eventData['bg-file'] = reader.result;
                    resolve();
                };
                reader.onerror = reject;
                reader.readAsDataURL(videoFile);
            }));
        }

        Promise.all(promises).then(() => {
            sendData(eventData);
        }).catch((error) => {
            textHandler.innerText = 'Ошибка при загрузке файлов.';
            console.error('Ошибка при чтении файлов:', error);
        });
    });

    function sendData(eventData) {
        fetch('admin/submit-update-event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventData)
        })
            .then(response => {
                if (response.ok) {
                    textHandler.innerText = "Заебца"
                } else if (response.status === 403) {
                    textHandler.innerText = "Введите пароль (1234)"
                } else if (response.status === 405) {
                    textHandler.innerText = "Серьезно?...";
                }
            })
            .catch((error) => {
                textHandler.innerText = 'Бля, ошибка. Вперед разносить мой тг';
                console.error('Error:', error);
                alert('Ошибка при обновлении ивента.');
            });
    }

    function gatherRules() {
        const rules = {};
        document.querySelectorAll('.rule-list-item').forEach(function (listItem) {
            const listTitle = listItem.querySelector('input[type="text"]').value;
            const ruleItems = [];
            listItem.querySelectorAll('.rule-items input').forEach(function (input) {
                ruleItems.push(input.value);
            });
            rules[listTitle] = ruleItems;
        });
        return rules;
    }

    function gatherTeams() {
        const teams = [];
        document.querySelectorAll('.team-list-item').forEach(function (teamItem) {
            const teamId = teamItem.querySelector('input[type="text"]').value;
            const teamName = teamItem.querySelector('input[type="text"]:nth-of-type(2)').value;
            const teamDescription = teamItem.querySelector('textarea').value;
            const isDisabled = teamItem.querySelector('input[type="checkbox"]').checked;

            teams.push({
                id: teamId,
                name: teamName,
                description: teamDescription,
                isDisabled: isDisabled
            });
        });

        return teams;
    }

    function gatherPricing() {
        const pricing = [];
        document.querySelectorAll('.pricing-section').forEach(function (priceItem) {
            const dateInputs = priceItem.querySelectorAll('input[type="date"]');
            const priceInput = priceItem.querySelector('input[type="number"]');

            pricing.push([dateInputs[0].value, dateInputs[1].value, priceInput.value]);
        });
        return pricing;
    }
});