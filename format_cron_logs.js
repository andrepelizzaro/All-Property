async function formatLogs() {
  const url = 'https://vsryecclsiglogyltyrl.supabase.co/functions/v1/run-sql';
  try {
    const res = await fetch(url, { method: 'POST' });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}
formatLogs();
