const ru = {
  lang: 'Русский',
  lang_code: 'ru',
  'home.title': 'Ветеринары онлайн',
  'home.subtitle': 'Консультация за 5 минут',
  'home.book': 'Записаться',
  'home.available': 'Доступен',
  'home.exp': 'лет опыта',
  'home.price': 'сум / консультация',
  'book.title': 'Запись к врачу',
  'book.client_name': 'Ваше имя',
  'book.pet_name': 'Имя питомца',
  'book.pet_species': 'Вид животного',
  'book.problem': 'Опишите проблему',
  'book.submit': 'Записаться',
  'book.submitting': 'Отправляем...',
  'book.cat': 'Кошка',
  'book.dog': 'Собака',
  'book.rabbit': 'Кролик',
  'book.parrot': 'Попугай',
  'book.other': 'Другое',
  'chat.placeholder': 'Напишите сообщение...',
  'chat.send': 'Отправить',
  'chat.status_pending': 'Ожидаем ветеринара',
  'chat.status_active': 'Консультация идёт',
  'chat.status_completed': 'Завершена',
  'chat.you': 'Вы',
  'chat.vet': 'Ветеринар',
  'chat.waiting': 'Ожидаем ответа ветеринара...',
  'chat.done': 'Консультация завершена',
  back: 'Назад',
  loading: 'Загружаем...',
  error: 'Ошибка загрузки',
  retry: 'Повторить',
  'home.no_vets': 'Нет доступных врачей',
  'book.vet': 'Специалист',
}

const uz: typeof ru = {
  lang: "O'zbekcha",
  lang_code: 'uz',
  'home.title': 'Online veterinarlar',
  'home.subtitle': '5 daqiqada maslahat',
  'home.book': 'Yozilish',
  'home.available': 'Mavjud',
  'home.exp': 'yil tajriba',
  'home.price': "so'm / maslahat",
  'book.title': 'Shifokorga yozilish',
  'book.client_name': 'Ismingiz',
  'book.pet_name': 'Hayvon ismi',
  'book.pet_species': 'Hayvon turi',
  'book.problem': 'Muammoni tasvirlab bering',
  'book.submit': 'Yozilish',
  'book.submitting': 'Yuborilmoqda...',
  'book.cat': 'Mushuk',
  'book.dog': 'It',
  'book.rabbit': 'Quyon',
  'book.parrot': "To'ti",
  'book.other': 'Boshqa',
  'chat.placeholder': 'Xabar yozing...',
  'chat.send': 'Yuborish',
  'chat.status_pending': 'Veterinar kutilmoqda',
  'chat.status_active': 'Maslahat davom etmoqda',
  'chat.status_completed': 'Yakunlandi',
  'chat.you': 'Siz',
  'chat.vet': 'Veterinar',
  'chat.waiting': 'Veterinar javobi kutilmoqda...',
  'chat.done': 'Maslahat yakunlandi',
  back: 'Orqaga',
  loading: 'Yuklanmoqda...',
  error: 'Yuklash xatosi',
  retry: 'Qayta urinish',
  'home.no_vets': 'Mavjud shifokorlar yo\'q',
  'book.vet': 'Mutaxassis',
}

const dicts: Record<string, typeof ru> = { ru, uz }

let _lang = localStorage.getItem('ht_lang') || 'ru'

export const getLang = () => _lang
export const setLang = (l: string) => {
  _lang = l
  localStorage.setItem('ht_lang', l)
}
export const t = (key: keyof typeof ru): string =>
  dicts[_lang]?.[key] ?? dicts.ru[key] ?? key
