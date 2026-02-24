/*
  Учебные данные (прототип). Файлы видео НЕ включены.
  Положи свои mp4 в соответствующие папки и пропиши src (примеры ниже).
*/
window.FILMFLOW_DB = [
  {
    id:"m01", type:"movie",
    title:"Солнечный архив", year:2025, duration:119, rating:8.4,
    country:"США", age:"12+",
    genres:["Фантастика","Детектив"],
    pop:95,
    desc:"Архивариус находит записи, которые не должны существовать. Каждая запись — ключ к загадке."
    // src:"media/solar-archive.mp4"
  },
  {
    id:"m02", type:"movie",
    title:"Ночной маршрут", year:2024, duration:108, rating:7.8,
    country:"Россия", age:"16+",
    genres:["Триллер","Драма"],
    pop:92,
    desc:"Водитель такси случайно становится свидетелем загадочного разговора и получает шанс раскрыть большое дело."
  },
  {
    id:"m03", type:"movie",
    title:"Пятница без планов", year:2022, duration:94, rating:7.1,
    country:"Россия", age:"12+",
    genres:["Комедия"],
    pop:80,
    desc:"Когда все планы срываются, остаётся один вариант — устроить лучший вечер, который не был запланирован."
  },
  {
    id:"m04", type:"movie",
    title:"Грань света", year:2023, duration:113, rating:7.9,
    country:"Южная Корея", age:"16+",
    genres:["Драма","Триллер"],
    pop:84,
    desc:"Фотограф замечает на снимках то, чего не видел в жизни. Это приводит к опасной правде."
  },

  /* Добавлен мультфильм. Положи файл в /media/alesha.mp4 (или другое имя) и укажи src ниже. */
  {
    id:"m05", type:"movie",
    title:"Алёша Попович и Тугарин Змей", year:2004, duration:79, rating:7.4,
    country:"Россия", age:"6+",
    genres:["Анимация","Комедия","Приключения"],
    pop:90,
    desc:"Мультфильм про богатыря Алёшу Поповича, который отправляется в путь и сталкивается с Тугариным Змеем.",
    src:"media/alesha.mp4"
  },

  // ===== СЕРИАЛЫ =====
  {
    id:"s01", type:"series",
    title:"Код рек", year:2024, rating:8.1,
    country:"Норвегия", age:"12+",
    genres:["Приключения","Детектив"],
    pop:90,
    desc:"Сериал о поиске древних знаков у северных рек. Каждая серия приближает к разгадке.",
    seasons:[
      {
        season:1,
        episodes:[
          { ep:1, title:"Знак на камне", duration:42 /*, src:"media/s01e01.mp4"*/ },
          { ep:2, title:"Тропа к устью", duration:45 },
          { ep:3, title:"Ложная карта", duration:44 }
        ]
      },
      {
        season:2,
        episodes:[
          { ep:1, title:"Северный ключ", duration:46 },
          { ep:2, title:"Голос воды", duration:43 }
        ]
      }
    ]
  },
  {
    id:"s02", type:"series",
    title:"Город на воде", year:2023, rating:7.6,
    country:"Япония", age:"6+",
    genres:["Анимация","Семейный"],
    pop:78,
    desc:"Тёплый сериал о городке на плавучих платформах и тайне, которую раскрывают друзья.",
    seasons:[
      {
        season:1,
        episodes:[
          { ep:1, title:"Платформа №7", duration:24 },
          { ep:2, title:"Старая пристань", duration:23 },
          { ep:3, title:"Письмо в бутылке", duration:25 }
        ]
      }
    ]
  },

  // ===== СЕРИАЛ: Проспект Бразилии (Avenida Brasil) =====
  {
    id:"s03", type:"series",
    title:"Проспект Бразилии", year:2012, rating:8.7,
    country:"Бразилия", age:"16+",
    genres:["Драма","Мелодрама","Криминал"],
    pop:99,
    desc:"История девушки, которая ищет справедливость и хочет отомстить мачехе, разрушившей её семью. Одна из самых популярных бразильских теленовелл.",
    seasons: [
      {
        season: 1,
        // 160 серий. Название серии — имя файла (трёхзначный номер + .mp4)
        episodes: Array.from({ length: 160 }, (_, i) => {
          const epNumber = i + 1;
          const fileName = `${String(epNumber).padStart(3, '0')}.mp4`; // 001.mp4, 002.mp4, …, 160.mp4
          return {
            ep: epNumber,
            title: fileName,   // Отображается в списке серий
            duration: 50,
            // Путь к видео: /media/Проспект Бразилии(Avenida Brasil)/001.mp4 и т.д.
            src: `media/Проспект Бразилии(Avenida Brasil)/${fileName}`
          };
        })
      }
    ]
  },

  // ===== СЕРИАЛ: Дикий ангел (Muñeca Brava) =====
  {
    id: "s04",
    type: "series",
    title: "Дикий ангел (Muñeca Brava)",
    year: 1998,
    rating: 8.5,
    country: "Аргентина",
    age: "16+",
    genres: ["Драма", "Мелодрама"],
    pop: 98,
    desc: "История девушки-служанки Милагрос, которая влюбляется в богатого наследника Иво. Их любовь преодолевает социальные барьеры и интриги.",
    seasons: [
      {
        season: 1,
        episodes: Array.from({ length: 270 }, (_, i) => {
          const epNumber = i + 1;
          const fileName = `${String(epNumber).padStart(3, '0')}.mp4`;
          return {
            ep: epNumber,
            title: `Серия ${epNumber}`,
            duration: 45,
            src: `media/Дикий ангел(Muñeca Brava)/${fileName}`
          };
        })
      }
    ]
  }
];