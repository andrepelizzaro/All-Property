

const APP_ID = '727538613777787';
const APP_SECRET = '214446e1604b87776f49d55d7d9a7ec6';
const PAGE_ID = '703707476167842';
const SHORT_LIVED_USER_TOKEN = 'EAAKVsUiidXsBRn3pePTuOmwyIgBpANmobvAZCZAbDy4CDjfZBZACyLvfYfxajnbjuZANxTFCvqQnf39HWDLY3r2CABVcdGRpI8EpcRLJTPUCxei34uMfEoYEEhndrXCtAx8ncrl3pi6eAkYv1vFBCLNFnIR6td4LvQeKvhsdfgz8tcPFx38ZCUtVuoHz6OgTPxiG7MtOUxYp0ZBC3y3P8yctLpnq6Bmm0EYzVttXvDPOOIB8qEWLe2AljFS59rNmS3XBWLdGkZCbLRz9tO2ZAD2bCzRw31rxm';

async function exchangeToken() {
  console.log('🔄 1. Exchanging for long-lived User Access Token...');
  const exchangeUrl = `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${SHORT_LIVED_USER_TOKEN}`;
  
  const exchangeRes = await fetch(exchangeUrl);
  const exchangeData = await exchangeRes.json();

  if (exchangeData.error) {
    console.error('❌ Error during exchange:', exchangeData.error);
    return;
  }

  const longLivedUserToken = exchangeData.access_token;
  console.log('✅ Long-lived User Token generated successfully.');

  console.log('🔄 2. Fetching accounts to get permanent Page Access Token...');
  const accountsUrl = `https://graph.facebook.com/v20.0/me/accounts?access_token=${longLivedUserToken}&limit=100`;
  const accountsRes = await fetch(accountsUrl);
  const accountsData = await accountsRes.json();

  if (accountsData.error) {
    console.error('❌ Error fetching accounts:', accountsData.error);
    return;
  }

  const page = accountsData.data.find(p => p.id === PAGE_ID);
  if (!page) {
    console.error(`❌ Page with ID ${PAGE_ID} not found in the list! Available pages:`, accountsData.data.map(p => `${p.name} (${p.id})`));
    return;
  }

  console.log(`\n🎉 🎉 🎉 SUCCESS! 🎉 🎉 🎉`);
  console.log(`Page Name: ${page.name}`);
  console.log(`Page ID: ${page.id}`);
  console.log(`\nPERMANENT PAGE ACCESS TOKEN:\n${page.access_token}\n`);
}

exchangeToken();
