// backendJS/controllers/femaController.js

import fetch from 'node-fetch';
/**
 * GET /workflow/hazards?mode=xxx&location=...
 *  - mode = "state" or "county"
 *  - location: 如果mode=state, 则 'MA' / 'WA';
 *              如果mode=county, 则 'King, WA'
 */
export async function getFemaHazards(req, res) {
  try {
    const { mode, location } = req.query;
    if (!mode || !location) {
      return res
        .status(400)
        .json({ detail: 'Query params "mode" and "location" are required' });
    }

    // 组装 FEMA API URL
    // 注意 $filter=... & $top=1000
    // state eq 'XX' 这部分是最基础的筛选
    let stateOnly = location.trim().toUpperCase();
    let county = null;

    if (mode === 'state') {
      // 例如 "WA"
      // 直接用 stateOnly
    } else if (mode === 'county') {
      // "King, WA" => county="King", stateOnly="WA"
      const parts = location.split(',').map((p) => p.trim());
      if (parts.length >= 2) {
        county = parts[0].toUpperCase();
        stateOnly = parts[1].toUpperCase();
      } else {
        return res.status(400).json({
          detail:
            'Invalid county+state format. Must be something like "King, WA"',
        });
      }
    } else {
      return res
        .status(400)
        .json({ detail: 'mode must be either "state" or "county".' });
    }

    // 先按州过滤
    const femaUrl = `https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries?$filter=state%20eq%20'${stateOnly}'&$top=1000&$format=json`;

    const response = await fetch(femaUrl);
    if (!response.ok) {
      return res.status(500).json({
        detail: 'Failed to fetch from FEMA API',
        status: response.status,
      });
    }

    const jsonData = await response.json();
    const allRecords = jsonData.DisasterDeclarationsSummaries || [];

    // 如果是 county 模式，再在本地过滤 designatedArea
    let filtered = allRecords;
    if (county) {
      filtered = allRecords.filter((r) =>
        (r.designatedArea || '').toUpperCase().includes(county)
      );
    }

    // 将结果做一个简化映射
    // 同时保留 incidentType, title, incidentBeginDate, incidentEndDate 等
    const result = filtered.map((item) => ({
      incidentType: item.incidentType || '',
      title: item.title || '',
      designatedArea: item.designatedArea || '',
      incidentBeginDate: item.incidentBeginDate || '',
      incidentEndDate: item.incidentEndDate || '',
      disasterNumber: item.disasterNumber || null,
    }));

    res.json({ records: result });
  } catch (err) {
    console.error('Error in getFemaHazards:', err);
    res.status(500).json({ detail: 'Internal server error' });
  }
}
