// The waiter call (CallButton) in every guest-menu language. Same idea as menu-i18n-open.ts:
// a small table of its own, so the button does not drag the big interface table along.

export type CallStrings = {
  /** "{n}" = the table number */
  table: string;
  button: string;
  title: string;
  order: [string, string];
  bill: [string, string];
  help: [string, string];
  sent: string;
  accepted: string;
  done: string;
  cancel: string;
  close: string;
  limit: string;
  error: string;
};

const S: Record<string, CallStrings> = {
  de: { table: "Tisch {n}", button: "Kellner rufen", title: "Wie können wir helfen?", order: ["Bestellen", "Wir kommen an den Tisch"], bill: ["Zahlen", "Die Rechnung, bitte"], help: ["Frage", "Jemand kommt kurz vorbei"], sent: "Gesendet — das Team weiß Bescheid", accepted: "Kommt gleich zu Ihnen", done: "Erledigt", cancel: "Zurücknehmen", close: "Schließen", limit: "Das Team ist schon informiert. Bitte einen Moment Geduld.", error: "Hat leider nicht geklappt. Bitte sprechen Sie das Personal direkt an." },
  en: { table: "Table {n}", button: "Call waiter", title: "How can we help?", order: ["Order", "We'll come to your table"], bill: ["Pay", "The bill, please"], help: ["Question", "Someone will stop by"], sent: "Sent — the team has been notified", accepted: "On the way to you", done: "Done", cancel: "Cancel", close: "Close", limit: "The team already knows. Please bear with us for a moment.", error: "That didn't work. Please ask the staff directly." },
  it: { table: "Tavolo {n}", button: "Chiama il cameriere", title: "Come possiamo aiutarti?", order: ["Ordinare", "Veniamo al tavolo"], bill: ["Pagare", "Il conto, per favore"], help: ["Domanda", "Passa qualcuno"], sent: "Inviato — il personale è avvisato", accepted: "Arriviamo subito", done: "Fatto", cancel: "Annulla", close: "Chiudi", limit: "Il personale è già avvisato. Un attimo di pazienza, per favore.", error: "Non è andato a buon fine. Chiedi direttamente al personale." },
  fr: { table: "Table {n}", button: "Appeler le serveur", title: "Comment pouvons-nous aider ?", order: ["Commander", "Nous venons à votre table"], bill: ["Payer", "L’addition, s’il vous plaît"], help: ["Question", "Quelqu’un passe vous voir"], sent: "Envoyé — l’équipe est prévenue", accepted: "On arrive", done: "Terminé", cancel: "Annuler", close: "Fermer", limit: "L’équipe est déjà prévenue. Merci de patienter un instant.", error: "Cela n’a pas fonctionné. Merci de vous adresser au personnel." },
  es: { table: "Mesa {n}", button: "Llamar al camarero", title: "¿En qué podemos ayudar?", order: ["Pedir", "Vamos a su mesa"], bill: ["Pagar", "La cuenta, por favor"], help: ["Pregunta", "Alguien pasará enseguida"], sent: "Enviado — el equipo está avisado", accepted: "Vamos enseguida", done: "Hecho", cancel: "Cancelar", close: "Cerrar", limit: "El equipo ya está avisado. Un momento, por favor.", error: "No ha funcionado. Por favor, hable con el personal." },
  pt: { table: "Mesa {n}", button: "Chamar o empregado", title: "Como podemos ajudar?", order: ["Pedir", "Vamos à sua mesa"], bill: ["Pagar", "A conta, por favor"], help: ["Pergunta", "Alguém passa já"], sent: "Enviado — a equipa foi avisada", accepted: "Vamos já", done: "Feito", cancel: "Cancelar", close: "Fechar", limit: "A equipa já foi avisada. Um momento, por favor.", error: "Não funcionou. Por favor, fale com o pessoal." },
  nl: { table: "Tafel {n}", button: "Ober roepen", title: "Waarmee kunnen we helpen?", order: ["Bestellen", "We komen naar uw tafel"], bill: ["Betalen", "De rekening, graag"], help: ["Vraag", "Er komt iemand langs"], sent: "Verstuurd — het team weet het", accepted: "Komt eraan", done: "Klaar", cancel: "Intrekken", close: "Sluiten", limit: "Het team weet het al. Even geduld, alstublieft.", error: "Dat is niet gelukt. Spreek het personeel direct aan." },
  pl: { table: "Stolik {n}", button: "Zawołaj kelnera", title: "W czym możemy pomóc?", order: ["Zamówić", "Podejdziemy do stolika"], bill: ["Zapłacić", "Poproszę rachunek"], help: ["Pytanie", "Ktoś zaraz podejdzie"], sent: "Wysłano — obsługa wie", accepted: "Już idziemy", done: "Gotowe", cancel: "Cofnij", close: "Zamknij", limit: "Obsługa już wie. Prosimy o chwilę cierpliwości.", error: "Nie udało się. Prosimy zwrócić się do obsługi." },
  cs: { table: "Stůl {n}", button: "Zavolat číšníka", title: "Jak můžeme pomoci?", order: ["Objednat", "Přijdeme ke stolu"], bill: ["Zaplatit", "Účet, prosím"], help: ["Dotaz", "Někdo se zastaví"], sent: "Odesláno — obsluha ví", accepted: "Už jdeme", done: "Hotovo", cancel: "Zrušit", close: "Zavřít", limit: "Obsluha už ví. Chvilku strpení, prosím.", error: "Nepodařilo se. Obraťte se prosím přímo na obsluhu." },
  sk: { table: "Stôl {n}", button: "Zavolať čašníka", title: "Ako môžeme pomôcť?", order: ["Objednať", "Prídeme k stolu"], bill: ["Zaplatiť", "Účet, prosím"], help: ["Otázka", "Niekto sa zastaví"], sent: "Odoslané — obsluha vie", accepted: "Už ideme", done: "Hotovo", cancel: "Zrušiť", close: "Zavrieť", limit: "Obsluha už vie. Chvíľu strpenia, prosím.", error: "Nepodarilo sa. Obráťte sa prosím priamo na obsluhu." },
  sl: { table: "Miza {n}", button: "Pokliči natakarja", title: "Kako lahko pomagamo?", order: ["Naročiti", "Pridemo k mizi"], bill: ["Plačati", "Račun, prosim"], help: ["Vprašanje", "Nekdo bo prišel mimo"], sent: "Poslano — ekipa ve", accepted: "Že prihajamo", done: "Opravljeno", cancel: "Prekliči", close: "Zapri", limit: "Ekipa že ve. Prosimo za trenutek potrpljenja.", error: "Ni uspelo. Prosimo, obrnite se neposredno na osebje." },
  hu: { table: "{n}. asztal", button: "Pincér hívása", title: "Miben segíthetünk?", order: ["Rendelés", "Odamegyünk az asztalhoz"], bill: ["Fizetés", "A számlát, kérem"], help: ["Kérdés", "Valaki mindjárt jön"], sent: "Elküldve — a személyzet tudja", accepted: "Mindjárt jövünk", done: "Kész", cancel: "Visszavonás", close: "Bezárás", limit: "A személyzet már tudja. Kérjük, egy pillanat türelmet.", error: "Nem sikerült. Kérjük, szóljon közvetlenül a személyzetnek." },
  ro: { table: "Masa {n}", button: "Cheamă ospătarul", title: "Cu ce vă putem ajuta?", order: ["Comandă", "Venim la masă"], bill: ["Plată", "Nota, vă rog"], help: ["Întrebare", "Vine cineva imediat"], sent: "Trimis — echipa știe", accepted: "Venim imediat", done: "Gata", cancel: "Anulează", close: "Închide", limit: "Echipa știe deja. Vă rugăm, un moment de răbdare.", error: "Nu a funcționat. Vă rugăm să vorbiți direct cu personalul." },
  hr: { table: "Stol {n}", button: "Pozovi konobara", title: "Kako možemo pomoći?", order: ["Naručiti", "Dolazimo do stola"], bill: ["Platiti", "Račun, molim"], help: ["Pitanje", "Netko će svratiti"], sent: "Poslano — osoblje zna", accepted: "Stižemo", done: "Gotovo", cancel: "Poništi", close: "Zatvori", limit: "Osoblje već zna. Molimo trenutak strpljenja.", error: "Nije uspjelo. Molimo obratite se izravno osoblju." },
  sr: { table: "Сто {n}", button: "Позови конобара", title: "Како можемо да помогнемо?", order: ["Поручити", "Долазимо до стола"], bill: ["Платити", "Рачун, молим"], help: ["Питање", "Неко ће свратити"], sent: "Послато — особље зна", accepted: "Стижемо", done: "Готово", cancel: "Поништи", close: "Затвори", limit: "Особље већ зна. Молимо тренутак стрпљења.", error: "Није успело. Молимо обратите се директно особљу." },
  el: { table: "Τραπέζι {n}", button: "Κλήση σερβιτόρου", title: "Πώς μπορούμε να βοηθήσουμε;", order: ["Παραγγελία", "Ερχόμαστε στο τραπέζι"], bill: ["Πληρωμή", "Τον λογαριασμό, παρακαλώ"], help: ["Ερώτηση", "Κάποιος θα περάσει"], sent: "Στάλθηκε — το προσωπικό ενημερώθηκε", accepted: "Ερχόμαστε", done: "Έγινε", cancel: "Ακύρωση", close: "Κλείσιμο", limit: "Το προσωπικό έχει ήδη ενημερωθεί. Λίγη υπομονή, παρακαλώ.", error: "Δεν λειτούργησε. Απευθυνθείτε απευθείας στο προσωπικό." },
  tr: { table: "Masa {n}", button: "Garson çağır", title: "Nasıl yardımcı olabiliriz?", order: ["Sipariş", "Masanıza geliyoruz"], bill: ["Ödeme", "Hesap, lütfen"], help: ["Soru", "Biri hemen uğrayacak"], sent: "Gönderildi — ekip haberdar", accepted: "Hemen geliyoruz", done: "Tamam", cancel: "Geri al", close: "Kapat", limit: "Ekip zaten haberdar. Lütfen biraz sabır.", error: "Olmadı. Lütfen doğrudan personele başvurun." },
  ru: { table: "Стол {n}", button: "Позвать официанта", title: "Чем можем помочь?", order: ["Заказать", "Подойдём к столу"], bill: ["Оплатить", "Счёт, пожалуйста"], help: ["Вопрос", "Сейчас кто-нибудь подойдёт"], sent: "Отправлено — персонал в курсе", accepted: "Уже идём", done: "Готово", cancel: "Отменить", close: "Закрыть", limit: "Персонал уже в курсе. Минуту терпения, пожалуйста.", error: "Не получилось. Пожалуйста, обратитесь к персоналу." },
  uk: { table: "Стіл {n}", button: "Покликати офіціанта", title: "Чим можемо допомогти?", order: ["Замовити", "Підійдемо до столу"], bill: ["Оплатити", "Рахунок, будь ласка"], help: ["Питання", "Зараз хтось підійде"], sent: "Надіслано — персонал знає", accepted: "Вже йдемо", done: "Готово", cancel: "Скасувати", close: "Закрити", limit: "Персонал уже знає. Хвилинку терпіння, будь ласка.", error: "Не вдалося. Будь ласка, зверніться до персоналу." },
  ar: { table: "طاولة {n}", button: "استدعاء النادل", title: "كيف يمكننا المساعدة؟", order: ["طلب", "سنأتي إلى طاولتك"], bill: ["الدفع", "الحساب من فضلك"], help: ["سؤال", "سيمر أحدنا قريبًا"], sent: "تم الإرسال — الفريق على علم", accepted: "في الطريق إليك", done: "تم", cancel: "إلغاء", close: "إغلاق", limit: "الفريق على علم بالفعل. يرجى الانتظار لحظة.", error: "لم ينجح ذلك. يرجى التحدث إلى الموظفين مباشرة." },
  zh: { table: "{n} 号桌", button: "呼叫服务员", title: "需要什么帮助？", order: ["点餐", "我们马上到您桌前"], bill: ["结账", "请买单"], help: ["咨询", "马上有人过来"], sent: "已发送 · 服务员已收到", accepted: "马上就到", done: "已完成", cancel: "撤回", close: "关闭", limit: "服务员已收到通知，请稍候。", error: "发送失败，请直接联系服务员。" },
  ja: { table: "{n}番テーブル", button: "店員を呼ぶ", title: "ご用件をお選びください", order: ["注文", "お席に伺います"], bill: ["お会計", "お会計をお願いします"], help: ["質問", "スタッフが伺います"], sent: "送信しました · スタッフに通知済み", accepted: "すぐに伺います", done: "完了", cancel: "取り消す", close: "閉じる", limit: "スタッフには通知済みです。少々お待ちください。", error: "送信できませんでした。スタッフに直接お声がけください。" },
  ko: { table: "{n}번 테이블", button: "직원 호출", title: "무엇을 도와드릴까요?", order: ["주문", "테이블로 가겠습니다"], bill: ["결제", "계산서 부탁드립니다"], help: ["문의", "곧 직원이 들르겠습니다"], sent: "전송됨 · 직원에게 알렸습니다", accepted: "곧 가겠습니다", done: "완료", cancel: "취소", close: "닫기", limit: "직원이 이미 알고 있습니다. 잠시만 기다려 주세요.", error: "전송하지 못했습니다. 직원에게 직접 말씀해 주세요." },
};

export function callText(locale: string): CallStrings {
  return S[locale] ?? S.en;
}

/** "Tisch 4" in the guest's language; named tables ("Terrasse") stay as they are. */
export function tableText(label: string, locale: string): string {
  return /^\d+[a-z]?$/i.test(label) ? callText(locale).table.replace("{n}", label) : label;
}

export const CALL_LOCALES = Object.keys(S);
