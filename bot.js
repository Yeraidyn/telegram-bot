const TelegramBot = require('node-telegram-bot-api');

// Токен твоего бота
const token = '7755124275:AAFCjIIUMmiLtIlhTNoDh4AUjuMYm3vi57Q';
const bot = new TelegramBot(token, { polling: true });

console.log("✅ Бот запущен! Ожидаю сообщения...");

// Обработчик команды /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  // Создаём клавиатуру с кнопками "Водитель" и "Пассажир"
  const options = {
    reply_markup: {
      keyboard: [
        [{ text: "Водитель" }, { text: "Пассажир" }]
      ],
      resize_keyboard: true, // Подгоняет размер кнопок
      one_time_keyboard: true // Клавиатура исчезнет после нажатия кнопки
    }
  };

  // Отправляем сообщение с клавиатурой
  bot.sendMessage(chatId, "Привет, fortune! Я бот для услуги трезвого водителя. Вы водитель или пассажир?", options);
});

// Обработчик выбора кнопки
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if (msg.text === "Водитель") {
    bot.sendMessage(chatId, "Вы выбрали 'Водитель'. Расскажите больше о себе!");
  } else if (msg.text === "Пассажир") {
    bot.sendMessage(chatId, "Вы выбрали 'Пассажир'. Чем могу помочь?");
  } else {
    bot.sendMessage(chatId, "Я вас не понял. Пожалуйста, выберите 'Водитель' или 'Пассажир'.");
  }
});