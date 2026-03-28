google-ads.js/**
 * GOOGLE ADS API INTEGRATION
 * Traffic Masters Squad — Agencia316/aiox-core
 *
 * Conecta à Google Ads API e busca métricas de campanhas
 * para análise pelo Claude Code com os agentes do Traffic Masters Squad.
 *
 * SETUP:
 * 1. Acesse console.cloud.google.com e crie um projeto
 * 2. Ative a Google Ads API
 * 3. Crie credenciais OAuth2 (Client ID + Client Secret)
 * 4. Gere um Refresh Token usando OAuth2 Playground
 * 5. Obtenha o Developer Token em ads.google.com > Tools > API Center
 * 6. Copie o Customer ID (sem traços) do Google Ads
 * 7. Preencha o arquivo .env com as variáveis abaixo
 *
 * USO: node integrations/google-ads.js
 */

require('dotenv').config();
const https = require('https');
const fs = require('fs');

// ─── CONFIGURAÇÃO ────────────────────────────────────────────────────────────
const CONFIG = {
  developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
  clientId: process.env.GOOGLE_ADS_CLIENT_ID,
  clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET,
  refreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN,
  customerId: process.env.GOOGLE_ADS_CUSTOMER_ID, // sem traços: 1234567890
  managerCustomerId: process.env.GOOGLE_ADS_MANAGER_ID, // MCC/BM ID (opcional)
  dateRange: {
    since: process.env.GOOGLE_DATE_SINCE || getDateDaysAgo(30),
    until: process.env.GOOGLE_DATE_UNTIL || getDateDaysAgo(0),
  },
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getDateDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

// Obtém Access Token usando Refresh Token
function getAccessToken() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      client_id: CONFIG.clientId,
      client_secret: CONFIG.clientSecret,
      refresh_token: CONFIG.refreshToken,
      grant_type: 'refresh_token',
    });

    const options = {
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.access_token) {
            resolve(parsed.access_token);
          } else {
            reject(new Error(`Token error: ${JSON.stringify(parsed)}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Executa query GAQL (Google Ads Query Language)
function googleAdsQuery(accessToken, query) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query });
    const customerId = CONFIG.customerId.replace(/-/g, '');

    const headers = {
      'Content-Type': 'application/json',
      'developer-token': CONFIG.developerToken,
      Authorization: `Bearer ${accessToken}`,
    };

    if (CONFIG.managerCustomerId) {
      headers['login-customer-id'] = CONFIG.managerCustomerId.replace(/-/g, '');
    }

    const options = {
      hostname: 'googleads.googleapis.com',
      path: `/v16/customers/${customerId}/googleAds:searchStream`,
      method: 'POST',
      headers: {
        ...headers,
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const lines = data.trim().split('\n').filter(Boolean);
          const results = [];
          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.results) results.push(...parsed.results);
            } catch (_) {}
          }
          resolve(results);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// ─── QUERIES PRINCIPAIS ───────────────────────────────────────────────────────

async function getAccountOverview(accessToken) {
  const query = `
    SELECT
      customer.id,
      customer.descriptive_name,
      customer.currency_code,
      customer.time_zone,
      customer.status
    FROM customer
    LIMIT 1
  `;
  const results = await googleAdsQuery(accessToken, query);
  return results[0]?.customer || {};
}

async function getCampaignPerformance(accessToken) {
  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      campaign.bidding_strategy_type,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value,
      metrics.ctr,
      metrics.average_cpc,
      metrics.average_cpm,
      metrics.search_impression_share,
      metrics.cost_per_conversion,
      metrics.value_per_conversion
    FROM campaign
    WHERE segments.date BETWEEN '${CONFIG.dateRange.since}' AND '${CONFIG.dateRange.until}'
      AND campaign.status != 'REMOVED'
    ORDER BY metrics.cost_micros DESC
    LIMIT 50
  `;
  return await googleAdsQuery(accessToken, query);
}

async function getKeywordPerformance(accessToken) {
  const query = `
    SELECT
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      ad_group.name,
      campaign.name,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.ctr,
      metrics.average_cpc,
      metrics.quality_score
    FROM keyword_view
    WHERE segments.date BETWEEN '${CONFIG.dateRange.since}' AND '${CONFIG.dateRange.until}'
      AND campaign.status != 'REMOVED'
      AND ad_group.status != 'REMOVED'
      AND ad_group_criterion.status != 'REMOVED'
    ORDER BY metrics.cost_micros DESC
    LIMIT 30
  `;
  return await googleAdsQuery(accessToken, query);
}

async function getAccountSummary(accessToken) {
  const query = `
    SELECT
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value,
      metrics.ctr,
      metrics.average_cpc,
      metrics.average_cpm,
      metrics.cost_per_conversion,
      metrics.value_per_conversion,
      metrics.search_impression_share
    FROM customer
    WHERE segments.date BETWEEN '${CONFIG.dateRange.since}' AND '${CONFIG.dateRange.until}'
  `;
  const results = await googleAdsQuery(accessToken, query);
  return results[0]?.metrics || {};
}

// ─── FORMATAÇÃO ───────────────────────────────────────────────────────────────
function microsToCurrency(micros) {
  return (micros / 1_000_000).toFixed(2);
}

function formatForClaude(account, summary, campaigns, keywords) {
  const totalCost = microsToCurrency(summary.costMicros || 0);

  const report = {
    generated_at: new Date().toISOString(),
    period: CONFIG.dateRange,
    platform: 'Google Ads',
    account: {
      id: account.id,
      name: account.descriptiveName,
      currency: account.currencyCode,
      timezone: account.timeZone,
    },
    summary_for_analysis: {
      total_spend: totalCost,
      total_impressions: summary.impressions || '0',
      total_clicks: summary.clicks || '0',
      total_conversions: summary.conversions || '0',
      total_conversion_value: summary.conversionsValue || '0',
      average_ctr: summary.ctr || '0',
      average_cpc: microsToCurrency(summary.averageCpc || 0),
      average_cpm: microsToCurrency(summary.averageCpm || 0),
      cost_per_conversion: microsToCurrency(summary.costPerConversion || 0),
      roas: summary.conversionsValue && totalCost > 0
        ? (summary.conversionsValue / totalCost).toFixed(2)
        : 'N/A',
      search_impression_share: summary.searchImpressionShare || 'N/A',
    },
    campaign_breakdown: campaigns.map((c) => ({
      name: c.campaign?.name,
      status: c.campaign?.status,
      type: c.campaign?.advertisingChannelType,
      bidding: c.campaign?.biddingStrategyType,
      spend: microsToCurrency(c.metrics?.costMicros || 0),
      impressions: c.metrics?.impressions,
      clicks: c.metrics?.clicks,
      ctr: c.metrics?.ctr,
      avg_cpc: microsToCurrency(c.metrics?.averageCpc || 0),
      conversions: c.metrics?.conversions,
      conversion_value: c.metrics?.conversionsValue,
      cost_per_conversion: microsToCurrency(c.metrics?.costPerConversion || 0),
    })),
    top_keywords: keywords.slice(0, 20).map((k) => ({
      keyword: k.adGroupCriterion?.keyword?.text,
      match_type: k.adGroupCriterion?.keyword?.matchType,
      campaign: k.campaign?.name,
      adgroup: k.adGroup?.name,
      spend: microsToCurrency(k.metrics?.costMicros || 0),
      clicks: k.metrics?.clicks,
      impressions: k.metrics?.impressions,
      ctr: k.metrics?.ctr,
      avg_cpc: microsToCurrency(k.metrics?.averageCpc || 0),
      quality_score: k.metrics?.qualityScore,
      conversions: k.metrics?.conversions,
    })),
  };
  return report;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  const required = ['GOOGLE_ADS_DEVELOPER_TOKEN','GOOGLE_ADS_CLIENT_ID','GOOGLE_ADS_CLIENT_SECRET','GOOGLE_ADS_REFRESH_TOKEN','GOOGLE_ADS_CUSTOMER_ID'];
  const missing = required.filter((k) => !process.env[k]);

  if (missing.length > 0) {
    console.error('❌ ERRO: Variáveis de ambiente faltando no .env:');
    missing.forEach((k) => console.log(`   - ${k}`));
    console.log('\nConsulte o guia de setup no início do arquivo.');
    process.exit(1);
  }

  console.log('🔄 Autenticando com Google Ads API...');
  const accessToken = await getAccessToken();
  console.log('✅ Autenticado com sucesso!');
  console.log(`📅 Período: ${CONFIG.dateRange.since} → ${CONFIG.dateRange.until}`);
  console.log(`📊 Customer ID: ${CONFIG.customerId}\n`);

  try {
    const [account, summary, campaigns, keywords] = await Promise.all([
      getAccountOverview(accessToken),
      getAccountSummary(accessToken),
      getCampaignPerformance(accessToken),
      getKeywordPerformance(accessToken),
    ]);

    const report = formatForClaude(account, summary, campaigns, keywords);

    const outputPath = 'integrations/reports/google-ads-report.json';
    if (!fs.existsSync('integrations/reports')) {
      fs.mkdirSync('integrations/reports', { recursive: true });
    }
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

    console.log('✅ Relatório Google Ads gerado com sucesso!');
    console.log(`📁 Arquivo: ${outputPath}`);
    console.log('\n📊 RESUMO:');
    console.log(`   💰 Total Gasto: ${report.account.currency} ${report.summary_for_analysis.total_spend}`);
    console.log(`   👁️  Impressões: ${report.summary_for_analysis.total_impressions}`);
    console.log(`   🖱️  Cliques: ${report.summary_for_analysis.total_clicks}`);
    console.log(`   🎯 Conversões: ${report.summary_for_analysis.total_conversions}`);
    console.log(`   📈 CTR: ${report.summary_for_analysis.average_ctr}`);
    console.log(`   💵 CPC Médio: ${report.summary_for_analysis.average_cpc}`);
    console.log(`   📊 ROAS: ${report.summary_for_analysis.roas}`);
    console.log(`   🔍 Campanhas: ${report.campaign_breakdown.length}`);
    console.log('\n🤖 Agora rode no Claude Code:');
    console.log('   @kasim-aslam *analyze-performance');
    console.log('   ou');
    console.log('   @performance-analyst *analyze-data');

  } catch (error) {
    console.error('❌ Erro ao buscar dados do Google Ads:', error.message);
  }
}

main();
