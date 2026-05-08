// =============================================
// O'ZBEK TILI  (uz.js yoki uz.ts ichiga qo'shing)
// =============================================
export const uz = {
  tokenModule: {
    title: "Tokenlar boshqaruvi",
    add: "Qo'shish",
    edit: "Tahrirlash",
    delete: "O'chirish",
    upload_csv: "CSV yuklash",
    allocate: "Taqsimlash",
    assign: "Biriktirish",
    filter: "Filter",

    // Ustun nomlari
    seria_number: "Seriya raqami",
    is_used: "Holati",
    branch_user: "Branch",
    actions: "Amallar",

    // Holat chiplari
    used: "Ishlatilgan",
    not_used: "Ishlatilmagan",
    all: "Barchasi",

    // Upload dialog
    drag_or_click: "CSV faylni bu yerga tashlang yoki bosing",
    only_csv: "Faqat .csv formatdagi fayllar qabul qilinadi",
    csv_hint: "CSV faylda ustun nomi: ",
    csv_hint2: " yoki ",
    upload: "Yuklash",
    select_file: "Avval fayl tanlang",
    upload_success: "{count} ta token muvaffaqiyatli yuklandi",
    upload_error: "Yuklashda xatolik yuz berdi",

    // Allocate dialog
    select_branch: "Branch userni tanlang",
    quantity: "Miqdor",
    quantity_hint: "Nechta token taqsimlansin",
    allocate_btn: "Taqsimlash",
    allocate_success: "{count} ta token muvaffaqiyatli taqsimlandi",
    allocate_error: "Taqsimlashda xatolik yuz berdi",
    fill_all: "Barcha maydonlarni to'ldiring",

    // Assign dialog
    assign_hint: "Qabul qilingan tokenlar seriya raqamlarini qator-qator kiriting",
    seria_numbers: "Seriya raqamlari",
    seria_placeholder: "ABC123\nABC124\nABC125",
    seria_count: "{count} ta seriya raqami kiritildi",
    assign_btn: "Biriktirish",
    assign_success: "{updated} ta token biriktirildi (jami {total} so'raldi)",
    assign_error: "Biriktirishda xatolik yuz berdi",
    enter_seria: "Kamida bitta seriya raqami kiriting",

    // Toast
    token_deleted: "Token muvaffaqiyatli o'chirildi",
  },
  cancel: "Bekor qilish",
  no_data: "Ma'lumot topilmadi",
}

// =============================================
// RUS TILI  (ru.js yoki ru.ts ichiga qo'shing)
// =============================================
export const ru = {
  tokenModule: {
    title: "Управление токенами",
    add: "Добавить",
    edit: "Редактировать",
    delete: "Удалить",
    upload_csv: "Загрузить CSV",
    allocate: "Распределить",
    assign: "Привязать",
    filter: "Фильтр",

    // Заголовки столбцов
    seria_number: "Серийный номер",
    is_used: "Статус",
    branch_user: "Филиал",
    actions: "Действия",

    // Чипы статуса
    used: "Использован",
    not_used: "Не использован",
    all: "Все",

    // Диалог загрузки
    drag_or_click: "Перетащите CSV файл сюда или нажмите",
    only_csv: "Принимаются только файлы формата .csv",
    csv_hint: "В CSV файле столбец должен называться: ",
    csv_hint2: " или ",
    upload: "Загрузить",
    select_file: "Сначала выберите файл",
    upload_success: "{count} токенов успешно загружено",
    upload_error: "Ошибка при загрузке",

    // Диалог распределения
    select_branch: "Выберите пользователя филиала",
    quantity: "Количество",
    quantity_hint: "Сколько токенов распределить",
    allocate_btn: "Распределить",
    allocate_success: "{count} токенов успешно распределено",
    allocate_error: "Ошибка при распределении",
    fill_all: "Заполните все поля",

    // Диалог привязки
    assign_hint: "Введите серийные номера полученных токенов, по одному в строке",
    seria_numbers: "Серийные номера",
    seria_placeholder: "ABC123\nABC124\nABC125",
    seria_count: "Введено {count} серийных номеров",
    assign_btn: "Привязать",
    assign_success: "Привязано {updated} токенов (запрошено {total})",
    assign_error: "Ошибка при привязке",
    enter_seria: "Введите хотя бы один серийный номер",

    // Toast
    token_deleted: "Токен успешно удалён",
  },
  cancel: "Отмена",
  no_data: "Данные не найдены",
}
