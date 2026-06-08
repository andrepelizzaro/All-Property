async function testBot() {
  const token = '8614400194:AAH4z7cozLrsJG5bkN7y0rHpBvezfABixMg';
  const url = `https://api.telegram.org/bot${token}/getMe`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}
testBot();
