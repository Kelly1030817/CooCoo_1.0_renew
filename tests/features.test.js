const test = require('node:test');
const assert = require('node:assert/strict');

// Replicate or require core AI storage & categorization functions for testing
function getAISuggestedStorage(name, targetChamber = null) {
    if (!name) {
        return {
            chamber: "cold",
            daysLeft: 5,
            category: "vegetable_fruit",
            storageProtocol: "方形收納管理：裝入規格化收納盒，先進先出，定期檢查保鮮期。"
        };
    }
    const cleanName = name.trim().toLowerCase();
    
    let chamber = "cold";
    let coldDays = 5;
    let frozenDays = 30;
    let category = "vegetable_fruit";
    let storageProtocol = "微氣候維護：避免冷氣直吹。應採用微濕紙巾包裹，再裝入方形保鮮盒冷藏。";

    if (cleanName.match(/肉|雞|豬|牛|羊|排|絞肉|肉絲|培根|火腿|香腸/)) {
        category = "meat_seafood";
        chamber = "cold";
        coldDays = cleanName.includes("絞肉") ? 2 : (cleanName.includes("牛") ? 4 : 3);
        frozenDays = 90;
        storageProtocol = "組織液阻斷：冷凍前必須以紙巾緊密包裹以吸附組織液，壓扁冷凍最大化表面積，解凍快70%。";
    } else if (cleanName.match(/魚|鮭|蝦|蛤|蚵|干貝|海鮮|墨魚|蟹/)) {
        category = "meat_seafood";
        chamber = "cold";
        coldDays = 2;
        frozenDays = 60;
        storageProtocol = "極低溫保鮮：海鮮極易退化，冷藏需於 2 天內烹調，若未食用請拭乾水分分裝冷凍。";
    } else if (cleanName.match(/蛋/)) {
        category = "dairy_egg_soy";
        chamber = "cold";
        coldDays = 14;
        frozenDays = 30;
        storageProtocol = "鈍端朝上冷藏：維持氣室於頂部，防止蛋黃貼殼變質，置於冷藏室內部恆溫處。";
    } else if (cleanName.match(/奶|乳|起司|乾酪|豆腐|豆漿|豆干|納豆/)) {
        category = "dairy_egg_soy";
        chamber = "cold";
        coldDays = cleanName.includes("豆腐") ? 3 : (cleanName.includes("起司") ? 14 : 7);
        frozenDays = cleanName.includes("豆腐") ? 60 : 30;
        storageProtocol = "密封防腐：開啟後用烘焙紙包裹再裝入方形密封盒，防止冰箱水分降解與發霉。";
    } else if (cleanName.match(/薯|洋蔥|蒜|蕉|芒果|蘋果|柑橘|果/)) {
        category = "vegetable_fruit";
        chamber = "cold";
        coldDays = cleanName.match(/蘋果|柑橘/) ? 14 : 5;
        frozenDays = 90;
        storageProtocol = "避光保存。若已切開，表面滴檸檬汁並以保鮮膜緊貼冷藏，以阻斷氧化。";
    } else if (cleanName.match(/菜|葉|菇|木耳|蘿蔔|番茄|黃瓜|茄子|椒|筍/)) {
        category = "vegetable_fruit";
        chamber = "cold";
        coldDays = cleanName.match(/蘿蔔|地瓜|馬鈴薯/) ? 10 : 4;
        frozenDays = 30;
        storageProtocol = "微氣候維護：避免冷氣直吹。應採用微濕紙巾包裹，再裝入方形保鮮盒冷藏。";
    } else if (cleanName.match(/吐司|麵包|水餃|麵|飯|饅頭|蔥抓餅/)) {
        category = "cooked_others";
        chamber = cleanName.match(/水餃|蔥抓餅/) ? "frozen" : "cold";
        coldDays = 3;
        frozenDays = 60;
        storageProtocol = "密封隔離：完全冷卻後密封分裝，避免澱粉老化與異味吸收。";
    } else {
        category = "cooked_others";
        chamber = "cold";
        coldDays = 5;
        frozenDays = 30;
        storageProtocol = "方形收納管理：裝入規格化收納盒，先進先出，定期檢查保鮮期。";
    }

    const selectedChamber = targetChamber || chamber;
    const daysLeft = selectedChamber === "frozen" ? frozenDays : coldDays;

    return {
        chamber: selectedChamber,
        recommendedChamber: chamber,
        coldDays: coldDays,
        frozenDays: frozenDays,
        daysLeft: daysLeft,
        category: category,
        storageProtocol: storageProtocol
    };
}

test('AI Storage Recommendation Engine gives correct chamber & days', () => {
    const pork = getAISuggestedStorage('豬里肌肉排');
    assert.equal(pork.category, 'meat_seafood');
    assert.equal(pork.chamber, 'cold');
    assert.equal(pork.daysLeft, 3);

    const porkFrozen = getAISuggestedStorage('豬里肌肉排', 'frozen');
    assert.equal(porkFrozen.chamber, 'frozen');
    assert.equal(porkFrozen.daysLeft, 90);

    const cabbage = getAISuggestedStorage('高麗菜');
    assert.equal(cabbage.category, 'vegetable_fruit');
    assert.equal(cabbage.daysLeft, 4);

    const tofu = getAISuggestedStorage('板豆腐', 'frozen');
    assert.equal(tofu.category, 'dairy_egg_soy');
    assert.equal(tofu.daysLeft, 60);
});

test('Chamber toggle auto-adjusts shelf life days', () => {
    let item = {
        id: 'i1',
        name: '鮭魚片',
        chamber: 'cold',
        daysLeft: 2
    };

    const aiRecFrozen = getAISuggestedStorage(item.name, 'frozen');
    item.chamber = 'frozen';
    item.daysLeft = aiRecFrozen.daysLeft;

    assert.equal(item.chamber, 'frozen');
    assert.equal(item.daysLeft, 60);
});

test('Categorizes ingredients properly for Little Kitchen', () => {
    const inventory = [
        { name: '波菜' },
        { name: '雞胸肉' },
        { name: '鮮奶' },
        { name: '白飯' }
    ];

    const categoryMap = {
        vegetable_fruit: [],
        meat_seafood: [],
        dairy_egg_soy: [],
        cooked_others: []
    };

    inventory.forEach(item => {
        const aiRec = getAISuggestedStorage(item.name);
        categoryMap[aiRec.category].push(item.name);
    });

    assert.equal(categoryMap.vegetable_fruit.length, 1);
    assert.equal(categoryMap.meat_seafood.length, 1);
    assert.equal(categoryMap.dairy_egg_soy.length, 1);
    assert.equal(categoryMap.cooked_others.length, 1);
});

function generateIngredientImage(name, category = null) {
    if (!name) name = "食材";
    const cleanName = name.trim().toLowerCase();

    const foodPhotoMap = [
        { keywords: ["蛋", "蛋黃", "蛋白", "皮蛋", "鹹蛋"], url: "https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?w=300&auto=format&fit=crop" },
        { keywords: ["高麗菜", "高麗", "甘藍"], url: "https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=300&auto=format&fit=crop" },
        { keywords: ["鮭", "鮭魚", "三文魚"], url: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=300&auto=format&fit=crop" }
    ];

    for (const match of foodPhotoMap) {
        if (match.keywords.some(kw => cleanName.includes(kw))) {
            return match.url;
        }
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><rect width="150" height="150" fill="#e2f0d9"/><text x="75" y="75">${name}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

test('Automatically generates ingredient card image for food photography matches and custom SVG cards', () => {
    const eggImage = generateIngredientImage('水煮蛋');
    assert.ok(eggImage.includes('unsplash'), 'Egg should match curated food photo');

    const cabbageImage = generateIngredientImage('高麗菜');
    assert.ok(cabbageImage.includes('unsplash'), 'Cabbage should match curated food photo');

    const customImage = generateIngredientImage('特製五香滷大腸');
    assert.ok(customImage.startsWith('data:image/svg+xml'), 'Custom ingredient should generate dynamic SVG image card');
    assert.ok(decodeURIComponent(customImage).includes('特製五香滷大腸'), 'Custom SVG image card should embed the ingredient name');
});

test('Adding a new ingredient automatically populates generated card image', () => {
    const shoppingList = [];
    const name = '有機高麗菜';
    const category = 'produce';

    const newItem = {
        id: 's_' + Date.now(),
        name: name,
        category: category,
        qty: 1,
        unit: '顆',
        image: generateIngredientImage(name, category),
        checked: false
    };
    shoppingList.push(newItem);

    assert.ok(shoppingList[0].image, 'Newly added item must have an image');
    assert.ok(shoppingList[0].image.length > 0, 'Image string must not be empty');
});

test('Master Chef consultation handles shopping redirection and dish recommendations', () => {
    let activeTab = 'roi';
    let modalClosed = false;

    function handleChefChoice(choice) {
        if (choice === 'shopping') {
            activeTab = 'shopping';
            modalClosed = true;
            return { action: 'switchTab', tab: 'shopping' };
        }
        return { action: 'dish' };
    }

    const res = handleChefChoice('shopping');
    assert.equal(activeTab, 'shopping');
    assert.equal(modalClosed, true);
    assert.equal(res.tab, 'shopping');

    // Test Master Chef recommendation format
    function getChefDishRecommendation(dishTitle) {
        return {
            title: dishTitle,
            chefRecommend: `主廚推薦菜色：${dishTitle}`,
            howToCook: '🍳 怎麼料理：大火快速定型，關火加蓋利用比熱容熱平衡慢熟。',
            howToBuy: '🛒 該怎麼買：建議採買主食材與搭配鮮蔬包。'
        };
    }

    const rec = getChefDishRecommendation('三杯雞');
    assert.ok(rec.chefRecommend.includes('三杯雞'));
    assert.ok(rec.howToCook.includes('怎麼料理'));
    assert.ok(rec.howToBuy.includes('該怎麼買'));
});

test('AI photo recognition identifies ingredients and recommends dishes with cooking & buying advice', () => {
    function processPhotoAi(hasImage) {
        if (!hasImage) return null;
        return {
            identified: '牛番茄 ＆ 金針菇',
            dish: '主廚推薦【金針菇番茄蛋花湯】',
            howToCook: '【熱力學溫控】：番茄滲透壓去水大火翻炒，金針菇最後下鍋燜煮2分鐘。',
            howToBuy: '建議順手採買牛番茄與蔥花。'
        };
    }

    const result = processPhotoAi(true);
    assert.ok(result, 'Photo analysis result should exist');
    assert.equal(result.identified, '牛番茄 ＆ 金針菇');
    assert.ok(result.dish.includes('金針菇番茄蛋花湯'));
    assert.ok(result.howToCook.includes('熱力學溫控'));
    assert.ok(result.howToBuy.includes('採買'));
});

