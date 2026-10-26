// GET /calendar.ics?lang=es|en|nl  ->  a real calendar file (rewritten to /api/calendar in vercel.json)
const SITE = 'https://wedding-site-alpha-ashen.vercel.app';
const TEXT = {
  es: ['Boda de Xanne y Guillo', 'Nuestra boda en Valencia, España. Más información en ' + SITE],
  en: ["Xanne & Guillo's wedding", 'Our wedding in Valencia, Spain. More info at ' + SITE],
  nl: ['Bruiloft van Xanne & Guillo', 'Onze bruiloft in Valencia, Spanje. Meer info op ' + SITE]
};
const esc = x => String(x).replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

module.exports = (req, res) => {
  const lang = TEXT[String((req.query && req.query.lang) || '')] ? req.query.lang : 'es';
  const [title, details] = TEXT[lang];
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Xanne and Guillo//Wedding//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT', 'UID:wedding-20270910@xanne-guillo', 'DTSTAMP:20261025T000000Z',
    'DTSTART;VALUE=DATE:20270910', 'DTEND;VALUE=DATE:20270911',
    'SUMMARY:' + esc(title), 'LOCATION:' + esc('Mas Les Lloses, Valencia, España'), 'DESCRIPTION:' + esc(details),
    'END:VEVENT', 'END:VCALENDAR'].join('\r\n') + '\r\n';
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'inline; filename="xanne-guillo-wedding.ics"');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.status(200).send(ics);
};
