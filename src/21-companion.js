/* ---------- My Companion: the companion's own page, its scenery and the info panel ----------
   Scenery is decoration only. The period of the day comes from the clock in the saved
   timezone (never the device's), the season from a calendar the person chooses, and none
   of it reads or writes growth, rewards, adherence or pauses. Opening the page, tapping,
   changing the look or reading the quote add nothing to the ledger. */
const TODS = ['dawn', 'day', 'sunset', 'night'];
const SEASONS = ['spring', 'summer', 'fall', 'winter'];
/* Dawn 5:00–7:59, daytime 8:00–16:59, sunset 17:00–19:59, night 20:00–4:59 */
function todAt(h) { return h >= 5 && h < 8 ? 'dawn' : h >= 8 && h < 17 ? 'day' : h >= 17 && h < 20 ? 'sunset' : 'night'; }
/* Calendar seasons by month. Northern: spring Mar–May, summer Jun–Aug, fall Sep–Nov, winter Dec–Feb; southern is the opposite. */
function seasonAt(month, cal) {
  const n = ['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'fall', 'fall', 'fall', 'winter'][month - 1];
  return cal === 'south' ? { winter: 'summer', summer: 'winter', spring: 'fall', fall: 'spring' }[n] : n;
}
function scenery() { return (S && S.growth && S.growth.scenery) || {}; }
function sceneLook(ms) {
  const sc = scenery(); const o = partsInTz(ms == null ? nowMs() : ms, tz());
  const tod = sc.matchTime !== false ? todAt(Number(o.hour)) : (TODS.includes(sc.tod) ? sc.tod : 'day');
  let season = null;
  if (sc.seasons === 'auto' && (sc.calendar === 'north' || sc.calendar === 'south')) season = seasonAt(Number(o.month), sc.calendar);
  else if (sc.seasons === 'manual' && SEASONS.includes(sc.season)) season = sc.season;
  return { tod, season, trop: !!sc.tropical, snow: !!sc.snow && !sc.tropical };
}

const CP = {
  en: { title: 'My Companion', meet: 'Meet your companion', change: 'Change companion', details: 'Growth details',
    growth: '{0} growth so far. The next stage comes at {1}.', full: '{0} growth. Fully grown, and it keeps every ring.',
    resting: 'Resting. It will be here when you are.', paused: 'Resting with you during the pause.',
    stageOf: 'Stage {0} of 15', scenery: 'Scenery', tod: 'Time of day', match: 'Match companion scene to my local time',
    matchSub: 'Follows the clock in your saved timezone, {0}. It’s {1} there now.',
    tods: { dawn: 'Dawn', day: 'Daytime', sunset: 'Sunset', night: 'Night' },
    todsLow: { dawn: 'dawn', day: 'daytime', sunset: 'sunset', night: 'night' },
    seasons: 'Seasons', off: 'Not set', auto: 'Automatic', manual: 'Choose a season',
    offSub: 'Neutral scenery, without seasons.',
    north: 'Northern calendar', south: 'Southern calendar',
    northSub: 'Spring Mar–May · Summer Jun–Aug · Fall Sep–Nov · Winter Dec–Feb',
    southSub: 'Fall Mar–May · Winter Jun–Aug · Spring Sep–Nov · Summer Dec–Feb',
    pickCal: 'Choose a calendar to turn on automatic seasons. Until then the scenery stays neutral.',
    seasonNote: 'Seasons here are calendar-based visual themes, not weather or astronomy. The month comes from today’s date in your saved timezone, and your location is never used.',
    seasonNames: { spring: 'Spring', summer: 'Summer', fall: 'Fall', winter: 'Winter' },
    trop: 'Tropical scenery', tropSub: 'Tropical greenery and flowers all year, with the season’s colors and light. No snow, frost or bare trees.',
    snow: 'Gentle snowfall in winter', snowSub: 'A few slow flakes and snow on the ground. Otherwise winter shows frost.',
    decor: 'Scenery is decorative. It never changes your growth, and it doesn’t reflect missed tasks or the weather.',
    changeTitle: 'Change companion', changeSub: 'Your growth comes with you: stage {0} of 15 in any of them.',
    changeNote: 'Nothing is reset. Your growth, history and chapters stay as they are; only the picture changes.',
    current: 'Current', changed: 'Now your {0}. Your growth came with it.',
    label: 'Your {0} at stage {1} of 15, {2}.', care: 'A caretaker is {0}.', look: 'Scenery: {0}.', decorOnly: 'Decorative only; it adds no growth.',
    kinds: { garden: 'garden', farm: 'farm', bonsai: 'bonsai' }, kindsCap: { garden: 'Garden', farm: 'Farm', bonsai: 'Bonsai' },
    sceneryMenu: 'Companion scenery', sceneryMenuSub: 'Time of day, seasons and tropical scenery' },
  es: { title: 'Mi compañero', meet: 'Conoce a tu compañero', change: 'Cambiar de compañero', details: 'Detalles del crecimiento',
    growth: '{0} de crecimiento hasta ahora. La siguiente etapa llega a {1}.', full: '{0} de crecimiento. Ha crecido del todo y conserva cada anillo.',
    resting: 'Descansando. Estará aquí cuando tú estés.', paused: 'Descansa contigo durante la pausa.',
    stageOf: 'Etapa {0} de 15', scenery: 'Paisaje', tod: 'Hora del día', match: 'Ajustar la escena de mi compañero a mi hora local',
    matchSub: 'Sigue el reloj de tu zona horaria guardada, {0}. Allí ahora es {1}.',
    tods: { dawn: 'Amanecer', day: 'Día', sunset: 'Atardecer', night: 'Noche' },
    todsLow: { dawn: 'el amanecer', day: 'de día', sunset: 'el atardecer', night: 'de noche' },
    seasons: 'Estaciones', off: 'Sin configurar', auto: 'Automáticas', manual: 'Elegir una estación',
    offSub: 'Paisaje neutro, sin estaciones.',
    north: 'Calendario del norte', south: 'Calendario del sur',
    northSub: 'Primavera mar–may · Verano jun–ago · Otoño sep–nov · Invierno dic–feb',
    southSub: 'Otoño mar–may · Invierno jun–ago · Primavera sep–nov · Verano dic–feb',
    pickCal: 'Elige un calendario para activar las estaciones automáticas. Mientras tanto, el paisaje sigue neutro.',
    seasonNote: 'Aquí las estaciones son temas visuales según el calendario, no el clima ni la astronomía. El mes sale de la fecha de hoy en tu zona horaria guardada, y nunca se usa tu ubicación.',
    seasonNames: { spring: 'Primavera', summer: 'Verano', fall: 'Otoño', winter: 'Invierno' },
    trop: 'Paisaje tropical', tropSub: 'Vegetación y flores tropicales todo el año, con los colores y la luz de la estación. Sin nieve, escarcha ni árboles desnudos.',
    snow: 'Nevada suave en invierno', snowSub: 'Unos pocos copos lentos y nieve en el suelo. Si no, el invierno muestra escarcha.',
    decor: 'El paisaje es decorativo. Nunca cambia tu crecimiento y no refleja tareas pendientes ni el clima.',
    changeTitle: 'Cambiar de compañero', changeSub: 'Tu crecimiento te acompaña: etapa {0} de 15 en cualquiera de ellos.',
    changeNote: 'No se reinicia nada. Tu crecimiento, tu historial y tus capítulos se quedan como están; solo cambia la imagen.',
    current: 'Actual', changed: 'Ahora tu {0}. Tu crecimiento vino contigo.',
    label: 'Tu {0} en la etapa {1} de 15, {2}.', care: 'Una cuidadora está {0}.', look: 'Paisaje: {0}.', decorOnly: 'Es solo decorativo; no suma crecimiento.',
    kinds: { garden: 'jardín', farm: 'granja', bonsai: 'bonsái' }, kindsCap: { garden: 'Jardín', farm: 'Granja', bonsai: 'Bonsái' },
    sceneryMenu: 'Paisaje del compañero', sceneryMenuSub: 'Hora del día, estaciones y paisaje tropical' },
  it: { title: 'Il mio compagno', meet: 'Conosci il tuo compagno', change: 'Cambia compagno', details: 'Dettagli della crescita',
    growth: '{0} di crescita finora. La fase successiva arriva a {1}.', full: '{0} di crescita. È cresciuto del tutto e conserva ogni anello.',
    resting: 'Riposa. Sarà qui quando ci sarai tu.', paused: 'Riposa con te durante la pausa.',
    stageOf: 'Fase {0} di 15', scenery: 'Paesaggio', tod: 'Momento della giornata', match: 'Adatta la scena del compagno alla mia ora locale',
    matchSub: 'Segue l’orologio del fuso orario salvato, {0}. Lì ora è {1}.',
    tods: { dawn: 'Alba', day: 'Giorno', sunset: 'Tramonto', night: 'Notte' },
    todsLow: { dawn: 'l’alba', day: 'giorno', sunset: 'il tramonto', night: 'notte' },
    seasons: 'Stagioni', off: 'Non impostate', auto: 'Automatiche', manual: 'Scegli una stagione',
    offSub: 'Paesaggio neutro, senza stagioni.',
    north: 'Calendario settentrionale', south: 'Calendario meridionale',
    northSub: 'Primavera mar–mag · Estate giu–ago · Autunno set–nov · Inverno dic–feb',
    southSub: 'Autunno mar–mag · Inverno giu–ago · Primavera set–nov · Estate dic–feb',
    pickCal: 'Scegli un calendario per attivare le stagioni automatiche. Fino ad allora il paesaggio resta neutro.',
    seasonNote: 'Qui le stagioni sono temi visivi basati sul calendario, non sul meteo o sull’astronomia. Il mese viene dalla data di oggi nel fuso orario salvato, e la tua posizione non viene mai usata.',
    seasonNames: { spring: 'Primavera', summer: 'Estate', fall: 'Autunno', winter: 'Inverno' },
    trop: 'Paesaggio tropicale', tropSub: 'Vegetazione e fiori tropicali tutto l’anno, con i colori e la luce della stagione. Niente neve, brina o alberi spogli.',
    snow: 'Neve leggera in inverno', snowSub: 'Pochi fiocchi lenti e neve a terra. Altrimenti l’inverno mostra la brina.',
    decor: 'Il paesaggio è decorativo. Non cambia mai la tua crescita e non riflette attività mancate né il meteo.',
    changeTitle: 'Cambia compagno', changeSub: 'La tua crescita viene con te: fase {0} di 15 in ognuno.',
    changeNote: 'Non si azzera nulla. Crescita, cronologia e capitoli restano come sono; cambia solo l’immagine.',
    current: 'Attuale', changed: 'Ora il tuo {0}. La tua crescita è venuta con te.',
    label: 'Il tuo {0} nella fase {1} di 15, {2}.', care: 'Con una giardiniera {0}.', look: 'Paesaggio: {0}.', decorOnly: 'È solo decorativo; non aggiunge crescita.',
    kinds: { garden: 'giardino', farm: 'podere', bonsai: 'bonsai' }, kindsCap: { garden: 'Giardino', farm: 'Podere', bonsai: 'Bonsai' },
    sceneryMenu: 'Paesaggio del compagno', sceneryMenuSub: 'Momento della giornata, stagioni e paesaggio tropicale' },
  fr: { title: 'Mon compagnon', meet: 'Découvre ton compagnon', change: 'Changer de compagnon', details: 'Détails de la croissance',
    growth: '{0} de croissance jusqu’ici. Le prochain stade arrive à {1}.', full: '{0} de croissance. Il a fini de grandir et garde chaque cerne.',
    resting: 'Il se repose. Il sera là quand tu le seras.', paused: 'Il se repose avec toi pendant la pause.',
    stageOf: 'Stade {0} sur 15', scenery: 'Paysage', tod: 'Moment de la journée', match: 'Accorder la scène de mon compagnon à mon heure locale',
    matchSub: 'Suit l’horloge de ton fuseau horaire enregistré, {0}. Là-bas, c’est {1}.',
    tods: { dawn: 'Aube', day: 'Journée', sunset: 'Coucher du soleil', night: 'Nuit' },
    todsLow: { dawn: 'l’aube', day: 'la journée', sunset: 'le coucher du soleil', night: 'la nuit' },
    seasons: 'Saisons', off: 'Non réglées', auto: 'Automatiques', manual: 'Choisir une saison',
    offSub: 'Paysage neutre, sans saisons.',
    north: 'Calendrier de l’hémisphère nord', south: 'Calendrier de l’hémisphère sud',
    northSub: 'Printemps mars–mai · Été juin–août · Automne sept.–nov. · Hiver déc.–févr.',
    southSub: 'Automne mars–mai · Hiver juin–août · Printemps sept.–nov. · Été déc.–févr.',
    pickCal: 'Choisis un calendrier pour activer les saisons automatiques. D’ici là, le paysage reste neutre.',
    seasonNote: 'Ici, les saisons sont des thèmes visuels fondés sur le calendrier, pas sur la météo ni l’astronomie. Le mois vient de la date du jour dans ton fuseau horaire enregistré, et ta position n’est jamais utilisée.',
    seasonNames: { spring: 'Printemps', summer: 'Été', fall: 'Automne', winter: 'Hiver' },
    trop: 'Paysage tropical', tropSub: 'Verdure et fleurs tropicales toute l’année, avec les couleurs et la lumière de la saison. Ni neige, ni givre, ni arbres nus.',
    snow: 'Neige légère en hiver', snowSub: 'Quelques flocons lents et de la neige au sol. Sinon, l’hiver montre du givre.',
    decor: 'Le paysage est décoratif. Il ne change jamais ta croissance et ne reflète ni tâches manquées ni météo.',
    changeTitle: 'Changer de compagnon', changeSub: 'Ta croissance te suit : stade {0} sur 15 pour chacun.',
    changeNote: 'Rien n’est remis à zéro. Ta croissance, ton historique et tes chapitres restent tels quels ; seule l’image change.',
    current: 'Actuel', changed: 'Voici ton {0}. Ta croissance t’a suivi.',
    label: 'Ton {0} au stade {1} sur 15, {2}.', care: 'Avec une jardinière {0}.', look: 'Paysage : {0}.', decorOnly: 'Purement décoratif ; cela n’ajoute aucune croissance.',
    kinds: { garden: 'jardin', farm: 'ferme', bonsai: 'bonsaï' }, kindsCap: { garden: 'Jardin', farm: 'Ferme', bonsai: 'Bonsaï' },
    sceneryMenu: 'Paysage du compagnon', sceneryMenuSub: 'Moment de la journée, saisons et paysage tropical' }
};
const CPL = () => CP[lang()] || CP.en;

/* The "Meet your companion" panel. Each statement matches how the app behaves:
   done actions 2, smaller versions 1, milestones +8, resting after 3 quiet days, Rest Mode caretaker. */
const CP_INFO = {
  en: ['A little care. A little growth.', 'Your companion is a living illustration of the effort you’re putting into your own life. As you take small steps toward your goals, your world here grows alongside you.',
    ['How does it grow?', 'Completing planned actions adds growth to your companion. Smaller versions of tasks receive a little recognition, too, and meaningful milestones bring bigger changes.', 'You don’t need to fill your day with tasks to help it flourish. Choose a manageable plan and give it your attention.'],
    ['What if I miss a day?', 'Everything you’ve grown stays yours. After time away, your companion may settle into a quiet resting state. Whenever you return, you can continue from where you left off.'],
    ['What happens when I take a break?', 'Your companion rests with you. A little caretaker keeps your space tended while your tasks and reminders are paused. There’s nothing you need to catch up on when you return.'],
    ['Why a daily quote?', 'Sometimes a few thoughtful words can offer a fresh perspective. Each day brings a real, attributed quotation. Tap its source if you’d like to explore where it came from.', 'Take what resonates with you. You don’t have to feel positive every day to belong here.'],
    ['Can I choose my companion?', 'Yes. Choose a bonsai, garden, or farm, whichever feels most like your own little corner of the world. Your earned progress stays with you when you switch.'],
    ['Why does the scenery change?', 'Your companion’s world can follow the time of day in your selected timezone and a seasonal calendar you choose. You can also select your favorite scenery manually. These changes are decorative and never reduce your progress.'],
    'Let this be a place to notice your effort, enjoy your progress, and remember that small things are worth tending.'],
  es: ['Un poco de cuidado. Un poco de crecimiento.', 'Tu compañero es una ilustración viva del esfuerzo que estás poniendo en tu propia vida. A medida que das pequeños pasos hacia tus metas, tu mundo aquí crece contigo.',
    ['¿Cómo crece?', 'Completar las acciones que planeaste hace crecer a tu compañero. Las versiones más pequeñas de las tareas también reciben un poco de reconocimiento, y los logros importantes traen cambios más grandes.', 'No necesitas llenar tu día de tareas para que florezca. Elige un plan llevadero y dedícale tu atención.'],
    ['¿Y si me salto un día?', 'Todo lo que has hecho crecer sigue siendo tuyo. Después de un tiempo fuera, tu compañero puede quedarse en un tranquilo estado de descanso. Cuando vuelvas, puedes seguir desde donde lo dejaste.'],
    ['¿Qué pasa cuando me tomo un descanso?', 'Tu compañero descansa contigo. Una pequeña cuidadora mantiene tu espacio atendido mientras tus tareas y recordatorios están en pausa. Al volver, no tendrás nada pendiente que recuperar.'],
    ['¿Por qué una cita diaria?', 'A veces unas pocas palabras bien pensadas ofrecen una mirada nueva. Cada día trae una cita real y con su autor. Toca la fuente si quieres descubrir de dónde viene.', 'Quédate con lo que te resuene. No hace falta sentir optimismo cada día para tener tu lugar aquí.'],
    ['¿Puedo elegir mi compañero?', 'Sí. Elige un bonsái, un jardín o una granja, lo que más se parezca a tu propio rincón del mundo. Tu progreso se queda contigo cuando cambias.'],
    ['¿Por qué cambia el paisaje?', 'El mundo de tu compañero puede seguir la hora del día de la zona horaria que elegiste y un calendario de estaciones que tú escojas. También puedes elegir tu paisaje favorito a mano. Estos cambios son decorativos y nunca reducen tu progreso.'],
    'Que este sea un lugar para notar tu esfuerzo, disfrutar de tu progreso y recordar que las cosas pequeñas merecen cuidado.'],
  it: ['Un po’ di cura. Un po’ di crescita.', 'Il tuo compagno è un’illustrazione viva dell’impegno che stai mettendo nella tua vita. Mentre fai piccoli passi verso i tuoi obiettivi, il tuo mondo qui cresce insieme a te.',
    ['Come cresce?', 'Completare le azioni pianificate fa crescere il tuo compagno. Anche le versioni più piccole delle attività ricevono un po’ di riconoscimento, e i traguardi importanti portano cambiamenti più grandi.', 'Non serve riempire la giornata di attività perché fiorisca. Scegli un piano sostenibile e dedicagli la tua attenzione.'],
    ['E se salto un giorno?', 'Tutto ciò che hai fatto crescere resta tuo. Dopo un periodo lontano, il tuo compagno può adagiarsi in un tranquillo stato di riposo. Quando torni, puoi riprendere da dove avevi lasciato.'],
    ['Cosa succede quando mi prendo una pausa?', 'Il tuo compagno riposa con te. Una piccola giardiniera si prende cura del tuo spazio mentre attività e promemoria sono in pausa. Al tuo ritorno non c’è niente da recuperare.'],
    ['Perché una citazione al giorno?', 'A volte poche parole ben scelte offrono una prospettiva nuova. Ogni giorno porta una citazione autentica, con il suo autore. Tocca la fonte se vuoi scoprire da dove viene.', 'Prendi ciò che senti tuo. Non serve essere di buon umore ogni giorno per avere un posto qui.'],
    ['Posso scegliere il mio compagno?', 'Sì. Scegli un bonsai, un giardino o un podere, quello che senti di più come il tuo piccolo angolo di mondo. I progressi che hai guadagnato restano con te quando cambi.'],
    ['Perché il paesaggio cambia?', 'Il mondo del tuo compagno può seguire il momento della giornata nel fuso orario che hai scelto e un calendario delle stagioni scelto da te. Puoi anche scegliere a mano il paesaggio che preferisci. Questi cambiamenti sono decorativi e non riducono mai i tuoi progressi.'],
    'Che questo sia un luogo per notare il tuo impegno, goderti i progressi e ricordare che anche le piccole cose meritano cura.'],
  fr: ['Un peu de soin. Un peu de croissance.', 'Ton compagnon est une illustration vivante des efforts que tu mets dans ta propre vie. À mesure que tu fais de petits pas vers tes objectifs, ton monde ici grandit avec toi.',
    ['Comment grandit-il ?', 'Accomplir les actions prévues fait grandir ton compagnon. Les versions plus petites des tâches reçoivent aussi un peu de reconnaissance, et les étapes importantes apportent de plus grands changements.', 'Inutile de remplir ta journée de tâches pour qu’il s’épanouisse. Choisis un plan réaliste et accorde-lui ton attention.'],
    ['Et si je manque un jour ?', 'Tout ce que tu as fait grandir t’appartient. Après une absence, ton compagnon peut se poser dans un état de repos tranquille. Quand tu reviens, tu peux reprendre là où tu en étais.'],
    ['Que se passe-t-il quand je fais une pause ?', 'Ton compagnon se repose avec toi. Une petite jardinière veille sur ton espace pendant que tes tâches et tes rappels sont en pause. Tu n’auras rien à rattraper à ton retour.'],
    ['Pourquoi une citation chaque jour ?', 'Parfois, quelques mots bien choisis offrent un regard neuf. Chaque jour apporte une vraie citation, avec son auteur. Touche sa source si tu veux découvrir d’où elle vient.', 'Garde ce qui te parle. Pas besoin de voir la vie en rose chaque jour pour avoir ta place ici.'],
    ['Puis-je choisir mon compagnon ?', 'Oui. Choisis un bonsaï, un jardin ou une ferme, ce qui ressemble le plus à ton petit coin du monde. Les progrès que tu as gagnés restent avec toi quand tu changes.'],
    ['Pourquoi le paysage change-t-il ?', 'Le monde de ton compagnon peut suivre le moment de la journée dans le fuseau horaire que tu as choisi, et un calendrier des saisons que tu choisis. Tu peux aussi choisir ton paysage préféré manuellement. Ces changements sont décoratifs et ne réduisent jamais tes progrès.'],
    'Que ce soit un endroit pour remarquer tes efforts, profiter de tes progrès et te rappeler que les petites choses méritent qu’on en prenne soin.']
};
A.cpInfo = () => {
  closeSheet(true); SH.onPick = null;
  openSheet(() => {
    const I = CP_INFO[lang()] || CP_INFO.en; const secs = I.slice(2, -1);
    return `${sheetHead(esc(I[0]))}<div class="cp-info stack" data-raw lang="${lang()}" id="cpInfoPanel">
      <p>${esc(I[1])}</p>
      ${secs.map(([h, ...ps]) => `<section class="stack-s"><h3 class="h3">${esc(h)}</h3>${ps.map((p) => `<p class="small">${esc(p)}</p>`).join('')}</section>`).join('')}
      <p class="cp-info-end">${esc(I[I.length - 1])}</p></div>`;
  });
};

/* Labels for the picture, in the person's language */
function lookPhrase(k) {
  const C = CPL();
  return [C.todsLow[k.tod], k.season ? C.seasonNames[k.season].toLowerCase() : '', k.trop ? C.trop.toLowerCase() : ''].filter(Boolean).join(', ');
}
function sceneLabelBase(kind, stage, care) {
  const C = CPL(); const R = RCL();
  return rcf(C.label, C.kinds[kind], stage + 1, trText(STAGE_NAMES[kind][stage])) + (care ? ' ' + rcf(C.care, R.acts[kind]) : '') + ' ' + C.decorOnly;
}
/* A figure that redraws itself when the period, season or settings change */
function sceneFigure(kind, stage, seed, care, cls) {
  const moving = S.growth.animations !== false && !reducedMotion(); const look = sceneLook(); const base = sceneLabelBase(kind, stage, care);
  return `<figure class="rest-scene wide ${moving ? 'anim' : ''} ${cls || ''}" data-scene="${kind}|${stage}|${seed}|${care ? 1 : 0}" role="img" aria-label="${esc(base + ' ' + rcf(CPL().look, lookPhrase(look)))}">
    ${drawScene(kind, stage, seed, moving, care, look)}</figure>`;
}
/* Recalculate the look (every 30 s, on returning to the app, after a setting changes) and
   cross-fade to it without reloading. With reduced motion the change is immediate. */
function sceneSync() {
  if (!S || !S.settings || !S.settings.onboarded) return;
  const look = sceneLook(); const key = lookKey(look);
  $$('figure[data-scene]').forEach((f) => {
    const svgs = f.querySelectorAll('svg.scene'); const old = svgs[svgs.length - 1];
    if (!old || old.dataset.key === key) return;
    const [kind, stage, seed, care] = f.dataset.scene.split('|');
    const moving = old.classList.contains('anim'); const prev = [...svgs];
    f.insertAdjacentHTML('beforeend', drawScene(kind, Number(stage), Number(seed), moving, care === '1', look));
    const nu = f.lastElementChild;
    f.setAttribute('aria-label', sceneLabelBase(kind, Number(stage), care === '1') + ' ' + rcf(CPL().look, lookPhrase(look)));
    const drop = () => prev.forEach((s) => s.remove());
    if (reducedMotion() || !nu.animate) { drop(); return; }
    nu.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1800, easing: 'ease-in-out' }).onfinish = drop;
  });
}
setInterval(sceneSync, 30000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) sceneSync(); });

/* The page */
function renderCompanion() {
  const C = CPL(); const L = lang(); const c = companionState(); const kind = c.ch.kind;
  const status = c.paused ? C.paused : c.resting ? C.resting : '';
  return `<div class="cp stack-l" data-raw lang="${L}">
    <header class="topbar cp-top"><div><div class="eyebrow">${esc(C.kindsCap[kind])} · ${esc(rcf(C.stageOf, c.stage + 1))}</div><h1 class="view-h">${esc(C.title)}</h1></div>
      <button class="btn ghost sm cp-meet" data-act="cpInfo" aria-haspopup="dialog"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.6v.2"/></svg><span>${esc(C.meet)}</span></button></header>
    ${sceneFigure(kind, c.stage, c.ch.seed, false, 'cp-scene' + (c.resting ? ' resting' : ''))}
    <section class="cp-stage card stack-s"><div class="h3">${esc(trText(STAGE_NAMES[kind][c.stage]))}</div>
      <p class="small">${esc(c.next ? rcf(C.growth, c.pts, c.next) : rcf(C.full, c.pts))}</p>${status ? `<p class="small muted">${esc(status)}</p>` : ''}
      <div class="btn-row"><button class="btn sm" data-act="cpChange" aria-haspopup="dialog">${esc(C.change)}</button><button class="btn ghost sm" data-act="compOpen">${esc(C.details)}</button></div></section>
    ${renderRestQuote(restQuote(today()))}
    ${renderMilestones()}
    <section class="card stack" id="cpScenery">${renderSceneryControls()}</section>
    <p class="tiny muted">${esc(C.decor)}</p></div>`;
}
function renderSceneryControls(inSheet) {
  const C = CPL(); const sc = scenery(); const look = sceneLook();
  const box = (id, on, title, sub) => `<label class="rest-check"><input type="checkbox" id="${id}" data-act="scBox" ${on ? 'checked' : ''}><span><b class="small">${esc(title)}</b><br><span class="tiny muted">${esc(sub)}</span></span></label>`;
  const mode = sc.seasons === 'auto' || sc.seasons === 'manual' ? sc.seasons : 'off';
  return `${inSheet ? '' : `<h2 class="h3">${esc(C.scenery)}</h2>`}
    <div class="stack-s" role="group" aria-labelledby="scTodH"><div class="small" id="scTodH"><b>${esc(C.tod)}</b></div>
      ${box('scMatch', sc.matchTime !== false, C.match, rcf(C.matchSub, tzLabel(tz()), C.todsLow[todAt(Number(partsInTz(nowMs(), tz()).hour))]))}
      ${sc.matchTime === false ? seg('scTod', TODS.map((k) => [k, C.tods[k]]), TODS.includes(sc.tod) ? sc.tod : 'day') : ''}</div>
    <div class="stack-s" role="group" aria-labelledby="scSeaH"><div class="small" id="scSeaH"><b>${esc(C.seasons)}</b></div>
      ${seg('scSeasons', [['off', C.off], ['auto', C.auto], ['manual', C.manual]], mode)}
      ${mode === 'off' ? `<p class="tiny muted">${esc(C.offSub)}</p>` : ''}
      ${mode === 'auto' ? `${seg('scCal', [['north', C.north], ['south', C.south]], sc.calendar)}
        <p class="tiny muted">${esc(sc.calendar === 'south' ? C.southSub : sc.calendar === 'north' ? C.northSub : C.northSub + ' / ' + C.southSub)}</p>
        ${sc.calendar ? `<p class="tiny">${esc(C.seasonNames[look.season] || '')}</p>` : `<p class="tiny" role="status">${esc(C.pickCal)}</p>`}` : ''}
      ${mode === 'manual' ? seg('scSeason', SEASONS.map((k) => [k, C.seasonNames[k]]), SEASONS.includes(sc.season) ? sc.season : null) : ''}
      ${mode !== 'off' ? `<p class="tiny muted">${esc(C.seasonNote)}</p>` : ''}</div>
    ${box('scTrop', !!sc.tropical, C.trop, C.tropSub)}
    ${sc.tropical ? '' : box('scSnow', !!sc.snow, C.snow, C.snowSub)}`;
}
function sceneryChanged(focusSel) {
  save();
  if ($('.sheet #cpSceneryS')) refreshSheet();
  const host = $('#cpScenery'); if (host) host.innerHTML = renderSceneryControls();
  sceneSync();
  if (focusSel) { const el = $(focusSel); if (el) el.focus(); }
}
const _cpPick = A.pick;
A.pick = (el) => {
  _cpPick(el);
  const g = el.dataset.group; const v = getPick(g); const sc = S.growth.scenery;
  const map = { scTod: 'tod', scSeasons: 'seasons', scCal: 'calendar', scSeason: 'season' };
  if (!map[g] || v == null) return;
  sc[map[g]] = v;
  if (g === 'scSeason') sc.seasons = 'manual';
  sceneryChanged(`[data-group="${g}"][data-val="${v}"]`);
};
A.scBox = (el) => {
  setTimeout(() => {
    const sc = S.growth.scenery; const on = el.checked;
    if (el.id === 'scMatch') sc.matchTime = on; else if (el.id === 'scTrop') sc.tropical = on; else if (el.id === 'scSnow') sc.snow = on; else return;
    sceneryChanged('#' + el.id);
  }, 0);
};
A.cpScenerySheet = () => {
  closeSheet(true); SH.onPick = null;
  openSheet(() => `${sheetHead(esc(CPL().scenery))}<div class="stack" id="cpSceneryS" data-raw lang="${lang()}">${renderSceneryControls(true)}<p class="tiny muted">${esc(CPL().decor)}</p></div>`);
};

/* Change companion: the same points, so the same stage, in another picture */
A.cpChange = () => {
  closeSheet(true); SH.onPick = null;
  openSheet(() => {
    const C = CPL(); const c = companionState(); const look = sceneLook();
    return `${sheetHead(esc(C.changeTitle), esc(rcf(C.changeSub, c.stage + 1)))}<div class="stack" data-raw lang="${lang()}">
      <div class="cp-kinds">${Object.keys(KINDS).map((k) => `<button type="button" class="cp-kind" data-act="cpKind" data-kind="${k}" aria-pressed="${k === c.ch.kind}">
        <span class="rest-scene wide">${drawScene(k, c.stage, c.ch.seed, false, false, look)}</span>
        <span class="cp-kind-t"><b>${esc(C.kindsCap[k])}</b>${k === c.ch.kind ? ` <span class="tiny muted">· ${esc(C.current)}</span>` : ''}<br><span class="tiny muted">${esc(trText(STAGE_NAMES[k][c.stage]))}</span></span></button>`).join('')}</div>
      <p class="tiny muted">${esc(C.changeNote)}</p></div>`;
  });
};
A.cpKind = (el) => {
  const k = el.dataset.kind; if (!KINDS[k]) return;
  const ch = chapter(); if (ch.kind !== k) { ch.kind = k; S.growth.kind = k; save(); }
  closeSheet(); render(); toast(rcf(CPL().changed, CPL().kinds[k]));
};
