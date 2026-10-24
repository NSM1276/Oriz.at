// Interface texts of the guest menu for the languages beyond de/en/it/uk, plus the
// short allergen names. Written by us from the ORIZ glossary (no machine translation).
// Keys mirror UiStrings in menu-i18n.ts; the same order in every language keeps this reviewable.

type Strings = {
  allergens: string; notAvailable: string; currentlyNotAvailable: string; share: string; map: string; call: string; info: string;
  menu: string; close: string; language: string; search: string; searchPlaceholder: string; filter: string; diet: string;
  vegan: string; vegetarian: string; avoid: string; avoidHint: string; hiddenUnknown: [string, string]; showUnknown: string;
  allergenUnknown: string; allergenNone: string; results: [string, string]; noResults: string; reset: string; done: string;
  from: string; sections: string; textSize: string;
};

export const UI_EXTRA: Record<string, Strings> = {
  fr: {
    allergens: "Allergènes", notAvailable: "Indisponible", currentlyNotAvailable: "Actuellement indisponible", share: "Partager", map: "Plan", call: "Appeler", info: "Infos",
    menu: "Carte", close: "Fermer", language: "Langue", search: "Rechercher", searchPlaceholder: "Plat ou ingrédient", filter: "Filtres", diet: "Régime",
    vegan: "Végan", vegetarian: "Végétarien", avoid: "Sans", avoidHint: "Masquer les plats contenant ces allergènes.", hiddenUnknown: ["1 plat sans information sur les allergènes masqué.", "{n} plats sans information sur les allergènes masqués."], showUnknown: "Afficher quand même",
    allergenUnknown: "Pas d’information sur les allergènes — demandez au personnel.", allergenNone: "Selon le restaurant, ne contient aucun des 14 allergènes majeurs.", results: ["1 plat", "{n} plats"], noResults: "Aucun résultat.", reset: "Réinitialiser", done: "Terminé",
    from: "dès", sections: "Rubriques", textSize: "Taille du texte",
  },
  es: {
    allergens: "Alérgenos", notAvailable: "No disponible", currentlyNotAvailable: "Actualmente no disponible", share: "Compartir", map: "Mapa", call: "Llamar", info: "Info",
    menu: "Carta", close: "Cerrar", language: "Idioma", search: "Buscar", searchPlaceholder: "Plato o ingrediente", filter: "Filtros", diet: "Dieta",
    vegan: "Vegano", vegetarian: "Vegetariano", avoid: "Sin", avoidHint: "Ocultar los platos con estos alérgenos.", hiddenUnknown: ["1 plato sin información de alérgenos oculto.", "{n} platos sin información de alérgenos ocultos."], showUnknown: "Mostrar de todos modos",
    allergenUnknown: "Sin información de alérgenos — pregunte al personal.", allergenNone: "Según el restaurante, no contiene ninguno de los 14 alérgenos principales.", results: ["1 plato", "{n} platos"], noResults: "Sin resultados.", reset: "Restablecer", done: "Listo",
    from: "desde", sections: "Secciones", textSize: "Tamaño del texto",
  },
  pt: {
    allergens: "Alergénios", notAvailable: "Indisponível", currentlyNotAvailable: "De momento indisponível", share: "Partilhar", map: "Mapa", call: "Ligar", info: "Info",
    menu: "Ementa", close: "Fechar", language: "Idioma", search: "Pesquisar", searchPlaceholder: "Prato ou ingrediente", filter: "Filtros", diet: "Dieta",
    vegan: "Vegano", vegetarian: "Vegetariano", avoid: "Sem", avoidHint: "Ocultar pratos com estes alergénios.", hiddenUnknown: ["1 prato sem informação de alergénios oculto.", "{n} pratos sem informação de alergénios ocultos."], showUnknown: "Mostrar mesmo assim",
    allergenUnknown: "Sem informação de alergénios — pergunte ao pessoal.", allergenNone: "Segundo o restaurante, não contém nenhum dos 14 alergénios principais.", results: ["1 prato", "{n} pratos"], noResults: "Nada encontrado.", reset: "Repor", done: "Concluído",
    from: "a partir de", sections: "Secções", textSize: "Tamanho do texto",
  },
  nl: {
    allergens: "Allergenen", notAvailable: "Niet beschikbaar", currentlyNotAvailable: "Momenteel niet beschikbaar", share: "Delen", map: "Kaart", call: "Bellen", info: "Info",
    menu: "Menukaart", close: "Sluiten", language: "Taal", search: "Zoeken", searchPlaceholder: "Gerecht of ingrediënt", filter: "Filters", diet: "Dieet",
    vegan: "Veganistisch", vegetarian: "Vegetarisch", avoid: "Zonder", avoidHint: "Gerechten met deze allergenen verbergen.", hiddenUnknown: ["1 gerecht zonder allergeneninformatie verborgen.", "{n} gerechten zonder allergeneninformatie verborgen."], showUnknown: "Toch tonen",
    allergenUnknown: "Geen allergeneninformatie — vraag het personeel.", allergenNone: "Bevat volgens het restaurant geen van de 14 belangrijkste allergenen.", results: ["1 gerecht", "{n} gerechten"], noResults: "Niets gevonden.", reset: "Herstellen", done: "Klaar",
    from: "vanaf", sections: "Rubrieken", textSize: "Tekstgrootte",
  },
  pl: {
    allergens: "Alergeny", notAvailable: "Niedostępne", currentlyNotAvailable: "Obecnie niedostępne", share: "Udostępnij", map: "Mapa", call: "Zadzwoń", info: "Info",
    menu: "Menu", close: "Zamknij", language: "Język", search: "Szukaj", searchPlaceholder: "Danie lub składnik", filter: "Filtry", diet: "Dieta",
    vegan: "Wegańskie", vegetarian: "Wegetariańskie", avoid: "Bez", avoidHint: "Ukryj dania z tymi alergenami.", hiddenUnknown: ["Ukryto 1 danie bez informacji o alergenach.", "Ukryto dań bez informacji o alergenach: {n}."], showUnknown: "Pokaż mimo to",
    allergenUnknown: "Brak informacji o alergenach — zapytaj obsługę.", allergenNone: "Według lokalu nie zawiera żadnego z 14 głównych alergenów.", results: ["1 danie", "Dań: {n}"], noResults: "Nic nie znaleziono.", reset: "Wyczyść", done: "Gotowe",
    from: "od", sections: "Działy", textSize: "Rozmiar tekstu",
  },
  cs: {
    allergens: "Alergeny", notAvailable: "Není k dispozici", currentlyNotAvailable: "Momentálně není k dispozici", share: "Sdílet", map: "Mapa", call: "Zavolat", info: "Info",
    menu: "Jídelní lístek", close: "Zavřít", language: "Jazyk", search: "Hledat", searchPlaceholder: "Jídlo nebo surovina", filter: "Filtry", diet: "Strava",
    vegan: "Veganské", vegetarian: "Vegetariánské", avoid: "Bez", avoidHint: "Skrýt jídla s těmito alergeny.", hiddenUnknown: ["Skryto 1 jídlo bez údajů o alergenech.", "Skryto jídel bez údajů o alergenech: {n}."], showUnknown: "Přesto zobrazit",
    allergenUnknown: "Bez údajů o alergenech — zeptejte se obsluhy.", allergenNone: "Podle podniku neobsahuje žádný ze 14 hlavních alergenů.", results: ["1 jídlo", "Jídel: {n}"], noResults: "Nic nenalezeno.", reset: "Zrušit", done: "Hotovo",
    from: "od", sections: "Sekce", textSize: "Velikost písma",
  },
  sk: {
    allergens: "Alergény", notAvailable: "Nedostupné", currentlyNotAvailable: "Momentálne nedostupné", share: "Zdieľať", map: "Mapa", call: "Zavolať", info: "Info",
    menu: "Jedálny lístok", close: "Zavrieť", language: "Jazyk", search: "Hľadať", searchPlaceholder: "Jedlo alebo surovina", filter: "Filtre", diet: "Strava",
    vegan: "Vegánske", vegetarian: "Vegetariánske", avoid: "Bez", avoidHint: "Skryť jedlá s týmito alergénmi.", hiddenUnknown: ["Skryté 1 jedlo bez údajov o alergénoch.", "Skrytých jedál bez údajov o alergénoch: {n}."], showUnknown: "Aj tak zobraziť",
    allergenUnknown: "Bez údajov o alergénoch — opýtajte sa obsluhy.", allergenNone: "Podľa podniku neobsahuje žiadny zo 14 hlavných alergénov.", results: ["1 jedlo", "Jedál: {n}"], noResults: "Nič sa nenašlo.", reset: "Zrušiť", done: "Hotovo",
    from: "od", sections: "Sekcie", textSize: "Veľkosť písma",
  },
  sl: {
    allergens: "Alergeni", notAvailable: "Ni na voljo", currentlyNotAvailable: "Trenutno ni na voljo", share: "Deli", map: "Zemljevid", call: "Pokliči", info: "Info",
    menu: "Jedilni list", close: "Zapri", language: "Jezik", search: "Išči", searchPlaceholder: "Jed ali sestavina", filter: "Filtri", diet: "Prehrana",
    vegan: "Vegansko", vegetarian: "Vegetarijansko", avoid: "Brez", avoidHint: "Skrij jedi s temi alergeni.", hiddenUnknown: ["Skrita 1 jed brez podatkov o alergenih.", "Skritih jedi brez podatkov o alergenih: {n}."], showUnknown: "Vseeno pokaži",
    allergenUnknown: "Ni podatkov o alergenih — vprašajte osebje.", allergenNone: "Po navedbah lokala ne vsebuje nobenega od 14 glavnih alergenov.", results: ["1 jed", "Jedi: {n}"], noResults: "Ni zadetkov.", reset: "Ponastavi", done: "Končano",
    from: "od", sections: "Razdelki", textSize: "Velikost besedila",
  },
  hu: {
    allergens: "Allergének", notAvailable: "Nem elérhető", currentlyNotAvailable: "Jelenleg nem elérhető", share: "Megosztás", map: "Térkép", call: "Hívás", info: "Infó",
    menu: "Étlap", close: "Bezárás", language: "Nyelv", search: "Keresés", searchPlaceholder: "Étel vagy hozzávaló", filter: "Szűrők", diet: "Étrend",
    vegan: "Vegán", vegetarian: "Vegetáriánus", avoid: "Nélkül", avoidHint: "Az ezeket az allergéneket tartalmazó ételek elrejtése.", hiddenUnknown: ["1 allergéninformáció nélküli étel elrejtve.", "{n} allergéninformáció nélküli étel elrejtve."], showUnknown: "Mutasd mégis",
    allergenUnknown: "Nincs allergéninformáció — kérdezze a személyzetet.", allergenNone: "Az étterem szerint a 14 fő allergén egyikét sem tartalmazza.", results: ["1 étel", "{n} étel"], noResults: "Nincs találat.", reset: "Alaphelyzet", done: "Kész",
    from: "-tól", sections: "Részek", textSize: "Betűméret",
  },
  ro: {
    allergens: "Alergeni", notAvailable: "Indisponibil", currentlyNotAvailable: "Momentan indisponibil", share: "Distribuie", map: "Hartă", call: "Sună", info: "Info",
    menu: "Meniu", close: "Închide", language: "Limbă", search: "Caută", searchPlaceholder: "Preparat sau ingredient", filter: "Filtre", diet: "Dietă",
    vegan: "Vegan", vegetarian: "Vegetarian", avoid: "Fără", avoidHint: "Ascunde preparatele cu acești alergeni.", hiddenUnknown: ["1 preparat fără informații despre alergeni ascuns.", "{n} preparate fără informații despre alergeni ascunse."], showUnknown: "Arată oricum",
    allergenUnknown: "Fără informații despre alergeni — întrebați personalul.", allergenNone: "Conform localului, nu conține niciunul dintre cei 14 alergeni principali.", results: ["1 preparat", "{n} preparate"], noResults: "Nimic găsit.", reset: "Resetează", done: "Gata",
    from: "de la", sections: "Secțiuni", textSize: "Mărimea textului",
  },
  hr: {
    allergens: "Alergeni", notAvailable: "Nije dostupno", currentlyNotAvailable: "Trenutno nije dostupno", share: "Podijeli", map: "Karta", call: "Nazovi", info: "Info",
    menu: "Jelovnik", close: "Zatvori", language: "Jezik", search: "Traži", searchPlaceholder: "Jelo ili sastojak", filter: "Filtri", diet: "Prehrana",
    vegan: "Vegansko", vegetarian: "Vegetarijansko", avoid: "Bez", avoidHint: "Sakrij jela s ovim alergenima.", hiddenUnknown: ["Skriveno 1 jelo bez podataka o alergenima.", "Skriveno jela bez podataka o alergenima: {n}."], showUnknown: "Svejedno prikaži",
    allergenUnknown: "Nema podataka o alergenima — pitajte osoblje.", allergenNone: "Prema lokalu ne sadrži nijedan od 14 glavnih alergena.", results: ["1 jelo", "Jela: {n}"], noResults: "Ništa nije pronađeno.", reset: "Poništi", done: "Gotovo",
    from: "od", sections: "Odjeljci", textSize: "Veličina teksta",
  },
  sr: {
    allergens: "Алергени", notAvailable: "Није доступно", currentlyNotAvailable: "Тренутно није доступно", share: "Подели", map: "Мапа", call: "Позови", info: "Инфо",
    menu: "Јеловник", close: "Затвори", language: "Језик", search: "Претрага", searchPlaceholder: "Јело или састојак", filter: "Филтери", diet: "Исхрана",
    vegan: "Веганско", vegetarian: "Вегетаријанско", avoid: "Без", avoidHint: "Сакриј јела са овим алергенима.", hiddenUnknown: ["Сакривено 1 јело без података о алергенима.", "Сакривено јела без података о алергенима: {n}."], showUnknown: "Ипак прикажи",
    allergenUnknown: "Нема података о алергенима — питајте особље.", allergenNone: "Према локалу не садржи ниједан од 14 главних алергена.", results: ["1 јело", "Јела: {n}"], noResults: "Ништа није пронађено.", reset: "Поништи", done: "Готово",
    from: "од", sections: "Одељци", textSize: "Величина текста",
  },
  el: {
    allergens: "Αλλεργιογόνα", notAvailable: "Μη διαθέσιμο", currentlyNotAvailable: "Προς το παρόν μη διαθέσιμο", share: "Κοινοποίηση", map: "Χάρτης", call: "Κλήση", info: "Πληροφορίες",
    menu: "Κατάλογος", close: "Κλείσιμο", language: "Γλώσσα", search: "Αναζήτηση", searchPlaceholder: "Πιάτο ή υλικό", filter: "Φίλτρα", diet: "Διατροφή",
    vegan: "Βίγκαν", vegetarian: "Χορτοφαγικό", avoid: "Χωρίς", avoidHint: "Απόκρυψη πιάτων με αυτά τα αλλεργιογόνα.", hiddenUnknown: ["1 πιάτο χωρίς στοιχεία αλλεργιογόνων κρύφτηκε.", "{n} πιάτα χωρίς στοιχεία αλλεργιογόνων κρύφτηκαν."], showUnknown: "Εμφάνιση ούτως ή άλλως",
    allergenUnknown: "Χωρίς στοιχεία αλλεργιογόνων — ρωτήστε το προσωπικό.", allergenNone: "Σύμφωνα με το κατάστημα δεν περιέχει κανένα από τα 14 κύρια αλλεργιογόνα.", results: ["1 πιάτο", "{n} πιάτα"], noResults: "Δεν βρέθηκε τίποτα.", reset: "Επαναφορά", done: "Έγινε",
    from: "από", sections: "Ενότητες", textSize: "Μέγεθος κειμένου",
  },
  tr: {
    allergens: "Alerjenler", notAvailable: "Mevcut değil", currentlyNotAvailable: "Şu anda mevcut değil", share: "Paylaş", map: "Harita", call: "Ara", info: "Bilgi",
    menu: "Menü", close: "Kapat", language: "Dil", search: "Ara", searchPlaceholder: "Yemek veya malzeme", filter: "Filtreler", diet: "Beslenme",
    vegan: "Vegan", vegetarian: "Vejetaryen", avoid: "İçermeyen", avoidHint: "Bu alerjenleri içeren yemekleri gizle.", hiddenUnknown: ["Alerjen bilgisi olmayan 1 yemek gizlendi.", "Alerjen bilgisi olmayan {n} yemek gizlendi."], showUnknown: "Yine de göster",
    allergenUnknown: "Alerjen bilgisi yok — lütfen personele sorun.", allergenNone: "İşletmeye göre 14 ana alerjenden hiçbirini içermez.", results: ["1 yemek", "{n} yemek"], noResults: "Sonuç bulunamadı.", reset: "Sıfırla", done: "Tamam",
    from: "itibaren", sections: "Bölümler", textSize: "Yazı boyutu",
  },
  ru: {
    allergens: "Аллергены", notAvailable: "Нет в наличии", currentlyNotAvailable: "Сейчас недоступно", share: "Поделиться", map: "Карта", call: "Позвонить", info: "Инфо",
    menu: "Меню", close: "Закрыть", language: "Язык", search: "Поиск", searchPlaceholder: "Блюдо или ингредиент", filter: "Фильтры", diet: "Питание",
    vegan: "Веган", vegetarian: "Вегетарианское", avoid: "Без", avoidHint: "Скрыть блюда с этими аллергенами.", hiddenUnknown: ["Скрыто 1 блюдо без данных об аллергенах.", "Скрыто блюд без данных об аллергенах: {n}."], showUnknown: "Всё равно показать",
    allergenUnknown: "Нет данных об аллергенах — спросите у персонала.", allergenNone: "По данным заведения не содержит ни одного из 14 основных аллергенов.", results: ["1 блюдо", "Блюд: {n}"], noResults: "Ничего не найдено.", reset: "Сбросить", done: "Готово",
    from: "от", sections: "Разделы", textSize: "Размер текста",
  },
  ar: {
    allergens: "مسببات الحساسية", notAvailable: "غير متوفر", currentlyNotAvailable: "غير متوفر حاليًا", share: "مشاركة", map: "الخريطة", call: "اتصال", info: "معلومات",
    menu: "قائمة الطعام", close: "إغلاق", language: "اللغة", search: "بحث", searchPlaceholder: "طبق أو مكوّن", filter: "تصفية", diet: "النظام الغذائي",
    vegan: "نباتي صرف", vegetarian: "نباتي", avoid: "بدون", avoidHint: "إخفاء الأطباق التي تحتوي على هذه المسببات.", hiddenUnknown: ["تم إخفاء طبق واحد بلا معلومات عن مسببات الحساسية.", "تم إخفاء {n} أطباق بلا معلومات عن مسببات الحساسية."], showUnknown: "إظهار على أي حال",
    allergenUnknown: "لا توجد معلومات عن مسببات الحساسية — اسأل الموظفين.", allergenNone: "بحسب المطعم لا يحتوي على أي من مسببات الحساسية الرئيسية الـ14.", results: ["طبق واحد", "{n} أطباق"], noResults: "لا توجد نتائج.", reset: "إعادة ضبط", done: "تم",
    from: "ابتداءً من", sections: "الأقسام", textSize: "حجم النص",
  },
  zh: {
    allergens: "过敏原", notAvailable: "暂无供应", currentlyNotAvailable: "目前暂无供应", share: "分享", map: "地图", call: "致电", info: "信息",
    menu: "菜单", close: "关闭", language: "语言", search: "搜索", searchPlaceholder: "菜品或食材", filter: "筛选", diet: "饮食",
    vegan: "纯素", vegetarian: "素食", avoid: "不含", avoidHint: "隐藏含有这些过敏原的菜品。", hiddenUnknown: ["已隐藏 1 道无过敏原信息的菜品。", "已隐藏 {n} 道无过敏原信息的菜品。"], showUnknown: "仍然显示",
    allergenUnknown: "暂无过敏原信息，请咨询服务人员。", allergenNone: "据餐厅说明，不含 14 种主要过敏原。", results: ["1 道菜", "{n} 道菜"], noResults: "未找到结果。", reset: "重置", done: "完成",
    from: "起", sections: "分类", textSize: "字号",
  },
  ja: {
    allergens: "アレルゲン", notAvailable: "提供できません", currentlyNotAvailable: "現在提供できません", share: "共有", map: "地図", call: "電話", info: "情報",
    menu: "メニュー", close: "閉じる", language: "言語", search: "検索", searchPlaceholder: "料理または食材", filter: "絞り込み", diet: "食事",
    vegan: "ヴィーガン", vegetarian: "ベジタリアン", avoid: "不使用", avoidHint: "これらのアレルゲンを含む料理を非表示にします。", hiddenUnknown: ["アレルゲン情報のない料理を1品非表示にしました。", "アレルゲン情報のない料理を{n}品非表示にしました。"], showUnknown: "それでも表示",
    allergenUnknown: "アレルゲン情報はありません。スタッフにお尋ねください。", allergenNone: "店舗によると、主要14アレルゲンは含まれていません。", results: ["1品", "{n}品"], noResults: "見つかりませんでした。", reset: "リセット", done: "完了",
    from: "〜", sections: "セクション", textSize: "文字サイズ",
  },
  ko: {
    allergens: "알레르기 유발 성분", notAvailable: "제공 불가", currentlyNotAvailable: "현재 제공되지 않습니다", share: "공유", map: "지도", call: "전화", info: "정보",
    menu: "메뉴", close: "닫기", language: "언어", search: "검색", searchPlaceholder: "요리 또는 재료", filter: "필터", diet: "식단",
    vegan: "비건", vegetarian: "채식", avoid: "제외", avoidHint: "이 알레르기 성분이 든 요리를 숨깁니다.", hiddenUnknown: ["알레르기 정보가 없는 요리 1개를 숨겼습니다.", "알레르기 정보가 없는 요리 {n}개를 숨겼습니다."], showUnknown: "그래도 보기",
    allergenUnknown: "알레르기 정보가 없습니다. 직원에게 문의하세요.", allergenNone: "매장에 따르면 14가지 주요 알레르기 유발 성분이 들어 있지 않습니다.", results: ["요리 1개", "요리 {n}개"], noResults: "결과가 없습니다.", reset: "초기화", done: "완료",
    from: "부터", sections: "섹션", textSize: "글자 크기",
  },
};

// Short allergen names (EU/Austrian codes A–R), for chips and the legend.
const A = (list: string[]): Record<string, string> =>
  Object.fromEntries(["A", "B", "C", "D", "E", "F", "G", "H", "L", "M", "N", "O", "P", "R"].map((c, i) => [c, list[i]]));

export const ALLERGEN_EXTRA: Record<string, Record<string, string>> = {
  fr: A(["Gluten", "Crustacés", "Œufs", "Poisson", "Arachides", "Soja", "Lait", "Fruits à coque", "Céleri", "Moutarde", "Sésame", "Sulfites", "Lupin", "Mollusques"]),
  es: A(["Gluten", "Crustáceos", "Huevos", "Pescado", "Cacahuetes", "Soja", "Leche", "Frutos de cáscara", "Apio", "Mostaza", "Sésamo", "Sulfitos", "Altramuces", "Moluscos"]),
  pt: A(["Glúten", "Crustáceos", "Ovos", "Peixe", "Amendoins", "Soja", "Leite", "Frutos de casca rija", "Aipo", "Mostarda", "Sésamo", "Sulfitos", "Tremoço", "Moluscos"]),
  nl: A(["Gluten", "Schaaldieren", "Eieren", "Vis", "Pinda’s", "Soja", "Melk", "Noten", "Selderij", "Mosterd", "Sesam", "Sulfiet", "Lupine", "Weekdieren"]),
  pl: A(["Gluten", "Skorupiaki", "Jaja", "Ryby", "Orzeszki ziemne", "Soja", "Mleko", "Orzechy", "Seler", "Gorczyca", "Sezam", "Siarczyny", "Łubin", "Mięczaki"]),
  cs: A(["Lepek", "Korýši", "Vejce", "Ryby", "Arašídy", "Sója", "Mléko", "Skořápkové plody", "Celer", "Hořčice", "Sezam", "Siřičitany", "Vlčí bob", "Měkkýši"]),
  sk: A(["Lepok", "Kôrovce", "Vajcia", "Ryby", "Arašidy", "Sója", "Mlieko", "Orechy", "Zeler", "Horčica", "Sezam", "Siričitany", "Vlčí bôb", "Mäkkýše"]),
  sl: A(["Gluten", "Raki", "Jajca", "Ribe", "Arašidi", "Soja", "Mleko", "Oreški", "Zelena", "Gorčica", "Sezam", "Sulfiti", "Volčji bob", "Mehkužci"]),
  hu: A(["Glutén", "Rákfélék", "Tojás", "Hal", "Földimogyoró", "Szója", "Tej", "Diófélék", "Zeller", "Mustár", "Szezám", "Szulfitok", "Csillagfürt", "Puhatestűek"]),
  ro: A(["Gluten", "Crustacee", "Ouă", "Pește", "Arahide", "Soia", "Lapte", "Fructe cu coajă", "Țelină", "Muștar", "Susan", "Sulfiți", "Lupin", "Moluște"]),
  hr: A(["Gluten", "Rakovi", "Jaja", "Riba", "Kikiriki", "Soja", "Mlijeko", "Orašasti plodovi", "Celer", "Gorušica", "Sezam", "Sulfiti", "Lupina", "Mekušci"]),
  sr: A(["Глутен", "Ракови", "Јаја", "Риба", "Кикирики", "Соја", "Млеко", "Орашасти плодови", "Целер", "Сенф", "Сусам", "Сулфити", "Лупина", "Мекушци"]),
  el: A(["Γλουτένη", "Καρκινοειδή", "Αυγά", "Ψάρι", "Αράπικα φιστίκια", "Σόγια", "Γάλα", "Ξηροί καρποί", "Σέλινο", "Μουστάρδα", "Σουσάμι", "Θειώδη", "Λούπινο", "Μαλάκια"]),
  tr: A(["Gluten", "Kabuklular", "Yumurta", "Balık", "Yer fıstığı", "Soya", "Süt", "Sert kabuklu yemişler", "Kereviz", "Hardal", "Susam", "Sülfitler", "Acı bakla", "Yumuşakçalar"]),
  ru: A(["Глютен", "Ракообразные", "Яйца", "Рыба", "Арахис", "Соя", "Молоко", "Орехи", "Сельдерей", "Горчица", "Кунжут", "Сульфиты", "Люпин", "Моллюски"]),
  ar: A(["الغلوتين", "القشريات", "البيض", "السمك", "الفول السوداني", "الصويا", "الحليب", "المكسرات", "الكرفس", "الخردل", "السمسم", "الكبريتيت", "الترمس", "الرخويات"]),
  zh: A(["麸质", "甲壳类", "蛋", "鱼", "花生", "大豆", "奶", "坚果", "芹菜", "芥末", "芝麻", "亚硫酸盐", "羽扇豆", "软体动物"]),
  ja: A(["グルテン", "甲殻類", "卵", "魚", "落花生", "大豆", "乳", "ナッツ類", "セロリ", "マスタード", "ごま", "亜硫酸塩", "ルピナス", "軟体動物"]),
  ko: A(["글루텐", "갑각류", "달걀", "생선", "땅콩", "대두", "우유", "견과류", "셀러리", "겨자", "참깨", "아황산염", "루핀", "연체동물"]),
};
