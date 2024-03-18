import figlet from 'figlet';

export default function (msg, opts) {
  console.info('');
  try {
    console.info(figlet.textSync(msg, opts));
  }
  catch (e) {
    console.info(msg);
  }
  console.info('');
}
