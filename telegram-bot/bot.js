const TelegramBot = require('node-telegram-bot-api');
const twilio = require('twilio');

// Токен вашего бота
const token = 'YOUR_TELEGRAM_BOT_TOKEN'; // Замените на токен вашего Telegram-бота
const bot = new TelegramBot(token, { polling: true });

// Токены Twilio для отправки SMS
const accountSid = 'YOUR_TWILIO_ACCOUNT_SID'; // Замените на ваш Twilio SID
const authToken = 'YOUR_TWILIO_AUTH_TOKEN';  // Замените на ваш Twilio Auth Token
const client = twilio(accountSid, authToken);

console.log("✅ Бот запущен! Ожидаю сообщения...");

// Временное хранилище данных пользователей
const userData = {};

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

  bot.sendMessage(chatId, "Привет! Выберите, кто вы: 'Водитель' или 'Пассажир'.", options);
});

// Обработчик сообщений
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;

  if (msg.text === "Водитель") {
    // Запрос номера телефона у водителя
    const options = {
      reply_markup: {
        keyboard: [
          [
            {
              text: "Отправить номер телефона 📞",
              request_contact: true // Запрос номера телефона
            }
          ]
        ],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    };

    bot.sendMessage(chatId, "Пожалуйста, отправьте ваш номер телефона для проверки.", options);
    userData[chatId] = { role: "driver" }; // Сохраняем роль пользователя
  } else if (msg.text === "Пассажир") {
    // Запрос номера телефона у пассажира
    const options = {
      reply_markup: {
        keyboard: [
          [
            {
              text: "Отправить номер телефона 📞",
              request_contact: true // Запрос номера телефона
            }
          ]
        ],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    };

    bot.sendMessage(chatId, "Пожалуйста, отправьте ваш номер телефона для подтверждения.", options);
    userData[chatId] = { role: "passenger" }; // Сохраняем роль пользователя
  } else if (msg.contact) {
    // Получение номера телефона
    const phoneNumber = msg.contact.phone_number;
    userData[chatId].phone = phoneNumber;

    bot.sendMessage(chatId, `Ваш номер телефона ${phoneNumber} успешно получен. Сейчас отправим вам SMS для подтверждения.`);

    // Отправляем SMS с кодом подтверждения
    const verificationCode = Math.floor(1000 + Math.random() * 9000); // Генерация 4-значного кода
    userData[chatId].verificationCode = verificationCode;

    try {
      await client.messages.create({
        body: `Ваш код подтверждения: ${verificationCode}`,
        from: '+1234567890', // Ваш Twilio номер
        to: phoneNumber
      });
      bot.sendMessage(chatId, "Код отправлен. Пожалуйста, введите его в ответном сообщении.");
    } catch (error) {
      bot.sendMessage(chatId, "Ошибка при отправке SMS. Попробуйте снова.");
      console.error(error);
    }
  } else if (userData[chatId] && userData[chatId].verificationCode) {
    // Проверка кода подтверждения
    if (parseInt(msg.text) === userData[chatId].verificationCode) {
      bot.sendMessage(chatId, "Ваш номер успешно подтверждён!");

      if (userData[chatId].role === "driver") {
        // Просим загрузить удостоверение водителя
        bot.sendMessage(chatId, "Пожалуйста, загрузите фото вашего водительского удостоверения.");
        userData[chatId].awaitingLicense = true;
      }
    } else {
      bot.sendMessage(chatId, "Неверный код. Пожалуйста, попробуйте снова.");
    }
  } else if (msg.photo && userData[chatId].awaitingLicense) {
    // Получение фотографии водительского удостоверения
    const fileId = msg.photo[msg.photo.length - 1].file_id; // Получаем ID самого большого фото
    const filePath = await bot.getFileLink(fileId); // Получаем ссылку на файл

    bot.sendMessage(chatId, "Ваше водительское удостоверение получено. Теперь загрузите удостоверение личности (КЗ).");
    userData[chatId].licensePhoto = filePath;
    userData[chatId].awaitingLicense = false;
    userData[chatId].awaitingID = true;
  } else if (msg.photo && userData[chatId].awaitingID) {
    // Получение фотографии удостоверения личности
    const fileId = msg.photo[msg.photo.length - 1].file_id; // Получаем ID самого большого фото
    const filePath = await bot.getFileLink(fileId); // Получаем ссылку на файл

    bot.sendMessage(chatId, "Ваше удостоверение личности получено. Спасибо за регистрацию!");
    userData[chatId].idPhoto = filePath;
    userData[chatId].awaitingID = false;

    // Здесь вы можете добавить логику проверки фотографий и дальнейшую обработку.
  } else {
    bot.sendMessage(chatId, "Я вас не понял. Пожалуйста, следуйте инструкциям.");
  }
});