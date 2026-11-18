/* Keep the host's six language choices. Placeholders also allow the count and note to move. */
(function (root) {
    'use strict';
    const languages = ['en','zh-TW','ja','de','it','el'];
    const lines = {
        focus: ['Focused AP practice','AP 集中訓練','AP 集中練習','Absolutes Gehör trainieren','Allenamento AP','Εξάσκηση απόλυτου τονικού ύψους'],
        back: ['Other exercises','其他練習','ほかの練習','Weitere Übungen','Altri esercizi','Άλλες ασκήσεις'],
        violin: ['Violin','小提琴','バイオリン','Violine','Violino','Βιολί'],
        piano: ['Piano','鋼琴','ピアノ','Klavier','Pianoforte','Πιάνο'],
        cold: ['Independent check','獨立檢查','独立チェック','Unabhängiger Test','Verifica indipendente','Ανεξάρτητος έλεγχος'],
        learn: ['Active learning','主動學習','学習','Lernen','Apprendimento','Ενεργή μάθηση'],
        consolidate: ['Consolidate','鞏固練習','定着練習','Festigen','Consolidamento','Εμπέδωση'],
        firstVisit: ['On your first day, hear your labelled notes and try active learning. Start with an independent check on later days.','第一天可以先聽有音名的示範，再做主動學習。之後每天第一次練習時，先做獨立檢查。','初日は音名つきの見本を聞いてから学習しましょう。翌日からは、その日最初に独立チェックを行います。','Höre am ersten Tag die beschrifteten Töne und beginne mit dem Lernen. Starte an den folgenden Tagen mit einem Test.','Il primo giorno ascolta gli esempi con il nome e inizia a esercitarti. Nei giorni successivi comincia con una verifica.','Την πρώτη μέρα άκουσε τις νότες με το όνομά τους. Τις επόμενες ημέρες ξεκίνα με έλεγχο.'],
        mask: ['Brief unpitched noise between questions','題目之間播放短暫的無音高噪聲','問題の間に短いノイズを入れる','Kurzes Rauschen zwischen den Aufgaben','Breve rumore tra le domande','Σύντομος θόρυβος ανάμεσα στις ερωτήσεις'],
        coldToday: ['Start today with one independent check, before playing examples.','今天先做一次獨立檢查，再聽示範音。','見本を聞く前に、今日最初のチェックを始めましょう。','Beginne heute mit einem Test vor den Hörbeispielen.','Inizia con una verifica prima di ascoltare gli esempi.','Ξεκίνα σήμερα με έναν έλεγχο πριν ακούσεις παραδείγματα.'],
        warmToday: ['You have heard a sound today. Continue with active learning.','今天已聽過練習音，可以繼續主動學習。','今日はすでに音を聞きました。学習を続けましょう。','Du hast heute schon einen Ton gehört. Übe im Lernmodus weiter.','Oggi hai già ascoltato un suono. Continua con l’apprendimento.','Έχεις ήδη ακούσει ήχο σήμερα. Συνέχισε με ενεργή μάθηση.'],
        coldHelp: ['12 notes · one listen · answers at the end','12 題 · 每題一次 · 整組結束後看答案','12問・再生は各1回・答えは最後に表示','12 Töne · einmal hören · Auflösung am Ende','12 note · un ascolto · risposte alla fine','12 νότες · μία ακρόαση · απαντήσεις στο τέλος'],
        learnHelp: ['{n} notes from your set and other notes · feedback after each answer','{n} 題 · 混合目前音集和其他音 · 每題立即回饋','{n}問・学習中の音とほかの音・毎回答え合わせ','{n} Töne aus deinem Tonvorrat und andere · sofortige Rückmeldung','{n} note del gruppo e altre note · riscontro immediato','{n} νότες από το σύνολό σου και άλλες · άμεση ανατροφοδότηση'],
        conHelp: ['{n} notes · optional · answers at the end','{n} 題 · 可選做一組 · 整組結束後看答案','{n}問・任意・答えは最後に表示','{n} Töne · freiwillig · Auflösung am Ende','{n} note · facoltativo · risposte alla fine','{n} νότες · προαιρετικά · απαντήσεις στο τέλος'],
        set: ['Learning set','學習音集','学習中の音','Lerntöne','Note in studio','Νότες εκμάθησης'],
        settings: ['Learning set & sound','調整音集與音色','学習音と音色の設定','Lerntöne und Klang einstellen','Configura note e timbro','Ρύθμιση νοτών και ήχου'],
        examples: ['Hear labelled notes','聆聽有音名的示範','音名つき見本','Beschriftete Hörbeispiele','Ascolta gli esempi con il nome','Ακρόαση με ονόματα'],
        second: ['Practise with a second instrument','加入第二種樂器練習','別の楽器も練習する','Zweites Instrument hinzunehmen','Esercitati con un secondo strumento','Εξάσκηση με δεύτερο όργανο'],
        secondHint: ['Listen to a familiar note on {instrument}. You can then mix it into practice.','先聽聽熟悉的音在{instrument}上的聲音，再決定是否加入混合練習。','{instrument}で知っている音を聞き、混合練習に加えられます。','Höre einen vertrauten Ton auf dem Instrument {instrument} und mische es bei Bedarf bei.','Ascolta una nota familiare con {instrument}, poi aggiungilo se vuoi.','Άκου μια γνώριμη νότα με {instrument} και πρόσθεσέ το στην εξάσκηση.'],
        mix20: ['Use 20% in practice','在練習中加入 20%','練習に20%加える','Mit 20 % beimischen','Usa il 20% in pratica','Πρόσθεσε 20% στην εξάσκηση'],
        share: ['Second instrument in practice','學習與鞏固中的第二樂器比例','練習時の第2楽器の割合','Anteil des zweiten Instruments','Quota del secondo strumento','Ποσοστό δεύτερου οργάνου'],
        size: ['Notes in a practice block','每組練習題數','練習1組の問題数','Töne pro Übungsblock','Note per sessione','Νότες ανά ενότητα'],
        thresholds: ['New-note thresholds','新增音名的提示條件','新しい音を提案する基準','Schwellen für neue Töne','Soglie per nuove note','Όρια για νέα νότα'],
        hit: ['Minimum target hits (%)','最低命中率（%）','最低正答率（%）','Mindesttrefferquote (%)','Minimo di risposte esatte (%)','Ελάχιστες επιτυχίες (%)'],
        fa: ['Maximum false alarms (%)','最高誤報率（%）','誤答許容率（%）','Höchste Fehlalarmrate (%)','Massimo di falsi allarmi (%)','Μέγιστοι ψευδείς συναγερμοί (%)'],
        newNote: ['Introduce {note}','加入 {note}','{note} を追加','{note} einführen','Introduci {note}','Προσθήκη {note}'],
        evidence: ['Practice records','練習記錄','練習記録','Übungsverlauf','Registro degli esercizi','Ιστορικό εξάσκησης'],
        progress: ['New-note suggestion · {blocks}/2 blocks, at least {first}/5 first answers per note, {outside}/10 outside notes.','新增音條件 · 練習 {blocks}/2 組，每音最少 {first}/5 次首答，音集外首答 {outside}/10 次。','新しい音の提案・{blocks}/2組、各音の初答 最少{first}/5、学習外の初答 {outside}/10。','Neuer Ton · {blocks}/2 Blöcke, je Ton mindestens {first}/5 Erstantworten, {outside}/10 andere Töne.','Nota nuova · {blocks}/2 sessioni, minimo {first}/5 prime risposte per nota, {outside}/10 note esterne.','Νέα νότα · {blocks}/2 ενότητες, τουλάχιστον {first}/5 πρώτες απαντήσεις ανά νότα, {outside}/10 άλλες νότες.'],
        rates: ['Mean target hit rate {hit} · false alarms {fa}','各音平均命中率 {hit} · 誤報率 {fa}','各音の平均正答率 {hit}・誤報率 {fa}','Mittlere Trefferquote {hit} · Fehlalarme {fa}','Media dei centri {hit} · falsi allarmi {fa}','Μέση επιτυχία {hit} · ψευδείς συναγερμοί {fa}'],
        note: ['Note','音名','音名','Ton','Nota','Νότα'],
        practice: ['Practice hits','練習命中','練習正答','Übungstreffer','Centri in pratica','Επιτυχίες εξάσκησης'],
        check: ['Check hits','檢查命中','チェック正答','Testtreffer','Centri in verifica','Επιτυχίες ελέγχου'],
        days: ['Check days','檢查天數','チェック日数','Testtage','Giorni di verifica','Ημέρες ελέγχου'],
        dayFirst: ['First sound of the day · {hits}/{n} correct','每日第一聲 · 答對 {hits}/{n}','その日の最初の音・正答 {hits}/{n}','Erster Ton des Tages · {hits}/{n} richtig','Primo suono del giorno · {hits}/{n} esatti','Πρώτος ήχος ημέρας · {hits}/{n} σωστά'],
        all: ['All octaves','全部八度','全オクターブ','Alle Oktaven','Tutte le ottave','Όλες οι οκτάβες'],
        recordHelp: ['Hits require the exact name on the first listen. Counts include targets heard with help.','首次聆聽答對音名才算命中。分母包含重播過的目標音。','最初の再生で音名が正しければ正答。分母には再生し直した対象音も含みます。','Ein Treffer erfordert die richtige Erstantwort. Der Nenner enthält wiederholte Zieltöne.','Un centro richiede il nome esatto al primo ascolto. Il totale include le note bersaglio riascoltate.','Επιτυχία σημαίνει σωστό όνομα στην πρώτη ακρόαση. Το σύνολο περιλαμβάνει νότες που ακούστηκαν ξανά.'],
        play: ['Play note','播放題目','問題の音を再生','Ton abspielen','Ascolta la nota','Αναπαραγωγή νότας'],
        next: ['Next note','下一題','次の問題','Nächster Ton','Nota successiva','Επόμενη νότα'],
        replay: ['Replay','重播','もう一度','Wiederholen','Riascolta','Επανάληψη'],
        answerSound: ['Hear the answer','重聽答案','正解を聞く','Lösung anhören','Ascolta la risposta','Άκου τη σωστή νότα'],
        out: ['Other','其他音','学習外の音','Anderer Ton','Altra nota','Άλλη νότα'],
        unsure: ['Not sure','不確定','わからない','Unsicher','Non so','Δεν ξέρω'],
        helpAnswer: ['Choose Other for a note outside your set. Choose Not sure if you cannot tell.','判斷為音集外的音，選「其他音」。無法判斷，選「不確定」。','学習中の音以外は「学習外の音」、判断できない時は「わからない」。','Wähle „Anderer Ton“ für einen Ton außerhalb deiner Auswahl und „Unsicher“, wenn du ihn nicht einordnen kannst.','Scegli Altra nota per una nota fuori dal gruppo e Non so se non riesci a stabilirlo.','Διάλεξε Άλλη νότα για νότα εκτός συνόλου ή Δεν ξέρω αν δεν μπορείς να κρίνεις.'],
        recorded: ['Answer saved','已記錄答案','回答を記録しました','Antwort gespeichert','Risposta salvata','Η απάντηση αποθηκεύτηκε'],
        right: ['Correct','答對','正解','Richtig','Giusto','Σωστά'],
        wrong: ['Correct answer','正確答案','正しい答え','Richtige Antwort','Risposta corretta','Σωστή απάντηση'],
        aided: ['With replay','重播後作答','再生後に回答','Mit Wiederholung','Con riascolto','Με επανάληψη'],
        interrupted: ['Playback interrupted · excluded','播放中斷 · 已排除','再生中断・集計対象外','Wiedergabe unterbrochen · ausgeschlossen','Riproduzione interrotta · esclusa','Διακοπή ήχου · εξαιρέθηκε'],
        audio: ['Audio problem','聲音有問題','音声トラブル','Tonproblem','Problema audio','Πρόβλημα ήχου'],
        audioError: ['Audio unavailable · excluded. Check the connection and try the next note.','無法播放 · 已排除。請檢查連線後繼續。','再生できません・集計対象外。接続を確認して続けてください。','Ton nicht verfügbar · ausgeschlossen. Prüfe die Verbindung.','Audio non disponibile · escluso. Verifica la connessione.','Ο ήχος δεν είναι διαθέσιμος · εξαιρέθηκε. Έλεγξε τη σύνδεση.'],
        wait: ['Loading audio…','正在載入聲音…','音声を読み込み中…','Klang wird geladen…','Caricamento audio…','Φόρτωση ήχου…'],
        choose: ['Which note did you hear?','你聽到哪個音？','どの音でしたか？','Welchen Ton hast du gehört?','Quale nota hai sentito?','Ποια νότα άκουσες;'],
        finish: ['Finish for now','結束本次練習','ここで終了','Für heute beenden','Termina qui','Τέλος εξάσκησης'],
        results: ['Review this block','查看本組結果','この組の結果','Ergebnisse ansehen','Rivedi la sessione','Αποτελέσματα ενότητας'],
        summary: ['Target hits {hits}/{total} · false alarms {alarms}/{outside} · replayed {aided}','目標命中 {hits}/{total} · 誤報 {alarms}/{outside} · 重播 {aided} 題','対象音正答 {hits}/{total}・誤報 {alarms}/{outside}・再生し直し {aided}問','Zieltreffer {hits}/{total} · Fehlalarme {alarms}/{outside} · wiederholt {aided}','Centri {hits}/{total} · falsi allarmi {alarms}/{outside} · riascolti {aided}','Επιτυχίες {hits}/{total} · ψευδείς συναγερμοί {alarms}/{outside} · επαναλήψεις {aided}'],
        answer: ['Your answer','你的答案','回答','Deine Antwort','La tua risposta','Απάντησή σου'],
        backup: ['Export AP backup','匯出 AP 備份','AP バックアップを書き出す','AP-Sicherung exportieren','Esporta backup AP','Εξαγωγή αντιγράφου AP'],
        restore: ['Import AP backup','匯入 AP 備份','AP バックアップを読み込む','AP-Sicherung importieren','Importa backup AP','Εισαγωγή αντιγράφου AP'],
        importOk: ['Backup merged.','已合併備份。','バックアップを統合しました。','Sicherung zusammengeführt.','Backup unito.','Το αντίγραφο συγχωνεύτηκε.'],
        importBad: ['Choose a focused AP backup from this instrument’s site.','請選擇來自同一樂器網站的集中訓練備份。','同じ楽器サイトの集中練習バックアップを選んでください。','Wähle eine AP-Sicherung dieser Instrumentenseite.','Scegli un backup AP dal sito dello stesso strumento.','Επίλεξε αντίγραφο AP από τον ιστότοπο του ίδιου οργάνου.'],
        countsLocal: ['AP answers stay in this browser. Training time uses your existing sync settings.','AP 答題記錄保存在此瀏覽器。訓練時長沿用原有同步設定。','回答はこのブラウザに保存されます。練習時間には既存の同期設定を使用します。','AP-Antworten bleiben in diesem Browser. Für die Übungszeit gelten die bisherigen Sync-Einstellungen.','Le risposte restano in questo browser. Il tempo usa le impostazioni di sincronizzazione esistenti.','Οι απαντήσεις μένουν σε αυτόν τον περιηγητή. Ο χρόνος ακολουθεί τις υπάρχουσες ρυθμίσεις συγχρονισμού.']
    };
    function t(lang,key,args = {}) {
        let value = lines[key][Math.max(0,languages.indexOf(lang))];
        for (const [name,v] of Object.entries(args)) value = value.replaceAll('{' + name + '}', v);
        return value;
    }
    for (const lang of languages) {
        TRANSLATIONS[lang].apFocus = t(lang,'focus');
        TRANSLATIONS[lang].apConsolidate = t(lang,'consolidate');
        TRANSLATIONS[lang].focusPiano = t(lang,'piano');
        TRANSLATIONS[lang].focusViolin = t(lang,'violin');
    }
    root.APFocusCopy = {t};
})(window);
