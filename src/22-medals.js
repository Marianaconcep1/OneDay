/* ---------- Project dates, completion and medals ----------
   A project has a start date, a target completion date and a sentence saying what finishing
   means. Dates never complete anything: when a target date passes, the person chooses to
   review, adjust or end. Only a confirmed completion earns a medal, saved at that moment
   (one per project or dated milestone, whatever is tapped or reloaded). The gift box that
   reveals it waits, closed, until the person opens it, and never appears over Rest Mode. */
const MD = {
  en: { start: 'Start date', target: 'Target completion date', targetHint: 'Required for a project with a finish. You can change it later without losing progress.',
    criteria: 'Completion criteria', criteriaHint: 'What finishing means, in a sentence.', criteriaPh: 'e.g. $1,000 set aside in my savings buffer',
    errTarget: 'Choose a target completion date.', errOrder: 'The target date needs to be on or after the start date.', errCriteria: 'Describe what finishing means.', errStart: 'Choose a start date.',
    dates: 'Dates', startedOn: 'Started', targetOn: 'Target', completedOn: 'Completed', originally: 'originally {0}',
    history: 'Date history', hTarget: 'Target date {0} → {1}', hStart: 'Start date {0} → {1}', hSet: 'Target date set to {0}', changedOn: 'changed {0}',
    adjust: 'Adjust date', adjustTitle: 'Adjust the target date', adjustSub: 'Your progress stays exactly as it is. The earlier date is kept in the history.', saveDate: 'Save date', dateSaved: 'Date updated. Progress is unchanged.',
    due: 'The target date, {0}, has passed.', dueSub: 'Nothing changes on its own. Choose whatever fits.', review: 'Review progress', end: 'End the project',
    dueToday: '“{0}” reached its target date.', openProject: 'Open project', notNow: 'Not now', datePassed: 'Target date passed',
    complete: 'Complete project', criteriaLabel: 'What finishing means', noCriteria: 'No completion criteria were written for this project.', recorded: 'Recorded so far',
    ask: 'Have you accomplished what you set out to do?', askNote: 'Your own honest answer is enough, especially for goals that aren’t measured in numbers.', yes: 'Yes, I accomplished it', back: 'Return to project',
    msAsk: 'Have you reached this milestone?', msComplete: 'Complete milestone', msDate: 'Date', msAdd: 'Add a dated milestone', msPh: 'e.g. Complete my first four weeks of planned training', msBy: 'by {0}', msTitle: 'Milestone',
    giftHead: 'You did it. A little celebration is waiting for you.', tap: 'Tap to open your gift.', later: 'Open later', boxLabel: 'Gift box, closed. Tap to open your gift.', laterToast: 'Your gift will wait for you in My Companion.',
    congratsP: 'Congratulations. You finished what you set out to do.', congratsM: 'Congratulations on reaching this milestone.',
    msgP: 'You made time for something that mattered to you. This medal marks the work you brought to completion.', msgM: 'You set this milestone and reached it. This medal marks it, and the goal keeps going at your own pace.',
    doneOn: 'Completed {0}', report: 'View my progress report', add: 'Add to my collection', added: 'It’s in My milestones, in My Companion.', inCollection: 'In your collection',
    milestones: 'My milestones', empty: 'When you confirm a finished project or a dated milestone, its medal is kept here. There’s no rush and nothing to collect for its own sake.',
    waiting: 'A gift is waiting', giftFor: 'Gift for “{0}”', medalFor: 'Medal for {0}, completed {1}', kept: 'Medals stay when you change companions or archive projects.',
    project: 'Project', milestone: 'Milestone', area: 'Area', goalGone: 'This project has since been deleted. Its medal stays.', todayGift: 'A gift is waiting for you in My Companion.', goCompanion: 'Open My Companion',
    progressTitle: 'Progress so far', asOf: 'as of {0}', medalSheet: 'Medal', close: 'Close' },
  es: { start: 'Fecha de inicio', target: 'Fecha prevista de finalización', targetHint: 'Obligatoria para un proyecto con final. Puedes cambiarla después sin perder progreso.',
    criteria: 'Criterio de finalización', criteriaHint: 'Qué significa terminar, en una frase.', criteriaPh: 'p. ej., 1000 $ ahorrados en mi colchón',
    errTarget: 'Elige una fecha prevista de finalización.', errOrder: 'La fecha prevista debe ser igual o posterior a la de inicio.', errCriteria: 'Describe qué significa terminar.', errStart: 'Elige una fecha de inicio.',
    dates: 'Fechas', startedOn: 'Inicio', targetOn: 'Prevista', completedOn: 'Terminado', originally: 'al principio, {0}',
    history: 'Historial de fechas', hTarget: 'Fecha prevista {0} → {1}', hStart: 'Fecha de inicio {0} → {1}', hSet: 'Fecha prevista fijada: {0}', changedOn: 'cambiada el {0}',
    adjust: 'Ajustar fecha', adjustTitle: 'Ajustar la fecha prevista', adjustSub: 'Tu progreso se queda tal como está. La fecha anterior se guarda en el historial.', saveDate: 'Guardar fecha', dateSaved: 'Fecha actualizada. El progreso no cambia.',
    due: 'La fecha prevista, {0}, ya pasó.', dueSub: 'Nada cambia por sí solo. Elige lo que te encaje.', review: 'Revisar el progreso', end: 'Terminar el proyecto',
    dueToday: '«{0}» llegó a su fecha prevista.', openProject: 'Abrir proyecto', notNow: 'Ahora no', datePassed: 'Fecha prevista pasada',
    complete: 'Completar proyecto', criteriaLabel: 'Qué significa terminar', noCriteria: 'Este proyecto no tiene un criterio de finalización escrito.', recorded: 'Registrado hasta ahora',
    ask: '¿Has logrado lo que te propusiste?', askNote: 'Tu respuesta sincera basta, sobre todo en metas que no se miden con números.', yes: 'Sí, lo logré', back: 'Volver al proyecto',
    msAsk: '¿Has alcanzado este hito?', msComplete: 'Completar hito', msDate: 'Fecha', msAdd: 'Añadir un hito con fecha', msPh: 'p. ej., Completar mis primeras cuatro semanas de entrenamiento planificado', msBy: 'para el {0}', msTitle: 'Hito',
    giftHead: 'Lo lograste. Te espera una pequeña celebración.', tap: 'Toca para abrir tu regalo.', later: 'Abrir más tarde', boxLabel: 'Caja de regalo, cerrada. Toca para abrir tu regalo.', laterToast: 'Tu regalo te esperará en Mi compañero.',
    congratsP: 'Enhorabuena. Terminaste lo que te propusiste.', congratsM: 'Enhorabuena por alcanzar este hito.',
    msgP: 'Dedicaste tiempo a algo que te importaba. Esta medalla celebra el trabajo que llevaste hasta el final.', msgM: 'Te propusiste este hito y lo alcanzaste. Esta medalla lo celebra, y la meta sigue a tu ritmo.',
    doneOn: 'Terminado el {0}', report: 'Ver mi informe de progreso', add: 'Añadir a mi colección', added: 'Ya está en Mis hitos, en Mi compañero.', inCollection: 'En tu colección',
    milestones: 'Mis hitos', empty: 'Cuando confirmes un proyecto terminado o un hito con fecha, su medalla se guardará aquí. No hay prisa ni nada que coleccionar por coleccionar.',
    waiting: 'Te espera un regalo', giftFor: 'Regalo por «{0}»', medalFor: 'Medalla por {0}, terminado el {1}', kept: 'Las medallas se quedan aunque cambies de compañero o archives proyectos.',
    project: 'Proyecto', milestone: 'Hito', area: 'Área', goalGone: 'Este proyecto se eliminó después. Su medalla se queda.', todayGift: 'Te espera un regalo en Mi compañero.', goCompanion: 'Abrir Mi compañero',
    progressTitle: 'Progreso hasta ahora', asOf: 'a {0}', medalSheet: 'Medalla', close: 'Cerrar' },
  it: { start: 'Data di inizio', target: 'Data di completamento prevista', targetHint: 'Obbligatoria per un progetto con una fine. Puoi cambiarla dopo senza perdere i progressi.',
    criteria: 'Criterio di completamento', criteriaHint: 'Cosa significa finire, in una frase.', criteriaPh: 'es. 1000 $ messi da parte come riserva',
    errTarget: 'Scegli una data di completamento prevista.', errOrder: 'La data prevista deve essere uguale o successiva alla data di inizio.', errCriteria: 'Descrivi cosa significa finire.', errStart: 'Scegli una data di inizio.',
    dates: 'Date', startedOn: 'Inizio', targetOn: 'Prevista', completedOn: 'Completato', originally: 'all’inizio {0}',
    history: 'Cronologia delle date', hTarget: 'Data prevista {0} → {1}', hStart: 'Data di inizio {0} → {1}', hSet: 'Data prevista fissata: {0}', changedOn: 'modificata il {0}',
    adjust: 'Modifica data', adjustTitle: 'Modifica la data prevista', adjustSub: 'I tuoi progressi restano come sono. La data precedente resta nella cronologia.', saveDate: 'Salva data', dateSaved: 'Data aggiornata. I progressi non cambiano.',
    due: 'La data prevista, {0}, è passata.', dueSub: 'Niente cambia da solo. Scegli ciò che ti va bene.', review: 'Rivedi i progressi', end: 'Concludi il progetto',
    dueToday: '«{0}» ha raggiunto la data prevista.', openProject: 'Apri il progetto', notNow: 'Non ora', datePassed: 'Data prevista passata',
    complete: 'Completa il progetto', criteriaLabel: 'Cosa significa finire', noCriteria: 'Per questo progetto non è stato scritto un criterio di completamento.', recorded: 'Registrato finora',
    ask: 'Hai realizzato ciò che ti eri proposto?', askNote: 'Basta la tua risposta sincera, soprattutto per gli obiettivi che non si misurano con i numeri.', yes: 'Sì, l’ho realizzato', back: 'Torna al progetto',
    msAsk: 'Hai raggiunto questo traguardo?', msComplete: 'Completa il traguardo', msDate: 'Data', msAdd: 'Aggiungi un traguardo con data', msPh: 'es. Completare le prime quattro settimane di allenamento pianificato', msBy: 'entro il {0}', msTitle: 'Traguardo',
    giftHead: 'Ce l’hai fatta. Ti aspetta una piccola festa.', tap: 'Tocca per aprire il tuo regalo.', later: 'Apri più tardi', boxLabel: 'Scatola regalo, chiusa. Tocca per aprire il tuo regalo.', laterToast: 'Il tuo regalo ti aspetterà in Il mio compagno.',
    congratsP: 'Congratulazioni. Hai portato a termine ciò che ti eri proposto.', congratsM: 'Congratulazioni per aver raggiunto questo traguardo.',
    msgP: 'Hai trovato tempo per qualcosa che contava per te. Questa medaglia celebra il lavoro che hai portato a termine.', msgM: 'Ti eri dato questo traguardo e l’hai raggiunto. Questa medaglia lo celebra, e l’obiettivo continua con il tuo ritmo.',
    doneOn: 'Completato il {0}', report: 'Vedi il mio resoconto dei progressi', add: 'Aggiungi alla mia collezione', added: 'È nei Miei traguardi, in Il mio compagno.', inCollection: 'Nella tua collezione',
    milestones: 'I miei traguardi', empty: 'Quando confermi un progetto concluso o un traguardo con data, la sua medaglia resta qui. Non c’è fretta, né nulla da collezionare per forza.',
    waiting: 'Ti aspetta un regalo', giftFor: 'Regalo per «{0}»', medalFor: 'Medaglia per {0}, completato il {1}', kept: 'Le medaglie restano anche se cambi compagno o archivi i progetti.',
    project: 'Progetto', milestone: 'Traguardo', area: 'Area', goalGone: 'Questo progetto è stato eliminato in seguito. La sua medaglia resta.', todayGift: 'Ti aspetta un regalo in Il mio compagno.', goCompanion: 'Apri Il mio compagno',
    progressTitle: 'Progressi finora', asOf: 'al {0}', medalSheet: 'Medaglia', close: 'Chiudi' },
  fr: { start: 'Date de début', target: 'Date d’achèvement prévue', targetHint: 'Obligatoire pour un projet qui a une fin. Tu peux la changer plus tard sans perdre tes progrès.',
    criteria: 'Critère d’achèvement', criteriaHint: 'Ce que finir veut dire, en une phrase.', criteriaPh: 'ex. 1 000 $ mis de côté en réserve',
    errTarget: 'Choisis une date d’achèvement prévue.', errOrder: 'La date prévue doit être identique ou postérieure à la date de début.', errCriteria: 'Décris ce que finir veut dire.', errStart: 'Choisis une date de début.',
    dates: 'Dates', startedOn: 'Début', targetOn: 'Prévue', completedOn: 'Terminé', originally: 'au départ, {0}',
    history: 'Historique des dates', hTarget: 'Date prévue {0} → {1}', hStart: 'Date de début {0} → {1}', hSet: 'Date prévue fixée : {0}', changedOn: 'modifiée le {0}',
    adjust: 'Ajuster la date', adjustTitle: 'Ajuster la date prévue', adjustSub: 'Tes progrès restent exactement tels quels. L’ancienne date est gardée dans l’historique.', saveDate: 'Enregistrer la date', dateSaved: 'Date mise à jour. Les progrès ne changent pas.',
    due: 'La date prévue, {0}, est passée.', dueSub: 'Rien ne change tout seul. Choisis ce qui te convient.', review: 'Revoir les progrès', end: 'Terminer le projet',
    dueToday: '« {0} » a atteint sa date prévue.', openProject: 'Ouvrir le projet', notNow: 'Pas maintenant', datePassed: 'Date prévue passée',
    complete: 'Achever le projet', criteriaLabel: 'Ce que finir veut dire', noCriteria: 'Aucun critère d’achèvement n’a été écrit pour ce projet.', recorded: 'Enregistré jusqu’ici',
    ask: 'As-tu accompli ce que tu voulais faire ?', askNote: 'Ta réponse sincère suffit, surtout pour les objectifs qui ne se mesurent pas en chiffres.', yes: 'Oui, je l’ai accompli', back: 'Revenir au projet',
    msAsk: 'As-tu atteint cette étape ?', msComplete: 'Valider l’étape', msDate: 'Date', msAdd: 'Ajouter une étape datée', msPh: 'ex. Terminer mes quatre premières semaines d’entraînement prévu', msBy: 'd’ici le {0}', msTitle: 'Étape',
    giftHead: 'Tu l’as fait. Une petite fête t’attend.', tap: 'Touche pour ouvrir ton cadeau.', later: 'Ouvrir plus tard', boxLabel: 'Boîte cadeau, fermée. Touche pour ouvrir ton cadeau.', laterToast: 'Ton cadeau t’attendra dans Mon compagnon.',
    congratsP: 'Félicitations. Tu as mené à bien ce que tu voulais faire.', congratsM: 'Félicitations pour cette étape atteinte.',
    msgP: 'Tu as pris du temps pour quelque chose qui comptait pour toi. Cette médaille marque le travail que tu as mené à son terme.', msgM: 'Tu t’étais fixé cette étape et tu l’as atteinte. Cette médaille la marque, et l’objectif continue à ton rythme.',
    doneOn: 'Terminé le {0}', report: 'Voir mon rapport de progrès', add: 'Ajouter à ma collection', added: 'C’est dans Mes étapes, dans Mon compagnon.', inCollection: 'Dans ta collection',
    milestones: 'Mes étapes', empty: 'Quand tu confirmes un projet terminé ou une étape datée, sa médaille est gardée ici. Rien ne presse, et il n’y a rien à collectionner pour le plaisir de collectionner.',
    waiting: 'Un cadeau t’attend', giftFor: 'Cadeau pour « {0} »', medalFor: 'Médaille pour {0}, terminé le {1}', kept: 'Les médailles restent quand tu changes de compagnon ou archives des projets.',
    project: 'Projet', milestone: 'Étape', area: 'Domaine', goalGone: 'Ce projet a été supprimé depuis. Sa médaille reste.', todayGift: 'Un cadeau t’attend dans Mon compagnon.', goCompanion: 'Ouvrir Mon compagnon',
    progressTitle: 'Progrès jusqu’ici', asOf: 'au {0}', medalSheet: 'Médaille', close: 'Fermer' }
};
const MDL = () => MD[lang()] || MD.en;
const mf = (k, ...a) => rcf(MDL()[k], ...a);
const hasFinish = (g) => g.kind === 'target' || g.kind === 'milestones';
const dLongY = (ds) => dFmt(ds, { year: 'numeric', month: 'long', day: 'numeric' });

/* ---- Dates on the goal form ---- */
function goalDateFields(x) {
  const td = today(); const M = MDL();
  return `<div class="stack-s" data-raw lang="${lang()}" id="gfDates">
    <div class="grid2"><label class="f">${esc(M.start)}<input class="inp" type="date" id="gfStartOn" value="${esc(x.startedOn || td)}" required></label>
      <label class="f" id="gfTargetWrap" ${hasFinish(x) ? '' : 'hidden'}>${esc(M.target)}<input class="inp" type="date" id="gfTargetOn" value="${esc(x.targetDate || '')}" min="${esc(x.startedOn || td)}"></label></div>
    <p class="tiny muted" id="gfTargetHint" ${hasFinish(x) ? '' : 'hidden'}>${esc(M.targetHint)}</p>
    <label class="f" id="gfCritWrap" ${hasFinish(x) ? '' : 'hidden'}>${esc(M.criteria)} <span class="hint">${esc(M.criteriaHint)}</span><input class="inp" id="gfCriteria" maxlength="200" value="${esc(x.criteria || '')}" placeholder="${esc(M.criteriaPh)}"></label></div>`;
}
/* An error message for the date fields, or null when they're valid */
function goalDatesCheck(kind) {
  const M = MDL(); const s = val('gfStartOn'); const tgt = val('gfTargetOn'); const crit = val('gfCriteria');
  const bad = (id, msg) => { const el = $('#' + id); if (el) el.classList.add('invalid'); return msg; };
  if (!isDate(s)) return bad('gfStartOn', M.errStart);
  if (hasFinish({ kind })) {
    if (!isDate(tgt)) return bad('gfTargetOn', M.errTarget);
    if (tgt < s) return bad('gfTargetOn', M.errOrder);
    if (!crit) return bad('gfCriteria', M.errCriteria);
  }
  return null;
}
/* Copies checked dates onto the goal, keeping every change in its history */
function goalDatesApply(x, kind) {
  const s = val('gfStartOn'); const tgt = val('gfTargetOn'); const crit = val('gfCriteria');
  const hist = x.dateHistory = x.dateHistory || [];
  if (x.id && x.startedOn && x.startedOn !== s) hist.push({ at: nowISO(), on: today(), field: 'start', from: x.startedOn, to: s });
  x.startedOn = s;
  if (hasFinish({ kind })) {
    if (x.targetDate && x.targetDate !== tgt) hist.push({ at: nowISO(), on: today(), field: 'target', from: x.targetDate, to: tgt });
    if (!x.targetDate) hist.push({ at: nowISO(), on: today(), field: 'targetSet', to: tgt });
    if (!x.targetDateOriginal) x.targetDateOriginal = tgt;
    x.targetDate = tgt; x.criteria = crit;
  } else if (crit) x.criteria = crit;
}

/* ---- Dates and the passed-date choice on the goal sheet ---- */
const goalDue = (g) => !!(g.targetDate && hasFinish(g) && ['active', 'maintaining', 'later'].includes(g.status) && g.targetDate < today());
function goalDatesCard(g) {
  const M = MDL(); const hist = g.dateHistory || [];
  const changes = hist.filter((h) => h.field === 'target' || h.field === 'start');
  let h = `<div class="card stack-s gd-dates" data-raw lang="${lang()}"><div class="h3">${esc(M.dates)}</div><div class="kv small">
    <span>${esc(M.startedOn)}</span><span>${esc(dLongY(g.startedOn))}</span>
    ${g.targetDate ? `<span>${esc(M.targetOn)}</span><span>${esc(dLongY(g.targetDate))}${g.targetDateOriginal && g.targetDateOriginal !== g.targetDate ? ` <span class="tiny muted">(${esc(mf('originally', dLongY(g.targetDateOriginal)))})</span>` : ''}</span>` : ''}
    ${g.completedOn && g.status === 'complete' ? `<span>${esc(M.completedOn)}</span><span>${esc(dLongY(g.completedOn))}</span>` : ''}</div>
    ${g.criteria ? `<p class="small"><b>${esc(M.criteriaLabel)}:</b> ${esc(g.criteria)}</p>` : ''}
    ${changes.length ? `<details class="more"><summary>${esc(M.history)}</summary>${changes.map((c) => `<p class="tiny">${esc(mf(c.field === 'start' ? 'hStart' : 'hTarget', dMD(c.from), dMD(c.to)))} · ${esc(mf('changedOn', dMD(c.on)))}</p>`).join('')}</details>` : ''}
    ${g.status !== 'complete' && g.status !== 'ended' && hasFinish(g) ? `<div><button class="btn ghost sm" data-act="goalDateForm">${esc(M.adjust)}</button></div>` : ''}</div>`;
  if (goalDue(g)) h += `<div class="banner stack-s" id="goalDue" data-raw lang="${lang()}"><div class="h3">${esc(mf('due', dLongY(g.targetDate)))}</div><p class="small">${esc(M.dueSub)}</p>
    <div class="btn-row"><button class="btn sm" data-act="reportOpen" data-id="${g.id}">${esc(M.review)}</button><button class="btn sm" data-act="goalDateForm">${esc(M.adjust)}</button><button class="btn ghost sm" data-act="endOpen">${esc(M.end)}</button></div></div>`;
  return h;
}
A.goalDateForm = () => {
  const id = SH.goalId; const g = goalById(id); if (!g) return;
  openSheet(() => { const M = MDL(); return `${sheetHead(esc(M.adjustTitle), esc(M.adjustSub))}<div class="stack" data-raw lang="${lang()}">
    <label class="f">${esc(M.target)}<input class="inp" type="date" id="gdTarget" value="${esc(g.targetDate && g.targetDate >= today() ? g.targetDate : '')}" min="${esc(g.startedOn)}"></label>
    <p class="tiny muted">${esc(M.startedOn)}: ${esc(dLongY(g.startedOn))}${g.targetDate ? ' · ' + esc(M.targetOn) + ': ' + esc(dLongY(g.targetDate)) : ''}</p>
    <div class="btn-row"><button class="btn primary" data-act="goalDateSave">${esc(M.saveDate)}</button><button class="btn ghost" data-act="goalBack">${esc(M.back)}</button></div></div>`; });
  SH.goalId = id;
};
A.goalDateSave = () => {
  const g = goalById(SH.goalId); const M = MDL(); const v = val('gdTarget');
  if (!isDate(v)) { $('#gdTarget').classList.add('invalid'); toast(M.errTarget); return; }
  if (v < g.startedOn) { $('#gdTarget').classList.add('invalid'); toast(M.errOrder); return; }
  if (v !== g.targetDate) {
    g.dateHistory = g.dateHistory || [];
    g.dateHistory.push(g.targetDate ? { at: nowISO(), on: today(), field: 'target', from: g.targetDate, to: v } : { at: nowISO(), on: today(), field: 'targetSet', to: v });
    if (!g.targetDateOriginal) g.targetDateOriginal = g.targetDate || v;
    g.targetDate = v;
  }
  save(); render(); openGoal(g.id); toast(M.dateSaved);
};
A.goalBack = () => openGoal(SH.goalId);

/* Today: a quiet note for projects past their date, and for gifts still waiting */
function renderDueToday(td) {
  const M = MDL();
  const due = S.goals.filter((g) => goalDue(g) && S.dismissed['due:' + g.id] !== g.targetDate);
  return due.slice(0, 2).map((g) => `<section class="banner stack-s" data-raw lang="${lang()}" data-due="${g.id}"><div class="h3">${esc(mf('dueToday', g.title))}</div><p class="small">${esc(M.dueSub)}</p>
    <div class="btn-row"><button class="btn sm" data-act="goalOpen" data-id="${g.id}">${esc(M.openProject)}</button><button class="btn ghost sm" data-act="dueLater" data-id="${g.id}">${esc(M.notNow)}</button></div></section>`).join('');
}
A.dueLater = (el) => { const g = goalById(el.dataset.id); if (g) { S.dismissed['due:' + g.id] = g.targetDate; save(); render(); } };
function renderGiftToday() {
  if (!unopenedGifts().length) return '';
  const M = MDL();
  return `<section class="banner pink row-between gift-note" data-raw lang="${lang()}"><span class="small">${giftIcon(28)} ${esc(M.todayGift)}</span><button class="btn sm" data-act="tab" data-tab="companion">${esc(M.goCompanion)}</button></section>`;
}

/* ---- Completing ---- */
function medalByKey(key) { return (S.medals || []).find((m) => m.key === key); }
/* Saves the medal at the moment completion is confirmed. A second call for the same key returns the same medal. */
function awardMedal(key, data) {
  S.medals = S.medals || [];
  const have = medalByKey(key); if (have) return { medal: have, fresh: false };
  const m = Object.assign({ id: uid('md'), key, earnedAt: nowISO(), opened: false, acknowledged: false }, data);
  S.medals.push(m); return { medal: m, fresh: true };
}
const unopenedGifts = () => (S.medals || []).filter((m) => !m.opened);

A.goalComplete = () => {
  const id = SH.goalId; const g = goalById(id); if (!g) return;
  openSheet(() => {
    const M = MDL(); const p = g.kind === 'target' ? goalProgress(g) : null;
    const done = g.milestones.filter((m) => m.doneOn).length;
    return `${sheetHead(esc(M.complete), esc(g.title))}<div class="stack" data-raw lang="${lang()}">
      <div class="card tint stack-s"><div class="eyebrow">${esc(M.criteriaLabel)}</div><p>${esc(g.criteria || M.noCriteria)}</p></div>
      <div class="stack-s"><div class="h3">${esc(M.recorded)}</div><p class="small">${esc(trText(goalSummaryLine(g)))}</p>${p ? goalBar(g) : ''}
        ${g.kind === 'milestones' && g.milestones.length ? `<p class="tiny muted">${done} / ${g.milestones.length}</p>` : ''}</div>
      <p class="h3 cp-ask">${esc(M.ask)}</p><p class="tiny muted">${esc(M.askNote)}</p>
      <div class="btn-row"><button class="btn primary" data-act="goalCompleteYes">${esc(M.yes)}</button><button class="btn ghost" data-act="goalBack">${esc(M.back)}</button></div></div>`;
  });
  SH.goalId = id;
};
A.goalCompleteYes = (el) => {
  const g = goalById(SH.goalId); if (!g) return;
  if (el) el.disabled = true;
  if (g.status !== 'complete') {
    g.status = 'complete'; g.completedOn = today();
    const ws = weekStart(today()); if (S.weeks[ws] && S.weeks[ws].goalId === g.id) S.weeks[ws].goalId = null;
    growthAward('goal:' + g.id, 'goal', today());
  }
  const { medal, fresh } = awardMedal('goal:' + g.id, { type: 'project', goalId: g.id, title: g.title, area: g.area, completedOn: g.completedOn, startedOn: g.startedOn, targetDate: g.targetDate || null, criteria: g.criteria || '' });
  save(); render();
  if (restPause()) return; if (fresh) openGift(medal.id); else openGoal(g.id);
};
/* Ongoing goals: a dated milestone is confirmed the same way and earns its own medal */
A.msConfirm = () => {
  const g = goalById(SH.goalId); const m = g && g.milestones.find((x) => x.id === SH.msId); if (!m) return;
  const id = g.id;
  openSheet(() => { const M = MDL(); return `${sheetHead(esc(M.msComplete), esc(g.title))}<div class="stack" data-raw lang="${lang()}">
    <div class="card tint stack-s"><div class="eyebrow">${esc(M.msTitle)}${m.targetDate ? ' · ' + esc(mf('msBy', dMD(m.targetDate))) : ''}</div><p>${esc(m.title)}</p></div>
    <p class="h3 cp-ask">${esc(M.msAsk)}</p><p class="tiny muted">${esc(M.askNote)}</p>
    <div class="btn-row"><button class="btn primary" data-act="msConfirmYes">${esc(M.yes)}</button><button class="btn ghost" data-act="goalBack">${esc(M.back)}</button></div></div>`; });
  SH.goalId = id;
};
A.msConfirmYes = (el) => {
  const g = goalById(SH.goalId); const m = g && g.milestones.find((x) => x.id === SH.msId); if (!m) return;
  if (el) el.disabled = true;
  if (!m.doneOn) { m.doneOn = today(); growthAward('ms:' + m.id, 'milestone', today()); }
  const { medal, fresh } = awardMedal('ms:' + m.id, { type: 'milestone', goalId: g.id, msId: m.id, title: m.title, goalTitle: g.title, area: g.area, completedOn: m.doneOn, startedOn: g.startedOn, targetDate: m.targetDate || null, criteria: m.title });
  save(); render();
  if (restPause()) return; if (fresh) openGift(medal.id); else openGoal(g.id);
};
A.msAddDated = () => {
  const g = goalById(SH.goalId); const M = MDL(); const t2 = val('gmMsD'); const d = val('gmMsDate');
  if (!t2) { $('#gmMsD').classList.add('invalid'); return; }
  if (!isDate(d)) { $('#gmMsDate').classList.add('invalid'); toast(M.errTarget); return; }
  if (d < g.startedOn) { $('#gmMsDate').classList.add('invalid'); toast(M.errOrder); return; }
  g.milestones.push({ id: uid('ms'), title: t2, doneOn: null, targetDate: d, createdOn: today() }); save(); refreshSheet();
};
function msAddDatedRow() {
  const M = MDL();
  return `<div class="stack-s" data-raw lang="${lang()}"><div class="small"><b>${esc(M.msAdd)}</b></div><input class="inp" id="gmMsD" maxlength="90" placeholder="${esc(M.msPh)}">
    <div class="grid2"><label class="f">${esc(M.msDate)}<input class="inp" type="date" id="gmMsDate" min="${esc(today())}"></label><button class="btn sm" data-act="msAddDated" style="align-self:end">${t('btn.add')}</button></div></div>`;
}

/* ---- The gift box and the medal ---- */
const AREA_TONE = { money: ['#3F8E65', '#CFE8D8'], business: ['#4D68A8', '#D7E0F4'], training: ['#C46A34', '#F5DCC9'], art: ['#B04F8F', '#F3D5E7'], mind: ['#6C5FB8', '#E0DBF5'] };
const MEDAL_EMBLEM = {
  money: '<path d="M50 63 v-14 M50 49 c0 -9 7 -14 15 -14 c0 9 -6 14 -15 14 M50 55 c0 -7 -5 -11 -12 -11 c0 7 5 11 12 11" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="50" cy="66" rx="12" ry="3.5" fill="currentColor"/>',
  business: '<rect x="34" y="44" width="32" height="22" rx="4" fill="none" stroke="currentColor" stroke-width="3"/><path d="M43 44 v-4 a3 3 0 0 1 3 -3 h8 a3 3 0 0 1 3 3 v4 M34 54 h32" stroke="currentColor" stroke-width="3" fill="none"/><circle cx="50" cy="54" r="2.6" fill="currentColor"/>',
  training: '<path d="M30 66 L 44 44 L 52 55 L 58 47 L 70 66 Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M58 47 V 33 l 8 3 l -8 3" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linejoin="round"/>',
  art: '<path d="M50 36 c-11 0 -18 7 -18 15 c0 8 6 13 12 13 c4 0 4 -4 2 -6 c-2 -3 0 -6 4 -6 h5 c6 0 13 -2 13 -8 c0 -5 -8 -8 -18 -8z" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="42" cy="46" r="2.6" fill="currentColor"/><circle cx="51" cy="43" r="2.6" fill="currentColor"/><circle cx="60" cy="46" r="2.6" fill="currentColor"/>',
  mind: '<path d="M50 64 c-6 -5 -7 -14 0 -22 c7 8 6 17 0 22z M50 64 c-9 0 -16 -5 -18 -13 c9 -1 15 4 18 13z M50 64 c9 0 16 -5 18 -13 c-9 -1 -15 4 -18 13z" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linejoin="round"/>'
};
function drawMedal(area, size) { return `<svg class="medal" viewBox="0 0 100 120" width="${size}" height="${size * 1.2}" aria-hidden="true">${medalArt(area)}</svg>`; }
function medalArt(area) {
  const [c, soft] = AREA_TONE[area] || AREA_TONE.mind;
  return `<path d="M36 4 L 50 34 L 40 40 L 24 8Z" fill="${c}"/><path d="M64 4 L 50 34 L 60 40 L 76 8Z" fill="${c}" opacity=".8"/>
    <circle cx="50" cy="72" r="38" fill="#E2B84E"/><circle cx="50" cy="72" r="38" fill="none" stroke="#B88A2A" stroke-width="2"/>
    <circle cx="50" cy="72" r="30" fill="${soft}"/><circle cx="50" cy="72" r="30" fill="none" stroke="#fff" stroke-width="1.4" opacity=".6"/>
    <path d="M24 60 a30 30 0 0 1 20 -16" stroke="#fff" stroke-width="3" fill="none" opacity=".45" stroke-linecap="round"/>
    <g transform="translate(0 20)" style="color:${c}">${MEDAL_EMBLEM[area] || MEDAL_EMBLEM.mind}</g>`;
}
function giftIcon(size) {
  return `<svg class="gift-ico" viewBox="0 0 40 40" width="${size}" height="${size}" aria-hidden="true"><rect x="7" y="17" width="26" height="18" rx="3" fill="#E98FB4"/><rect x="5" y="12" width="30" height="7" rx="2.5" fill="#F2A9C6"/><rect x="18" y="12" width="4" height="23" fill="#F5D58A"/><path d="M20 12 c-3 -6 -10 -6 -9 -2 c1 3 6 2 9 2 c3 0 8 1 9 -2 c1 -4 -6 -4 -9 2z" fill="#F5D58A"/></svg>`;
}
function drawGiftBox(area) {
  const sparks = [[22, 40], [80, 34], [14, 80], [88, 76], [30, 18], [70, 14], [50, 6], [94, 52]];
  return `<svg class="giftbox" viewBox="0 0 120 130" aria-hidden="true">
    <ellipse cx="60" cy="124" rx="40" ry="4" fill="#3A2E2A" opacity=".1"/>
    <g class="gift-medal"><g transform="translate(36 30) scale(.48)">${medalArt(area)}</g></g>
    <g class="gift-body"><rect x="20" y="66" width="80" height="56" rx="6" fill="#E98FB4"/><rect x="20" y="66" width="80" height="10" fill="#000" opacity=".06"/><rect x="54" y="66" width="12" height="56" fill="#F5D58A"/></g>
    <g class="gift-lid"><rect x="14" y="52" width="92" height="18" rx="5" fill="#F2A9C6"/><rect x="54" y="52" width="12" height="18" fill="#F7DE9C"/>
      <path d="M60 52 c-8 -16 -28 -16 -26 -5 c2 8 16 6 26 5 c10 1 24 3 26 -5 c2 -11 -18 -11 -26 5z" fill="#F5D58A"/><circle cx="60" cy="51" r="4.5" fill="#E8B84E"/></g>
    <g class="gift-sparks">${sparks.map(([x, y], i) => `<path class="gift-spark" style="--i:${i}" d="M${x} ${y - 5} L ${x + 1.4} ${y - 1.4} L ${x + 5} ${y} L ${x + 1.4} ${y + 1.4} L ${x} ${y + 5} L ${x - 1.4} ${y + 1.4} L ${x - 5} ${y} L ${x - 1.4} ${y - 1.4}Z" fill="${['#F5D58A', '#E98FB4', '#B79BE0', '#8EC3E8'][i % 4]}"/>`).join('')}</g></svg>`;
}
function openGift(medalId) {
  if (restPause()) return;
  SH.giftId = medalId; SH.giftAnim = false; SH.giftShownAt = Date.now();
  openSheet(() => giftSheet(medalId), { full: true });
  SH.giftId = medalId;
}
function giftSheet(medalId) {
  const md = (S.medals || []).find((m) => m.id === medalId); if (!md) return sheetHead('');
  const M = MDL();
  if (!md.opened) {
    return `${sheetHead('')}<div class="gift-stage stack" data-raw lang="${lang()}">
      <p class="gift-head">${esc(M.giftHead)}</p>
      <button type="button" class="gift-btn" data-act="giftOpen" data-id="${md.id}" aria-label="${esc(M.boxLabel)}">${drawGiftBox(md.area)}</button>
      <p class="small gift-tap">${esc(M.tap)}</p>
      <div><button class="btn ghost sm" data-act="giftLater">${esc(M.later)}</button></div></div>`;
  }
  return medalView(md, true);
}
function medalView(md, fromGift) {
  const M = MDL(); const g = goalById(md.goalId);
  const name = md.type === 'milestone' ? md.title : (g ? g.title : md.title);
  return `${sheetHead(esc(fromGift ? '' : M.medalSheet))}<div class="medal-view stack" data-raw lang="${lang()}" id="medalView">
    ${fromGift ? `<p class="gift-head" role="status">${esc(md.type === 'milestone' ? M.congratsM : M.congratsP)}</p>` : ''}
    <div class="medal-big">${drawMedal(md.area, 132)}</div>
    <div class="medal-text"><div class="eyebrow">${esc(md.type === 'milestone' ? M.milestone : M.project)} · ${esc(t('area.' + md.area))}</div>
      <h2 class="h2 medal-name">${esc(name)}</h2>${md.type === 'milestone' && md.goalTitle ? `<p class="tiny muted">${esc(md.goalTitle)}</p>` : ''}
      <p class="small"><b>${esc(mf('doneOn', dLongY(md.completedOn)))}</b></p>
      <p class="medal-msg">${esc(md.type === 'milestone' ? M.msgM : M.msgP)}</p></div>
    ${!fromGift ? `<div class="kv small"><span>${esc(M.startedOn)}</span><span>${esc(dLongY(md.startedOn))}</span>${md.targetDate ? `<span>${esc(M.targetOn)}</span><span>${esc(dLongY(md.targetDate))}</span>` : ''}<span>${esc(M.completedOn)}</span><span>${esc(dLongY(md.completedOn))}</span></div>
      ${md.criteria && md.type === 'project' ? `<p class="small"><b>${esc(M.criteriaLabel)}:</b> ${esc(md.criteria)}</p>` : ''}` : ''}
    ${g ? '' : `<p class="tiny muted">${esc(M.goalGone)}</p>`}
    <div class="stack-s">${g ? `<button class="btn" data-act="medalReport" data-id="${md.id}">${esc(M.report)}</button>` : ''}
      ${fromGift ? (md.acknowledged ? `<p class="tiny muted">${esc(M.inCollection)}</p>` : `<button class="btn primary" data-act="medalKeep" data-id="${md.id}">${esc(M.add)}</button>`) : ''}</div>
    <p class="tiny muted">${esc(M.kept)}</p></div>`;
}
A.giftOpen = (el) => {
  const md = (S.medals || []).find((m) => m.id === el.dataset.id); if (!md || SH.giftAnim) return;
  if (Date.now() - (SH.giftShownAt || 0) < 500) return; // the second half of a double tap on "Yes" doesn't open it
  if (!md.opened) { md.opened = true; md.openedAt = nowISO(); save(); }
  const box = el.querySelector('svg.giftbox');
  if (reducedMotion() || !box || !box.animate) { refreshSheet(); focusMedal(); return; }
  SH.giftAnim = true; el.setAttribute('aria-busy', 'true');
  const q = (s) => box.querySelector(s);
  const ease = 'cubic-bezier(.3,.7,.3,1)';
  q('.gift-lid').animate([{ transform: 'translate(0,0) rotate(0)' }, { transform: 'translate(-6px,-30px) rotate(-16deg)' }], { duration: 700, easing: ease, fill: 'forwards' });
  q('.gift-medal').animate([{ transform: 'translate(0,34px)', opacity: 0 }, { transform: 'translate(0,-22px)', opacity: 1 }], { duration: 800, delay: 380, easing: ease, fill: 'forwards' });
  box.querySelectorAll('.gift-spark').forEach((s, i) => s.animate([{ transform: 'scale(.2)', opacity: 0 }, { transform: 'scale(1.1)', opacity: 1, offset: 0.4 }, { transform: 'scale(.6)', opacity: 0 }], { duration: 1100, delay: 560 + i * 40, easing: 'ease-out', fill: 'forwards' }));
  setTimeout(() => { SH.giftAnim = false; if ($('.sheet .gift-btn')) { refreshSheet(); focusMedal(); } }, 1750);
};
function focusMedal() { const v = $('#medalView .gift-head') || $('#medalView'); if (v) { v.setAttribute('tabindex', '-1'); v.focus({ preventScroll: true }); } }
A.giftLater = () => { closeSheet(); render(); toast(MDL().laterToast); };
A.medalKeep = (el) => { const md = (S.medals || []).find((m) => m.id === el.dataset.id); if (md && !md.acknowledged) { md.acknowledged = true; save(); } closeSheet(); render(); toast(MDL().added); };
A.medalReport = (el) => { const md = (S.medals || []).find((m) => m.id === el.dataset.id); if (md && goalById(md.goalId)) { closeSheet(true); openReport(md.goalId); } };
A.medalOpen = (el) => {
  const md = (S.medals || []).find((m) => m.id === el.dataset.id); if (!md) return;
  if (!md.opened) { openGift(md.id); return; }
  closeSheet(true); openSheet(() => medalView(md, false));
};

/* ---- My milestones, in My Companion ---- */
function renderMilestones() {
  const M = MDL(); const list = (S.medals || []).slice().sort((a, b) => (a.completedOn < b.completedOn ? 1 : a.completedOn > b.completedOn ? -1 : 0));
  return `<section class="card stack ms-gallery" id="myMilestones" aria-labelledby="msGH"><h2 class="h3" id="msGH">${esc(M.milestones)}</h2>
    ${list.length ? `<ul class="medals" role="list">${list.map((m) => {
      const name = m.title; const label = m.opened ? mf('medalFor', name, dLongY(m.completedOn)) : mf('giftFor', name) + '. ' + M.waiting + '.';
      return `<li><button type="button" class="medal-tile ${m.opened ? '' : 'gift'}" data-act="medalOpen" data-id="${m.id}" aria-label="${esc(label)}">
        <span class="mt-art">${m.opened ? drawMedal(m.area, 54) : giftIcon(54)}</span><span class="mt-name">${esc(name)}</span>
        <span class="tiny muted">${esc(m.opened ? dMD(m.completedOn) : M.waiting)}</span></button></li>`;
    }).join('')}</ul>` : `<p class="small muted">${esc(M.empty)}</p>`}</section>`;
}
/* A quick double tap on "Yes" shouldn't close the gift it just opened */
const _mdClose = A.closeSheet;
A.closeSheet = (el, e) => { if ($('.sheet .gift-stage') && Date.now() - (SH.giftShownAt || 0) < 500) return; _mdClose(el, e); };
