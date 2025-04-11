// backendJS/controllers/femaController.js
const fetch = require('node-fetch');

async function getFemaHazards(req, res) {
  try {
    const { location } = req.query;
    if (!location) {
      return res
        .status(400)
        .json({ detail: 'Query param "location" is required' });
    }

    // 判断用户输入是否包含逗号
    let state = location.trim().toUpperCase();
    let city = null;

    if (location.includes(',')) {
      const parts = location.split(',').map((p) => p.trim());
      // 假设逗号前是城市，后是州
      if (parts.length >= 2) {
        city = parts[0];
        state = parts[1].toUpperCase();
      }
    }

    // 构造 FEMA API url
    // 只用 state eq 'XX' 进行初步过滤
    const femaUrl = `https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries?$filter=state%20eq%20'${state}'&$format=json`;

    const response = await fetch(femaUrl);
    if (!response.ok) {
      return res.status(500).json({
        detail: 'Failed to fetch from FEMA API',
        status: response.status,
      });
    }

    const jsonData = await response.json();
    // FEMA 返回对象中一般包含一个 "DisasterDeclarationsSummaries" 数组
    const records = jsonData.DisasterDeclarationsSummaries || [];

    // 如果用户输入 city，则再进一步在本地过滤
    let filtered = records;
    if (city) {
      // 简单模糊匹配 declaredCountyArea 包含 city
      const cityLower = city.toLowerCase();
      filtered = records.filter((r) =>
        r.declaredCountyArea?.toLowerCase().includes(cityLower)
      );
    }

    // 从 filtered 中汇总 incidentType 去重
    const incidentTypes = new Set();
    filtered.forEach((item) => {
      if (item.incidentType) {
        incidentTypes.add(item.incidentType);
      }
    });

    // 转成数组
    const hazards = Array.from(incidentTypes);

    res.json({ hazards });
  } catch (err) {
    console.error('Error in getFemaHazards:', err);
    res.status(500).json({ detail: 'Internal server error' });
  }
}

module.exports = {
  getFemaHazards,
};
