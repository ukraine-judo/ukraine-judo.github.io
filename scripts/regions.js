// Regions Page JavaScript

// Region data with Ukrainian oblast information
const regionsData = {
    chernigov: {
        id: 'chernigov',
        name: 'Чернігівська область',
        nameEn: 'Chernihiv Oblast',
        capital: 'Чернігів',
        zone: 'north',
        clubs: 12,
        athletes: 345,
        president: 'Іванов Петро Миколайович',
        phone: '+38 (04622) 3-45-67',
        email: 'chernigiv@judo.org.ua',
        website: 'chernigiv-judo.org.ua',
        address: 'м. Чернігів, вул. Спортивна, 15',
        established: 1995,
        description: 'Чернігівська обласна федерація дзюдо активно розвиває дзюдо в північних регіонах України.',
        achievements: ['5 майстрів спорту міжнародного класу', 'Переможці молодіжних змагань', 'Розвиток дитячого дзюдо'],
        available: true
    },
    volun: {
        id: 'volun',
        name: 'Волинська область',
        nameEn: 'Volyn Oblast',
        capital: 'Луцьк',
        zone: 'west',
        clubs: 18,
        athletes: 523,
        president: 'Петренко Ольга Василівна',
        phone: '+38 (03322) 5-67-89',
        email: 'volyn@judo.org.ua',
        website: 'volyn-judo.org.ua',
        address: 'м. Луцьк, вул. Олімпійська, 8',
        established: 1992,
        description: 'Волинська федерація дзюдо - одна з найактивніших в західному регіоні України.',
        achievements: ['Чемпіони України', '3 учасники Олімпійських ігор', 'Розвинена система підготовки кадрів'],
        available: true
    },
    rivne: {
        id: 'rivne',
        name: 'Рівненська область',
        nameEn: 'Rivne Oblast',
        capital: 'Рівне',
        zone: 'west',
        clubs: 15,
        athletes: 456,
        president: 'Сидоренко Микола Петрович',
        phone: '+38 (0362) 4-56-78',
        email: 'rivne@judo.org.ua',
        website: 'rivne-judo.org.ua',
        address: 'м. Рівне, вул. Героїв Майдану, 22',
        established: 1994,
        description: 'Рівненська обласна федерація дзюдо забезпечує розвиток спорту в регіоні.',
        achievements: ['Призери чемпіонатів Європи', 'Молодіжні таланти', 'Міжнародна співпраця'],
        available: true
    },
    zhytomir: {
        id: 'zhytomir',
        name: 'Житомирська область',
        nameEn: 'Zhytomyr Oblast',
        capital: 'Житомир',
        zone: 'north',
        clubs: 14,
        athletes: 398,
        president: 'Коваленко Андрій Іванович',
        phone: '+38 (0412) 3-78-90',
        email: 'zhytomyr@judo.org.ua',
        website: 'zhytomyr-judo.org.ua',
        address: 'м. Житомир, вул. Космонавтів, 11',
        established: 1993,
        description: 'Житомирська федерація розвиває дзюдо та виховує майбутніх чемпіонів.',
        achievements: ['Майстри спорту України', 'Юнацькі чемпіони', 'Спортивні школи'],
        available: true
    },
    kievskya: {
        id: 'kievskya',
        name: 'Київська область',
        nameEn: 'Kyiv Oblast',
        capital: 'Біла Церква',
        zone: 'central',
        clubs: 35,
        athletes: 1245,
        president: 'Бондаренко Світлана Олександрівна',
        phone: '+38 (04563) 2-34-56',
        email: 'kyivska@judo.org.ua',
        website: 'kyivska-judo.org.ua',
        address: 'м. Біла Церква, вул. Соборна, 45',
        established: 1990,
        description: 'Київська обласна федерація - одна з найбільших та найуспішніших в Україні.',
        achievements: ['Олімпійські чемпіони', 'Центр підготовки збірної', 'Міжнародні турніри'],
        available: true
    },
    kiev: {
        id: 'kiev',
        name: 'м. Київ',
        nameEn: 'Kyiv City',
        capital: 'Київ',
        zone: 'central',
        clubs: 42,
        athletes: 1890,
        president: 'Мельник Володимир Сергійович',
        phone: '+38 (044) 123-45-67',
        email: 'kyiv@judo.org.ua',
        website: 'kyiv-judo.org.ua',
        address: 'м. Київ, вул. Хрещатик, 1',
        established: 1988,
        description: 'Київська міська федерація дзюдо - центр розвитку дзюдо в Україні.',
        achievements: ['База національної збірної', 'Олімпійські медалісти', 'Провідні тренери'],
        available: true
    },
    cherkassy: {
        id: 'cherkassy',
        name: 'Черкаська область',
        nameEn: 'Cherkasy Oblast',
        capital: 'Черкаси',
        zone: 'central',
        clubs: 16,
        athletes: 467,
        president: 'Гриценко Тетяна Миколаївна',
        phone: '+38 (0472) 5-67-89',
        email: 'cherkasy@judo.org.ua',
        website: 'cherkasy-judo.org.ua',
        address: 'м. Черкаси, вул. Сміляна, 28',
        established: 1992,
        description: 'Черкаська федерація активно розвиває дзюдо в центральному регіоні.',
        achievements: ['Призери України', 'Молодіжний спорт', 'Регіональні турніри'],
        available: true
    },
    vinnitsya: {
        id: 'vinnitsya',
        name: 'Вінницька область',
        nameEn: 'Vinnytsia Oblast',
        capital: 'Вінниця',
        zone: 'central',
        clubs: 19,
        athletes: 578,
        president: 'Ткаченко Олексій Вікторович',
        phone: '+38 (0432) 6-78-90',
        email: 'vinnytsia@judo.org.ua',
        website: 'vinnytsia-judo.org.ua',
        address: 'м. Вінниця, вул. Соборна, 33',
        established: 1991,
        description: 'Вінницька федерація забезпечує високий рівень підготовки спортсменів.',
        achievements: ['Чемпіони України', 'Міжнародні успіхи', 'Розвиток інфраструктури'],
        available: true
    },
    kirovograd: {
        id: 'kirovograd',
        name: 'Кіровоградська область',
        nameEn: 'Kirovohrad Oblast',
        capital: 'Кропивницький',
        zone: 'central',
        clubs: 13,
        athletes: 389,
        president: 'Шевченко Ігор Олександрович',
        phone: '+38 (0522) 4-56-78',
        email: 'kirovohrad@judo.org.ua',
        website: 'kirovohrad-judo.org.ua',
        address: 'м. Кропивницький, вул. Велика Перспективна, 19',
        established: 1994,
        description: 'Кіровоградська федерація розвиває дзюдо в центральній Україні.',
        achievements: ['Талановита молодь', 'Регіональні чемпіонати', 'Підготовка кадрів'],
        available: true
    },
    poltava: {
        id: 'poltava',
        name: 'Полтавська область',
        nameEn: 'Poltava Oblast',
        capital: 'Полтава',
        zone: 'central',
        clubs: 17,
        athletes: 498,
        president: 'Кравченко Наталія Петрівна',
        phone: '+38 (0532) 7-89-01',
        email: 'poltava@judo.org.ua',
        website: 'poltava-judo.org.ua',
        address: 'м. Полтава, вул. Європейська, 12',
        established: 1993,
        description: 'Полтавська федерація активно працює над розвитком дзюдо в регіоні.',
        achievements: ['Успішні спортсмени', 'Молодіжні програми', 'Спортивні досягнення'],
        available: true
    },
    sumy: {
        id: 'sumy',
        name: 'Сумська область',
        nameEn: 'Sumy Oblast',
        capital: 'Суми',
        zone: 'north',
        clubs: 11,
        athletes: 321,
        president: 'Лисенко Сергій Миколайович',
        phone: '+38 (0542) 8-90-12',
        email: 'sumy@judo.org.ua',
        website: 'sumy-judo.org.ua',
        address: 'м. Суми, вул. Покровська, 25',
        established: 1995,
        description: 'Сумська федерація забезпечує розвиток дзюдо в північно-східному регіоні.',
        achievements: ['Регіональні лідери', 'Дитячий спорт', 'Тренерська школа'],
        available: true
    },
    kharkiv: {
        id: 'kharkiv',
        name: 'Харківська область',
        nameEn: 'Kharkiv Oblast',
        capital: 'Харків',
        zone: 'east',
        clubs: 35,
        athletes: 1200,
        president: 'Василенко Артем Володимирович',
        honoraryPresident: 'Каратуманов Олег Юрійович',
        phone: '+380634389778',
        email: 'judokh057@gmail.com',
        website: 'https://judo057.org/',
        facebook: 'https://www.facebook.com/judo.kh057',
        instagram: 'https://www.instagram.com/judo.kh057',
        address: 'м. Харків, вул. Римарська, 23',
        established: 1989,
        description: 'Харківська обласна федерація боротьби дзюдо - один з провідних центрів дзюдо в східній Україні з розвиненою інфраструктурою та потужною системою підготовки спортсменів.',
        achievements: [
            'Підготовка 40+ майстрів спорту та 300+ кандидатів в майстри спорту',
            'Вихованці МСМК: Дмитро Кальченко, Артем Василенко, Костянтин Ананченко',
            'Заслужений майстер спорту Дмитро Селезень',
            'Щорічний Всеукраїнський турнір "Золота осінь"',
            'Комплексна освітня програма (спортивні класи)',
            'Понад 500 дітей та підлітків займаються дзюдо'
        ],
        organizations: [
            {
                name: 'Дитяча школа дзюдо "ЦЕНТР"',
                address: 'м. Харків, вул. Лермонтовська, 15/17 (педагогічний ліцей №4)',
                phones: ['(098) 555-88-23', '(095) 322-32-61'],
                email: 'judo.krivchach@gmail.com',
                website: 'www.judo.org.ua',
                headCoach: 'Кривчач Виктор Константинович',
                coaches: ['Рисенков О.Ю.', 'Мамедов О.А.', 'Синюков Є.В.'],
                description: 'Проводить навчання класичному дзюдо дітей з 6 років. Реалізує комплексну освітню програму (спортивні класи). Організатор щорічного Всеукраїнського турніру "Золота осінь".',
                tournament: 'www.ma.judo.org.ua'
            },
            {
                name: 'Харківське державне вище училище фізичної культури №1',
                address: 'м. Харків, вул. Фронтова, 3',
                phone: '+38 057 343-11-32',
                email: 'hdvufk1@vnzkh.org.ua',
                website: 'https://hgvufk1.org.ua',
                director: 'Коржилов Ігор Михайлович',
                headCoach: 'Бакшенев Олександр Миколайович',
                coaches: ['Маханьков Г.І.', 'Величко В.В.', 'Цигичко Ю.Г.']
            },
            {
                name: 'Клуб ім. Євгена Тешера "САМБІСТ-84"',
                address: 'м. Харків, вул. Світла, 15 (ЗОШ №84)',
                phones: ['050-970-07-22', '098-592-09-89', '093-401-61-82'],
                email: '84sambist@gmail.com',
                website: 'www.judo-sambo.com.ua',
                coach: 'Швачко Євген Олександрович'
            },
            {
                name: 'СК "Клуб дзюдо ім. А.С. Макаренко"',
                address: 'м. Харків, вул. Амосова, 20 (Харківська гімназія №14)',
                phones: ['(095) 250-13-29', '(098) 380-41-71'],
                email: 'judoclmakarenko@mail.ru',
                website: 'www.judomakarenko.com',
                coaches: ['Макаренко Володимир Іванович', 'Оберемок Роман Ігорович']
            },
            {
                name: 'СК ДЗЮДО "СЛОБОЖАНЕЦЬ"',
                address: 'м. Харків, вул. Луї Пастера, 179-а',
                phones: ['(063) 723 41 92', '(067) 286 77 93'],
                website: 'www.sloboganec.at.ua',
                coaches: ['Маханьков Г.І.', 'Наливайченко М.О.', 'Величко В.В.'],
                description: 'Знаходиться на базі Палацу спорту "Зміна". Близько 500 дітей і підлітків. Підготував 40 майстрів спорту та близько 300 кандидатів в майстри спорту.',
                famousAthletes: 'МСМК Дмитро Кальченко, Артем Василенко, Костянтин Ананченко, ЗМС Дмитро Селезень'
            }
        ],
        leaderImage: 'assets/region/Kharkov-leader.jpg',
        available: true
    },
    dnepr: {
        id: 'dnepr',
        name: 'Дніпропетровська область',
        nameEn: 'Dnipropetrovsk Oblast',
        capital: 'Дніпро',
        zone: 'east',
        clubs: 31,
        athletes: 923,
        president: 'Савченко Олена Вікторівна',
        phone: '+38 (056) 234-56-78',
        email: 'dnipro@judo.org.ua',
        website: 'dnipro-judo.org.ua',
        address: 'м. Дніпро, вул. Європейська, 5',
        established: 1990,
        description: 'Дніпропетровська федерація - потужний центр розвитку дзюдо.',
        achievements: ['Чемпіони світу', 'Сучасна база', 'Міжнародне визнання'],
        available: true
    },
    zaporizhia: {
        id: 'zaporizhia',
        name: 'Запорізька область',
        nameEn: 'Zaporizhzhia Oblast',
        capital: 'Запоріжжя',
        zone: 'south',
        clubs: 22,
        athletes: 634,
        president: 'Романенко Віктор Сергійович',
        phone: '+38 (061) 345-67-89',
        email: 'zaporizhzhia@judo.org.ua',
        website: 'zaporizhzhia-judo.org.ua',
        address: 'м. Запоріжжя, пр. Соборний, 87',
        established: 1991,
        description: 'Запорізька федерація активно розвиває дзюдо в південно-східному регіоні.',
        achievements: ['Паралімпійські чемпіони', 'Інклюзивний спорт', 'Соціальні програми'],
        available: true
    },
    kherson: {
        id: 'kherson',
        name: 'Херсонська область',
        nameEn: 'Kherson Oblast',
        capital: 'Херсон',
        zone: 'south',
        clubs: 8,
        athletes: 234,
        president: 'Данилов Андрій Миколайович',
        phone: '+38 (0552) 4-56-78',
        email: 'kherson@judo.org.ua',
        website: 'kherson-judo.org.ua',
        address: 'м. Херсон, вул. Ушакова, 14',
        established: 1996,
        description: 'Херсонська федерація працює над відновленням та розвитком дзюдо.',
        achievements: ['Відновлення після війни', 'Підтримка спортсменів', 'Патріотичне виховання'],
        available: false // Temporarily unavailable due to war
    },
    mykolaiv: {
        id: 'mykolaiv',
        name: 'Миколаївська область',
        nameEn: 'Mykolaiv Oblast',
        capital: 'Миколаїв',
        zone: 'south',
        clubs: 12,
        athletes: 367,
        president: 'Морозов Олександр Вікторович',
        phone: '+38 (0512) 5-67-89',
        email: 'mykolaiv@judo.org.ua',
        website: 'mykolaiv-judo.org.ua',
        address: 'м. Миколаїв, вул. Адмірала Макарова, 8',
        established: 1994,
        description: 'Миколаївська федерація продовжує роботу в складних умовах.',
        achievements: ['Морський дзюдо клуб', 'Військово-патріотичне виховання', 'Підтримка ветеранів'],
        available: true
    },
    odessa: {
        id: 'odessa',
        name: 'Одеська область',
        nameEn: 'Odesa Oblast',
        capital: 'Одеса',
        zone: 'south',
        clubs: 26,
        athletes: 789,
        president: 'Іванова Марина Олександрівна',
        phone: '+38 (048) 678-90-12',
        email: 'odesa@judo.org.ua',
        website: 'odesa-judo.org.ua',
        address: 'м. Одеса, вул. Дерибасівська, 23',
        established: 1990,
        description: 'Одеська федерація - перлина південного дзюдо України.',
        achievements: ['Міжнародні турніри', 'Курортне дзюдо', 'Багатонаціональність'],
        available: true
    },
    lviv: {
        id: 'lviv',
        name: 'Львівська область',
        nameEn: 'Lviv Oblast',
        capital: 'Львів',
        zone: 'west',
        clubs: 24,
        athletes: 712,
        president: 'Бандера Остап Степанович',
        phone: '+38 (032) 789-01-23',
        email: 'lviv@judo.org.ua',
        website: 'lviv-judo.org.ua',
        address: 'м. Львів, пл. Ринок, 1',
        established: 1991,
        description: 'Львівська федерація - культурний центр західноукраїнського дзюдо.',
        achievements: ['Європейські традиції', 'Молодіжний рух', 'Культурна спадщина'],
        available: true
    },
    ternopil: {
        id: 'ternopil',
        name: 'Тернопільська область',
        nameEn: 'Ternopil Oblast',
        capital: 'Тернопіль',
        zone: 'west',
        clubs: 13,
        athletes: 398,
        president: 'Галушка Мирослав Богданович',
        phone: '+38 (0352) 8-90-12',
        email: 'ternopil@judo.org.ua',
        website: 'ternopil-judo.org.ua',
        address: 'м. Тернопіль, вул. Руська, 12',
        established: 1993,
        description: 'Тернопільська федерація розвиває дзюдо в серці Західної України.',
        achievements: ['Студентський спорт', 'Університетські програми', 'Інноваційні методи'],
        available: true
    },
    frankivsk: {
        id: 'frankivsk',
        name: 'Івано-Франківська область',
        nameEn: 'Ivano-Frankivsk Oblast',
        capital: 'Івано-Франківськ',
        zone: 'west',
        clubs: 16,
        athletes: 467,
        president: 'Гуцуляк Василь Іванович',
        phone: '+38 (0342) 9-01-23',
        email: 'frankivsk@judo.org.ua',
        website: 'frankivsk-judo.org.ua',
        address: 'м. Івано-Франківськ, вул. Незалежності, 76',
        established: 1992,
        description: 'Івано-Франківська федерація поєднує традиції Карпат з сучасним дзюдо.',
        achievements: ['Гірський дзюдо', 'Екологічні табори', 'Туристичні програми'],
        available: true
    },
    chernivtsi: {
        id: 'chernivtsi',
        name: 'Чернівецька область',
        nameEn: 'Chernivtsi Oblast',
        capital: 'Чернівці',
        zone: 'west',
        clubs: 11,
        athletes: 334,
        president: 'Попович Михайло Дмитрович',
        phone: '+38 (0372) 0-12-34',
        email: 'chernivtsi@judo.org.ua',
        website: 'chernivtsi-judo.org.ua',
        address: 'м. Чернівці, вул. Кобилянської, 2',
        established: 1994,
        description: 'Чернівецька федерація - найпівденніша в західному регіоні.',
        achievements: ['Буковинські традиції', 'Багатокультурність', 'Молодіжні ініціативи'],
        available: true
    },
    zakarpattya: {
        id: 'zakarpattya',
        name: 'Закарпатська область',
        nameEn: 'Zakarpattia Oblast',
        capital: 'Ужгород',
        zone: 'west',
        clubs: 14,
        athletes: 423,
        president: 'Балаж Золтан Йосипович',
        phone: '+38 (0312) 1-23-45',
        email: 'zakarpattia@judo.org.ua',
        website: 'zakarpattia-judo.org.ua',
        address: 'м. Ужгород, пл. Народна, 3',
        established: 1991,
        description: 'Закарпатська федерація - міст між Україною та Європою в дзюдо.',
        achievements: ['Європейська інтеграція', 'Міжнародні зв\'язки', 'Багатомовність'],
        available: true
    },
    khmelnitsky: {
        id: 'khmelnitsky',
        name: 'Хмельницька область',
        nameEn: 'Khmelnytskyi Oblast',
        capital: 'Хмельницький',
        zone: 'west',
        clubs: 17,
        athletes: 501,
        president: 'Подільський Богдан Ярославович',
        phone: '+38 (0382) 2-34-56',
        email: 'khmelnytskyi@judo.org.ua',
        website: 'khmelnytskyi-judo.org.ua',
        address: 'м. Хмельницький, вул. Проскурівського підпілля, 15',
        established: 1992,
        description: 'Хмельницька федерація розвиває дзюдо на Поділлі.',
        achievements: ['Подільські чемпіони', 'Сільський спорт', 'Народні традиції'],
        available: true
    },
    // Regions currently affected by war
    luhansk: {
        id: 'luhansk',
        name: 'Луганська область',
        nameEn: 'Luhansk Oblast',
        capital: 'Луганськ',
        zone: 'east',
        clubs: 0,
        athletes: 0,
        president: 'Тимчасово недоступно',
        phone: 'Тимчасово недоступно',
        email: 'luhansk@judo.org.ua',
        website: 'luhansk-judo.org.ua',
        address: 'Тимчасово недоступно',
        established: 1990,
        description: 'Луганська федерація тимчасово призупинила діяльність через військові дії.',
        achievements: ['Відновлення після війни', 'Підтримка переселенців', 'Збереження традицій'],
        available: false
    },
    donetsk: {
        id: 'donetsk',
        name: 'Донецька область',
        nameEn: 'Donetsk Oblast',
        capital: 'Слов\'янськ',
        zone: 'east',
        clubs: 45,
        athletes: 850,
        president: 'Ігнатенко Дмитро Сергійович',
        vicePresident: 'Суліма Віталій Володимирович',
        generalSecretary: 'Іванисенко Віталій Анатолійович',
        phone: '0505771096',
        vicePresidentPhone: '0504713384',
        secretaryPhone: '0509192893',
        email: 'donetsk@judo.org.ua',
        website: 'donetsk-judo.org.ua',
        address: '84100, Донецька область, м. Слов\'янськ, вул. Вокзальна, буд. 59',
        established: 1989,
        description: 'Донецька обласна федерація дзюдо продовжує активну роботу з новим центром у Слов\'янську, об\'єднуючи клуби та школи по всій області та підтримуючи розвиток дзюдо в умовах воєнного часу.',
        achievements: [
            'Переміщення та збереження структури федерації в умовах війни',
            'Активна робота у 15+ містах та селищах області',
            'Підтримка понад 40 тренерів та інструкторів',
            'Збереження системи підготовки спортсменів',
            'Координація роботи спортивних шкіл та клубів',
            'Героїчна стійкість та продовження розвитку дзюдо'
        ],
        cities: [
            {
                name: 'Слов\'янськ',
                organizations: [
                    {
                        name: 'Обласна КДЮСШ і ШВСМ',
                        contact: 'Ігнатенко Дмитро Сергійович',
                        phone: '0505771096',
                        role: 'Президент федерації'
                    },
                    {
                        name: 'Обласна КДЮСШ',
                        contact: 'Ігнатенко Альона Анатоліївна'
                    },
                    {
                        name: 'Обласна КДЮСШ',
                        contact: 'Бобровська Інга Ігорівна'
                    },
                    {
                        name: 'ДЮСШ м. Славянск',
                        contact: 'Філатов Андрій Віталійович',
                        phone: '0502069567'
                    },
                    {
                        name: 'ДЮСШ м. Слов\'янськ',
                        contact: 'Дейниченко Валерій Володимирович'
                    },
                    {
                        name: 'ДЮСШ м. Слов\'янськ',
                        contact: 'Мільошкін Данило Сергійович'
                    },
                    {
                        name: 'Районна ДЮСШ Слов\'янська «Колос»',
                        contact: 'Дарчук Софія Тарасівна'
                    },
                    {
                        name: 'Районна ДЮСШ Слов\'янська «Колос»',
                        contact: 'Дегтярьов Ігор Миколайович'
                    }
                ]
            },
            {
                name: 'Покровськ',
                organizations: [
                    {
                        name: 'Регіональна федерація боротьби самбо і дзюдо Покровська',
                        contact: 'ДЮСШ м. Покровськ'
                    },
                    {
                        name: 'Клуб "Нітен"',
                        contact: 'Задіран Олег Володимирович'
                    },
                    {
                        name: 'Клуб "Нітен"',
                        contact: 'Коленчук Дмитро Володимирович'
                    },
                    {
                        name: 'Колчин Микола Данилович',
                        phone: '0954661541'
                    },
                    {
                        name: 'СДЮШОР',
                        contact: 'Суліма Віталій Володимирович',
                        phone: '0504713384',
                        role: 'Віцепрезидент федерації'
                    },
                    {
                        name: 'Покровський виконком',
                        contact: 'Дугельний Антон'
                    },
                    {
                        name: 'смт Родинське',
                        contact: 'Блізнецов Сергій Валентинович'
                    }
                ]
            },
            {
                name: 'Лиман',
                description: 'Лиманська територіальна федерація дзюдо',
                president: 'Іванисенко Віталій Анатолійович',
                presidentPhone: '0509192893',
                organizations: [
                    {
                        name: 'Донецька обласна КДЮСШ',
                        contact: 'Іванисенко Віталій Анатолійович',
                        role: 'Генеральний секретар обласної федерації'
                    },
                    {
                        name: 'Донецька обласна КДЮСШ',
                        contact: 'Роменський Олексій Сергійович'
                    },
                    {
                        name: 'Донецька обласна КДЮСШ',
                        contact: 'Кравцов Валерій Леонідович'
                    },
                    {
                        name: 'ДЮСШ м. Лиман',
                        contact: 'Рогоза Олексій Ігорович'
                    }
                ]
            },
            {
                name: 'Краматорськ',
                organizations: [
                    {
                        name: 'ДЮСШ 1 м. Краматорськ',
                        contact: 'Боровик Андрій Сергійович',
                        phone: '0507077355'
                    },
                    {
                        name: 'ДЮСШ 1 м. Краматорськ',
                        contact: 'Максимушкин Юрій Вікторович'
                    },
                    {
                        name: 'ДЮСШ 1 м. Краматорськ',
                        contact: 'Мацай Ігор Володимирович'
                    },
                    {
                        name: 'Донецька ШВСМ',
                        contact: 'Ящук Микола Петрович',
                        phone: '0503267006'
                    }
                ]
            },
            {
                name: 'Мирноград',
                organizations: [
                    {
                        name: 'ДЮСШ відділ освіти',
                        contact: 'Новіков Едуард Володимирович',
                        phone: '0503663242'
                    },
                    {
                        name: 'ДЮСШ відділ освіти',
                        contact: 'Черкасова Тетяна Геннадіївна'
                    }
                ]
            },
            {
                name: 'Бахмут',
                organizations: [
                    {
                        name: 'Донецьке вище училище олімпійського резерву',
                        contact: 'Годлевський Павло Валерійович'
                    },
                    {
                        name: 'Донецьке вище училище олімпійського резерву та КДЮСШ-2 Бахмут',
                        contact: 'Осипян Давид Романович',
                        phone: '0662632977'
                    },
                    {
                        name: 'КДЮСШ-2 м Бахмут',
                        contact: 'Статівкін Леонід',
                        phone: '0509806970'
                    }
                ]
            },
            {
                name: 'Маріуполь',
                organizations: [
                    {
                        name: 'СК «Атлетик»',
                        coaches: [
                            'Яковлева Тетяна Миколаївна (0507385705)',
                            'Семенков Артем В\'ячеславович',
                            'Сопін Олександр Вікторович',
                            'Костенко Микола Іванович',
                            'Бахнярська Юлія Володимирівна'
                        ]
                    },
                    {
                        name: 'СДЮШОР',
                        coaches: [
                            'Врублевська Віталія Володимирівна',
                            'Бігім Володимир',
                            'Менчака В\'ячеслав (0991012052)',
                            'Шишин Михайло Євгенович'
                        ]
                    }
                ]
            }
        ],
        additionalLocations: [
            {
                location: 'Малоянисоль, Нікольський район',
                contact: 'Патріча Віталій Олександрович',
                organization: 'Донецька обласна КДЮСШ',
                phone: '0502506092'
            },
            {
                location: 'смт. Мироновський, Бахмутський район',
                contact: 'Житюк Олександр Григорович',
                organization: 'СДЮШОР',
                phone: '0505946407'
            },
            {
                location: 'Урзуф',
                contact: 'Хая Генадій Євгенович',
                organization: 'ДЮСШ'
            },
            {
                location: 'Добропілля',
                coaches: [
                    'Черкасова Ірина Олексіївна (0501696989)',
                    'Пузіков Олександр Анатолійович (міська організація «Спорт для всіх»)'
                ]
            },
            {
                location: 'смт. Новодонецьке',
                coaches: [
                    'Шестопалова Олена Сергіївна',
                    'Бутурдімова Ольга Сергіївна'
                ]
            },
            {
                location: 'Ялта',
                contact: 'Килимник Василь Данилович'
            },
            {
                location: 'смт. Володарське',
                coaches: [
                    'Даниленко Олег Васильович',
                    'Чапні Генадій Валентинович'
                ]
            },
            {
                location: 'Велика Новоселівка',
                coaches: [
                    'Косарєв Олександр Васильович',
                    'Чекубашев Андрій Леонідович'
                ]
            }
        ],
        leaderImage: 'assets/region/Donetsk_leader.jpg',
        available: true
    }
};

class RegionsManager {
    constructor() {
        this.currentFilter = 'all';
        this.selectedRegion = null;
        this.mapContainer = document.querySelector('.ukraine-svg');
        this.regionInfo = document.getElementById('region-info');
        this.regionsGrid = document.getElementById('regions-grid');
        this.filterTabs = document.querySelectorAll('.filter-tab');
        
        this.init();
    }

    async init() {
        try {
            await this.loadUkraineSVG();
            this.setupEventListeners();
            this.renderRegionsGrid();
            this.setupMapInteractions();
        } catch (error) {
            console.error('Error initializing regions:', error);
        }
    }

    async loadUkraineSVG() {
        try {
            const response = await fetch('assets/ukraine.svg');
            const svgText = await response.text();
            
            // Parse SVG and inject into container
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
            const svgElement = svgDoc.documentElement;
            
            // Clear existing content and add new SVG
            this.mapContainer.innerHTML = '';
            this.mapContainer.appendChild(svgElement);
            
            return true;
        } catch (error) {
            console.error('Error loading Ukraine SVG:', error);
            return false;
        }
    }

    setupMapInteractions() {
        const regions = this.mapContainer.querySelectorAll('path[id]');
        
        regions.forEach(region => {
            const regionId = region.id;
            const regionData = regionsData[regionId];
            
            if (regionData) {
                // Add availability class
                if (!regionData.available) {
                    region.classList.add('unavailable');
                }
                
                // Add click event
                region.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (regionData.available) {
                        this.selectRegion(regionId);
                    }
                });
                
                // Add hover events for available regions
                if (regionData.available) {
                    region.addEventListener('mouseenter', () => {
                        this.showQuickInfo(regionData, e);
                    });
                    
                    region.addEventListener('mouseleave', () => {
                        this.hideQuickInfo();
                    });
                }
                
                // Add keyboard support
                region.setAttribute('tabindex', '0');
                region.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (regionData.available) {
                            this.selectRegion(regionId);
                        }
                    }
                });
            }
        });
    }

    selectRegion(regionId) {
        const regionData = regionsData[regionId];
        if (!regionData || !regionData.available) return;

        // Update selected region
        this.selectedRegion = regionId;
        
        // Update map visual state
        this.updateMapSelection(regionId);
        
        // Update info panel
        this.updateRegionInfo(regionData);
        
        // Scroll to info panel
        if (window.innerWidth <= 768) {
            this.regionInfo.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    updateMapSelection(selectedId) {
        const regions = this.mapContainer.querySelectorAll('path[id]');
        
        regions.forEach(region => {
            region.classList.remove('active');
            if (region.id === selectedId) {
                region.classList.add('active');
            }
        });
    }

    updateRegionInfo(regionData) {
        const infoCard = this.regionInfo;
        
        // Generate leadership info - enhanced for Donetsk region
        let leadershipHTML = `
            <h4 style="font-size: 1rem; font-weight: 600; color: #334155; margin-bottom: 0.75rem;">Керівництво</h4>
            <p style="color: #64748b; margin-bottom: 0.5rem;"><strong>Президент:</strong> ${regionData.president}${regionData.phone ? ` (${regionData.phone})` : ''}</p>
        `;
        
        if (regionData.vicePresident) {
            leadershipHTML += `<p style="color: #64748b; margin-bottom: 0.5rem;"><strong>Віцепрезидент:</strong> ${regionData.vicePresident}${regionData.vicePresidentPhone ? ` (${regionData.vicePresidentPhone})` : ''}</p>`;
        }
        
        if (regionData.generalSecretary) {
            leadershipHTML += `<p style="color: #64748b; margin-bottom: 0.5rem;"><strong>Генеральний секретар:</strong> ${regionData.generalSecretary}${regionData.secretaryPhone ? ` (${regionData.secretaryPhone})` : ''}</p>`;
        }
        
        if (regionData.honoraryPresident) {
            leadershipHTML += `<p style="color: #64748b; margin-bottom: 1rem;"><strong>Почесний президент:</strong> ${regionData.honoraryPresident}</p>`;
        } else {
            leadershipHTML += `<div style="margin-bottom: 1rem;"></div>`;
        }

        // Generate social media links
        let socialMediaHTML = '';
        if (regionData.facebook || regionData.instagram) {
            socialMediaHTML = `
                <div class="contact-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                    </svg>
                    <span>
                        ${regionData.facebook ? `<a href="${regionData.facebook}" target="_blank" style="color: #3b82f6; text-decoration: none;">Facebook</a>` : ''}
                        ${regionData.facebook && regionData.instagram ? ' | ' : ''}
                        ${regionData.instagram ? `<a href="${regionData.instagram}" target="_blank" style="color: #3b82f6; text-decoration: none;">Instagram</a>` : ''}
                    </span>
                </div>
            `;
        }

        // Generate cities and organizations section (for Donetsk region)
        let citiesHTML = '';
        if (regionData.cities && regionData.cities.length > 0) {
            citiesHTML = `
                <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0;">
                    <h4 style="font-size: 1rem; font-weight: 600; color: #334155; margin-bottom: 1rem;">Основні міста та організації</h4>
                    ${regionData.cities.map(city => `
                        <div style="background: #f8fafc; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; border-left: 4px solid #3b82f6;">
                            <h5 style="font-size: 1rem; font-weight: 600; color: #1e293b; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                                <span style="color: #3b82f6;">🏙️</span> ${city.name}
                                ${city.description ? `<span style="font-size: 0.75rem; color: #64748b; font-weight: normal;"> - ${city.description}</span>` : ''}
                            </h5>
                            ${city.president ? `<p style="font-size: 0.875rem; color: #059669; margin-bottom: 0.5rem;"><strong>Президент:</strong> ${city.president}${city.presidentPhone ? ` (${city.presidentPhone})` : ''}</p>` : ''}
                            
                            <div style="display: grid; gap: 0.75rem;">
                                ${city.organizations.map(org => `
                                    <div style="background: white; border-radius: 8px; padding: 1rem; border: 1px solid #e2e8f0;">
                                        <div style="font-size: 0.875rem; font-weight: 600; color: #1e293b; margin-bottom: 0.5rem;">${org.name}</div>
                                        ${org.contact ? `<div style="font-size: 0.8rem; color: #64748b;">👤 ${org.contact}${org.phone ? ` (${org.phone})` : ''}${org.role ? ` - ${org.role}` : ''}</div>` : ''}
                                        ${org.phone && !org.contact ? `<div style="font-size: 0.8rem; color: #64748b;">📞 ${org.phone}</div>` : ''}
                                        ${org.coaches ? `<div style="font-size: 0.8rem; color: #64748b; margin-top: 0.25rem;"><strong>Тренери:</strong><br>${org.coaches.map(coach => `• ${coach}`).join('<br>')}</div>` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Generate additional locations section (for Donetsk region)
        let additionalLocationsHTML = '';
        if (regionData.additionalLocations && regionData.additionalLocations.length > 0) {
            additionalLocationsHTML = `
                <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0;">
                    <h4 style="font-size: 1rem; font-weight: 600; color: #334155; margin-bottom: 1rem;">Інші населені пункти</h4>
                    <div style="display: grid; gap: 1rem;">
                        ${regionData.additionalLocations.map(loc => `
                            <div style="background: #f1f5f9; border-radius: 8px; padding: 1rem; border-left: 3px solid #64748b;">
                                <div style="font-size: 0.875rem; font-weight: 600; color: #1e293b; margin-bottom: 0.5rem;">📍 ${loc.location}</div>
                                ${loc.contact ? `<div style="font-size: 0.8rem; color: #64748b;">👤 ${loc.contact}${loc.phone ? ` (${loc.phone})` : ''}${loc.organization ? ` - ${loc.organization}` : ''}</div>` : ''}
                                ${loc.coaches ? `<div style="font-size: 0.8rem; color: #64748b; margin-top: 0.25rem;"><strong>Тренери:</strong> ${loc.coaches.join(', ')}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Generate organizations section (for other regions with standard structure)
        let organizationsHTML = '';
        if (regionData.organizations && regionData.organizations.length > 0) {
            organizationsHTML = `
                <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0;">
                    <h4 style="font-size: 1rem; font-weight: 600; color: #334155; margin-bottom: 1rem;">Організації та клуби</h4>
                    ${regionData.organizations.map(org => `
                        <div style="background: #f8fafc; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; border-left: 4px solid #3b82f6;">
                            <h5 style="font-size: 0.875rem; font-weight: 600; color: #1e293b; margin-bottom: 0.5rem;">${org.name}</h5>
                            ${org.description ? `<p style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.75rem;">${org.description}</p>` : ''}
                            
                            <div style="font-size: 0.8rem; color: #64748b;">
                                <div style="margin-bottom: 0.25rem;">📍 ${org.address}</div>
                                ${org.phone ? `<div style="margin-bottom: 0.25rem;">📞 ${org.phone}</div>` : ''}
                                ${org.phones ? `<div style="margin-bottom: 0.25rem;">📞 ${org.phones.join(', ')}</div>` : ''}
                                ${org.email ? `<div style="margin-bottom: 0.25rem;">✉️ ${org.email}</div>` : ''}
                                ${org.website ? `<div style="margin-bottom: 0.25rem;">🌐 <a href="${org.website.startsWith('http') ? org.website : 'https://' + org.website}" target="_blank" style="color: #3b82f6; text-decoration: none;">${org.website}</a></div>` : ''}
                                
                                ${org.director ? `<div style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #e2e8f0;"><strong>Директор:</strong> ${org.director}</div>` : ''}
                                ${org.headCoach ? `<div style="margin-top: 0.25rem;"><strong>Старший тренер:</strong> ${org.headCoach}</div>` : ''}
                                ${org.coach ? `<div style="margin-top: 0.25rem;"><strong>Тренер:</strong> ${org.coach}</div>` : ''}
                                ${org.coaches ? `<div style="margin-top: 0.25rem;"><strong>Тренери:</strong> ${org.coaches.join(', ')}</div>` : ''}
                                ${org.famousAthletes ? `<div style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #e2e8f0;"><strong>Відомі вихованці:</strong> ${org.famousAthletes}</div>` : ''}
                                ${org.tournament ? `<div style="margin-top: 0.25rem;"><strong>Турнір:</strong> <a href="${org.tournament.startsWith('http') ? org.tournament : 'https://' + org.tournament}" target="_blank" style="color: #3b82f6; text-decoration: none;">${org.tournament}</a></div>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        infoCard.innerHTML = `
            <div class="region-info-content fade-in">
                <div class="region-header">
                    <div class="region-title">
                        <h3>${regionData.name}</h3>
                        <p>${regionData.capital} • Заснована ${regionData.established}</p>
                    </div>
                    ${regionData.leaderImage ? `
                        <div class="region-leader-image">
                            <img src="${regionData.leaderImage}" alt="Керівництво ${regionData.name}" style="width: 80px; height: 80px; border-radius: 8px; object-fit: cover;">
                        </div>
                    ` : ''}
                </div>
                
                <div class="region-stats">
                    <div class="region-stat">
                        <span class="region-stat-number">${regionData.clubs}</span>
                        <span class="region-stat-label">Клубів</span>
                    </div>
                    <div class="region-stat">
                        <span class="region-stat-number">${regionData.athletes}</span>
                        <span class="region-stat-label">Спортсменів</span>
                    </div>
                </div>
                
                <p style="margin: 1rem 0; color: #64748b; line-height: 1.5;">
                    ${regionData.description}
                </p>
                
                <div class="region-contact">
                    <h4>Контактна інформація</h4>
                    <div class="contact-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <span>${regionData.address}</span>
                    </div>
                    <div class="contact-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                        </svg>
                        <span>${regionData.phone}</span>
                    </div>
                    <div class="contact-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                            <path d="m22 7-10 5L2 7"></path>
                        </svg>
                        <span>${regionData.email}</span>
                    </div>
                    <div class="contact-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
                            <path d="M9 18c-4.51 2-5-2-7-2"></path>
                        </svg>
                        <span><a href="${regionData.website.startsWith('http') ? regionData.website : 'https://' + regionData.website}" target="_blank" style="color: #3b82f6; text-decoration: none;">${regionData.website}</a></span>
                    </div>
                    ${socialMediaHTML}
                </div>
                
                <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0;">
                    ${leadershipHTML}
                    
                    <h4 style="font-size: 1rem; font-weight: 600; color: #334155; margin-bottom: 0.75rem;">Основні досягнення</h4>
                    <ul style="color: #64748b; font-size: 0.875rem; list-style: none; padding: 0;">
                        ${regionData.achievements.map(achievement => 
                            `<li style="margin-bottom: 0.5rem; padding-left: 1.5rem; position: relative;">
                                <svg style="position: absolute; left: 0; top: 0.125rem; color: #3b82f6;" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="20,6 9,17 4,12"></polyline>
                                </svg>
                                ${achievement}
                            </li>`
                        ).join('')}
                    </ul>
                </div>
                
                ${citiesHTML}
                ${additionalLocationsHTML}
                ${organizationsHTML}
            </div>
        `;
    }

    setupEventListeners() {
        // Filter tabs
        this.filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const filter = tab.dataset.filter;
                this.setFilter(filter);
            });
        });

        // Window resize handler
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active tab
        this.filterTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.filter === filter);
        });
        
        // Filter regions grid
        this.filterRegionsGrid();
    }

    filterRegionsGrid() {
        const regionCards = this.regionsGrid.querySelectorAll('.region-card');
        
        regionCards.forEach(card => {
            const regionZone = card.dataset.zone;
            const isVisible = this.currentFilter === 'all' || this.currentFilter === regionZone;
            
            if (isVisible) {
                card.classList.remove('hidden');
                card.style.animation = 'slideUp 0.3s ease-in-out';
            } else {
                card.classList.add('hidden');
            }
        });
    }

    renderRegionsGrid() {
        if (!this.regionsGrid) return;

        const regionsHTML = Object.values(regionsData)
            .filter(region => region.available)
            .map(region => this.createRegionCard(region))
            .join('');

        this.regionsGrid.innerHTML = regionsHTML;
        
        // Add click handlers to region cards
        this.regionsGrid.querySelectorAll('.region-card').forEach(card => {
            card.addEventListener('click', () => {
                const regionId = card.dataset.regionId;
                this.selectRegion(regionId);
                
                // Scroll to map
                document.querySelector('.map-section').scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            });
        });
    }

    createRegionCard(region) {
        return `
            <div class="region-card" data-region-id="${region.id}" data-zone="${region.zone}">
                <div class="region-card-header">
                    <div class="region-card-title">
                        <h3>${region.name}</h3>
                        <p>${region.capital} • ${region.zone === 'west' ? 'Західна' : region.zone === 'east' ? 'Східна' : region.zone === 'north' ? 'Північна' : region.zone === 'south' ? 'Південна' : 'Центральна'} Україна</p>
                    </div>
                </div>
                
                <div class="region-card-stats">
                    <div class="region-card-stat">
                        <span class="region-card-stat-number">${region.clubs}</span>
                        <span class="region-card-stat-label">Клубів</span>
                    </div>
                    <div class="region-card-stat">
                        <span class="region-card-stat-number">${region.athletes}</span>
                        <span class="region-card-stat-label">Спортсменів</span>
                    </div>
                </div>
                
                <div class="region-card-contact">
                    <div class="region-card-contact-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <span>${region.capital}</span>
                    </div>
                    <div class="region-card-contact-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                        </svg>
                        <span>${region.phone}</span>
                    </div>
                    <div class="region-card-contact-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                            <path d="m22 7-10 5L2 7"></path>
                        </svg>
                        <span>${region.email}</span>
                    </div>
                </div>
            </div>
        `;
    }

    handleResize() {
        // Handle responsive behavior
        if (window.innerWidth <= 1024 && this.selectedRegion) {
            // Ensure info panel is visible on smaller screens
            this.regionInfo.scrollIntoView({ behavior: 'smooth' });
        }
    }

    showQuickInfo(regionData, event) {
        // Optional: Show tooltip on hover
        // Implementation depends on requirements
    }

    hideQuickInfo() {
        // Optional: Hide tooltip
        // Implementation depends on requirements
    }
}

// Initialize regions manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new RegionsManager();
});

// Export for potential use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RegionsManager, regionsData };
} 