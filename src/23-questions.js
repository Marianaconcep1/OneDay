/* ---------- First-time setup: ten questions, then a starting plan to review ----------
   One question per screen (onboarding steps 2–11), then the review (step 12). Answers are
   saved as keys in S.settings.onb as soon as they're chosen, so Back, a refresh or a language
   change keeps them. Nothing is scheduled until "Start my first day". */
const FOCI = ['money', 'career', 'business', 'fitness', 'food', 'sleep', 'emotional', 'relationships', 'home', 'learning', 'creativity', 'organization', 'meaning', 'fun'];
/* Each focus also files its tasks under one of the app's original areas, for colours and weekly counts */
const FOCUS_AREA = { money: 'money', career: 'business', business: 'business', fitness: 'training', creativity: 'art' };
const focusArea = (f) => FOCUS_AREA[f] || 'mind';
const FOCUS_RESULTS = {
  money: ['spend', 'bills', 'paycheck', 'savings', 'debt'],
  career: ['resume', 'apply', 'deliver', 'skill'],
  business: ['problem', 'offer', 'content', 'contact', 'cdeliver'],
  fitness: ['routine', 'run', 'strength', 'mobility'],
  food: ['mealplan', 'grocery', 'cook', 'regular'],
  sleep: ['bedtime', 'wake', 'breaks', 'rest'],
  emotional: ['checkin', 'enjoy', 'calm', 'support'],
  relationships: ['reconnect', 'quality', 'group', 'talk'],
  home: ['clutter', 'drawer', 'tidy', 'chore'],
  learning: ['lesson', 'study', 'read', 'practice'],
  creativity: ['start', 'continue', 'hobby', 'fun'],
  organization: ['week', 'dates', 'paperwork', 'routine'],
  meaning: ['reflect', 'pray', 'read', 'community'],
  fun: ['outing', 'new', 'pastime', 'explore']
};
const OQ_OPTS = {
  reason: ['putoff', 'started', 'routine', 'priorities', 'return', 'track'],
  obstacles: ['nextstep', 'toobig', 'overcommit', 'schedule', 'forget', 'motivation', 'worry', 'energy', 'resources', 'none'],
  helps: ['small', 'scheduled', 'reminder', 'progress', 'encouragement', 'flexible', 'enjoyable', 'unsure'],
  time: ['5', '10', '15', '30', '45', '60', 'more', 'varies'],
  window: ['early', 'morning', 'midday', 'afternoon', 'evening', 'late', 'overnight', 'varies'],
  checkin: ['18:00', '19:00', '20:00', '21:00', '22:00', 'custom', 'ready']
};
const OQ_EXCLUSIVE = { obstacles: 'none', helps: 'unsure' };
const WINDOW_START = { early: '05:00', morning: '08:00', midday: '11:00', afternoon: '14:00', evening: '17:00', late: '20:00', overnight: '23:00' };

const OQ = {
  en: {
    qOf: 'Question {0} of 10', back: 'Back', cont: 'Continue',
    one: 'Select one', upTo2: 'Select up to two', exactlyOne: 'Select exactly one', oneOrMore: 'Select one or more',
    err: { need: 'Choose an answer to continue.', sec: 'Choose one or two secondary focuses, or keep only your main focus.', time: 'Choose a time, or pick another option.', more: 'Set how many minutes you have on a full day.' },
    q1: 'What would you most like One Day to help you do first?',
    reason: { putoff: 'Begin something I have been putting off', started: 'Follow through on a goal I already started', routine: 'Build a consistent routine', priorities: 'Organize several competing priorities', return: 'Return to a goal after time away', track: 'Track and improve a routine that already works' },
    q2: 'What most often interrupts your progress?',
    obstacles: { nextstep: 'I don’t know the next step', toobig: 'My tasks are too big or unclear', overcommit: 'I commit to more than I have time for', schedule: 'My schedule changes unexpectedly', forget: 'I forget or get distracted', motivation: 'I lose interest or motivation', worry: 'I worry about doing it well', energy: 'My energy is limited', resources: 'Money, equipment, or other resources are limited', none: 'Nothing specific; I want a clearer system' },
    q3: 'What approach has helped you follow through before?',
    helps: { small: 'A small task with a clear finish line', scheduled: 'A scheduled time', reminder: 'A reminder', progress: 'Seeing my progress', encouragement: 'Encouragement and check-ins', flexible: 'Flexibility to adjust the plan', enjoyable: 'Making the activity enjoyable', unsure: 'I’m still figuring that out' },
    exclusiveNote: 'Choosing “{0}” clears the other choices.',
    q4: 'Which area will be your main focus this week?', q4sub: 'You can add your own focus later in the app.',
    focus: { money: 'Money & finances', career: 'Career & work', business: 'Business & entrepreneurship', fitness: 'Fitness & movement', food: 'Food & nourishment', sleep: 'Sleep & rest', emotional: 'Emotional well-being', relationships: 'Relationships & connection', home: 'Home & organization', learning: 'Learning & education', creativity: 'Creativity & hobbies', organization: 'Personal organization', meaning: 'Meaning & spirituality', fun: 'Fun & experiences' },
    q5: 'What specific result would you like to work toward first?', q5for: 'For {0}',
    help: 'Help me choose a starting action',
    q6: 'Would you like to include any secondary focuses?', q6keep: 'Keep only my main focus', q6add: 'Add secondary focuses',
    q6note: 'Your main focus gets priority. Secondary focuses can have smaller actions when there’s room.', q6pick: 'Choose up to two',
    q7: 'How much total time can you realistically set aside on a day you work on your goals?',
    time: { 5: '5 minutes', 10: '10 minutes', 15: '15 minutes', 30: '30 minutes', 45: '45 minutes', 60: '60 minutes', more: 'More than 60 minutes', varies: 'It varies; let me choose each day' },
    q7note: 'This is your total time across goals, not the time for each goal.', q7more: 'You’ll set the exact amount when you review your plan.',
    q8: 'Which days usually have room for your planned actions?', allDays: 'Select every day', daysVaries: 'My schedule changes; I’ll choose each week',
    q8note: 'These days are used to suggest a schedule. Not every action has to happen on every day.',
    q9: 'What time of day usually works best?',
    window: { early: 'Early morning, 5–8 AM', morning: 'Morning, 8–11 AM', midday: 'Midday, 11 AM–2 PM', afternoon: 'Afternoon, 2–5 PM', evening: 'Evening, 5–8 PM', late: 'Late evening, 8–11 PM', overnight: 'Overnight, 11 PM–5 AM', varies: 'It varies; I’ll decide each day' },
    q9note: 'Times follow your saved timezone ({0}). This is a preferred window, not a notification.',
    q10: 'When would you like your daily check-in?', ciCustom: 'Choose another time', ciReady: 'I’ll check in when I’m ready', ciTime: 'Check-in time',
    remind: 'Remind me at this time',
    remindNote: 'One Day can show this reminder only while the app is open. It can’t send notifications when it’s closed, so set a phone alarm too if you need one.',
    res: {
      money: { spend: ['Record my spending for seven days', 'Record today’s spending', 'Every purchase entered, or “No spending today”'], bills: ['List upcoming bills and due dates', 'Add upcoming bills to your list', 'At least one bill listed with its due date'], paycheck: ['Build a plan for my next paycheck', 'Plan part of your next paycheck', 'One bill or expense assigned to your next paycheck'], savings: ['Choose a savings goal and first affordable step', 'Take one step toward a savings goal', 'A goal named, or one affordable step written down'], debt: ['Organize my debt balances and minimum payments', 'Gather one debt’s details', 'One balance and its minimum payment written down'] },
      career: { resume: ['Update one section of my résumé or portfolio', 'Improve one résumé or portfolio section', 'One section rewritten and saved'], apply: ['Complete one tailored job application', 'Work on one tailored job application', 'One part of the application drafted or sent'], deliver: ['Finish a defined work deliverable', 'Move your work deliverable forward', 'One defined piece finished'], skill: ['Practice one job-related skill', 'Practice one job-related skill', 'One practice session done'] },
      business: { problem: ['Define one customer problem', 'Write about one customer problem', 'Three sentences describing the problem'], offer: ['Draft a simple service or product offer', 'Draft part of a simple offer', 'Three bullets describing what you offer'], content: ['Create one useful content piece', 'Work on one useful content piece', 'One draft saved'], contact: ['Contact potential customers', 'Reach out to a potential customer', 'One message drafted or sent'], cdeliver: ['Complete one customer deliverable', 'Move a customer deliverable forward', 'One defined piece finished'] },
      fitness: { routine: ['Establish a manageable movement routine', 'Move in a way that feels manageable', 'A short session of movement you choose, at an easy effort'], run: ['Follow my existing running plan', 'Do today’s session from your running plan', 'The planned session done, or logged as changed'], strength: ['Follow my existing strength plan', 'Do today’s session from your strength plan', 'The planned session done, or logged as changed'], mobility: ['Make time for mobility or recovery', 'Make time for mobility or recovery', 'A few minutes of mobility or rest taken'] },
      food: { mealplan: ['Plan meals for the coming week', 'Plan a few meals for the week', 'At least three meals written down'], grocery: ['Prepare a grocery list', 'Add to your grocery list', 'The list covers your next few meals'], cook: ['Cook at home more consistently', 'Prepare one simple meal at home', 'One meal, or part of one, made at home'], regular: ['Make time for regular meals', 'Make time for a regular meal', 'A meal eaten at the time you planned'] },
      sleep: { bedtime: ['Establish a bedtime routine', 'Start your bedtime routine', 'The first step of the routine done at your planned time'], wake: ['Make my wake-up schedule more consistent', 'Get up at your chosen time', 'Up close to the time you chose'], breaks: ['Schedule breaks during the day', 'Take a planned break', 'A break taken away from your tasks'], rest: ['Protect time for rest', 'Protect a block of rest time', 'The rest time kept free'] },
      emotional: { checkin: ['Complete a brief daily check-in', 'Do a brief check-in with yourself', 'A few words written about how you feel'], enjoy: ['Make time for an activity I enjoy', 'Make time for something you enjoy', 'Some time spent on it, any amount'], calm: ['Practice a calming routine I already know', 'Practice a calming routine you know', 'The routine done once'], support: ['Reach out for support', 'Reach out to someone for support', 'One message sent or call made'] },
      relationships: { reconnect: ['Reconnect with someone', 'Reconnect with someone', 'One message sent or call made'], quality: ['Plan quality time with someone', 'Plan quality time with someone', 'A time suggested or agreed'], group: ['Participate in a group or community activity', 'Look into a group or community activity', 'One activity found or attended'], talk: ['Make time for a conversation I have been postponing', 'Prepare for a conversation you’ve postponed', 'Your main point written down, or the conversation started'] },
      home: { clutter: ['Clear one cluttered area', 'Clear part of one cluttered area', 'One surface or section cleared'], drawer: ['Organize one drawer, shelf, or small space', 'Organize one drawer, shelf or small space', 'That one space organized'], tidy: ['Establish a short tidying routine', 'Do a short tidy', 'The planned time spent tidying'], chore: ['Finish one household task', 'Finish one household task', 'The task done'] },
      learning: { lesson: ['Complete a lesson or course section', 'Complete part of a lesson or course', 'One section finished'], study: ['Establish a study routine', 'Study at your planned time', 'The study session done'], read: ['Read regularly', 'Read for a few minutes', 'The planned time spent reading'], practice: ['Practice a specific skill', 'Practice a specific skill', 'One practice round done'] },
      creativity: { start: ['Start a small creative project', 'Start a small creative project', 'Something begun: a sketch, a note or a first step'], continue: ['Continue an unfinished project', 'Continue your unfinished project', 'Any progress made. Unfinished is fine'], hobby: ['Practice a hobby regularly', 'Practice your hobby', 'The practice time done'], fun: ['Make something just for enjoyment', 'Make something just for fun', 'Anything made'] },
      organization: { week: ['Plan my week', 'Plan your week', 'The week’s key tasks written down'], dates: ['Organize appointments and deadlines', 'Organize appointments and deadlines', 'Upcoming dates gathered in one place'], paperwork: ['Complete outstanding paperwork', 'Work on outstanding paperwork', 'One piece of paperwork done or moved forward'], routine: ['Establish a simple daily routine', 'Do your simple daily routine', 'The routine’s steps done'] },
      meaning: { reflect: ['Make time for reflection', 'Make time for reflection', 'A few minutes of quiet reflection'], pray: ['Practice prayer or meditation', 'Practice prayer or meditation', 'The practice done'], read: ['Read something connected to my values', 'Read something connected to your values', 'A few pages or one passage read'], community: ['Participate in a meaningful community activity', 'Look into a meaningful community activity', 'One activity found or joined'] },
      fun: { outing: ['Plan an affordable outing', 'Plan an affordable outing', 'A place and a day chosen'], new: ['Try a new activity', 'Try a new activity', 'One new thing tried or booked'], pastime: ['Make time for a favorite pastime', 'Make time for a favorite pastime', 'Some time spent on it'], explore: ['Explore somewhere nearby', 'Explore somewhere nearby', 'One nearby place visited or picked'] }
    },
    minTitle: 'Two minutes on the same step',
    rv: { time: 'Daily time', title: 'Your starting plan', sub: 'Check it over. Nothing is scheduled until you start.', main: 'Main focus', result: 'Result', secondary: 'Secondary focuses', none: 'None', actions: 'Suggested actions', days: 'Days', window: 'Time window', checkin: 'Check-in', remindOn: 'Reminder on, while the app is open', remindOff: 'No reminder', ready: 'Whenever you’re ready', edit: 'Edit', remove: 'Remove', addBack: 'Add back', add: 'Add', replace: 'Replace', tentative: 'Suggested starting action. Replace it if it doesn’t fit.', removed: 'Removed', secOptional: 'Optional, once a week when there’s room', secNoRoom: 'No room left in your daily time for secondary actions. They can wait.', why: 'Why this plan', total: 'Planned on a full day: {0} of {1}', totalVaries: 'Planned on a full day: {0}. You’ll choose your time each day.', over: 'This is more than the time you set. Remove or shorten an action.', moreQ: 'How many minutes do you have on a full day?', moreHint: 'More than 60', daysVaries: 'Suggested days. You can change them each week.', fitnessRest: 'Movement days are spaced out so there’s time to recover in between.', spendNote: 'About 2 minutes, every day', start: 'Start my first day', min: '{0} min', doneWhen: 'Done when: {0}', pickReplace: 'Choose another action', noActions: 'Your plan has no actions yet. Add one back to start.', mainAction: 'Main action', emptyDays: 'Choose at least one day.', link: 'Gather the details inside that area after you start.' },
    whyReason: { putoff: 'You want to begin something you’ve been putting off, so the first action is short and easy to start.', started: 'You’re following through on something already started, so the action keeps it moving.', routine: 'You want a consistent routine, so the action repeats on the same days.', priorities: 'You’re balancing several priorities, so one main focus comes first and the rest stays optional.', return: 'You’re coming back after time away, so the plan starts small. Nothing from before is owed.', track: 'Your routine already works, so the plan records it and helps you see progress.' },
    whyObstacle: { nextstep: 'You said the next step is often unclear, so each action has a visible finish line.', toobig: 'Big or unclear tasks get in the way, so the action is short with a clear end.', overcommit: 'You tend to commit to more than you have time for, so the plan stays under your daily time.', schedule: 'Your schedule changes, so each action has a 2-minute version for busy days.', forget: 'You tend to forget, so the action is tied to your preferred time window.', motivation: 'Motivation comes and goes, so the action is small enough to do on a low day.', worry: 'You worry about doing it well, so the finish line counts a rough version as done.', energy: 'Your energy is limited, so there’s a 2-minute version for low-energy days.', resources: 'Resources are limited, so the action needs nothing you have to buy.', none: 'You want a clearer system, so the plan is one focus, set days and one check-in.' },
    whyHelp: { small: 'Small tasks with a clear finish line have helped you, so that’s how each action is written.', scheduled: 'A scheduled time has helped, so the plan uses your days and time window.', reminder: 'Reminders have helped. You can turn on the check-in reminder on question 10.', progress: 'Seeing progress has helped. Your Progress tab and companion grow as you log.', encouragement: 'Check-ins have helped, so each day closes with a short evening check-in.', flexible: 'Flexibility has helped, so any action can be made smaller or moved without losing anything.', enjoyable: 'Enjoyment has helped, so pick the version of the action you like best.', unsure: 'You’re still figuring out what helps. The first week is for noticing that.' },
    fitness: 'One Day doesn’t design exercise programs. Follow your own plan or a professional’s advice.'
  },
  es: {
    qOf: 'Pregunta {0} de 10', back: 'Atrás', cont: 'Continuar',
    one: 'Elige una', upTo2: 'Elige hasta dos', exactlyOne: 'Elige exactamente una', oneOrMore: 'Elige uno o más',
    err: { need: 'Elige una respuesta para continuar.', sec: 'Elige uno o dos enfoques secundarios, o quédate solo con tu enfoque principal.', time: 'Elige una hora u otra opción.', more: 'Indica cuántos minutos tienes en un día completo.' },
    q1: '¿En qué te gustaría que One Day te ayudara primero?',
    reason: { putoff: 'Empezar algo que he ido posponiendo', started: 'Cumplir una meta que ya empecé', routine: 'Crear una rutina constante', priorities: 'Organizar varias prioridades que compiten', return: 'Retomar una meta después de un tiempo', track: 'Registrar y mejorar una rutina que ya funciona' },
    q2: '¿Qué interrumpe tu progreso con más frecuencia?',
    obstacles: { nextstep: 'No sé cuál es el siguiente paso', toobig: 'Mis tareas son demasiado grandes o poco claras', overcommit: 'Me comprometo a más de lo que me da el tiempo', schedule: 'Mi horario cambia de forma inesperada', forget: 'Se me olvida o me distraigo', motivation: 'Pierdo el interés o la motivación', worry: 'Me preocupa hacerlo bien', energy: 'Mi energía es limitada', resources: 'El dinero, el equipo u otros recursos son limitados', none: 'Nada en particular; quiero un sistema más claro' },
    q3: '¿Qué te ha ayudado a cumplir en el pasado?',
    helps: { small: 'Una tarea pequeña con un final claro', scheduled: 'Una hora programada', reminder: 'Un recordatorio', progress: 'Ver mi progreso', encouragement: 'Ánimo y seguimiento', flexible: 'Flexibilidad para ajustar el plan', enjoyable: 'Hacer la actividad agradable', unsure: 'Todavía lo estoy descubriendo' },
    exclusiveNote: 'Elegir «{0}» borra las demás opciones.',
    q4: '¿Qué área será tu enfoque principal esta semana?', q4sub: 'Más adelante puedes añadir un enfoque propio en la app.',
    focus: { money: 'Dinero y finanzas', career: 'Carrera y trabajo', business: 'Negocio y emprendimiento', fitness: 'Ejercicio y movimiento', food: 'Comida y alimentación', sleep: 'Sueño y descanso', emotional: 'Bienestar emocional', relationships: 'Relaciones y conexión', home: 'Hogar y orden', learning: 'Aprendizaje y estudios', creativity: 'Creatividad y pasatiempos', organization: 'Organización personal', meaning: 'Sentido y espiritualidad', fun: 'Diversión y experiencias' },
    q5: '¿Qué resultado concreto te gustaría lograr primero?', q5for: 'Para {0}',
    help: 'Ayúdame a elegir una acción para empezar',
    q6: '¿Quieres incluir algún enfoque secundario?', q6keep: 'Solo mi enfoque principal', q6add: 'Añadir enfoques secundarios',
    q6note: 'Tu enfoque principal tiene prioridad. Los secundarios pueden tener acciones más pequeñas cuando haya espacio.', q6pick: 'Elige hasta dos',
    q7: '¿Cuánto tiempo total puedes reservar, siendo realista, un día en que trabajas en tus metas?',
    time: { 5: '5 minutos', 10: '10 minutos', 15: '15 minutos', 30: '30 minutos', 45: '45 minutos', 60: '60 minutos', more: 'Más de 60 minutos', varies: 'Depende; prefiero elegirlo cada día' },
    q7note: 'Es tu tiempo total para todas tus metas, no el tiempo de cada una.', q7more: 'Indicarás la cantidad exacta al revisar tu plan.',
    q8: '¿Qué días suelen tener espacio para tus acciones planificadas?', allDays: 'Elegir todos los días', daysVaries: 'Mi horario cambia; elegiré cada semana',
    q8note: 'Estos días sirven para sugerir un horario. No todas las acciones tienen que hacerse todos los días.',
    q9: '¿Qué momento del día te funciona mejor?',
    window: { early: 'Temprano, 5–8 a. m.', morning: 'Mañana, 8–11 a. m.', midday: 'Mediodía, 11 a. m.–2 p. m.', afternoon: 'Tarde, 2–5 p. m.', evening: 'Atardecer, 5–8 p. m.', late: 'Noche, 8–11 p. m.', overnight: 'Madrugada, 11 p. m.–5 a. m.', varies: 'Depende; lo decido cada día' },
    q9note: 'Las horas siguen tu zona horaria guardada ({0}). Es una franja preferida, no una notificación.',
    q10: '¿Cuándo quieres hacer tu revisión diaria?', ciCustom: 'Elegir otra hora', ciReady: 'La haré cuando esté lista o listo', ciTime: 'Hora de la revisión',
    remind: 'Recordármelo a esta hora',
    remindNote: 'One Day solo puede mostrar este recordatorio mientras la app está abierta. No puede enviar notificaciones cuando está cerrada, así que pon también una alarma en el teléfono si la necesitas.',
    res: {
      money: { spend: ['Registrar mis gastos durante siete días', 'Registrar los gastos de hoy', 'Cada compra anotada, o «Hoy no gasté»'], bills: ['Hacer una lista de próximas facturas y fechas de pago', 'Añadir próximas facturas a tu lista', 'Al menos una factura anotada con su fecha de pago'], paycheck: ['Hacer un plan para mi próximo sueldo', 'Planificar parte de tu próximo sueldo', 'Una factura o gasto asignado a tu próximo sueldo'], savings: ['Elegir una meta de ahorro y un primer paso asequible', 'Dar un paso hacia una meta de ahorro', 'Una meta con nombre, o un paso asequible anotado'], debt: ['Organizar mis saldos de deuda y pagos mínimos', 'Reunir los datos de una deuda', 'Un saldo y su pago mínimo anotados'] },
      career: { resume: ['Actualizar una sección de mi currículum o portafolio', 'Mejorar una sección del currículum o portafolio', 'Una sección reescrita y guardada'], apply: ['Completar una solicitud de empleo adaptada', 'Trabajar en una solicitud de empleo adaptada', 'Una parte de la solicitud redactada o enviada'], deliver: ['Terminar una entrega de trabajo definida', 'Avanzar en tu entrega de trabajo', 'Una parte definida terminada'], skill: ['Practicar una habilidad para el trabajo', 'Practicar una habilidad para el trabajo', 'Una sesión de práctica hecha'] },
      business: { problem: ['Definir un problema de un cliente', 'Escribir sobre un problema de un cliente', 'Tres frases que describen el problema'], offer: ['Redactar una oferta sencilla de servicio o producto', 'Redactar parte de una oferta sencilla', 'Tres puntos que describen lo que ofreces'], content: ['Crear un contenido útil', 'Trabajar en un contenido útil', 'Un borrador guardado'], contact: ['Contactar a clientes potenciales', 'Escribir a un cliente potencial', 'Un mensaje redactado o enviado'], cdeliver: ['Completar una entrega para un cliente', 'Avanzar en una entrega para un cliente', 'Una parte definida terminada'] },
      fitness: { routine: ['Crear una rutina de movimiento llevadera', 'Moverte de una forma que te resulte llevadera', 'Una sesión corta de movimiento a tu elección, a ritmo suave'], run: ['Seguir mi plan de carrera actual', 'Hacer la sesión de hoy de tu plan de carrera', 'La sesión planificada hecha, o registrada con cambios'], strength: ['Seguir mi plan de fuerza actual', 'Hacer la sesión de hoy de tu plan de fuerza', 'La sesión planificada hecha, o registrada con cambios'], mobility: ['Hacer tiempo para movilidad o recuperación', 'Hacer tiempo para movilidad o recuperación', 'Unos minutos de movilidad o descanso'] },
      food: { mealplan: ['Planificar las comidas de la próxima semana', 'Planificar algunas comidas de la semana', 'Al menos tres comidas anotadas'], grocery: ['Preparar una lista de compras', 'Añadir a tu lista de compras', 'La lista cubre tus próximas comidas'], cook: ['Cocinar en casa con más constancia', 'Preparar una comida sencilla en casa', 'Una comida, o parte de una, hecha en casa'], regular: ['Hacer tiempo para comer con regularidad', 'Hacer tiempo para una comida', 'Una comida a la hora que planeaste'] },
      sleep: { bedtime: ['Crear una rutina para dormir', 'Empezar tu rutina para dormir', 'El primer paso de la rutina hecho a la hora planeada'], wake: ['Despertarme a una hora más constante', 'Levantarte a la hora que elegiste', 'Levantada o levantado cerca de esa hora'], breaks: ['Programar pausas durante el día', 'Tomar una pausa planificada', 'Una pausa lejos de tus tareas'], rest: ['Proteger tiempo para descansar', 'Proteger un rato de descanso', 'Ese rato de descanso libre'] },
      emotional: { checkin: ['Hacer una breve revisión diaria', 'Hacer una breve revisión contigo', 'Unas palabras sobre cómo te sientes'], enjoy: ['Hacer tiempo para algo que disfruto', 'Hacer tiempo para algo que disfrutas', 'Algo de tiempo dedicado, cualquier cantidad'], calm: ['Practicar una rutina para calmarme que ya conozco', 'Practicar una rutina para calmarte que conoces', 'La rutina hecha una vez'], support: ['Buscar apoyo', 'Pedir apoyo a alguien', 'Un mensaje enviado o una llamada hecha'] },
      relationships: { reconnect: ['Volver a conectar con alguien', 'Volver a conectar con alguien', 'Un mensaje enviado o una llamada hecha'], quality: ['Planificar tiempo de calidad con alguien', 'Planificar tiempo de calidad con alguien', 'Un momento propuesto o acordado'], group: ['Participar en una actividad de grupo o comunidad', 'Buscar una actividad de grupo o comunidad', 'Una actividad encontrada o a la que asististe'], talk: ['Hacer tiempo para una conversación que he ido posponiendo', 'Prepararte para una conversación pendiente', 'Tu idea principal anotada, o la conversación iniciada'] },
      home: { clutter: ['Despejar una zona desordenada', 'Despejar parte de una zona desordenada', 'Una superficie o sección despejada'], drawer: ['Ordenar un cajón, estante o espacio pequeño', 'Ordenar un cajón, estante o espacio pequeño', 'Ese espacio ordenado'], tidy: ['Crear una rutina corta de orden', 'Hacer un orden rápido', 'El tiempo planeado dedicado a ordenar'], chore: ['Terminar una tarea de la casa', 'Terminar una tarea de la casa', 'La tarea hecha'] },
      learning: { lesson: ['Completar una lección o sección de un curso', 'Completar parte de una lección o curso', 'Una sección terminada'], study: ['Crear una rutina de estudio', 'Estudiar a la hora planeada', 'La sesión de estudio hecha'], read: ['Leer con regularidad', 'Leer unos minutos', 'El tiempo planeado dedicado a leer'], practice: ['Practicar una habilidad concreta', 'Practicar una habilidad concreta', 'Una ronda de práctica hecha'] },
      creativity: { start: ['Empezar un pequeño proyecto creativo', 'Empezar un pequeño proyecto creativo', 'Algo empezado: un boceto, una nota o un primer paso'], continue: ['Continuar un proyecto sin terminar', 'Continuar tu proyecto sin terminar', 'Cualquier avance. Sin terminar está bien'], hobby: ['Practicar un pasatiempo con regularidad', 'Practicar tu pasatiempo', 'El tiempo de práctica hecho'], fun: ['Hacer algo solo por disfrutar', 'Hacer algo solo por diversión', 'Cualquier cosa hecha'] },
      organization: { week: ['Planificar mi semana', 'Planificar tu semana', 'Las tareas clave de la semana anotadas'], dates: ['Organizar citas y fechas límite', 'Organizar citas y fechas límite', 'Las próximas fechas reunidas en un solo lugar'], paperwork: ['Completar trámites pendientes', 'Trabajar en trámites pendientes', 'Un trámite hecho o avanzado'], routine: ['Crear una rutina diaria sencilla', 'Hacer tu rutina diaria sencilla', 'Los pasos de la rutina hechos'] },
      meaning: { reflect: ['Hacer tiempo para reflexionar', 'Hacer tiempo para reflexionar', 'Unos minutos de reflexión tranquila'], pray: ['Practicar la oración o la meditación', 'Practicar la oración o la meditación', 'La práctica hecha'], read: ['Leer algo relacionado con mis valores', 'Leer algo relacionado con tus valores', 'Unas páginas o un pasaje leído'], community: ['Participar en una actividad comunitaria con sentido', 'Buscar una actividad comunitaria con sentido', 'Una actividad encontrada o a la que te uniste'] },
      fun: { outing: ['Planificar una salida asequible', 'Planificar una salida asequible', 'Un lugar y un día elegidos'], new: ['Probar una actividad nueva', 'Probar una actividad nueva', 'Algo nuevo probado o reservado'], pastime: ['Hacer tiempo para un pasatiempo favorito', 'Hacer tiempo para un pasatiempo favorito', 'Algo de tiempo dedicado'], explore: ['Explorar algún lugar cercano', 'Explorar algún lugar cercano', 'Un lugar cercano visitado o elegido'] }
    },
    minTitle: 'Dos minutos en el mismo paso',
    rv: { time: 'Tiempo diario', title: 'Tu plan para empezar', sub: 'Revísalo. No se programa nada hasta que empieces.', main: 'Enfoque principal', result: 'Resultado', secondary: 'Enfoques secundarios', none: 'Ninguno', actions: 'Acciones sugeridas', days: 'Días', window: 'Franja horaria', checkin: 'Revisión', remindOn: 'Recordatorio activado, mientras la app está abierta', remindOff: 'Sin recordatorio', ready: 'Cuando estés lista o listo', edit: 'Editar', remove: 'Quitar', addBack: 'Volver a añadir', add: 'Añadir', replace: 'Cambiar', tentative: 'Acción sugerida para empezar. Cámbiala si no encaja.', removed: 'Quitada', secOptional: 'Opcional, una vez por semana cuando haya espacio', secNoRoom: 'No queda tiempo diario para acciones secundarias. Pueden esperar.', why: 'Por qué este plan', total: 'Planificado en un día completo: {0} de {1}', totalVaries: 'Planificado en un día completo: {0}. Elegirás tu tiempo cada día.', over: 'Es más que el tiempo que indicaste. Quita o acorta una acción.', moreQ: '¿Cuántos minutos tienes en un día completo?', moreHint: 'Más de 60', daysVaries: 'Días sugeridos. Puedes cambiarlos cada semana.', fitnessRest: 'Los días de movimiento están separados para dejar tiempo de recuperación.', spendNote: 'Unos 2 minutos, todos los días', start: 'Empezar mi primer día', min: '{0} min', doneWhen: 'Listo cuando: {0}', pickReplace: 'Elige otra acción', noActions: 'Tu plan aún no tiene acciones. Vuelve a añadir una para empezar.', mainAction: 'Acción principal', emptyDays: 'Elige al menos un día.', link: 'Reúne los detalles dentro de esa área cuando empieces.' },
    whyReason: { putoff: 'Quieres empezar algo que has ido posponiendo, así que la primera acción es corta y fácil de empezar.', started: 'Quieres cumplir algo que ya empezaste, así que la acción lo mantiene en marcha.', routine: 'Quieres una rutina constante, así que la acción se repite los mismos días.', priorities: 'Equilibras varias prioridades, así que un enfoque principal va primero y lo demás queda opcional.', return: 'Vuelves después de un tiempo, así que el plan empieza pequeño. No debes nada de antes.', track: 'Tu rutina ya funciona, así que el plan la registra y te ayuda a ver tu progreso.' },
    whyObstacle: { nextstep: 'Dijiste que a menudo no tienes claro el siguiente paso, así que cada acción tiene un final visible.', toobig: 'Las tareas grandes o poco claras te frenan, así que la acción es corta y con un final claro.', overcommit: 'Sueles comprometerte a más de lo que te da el tiempo, así que el plan no supera tu tiempo diario.', schedule: 'Tu horario cambia, así que cada acción tiene una versión de 2 minutos para días ocupados.', forget: 'Se te suele olvidar, así que la acción va ligada a tu franja horaria preferida.', motivation: 'La motivación va y viene, así que la acción es lo bastante pequeña para un día bajo.', worry: 'Te preocupa hacerlo bien, así que una versión imperfecta cuenta como hecha.', energy: 'Tu energía es limitada, así que hay una versión de 2 minutos para días de poca energía.', resources: 'Los recursos son limitados, así que la acción no requiere comprar nada.', none: 'Quieres un sistema más claro, así que el plan es un enfoque, días fijos y una revisión.' },
    whyHelp: { small: 'Te han ayudado las tareas pequeñas con un final claro, así que cada acción está escrita así.', scheduled: 'Te ha ayudado tener una hora fija, así que el plan usa tus días y tu franja horaria.', reminder: 'Te han ayudado los recordatorios. Puedes activar el de la revisión en la pregunta 10.', progress: 'Te ha ayudado ver tu progreso. La pestaña Progreso y tu compañero crecen a medida que registras.', encouragement: 'Te ha ayudado el seguimiento, así que cada día termina con una breve revisión de la noche.', flexible: 'Te ha ayudado la flexibilidad, así que cualquier acción puede hacerse más pequeña o moverse sin perder nada.', enjoyable: 'Te ha ayudado disfrutar, así que elige la versión de la acción que más te guste.', unsure: 'Todavía estás descubriendo qué te ayuda. La primera semana sirve para notarlo.' },
    fitness: 'One Day no diseña programas de ejercicio. Sigue tu propio plan o el consejo de un profesional.'
  },
  it: {
    qOf: 'Domanda {0} di 10', back: 'Indietro', cont: 'Continua',
    one: 'Scegline una', upTo2: 'Scegline fino a due', exactlyOne: 'Scegline esattamente una', oneOrMore: 'Scegline uno o più',
    err: { need: 'Scegli una risposta per continuare.', sec: 'Scegli uno o due obiettivi secondari, oppure tieni solo quello principale.', time: 'Scegli un orario o un’altra opzione.', more: 'Indica quanti minuti hai in una giornata piena.' },
    q1: 'In cosa vorresti che One Day ti aiutasse per prima cosa?',
    reason: { putoff: 'Iniziare qualcosa che continuo a rimandare', started: 'Portare avanti un obiettivo che ho già iniziato', routine: 'Costruire una routine costante', priorities: 'Organizzare diverse priorità in competizione', return: 'Riprendere un obiettivo dopo una pausa', track: 'Monitorare e migliorare una routine che già funziona' },
    q2: 'Cosa interrompe più spesso i tuoi progressi?',
    obstacles: { nextstep: 'Non so qual è il passo successivo', toobig: 'I miei compiti sono troppo grandi o poco chiari', overcommit: 'Mi impegno in più cose di quante ne permetta il tempo', schedule: 'I miei orari cambiano all’improvviso', forget: 'Dimentico o mi distraggo', motivation: 'Perdo interesse o motivazione', worry: 'Mi preoccupa farlo bene', energy: 'La mia energia è limitata', resources: 'Soldi, attrezzatura o altre risorse sono limitati', none: 'Niente di particolare; voglio un sistema più chiaro' },
    q3: 'Cosa ti ha aiutato a portare a termine le cose in passato?',
    helps: { small: 'Un compito piccolo con un traguardo chiaro', scheduled: 'Un orario fissato', reminder: 'Un promemoria', progress: 'Vedere i miei progressi', encouragement: 'Incoraggiamento e check-in', flexible: 'La flessibilità di adattare il piano', enjoyable: 'Rendere l’attività piacevole', unsure: 'Lo sto ancora capendo' },
    exclusiveNote: 'Scegliere «{0}» toglie le altre scelte.',
    q4: 'Quale area sarà il tuo obiettivo principale questa settimana?', q4sub: 'Più avanti potrai aggiungere un obiettivo tuo nell’app.',
    focus: { money: 'Soldi e finanze', career: 'Carriera e lavoro', business: 'Attività e imprenditoria', fitness: 'Attività fisica e movimento', food: 'Cibo e alimentazione', sleep: 'Sonno e riposo', emotional: 'Benessere emotivo', relationships: 'Relazioni e legami', home: 'Casa e ordine', learning: 'Apprendimento e studio', creativity: 'Creatività e hobby', organization: 'Organizzazione personale', meaning: 'Senso e spiritualità', fun: 'Svago ed esperienze' },
    q5: 'Quale risultato concreto vorresti raggiungere per primo?', q5for: 'Per {0}',
    help: 'Aiutami a scegliere un’azione per iniziare',
    q6: 'Vuoi aggiungere degli obiettivi secondari?', q6keep: 'Tengo solo l’obiettivo principale', q6add: 'Aggiungi obiettivi secondari',
    q6note: 'L’obiettivo principale ha la priorità. Quelli secondari possono avere azioni più piccole quando c’è spazio.', q6pick: 'Scegline fino a due',
    q7: 'Quanto tempo in tutto puoi realisticamente dedicare in un giorno in cui lavori ai tuoi obiettivi?',
    time: { 5: '5 minuti', 10: '10 minuti', 15: '15 minuti', 30: '30 minuti', 45: '45 minuti', 60: '60 minuti', more: 'Più di 60 minuti', varies: 'Dipende; lo scelgo ogni giorno' },
    q7note: 'È il tempo totale per tutti i tuoi obiettivi, non quello per ciascuno.', q7more: 'Imposterai la quantità esatta quando rivedrai il piano.',
    q8: 'Quali giorni di solito hanno spazio per le azioni pianificate?', allDays: 'Seleziona tutti i giorni', daysVaries: 'I miei orari cambiano; sceglierò ogni settimana',
    q8note: 'Questi giorni servono a suggerire un calendario. Non tutte le azioni devono avvenire ogni giorno.',
    q9: 'Quale momento della giornata di solito funziona meglio?',
    window: { early: 'Mattina presto, 5–8', morning: 'Mattina, 8–11', midday: 'Mezzogiorno, 11–14', afternoon: 'Pomeriggio, 14–17', evening: 'Sera, 17–20', late: 'Tarda sera, 20–23', overnight: 'Notte, 23–5', varies: 'Dipende; decido ogni giorno' },
    q9note: 'Gli orari seguono il fuso orario salvato ({0}). È una fascia preferita, non una notifica.',
    q10: 'Quando vuoi fare il check-in quotidiano?', ciCustom: 'Scegli un altro orario', ciReady: 'Lo farò quando sono pronta o pronto', ciTime: 'Ora del check-in',
    remind: 'Ricordamelo a quest’ora',
    remindNote: 'One Day può mostrare questo promemoria solo mentre l’app è aperta. Non può inviare notifiche quando è chiusa, quindi imposta anche una sveglia sul telefono se ti serve.',
    res: {
      money: { spend: ['Registrare le mie spese per sette giorni', 'Registrare le spese di oggi', 'Ogni acquisto inserito, oppure «Oggi nessuna spesa»'], bills: ['Elencare le prossime bollette e scadenze', 'Aggiungere le prossime bollette alla lista', 'Almeno una bolletta elencata con la sua scadenza'], paycheck: ['Fare un piano per il prossimo stipendio', 'Pianificare parte del prossimo stipendio', 'Una bolletta o spesa assegnata al prossimo stipendio'], savings: ['Scegliere un obiettivo di risparmio e un primo passo sostenibile', 'Fare un passo verso un obiettivo di risparmio', 'Un obiettivo con un nome, o un passo sostenibile scritto'], debt: ['Organizzare saldi dei debiti e pagamenti minimi', 'Raccogliere i dati di un debito', 'Un saldo e il suo pagamento minimo scritti'] },
      career: { resume: ['Aggiornare una sezione del curriculum o del portfolio', 'Migliorare una sezione del curriculum o del portfolio', 'Una sezione riscritta e salvata'], apply: ['Completare una candidatura su misura', 'Lavorare a una candidatura su misura', 'Una parte della candidatura scritta o inviata'], deliver: ['Finire un lavoro con un risultato definito', 'Far avanzare il tuo lavoro', 'Una parte definita finita'], skill: ['Esercitare una competenza utile al lavoro', 'Esercitare una competenza utile al lavoro', 'Una sessione di esercizio fatta'] },
      business: { problem: ['Definire un problema di un cliente', 'Scrivere di un problema di un cliente', 'Tre frasi che descrivono il problema'], offer: ['Scrivere una semplice offerta di servizio o prodotto', 'Scrivere parte di un’offerta semplice', 'Tre punti che descrivono cosa offri'], content: ['Creare un contenuto utile', 'Lavorare a un contenuto utile', 'Una bozza salvata'], contact: ['Contattare potenziali clienti', 'Scrivere a un potenziale cliente', 'Un messaggio scritto o inviato'], cdeliver: ['Completare una consegna per un cliente', 'Far avanzare una consegna per un cliente', 'Una parte definita finita'] },
      fitness: { routine: ['Creare una routine di movimento sostenibile', 'Muoverti in un modo che ti sembri sostenibile', 'Una breve sessione di movimento a tua scelta, a sforzo leggero'], run: ['Seguire il mio piano di corsa attuale', 'Fare la sessione di oggi del tuo piano di corsa', 'La sessione prevista fatta, o registrata con modifiche'], strength: ['Seguire il mio piano di forza attuale', 'Fare la sessione di oggi del tuo piano di forza', 'La sessione prevista fatta, o registrata con modifiche'], mobility: ['Trovare tempo per mobilità o recupero', 'Trovare tempo per mobilità o recupero', 'Qualche minuto di mobilità o riposo'] },
      food: { mealplan: ['Pianificare i pasti della prossima settimana', 'Pianificare alcuni pasti della settimana', 'Almeno tre pasti scritti'], grocery: ['Preparare una lista della spesa', 'Aggiungere alla lista della spesa', 'La lista copre i prossimi pasti'], cook: ['Cucinare a casa con più costanza', 'Preparare un pasto semplice a casa', 'Un pasto, o parte di uno, fatto a casa'], regular: ['Trovare tempo per pasti regolari', 'Trovare tempo per un pasto', 'Un pasto all’ora che avevi previsto'] },
      sleep: { bedtime: ['Creare una routine della buonanotte', 'Iniziare la tua routine della buonanotte', 'Il primo passo della routine fatto all’ora prevista'], wake: ['Svegliarmi a orari più regolari', 'Alzarti all’ora che hai scelto', 'In piedi vicino all’ora scelta'], breaks: ['Programmare pause durante il giorno', 'Fare una pausa programmata', 'Una pausa lontano dai tuoi compiti'], rest: ['Proteggere del tempo per riposare', 'Proteggere un momento di riposo', 'Quel momento di riposo lasciato libero'] },
      emotional: { checkin: ['Fare un breve check-in quotidiano', 'Fare un breve check-in con te', 'Qualche parola scritta su come ti senti'], enjoy: ['Trovare tempo per un’attività che mi piace', 'Trovare tempo per qualcosa che ti piace', 'Un po’ di tempo dedicato, qualsiasi durata'], calm: ['Praticare una routine calmante che già conosco', 'Praticare una routine calmante che conosci', 'La routine fatta una volta'], support: ['Chiedere supporto', 'Chiedere supporto a qualcuno', 'Un messaggio inviato o una telefonata fatta'] },
      relationships: { reconnect: ['Riallacciare i rapporti con qualcuno', 'Riallacciare i rapporti con qualcuno', 'Un messaggio inviato o una telefonata fatta'], quality: ['Pianificare tempo di qualità con qualcuno', 'Pianificare tempo di qualità con qualcuno', 'Un momento proposto o concordato'], group: ['Partecipare a un’attività di gruppo o di comunità', 'Cercare un’attività di gruppo o di comunità', 'Un’attività trovata o frequentata'], talk: ['Trovare tempo per una conversazione che rimando', 'Prepararti a una conversazione rimandata', 'Il punto principale scritto, o la conversazione iniziata'] },
      home: { clutter: ['Liberare una zona in disordine', 'Liberare parte di una zona in disordine', 'Una superficie o una parte liberata'], drawer: ['Sistemare un cassetto, uno scaffale o un piccolo spazio', 'Sistemare un cassetto, uno scaffale o un piccolo spazio', 'Quello spazio sistemato'], tidy: ['Creare una breve routine di riordino', 'Fare un breve riordino', 'Il tempo previsto dedicato a riordinare'], chore: ['Finire un lavoro di casa', 'Finire un lavoro di casa', 'Il lavoro fatto'] },
      learning: { lesson: ['Completare una lezione o una parte di un corso', 'Completare parte di una lezione o di un corso', 'Una parte finita'], study: ['Creare una routine di studio', 'Studiare all’ora prevista', 'La sessione di studio fatta'], read: ['Leggere con regolarità', 'Leggere per qualche minuto', 'Il tempo previsto dedicato alla lettura'], practice: ['Esercitare una competenza specifica', 'Esercitare una competenza specifica', 'Un giro di esercizio fatto'] },
      creativity: { start: ['Iniziare un piccolo progetto creativo', 'Iniziare un piccolo progetto creativo', 'Qualcosa di iniziato: uno schizzo, una nota o un primo passo'], continue: ['Continuare un progetto non finito', 'Continuare il tuo progetto non finito', 'Qualsiasi progresso. Anche non finito va bene'], hobby: ['Praticare un hobby con regolarità', 'Praticare il tuo hobby', 'Il tempo di pratica fatto'], fun: ['Creare qualcosa solo per piacere', 'Creare qualcosa solo per divertimento', 'Qualsiasi cosa creata'] },
      organization: { week: ['Pianificare la mia settimana', 'Pianificare la tua settimana', 'I compiti principali della settimana scritti'], dates: ['Organizzare appuntamenti e scadenze', 'Organizzare appuntamenti e scadenze', 'Le prossime date raccolte in un solo posto'], paperwork: ['Completare pratiche in sospeso', 'Lavorare alle pratiche in sospeso', 'Una pratica completata o portata avanti'], routine: ['Creare una semplice routine quotidiana', 'Fare la tua semplice routine quotidiana', 'I passi della routine fatti'] },
      meaning: { reflect: ['Trovare tempo per riflettere', 'Trovare tempo per riflettere', 'Qualche minuto di riflessione tranquilla'], pray: ['Praticare la preghiera o la meditazione', 'Praticare la preghiera o la meditazione', 'La pratica fatta'], read: ['Leggere qualcosa legato ai miei valori', 'Leggere qualcosa legato ai tuoi valori', 'Qualche pagina o un passaggio letto'], community: ['Partecipare a un’attività di comunità significativa', 'Cercare un’attività di comunità significativa', 'Un’attività trovata o a cui hai aderito'] },
      fun: { outing: ['Pianificare un’uscita economica', 'Pianificare un’uscita economica', 'Un posto e un giorno scelti'], new: ['Provare un’attività nuova', 'Provare un’attività nuova', 'Qualcosa di nuovo provato o prenotato'], pastime: ['Trovare tempo per un passatempo preferito', 'Trovare tempo per un passatempo preferito', 'Un po’ di tempo dedicato'], explore: ['Esplorare un posto vicino', 'Esplorare un posto vicino', 'Un posto vicino visitato o scelto'] }
    },
    minTitle: 'Due minuti sullo stesso passo',
    rv: { time: 'Tempo al giorno', title: 'Il tuo piano di partenza', sub: 'Controllalo. Nulla viene programmato finché non inizi.', main: 'Obiettivo principale', result: 'Risultato', secondary: 'Obiettivi secondari', none: 'Nessuno', actions: 'Azioni suggerite', days: 'Giorni', window: 'Fascia oraria', checkin: 'Check-in', remindOn: 'Promemoria attivo, mentre l’app è aperta', remindOff: 'Nessun promemoria', ready: 'Quando sei pronta o pronto', edit: 'Modifica', remove: 'Togli', addBack: 'Aggiungi di nuovo', add: 'Aggiungi', replace: 'Sostituisci', tentative: 'Azione suggerita per iniziare. Sostituiscila se non va bene.', removed: 'Tolta', secOptional: 'Facoltativa, una volta a settimana quando c’è spazio', secNoRoom: 'Non resta tempo giornaliero per azioni secondarie. Possono aspettare.', why: 'Perché questo piano', total: 'Pianificato in una giornata piena: {0} su {1}', totalVaries: 'Pianificato in una giornata piena: {0}. Sceglierai il tuo tempo ogni giorno.', over: 'È più del tempo che hai indicato. Togli o accorcia un’azione.', moreQ: 'Quanti minuti hai in una giornata piena?', moreHint: 'Più di 60', daysVaries: 'Giorni suggeriti. Puoi cambiarli ogni settimana.', fitnessRest: 'I giorni di movimento sono distanziati per lasciare tempo al recupero.', spendNote: 'Circa 2 minuti, ogni giorno', start: 'Inizia il mio primo giorno', min: '{0} min', doneWhen: 'Fatto quando: {0}', pickReplace: 'Scegli un’altra azione', noActions: 'Il tuo piano non ha ancora azioni. Aggiungine di nuovo una per iniziare.', mainAction: 'Azione principale', emptyDays: 'Scegli almeno un giorno.', link: 'Raccogli i dettagli in quell’area dopo aver iniziato.' },
    whyReason: { putoff: 'Vuoi iniziare qualcosa che rimandi, quindi la prima azione è breve e facile da avviare.', started: 'Vuoi portare avanti qualcosa di già iniziato, quindi l’azione lo tiene in movimento.', routine: 'Vuoi una routine costante, quindi l’azione si ripete negli stessi giorni.', priorities: 'Stai bilanciando più priorità, quindi un obiettivo principale viene prima e il resto è facoltativo.', return: 'Riprendi dopo una pausa, quindi il piano parte in piccolo. Non devi recuperare nulla.', track: 'La tua routine funziona già, quindi il piano la registra e ti aiuta a vedere i progressi.' },
    whyObstacle: { nextstep: 'Hai detto che spesso il passo successivo non è chiaro, quindi ogni azione ha un traguardo visibile.', toobig: 'I compiti grandi o poco chiari ti frenano, quindi l’azione è breve e ha una fine chiara.', overcommit: 'Tendi a impegnarti più di quanto il tempo permetta, quindi il piano resta entro il tuo tempo giornaliero.', schedule: 'I tuoi orari cambiano, quindi ogni azione ha una versione da 2 minuti per i giorni pieni.', forget: 'Tendi a dimenticare, quindi l’azione è legata alla tua fascia oraria preferita.', motivation: 'La motivazione va e viene, quindi l’azione è abbastanza piccola per una giornata no.', worry: 'Ti preoccupa farlo bene, quindi anche una versione imperfetta conta come fatta.', energy: 'La tua energia è limitata, quindi c’è una versione da 2 minuti per i giorni con poca energia.', resources: 'Le risorse sono limitate, quindi l’azione non richiede acquisti.', none: 'Vuoi un sistema più chiaro, quindi il piano è un obiettivo, giorni fissi e un check-in.' },
    whyHelp: { small: 'Ti hanno aiutato i compiti piccoli con un traguardo chiaro, quindi ogni azione è scritta così.', scheduled: 'Ti ha aiutato un orario fisso, quindi il piano usa i tuoi giorni e la tua fascia oraria.', reminder: 'Ti hanno aiutato i promemoria. Puoi attivare quello del check-in alla domanda 10.', progress: 'Ti ha aiutato vedere i progressi. La scheda Progressi e il tuo compagno crescono man mano che registri.', encouragement: 'Ti hanno aiutato i check-in, quindi ogni giornata si chiude con un breve check-in serale.', flexible: 'Ti ha aiutato la flessibilità, quindi ogni azione può essere ridotta o spostata senza perdere nulla.', enjoyable: 'Ti ha aiutato il piacere, quindi scegli la versione dell’azione che ti piace di più.', unsure: 'Stai ancora capendo cosa ti aiuta. La prima settimana serve a notarlo.' },
    fitness: 'One Day non crea programmi di allenamento. Segui il tuo piano o il consiglio di un professionista.'
  },
  fr: {
    qOf: 'Question {0} sur 10', back: 'Retour', cont: 'Continuer',
    one: 'Choisis-en une', upTo2: 'Choisis-en jusqu’à deux', exactlyOne: 'Choisis-en exactement une', oneOrMore: 'Choisis-en un ou plusieurs',
    err: { need: 'Choisis une réponse pour continuer.', sec: 'Choisis un ou deux objectifs secondaires, ou garde seulement ton objectif principal.', time: 'Choisis une heure ou une autre option.', more: 'Indique combien de minutes tu as lors d’une journée complète.' },
    q1: 'Pour quoi aimerais-tu que One Day t’aide en premier ?',
    reason: { putoff: 'Commencer quelque chose que je repousse', started: 'Aller au bout d’un objectif déjà commencé', routine: 'Créer une routine régulière', priorities: 'Organiser plusieurs priorités qui se disputent mon temps', return: 'Reprendre un objectif après une pause', track: 'Suivre et améliorer une routine qui marche déjà' },
    q2: 'Qu’est-ce qui interrompt le plus souvent tes progrès ?',
    obstacles: { nextstep: 'Je ne sais pas quelle est la prochaine étape', toobig: 'Mes tâches sont trop grosses ou floues', overcommit: 'Je m’engage à plus que ce que mon temps permet', schedule: 'Mon emploi du temps change sans prévenir', forget: 'J’oublie ou je me laisse distraire', motivation: 'Je perds l’intérêt ou la motivation', worry: 'J’ai peur de mal faire', energy: 'Mon énergie est limitée', resources: 'L’argent, le matériel ou d’autres ressources sont limités', none: 'Rien de précis ; je veux un système plus clair' },
    q3: 'Qu’est-ce qui t’a aidé à aller au bout auparavant ?',
    helps: { small: 'Une petite tâche avec une fin claire', scheduled: 'Un horaire prévu', reminder: 'Un rappel', progress: 'Voir mes progrès', encouragement: 'Des encouragements et des points réguliers', flexible: 'La liberté d’ajuster le plan', enjoyable: 'Rendre l’activité agréable', unsure: 'Je suis encore en train de le découvrir' },
    exclusiveNote: 'Choisir « {0} » efface les autres choix.',
    q4: 'Quel domaine sera ton objectif principal cette semaine ?', q4sub: 'Tu pourras ajouter ton propre objectif plus tard dans l’app.',
    focus: { money: 'Argent et finances', career: 'Carrière et travail', business: 'Entreprise et entrepreneuriat', fitness: 'Sport et mouvement', food: 'Alimentation', sleep: 'Sommeil et repos', emotional: 'Bien-être émotionnel', relationships: 'Relations et liens', home: 'Maison et rangement', learning: 'Apprentissage et études', creativity: 'Créativité et loisirs', organization: 'Organisation personnelle', meaning: 'Sens et spiritualité', fun: 'Plaisir et découvertes' },
    q5: 'Quel résultat concret aimerais-tu viser en premier ?', q5for: 'Pour {0}',
    help: 'Aide-moi à choisir une action pour commencer',
    q6: 'Veux-tu ajouter des objectifs secondaires ?', q6keep: 'Garder seulement mon objectif principal', q6add: 'Ajouter des objectifs secondaires',
    q6note: 'Ton objectif principal passe en premier. Les objectifs secondaires peuvent avoir de plus petites actions quand il y a de la place.', q6pick: 'Choisis-en jusqu’à deux',
    q7: 'Combien de temps au total peux-tu réalistement réserver un jour où tu travailles sur tes objectifs ?',
    time: { 5: '5 minutes', 10: '10 minutes', 15: '15 minutes', 30: '30 minutes', 45: '45 minutes', 60: '60 minutes', more: 'Plus de 60 minutes', varies: 'Ça dépend ; je choisis chaque jour' },
    q7note: 'C’est ton temps total pour tous tes objectifs, pas le temps pour chacun.', q7more: 'Tu indiqueras la durée exacte en relisant ton plan.',
    q8: 'Quels jours ont généralement de la place pour tes actions prévues ?', allDays: 'Tout sélectionner', daysVaries: 'Mon emploi du temps change ; je choisirai chaque semaine',
    q8note: 'Ces jours servent à proposer un calendrier. Chaque action n’a pas besoin d’avoir lieu tous les jours.',
    q9: 'Quel moment de la journée te convient le mieux en général ?',
    window: { early: 'Tôt le matin, 5 h–8 h', morning: 'Matin, 8 h–11 h', midday: 'Midi, 11 h–14 h', afternoon: 'Après-midi, 14 h–17 h', evening: 'Début de soirée, 17 h–20 h', late: 'Soirée, 20 h–23 h', overnight: 'Nuit, 23 h–5 h', varies: 'Ça dépend ; je décide chaque jour' },
    q9note: 'Les heures suivent ton fuseau horaire enregistré ({0}). C’est un créneau préféré, pas une notification.',
    q10: 'Quand veux-tu faire ton bilan du jour ?', ciCustom: 'Choisir une autre heure', ciReady: 'Je le ferai quand je serai prêt ou prête', ciTime: 'Heure du bilan',
    remind: 'Me le rappeler à cette heure',
    remindNote: 'One Day ne peut afficher ce rappel que lorsque l’app est ouverte. Elle ne peut pas envoyer de notifications quand elle est fermée : règle aussi une alarme sur ton téléphone si besoin.',
    res: {
      money: { spend: ['Noter mes dépenses pendant sept jours', 'Noter les dépenses du jour', 'Chaque achat saisi, ou « Aucune dépense aujourd’hui »'], bills: ['Lister les prochaines factures et leurs échéances', 'Ajouter les prochaines factures à ta liste', 'Au moins une facture listée avec son échéance'], paycheck: ['Faire un plan pour ma prochaine paie', 'Planifier une partie de ta prochaine paie', 'Une facture ou une dépense attribuée à ta prochaine paie'], savings: ['Choisir un objectif d’épargne et une première étape abordable', 'Faire un pas vers un objectif d’épargne', 'Un objectif nommé, ou une étape abordable notée'], debt: ['Organiser mes soldes de dettes et paiements minimums', 'Rassembler les détails d’une dette', 'Un solde et son paiement minimum notés'] },
      career: { resume: ['Mettre à jour une partie de mon CV ou de mon portfolio', 'Améliorer une partie du CV ou du portfolio', 'Une partie réécrite et enregistrée'], apply: ['Terminer une candidature personnalisée', 'Travailler sur une candidature personnalisée', 'Une partie de la candidature rédigée ou envoyée'], deliver: ['Finir un livrable de travail défini', 'Faire avancer ton livrable', 'Une partie définie terminée'], skill: ['Pratiquer une compétence utile au travail', 'Pratiquer une compétence utile au travail', 'Une séance de pratique faite'] },
      business: { problem: ['Définir un problème d’un client', 'Écrire sur un problème d’un client', 'Trois phrases qui décrivent le problème'], offer: ['Rédiger une offre simple de service ou de produit', 'Rédiger une partie d’une offre simple', 'Trois points qui décrivent ce que tu proposes'], content: ['Créer un contenu utile', 'Travailler sur un contenu utile', 'Un brouillon enregistré'], contact: ['Contacter des clients potentiels', 'Écrire à un client potentiel', 'Un message rédigé ou envoyé'], cdeliver: ['Terminer un livrable client', 'Faire avancer un livrable client', 'Une partie définie terminée'] },
      fitness: { routine: ['Créer une routine de mouvement tenable', 'Bouger d’une façon qui te semble tenable', 'Une courte séance de mouvement de ton choix, à effort facile'], run: ['Suivre mon programme de course actuel', 'Faire la séance du jour de ton programme de course', 'La séance prévue faite, ou notée avec ses changements'], strength: ['Suivre mon programme de renforcement actuel', 'Faire la séance du jour de ton programme de renforcement', 'La séance prévue faite, ou notée avec ses changements'], mobility: ['Prendre du temps pour la mobilité ou la récupération', 'Prendre du temps pour la mobilité ou la récupération', 'Quelques minutes de mobilité ou de repos'] },
      food: { mealplan: ['Planifier les repas de la semaine à venir', 'Planifier quelques repas de la semaine', 'Au moins trois repas notés'], grocery: ['Préparer une liste de courses', 'Compléter ta liste de courses', 'La liste couvre tes prochains repas'], cook: ['Cuisiner plus souvent à la maison', 'Préparer un repas simple à la maison', 'Un repas, ou une partie, préparé à la maison'], regular: ['Prendre le temps de manger régulièrement', 'Prendre le temps pour un repas', 'Un repas pris à l’heure prévue'] },
      sleep: { bedtime: ['Créer une routine du coucher', 'Commencer ta routine du coucher', 'La première étape de la routine faite à l’heure prévue'], wake: ['Me lever à des heures plus régulières', 'Te lever à l’heure choisie', 'Debout près de l’heure choisie'], breaks: ['Prévoir des pauses dans la journée', 'Prendre une pause prévue', 'Une pause prise loin de tes tâches'], rest: ['Protéger du temps pour me reposer', 'Protéger un moment de repos', 'Ce moment de repos gardé libre'] },
      emotional: { checkin: ['Faire un court point quotidien', 'Faire un court point avec toi-même', 'Quelques mots écrits sur ce que tu ressens'], enjoy: ['Prendre du temps pour une activité que j’aime', 'Prendre du temps pour quelque chose que tu aimes', 'Un peu de temps passé dessus, peu importe la durée'], calm: ['Pratiquer une routine apaisante que je connais déjà', 'Pratiquer une routine apaisante que tu connais', 'La routine faite une fois'], support: ['Demander du soutien', 'Demander du soutien à quelqu’un', 'Un message envoyé ou un appel passé'] },
      relationships: { reconnect: ['Reprendre contact avec quelqu’un', 'Reprendre contact avec quelqu’un', 'Un message envoyé ou un appel passé'], quality: ['Prévoir du temps de qualité avec quelqu’un', 'Prévoir du temps de qualité avec quelqu’un', 'Un moment proposé ou convenu'], group: ['Participer à une activité de groupe ou de quartier', 'Chercher une activité de groupe ou de quartier', 'Une activité trouvée ou suivie'], talk: ['Prendre le temps d’une conversation que je repousse', 'Préparer une conversation repoussée', 'Ton idée principale notée, ou la conversation commencée'] },
      home: { clutter: ['Désencombrer un espace en désordre', 'Désencombrer une partie d’un espace', 'Une surface ou une partie dégagée'], drawer: ['Ranger un tiroir, une étagère ou un petit espace', 'Ranger un tiroir, une étagère ou un petit espace', 'Cet espace rangé'], tidy: ['Créer une courte routine de rangement', 'Faire un petit rangement', 'Le temps prévu passé à ranger'], chore: ['Terminer une tâche ménagère', 'Terminer une tâche ménagère', 'La tâche faite'] },
      learning: { lesson: ['Terminer une leçon ou une partie de cours', 'Terminer une partie de leçon ou de cours', 'Une partie terminée'], study: ['Créer une routine d’étude', 'Étudier à l’heure prévue', 'La séance d’étude faite'], read: ['Lire régulièrement', 'Lire quelques minutes', 'Le temps prévu passé à lire'], practice: ['Pratiquer une compétence précise', 'Pratiquer une compétence précise', 'Une série de pratique faite'] },
      creativity: { start: ['Commencer un petit projet créatif', 'Commencer un petit projet créatif', 'Quelque chose de commencé : un croquis, une note ou une première étape'], continue: ['Reprendre un projet inachevé', 'Reprendre ton projet inachevé', 'N’importe quel progrès. Inachevé, c’est très bien'], hobby: ['Pratiquer un loisir régulièrement', 'Pratiquer ton loisir', 'Le temps de pratique fait'], fun: ['Créer quelque chose juste pour le plaisir', 'Créer quelque chose juste pour le plaisir', 'N’importe quoi de créé'] },
      organization: { week: ['Planifier ma semaine', 'Planifier ta semaine', 'Les tâches clés de la semaine notées'], dates: ['Organiser rendez-vous et échéances', 'Organiser rendez-vous et échéances', 'Les prochaines dates réunies au même endroit'], paperwork: ['Terminer des démarches en attente', 'Avancer sur des démarches en attente', 'Une démarche faite ou avancée'], routine: ['Créer une routine quotidienne simple', 'Faire ta routine quotidienne simple', 'Les étapes de la routine faites'] },
      meaning: { reflect: ['Prendre du temps pour réfléchir', 'Prendre du temps pour réfléchir', 'Quelques minutes de réflexion au calme'], pray: ['Pratiquer la prière ou la méditation', 'Pratiquer la prière ou la méditation', 'La pratique faite'], read: ['Lire quelque chose lié à mes valeurs', 'Lire quelque chose lié à tes valeurs', 'Quelques pages ou un passage lu'], community: ['Participer à une activité de groupe qui a du sens', 'Chercher une activité de groupe qui a du sens', 'Une activité trouvée ou rejointe'] },
      fun: { outing: ['Prévoir une sortie abordable', 'Prévoir une sortie abordable', 'Un lieu et un jour choisis'], new: ['Essayer une nouvelle activité', 'Essayer une nouvelle activité', 'Une nouveauté essayée ou réservée'], pastime: ['Prendre du temps pour un passe-temps favori', 'Prendre du temps pour un passe-temps favori', 'Un peu de temps passé dessus'], explore: ['Explorer un endroit proche', 'Explorer un endroit proche', 'Un endroit proche visité ou choisi'] }
    },
    minTitle: 'Deux minutes sur la même étape',
    rv: { time: 'Temps par jour', title: 'Ton plan de départ', sub: 'Relis-le. Rien n’est programmé avant que tu commences.', main: 'Objectif principal', result: 'Résultat', secondary: 'Objectifs secondaires', none: 'Aucun', actions: 'Actions proposées', days: 'Jours', window: 'Créneau', checkin: 'Bilan', remindOn: 'Rappel activé, quand l’app est ouverte', remindOff: 'Pas de rappel', ready: 'Quand tu es prêt ou prête', edit: 'Modifier', remove: 'Retirer', addBack: 'Remettre', add: 'Ajouter', replace: 'Remplacer', tentative: 'Action proposée pour commencer. Remplace-la si elle ne convient pas.', removed: 'Retirée', secOptional: 'Facultative, une fois par semaine quand il y a de la place', secNoRoom: 'Il ne reste pas de temps quotidien pour des actions secondaires. Elles peuvent attendre.', why: 'Pourquoi ce plan', total: 'Prévu lors d’une journée complète : {0} sur {1}', totalVaries: 'Prévu lors d’une journée complète : {0}. Tu choisiras ton temps chaque jour.', over: 'C’est plus que le temps indiqué. Retire ou raccourcis une action.', moreQ: 'Combien de minutes as-tu lors d’une journée complète ?', moreHint: 'Plus de 60', daysVaries: 'Jours proposés. Tu peux les changer chaque semaine.', fitnessRest: 'Les jours de mouvement sont espacés pour laisser le temps de récupérer.', spendNote: 'Environ 2 minutes, chaque jour', start: 'Commencer ma première journée', min: '{0} min', doneWhen: 'Fini quand : {0}', pickReplace: 'Choisis une autre action', noActions: 'Ton plan n’a pas encore d’action. Remets-en une pour commencer.', mainAction: 'Action principale', emptyDays: 'Choisis au moins un jour.', link: 'Rassemble les détails dans ce domaine une fois commencé.' },
    whyReason: { putoff: 'Tu veux commencer quelque chose que tu repousses, donc la première action est courte et facile à lancer.', started: 'Tu veux aller au bout de quelque chose de commencé, donc l’action le fait avancer.', routine: 'Tu veux une routine régulière, donc l’action revient les mêmes jours.', priorities: 'Tu jongles avec plusieurs priorités, donc un objectif principal passe en premier et le reste reste facultatif.', return: 'Tu reviens après une pause, donc le plan commence petit. Tu ne dois rien rattraper.', track: 'Ta routine marche déjà, donc le plan la note et t’aide à voir tes progrès.' },
    whyObstacle: { nextstep: 'Tu as dit que la prochaine étape est souvent floue, donc chaque action a une fin visible.', toobig: 'Les tâches grosses ou floues te freinent, donc l’action est courte avec une fin claire.', overcommit: 'Tu t’engages souvent à plus que ton temps ne permet, donc le plan reste dans ton temps quotidien.', schedule: 'Ton emploi du temps change, donc chaque action a une version de 2 minutes pour les jours chargés.', forget: 'Tu oublies facilement, donc l’action est liée à ton créneau préféré.', motivation: 'La motivation va et vient, donc l’action est assez petite pour un jour sans.', worry: 'Tu as peur de mal faire, donc une version imparfaite compte comme faite.', energy: 'Ton énergie est limitée, donc il y a une version de 2 minutes pour les jours de fatigue.', resources: 'Les ressources sont limitées, donc l’action ne demande rien à acheter.', none: 'Tu veux un système plus clair, donc le plan, c’est un objectif, des jours fixes et un bilan.' },
    whyHelp: { small: 'Les petites tâches avec une fin claire t’ont aidé, donc chaque action est écrite ainsi.', scheduled: 'Un horaire prévu t’a aidé, donc le plan utilise tes jours et ton créneau.', reminder: 'Les rappels t’ont aidé. Tu peux activer celui du bilan à la question 10.', progress: 'Voir tes progrès t’a aidé. L’onglet Progrès et ton compagnon grandissent au fil de tes notes.', encouragement: 'Les points réguliers t’ont aidé, donc chaque journée se termine par un court bilan du soir.', flexible: 'La souplesse t’a aidé, donc chaque action peut être réduite ou déplacée sans rien perdre.', enjoyable: 'Le plaisir t’a aidé, donc choisis la version de l’action que tu préfères.', unsure: 'Tu découvres encore ce qui t’aide. La première semaine sert à le remarquer.' },
    fitness: 'One Day ne crée pas de programmes d’entraînement. Suis ton propre programme ou les conseils d’un professionnel.'
  }
};
const OQL = () => OQ[lang()] || OQ.en;
const oqf = (s, ...a) => String(s).replace(/\{(\d+)\}/g, (_, n) => a[Number(n)]);
const focusLabel = (f) => (OQL().focus[f] || OQ.en.focus[f] || f);
function resultInfo(focus, key, l) { const R = (OQ[l || lang()] || OQ.en).res[focus] || {}; return R[key] || (OQ.en.res[focus] || {})[key] || null; }

/* ----- Answers ----- */
const ONB_Q_FIRST = 2, ONB_Q_LAST = 11, ONB_REVIEW = 12;
function onbAns() {
  const s = S.settings;
  if (!s.onb || typeof s.onb !== 'object') s.onb = {};
  const a = s.onb;
  for (const k of ['obstacles', 'helps', 'secondary']) if (!Array.isArray(a[k])) a[k] = [];
  return a;
}
function qValid(n) {
  const a = onbAns();
  switch (n) {
    case 1: return OQ_OPTS.reason.includes(a.reason);
    case 2: return a.obstacles.length >= 1 && a.obstacles.length <= 2;
    case 3: return a.helps.length >= 1 && a.helps.length <= 2;
    case 4: return FOCI.includes(a.focus);
    case 5: return !!a.focus && (a.result === 'help' || (FOCUS_RESULTS[a.focus] || []).includes(a.result));
    case 6: return a.secMode === 'keep' || (a.secMode === 'add' && a.secondary.length >= 1 && a.secondary.length <= 2 && !a.secondary.includes(a.focus));
    case 7: return OQ_OPTS.time.includes(a.time);
    case 8: return a.daysMode === 'varies' || (Array.isArray(a.days) && a.days.length >= 1);
    case 9: return OQ_OPTS.window.includes(a.window);
    case 10: return OQ_OPTS.checkin.includes(a.checkin) && (a.checkin !== 'custom' || /^\d\d:\d\d$/.test(a.checkinCustom || ''));
  }
  return false;
}
/* Keep answers consistent: a result belongs to its focus; the main focus is never also secondary */
function onbTidy() {
  const a = onbAns();
  if (a.result && a.result !== 'help' && !(FOCUS_RESULTS[a.focus] || []).includes(a.result)) a.result = null;
  a.secondary = a.secondary.filter((f) => FOCI.includes(f) && f !== a.focus).slice(0, 2);
  a.obstacles = a.obstacles.filter((x) => OQ_OPTS.obstacles.includes(x)).slice(0, 2);
  a.helps = a.helps.filter((x) => OQ_OPTS.helps.includes(x)).slice(0, 2);
}

/* ----- Rendering ----- */
let OQ_ERR = '';
function oqChoice(q, v, label, on, multi) {
  return `<button type="button" class="chip oq-opt" data-act="oqPick" data-q="${q}" data-v="${esc(v)}" ${multi ? `role="checkbox" aria-checked="${on}"` : `role="radio" aria-checked="${on}"`} aria-pressed="${on}">${esc(label)}</button>`;
}
function oqGroup(q, opts, sel, multi, labelId) {
  return `<div class="chips oq-list" role="${multi ? 'group' : 'radiogroup'}" aria-labelledby="${labelId}">${opts.map(([v, l]) => oqChoice(q, v, l, multi ? sel.includes(v) : sel === v, multi)).join('')}</div>`;
}
function dayOrder() { return [1, 2, 3, 4, 5, 6, 0]; }
function dayName(d, style) { return new Intl.DateTimeFormat(locale(), { weekday: style || 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2024, 0, 7 + d))); }
function renderQuestion(n) {
  const a = onbAns(); const L = OQL(); const q = n; let body = '';
  const kind = (k) => `<p class="oq-kind small muted" id="oqKind">${esc(L[k])}</p>`;
  const H = (txt, sub) => `<h1 class="h2" id="oqH">${esc(txt)}</h1>${sub ? `<p class="small muted">${esc(sub)}</p>` : ''}`;
  if (q === 1) body = H(L.q1) + kind('one') + oqGroup('reason', OQ_OPTS.reason.map((k) => [k, L.reason[k]]), a.reason, false, 'oqH');
  if (q === 2) body = H(L.q2) + kind('upTo2') + oqGroup('obstacles', OQ_OPTS.obstacles.map((k) => [k, L.obstacles[k]]), a.obstacles, true, 'oqH') + `<p class="tiny muted">${esc(oqf(L.exclusiveNote, L.obstacles.none))}</p>`;
  if (q === 3) body = H(L.q3) + kind('upTo2') + oqGroup('helps', OQ_OPTS.helps.map((k) => [k, L.helps[k]]), a.helps, true, 'oqH') + `<p class="tiny muted">${esc(oqf(L.exclusiveNote, L.helps.unsure))}</p>`;
  if (q === 4) body = H(L.q4, L.q4sub) + kind('exactlyOne') + oqGroup('focus', FOCI.map((k) => [k, L.focus[k]]), a.focus, false, 'oqH');
  if (q === 5) {
    const opts = (FOCUS_RESULTS[a.focus] || []).map((k) => [k, resultInfo(a.focus, k)[0]]).concat([['help', L.help]]);
    body = H(L.q5, a.focus ? oqf(L.q5for, L.focus[a.focus]) : '') + kind('one') + oqGroup('result', opts, a.result, false, 'oqH');
  }
  if (q === 6) {
    body = H(L.q6) + kind('one') + oqGroup('secMode', [['keep', L.q6keep], ['add', L.q6add]], a.secMode, false, 'oqH') + `<p class="small">${esc(L.q6note)}</p>`;
    if (a.secMode === 'add') body += `<div class="stack-s oq-sub"><div class="h3" id="oqSecH">${esc(L.q6pick)}</div><p class="oq-kind small muted">${esc(L.upTo2)}</p>${oqGroup('secondary', FOCI.filter((f) => f !== a.focus).map((k) => [k, L.focus[k]]), a.secondary, true, 'oqSecH')}</div>`;
  }
  if (q === 7) body = H(L.q7) + kind('one') + oqGroup('time', OQ_OPTS.time.map((k) => [k, L.time[k]]), a.time, false, 'oqH') + `<p class="small">${esc(L.q7note)}</p>${a.time === 'more' ? `<p class="small muted">${esc(L.q7more)}</p>` : ''}`;
  if (q === 8) {
    const sel = a.daysMode === 'varies' ? ['varies'] : (a.days || []);
    body = H(L.q8) + kind('oneOrMore') + `<div><button type="button" class="btn ghost sm" data-act="oqAllDays">${esc(L.allDays)}</button></div>`
      + oqGroup('days', dayOrder().map((d) => [String(d), dayName(d)]).concat([['varies', L.daysVaries]]), sel.map(String), true, 'oqH') + `<p class="small">${esc(L.q8note)}</p>`;
  }
  if (q === 9) body = H(L.q9) + kind('one') + oqGroup('window', OQ_OPTS.window.map((k) => [k, L.window[k]]), a.window, false, 'oqH') + `<p class="small muted">${esc(oqf(L.q9note, tzLabel(S.settings.timezone)))}</p>`;
  if (q === 10) {
    const opts = OQ_OPTS.checkin.map((k) => [k, k === 'custom' ? L.ciCustom : k === 'ready' ? L.ciReady : fmtTime(k)]);
    body = H(L.q10) + kind('one') + oqGroup('checkin', opts, a.checkin, false, 'oqH');
    if (a.checkin === 'custom') body += `<label class="f">${esc(L.ciTime)}<input class="inp" id="oqCiTime" type="time" value="${esc(a.checkinCustom || '')}"></label>`;
    if (a.checkin && a.checkin !== 'ready') body += `<label class="row oq-remind"><input type="checkbox" id="oqRemind" data-act="oqRemind" ${a.remind ? 'checked' : ''}> ${esc(L.remind)}</label>${a.remind ? `<p class="small muted" role="note">${esc(L.remindNote)}</p>` : ''}`;
  }
  return `<main class="wrap" lang="${lang()}">${onbTop()}<div class="onb">
    <p class="eyebrow oq-count">${esc(oqf(L.qOf, q))}</p>
    <div class="steps" aria-hidden="true">${Array.from({ length: 10 }, (_, i) => `<span class="${i < q ? 'on' : ''}"></span>`).join('')}</div>
    <div class="stack">${body}</div>
    <div id="oqErr" class="field-err" role="alert">${OQ_ERR ? esc(OQ_ERR) : ''}</div>
    <div class="btn-row"><button class="btn" data-act="oqBack">${esc(L.back)}</button><button class="btn primary" data-act="oqNext">${esc(L.cont)}</button></div>
  </div></main>`;
}
function onbGo(step) {
  ONB.step = step; S.settings.onbStep = step; OQ_ERR = ''; save(); render(); window.scrollTo(0, 0);
  const h = $('#oqH') || $('#rvH'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
}
function oqRerender() { const y = window.scrollY; render(); window.scrollTo(0, y); }
A.oqPick = (el) => {
  const a = onbAns(); const q = el.dataset.q; const v = el.dataset.v;
  if (q === 'obstacles' || q === 'helps') {
    const ex = OQ_EXCLUSIVE[q]; let cur = a[q];
    if (cur.includes(v)) cur = cur.filter((x) => x !== v);
    else if (v === ex) cur = [v];
    else { cur = cur.filter((x) => x !== ex); if (cur.length >= 2) { OQ_ERR = OQL().upTo2 + '.'; oqRerender(); return; } cur.push(v); }
    a[q] = cur;
  } else if (q === 'secondary') {
    let cur = a.secondary;
    if (cur.includes(v)) cur = cur.filter((x) => x !== v);
    else { if (cur.length >= 2) { OQ_ERR = OQL().q6pick + '.'; oqRerender(); return; } cur.push(v); }
    a.secondary = cur;
  } else if (q === 'days') {
    if (v === 'varies') { a.daysMode = a.daysMode === 'varies' ? null : 'varies'; if (a.daysMode) a.days = []; }
    else { const d = Number(v); a.daysMode = null; a.days = (a.days || []).includes(d) ? a.days.filter((x) => x !== d) : (a.days || []).concat(d); }
  } else if (q === 'focus') {
    if (a.focus !== v) { a.focus = v; onbTidy(); }
  } else if (q === 'secMode') {
    a.secMode = v; if (v === 'keep') a.secondary = [];
  } else if (q === 'checkin') {
    a.checkin = v; if (v === 'ready') a.remind = false;
  } else a[q] = v;
  a.planFor = null; OQ_ERR = ''; save(); oqRerender();
  if (q === 'checkin' && v === 'custom') { const t = $('#oqCiTime'); if (t) t.focus(); }
};
A.oqAllDays = () => { const a = onbAns(); a.daysMode = null; a.days = dayOrder().slice(); a.planFor = null; OQ_ERR = ''; save(); oqRerender(); };
A.oqRemind = (el) => { const a = onbAns(); a.remind = !!el.checked; save(); oqRerender(); };
document.addEventListener('change', (e) => {
  if (e.target && e.target.id === 'oqCiTime') { const a = onbAns(); a.checkinCustom = e.target.value; a.planFor = null; save(); }
  if (e.target && e.target.id === 'rvMore') { const a = onbAns(); const n = Math.round(Number(e.target.value)); a.moreMinutes = n > 60 && n <= 960 ? n : null; a.planFor = null; save(); setTimeout(oqRerender, 0); }
});
A.oqBack = () => {
  const n = ONB.step - 1;
  if (n <= 1) { onbGo(1); return; }
  onbGo(ONB.step - 1);
};
A.oqNext = () => {
  const n = ONB.step - 1; const L = OQL(); const a = onbAns();
  if (n === 10) { const t = $('#oqCiTime'); if (t) a.checkinCustom = t.value; }
  if (!qValid(n)) {
    OQ_ERR = n === 6 && a.secMode === 'add' ? L.err.sec : n === 10 && a.checkin === 'custom' ? L.err.time : n === 8 ? (L.rv.emptyDays) : L.err.need;
    oqRerender(); const e = $('#oqErr'); if (e) e.scrollIntoView({ block: 'nearest' }); return;
  }
  // Editing from the review goes back there once every answer is still valid
  if (ONB.fromReview && firstInvalid() > 10) { ONB.fromReview = false; onbGo(ONB_REVIEW); return; }
  if (ONB.fromReview) { onbGo(firstInvalid() + 1); return; }
  onbGo(n === 10 ? ONB_REVIEW : ONB.step + 1);
};
function firstInvalid() { for (let i = 1; i <= 10; i++) if (!qValid(i)) return i; return 11; }

/* ----- The starting plan ----- */
const SHORT_OBSTACLES = ['nextstep', 'toobig', 'overcommit', 'motivation', 'energy', 'worry'];
function planBudget() {
  const a = onbAns();
  if (a.time === 'varies') return null;
  if (a.time === 'more') return a.moreMinutes || null;
  return Number(a.time);
}
function planDays() {
  const a = onbAns();
  return a.daysMode === 'varies' ? [1, 3, 5] : (a.days || []).slice().sort((x, y) => dayOrder().indexOf(x) - dayOrder().indexOf(y));
}
/* Movement days never fall back to back, and at most four a week */
function spacedDays(days) {
  const out = [];
  for (const d of dayOrder()) if (days.includes(d) && !out.includes((d + 6) % 7) && out.length < 4) out.push(d);
  if (out.length > 1 && out.includes(0) && out.includes(1)) out.splice(out.indexOf(0), 1);
  return out;
}
function actionFor(focus, key, minutes, days, extra) {
  const r = resultInfo(focus, key);
  return Object.assign({ id: uid('pa'), focus, result: key, title: r[1], finish: r[2], minutes, days: days.slice(), accepted: true }, extra || {});
}
function buildPlan() {
  const a = onbAns();
  const budget = planBudget(); const size = budget || 10;
  const short = a.reason === 'putoff' || a.reason === 'return' || a.helps.includes('small') || a.obstacles.some((o) => SHORT_OBSTACLES.includes(o));
  let main = Math.min(size, short ? 10 : 30);
  if (a.obstacles.includes('overcommit') && budget) main = Math.min(main, Math.max(5, Math.floor(budget * 0.8 / 5) * 5));
  const tentative = a.result === 'help';
  const key = tentative ? FOCUS_RESULTS[a.focus][0] : a.result;
  let days = planDays();
  if (a.focus === 'fitness') days = spacedDays(days);
  const actions = [];
  if (a.focus === 'money' && key === 'spend') actions.push(actionFor('money', 'spend', 2, [0, 1, 2, 3, 4, 5, 6], { spend: true, tentative }));
  else actions.push(actionFor(a.focus, key, main, days, { tentative }));
  // Secondary focuses: a smaller, optional weekly action, offered only when there's room
  const room = budget ? budget - actions[0].minutes : (size - actions[0].minutes);
  if (a.secMode === 'add' && room >= 5) {
    const each = Math.max(5, Math.min(10, Math.floor(room / a.secondary.length / 5) * 5));
    a.secondary.forEach((f, i) => {
      const k = FOCUS_RESULTS[f][f === 'money' ? 1 : 0];  // a weekly secondary never takes the daily spending record
      const d = planDays(); const day = d.length ? d[(i + 1) % d.length] : 6;
      actions.push(actionFor(f, k, each, [day], { secondary: true, accepted: false, tentative: true, spend: f === 'money' && k === 'spend' ? false : undefined }));
    });
  }
  return { actions, sig: planSig() };
}
function planSig() { const a = onbAns(); return JSON.stringify([a.reason, a.obstacles, a.helps, a.focus, a.result, a.secMode, a.secondary, a.time, a.moreMinutes, a.days, a.daysMode, a.window]); }
function onbPlan() {
  const a = onbAns();
  if (!a.plan || a.plan.sig !== planSig()) { a.plan = buildPlan(); save(); }
  return a.plan;
}
/* Minutes on the fullest planned day, counting only accepted actions */
function planPeak(plan) {
  let peak = 0;
  for (let d = 0; d < 7; d++) peak = Math.max(peak, plan.actions.filter((x) => x.accepted && x.days.includes(d)).reduce((s, x) => s + x.minutes, 0));
  return peak;
}
function rvRow(label, value, editQ) {
  const L = OQL();
  return `<div class="rv-row"><div class="grow"><div class="tiny muted">${esc(label)}</div><div>${value}</div></div>${editQ ? `<button class="btn ghost sm" data-act="rvEdit" data-q="${editQ}" aria-label="${esc(L.rv.edit + ': ' + label)}">${esc(L.rv.edit)}</button>` : ''}</div>`;
}
function renderReview() {
  const a = onbAns(); const L = OQL(); const R = L.rv; const plan = onbPlan();
  const budget = planBudget(); const peak = planPeak(plan);
  const dayList = (ds) => ds.length === 7 ? dayOrder().map((d) => dayName(d, 'short')).join(' · ') : ds.map((d) => dayName(d, 'short')).join(' · ');
  const minsTxt = (m) => oqf(R.min, m);
  const why = [L.whyReason[a.reason]].concat(a.obstacles.map((o) => L.whyObstacle[o]), a.helps.map((h) => L.whyHelp[h])).filter(Boolean);
  if (a.focus === 'fitness' || a.secondary.includes('fitness')) why.push(L.fitness);
  const act = (x, i) => {
    const repl = SH.rvReplace === x.id;
    const others = (FOCUS_RESULTS[x.focus] || []).filter((k) => k !== x.result);
    return `<article class="card rv-act ${x.accepted ? '' : 'off'}" data-id="${x.id}">
      <div class="tiny muted">${esc(x.secondary ? focusLabel(x.focus) + ' · ' + R.secOptional : R.mainAction)}</div>
      <div class="h3">${esc(x.title)}</div>
      <div class="small">${esc(oqf(R.doneWhen, x.finish))}</div>
      <div class="small muted">${x.spend ? esc(R.spendNote) : esc(minsTxt(x.minutes) + ' · ' + dayList(x.days))}</div>
      ${x.tentative && x.accepted ? `<p class="tiny muted">${esc(R.tentative)}</p>` : ''}
      <div class="btn-row">${x.accepted ? `<button class="btn ghost sm" data-act="rvToggle" data-id="${x.id}">${esc(R.remove)}</button>` : `<button class="btn sm" data-act="rvToggle" data-id="${x.id}">${esc(x.secondary && !x.touched ? R.add : R.addBack)}</button>`}
      ${others.length ? `<button class="btn ghost sm" data-act="rvReplace" data-id="${x.id}" aria-expanded="${repl}">${esc(R.replace)}</button>` : ''}</div>
      ${repl ? `<div class="stack-s"><div class="tiny muted">${esc(R.pickReplace)}</div><div class="chips">${others.map((k) => `<button type="button" class="chip" data-act="rvSwap" data-id="${x.id}" data-k="${k}">${esc(resultInfo(x.focus, k)[1])}</button>`).join('')}</div></div>` : ''}
    </article>`;
  };
  const main = plan.actions.filter((x) => !x.secondary); const sec = plan.actions.filter((x) => x.secondary);
  const secTxt = a.secMode === 'add' && a.secondary.length ? a.secondary.map(focusLabel).join(', ') : R.none;
  const ci = a.checkin === 'ready' ? R.ready : fmtTime(a.checkin === 'custom' ? a.checkinCustom : a.checkin);
  const over = budget && peak > budget;
  const days = planDays();
  const totalLine = budget ? oqf(R.total, minsTxt(peak), minsTxt(budget)) : a.time === 'more' ? '' : oqf(R.totalVaries, minsTxt(peak));
  return `<main class="wrap" lang="${lang()}">${onbTop()}<div class="onb stack rv">
    <h1 class="h2" id="rvH">${esc(R.title)}</h1><p class="small muted">${esc(R.sub)}</p>
    <section class="card stack-s">
      ${rvRow(R.main, esc(focusLabel(a.focus)), 4)}
      ${rvRow(R.result, esc(a.result === 'help' ? L.help : resultInfo(a.focus, a.result)[0]), 5)}
      ${rvRow(R.secondary, esc(secTxt), 6)}
      ${rvRow(R.time, esc(a.time === 'more' && a.moreMinutes ? minsTxt(a.moreMinutes) : L.time[a.time]), 7)}
    </section>
    ${a.time === 'more' ? `<label class="f">${esc(R.moreQ)}<input class="inp num" id="rvMore" type="number" min="61" max="960" inputmode="numeric" placeholder="${esc(R.moreHint)}" value="${esc(a.moreMinutes || '')}"></label>` : ''}
    <section class="stack-s"><div class="h3">${esc(R.actions)}</div>
      ${main.map(act).join('')}
      ${a.secMode === 'add' ? (sec.length ? sec.map(act).join('') : `<p class="small muted">${esc(R.secNoRoom)}</p>`) : ''}
      ${totalLine ? `<p class="small ${over ? 'field-err' : ''}" id="rvTotal">${esc(totalLine)}</p>` : ''}${over ? `<p class="field-err" role="alert">${esc(R.over)}</p>` : ''}
    </section>
    <section class="card stack-s">
      ${rvRow(R.days, esc(dayList(days)) + (a.daysMode === 'varies' ? `<div class="tiny muted">${esc(R.daysVaries)}</div>` : '') + (a.focus === 'fitness' ? `<div class="tiny muted">${esc(R.fitnessRest)}</div>` : ''), 8)}
      ${rvRow(R.window, esc(L.window[a.window]), 9)}
      ${rvRow(R.checkin, esc(ci) + `<div class="tiny muted">${esc(a.remind ? R.remindOn : R.remindOff)}</div>`, 10)}
    </section>
    <details class="more"><summary>${esc(R.why)}</summary><ul class="small">${why.map((w) => `<li>${esc(w)}</li>`).join('')}</ul></details>
    <div id="oqErr" class="field-err" role="alert">${OQ_ERR ? esc(OQ_ERR) : ''}</div>
    <div class="btn-row"><button class="btn" data-act="oqBack">${esc(L.back)}</button><button class="btn primary" data-act="rvStart">${esc(R.start)}</button></div>
  </div></main>`;
}
A.rvEdit = (el) => { ONB.fromReview = true; SH.rvReplace = null; onbGo(Number(el.dataset.q) + 1); };
A.rvToggle = (el) => { const p = onbPlan(); const x = p.actions.find((y) => y.id === el.dataset.id); if (!x) return; x.accepted = !x.accepted; x.touched = true; OQ_ERR = ''; save(); oqRerender(); };
A.rvReplace = (el) => { SH.rvReplace = SH.rvReplace === el.dataset.id ? null : el.dataset.id; oqRerender(); };
A.rvSwap = (el) => {
  const p = onbPlan(); const x = p.actions.find((y) => y.id === el.dataset.id); if (!x) return;
  const k = el.dataset.k; const r = resultInfo(x.focus, k);
  const wasSpend = !!x.spend;
  Object.assign(x, { result: k, title: r[1], finish: r[2], tentative: false, accepted: true, touched: true, spend: x.focus === 'money' && k === 'spend' && !x.secondary });
  if (x.spend) { x.minutes = 2; x.days = [0, 1, 2, 3, 4, 5, 6]; }
  else if (wasSpend) { const b = planBudget() || 10; x.minutes = Math.min(b, 10); x.days = planDays(); }
  if (!x.secondary && onbAns().result !== 'help') onbAns().result = k;
  p.sig = planSig(); SH.rvReplace = null; save(); oqRerender();
};
A.rvStart = () => {
  const a = onbAns(); const L = OQL(); const p = onbPlan(); const fi = firstInvalid();
  if (fi <= 10) { ONB.fromReview = true; onbGo(fi + 1); return; }
  if (a.time === 'more' && !a.moreMinutes) { OQ_ERR = L.err.more; oqRerender(); const m = $('#rvMore'); if (m) m.focus(); return; }
  const budget = planBudget();
  if (!p.actions.some((x) => x.accepted)) { OQ_ERR = L.rv.noActions; oqRerender(); return; }
  if (budget && planPeak(p) > budget) { OQ_ERR = L.rv.over; oqRerender(); return; }
  finishOnboarding();
};
function finishOnboarding() {
  const a = onbAns(); const p = onbPlan(); const s = S.settings; const td = today();
  const budget = planBudget();
  const days = a.daysMode === 'varies' ? [0, 1, 2, 3, 4, 5, 6] : (a.days || []);
  for (let d = 0; d < 7; d++) s.availability[d] = budget && days.includes(d) ? budget : null;
  s.foci = [a.focus].concat(a.secMode === 'add' ? a.secondary : []);
  s.focusKey = a.focus; s.focus = focusArea(a.focus);
  s.preferredWindow = a.window;
  s.trackSpend = p.actions.some((x) => x.spend && x.accepted);
  s.checkinAnytime = a.checkin === 'ready';
  s.checkinTime = a.checkin === 'ready' ? '21:00' : a.checkin === 'custom' ? a.checkinCustom : a.checkin;
  s.reminders = !!a.remind && a.checkin !== 'ready';
  s.onbVersion = 2;
  const cue = a.window && a.window !== 'varies' ? OQL().window[a.window] : '';
  for (const x of p.actions) {
    if (!x.accepted || x.spend) continue;
    const task = { id: uid('task'), area: focusArea(x.focus), focus: x.focus, fromOnboarding: true, createdAt: nowISO(), versions: [] };
    pushVersion(task, { title: x.title, finish: x.finish, minutes: x.minutes, minTitle: OQL().minTitle, minMinutes: 2, days: x.days, date: null, cue }, td);
    S.tasks.push(task);
  }
  s.areasConfirmed = true; s.onboarded = true; s.calibrationStart = td; s.lastOpened = td;
  S.weeks[weekStart(td)] = { main: s.focus, focus: a.focus, mainOutcome: a.result && a.result !== 'help' ? resultInfo(a.focus, a.result)[0] : '', maintain: [], confirmedAt: nowISO() };
  ONB.fromReview = false; SH.rvReplace = null;
  save(); TAB = 'today'; render(); window.scrollTo(0, 0);
}
